import { db } from '@/db';
import { sources, sourceChunks } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import { extractText } from 'unpdf';
import { STORAGE_LIMITS } from '@/config/limits';

export interface PageText {
  pageNumber?: number;
  text: string;
}

export interface ChunkResult {
  chunkIndex: number;
  content: string;
  pageNumber?: number;
  tokenCount: number;
}

// 1. Clean Text Utility
export function cleanText(input: string): string {
  if (!input) return '';
  return input
    .replace(/\0/g, '') // remove null bytes
    .replace(/\r\n/g, '\n') // normalize newlines
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ') // collapse horizontal spaces
    .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines
    .trim();
}

// 2. Token Count Estimator (~4 chars per token average in English)
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// 3. Chunking Algorithm: Target ~800 tokens with ~100 tokens overlap
export function chunkPages(
  pages: PageText[],
  targetTokens = STORAGE_LIMITS.CHUNK_TARGET_TOKENS,
  overlapTokens = STORAGE_LIMITS.CHUNK_OVERLAP_TOKENS
): ChunkResult[] {
  const chunks: ChunkResult[] = [];
  const targetChars = targetTokens * 4;
  const overlapChars = overlapTokens * 4;

  let chunkIndex = 0;

  for (const page of pages) {
    const cleaned = cleanText(page.text);
    if (!cleaned) continue;

    // If page fits comfortably in a single chunk
    if (cleaned.length <= targetChars + overlapChars) {
      chunks.push({
        chunkIndex: chunkIndex++,
        content: cleaned,
        pageNumber: page.pageNumber,
        tokenCount: estimateTokens(cleaned),
      });
      continue;
    }

    // Split page into paragraphs
    const paragraphs = cleaned.split('\n\n');
    let currentChunkText = '';
    let currentChunkTokens = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i].trim();
      if (!para) continue;

      const paraTokens = estimateTokens(para);

      if (currentChunkTokens + paraTokens > targetTokens && currentChunkText.length > 0) {
        chunks.push({
          chunkIndex: chunkIndex++,
          content: currentChunkText.trim(),
          pageNumber: page.pageNumber,
          tokenCount: currentChunkTokens,
        });

        // Compute overlap from end of current chunk
        const words = currentChunkText.trim().split(/\s+/);
        const overlapWords = words.slice(-Math.min(words.length, Math.round(overlapTokens * 0.75)));
        currentChunkText = overlapWords.join(' ') + '\n\n' + para;
        currentChunkTokens = estimateTokens(currentChunkText);
      } else {
        currentChunkText = currentChunkText
          ? `${currentChunkText}\n\n${para}`
          : para;
        currentChunkTokens += paraTokens;
      }
    }

    if (currentChunkText.trim()) {
      chunks.push({
        chunkIndex: chunkIndex++,
        content: currentChunkText.trim(),
        pageNumber: page.pageNumber,
        tokenCount: estimateTokens(currentChunkText.trim()),
      });
    }
  }

  return chunks;
}

// 4. Parsers for different file types
export async function parsePdf(buffer: Buffer): Promise<PageText[]> {
  try {
    const { text } = await extractText(buffer, { mergePages: false });
    if (Array.isArray(text)) {
      return text.map((pageStr, idx) => ({
        pageNumber: idx + 1,
        text: pageStr || '',
      }));
    }
    return [{ pageNumber: 1, text: typeof text === 'string' ? text : '' }];
  } catch (err: any) {
    throw new Error(`PDF extraction failed: ${err.message || 'Corrupt or password-protected PDF'}`);
  }
}

export async function parseDocx(buffer: Buffer): Promise<PageText[]> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return [{ pageNumber: 1, text: result.value || '' }];
  } catch (err: any) {
    throw new Error(`DOCX extraction failed: ${err.message || 'Invalid Word document'}`);
  }
}

// SSRF Protection: Blocks private, local, and metadata endpoints
export function validateSafeUrl(urlString: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP and HTTPS URLs are permitted.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and internal names
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('Access to private or local networks is forbidden.');
  }

  // Check IPv4 ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [_, o1, o2, o3, o4] = ipv4Match.map(Number);
    if ([o1, o2, o3, o4].some((o) => o < 0 || o > 255)) {
      throw new Error('Malformed IP address in URL.');
    }

    // 127.0.0.0/8 (Loopback)
    if (o1 === 127) throw new Error('Access to loopback IP addresses is forbidden.');
    // 10.0.0.0/8 (Private)
    if (o1 === 10) throw new Error('Access to private IP addresses (10.0.0.0/8) is forbidden.');
    // 172.16.0.0/12 (Private)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) throw new Error('Access to private IP addresses (172.16.0.0/12) is forbidden.');
    // 192.168.0.0/16 (Private)
    if (o1 === 192 && o2 === 168) throw new Error('Access to private IP addresses (192.168.0.0/16) is forbidden.');
    // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
    if (o1 === 169 && o2 === 254) throw new Error('Access to cloud metadata or link-local IP addresses is forbidden.');
    // 0.0.0.0/8 (Broadcast/Current network)
    if (o1 === 0) throw new Error('Access to 0.0.0.0/8 range is forbidden.');
  }

  return parsed;
}

export async function parseUrl(targetUrl: string): Promise<{ title: string; text: string }> {
  try {
    const safeUrl = validateSafeUrl(targetUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(safeUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LearningPartnerBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Failed to fetch web page`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Strip irrelevant elements
    $('script, style, nav, footer, header, aside, iframe, noscript, svg, form').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim() || targetUrl;

    // Extract main readable content
    let contentEl = $('article');
    if (!contentEl.length) contentEl = $('main');
    if (!contentEl.length) contentEl = $('[role="main"]');
    if (!contentEl.length) contentEl = $('body');

    const rawText = contentEl.text();
    const cleaned = cleanText(rawText);

    if (cleaned.length < 50) {
      throw new Error('Web page returned insufficient readable article content.');
    }

    return { title, text: cleaned };
  } catch (err: any) {
    throw new Error(`Web page extraction failed: ${err.message || 'Could not reach URL'}`);
  }
}

// 5. Ingestion Pipeline Execution with Status Tracking
export async function processSourceIngestion(
  sourceId: string,
  options: {
    buffer?: Buffer;
    rawText?: string;
    url?: string;
  }
) {
  try {
    // 1. Set status to processing
    await db
      .update(sources)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(sources.id, sourceId));

    // 2. Fetch source details
    const [sourceRecord] = await db
      .select()
      .from(sources)
      .where(eq(sources.id, sourceId));

    if (!sourceRecord) {
      throw new Error(`Source with id ${sourceId} not found.`);
    }

    let pages: PageText[] = [];

    // 3. Extract text based on type
    if (sourceRecord.type === 'pdf') {
      if (!options.buffer) throw new Error('Missing file buffer for PDF parsing.');
      pages = await parsePdf(options.buffer);
    } else if (sourceRecord.type === 'docx') {
      if (!options.buffer) throw new Error('Missing file buffer for DOCX parsing.');
      pages = await parseDocx(options.buffer);
    } else if (sourceRecord.type === 'url') {
      const targetUrl = options.url || sourceRecord.originalUrl;
      if (!targetUrl) throw new Error('Missing URL for web page parsing.');
      const parsed = await parseUrl(targetUrl);
      pages = [{ pageNumber: 1, text: parsed.text }];
    } else if (sourceRecord.type === 'txt' || sourceRecord.type === 'md' || sourceRecord.type === 'text') {
      const textContent = options.rawText || (options.buffer ? options.buffer.toString('utf-8') : '');
      pages = [{ pageNumber: 1, text: cleanText(textContent) }];
    }

    const fullExtractedText = pages.map((p) => p.text).join('\n\n').trim();
    const wordCount = fullExtractedText ? fullExtractedText.split(/\s+/).length : 0;

    if (!fullExtractedText) {
      throw new Error('No readable text could be extracted from this source.');
    }

    // 4. Chunk into ~800 tokens with ~100 token overlap
    const chunks = chunkPages(pages);

    // 5. Delete any pre-existing chunks for retry consistency
    await db.delete(sourceChunks).where(eq(sourceChunks.sourceId, sourceId));

    // 6. Insert chunks into source_chunks with tsvector search indexing
    if (chunks.length > 0) {
      for (const chunk of chunks) {
        await db.insert(sourceChunks).values({
          sourceId,
          notebookId: sourceRecord.notebookId,
          userId: sourceRecord.userId,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          pageNumber: chunk.pageNumber ?? null,
          tokenCount: chunk.tokenCount,
          searchVector: sql`to_tsvector('english', ${chunk.content})`,
        });
      }
    }

    // 7. Update source to ready
    await db
      .update(sources)
      .set({
        status: 'ready',
        extractedText: fullExtractedText,
        wordCount,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(sources.id, sourceId));

    return { success: true, chunksCount: chunks.length, wordCount };
  } catch (err: any) {
    // On failure set status failed with human-readable errorMessage
    const message = err?.message || 'Ingestion pipeline encountered an unexpected failure.';
    await db
      .update(sources)
      .set({
        status: 'failed',
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(sources.id, sourceId));

    return { success: false, error: message };
  }
}
