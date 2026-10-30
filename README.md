# Learning Partner

> An open-source, source-grounded AI research and study companion combining the clean UX and memory instructions of **Claude Projects** with the strict source grounding, citation chips, and Studio outputs of **Google NotebookLM**.

---

## 🚀 Key Features

### 1. Strict Source Grounding & Anti-Hallucination
- **Multi-Format Ingestion**: Upload lecture slides, research papers, notes, and web URLs (`.pdf`, `.docx`, `.txt`, `.md`, live Web URLs).
- **SSRF Protection**: Ingestion pipeline automatically verifies URLs and rejects internal, local, and cloud metadata IP ranges (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
- **Verifiable Citation Chips**: Every factual assertion contains interactive bracketed citations (`[1]`, `[2]`) that map directly to underlying source chunks.
- **Absence of Information Protocol**: If source documents do not contain evidence for a question, the model explicitly responds: *"I could not find information about that in the provided sources."*

### 2. "Connect your AI" Architecture (Phase 5)
- **Primary Option 1: "Use Gemini Key" (Recommended)**:
  - 3-step guided setup with direct link to Google AI Studio.
  - One key powers everything: Grounded Chat, vector retrieval, Structured Outputs (Quiz/Flashcards), and Gemini TTS Audio Overviews.
  - **Factual Privacy Notice**: Transparent mustard-yellow disclosure highlighting that Google free-tier prompt data may be reviewed by human evaluators to improve Google products under Google terms (`https://ai.google.dev/gemini-api/terms`), advising paid-tier keys for sensitive documents.
  - Friendly rate-limit handling with exponential retry guidance.
- **Primary Option 2: "Connect with ChatGPT" (OAuth Plan Usage)**:
  - RFC 7636 Authorization Code + PKCE (`chatgpt.tokens.use.direct` scope).
  - Enables ChatGPT Plus and Pro subscribers to power inference using their existing ChatGPT plan allowance without buying API credits.
  - Automatic error mapping: HTTP 429 usage cap mapped to `capped_or_exhausted` with direct link to ChatGPT settings; HTTP 403 mapped to `not_eligible`.
  - Opt-in automatic fallback to a Gemini Key when plan allowance runs out.
- **Secondary Options ("Want to use another platform?")**:
  - Honest labeling: Claude via Anthropic API Key (disclosing that Claude Pro/Max consumer subscriptions cannot be used in third-party apps), OpenAI API Key, OpenRouter (API Key or 1-click OAuth PKCE), and Groq Key.
- **OmniRoute & Self-Hosted Gateways**:
  - **Server Mode**: Connects via public HTTPS tunnel with comprehensive SSRF protection (DNS resolution, RFC 1918 & cloud metadata subnet blocking, redirect re-checks, 15s timeout, 5MB limit).
  - **Browser Mode**: Zero-trust key isolation for local machines (`http://localhost:20128/v1`). Gateway keys are stored strictly in client-side **IndexedDB** and never sent to our servers.

### 3. Privacy-First Cookies & Consent
- **Zero Third-Party Trackers**: No advertising pixels or invasive behavioral telemetry.
- **Global Privacy Control (GPC)**: Automatically honors `Sec-GPC` / `navigator.globalPrivacyControl` signals by defaulting all non-essential cookies to disabled.
- **Consent Preference Center**: Granular category toggles, live cookie inventory at `/cookies`, and a one-click "Delete all non-essential cookies now" action.

### 4. Studio Synthesis Suite (7 Core Tools)
Exactly seven studio synthesizers:
1. **Quiz**: Interactive multiple-choice & conceptual quizzes, instant explanations, final score calculation, and "Retry Missed Questions".
2. **Flashcards**: 3D flip card recall with keyboard shortcuts (`Space` to flip, `Arrow` keys to navigate), "Know It" / "Still Learning" tracking, and shuffle.
3. **Study Guide**: Structured serif document with sticky Table of Contents, Key Concepts, Glossary, Review Questions, and Next Steps.
4. **Summary (Briefing Doc)**: Executive briefing with a 1-paragraph overview, key bullet points, and detailed sections with inline citations.
5. **Mind Map**: Interactive, zoomable and collapsible concept tree with click-to-preview source excerpts.
6. **Report**: Publication-quality formal reports with style choices (Briefing, Essay, Blog Post, Custom) and inline citations.
7. **Voice Overview**: Conversational audio podcast between two named co-hosts (Alex and Jordan) or a solo voice-over narration. Includes an interactive live transcript, speed controls (0.75x–2x), skip ±15s, and a persistent floating mini-player.
   - **TTS Providers**: Google Gemini TTS (`gemini-3.8-flash-tts` voices), OpenAI TTS (`tts-1` voices), and a free client-side "Basic Voice" fallback using browser Web Speech API.

### 4. Settings & Data Portability
- **5 Comprehensive Tabs**: Profile, Custom Instructions (with quick-fill presets), API Keys (with dedicated Voice provider selection), Appearance (Dark / Light / System), and Data & Privacy.
- **Data Portability**: One-click "Export All My Data" creates a complete JSON backup archive of all notebooks, sources, notes, and studio outputs.
- **Permanent Account Deletion**: Typed confirmation dialog (`delete my account`) guarantees irreversible data removal from Neon Postgres.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions, React 19)
- **Database**: [Neon](https://neon.tech/) Serverless Postgres with pgvector and full-text search (`tsvector`)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Auth**: Neon Auth with session cookies, 6-digit email OTP verification, and password reset flows
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/groq`)
- **Styling**: Tailwind CSS, Claude Warm Charcoal Dark Theme (`#191919`, `#1f1f1f`), Framer Motion, GSAP ScrollTrigger
- **Storage**: `@vercel/blob` with fallback to local disk storage adapter

---

## ⚙️ Environment Variables Reference

Create a `.env.local` file in the root directory:

```env
# Database Connection (Neon Serverless Postgres)
DATABASE_URL=postgresql://user:password@ep-example.us-east-2.aws.neon.tech/neondb?sslmode=require

# Encryption Key for BYOK (Must be a 32-byte secret string or 64-char hex)
ENCRYPTION_KEY=your-32-character-secret-key-goes-here!

# Better Auth / Session Secret
BETTER_AUTH_SECRET=your-random-32-character-auth-secret
BETTER_AUTH_URL=http://localhost:3000

# Optional: Default Google Gemini Key for keyless fallback
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...

# Optional: Vercel Blob Read/Write Token for cloud storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

---

## 🧪 Testing

Run the critical paths test suite:

```bash
npm test
```

This verifies:
- AES-256-GCM encryption, decryption, and integrity tamper detection
- SSRF URL protection against private and metadata IP ranges
- Grounded citation chip parsing (`[1]`, `[2]`)
- Voice overview multi-speaker script JSON schema validation
- Sliding window rate limiting logic

---

## 🚢 Deployment to Vercel + Neon

1. **Create Neon Database**:
   - Provision a project at [Neon](https://neon.tech).
   - Copy the connection string to `DATABASE_URL`.

2. **Initialize Database Tables**:
   - Run the initial migrations to create `notebooks`, `sources`, `source_chunks`, `notes`, `api_keys`, `conversations`, `messages`, and `outputs`:
   ```bash
   node --env-file=.env.local scripts/migrate-outputs.mjs
   ```

3. **Deploy to Vercel**:
   - Push repository to GitHub.
   - Import the project into [Vercel](https://vercel.com).
   - In **Project Settings -> Environment Variables**, configure:
     - `DATABASE_URL`
     - `ENCRYPTION_KEY`
     - `BETTER_AUTH_SECRET`
     - `BETTER_AUTH_URL` (Set to your production domain: `https://your-domain.vercel.app`)
     - `BLOB_READ_WRITE_TOKEN` (Create a Vercel Blob store in the Storage tab)
   - Deploy!

---

## 📋 Phase 1–4 Checklist

- [x] **Phase 1**: Design system (Claude warm charcoal `#191919`, Geist font, semantic colors, Lenis smooth scroll).
- [x] **Phase 2**: Notebooks, multi-source ingestion (PDF, DOCX, TXT, MD, URL), chunking, full-text tsvector search & vector embeddings.
- [x] **Phase 3**: BYOK key manager (AES-256-GCM), model switcher with capability gating, grounded chat with citations, Chat/Learn/Quiz modes.
- [x] **Phase 4**:
  - [x] Database `outputs` table with Neon index migrations.
  - [x] Exactly seven studio synthesizers: Quiz, Flashcards, Study Guide, Summary, Mind Map, Report, Voice.
  - [x] Dedicated Viewers for each type with copy, export, and "Listen" integration.
  - [x] Voice Overview pipeline (2-host podcast and solo narration) with Gemini TTS, OpenAI TTS, and Web Speech API fallback.
  - [x] Floating Mini Player with seek bar, playback speed, skip ±15s, and live interactive transcript.
  - [x] 5 Settings tabs: Profile, Custom instructions (with presets), API keys (with Voice provider selector), Appearance, Data & Privacy.
  - [x] GSAP ScrollTrigger pinned storytelling landing page, BYOK highlight, and FAQ accordion.
  - [x] Responsive 3-panel workspace (drawers on tablet, bottom tabs on mobile).
  - [x] Security audit: SSRF protection, rate limiting, access-controlled storage URLs, per-user limits.
  - [x] Critical path test suite passing 100%.
