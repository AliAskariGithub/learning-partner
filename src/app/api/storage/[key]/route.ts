import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const { key } = await params;
    if (!key || key.includes('..') || key.includes('/') || key.includes('\\')) {
      return NextResponse.json({ error: 'Invalid storage key.' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), '.storage', 'uploads');
    const filePath = path.join(uploadDir, key);

    try {
      const fileBuffer = await fs.readFile(filePath);
      
      let contentType = 'application/octet-stream';
      if (key.endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (key.endsWith('.wav')) contentType = 'audio/wav';
      else if (key.endsWith('.pdf')) contentType = 'application/pdf';
      else if (key.endsWith('.json')) contentType = 'application/json';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    } catch {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
