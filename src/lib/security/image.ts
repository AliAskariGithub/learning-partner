import { STORAGE_LIMITS } from '@/config/limits';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: 'image/png' | 'image/jpeg' | 'image/webp';
  width?: number;
  height?: number;
  sanitizedBuffer?: Buffer;
}

/**
 * Validates an uploaded image buffer strictly by its magic bytes, dimensions, and size.
 * Rejects SVG, executable payloads, or oversized dimensions.
 * Strips EXIF / GPS metadata to prevent geolocation leakage.
 */
export function validateAndSanitizeImage(
  buffer: Buffer,
  declaredMimeType?: string
): ImageValidationResult {
  // 1. Size Check
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'Empty image buffer received.' };
  }
  if (buffer.length > STORAGE_LIMITS.IMAGE_LIMITS.MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image exceeds the maximum allowed size of ${STORAGE_LIMITS.IMAGE_LIMITS.MAX_IMAGE_SIZE_MB}MB.`,
    };
  }

  // 2. Reject SVG by signature or content
  const startStr = buffer.slice(0, 100).toString('utf8').toLowerCase();
  if (
    startStr.includes('<svg') ||
    startStr.includes('<?xml') ||
    declaredMimeType?.includes('svg')
  ) {
    return {
      valid: false,
      error: 'SVG format is not supported for vision learning. Please upload PNG, JPEG, or WebP.',
    };
  }

  // 3. Magic Bytes Detection
  let detectedMime: 'image/png' | 'image/jpeg' | 'image/webp' | null = null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    detectedMime = 'image/png';
  }
  // JPEG: FF D8 FF
  else if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    detectedMime = 'image/jpeg';
  }
  // WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  else if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    detectedMime = 'image/webp';
  }

  if (!detectedMime) {
    return {
      valid: false,
      error: 'Invalid image format. Only PNG, JPEG, and WebP images are allowed.',
    };
  }

  // 4. Extract Dimensions & Strip Metadata
  let width = 0;
  let height = 0;
  let sanitizedBuffer = buffer;

  try {
    if (detectedMime === 'image/png') {
      // PNG IHDR chunk is located at byte offset 12: 4 bytes length, 4 bytes 'IHDR', 4 bytes width, 4 bytes height
      if (buffer.length >= 24) {
        width = buffer.readUInt32BE(16);
        height = buffer.readUInt32BE(20);
      }
      sanitizedBuffer = stripPngMetadata(buffer);
    } else if (detectedMime === 'image/jpeg') {
      const dim = getJpegDimensions(buffer);
      width = dim.width;
      height = dim.height;
      sanitizedBuffer = stripJpegExif(buffer);
    } else if (detectedMime === 'image/webp') {
      const dim = getWebpDimensions(buffer);
      width = dim.width;
      height = dim.height;
    }
  } catch (err: any) {
    return {
      valid: false,
      error: `Could not parse image header: ${err?.message || 'Corrupted image file'}`,
    };
  }

  const maxDim = STORAGE_LIMITS.IMAGE_LIMITS.MAX_DIMENSION_PX;
  if (width > maxDim || height > maxDim) {
    return {
      valid: false,
      error: `Image dimensions (${width}x${height}) exceed the maximum permitted limit of ${maxDim}x${maxDim}px.`,
    };
  }

  return {
    valid: true,
    mimeType: detectedMime,
    width: width || 800,
    height: height || 600,
    sanitizedBuffer,
  };
}

/**
 * Strips APP1 (EXIF / GPS) markers from JPEG buffer.
 */
function stripJpegExif(buffer: Buffer): Buffer {
  const pieces: Buffer[] = [];
  let i = 2; // skip initial SOI 0xFFD8
  pieces.push(buffer.slice(0, 2));

  while (i < buffer.length) {
    if (buffer[i] !== 0xff) {
      pieces.push(buffer.slice(i));
      break;
    }
    const marker = buffer[i + 1];

    // Standalone markers without payload
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
      pieces.push(buffer.slice(i, i + 2));
      i += 2;
      continue;
    }

    if (i + 4 > buffer.length) {
      pieces.push(buffer.slice(i));
      break;
    }

    const length = buffer.readUInt16BE(i + 2);
    // APP1 marker 0xFFE1 holds EXIF/GPS metadata: omit it
    if (marker === 0xe1) {
      i += 2 + length;
    } else {
      pieces.push(buffer.slice(i, i + 2 + length));
      i += 2 + length;
    }
  }

  return Buffer.concat(pieces);
}

/**
 * Parses JPEG SOF markers to extract width and height.
 */
function getJpegDimensions(buffer: Buffer): { width: number; height: number } {
  let i = 2;
  while (i < buffer.length - 8) {
    if (buffer[i] === 0xff) {
      const marker = buffer[i + 1];
      // Baseline SOF0 (0xC0), Progressive SOF2 (0xC2)
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        const height = buffer.readUInt16BE(i + 5);
        const width = buffer.readUInt16BE(i + 7);
        return { width, height };
      }
      if (marker === 0xd9) break; // EOI
      if (i + 4 <= buffer.length) {
        const length = buffer.readUInt16BE(i + 2);
        i += 2 + length;
        continue;
      }
    }
    i++;
  }
  return { width: 0, height: 0 };
}

/**
 * Strips non-essential ancillary metadata chunks (tEXt, zTXt, iTXt) from PNG.
 */
function stripPngMetadata(buffer: Buffer): Buffer {
  const pieces: Buffer[] = [buffer.slice(0, 8)]; // 8-byte PNG header
  let offset = 8;

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.slice(offset + 4, offset + 8).toString('ascii');
    const totalChunkLength = 12 + length; // 4 len + 4 type + data + 4 crc

    if (offset + totalChunkLength > buffer.length) {
      pieces.push(buffer.slice(offset));
      break;
    }

    // Drop text metadata chunks
    if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
      offset += totalChunkLength;
    } else {
      pieces.push(buffer.slice(offset, offset + totalChunkLength));
      offset += totalChunkLength;
    }

    if (type === 'IEND') break;
  }

  return Buffer.concat(pieces);
}

/**
 * Simple parser for WebP dimensions.
 */
function getWebpDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 30) return { width: 0, height: 0 };
  const format = buffer.slice(12, 16).toString('ascii');
  if (format === 'VP8 ') {
    // Lossy VP8
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  } else if (format === 'VP8L') {
    // Lossless VP8L
    const b1 = buffer[21];
    const b2 = buffer[22];
    const b3 = buffer[23];
    const b4 = buffer[24];
    const width = 1 + (((b2 & 0x3f) << 8) | b1);
    const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    return { width, height };
  } else if (format === 'VP8X') {
    // Extended VP8X
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }
  return { width: 0, height: 0 };
}

