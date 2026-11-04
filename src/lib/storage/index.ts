import { put, del } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { neon } from '@neondatabase/serverless';

export interface StorageUploadResult {
  storageKey: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface StorageAdapter {
  upload(file: Buffer | Uint8Array, filename: string, mimeType: string): Promise<StorageUploadResult>;
  getUrl(storageKey: string): Promise<string>;
  get(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

// 1. Vercel Blob Storage Adapter (Production standard)
export class VercelBlobStorageAdapter implements StorageAdapter {
  private hasToken: boolean;

  constructor() {
    this.hasToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  }

  async upload(file: Buffer | Uint8Array, filename: string, mimeType: string): Promise<StorageUploadResult> {
    if (!this.hasToken) {
      // Graceful fallback to Local File Storage adapter if BLOB_READ_WRITE_TOKEN is not supplied in dev
      const localAdapter = new LocalDiskStorageAdapter();
      return localAdapter.upload(file, filename, mimeType);
    }

    const uniquePath = `sources/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);
    const blob = await put(uniquePath, buffer, {
      access: 'public',
      contentType: mimeType,
    });

    return {
      storageKey: blob.pathname,
      url: blob.url,
      size: buffer.byteLength,
      mimeType,
    };
  }

  async getUrl(storageKey: string): Promise<string> {
    if (!this.hasToken) {
      const localAdapter = new LocalDiskStorageAdapter();
      return localAdapter.getUrl(storageKey);
    }
    return `https://${process.env.BLOB_READ_WRITE_TOKEN?.split('_')[0] || ''}.public.blob.vercel-storage.com/${storageKey}`;
  }

  async get(storageKey: string): Promise<Buffer> {
    if (!this.hasToken) {
      const localAdapter = new LocalDiskStorageAdapter();
      return localAdapter.get(storageKey);
    }
    const url = await this.getUrl(storageKey);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch file from blob storage: ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async delete(storageKey: string): Promise<void> {
    if (!this.hasToken) {
      const localAdapter = new LocalDiskStorageAdapter();
      return localAdapter.delete(storageKey);
    }
    await del(storageKey);
  }
}

// 2. Local Disk Storage Adapter (Dev & offline fallback with resilient multi-directory support)
export class LocalDiskStorageAdapter implements StorageAdapter {
  private primaryUploadDir: string;
  private fallbackUploadDir: string;

  constructor() {
    this.primaryUploadDir = path.resolve(process.cwd(), '.storage', 'uploads');
    this.fallbackUploadDir = path.resolve(os.tmpdir(), 'learningpartner', 'uploads');
  }

  private async getWritableDir(): Promise<string> {
    try {
      await fs.mkdir(this.primaryUploadDir, { recursive: true });
      return this.primaryUploadDir;
    } catch {
      try {
        await fs.mkdir(this.fallbackUploadDir, { recursive: true });
        return this.fallbackUploadDir;
      } catch {
        return this.primaryUploadDir;
      }
    }
  }

  async upload(file: Buffer | Uint8Array, filename: string, mimeType: string): Promise<StorageUploadResult> {
    const uploadDir = await this.getWritableDir();
    const sanitized = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.resolve(uploadDir, sanitized);
    const buffer = Buffer.isBuffer(file) ? file : Buffer.from(file);

    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, buffer);
    } catch {
      // Secondary fallback to OS tmp directory if primary path fails
      try {
        const fallbackPath = path.resolve(this.fallbackUploadDir, sanitized);
        await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
        await fs.writeFile(fallbackPath, buffer);
      } catch {
        // Disk write failed, database will hold persistent file
      }
    }

    // Persist to Neon Postgres so all serverless instances on Vercel deployment can serve it
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        const base64Data = buffer.toString('base64');
        await sql.query(
          `INSERT INTO storage_files ("key", mime_type, data, size)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT ("key") DO UPDATE SET data = $3, mime_type = $2, size = $4`,
          [sanitized, mimeType, base64Data, buffer.byteLength]
        );
      } catch (dbErr) {
        console.warn('[StorageAdapter] Failed to persist file to database:', dbErr);
      }
    }

    return {
      storageKey: sanitized,
      url: `/api/storage/${sanitized}`,
      size: buffer.byteLength,
      mimeType,
    };
  }

  async getUrl(storageKey: string): Promise<string> {
    return `/api/storage/${path.basename(storageKey)}`;
  }

  async get(storageKey: string): Promise<Buffer> {
    const filename = path.basename(storageKey);
    const candidatePaths = [
      path.resolve(this.primaryUploadDir, filename),
      path.resolve(this.fallbackUploadDir, filename),
      path.resolve(this.primaryUploadDir, storageKey),
      path.resolve(this.fallbackUploadDir, storageKey),
    ];
    for (const p of candidatePaths) {
      try {
        const data = await fs.readFile(p);
        return data;
      } catch {
        // try next candidate path
      }
    }

    // Fallback: Query persistent database storage (essential for Vercel Serverless)
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        const rows = await sql.query(
          `SELECT data FROM storage_files WHERE "key" = $1 OR "key" = $2 LIMIT 1`,
          [storageKey, filename]
        );
        if (rows && rows.length > 0 && rows[0].data) {
          return Buffer.from(rows[0].data, 'base64');
        }
      } catch (dbErr) {
        console.warn('[StorageAdapter] Database read fallback error:', dbErr);
      }
    }

    throw new Error(`File not found: ${storageKey}`);
  }

  async delete(storageKey: string): Promise<void> {
    const filename = path.basename(storageKey);
    const paths = [
      path.resolve(this.primaryUploadDir, storageKey),
      path.resolve(this.fallbackUploadDir, storageKey),
      path.resolve(this.primaryUploadDir, filename),
      path.resolve(this.fallbackUploadDir, filename),
    ];
    for (const p of paths) {
      try {
        await fs.unlink(p);
      } catch {
        // File may already be removed
      }
    }

    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        await sql.query(
          `DELETE FROM storage_files WHERE "key" = $1 OR "key" = $2`,
          [storageKey, filename]
        );
      } catch (dbErr) {
        console.warn('[StorageAdapter] Database delete error:', dbErr);
      }
    }
  }
}

// Swappable Factory
let currentAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!currentAdapter) {
    currentAdapter = new VercelBlobStorageAdapter();
  }
  return currentAdapter;
}
