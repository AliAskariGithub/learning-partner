import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/session';
import { db } from '@/db';
import { notebooks, sources } from '@/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { getStorageAdapter } from '@/lib/storage';
import { processSourceIngestion } from '@/lib/ingestion';
import { STORAGE_LIMITS } from '@/config/limits';

export const instant = false;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: notebookId } = await params;

    const notebookSources = await db
      .select()
      .from(sources)
      .where(and(eq(sources.notebookId, notebookId), eq(sources.userId, user.id)))
      .orderBy(sources.createdAt);

    return NextResponse.json({ sources: notebookSources });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error fetching sources' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id: notebookId } = await params;

    // 1. Verify notebook exists and belongs to user
    const [notebook] = await db
      .select()
      .from(notebooks)
      .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, user.id)));

    if (!notebook) {
      return NextResponse.json({ error: 'Notebook not found.' }, { status: 404 });
    }

    // 2. Enforce max sources quota
    const [sourcesCountResult] = await db
      .select({ count: count() })
      .from(sources)
      .where(eq(sources.notebookId, notebookId));

    if ((sourcesCountResult?.count || 0) >= STORAGE_LIMITS.MAX_SOURCES_PER_NOTEBOOK) {
      return NextResponse.json(
        {
          error: `Notebook source limit reached (max ${STORAGE_LIMITS.MAX_SOURCES_PER_NOTEBOOK} sources per notebook).`,
        },
        { status: 400 }
      );
    }

    const contentType = req.headers.get('content-type') || '';

    // A) File Upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file was provided.' }, { status: 400 });
      }

      // Validate file size limit (25 MB)
      if (file.size > STORAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          {
            error: `File exceeds maximum allowed size of ${STORAGE_LIMITS.MAX_FILE_SIZE_MB}MB.`,
          },
          { status: 400 }
        );
      }

      const originalName = file.name;
      const extension = '.' + originalName.split('.').pop()?.toLowerCase();

      if (!STORAGE_LIMITS.ALLOWED_FILE_EXTENSIONS.includes(extension as any)) {
        return NextResponse.json(
          {
            error: `Unsupported file type. Allowed formats: ${STORAGE_LIMITS.ALLOWED_FILE_EXTENSIONS.join(
              ', '
            )}`,
          },
          { status: 400 }
        );
      }

      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const storage = getStorageAdapter();
      const uploadResult = await storage.upload(fileBuffer, originalName, file.type);

      const sourceType =
        extension === '.pdf'
          ? 'pdf'
          : extension === '.docx'
          ? 'docx'
          : extension === '.md'
          ? 'md'
          : 'txt';

      const [newSource] = await db
        .insert(sources)
        .values({
          notebookId,
          userId: user.id,
          type: sourceType,
          title: originalName,
          storageKey: uploadResult.storageKey,
          status: 'processing',
          enabled: true,
        })
        .returning();

      // Trigger server-side background ingestion (non-blocking)
      processSourceIngestion(newSource.id, { buffer: fileBuffer }).catch((err) => {
        console.error(`Background ingestion failed for source ${newSource.id}:`, err);
      });

      return NextResponse.json({ source: newSource }, { status: 201 });
    }

    // B) JSON Payload (URL or Pasted Text)
    const body = await req.json();

    if (body.type === 'url') {
      const targetUrl = (body.url as string)?.trim();
      if (!targetUrl) {
        return NextResponse.json({ error: 'Valid URL is required.' }, { status: 400 });
      }

      const title = (body.title as string)?.trim() || targetUrl;

      const [newSource] = await db
        .insert(sources)
        .values({
          notebookId,
          userId: user.id,
          type: 'url',
          title,
          originalUrl: targetUrl,
          status: 'processing',
          enabled: true,
        })
        .returning();

      // Trigger background ingestion for URL
      processSourceIngestion(newSource.id, { url: targetUrl }).catch((err) => {
        console.error(`Background URL ingestion failed for source ${newSource.id}:`, err);
      });

      return NextResponse.json({ source: newSource }, { status: 201 });
    }

    if (body.type === 'text') {
      const textContent = (body.content as string)?.trim();
      if (!textContent) {
        return NextResponse.json({ error: 'Text content is required.' }, { status: 400 });
      }

      const title = (body.title as string)?.trim() || 'Pasted Study Notes';

      const [newSource] = await db
        .insert(sources)
        .values({
          notebookId,
          userId: user.id,
          type: 'text',
          title,
          status: 'processing',
          enabled: true,
        })
        .returning();

      // Trigger background ingestion for pasted text
      processSourceIngestion(newSource.id, { rawText: textContent }).catch((err) => {
        console.error(`Background text ingestion failed for source ${newSource.id}:`, err);
      });

      return NextResponse.json({ source: newSource }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid source type specified.' }, { status: 400 });
  } catch (err: any) {
    console.error('Error adding source:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error while processing source.' },
      { status: 500 }
    );
  }
}
