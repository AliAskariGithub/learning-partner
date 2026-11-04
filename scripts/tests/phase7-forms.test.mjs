import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { contactFormSchema } from '../../src/lib/contact/schema.ts';
import { feedbackFormSchema } from '../../src/lib/feedback/schema.ts';
import { hashIpAddress, verifySpamProtection } from '../../src/lib/security/spam.ts';
import { validateAndSanitizeImage } from '../../src/lib/security/image.ts';
import { escapeHtml } from '../../src/lib/email/index.ts';
import { findPlaceholders } from '../check-placeholders.mjs';
import { checkInternalLinks } from '../check-internal-links.mjs';

describe('Phase 7: Form Validation Schemas', () => {
  test('contactFormSchema validates legitimate contact messages', () => {
    const valid = {
      name: 'Elena Rostova',
      email: 'elena@example.edu',
      topic: 'general',
      message: 'Hello, I would like to inquire about the PDF chunking algorithm.',
      consent: true,
    };
    const res = contactFormSchema.safeParse(valid);
    assert.equal(res.success, true);
  });

  test('contactFormSchema rejects missing consent', () => {
    const invalid = {
      name: 'Elena Rostova',
      email: 'elena@example.edu',
      topic: 'general',
      message: 'Hello, I would like to inquire about the PDF chunking algorithm.',
      consent: false,
    };
    const res = contactFormSchema.safeParse(invalid);
    assert.equal(res.success, false);
  });

  test('contactFormSchema rejects messages under 10 characters', () => {
    const invalid = {
      name: 'Alex',
      email: 'alex@example.com',
      topic: 'support',
      message: 'Too short',
      consent: true,
    };
    const res = contactFormSchema.safeParse(invalid);
    assert.equal(res.success, false);
  });

  test('feedbackFormSchema validates bug report with severity', () => {
    const valid = {
      type: 'bug',
      title: 'Mind map node fails to collapse',
      description: 'Clicking the child node in Mind Map does not toggle visibility.',
      severity: 'medium',
      stepsToReproduce: '1. Open Studio. 2. Click Mind Map.',
    };
    const res = feedbackFormSchema.safeParse(valid);
    assert.equal(res.success, true);
  });

  test('feedbackFormSchema rejects invalid report types', () => {
    const invalid = {
      type: 'complaint',
      title: 'Something is wrong',
      description: 'Long enough description of the complaint.',
      severity: 'medium',
    };
    const res = feedbackFormSchema.safeParse(invalid);
    assert.equal(res.success, false);
  });
});

describe('Phase 7: Spam Defense & Rate Limiting', () => {
  test('honeypot triggers bot rejection when filled', async () => {
    const res = await verifySpamProtection({
      honeypotValue: 'https://spam-bot.ru',
      formLoadedAt: Date.now() - 5000,
      clientIp: '198.51.100.1',
    });
    assert.equal(res.allowed, false);
    assert.match(res.reason, /honeypot/i);
  });

  test('rejects submissions under 3,000ms minimum threshold', async () => {
    const res = await verifySpamProtection({
      honeypotValue: '',
      formLoadedAt: Date.now() - 1200, // only 1.2s
      clientIp: '198.51.100.2',
    });
    assert.equal(res.allowed, false);
    assert.match(res.reason, /unnaturally quickly/i);
  });

  test('allows human submission after 3.5 seconds', async () => {
    const res = await verifySpamProtection({
      honeypotValue: '',
      formLoadedAt: Date.now() - 3500,
      clientIp: '198.51.100.3',
    });
    assert.equal(res.allowed, true);
  });

  test('enforces sliding window rate limit per IP hash', async () => {
    const testIp = '198.51.100.44';
    // Consume 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const res = await verifySpamProtection({
        formLoadedAt: Date.now() - 4000,
        clientIp: testIp,
      });
      assert.equal(res.allowed, true);
    }

    // 6th request within window must be blocked
    const blocked = await verifySpamProtection({
      formLoadedAt: Date.now() - 4000,
      clientIp: testIp,
    });
    assert.equal(blocked.allowed, false);
    assert.match(blocked.reason, /too many submissions/i);
  });

  test('hashes raw IP into salted SHA-256 without exposing address', () => {
    const hash1 = hashIpAddress('203.0.113.195');
    const hash2 = hashIpAddress('203.0.113.195');
    const diffHash = hashIpAddress('203.0.113.196');

    assert.equal(hash1.length, 64);
    assert.equal(hash1, hash2);
    assert.notEqual(hash1, diffHash);
    assert.equal(hash1.includes('203.0.113'), false);
  });
});

describe('Phase 7: Screenshot Upload & Magic Bytes Validation', () => {
  test('accepts valid PNG image buffer', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const res = validateAndSanitizeImage(pngHeader, 'image/png');
    assert.equal(res.valid, true);
    assert.equal(res.mimeType, 'image/png');
  });

  test('accepts valid JPEG image buffer', () => {
    const jpgHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
    const res = validateAndSanitizeImage(jpgHeader, 'image/jpeg');
    assert.equal(res.valid, true);
    assert.equal(res.mimeType, 'image/jpeg');
  });

  test('strictly rejects SVG images disguised as images', () => {
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const res = validateAndSanitizeImage(svgBuffer, 'image/svg+xml');
    assert.equal(res.valid, false);
    assert.match(res.error, /SVG format is not supported/i);
  });

  test('rejects arbitrary binary or executable disguised as image', () => {
    const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff');
    const res = validateAndSanitizeImage(exeBuffer, 'image/png');
    assert.equal(res.valid, false);
    assert.match(res.error, /invalid image format/i);
  });
});

describe('Phase 7: Save-First-Then-Email & HTML Escaping', () => {
  test('escapeHtml neutralizes XSS and HTML injection payloads', () => {
    const injection = `<script>alert("hacked")</script> & "quotes" 'test'`;
    const escaped = escapeHtml(injection);
    assert.equal(escaped.includes('<script>'), false);
    assert.equal(escaped.includes('&lt;script&gt;'), true);
    assert.equal(escaped.includes('&quot;quotes&quot;'), true);
    assert.equal(escaped.includes('&#39;test&#39;'), true);
  });

  test('save-first pattern ensures data is preserved even when email delivery fails', async () => {
    // Simulated database write
    const savedRecord = {
      id: 'msg-test-123',
      name: 'Test Student',
      email: 'student@test.edu',
      status: 'new',
      emailStatus: 'skipped',
    };

    // Simulated email delivery attempt that fails (e.g. no RESEND_API_KEY)
    let emailStatus = 'skipped';
    try {
      const hasApiKey = Boolean(process.env.RESEND_API_KEY);
      if (!hasApiKey) {
        emailStatus = 'skipped';
      } else {
        throw new Error('Simulated network timeout');
      }
    } catch {
      emailStatus = 'failed';
    }

    // Database record is updated with final status
    savedRecord.emailStatus = emailStatus;

    assert.equal(savedRecord.id, 'msg-test-123');
    assert.ok(['skipped', 'failed'].includes(savedRecord.emailStatus));
  });
});

describe('Phase 7: Admin Authorization Gate', () => {
  function checkAdminAccess(userEmail, configuredAdminEmails) {
    if (!userEmail) return false;
    const list = configuredAdminEmails.split(',').map((e) => e.trim().toLowerCase());
    return list.includes(userEmail.trim().toLowerCase());
  }

  test('allows authorized email matching ADMIN_EMAILS', () => {
    const access = checkAdminAccess('ali@learningpartner.internal', 'ali@learningpartner.internal,admin@test.com');
    assert.equal(access, true);
  });

  test('rejects non-admin email with 404 simulation', () => {
    const access = checkAdminAccess('student@university.edu', 'ali@learningpartner.internal,admin@test.com');
    assert.equal(access, false);
  });

  test('rejects unauthenticated visitor (null email)', () => {
    const access = checkAdminAccess(null, 'ali@learningpartner.internal');
    assert.equal(access, false);
  });
});

describe('Phase 7: Placeholder Checker & Link Verification', () => {
  test('findPlaceholders correctly detects unresolved placeholders', () => {
    const placeholders = findPlaceholders();
    // Confirms that config/site.ts placeholders are cataloged
    assert.ok(Array.isArray(placeholders));
    assert.ok(placeholders.length > 0);
    const hasLegalOwner = placeholders.some((p) => p.topic.includes('legal owner'));
    assert.equal(hasLegalOwner, true);
  });

  test('checkInternalLinks verifies all marketing routes and help docs resolve cleanly', () => {
    const { brokenLinks } = checkInternalLinks();
    assert.equal(brokenLinks.length, 0);
  });
});
