import crypto from 'crypto';

/**
 * Derives a 32-byte encryption key from ENCRYPTION_KEY environment variable.
 */
function getEncryptionKey(): Buffer {
  const keyStr = process.env.ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error('ENCRYPTION_KEY environment variable is not configured.');
  }

  // If 64 hex chars (32 bytes in hex), decode hex
  if (/^[0-9a-fA-F]{64}$/.test(keyStr)) {
    return Buffer.from(keyStr, 'hex');
  }

  const buf = Buffer.from(keyStr, 'utf-8');
  if (buf.length === 32) {
    return buf;
  }

  // Hash with SHA-256 to guarantee exact 32 bytes
  return crypto.createHash('sha256').update(keyStr).digest();
}

/**
 * Encrypts a plain API key using AES-256-GCM.
 * Output format: iv:authTag:ciphertext (all hex encoded)
 */
export function encryptApiKey(plainKey: string): string {
  if (!plainKey || typeof plainKey !== 'string') {
    throw new Error('Cannot encrypt empty or non-string API key.');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 */
export function decryptApiKey(encryptedPayload: string): string {
  if (!encryptedPayload) {
    throw new Error('Missing encrypted API key payload.');
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted API key format.');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

