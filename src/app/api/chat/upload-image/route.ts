import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/ratelimit';
import { validateAndSanitizeImage } from '@/lib/security/image';
import { getStorageAdapter } from '@/lib/storage';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const session = await getSession();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized. Please sign in.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const userId = session.user.id;

    // 2. Rate limit (20 image uploads / min)
    const rateLimit = checkRateLimit(userId, 20, 60000);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: `Upload rate limit reached. Please wait ${rateLimit.retryAfter}s.`,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Read form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided in request.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const rawBuffer = Buffer.from(arrayBuffer);

    // 4. Strict validation (magic bytes, dimensions, EXIF strip)
    const validation = validateAndSanitizeImage(rawBuffer, file.type);
    if (!validation.valid || !validation.sanitizedBuffer || !validation.mimeType) {
      return new Response(
        JSON.stringify({ error: validation.error || 'Invalid image file.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Store image scoped by userId
    const storage = getStorageAdapter();
    const safeFilename = `${userId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const uploadResult = await storage.upload(
      validation.sanitizedBuffer,
      safeFilename,
      validation.mimeType
    );

    return new Response(
      JSON.stringify({
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: uploadResult.url,
        storageKey: uploadResult.storageKey,
        mimeType: validation.mimeType,
        width: validation.width,
        height: validation.height,
        fileName: file.name,
        sizeBytes: validation.sanitizedBuffer.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Image upload error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Failed to process image upload.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

