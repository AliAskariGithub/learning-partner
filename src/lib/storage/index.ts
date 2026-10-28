import { put, del } from '@vercel/blob';
import fs from 'fs/promises';
import path from 'path';

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

// 2. Local Disk Storage Adapter (Dev & offline fallback)
export class LocalDiskStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), '.storage', 'uploads');
  }

  private async ensureDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch {
      // directory already exists
    }
  }

  async upload(file: Buffer | Uint8Array, filename: string, mimeType: string): Promise<StorageUploadResult> {
    await this.ensureDir();
    const sanitized = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(this.uploadDir, sanitized);

    await fs.writeFile(filePath, file);

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
    try {
      const filePath = path.join(this.uploadDir, storageKey);
      await fs.unlink(filePath);
    } catch {
      // File may already be removed
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
