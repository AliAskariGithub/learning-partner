export interface ExportPdfOptions {
  filename: string;
  title: string;
  subtitle?: string;
  content: string;
  metadata?: {
    notebookTitle?: string;
    date?: string;
    author?: string;
    type?: string;
  };
}

/**
 * Trigger browser file download from Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export raw text content as Markdown file (.md)
 */
export function exportToMarkdown(filename: string, content: string): void {
  const safeFilename = filename.endsWith('.md') ? filename : `${filename}.md`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  downloadBlob(blob, safeFilename);
}

/**
 * Export raw text content as plain text file (.txt)
 */
export function exportToTxt(filename: string, content: string): void {
  const safeFilename = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, safeFilename);
}

/**
 * Strip Markdown formatting for clean plain-text rendering
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/^#+\s+/gm, '') // headings
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/__(.*?)__/g, '$1') // underline
    .replace(/~~(.*?)~~/g, '$1') // strikethrough
    .replace(/`{3}[\s\S]*?`{3}/g, (match) => {
      // code blocks
      return match.replace(/`{3}[a-z]*\n?/gi, '').replace(/`{3}/g, '');
    })
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // links
    .replace(/^\s*[-*+]\s+/gm, '• ') // bullet list
    .replace(/\[\^?(\d+)\]/g, '[$1]') // citation chips
    .trim();
}

/**
 * Escape string for PDF text literal syntax: (text)
 */
function escapePdfText(str: string): string {
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const code = str.charCodeAt(i);
    if (char === '\\') {
      res += '\\\\';
    } else if (char === '(') {
      res += '\\(';
    } else if (char === ')') {
      res += '\\)';
    } else if (code >= 32 && code <= 126) {
      res += char;
    } else if (char === '•' || char === '—' || char === '–') {
      res += '-';
    } else if (char === '“' || char === '”') {
      res += '"';
    } else if (char === '‘' || char === '’') {
      res += "'";
    } else if (char === '\t') {
      res += '    ';
    } else {
      res += ' ';
    }
  }
  return res;
}

/**
 * Word wrap helper for PDF lines
 */
function wrapPdfLine(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    if (!w) continue;
    if ((current + ' ' + w).trim().length <= maxChars) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [' '];
}

/**
 * Zero-dependency, pure TypeScript PDF 1.4 document builder
 * Produces valid, standard-compliant PDF files that open in any PDF viewer or browser.
 */
export function buildPdfDocument({ title, subtitle, content, metadata }: ExportPdfOptions): Uint8Array {
  const objects: string[] = [];
  function addObject(objContent: string): number {
    objects.push(objContent);
    return objects.length;
  }

  // Placeholder 1: Catalog
  objects.push('');
  // Placeholder 2: Pages
  objects.push('');

  // 3: Font F1 (Helvetica-Bold)
  const fontF1 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  // 4: Font F2 (Helvetica)
  const fontF2 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  // 5: Font F3 (Courier)
  const fontF3 = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>');

  const pageIds: number[] = [];
  let curY = 760;
  let pageCommands: string[] = [];

  function flushPage() {
    const pageNumber = pageIds.length + 1;
    const footerText = escapePdfText(`Learning Partner  -  ${title}`);
    const pageNumText = escapePdfText(`Page ${pageNumber}`);

    const streamBody = [
      '0.12 0.12 0.12 rg',
      '0 838 595.28 4 re f', // Top aesthetic brand line
      ...pageCommands,
      // Bottom divider & page footer
      '0.88 0.88 0.90 RG 0.5 w',
      '48 36 m 547 36 l S',
      `BT /F2 8 Tf 0.5 0.5 0.5 rg 48 24 Td (${footerText}) Tj ET`,
      `BT /F2 8 Tf 0.5 0.5 0.5 rg 515 24 Td (${pageNumText}) Tj ET`,
    ].join('\n');

    const streamId = addObject(
      `<< /Length ${new TextEncoder().encode(streamBody).length} >>\nstream\n${streamBody}\nendstream`
    );

    const pageId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 ${fontF1} 0 R /F2 ${fontF2} 0 R /F3 ${fontF3} 0 R >> >> /Contents ${streamId} 0 R >>`
    );

    pageIds.push(pageId);
    pageCommands = [];
    curY = 770;
  }

  // Page 1 Header
  pageCommands.push(`BT /F1 18 Tf 0.1 0.1 0.1 rg 48 ${curY} Td (${escapePdfText(title)}) Tj ET`);
  curY -= 22;

  const metaParts: string[] = [];
  if (subtitle) metaParts.push(subtitle);
  if (metadata?.notebookTitle) metaParts.push(`Notebook: ${metadata.notebookTitle}`);
  metaParts.push(metadata?.date || new Date().toLocaleDateString(undefined, { dateStyle: 'medium' }));
  if (metadata?.type) metaParts.push(metadata.type);

  pageCommands.push(`BT /F2 9 Tf 0.45 0.45 0.45 rg 48 ${curY} Td (${escapePdfText(metaParts.join('  |  '))}) Tj ET`);
  curY -= 14;

  // Header separator
  pageCommands.push(`0.85 0.85 0.88 RG 0.8 w 48 ${curY} m 547 ${curY} l S`);
  curY -= 22;

  // Parse lines
  const rawLines = content.split('\n');
  let inCodeBlock = false;

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    if (curY < 60) flushPage();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      const wrapped = wrapPdfLine(rawLine || ' ', 70);
      for (const wl of wrapped) {
        if (curY < 60) flushPage();
        pageCommands.push('0.95 0.95 0.96 rg');
        pageCommands.push(`48 ${curY - 3} 499 13 re f`);
        pageCommands.push(`BT /F3 8.5 Tf 0.25 0.3 0.35 rg 54 ${curY} Td (${escapePdfText(wl)}) Tj ET`);
        curY -= 13;
      }
      continue;
    }

    if (!trimmed) {
      curY -= 8;
      continue;
    }

    // H1 Heading
    if (trimmed.startsWith('# ')) {
      curY -= 6;
      if (curY < 60) flushPage();
      const clean = stripMarkdown(trimmed.substring(2));
      const wrapped = wrapPdfLine(clean, 55);
      for (const wl of wrapped) {
        if (curY < 60) flushPage();
        pageCommands.push(`BT /F1 14 Tf 0.1 0.1 0.12 rg 48 ${curY} Td (${escapePdfText(wl)}) Tj ET`);
        curY -= 18;
      }
      continue;
    }

    // H2 Heading
    if (trimmed.startsWith('## ')) {
      curY -= 4;
      if (curY < 60) flushPage();
      const clean = stripMarkdown(trimmed.substring(3));
      const wrapped = wrapPdfLine(clean, 65);
      for (const wl of wrapped) {
        if (curY < 60) flushPage();
        pageCommands.push(`BT /F1 12 Tf 0.15 0.15 0.18 rg 48 ${curY} Td (${escapePdfText(wl)}) Tj ET`);
        curY -= 16;
      }
      continue;
    }

    // H3 Heading
    if (trimmed.startsWith('### ')) {
      if (curY < 60) flushPage();
      const clean = stripMarkdown(trimmed.substring(4));
      const wrapped = wrapPdfLine(clean, 75);
      for (const wl of wrapped) {
        if (curY < 60) flushPage();
        pageCommands.push(`BT /F1 10.5 Tf 0.2 0.2 0.25 rg 48 ${curY} Td (${escapePdfText(wl)}) Tj ET`);
        curY -= 14;
      }
      continue;
    }

    // Lists / Bullets
    if (/^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
      const clean = stripMarkdown(trimmed);
      const wrapped = wrapPdfLine(clean, 80);
      wrapped.forEach((wl, idx) => {
        if (curY < 60) flushPage();
        const prefix = idx === 0 ? '- ' : '  ';
        pageCommands.push(`BT /F2 9.5 Tf 0.15 0.15 0.15 rg 56 ${curY} Td (${escapePdfText(prefix + wl)}) Tj ET`);
        curY -= 13;
      });
      continue;
    }

    // Normal Paragraph
    const clean = stripMarkdown(rawLine);
    const wrapped = wrapPdfLine(clean, 82);
    for (const wl of wrapped) {
      if (curY < 60) flushPage();
      pageCommands.push(`BT /F2 9.5 Tf 0.15 0.15 0.15 rg 48 ${curY} Td (${escapePdfText(wl)}) Tj ET`);
      curY -= 13;
    }
    curY -= 3;
  }

  if (pageCommands.length > 0) flushPage();

  // Fill Catalog (1) and Pages (2)
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdfText = '%PDF-1.4\n';
  const offsets: number[] = [];

  for (let i = 0; i < objects.length; i++) {
    offsets.push(new TextEncoder().encode(pdfText).length);
    pdfText += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = new TextEncoder().encode(pdfText).length;
  pdfText += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdfText += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }

  pdfText += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(pdfText);
}

/**
 * Export document as standard PDF file and trigger browser download
 */
export function exportToPdf(options: ExportPdfOptions): void {
  const safeFilename = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;
  const pdfBytes = buildPdfDocument(options);
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  downloadBlob(blob, safeFilename);
}

/**
 * Format markdown to printable HTML document and trigger browser print/save-as-pdf dialog
 */
export function printFormattedDocument(
  title: string,
  content: string,
  metadata?: {
    notebookTitle?: string;
    date?: string;
    type?: string;
  }
): void {
  if (typeof window === 'undefined') return;

  const htmlContent = content
    .replace(/^### (.*$)/gim, '<h3 style="font-size:13pt; margin:16pt 0 6pt; color:#18181b;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size:15pt; margin:20pt 0 8pt; color:#18181b; border-bottom:1px solid #e4e4e7; padding-bottom:4pt;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size:19pt; margin:24pt 0 10pt; color:#18181b;">$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/`{3}([\s\S]*?)`{3}/gim, '<pre style="background:#f4f4f5; padding:10pt; border-radius:6pt; font-family:monospace; font-size:9pt; margin:10pt 0; white-space:pre-wrap;">$1</pre>')
    .replace(/`([^`]+)`/gim, '<code style="background:#f4f4f5; padding:2pt 4pt; border-radius:4pt; font-family:monospace; font-size:9pt;">$1</code>')
    .replace(/^\s*[-*+]\s+(.*$)/gim, '<li style="margin-left:18pt; margin-bottom:4pt;">$1</li>')
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li style="margin-left:18pt; margin-bottom:4pt;">$1</li>')
    .replace(/\n\n/gim, '<p style="margin:8pt 0; line-height:1.6;"></p>');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  const printDate = metadata?.date || new Date().toLocaleDateString(undefined, { dateStyle: 'long' });
  const metaString = [
    metadata?.notebookTitle ? `<strong>Notebook:</strong> ${metadata.notebookTitle}` : '',
    metadata?.type ? `<strong>Format:</strong> ${metadata.type}` : '',
    printDate,
  ].filter(Boolean).join(' &nbsp;•&nbsp; ');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @page {
          size: A4;
          margin: 20mm;
        }
        body {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 11pt;
          line-height: 1.6;
          color: #18181b;
          background: #ffffff;
          margin: 0;
          padding: 24px;
        }
        h1, h2, h3, h4 {
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          font-weight: 700;
        }
        .header {
          border-bottom: 2px solid #18181b;
          padding-bottom: 12px;
          margin-bottom: 24px;
        }
        .title {
          font-size: 22pt;
          font-weight: 800;
          margin: 0 0 6px 0;
          color: #09090b;
        }
        .meta {
          font-size: 9pt;
          color: #71717a;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .content {
          margin-top: 18px;
        }
        li {
          line-height: 1.5;
        }
        @media print {
          body {
            padding: 0;
          }
          button {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${title}</h1>
        <div class="meta">${metaString}</div>
      </div>
      <div class="content">
        ${htmlContent}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.close();
          }, 250);
        };
      </script>
    </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Format an entire conversation into structured Markdown for full chat export
 */
export function formatConversationForExport(
  messages: Array<{ role: string; content: string; createdAt?: any }>,
  notebookTitle?: string,
  chatTitle?: string
): string {
  const title = chatTitle || 'Chat Conversation';
  const dateStr = new Date().toLocaleDateString(undefined, { dateStyle: 'full' });

  let md = `# ${title}\n`;
  if (notebookTitle) md += `**Notebook:** ${notebookTitle}\n`;
  md += `**Export Date:** ${dateStr}\n\n---\n\n`;

  for (const msg of messages) {
    const isUser = msg.role === 'user';
    const roleName = isUser ? '🧑 You' : '🤖 Learning Partner';
    md += `### ${roleName}\n\n`;
    md += `${msg.content.trim()}\n\n`;
    md += `---\n\n`;
  }

  return md;
}
