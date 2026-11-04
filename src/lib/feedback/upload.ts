'use server';

import { getStorageAdapter } from '@/lib/storage';
import { validateAndSanitizeImage } from '@/lib/security/image';
import { hashIpAddress } from '@/lib/security/spam';
import { headers } from 'next/headers';

const MAX_SCREENSHOT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB max for bug screenshots

export interface ScreenshotUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadFeedbackScreenshot(
  formData: FormData
): Promise<ScreenshotUploadResult> {
  try {
    const file = formData.get('screenshot') as File | null;
    if (!file || !(file instanceof File)) {
      return { success: false, error: 'No screenshot file provided.' };
    }

    if (file.size > MAX_SCREENSHOT_SIZE_BYTES) {
      return { success: false, error: 'Screenshot exceeds the 5MB size limit.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate magic bytes & strip EXIF metadata
    const validation = validateAndSanitizeImage(buffer, file.type);
    if (!validation.valid || !validation.mimeType) {
      return { success: false, error: validation.error || 'Invalid image format. Only PNG, JPEG, and WebP are accepted.' };
    }

    const cleanBuffer = validation.sanitizedBuffer || buffer;
    const extension = validation.mimeType === 'image/png' ? '.png' : validation.mimeType === 'image/webp' ? '.webp' : '.jpg';
    const filename = `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;

    const storage = getStorageAdapter();
    const uploaded = await storage.upload(cleanBuffer, filename, validation.mimeType);

    return {
      success: true,
      url: uploaded.url,
    };
  } catch (err: any) {
    console.error('[uploadFeedbackScreenshot] Error:', err);
    return { success: false, error: err.message || 'Failed to upload screenshot.' };
  }
}

