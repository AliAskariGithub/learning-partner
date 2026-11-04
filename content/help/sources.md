---
title: "Adding and Managing Sources"
summary: "Understand supported document formats, chunking boundaries, toggling sources on or off, and resolving ingestion warnings."
category: "Sources"
order: 2
lastUpdated: "November 4, 2026"
relatedArticles: ["getting-started", "modes", "troubleshooting"]
---

## Supported Source Formats

Learning Partner supports five main ingestion channels:

| Format | Extension / Protocol | Maximum File Size | Notes |
| :--- | :--- | :--- | :--- |
| **PDF Documents** | `.pdf` | 25 MB | Text-based PDFs; scanned images require searchable OCR text layer. |
| **Word Documents** | `.docx` | 25 MB | Extracts structured headings, tables, and paragraphs. |
| **Markdown** | `.md` | 25 MB | Preserves code snippets, lists, and hierarchy. |
| **Plain Text** | `.txt` | 25 MB | Unformatted lecture notes and transcripts. |
| **Public Web URLs** | `http://` / `https://` | 10 MB extracted text | SSRF protected; blocks intranet and private IP addresses. |

---

## How Chunking and Indexing Work

When you upload a document, our server processes it through three distinct stages:

1. **Extraction**: The raw binary stream is read (using Mozilla's `unpdf` engine with multi-tier fallback for PDFs, or `mammoth` for DOCX).
2. **Passage Chunking**: Content is split into chunks of approximately **800 tokens** with a **100-token overlap** to ensure context is never lost across passage boundaries.
3. **Dual Indexing**:
   - **Postgres Full-Text Search**: English text is stemmed into tsvectors for exact keyword and terminology matches.
   - **Vector Embeddings**: High-dimensional semantic vectors are calculated to capture conceptual meaning even when exact words differ.

---

## Toggling Sources On and Off

You do not need to query all sources at once:

- In the left **Context** panel, click the checkbox beside any source to toggle it active or inactive.
- When an inactive source is unchecked, its chunks are excluded from retrieval for your next query.
- Use this to isolate specific chapters, compare differing viewpoints between two papers, or focus on a single lecture syllabus.

---

## Retrying Failed Ingestions

If a network interruption occurs or an upload encounters an issue:
1. An amber `Error` badge will appear on the source card.
2. Click the source card to open the **Source Details Dialog**.
3. Click the **Retry Ingestion** button. The server will re-retrieve the stored binary buffer and re-execute parsing.
4. If retrying fails repeatedly, verify that your PDF contains selectable digital text (not a flat scanned image) and is not password-protected.

---

## Document Deletion

Deleting a source immediately removes its raw file from storage and cascades deletion to all associated source chunks and citation links in Postgres.

