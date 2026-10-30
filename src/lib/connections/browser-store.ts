/**
 * Client-Side Browser Store & Diagnostics for Localhost / OmniRoute (Browser Mode)
 * Keys are stored exclusively in client-side IndexedDB and NEVER sent to the server.
 */

const DB_NAME = 'learningpartner_local_keys';
const STORE_NAME = 'keys';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not available in this environment.'));
    }

    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'connectionId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveBrowserKey(connectionId: string, apiKey: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put({ connectionId, apiKey, updatedAt: Date.now() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getBrowserKey(connectionId: string): Promise<string | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(connectionId);
      req.onsuccess = () => resolve(req.result?.apiKey || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteBrowserKey(connectionId: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(connectionId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore cleanup error
  }
}

export interface LocalDiagnosticResult {
  ok: boolean;
  stage: 'cors' | 'mixed_content' | 'private_network' | 'unreachable' | 'success';
  title: string;
  message: string;
  fix: string;
}

/**
 * Client-Side Diagnostic Tester for Browser Mode endpoints (e.g. http://localhost:20128/v1)
 */
export async function diagnoseLocalEndpoint(
  baseUrl: string,
  apiKey?: string
): Promise<LocalDiagnosticResult> {
  const cleanUrl = (baseUrl || 'http://localhost:20128/v1').replace(/\/+$/, '');
  const isHttpsPage = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isHttpTarget = cleanUrl.startsWith('http://');

  // Stage 1: Mixed Content check (Safari / strict browser blocks HTTPS -> HTTP localhost)
  const isSafari =
    typeof navigator !== 'undefined' &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isHttpsPage && isHttpTarget && isSafari) {
    return {
      ok: false,
      stage: 'mixed_content',
      title: 'Safari Secure Page Restriction',
      message: 'Safari blocks HTTPS websites from making direct HTTP calls to localhost.',
      fix: 'Use Chrome or Brave, or expose your gateway via an HTTPS secure tunnel (like Cloudflare Tunnel or ngrok) and switch to Server Mode.',
    };
  }

  // Stage 2: Probe local models endpoint
  try {
    const probeUrl = `${cleanUrl}/models`;
    const res = await fetch(probeUrl, {
      method: 'GET',
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      return {
        ok: true,
        stage: 'success',
        title: 'Connection Successful',
        message: 'Your browser successfully connected to the local gateway.',
        fix: '',
      };
    }

    return {
      ok: false,
      stage: 'unreachable',
      title: `Gateway Error (HTTP ${res.status})`,
      message: `The local gateway responded with status ${res.status}: ${res.statusText}.`,
      fix: 'Check that your local model gateway (OmniRoute, Ollama, LM Studio) is running and models are loaded.',
    };
  } catch (err: any) {
    const errorStr = (err.message || '').toLowerCase();

    // CORS or Private Network block
    if (errorStr.includes('failed to fetch') || errorStr.includes('networkerror') || errorStr.includes('cors')) {
      return {
        ok: false,
        stage: 'cors',
        title: 'CORS or Network Permission Block',
        message: 'The local gateway did not permit cross-origin requests from this web application.',
        fix: 'Configure your gateway CORS settings to allow this origin (Access-Control-Allow-Origin: * or your site URL). In Chrome, grant the Local Network Access prompt if prompted.',
      };
    }

    return {
      ok: false,
      stage: 'unreachable',
      title: 'Cannot Reach Localhost',
      message: err.message || 'Connection timed out after 6 seconds.',
      fix: `Ensure your gateway is active on ${cleanUrl}. Start it with: omniroute start (or your local tool).`,
    };
  }
}

