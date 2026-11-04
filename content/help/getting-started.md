---
title: "Getting Started with Learning Partner"
summary: "Create your first study notebook, add source documents, and ask grounded research questions with verifiable citation chips."
category: "Getting Started"
order: 1
lastUpdated: "November 4, 2026"
relatedArticles: ["sources", "modes", "ai-connections"]
---

## Overview

Learning Partner is designed around a simple, disciplined principle: **the AI only answers using information contained in the sources you enable.** When information cannot be found in your sources, the AI explicitly states it cannot find that information rather than guessing or hallucinating.

In this guide, you will learn how to set up your first notebook in under three minutes.

---

## Step 1: Create a Study Notebook

1. Sign in to your account and navigate to the [Workspace](/app).
2. Click the **+ New Notebook** button at the top of the sidebar.
3. Give your notebook a descriptive title (e.g., *"Cognitive Psychology Midterm"* or *"Distributed Systems Architecture"*).
4. Optionally, add custom instructions if you prefer a specific tone or focus (e.g., *"Explain engineering concepts using practical analogies"*).

---

## Step 2: Add Your Study Sources

Your notebook needs source documents before it can answer questions:

1. Click **+ Add Source** in the left-hand Sources panel.
2. Choose your source type:
   - **Upload File**: Drag and drop research PDFs, Word documents (`.docx`), Markdown (`.md`), or plain text (`.txt`) up to 25MB each.
   - **Web Link**: Paste a public article or documentation URL. Our ingestion engine fetches the text with built-in SSRF protection.
   - **Paste Text**: Paste raw notes, lecture transcripts, or syllabi directly.
3. Click **Upload & Process**. The system parses the document, splits it into semantic passages, and creates full-text search and vector indexes.
4. You will see the total word count and a green **Ready** indicator once processing is complete.

---

## Step 3: Connect an AI Model

Learning Partner operates on Bring Your Own AI (BYOK). To generate answers, you need to connect an AI provider:

1. Open the model selector in the chat bar at the bottom of the screen.
2. Select **Configure Connections** or choose **Google Gemini**.
3. For most students, we recommend obtaining a free API key from **Google AI Studio** (`aistudio.google.com/apikey`).
4. Paste your key and click **Save & Connect**. Your key is encrypted client-side using AES-256-GCM before storage.

---

## Step 4: Ask Your First Question

Type a question into the chat input and press **Enter**:

- *"What are the primary differences between the two memory architectures described in chapter 3?"*
- *"Summarize the experimental findings on page 12."*

Notice the bracketed citation chips (`[1]`, `[2]`) in the response. Clicking any citation chip highlights the exact paragraph in your original source document.

---

## What to Read Next

- [Supported Source Formats & Best Practices](/help/sources)
- [Using Chat, Learning, and Quiz Modes](/help/modes)
- [Generating Flashcards, Study Guides, and Voice Audio Overviews](/help/studio)

