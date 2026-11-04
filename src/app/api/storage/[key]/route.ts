import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { neon } from '@neondatabase/serverless';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    if (!key || key.includes('..') || key.includes('/') || key.includes('\\')) {
      return NextResponse.json({ error: 'Invalid storage key.' }, { status: 400 });
    }

    const isAudioKey =
      key.endsWith('.mp3') ||
      key.endsWith('.wav') ||
      key.includes('voice-turn-') ||
      key.includes('voice-full-');

    const session = await getSession();
    // Allow high-entropy media playback even if browser audio tag omits cookies
    if (!session?.user && !isAudioKey) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    let contentType = 'application/octet-stream';
    if (key.endsWith('.mp3')) contentType = 'audio/mpeg';
    else if (key.endsWith('.wav')) contentType = 'audio/wav';
    else if (key.endsWith('.pdf')) contentType = 'application/pdf';
    else if (key.endsWith('.json')) contentType = 'application/json';
    else if (key.endsWith('.png')) contentType = 'image/png';
    else if (key.endsWith('.jpg') || key.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (key.endsWith('.webp')) contentType = 'image/webp';

    const primaryUploadDir = path.resolve(process.cwd(), '.storage', 'uploads');
    const fallbackUploadDir = path.resolve(os.tmpdir(), 'learningpartner', 'uploads');

    const candidatePaths = [
      path.resolve(primaryUploadDir, key),
      path.resolve(fallbackUploadDir, key),
    ];

    let fileBuffer: Buffer | null = null;
    for (const p of candidatePaths) {
      try {
        fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ p);
        break;
      } catch {
        // try next candidate path
      }
    }

    // Serverless fallback: Read from persistent Neon Postgres database
    if (!fileBuffer && process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        const rows = await sql.query(
          `SELECT mime_type, data FROM storage_files WHERE "key" = $1 LIMIT 1`,
          [key]
        );
        if (rows && rows.length > 0 && rows[0].data) {
          fileBuffer = Buffer.from(rows[0].data, 'base64');
          if (rows[0].mime_type) {
            contentType = rows[0].mime_type;
          }
        }
      } catch (dbErr) {
        console.warn('[Storage API] Database query error:', dbErr);
      }
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': isAudioKey
          ? 'public, max-age=31536000, immutable'
          : 'private, max-age=3600',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
