import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// 1. KEY ENCRYPTION & DECRYPTION (AES-256-GCM)
// ---------------------------------------------------------------------------
function getTestEncryptionKey() {
  const keyStr = process.env.ENCRYPTION_KEY || 'test-secret-key-that-is-at-least-32-chars-long!';
  return crypto.createHash('sha256').update(keyStr).digest();
}

function encryptTestKey(plainKey) {
  const key = getTestEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptTestKey(payload) {
  const parts = payload.split(':');
  if (parts.length !== 3) throw new Error('Invalid format');
  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getTestEncryptionKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

describe('Critical Path: AES-256-GCM BYOK Security', () => {
  test('encrypts and correctly decrypts API key', () => {
    const rawKey = 'sk-proj-abc123xyz789SECRETKEY';
    const ciphertext = encryptTestKey(rawKey);

    assert.notEqual(ciphertext, rawKey);
    assert.match(ciphertext, /^[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/);

    const roundtrip = decryptTestKey(ciphertext);
    assert.equal(roundtrip, rawKey);
  });

  test('fails decryption when authTag or ciphertext is tampered with', () => {
    const rawKey = 'AIzaSyTestGoogleGeminiKey';
    const ciphertext = encryptTestKey(rawKey);
    const [iv, tag, data] = ciphertext.split(':');
    const corruptedData = (data.slice(0, -2) + (data.slice(-2) === 'aa' ? 'bb' : 'aa'));
    const tamperedPayload = `${iv}:${tag}:${corruptedData}`;

    assert.throws(() => decryptTestKey(tamperedPayload));
  });
});

// ---------------------------------------------------------------------------
// 2. SSRF URL PROTECTION
// ---------------------------------------------------------------------------
function validateSafeUrl(urlString) {
  const parsed = new URL(urlString);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only HTTP/HTTPS permitted');
  }
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]'
  ) {
    throw new Error('Access to local host is forbidden');
  }

  const ipv4 = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [_, o1, o2] = ipv4.map(Number);
    if (o1 === 127) throw new Error('Loopback forbidden');
    if (o1 === 10) throw new Error('Private 10.0.0.0/8 forbidden');
    if (o1 === 172 && o2 >= 16 && o2 <= 31) throw new Error('Private 172.16.0.0/12 forbidden');
    if (o1 === 192 && o2 === 168) throw new Error('Private 192.168.0.0/16 forbidden');
    if (o1 === 169 && o2 === 254) throw new Error('Metadata 169.254.0.0/16 forbidden');
  }
  return parsed;
}

describe('Critical Path: SSRF Prevention on Source Ingestion', () => {
  test('blocks private and local IP ranges', () => {
    const blocked = [
      'http://localhost:3000/api',
      'http://127.0.0.1:8080/admin',
      'http://10.0.0.5/secret',
      'http://172.16.1.1/internal',
      'http://192.168.1.1/router',
      'http://169.254.169.254/latest/meta-data',
    ];

    for (const url of blocked) {
      assert.throws(() => validateSafeUrl(url), `Should have blocked: ${url}`);
    }
  });

  test('allows safe public internet URLs', () => {
    const allowed = [
      'https://en.wikipedia.org/wiki/Distributed_computing',
      'https://arxiv.org/abs/2301.00001',
      'https://docs.google.com/document/d/123/preview',
    ];

    for (const url of allowed) {
      assert.doesNotThrow(() => validateSafeUrl(url));
    }
  });
});

// ---------------------------------------------------------------------------
// 3. CITATION EXTRACTION & BRACKETED CHIP PARSING
// ---------------------------------------------------------------------------
function extractCitationsFromMarkdown(markdown) {
  const citationRegex = /\[(\d+)\]/g;
  const numbers = new Set();
  let match;
  while ((match = citationRegex.exec(markdown)) !== null) {
    numbers.add(parseInt(match[1], 10));
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

describe('Critical Path: Citation Extraction & Chip Grounding', () => {
  test('extracts single and compound citation references correctly', () => {
    const text = 'Raft achieves consensus via leader election [1]. If votes split, election timers randomize [1][3], preventing deadlock [5].';
    const cited = extractCitationsFromMarkdown(text);
    assert.deepEqual(cited, [1, 3, 5]);
  });

  test('handles texts with no citations gracefully', () => {
    const text = 'This is a general greeting with no grounded claims.';
    const cited = extractCitationsFromMarkdown(text);
    assert.deepEqual(cited, []);
  });
});

// ---------------------------------------------------------------------------
// 4. VOICE SCRIPT JSON VALIDATION
// ---------------------------------------------------------------------------
function validateVoiceScript(rawJson) {
  const parsed = JSON.parse(rawJson);
  if (!Array.isArray(parsed)) throw new Error('Script must be an array of turns');
  if (parsed.length === 0) throw new Error('Script cannot be empty');

  for (let i = 0; i < parsed.length; i++) {
    const turn = parsed[i];
    if (!turn.speaker || typeof turn.speaker !== 'string') {
      throw new Error(`Turn ${i + 1} missing speaker`);
    }
    if (!turn.text || typeof turn.text !== 'string' || turn.text.trim().length === 0) {
      throw new Error(`Turn ${i + 1} missing text`);
    }
  }
  return parsed;
}

describe('Critical Path: Voice Script JSON Schema Validation', () => {
  test('validates correct multi-speaker dialogue script', () => {
    const validJson = JSON.stringify([
      { speaker: 'Alex', text: 'Welcome to today’s study session. Today we are diving into distributed consensus.' },
      { speaker: 'Jordan', text: 'Right, and specifically how Paxos and Raft compare in terms of understandability.' },
    ]);

    const script = validateVoiceScript(validJson);
    assert.equal(script.length, 2);
    assert.equal(script[0].speaker, 'Alex');
  });

  test('rejects malformed or non-array script payloads', () => {
    const invalidJson = JSON.stringify({
      turns: [{ speaker: 'Alex', text: 'Hello' }],
    });
    assert.throws(() => validateVoiceScript(invalidJson));
  });
});

// ---------------------------------------------------------------------------
// 5. SLIDING WINDOW RATE LIMITER
// ---------------------------------------------------------------------------
describe('Critical Path: Sliding Window Rate Limiter', () => {
  test('allows up to threshold requests within window and blocks subsequent', () => {
    const history = [];
    const limit = 5;
    const windowMs = 1000;

    function isAllowed() {
      const now = Date.now();
      const valid = history.filter((t) => now - t < windowMs);
      if (valid.length >= limit) return false;
      history.push(now);
      return true;
    }

    for (let i = 0; i < limit; i++) {
      assert.equal(isAllowed(), true, `Request ${i + 1} should be allowed`);
    }
    assert.equal(isAllowed(), false, 'Request exceeding limit must be blocked');
  });
});

// ---------------------------------------------------------------------------
// 6. MULTI-CHAT STUDIO OUTPUT SCOPING
// ---------------------------------------------------------------------------
describe('Critical Path: Multi-Chat Studio Output Scoping', () => {
  const mockOutputs = [
    { id: '1', title: 'English Quiz', conversationId: 'conv-english' },
    { id: '2', title: 'Urdu Summary', conversationId: 'conv-urdu' },
    { id: '3', title: 'Maths Mind Map', conversationId: 'conv-maths' },
  ];

  function filterOutputsForChat(outputs, activeConversationId) {
    if (!activeConversationId) return [];
    return outputs.filter(
      (o) => o.conversationId === activeConversationId
    );
  }

  test('filters outputs strictly by active conversation to isolate studio outputs per chat', () => {
    const englishOutputs = filterOutputsForChat(mockOutputs, 'conv-english');
    assert.equal(englishOutputs.length, 1);
    assert.deepEqual(englishOutputs.map(o => o.id), ['1']);

    const urduOutputs = filterOutputsForChat(mockOutputs, 'conv-urdu');
    assert.equal(urduOutputs.length, 1);
    assert.deepEqual(urduOutputs.map(o => o.id), ['2']);

    const mathsOutputs = filterOutputsForChat(mockOutputs, 'conv-maths');
    assert.equal(mathsOutputs.length, 1);
    assert.deepEqual(mathsOutputs.map(o => o.id), ['3']);

    const newChatOutputs = filterOutputsForChat(mockOutputs, null);
    assert.equal(newChatOutputs.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 7. CONTEXT WINDOW & TOKEN CONSUMPTION CALCULATION
// ---------------------------------------------------------------------------
describe('Critical Path: Context Window & Token Consumption', () => {
  function calculateTokenMetrics({ sources, messages, notes, contextLimit }) {
    const sourcesTokens = sources
      .filter((s) => s.enabled)
      .reduce((acc, s) => acc + Math.round((s.wordCount || 0) * 1.33), 0);

    const chatTokens = messages.reduce(
      (acc, m) => acc + Math.round((m.content?.length || 0) / 4),
      0
    );

    const memoryTokens = notes.reduce(
      (acc, n) => acc + Math.round(((n.title?.length || 0) + (n.content?.length || 0)) / 4),
      0
    );

    const totalUsed = sourcesTokens + chatTokens + memoryTokens;
    const percentage = Math.min(100, (totalUsed / contextLimit) * 100);

    return { sourcesTokens, chatTokens, memoryTokens, totalUsed, percentage };
  }

  test('accurately calculates token allocations and context limit utilization', () => {
    const metrics = calculateTokenMetrics({
      sources: [
        { enabled: true, wordCount: 1000 },
        { enabled: false, wordCount: 5000 },
      ],
      messages: [
        { content: 'Hello this is user' }, // 18 chars -> ~5 tokens
        { content: 'Assistant response with detail' }, // 30 chars -> ~8 tokens
      ],
      notes: [
        { title: 'Takeaway', content: 'Important formula' }, // 8 + 17 = 25 chars -> ~6 tokens
      ],
      contextLimit: 1000000,
    });

    assert.equal(metrics.sourcesTokens, 1330);
    assert.equal(metrics.chatTokens, 13);
    assert.equal(metrics.memoryTokens, 6);
    assert.equal(metrics.totalUsed, 1349);
    assert.ok(metrics.percentage < 1);
  });
});

// ---------------------------------------------------------------------------
// 8. MULTI-CHAT MEMORY (SAVED NOTES) SCOPING
// ---------------------------------------------------------------------------
describe('Critical Path: Multi-Chat Memory Scoping', () => {
  const mockNotes = [
    { id: 'n1', notebookId: 'nb-1', conversationId: 'conv-1', title: 'Chat 1 Note', content: 'Details 1' },
    { id: 'n2', notebookId: 'nb-1', conversationId: 'conv-1', title: 'Chat 1 Takeaway', content: 'Details 2' },
    { id: 'n3', notebookId: 'nb-1', conversationId: 'conv-2', title: 'Chat 2 Concept', content: 'Details 3' },
  ];

  function filterNotesForChat(notes, activeConversationId) {
    if (!activeConversationId) return [];
    return notes.filter((n) => n.conversationId === activeConversationId);
  }

  test('filters memory notes strictly by active conversation to isolate memory per chat', () => {
    const chat1Notes = filterNotesForChat(mockNotes, 'conv-1');
    assert.equal(chat1Notes.length, 2);
    assert.deepEqual(chat1Notes.map((n) => n.id), ['n1', 'n2']);

    const chat2Notes = filterNotesForChat(mockNotes, 'conv-2');
    assert.equal(chat2Notes.length, 1);
    assert.deepEqual(chat2Notes.map((n) => n.id), ['n3']);

    const chat3Notes = filterNotesForChat(mockNotes, 'conv-3');
    assert.equal(chat3Notes.length, 0);

    const emptyChatNotes = filterNotesForChat(mockNotes, null);
    assert.equal(emptyChatNotes.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 9. PHASE 5: PKCE GENERATION & TIMING-SAFE STATE VALIDATION
// ---------------------------------------------------------------------------
function generateTestPkcePair() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

function generateTestState(secret, payload = {}) {
  const data = Buffer.from(JSON.stringify({ ...payload, ts: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function validateTestState(token, secret) {
  if (!token || !token.includes('.')) return false;
  const [data, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

describe('Critical Path: Phase 5 PKCE & State Security', () => {
  const secret = 'super-secret-oauth-state-signing-key';

  test('generates valid RFC 7636 PKCE S256 verifier and challenge', () => {
    const { codeVerifier, codeChallenge } = generateTestPkcePair();
    assert.ok(codeVerifier.length >= 43 && codeVerifier.length <= 128);
    assert.ok(codeChallenge.length >= 43);

    // Verify mathematical link between verifier and challenge
    const recomputedChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    assert.equal(codeChallenge, recomputedChallenge);
  });

  test('validates state token with timing-safe comparison', () => {
    const stateToken = generateTestState(secret, { provider: 'chatgpt', userId: 'user-123' });
    assert.ok(validateTestState(stateToken, secret));
  });

  test('rejects tampered state token', () => {
    const stateToken = generateTestState(secret, { provider: 'chatgpt', userId: 'user-123' });
    const tampered = stateToken.slice(0, -4) + 'zzzz';
    assert.equal(validateTestState(tampered, secret), false);
  });

  test('rejects state token signed with different secret', () => {
    const stateToken = generateTestState(secret, { provider: 'openrouter' });
    assert.equal(validateTestState(stateToken, 'wrong-secret'), false);
  });
});

// ---------------------------------------------------------------------------
// 10. PHASE 5: SSRF PROTECTION FOR CUSTOM SERVER ENDPOINTS
// ---------------------------------------------------------------------------
function isIpBlocked(ip) {
  // Check loopback
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.')) return true;
  // Check RFC 1918
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  // Check Cloud Metadata (AWS / GCP / Azure)
  if (ip === '169.254.169.254' || ip.startsWith('169.254.')) return true;
  // Check IPv6 link-local and unique local
  if (ip.toLowerCase().startsWith('fe80:') || ip.toLowerCase().startsWith('fc00:')) return true;
  return false;
}

function validateEndpointProtocol(urlStr, isProduction = true) {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && (isProduction || parsed.protocol !== 'http:')) {
      return { valid: false, error: 'Only https: URLs permitted in production' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Malformed URL' };
  }
}

describe('Critical Path: Phase 5 SSRF Defense Engine', () => {
  test('blocks loopback IP addresses (127.0.0.1, ::1)', () => {
    assert.equal(isIpBlocked('127.0.0.1'), true);
    assert.equal(isIpBlocked('127.0.1.1'), true);
    assert.equal(isIpBlocked('::1'), true);
  });

  test('blocks RFC 1918 private subnets (10.x, 192.168.x, 172.16-31.x)', () => {
    assert.equal(isIpBlocked('10.0.0.1'), true);
    assert.equal(isIpBlocked('10.255.0.1'), true);
    assert.equal(isIpBlocked('192.168.1.1'), true);
    assert.equal(isIpBlocked('172.16.0.1'), true);
    assert.equal(isIpBlocked('172.31.255.255'), true);
    assert.equal(isIpBlocked('172.32.0.1'), false); // public
  });

  test('blocks cloud metadata endpoint 169.254.169.254 and link-local ranges', () => {
    assert.equal(isIpBlocked('169.254.169.254'), true);
    assert.equal(isIpBlocked('169.254.1.1'), true);
    assert.equal(isIpBlocked('fe80::1'), true);
  });

  test('permits legitimate public IP addresses', () => {
    assert.equal(isIpBlocked('8.8.8.8'), false);
    assert.equal(isIpBlocked('1.1.1.1'), false);
    assert.equal(isIpBlocked('142.250.190.46'), false);
  });

  test('enforces HTTPS protocol for production server mode', () => {
    assert.equal(validateEndpointProtocol('http://gateway.example.com/v1', true).valid, false);
    assert.equal(validateEndpointProtocol('https://gateway.example.com/v1', true).valid, true);
    assert.equal(validateEndpointProtocol('ftp://gateway.example.com/v1', true).valid, false);
    assert.equal(validateEndpointProtocol('file:///etc/passwd', true).valid, false);
  });
});

// ---------------------------------------------------------------------------
// 11. PHASE 5: COOKIE & CONSENT LOGIC (GPC, WITHDRAWAL, POLICY VERSION)
// ---------------------------------------------------------------------------
describe('Critical Path: Phase 5 Cookie Consent & Privacy', () => {
  const POLICY_VERSION = 1;

  function evaluateConsent({ storedConsent, gpcSignal }) {
    if (gpcSignal) {
      // GPC takes precedence: non-essential rejected by default
      return {
        categories: { strictly_necessary: true, preferences: false, analytics: false },
        isGpc: true,
      };
    }

    if (!storedConsent || storedConsent.version !== POLICY_VERSION) {
      // Re-prompt needed, strictly necessary only
      return {
        categories: { strictly_necessary: true, preferences: false, analytics: false },
        needsPrompt: true,
      };
    }

    return {
      categories: { strictly_necessary: true, ...storedConsent.categories },
      needsPrompt: false,
    };
  }

  function simulateWithdrawConsent(cookieJar) {
    // Delete all non-essential cookies
    const nonEssential = ['lp_theme', 'lp_locale'];
    for (const name of nonEssential) {
      delete cookieJar[name];
    }
    // Update consent record to non-essential false
    cookieJar['lp_cookie_consent'] = JSON.stringify({
      version: POLICY_VERSION,
      categories: { strictly_necessary: true, preferences: false, analytics: false },
    });
  }

  test('GPC signal automatically rejects non-essential cookies', () => {
    const result = evaluateConsent({ storedConsent: null, gpcSignal: true });
    assert.equal(result.categories.preferences, false);
    assert.equal(result.categories.analytics, false);
    assert.equal(result.isGpc, true);
  });

  test('outdated policy version triggers re-prompt and blocks non-essential', () => {
    const outdated = { version: 0, categories: { preferences: true, analytics: true } };
    const result = evaluateConsent({ storedConsent: outdated, gpcSignal: false });
    assert.equal(result.needsPrompt, true);
    assert.equal(result.categories.preferences, false);
  });

  test('withdrawing consent purges preference cookies from storage immediately', () => {
    const jar = {
      lp_session: 'valid-session-jwt',
      lp_theme: 'dark',
      lp_locale: 'en',
      lp_cookie_consent: JSON.stringify({ version: 1, categories: { preferences: true } }),
    };

    simulateWithdrawConsent(jar);

    assert.equal(jar.lp_theme, undefined);
    assert.equal(jar.lp_locale, undefined);
    assert.ok(jar.lp_session !== undefined); // Essential preserved
    const parsed = JSON.parse(jar.lp_cookie_consent);
    assert.equal(parsed.categories.preferences, false);
  });
});

// ---------------------------------------------------------------------------
// 12. PHASE 5: CONNECTION STATUS & ERROR MAPPING (PLAN CAP, 429, 403, FALLBACK)
// ---------------------------------------------------------------------------
describe('Critical Path: Phase 5 Status & Auto-Fallback Mapping', () => {
  function mapProviderErrorToStatus(statusCode, errorCode) {
    if (statusCode === 429 && (errorCode === 'usage_limit_reached' || errorCode === 'subscription_sharing_limit')) {
      return 'capped_or_exhausted';
    }
    if (statusCode === 403 && (errorCode === 'not_eligible' || errorCode === 'subscription_required')) {
      return 'not_eligible';
    }
    if (statusCode === 401 && errorCode === 'invalid_grant') {
      return 'revoked';
    }
    return 'error';
  }

  function resolveFallbackConnection(activeConn, availableConns) {
    if (activeConn.status === 'capped_or_exhausted' && activeConn.autoFallback) {
      const geminiConn = availableConns.find((c) => c.provider === 'gemini' && c.status === 'connected');
      if (geminiConn) return geminiConn;
    }
    return activeConn;
  }

  test('maps ChatGPT plan 429 usage cap to capped_or_exhausted status', () => {
    const status = mapProviderErrorToStatus(429, 'usage_limit_reached');
    assert.equal(status, 'capped_or_exhausted');
  });

  test('maps ChatGPT plan 403 lack of Plus/Pro to not_eligible status without retrying', () => {
    const status = mapProviderErrorToStatus(403, 'not_eligible');
    assert.equal(status, 'not_eligible');
  });

  test('maps revoked OAuth refresh token to revoked status', () => {
    const status = mapProviderErrorToStatus(401, 'invalid_grant');
    assert.equal(status, 'revoked');
  });

  test('seamlessly falls back to connected Gemini key when ChatGPT allowance runs out and autoFallback is enabled', () => {
    const chatgptConn = {
      id: 'conn-chatgpt',
      provider: 'chatgpt',
      status: 'capped_or_exhausted',
      autoFallback: true,
    };
    const geminiConn = {
      id: 'conn-gemini',
      provider: 'gemini',
      status: 'connected',
      autoFallback: false,
    };

    const chosen = resolveFallbackConnection(chatgptConn, [chatgptConn, geminiConn]);
    assert.equal(chosen.id, 'conn-gemini');
    assert.equal(chosen.provider, 'gemini');
  });

  test('does not switch connection if autoFallback is disabled', () => {
    const chatgptConn = {
      id: 'conn-chatgpt',
      provider: 'chatgpt',
      status: 'capped_or_exhausted',
      autoFallback: false,
    };
    const geminiConn = {
      id: 'conn-gemini',
      provider: 'gemini',
      status: 'connected',
    };

    const chosen = resolveFallbackConnection(chatgptConn, [chatgptConn, geminiConn]);
    assert.equal(chosen.id, 'conn-chatgpt');
    assert.equal(chosen.status, 'capped_or_exhausted');
  });
});

describe('Critical Path: Custom Gateway & Multi-Model Routing', () => {
  test('matches custom connection when modelId matches configuredModel with routing prefix (e.g. kr/claude-sonnet-4.5)', () => {
    const userConns = [
      {
        id: 'conn-custom',
        provider: 'custom',
        status: 'connected',
        callMode: 'browser',
        baseUrl: 'http://localhost:20128/v1',
        modelCapabilityOverrides: { customModel: 'kr/claude-sonnet-4.5' },
      },
    ];

    const modelId = 'kr/claude-sonnet-4.5';
    const match = userConns.find((c) => {
      const overrides = c.modelCapabilityOverrides || {};
      return overrides.customModel?.toLowerCase() === modelId.toLowerCase();
    });

    assert.ok(match);
    assert.equal(match.provider, 'custom');
    assert.equal(match.callMode, 'browser');
    assert.equal(match.modelCapabilityOverrides.customModel, 'kr/claude-sonnet-4.5');
  });

  test('parses OpenAI-compatible SSE chunk stream from local gateway', () => {
    const rawSseChunk = 'data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Hello from OmniRoute!"}}]}\n\ndata: [DONE]\n\n';
    const lines = rawSseChunk.split('\n');
    let text = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(':')) continue;
      if (trimmed === 'data: [DONE]') break;
      if (trimmed.startsWith('data: ')) {
        const json = JSON.parse(trimmed.slice(6));
        text += json.choices?.[0]?.delta?.content || '';
      }
    }
    assert.equal(text, 'Hello from OmniRoute!');
  });
});

