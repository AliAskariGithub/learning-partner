import dns from 'dns';
import { promisify } from 'util';

const dnsLookup = promisify(dns.lookup);

export interface SsrfCheckResult {
  valid: boolean;
  error?: string;
  resolvedIp?: string;
}

/**
 * Checks if an IPv4 address falls within private, loopback, link-local, or metadata ranges.
 */
export function isPrivateOrReservedIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b, c, d] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 10.0.0.0/8 (Private RFC 1918)
  if (a === 10) return true;

  // 172.16.0.0/12 (Private RFC 1918: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private RFC 1918)
  if (a === 192 && b === 168) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 100.64.0.0/10 (Shared Address Space / CGNAT / Alibaba metadata 100.100.100.200)
  if (a === 100 && (b >= 64 && b <= 127 || b === 100)) return true;

  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (a >= 224) return true;

  return false;
}

/**
 * Checks if an IPv6 address falls within loopback, link-local, site-local, or IPv4-mapped private ranges.
 */
export function isPrivateOrReservedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  // Loopback ::1
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // Unspecified ::
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // Link-local fe80::/10
  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return true;
  }

  // Unique local fc00::/7 (fc00:: or fd00::)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;

  // IPv4-mapped IPv6 ::ffff:127.0.0.1
  if (normalized.includes('::ffff:')) {
    const v4 = normalized.split('::ffff:')[1];
    if (v4 && !v4.includes(':')) {
      return isPrivateOrReservedIPv4(v4);
    }
  }

  return false;
}

/**
 * Validates a custom endpoint URL against SSRF threats.
 */
export async function validateEndpointUrl(urlString: string, options: { allowLocalInDev?: boolean } = {}): Promise<SsrfCheckResult> {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'Endpoint URL must be a non-empty string.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }

  const isProd = process.env.NODE_ENV === 'production';
  const allowLocal = !isProd && options.allowLocalInDev;

  // Protocol check
  if (isProd && parsed.protocol !== 'https:') {
    return {
      valid: false,
      error: 'In production, custom server-mode endpoints must use secure HTTPS.',
    };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, error: 'Endpoint URL must use HTTP or HTTPS protocol.' };
  }

  // Disallow user credentials in URL (e.g. https://user:pass@example.com)
  if (parsed.username || parsed.password) {
    return { valid: false, error: 'URL must not contain embedded username or password credentials.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Known metadata hostnames
  if (
    hostname === 'metadata.google.internal' ||
    hostname === 'instance-data' ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.local')
  ) {
    return { valid: false, error: 'Internal cloud metadata and local domains are blocked.' };
  }

  // Check direct localhost in dev
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    if (allowLocal) {
      return { valid: true, resolvedIp: '127.0.0.1' };
    }
    return {
      valid: false,
      error: 'Direct localhost endpoints cannot be reached by the hosted server. Use Browser Mode or an HTTPS tunnel.',
    };
  }

  // Resolve DNS to verify IP
  try {
    const lookup = await dnsLookup(hostname, { all: true });
    if (!lookup || lookup.length === 0) {
      return { valid: false, error: 'Unable to resolve hostname via DNS.' };
    }

    for (const entry of lookup) {
      const ip = entry.address;
      if (entry.family === 4 && isPrivateOrReservedIPv4(ip)) {
        return {
          valid: false,
          error: `Resolved IP (${ip}) is a private, loopback, or cloud-metadata address.`,
        };
      }
      if (entry.family === 6 && isPrivateOrReservedIPv6(ip)) {
        return {
          valid: false,
          error: `Resolved IPv6 (${ip}) is a private or reserved address.`,
        };
      }
    }

    return { valid: true, resolvedIp: lookup[0]?.address };
  } catch (err: any) {
    return {
      valid: false,
      error: `DNS lookup failed for host ${hostname}: ${err.message || 'unknown error'}`,
    };
  }
}

/**
 * SSRF-Safe fetch wrapper with timeout, response size limits, and redirect validation.
 */
export async function ssrfSafeFetch(
  urlString: string,
  init: RequestInit = {},
  options: { maxRedirects?: number; maxSizeBytes?: number; timeoutMs?: number; allowLocalInDev?: boolean } = {}
): Promise<Response> {
  const maxRedirects = options.maxRedirects ?? 3;
  const maxSizeBytes = options.maxSizeBytes ?? 5 * 1024 * 1024; // 5MB limit
  const timeoutMs = options.timeoutMs ?? 15000;

  let currentUrl = urlString;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    // 1. Validate target URL before connecting
    const check = await validateEndpointUrl(currentUrl, { allowLocalInDev: options.allowLocalInDev });
    if (!check.valid) {
      throw new Error(`SSRF Blocked: ${check.error}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(currentUrl, {
        ...init,
        redirect: 'manual', // handle redirects explicitly
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Handle redirects explicitly
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (!location) {
          throw new Error('Redirect response missing Location header.');
        }

        redirectsCount++;
        if (redirectsCount > maxRedirects) {
          throw new Error(`Too many redirects (exceeded limit of ${maxRedirects}).`);
        }

        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      // Check Content-Length header if present
      const contentLength = res.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
        throw new Error(`Response exceeds maximum size limit of ${maxSizeBytes} bytes.`);
      }

      return res;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error(`Connection timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
  }

  throw new Error('Failed to complete request within redirect limits.');
}

