---
title: "Troubleshooting Common Issues"
summary: "Resolve 429 quota exhaustion errors, model capability mismatches, PDF text extraction warnings, and connection timeouts."
category: "Troubleshooting"
order: 8
lastUpdated: "November 4, 2026"
relatedArticles: ["getting-started", "sources", "ai-connections"]
---

## 1. "429 Too Many Requests" or Quota Exceeded

### Why It Happens:
This error originates from your AI provider (e.g. Google Gemini or OpenAI), not Learning Partner. Free-tier accounts have daily or per-minute rate caps (for example, 15 requests per minute or 20 daily free requests on newer preview models).

### How to Fix:
1. **Wait for the Reset**: Provider rate limits typically reset every 60 seconds (for RPM) or at midnight UTC (for RPD).
2. **Switch Models**: In the model dropdown, select another available model (e.g., switch from `gemini-3.8-flash` to `gemini-2.5-flash` or connect an OpenAI or Groq key).
3. **Enable Provider Billing**: Adding a payment method to your Google AI Studio or OpenAI account removes free-tier throttling.

---

## 2. "Model Finished Without Generating Text"

### Why It Happens:
This occurs when:
- An API key has expired, been revoked, or lacks access to the chosen model.
- A model has been deprecated by the provider (e.g., Google retiring older flash revisions).
- Provider-side safety filters triggered a refusal.

### How to Fix:
1. Open the model selector and choose **Configure Connections**.
2. Verify that your API key is valid and has not been deleted on the provider console.
3. Test with a standard query such as *"Summarize chapter 1"*.

---

## 3. "0 Words • Error" on Uploaded PDF

### Why It Happens:
Learning Partner extracts selectable digital text from PDF files. If a PDF consists of flat scanned images or photocopied paper without an embedded OCR text layer, the text extractor finds zero words.

### How to Fix:
1. Open the PDF on your computer and verify that you can click and highlight individual words with your cursor.
2. If text cannot be highlighted, run the document through an Optical Character Recognition (OCR) tool (e.g., Adobe Acrobat, Google Drive, or free OCR utilities) before uploading.
3. Click the source card and press **Retry Ingestion**.

---

## 4. "Feature Disabled by Capability Gate"

### Why It Happens:
Certain advanced study features require specific model capabilities:
- **Image Uploads in Learning Mode**: Requires a model with vision support (e.g. Gemini 3.8 Flash, GPT-4o, Claude 3.5 Sonnet).
- **Interactive Quizzes**: Requires a model with reliable JSON schema / structured output support.
- **Audio Overviews**: Requires a connected Google Gemini or OpenAI key for speech synthesis (or you can use the Basic Voice browser fallback).

### How to Fix:
Hover over the disabled feature to see the exact capability requirement, then switch to a model supporting that feature.

---

## Still Need Help?

- Send us a message via [/contact](/contact).
- Report a technical bug or interface defect via [/feedback](/feedback).

