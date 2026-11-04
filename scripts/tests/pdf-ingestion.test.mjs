import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parsePdf } from '../../src/lib/ingestion/index.ts';

describe('Critical Path: PDF Ingestion & Binary Uint8Array Handling', () => {
  // Construct a minimal standard PDF document in memory
  const createTestPdf = (textContent) => {
    const streamContent = `BT /F1 12 Tf 100 700 Td (${textContent}) Tj ET`;
    const streamLength = streamContent.length;
    return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamContent}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000234 00000 n 
0000000328 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
407
%%EOF`;
  };

  test('successfully extracts text from Buffer without Uint8Array rejection error', async () => {
    const rawPdf = createTestPdf('AI Delegation Mastery and Prompting');
    const buffer = Buffer.from(rawPdf);

    const pages = await parsePdf(buffer);
    assert.ok(Array.isArray(pages));
    assert.ok(pages.length > 0);
    assert.match(pages[0].text, /AI Delegation Mastery and Prompting/);
    assert.equal(pages[0].pageNumber, 1);
  });

  test('accepts Uint8Array directly', async () => {
    const rawPdf = createTestPdf('Second Test Extract');
    const buffer = Buffer.from(rawPdf);
    const uint8 = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const pages = await parsePdf(uint8);
    assert.ok(Array.isArray(pages));
    assert.ok(pages.length > 0);
    assert.match(pages[0].text, /Second Test Extract/);
  });

  test('handles multi-line text stream fallback extraction if parser structure is raw', async () => {
    const rawPdf = createTestPdf('Advanced Agentic Workflows with Antigravity');
    const buffer = Buffer.from(rawPdf);

    const pages = await parsePdf(buffer);
    assert.ok(pages[0].text.includes('Advanced Agentic Workflows'));
  });
});

