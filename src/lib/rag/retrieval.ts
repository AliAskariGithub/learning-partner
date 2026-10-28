import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { Citation } from '@/db/schema';
import { getDecryptedKeyForProvider } from '@/app/app/api-key-actions';
import { generateEmbeddingVector } from '@/lib/ai/factory';
import { ProviderId } from '@/lib/ai/providers';

export interface RetrievedChunk {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  pageNumber: number | null;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  score: number;
}

export interface HybridRetrievalResult {
  chunks: RetrievedChunk[];
  citations: Citation[];
  formattedContext: string;
}

/**
 * Reciprocal Rank Fusion (RRF) to merge Full-Text Search and Vector Search results.
 */
function fuseRankings(
  ftsResults: RetrievedChunk[],
  vectorResults: RetrievedChunk[],
  k = 60
): RetrievedChunk[] {
  const scores = new Map<string, { chunk: RetrievedChunk; score: number }>();

  // Add FTS reciprocal scores
  ftsResults.forEach((chunk, rank) => {
    const rrf = 1.0 / (k + rank + 1);
    scores.set(chunk.chunkId, { chunk, score: rrf });
  });

  // Add Vector reciprocal scores
  vectorResults.forEach((chunk, rank) => {
    const rrf = 1.0 / (k + rank + 1);
    const existing = scores.get(chunk.chunkId);
    if (existing) {
      existing.score += rrf;
    } else {
      scores.set(chunk.chunkId, { chunk, score: rrf });
    }
  });

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map((item) => ({ ...item.chunk, score: item.score }));
}

/**
 * Performs hybrid retrieval over enabled sources for a notebook.
 */
export async function retrieveNotebookContext(params: {
  notebookId: string;
  userId: string;
  query: string;
  maxTokens?: number;
}): Promise<HybridRetrievalResult> {
  const { notebookId, userId, query, maxTokens = 12000 } = params;
  const cleanQuery = query.trim();

  // 1. Full-Text Search using Postgres tsvector & plainto_tsquery
  let ftsChunks: RetrievedChunk[] = [];
  try {
    const ftsRows: any = await db.execute(sql`
      SELECT 
        sc.id as "chunkId",
        sc.source_id as "sourceId",
        sc.content as "content",
        sc.page_number as "pageNumber",
        sc.chunk_index as "chunkIndex",
        sc.token_count as "tokenCount",
        s.title as "sourceTitle",
        ts_rank_cd(sc.search_vector, plainto_tsquery('english', ${cleanQuery})) as "rank"
      FROM source_chunks sc
      INNER JOIN sources s ON sc.source_id = s.id
      WHERE sc.notebook_id = ${notebookId}
        AND sc.user_id = ${userId}
        AND s.enabled = true
        AND sc.search_vector @@ plainto_tsquery('english', ${cleanQuery})
      ORDER BY "rank" DESC
      LIMIT 15;
    `);

    ftsChunks = (ftsRows.rows || ftsRows || []).map((r: any) => ({
      chunkId: String(r.chunkId),
      sourceId: String(r.sourceId),
      sourceTitle: String(r.sourceTitle),
      pageNumber: r.pageNumber ? Number(r.pageNumber) : null,
      chunkIndex: Number(r.chunkIndex),
      content: String(r.content),
      tokenCount: Number(r.tokenCount) || 100,
      score: Number(r.rank) || 0,
    }));
  } catch (err) {
    console.warn('FTS query failed, continuing with fallback:', err);
  }

  // 2. Vector Search (if user has OpenAI or Google key for embeddings)
  let vectorChunks: RetrievedChunk[] = [];
  let embeddingKey = await getDecryptedKeyForProvider(userId, 'openai');
  let providerForEmbedding: ProviderId = 'openai';

  if (!embeddingKey) {
    embeddingKey = await getDecryptedKeyForProvider(userId, 'google');
    providerForEmbedding = 'google';
  }

  if (embeddingKey) {
    try {
      const queryVec = await generateEmbeddingVector({
        provider: providerForEmbedding,
        apiKey: embeddingKey.apiKey,
        text: cleanQuery,
      });

      if (queryVec) {
        const vecStr = `[${queryVec.join(',')}]`;
        const vecRows: any = await db.execute(sql`
          SELECT 
            sc.id as "chunkId",
            sc.source_id as "sourceId",
            sc.content as "content",
            sc.page_number as "pageNumber",
            sc.chunk_index as "chunkIndex",
            sc.token_count as "tokenCount",
            s.title as "sourceTitle",
            1 - (sc.embedding <=> ${vecStr}::vector) as "similarity"
          FROM source_chunks sc
          INNER JOIN sources s ON sc.source_id = s.id
          WHERE sc.notebook_id = ${notebookId}
            AND sc.user_id = ${userId}
            AND s.enabled = true
            AND sc.embedding IS NOT NULL
          ORDER BY sc.embedding <=> ${vecStr}::vector
          LIMIT 15;
        `);

        vectorChunks = (vecRows.rows || vecRows || []).map((r: any) => ({
          chunkId: String(r.chunkId),
          sourceId: String(r.sourceId),
          sourceTitle: String(r.sourceTitle),
          pageNumber: r.pageNumber ? Number(r.pageNumber) : null,
          chunkIndex: Number(r.chunkIndex),
          content: String(r.content),
          tokenCount: Number(r.tokenCount) || 100,
          score: Number(r.similarity) || 0,
        }));
      }
    } catch (err) {
      console.warn('Vector retrieval error:', err);
    }
  }

  // 3. Merge rankings with RRF or fallback to sequential chunks if query didn't match keywords
  let fused: RetrievedChunk[] = [];
  if (ftsChunks.length > 0 || vectorChunks.length > 0) {
    fused = fuseRankings(ftsChunks, vectorChunks);
  } else {
    // Fallback: fetch starting chunks from enabled sources so context is available for broad questions
    try {
      const fallbackRows: any = await db.execute(sql`
        SELECT 
          sc.id as "chunkId",
          sc.source_id as "sourceId",
          sc.content as "content",
          sc.page_number as "pageNumber",
          sc.chunk_index as "chunkIndex",
          sc.token_count as "tokenCount",
          s.title as "sourceTitle"
        FROM source_chunks sc
        INNER JOIN sources s ON sc.source_id = s.id
        WHERE sc.notebook_id = ${notebookId}
          AND sc.user_id = ${userId}
          AND s.enabled = true
        ORDER BY s.created_at ASC, sc.chunk_index ASC
        LIMIT 10;
      `);

      fused = (fallbackRows.rows || fallbackRows || []).map((r: any, idx: number) => ({
        chunkId: String(r.chunkId),
        sourceId: String(r.sourceId),
        sourceTitle: String(r.sourceTitle),
        pageNumber: r.pageNumber ? Number(r.pageNumber) : null,
        chunkIndex: Number(r.chunkIndex),
        content: String(r.content),
        tokenCount: Number(r.tokenCount) || 100,
        score: 1 / (idx + 1),
      }));
    } catch (err) {
      console.warn('Fallback chunk fetch failed:', err);
    }
  }

  // 4. Token budget enforcement & citation mapping
  const selectedChunks: RetrievedChunk[] = [];
  const citations: Citation[] = [];
  let accumulatedTokens = 0;

  for (let i = 0; i < fused.length; i++) {
    const chunk = fused[i];
    if (accumulatedTokens + chunk.tokenCount > maxTokens) {
      break;
    }
    selectedChunks.push(chunk);
    accumulatedTokens += chunk.tokenCount;

    const citationNum = selectedChunks.length;
    citations.push({
      citationNumber: citationNum,
      chunkId: chunk.chunkId,
      sourceId: chunk.sourceId,
      sourceTitle: chunk.sourceTitle,
      pageNumber: chunk.pageNumber,
      snippet: chunk.content.slice(0, 180).trim() + (chunk.content.length > 180 ? '...' : ''),
    });
  }

  // 5. Format prompt context
  if (selectedChunks.length === 0) {
    return {
      chunks: [],
      citations: [],
      formattedContext: 'No uploaded source materials are currently active or available for this notebook.',
    };
  }

  const formattedContext = selectedChunks
    .map((c, index) => {
      const num = index + 1;
      const pageInfo = c.pageNumber ? ` (Page ${c.pageNumber})` : '';
      return `[${num}] Source: "${c.sourceTitle}"${pageInfo}\n${c.content.trim()}`;
    })
    .join('\n\n---\n\n');

  return {
    chunks: selectedChunks,
    citations,
    formattedContext,
  };
}

/**
 * Background backfill to embed existing chunks when an embedding key is available.
 */
export async function backfillChunkEmbeddings(notebookId: string, userId: string) {
  let embeddingKey = await getDecryptedKeyForProvider(userId, 'openai');
  let providerForEmbedding: ProviderId = 'openai';

  if (!embeddingKey) {
    embeddingKey = await getDecryptedKeyForProvider(userId, 'google');
    providerForEmbedding = 'google';
  }

  if (!embeddingKey) return;

  try {
    const unEmbeddedRows: any = await db.execute(sql`
      SELECT sc.id, sc.content
      FROM source_chunks sc
      INNER JOIN sources s ON sc.source_id = s.id
      WHERE sc.notebook_id = ${notebookId}
        AND sc.user_id = ${userId}
        AND sc.embedding IS NULL
      LIMIT 25;
    `);

    const chunks = unEmbeddedRows.rows || unEmbeddedRows || [];
    for (const chunk of chunks) {
      const vec = await generateEmbeddingVector({
        provider: providerForEmbedding,
        apiKey: embeddingKey.apiKey,
        text: chunk.content,
      });

      if (vec) {
        const vecStr = `[${vec.join(',')}]`;
        await db.execute(sql`
          UPDATE source_chunks
          SET embedding = ${vecStr}::vector
          WHERE id = ${chunk.id};
        `);
      }
    }
  } catch (err) {
    console.error('Background embedding backfill error:', err);
  }
}

