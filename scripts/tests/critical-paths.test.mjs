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
