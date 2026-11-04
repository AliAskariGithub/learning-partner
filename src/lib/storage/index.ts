import { put, del } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface StorageUploadResult {
  storageKey: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface StorageAdapter {
  upload(file: Buffer | Uint8Array, filename: string, mimeType: string): Promise<StorageUploadResult>;
  getUrl(storageKey: string): Promise<string>;
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

    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, file);
    } catch (primaryErr) {
      // Secondary fallback to OS tmp directory if primary path fails
      const fallbackPath = path.resolve(this.fallbackUploadDir, sanitized);
      await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
      await fs.writeFile(fallbackPath, file);
    }

    return {
      storageKey: sanitized,
      url: `/api/storage/${sanitized}`,
      size: file.byteLength,
      mimeType,
    };
  }

  async getUrl(storageKey: string): Promise<string> {
    return `/api/storage/${storageKey}`;
  }

  async delete(storageKey: string): Promise<void> {
    const paths = [
      path.resolve(this.primaryUploadDir, storageKey),
      path.resolve(this.fallbackUploadDir, storageKey),
    ];
    for (const p of paths) {
      try {
        await fs.unlink(p);
      } catch {
        // File may already be removed
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
