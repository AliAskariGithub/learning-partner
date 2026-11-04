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

### 5. Three Distinct Chat Modes (Phase 6)
- **Chat Mode (Simple Conversation)**:
  - Clean, minimal layout inspired by Claude with soft user bubbles and readable serif assistant typography.
  - Natural answers grounded strictly in the notebook's enabled sources with citation chips.
  - Clear semantic labeling when content draws from beyond sources: `[Not from your sources]`.
  - Empty state with cached source-derived prompt ideas and auto-titled conversations.
- **Learning Mode (Focus Mode)**:
  - Distraction-free single-column study view via Framer Motion layout transition (collapses Context and Studio sidebars).
  - Study toolbar with topic indicator, "Save to Notes" session button, and "Exit Focus" trigger.
  - Multimodal image uploads (PNG, JPEG, WebP) via "+" button, drag-and-drop, and clipboard paste.
  - Full-screen zoomable lightbox for inspection of attached homework, diagrams, and textbook pages.
  - Vision capability gating with `<CapabilityGate>` for non-vision models.
  - Patient Socratic tutor persona with step-by-step breakdowns, hints before answers, and checks for understanding.
  - Tutor quick-action chips under assistant messages: "Explain simpler", "Go deeper", "Give an example", and "Test me" (3 short inline check questions).
- **Quiz Mode (Interactive Quizzes with Live Scoring)**:
  - Dedicated mode that exclusively produces interactive quizzes. Non-quiz conversational requests prompt friendly guidance to switch modes.
  - Setup card: customize question count (5, 10, 15, 20), difficulty, question types, and countdown timer.
  - Play UI centerpiece: full-width card flow with slim progress bar, streak counter, live score chip, and letter badges (A–D). Full keyboard shortcut navigation (`A`–`D`, `1`–`4`, `Enter` to confirm/next).
  - Instant answer validation with green/red semantic feedback and expandable explanation panel with source citations.
  - Comprehensive results screen: animated score ring, time taken, accuracy percentage, best streak, topic breakdown, and "Retry Missed Questions". Weak topics are automatically recorded in notebook memory.

### 6. Shared Notebook Memory (Phase 6)
- **One Shared Context Per Notebook**:
  - Unifies memory across Chat, Learning, and Quiz modes within a single notebook.
  - Durable item types: `goal`, `preference`, `knowledge_level`, `misconception`, `weak_topic`, `strong_topic`, `decision`, `fact`.
- **Consolidation Pipeline**:
  - Non-blocking background extraction and summarization using the cheapest suitable connected model (e.g. Gemini Flash or Groq).
  - Automatically deduplicates items, resolves conflicts, and keeps the notebook memory summary under a strict 1,500 token budget.
- **Strict Priority Context Assembly (`assembleContext`)**:
  - Multi-tier priority ordering: P1 (Grounding rules) → P2 (User custom instructions) → P3 (Notebook instructions) → P4 (Memory summary & pinned items) → P5 (Source chunks) → P6 (Past conversation snippets) → P7 (Recent messages).
  - Bottom-up token budgeting ensures safety, custom instructions, and memory are never trimmed during long study sessions.
- **Notebook Memory UI & Management**:
  - Dedicated "Notebook Memory" card on the notebook home page with filter chips, pinned items, and live summary.
  - Interactive item controls: pin, edit, delete, "Clear All Memory", and Markdown export.
  - Individual message action: "Forget this" button on assistant messages to remove a conversation's influence from memory.

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


---

## 🌐 Phase 7: Public Website Pages & Documentation

A full suite of public marketing, documentation, legal, and operational pages built with high-fidelity typography, Lenis smooth scrolling, GSAP ScrollTrigger, and strict factual grounding:

### Public Routes
- **About (`/about`)**: Mission, student problem statement, architectural differences, target audience, maintainer background, and `Organization` JSON-LD.
- **Features (`/features`)**: Scroll-driven tour featuring miniature real UI components, source formats, citations, the 3 modes, the 7 studio tools, shared memory, and capability gating.
- **How It Works (`/how-it-works`)**: 3-step GSAP storytelling guide (Add sources &rarr; Ask/Learn/Quiz &rarr; Study in Studio) with an honest, plain-language "Under the Hood" retrieval explanation.
- **Connect Your AI Guide (`/connect-ai`)**: Step-by-step BYOK setup for Google Gemini Free Tier, ChatGPT Plus/Pro OAuth, Anthropic Claude, OpenAI, Groq, OpenRouter, and custom endpoints (Server Mode vs. Browser Mode).
- **Pricing (`/pricing`)**: Honest $0 platform software cost, provider wholesale cost comparison table, and rate limit explanations (no fake plans, no payment forms).
- **FAQ (`/faq`)**: Framer Motion searchable accordion grouped by 8 topics with `FAQPage` JSON-LD schema.
- **Contact (`/contact`)**: Form with honeypot, 3s submission time check, sliding window rate limits, salted IP hashing, save-first DB storage, and Resend email notification.
- **Feedback & Bug Reports (`/feedback`)**: Bug report submission with type, severity, reproduction steps, automated non-sensitive client context, and screenshot uploads (PNG/JPEG/WebP, magic bytes validation, EXIF metadata stripped).
- **Security (`/security`)**: Plain-language overview of AES-256-GCM encryption, tenant database isolation, SSRF defense, upload screening, and vulnerability disclosure policy (no unverified certifications).
- **Help Center (`/help` and `/help/[slug]`)**: File-based markdown documentation (`/content/help/*.md`) with instant search, category sidebar, breadcrumbs with `BreadcrumbList` JSON-LD, previous/next navigation, and related articles.
- **Example Use Cases (`/use-cases`)**: Realistic study workflows (midterm exam prep, textbook photo problem solving, research summarization, active recall retesting, and audio commute).
- **Legal Policies (`/privacy` and `/terms`)**: Comprehensive file-based markdown documents (`/content/legal/*.md`) with dynamic Table of Contents, effective dates, and legal review notices.
- **Owner Admin Inbox (`/admin/inbox`)**: Private administrative inbox for reviewing contact messages and feedback reports, filtered by status, with private notes and server authorization (returns HTTP 404 to unauthorized visitors; `noindex`).

### Scripts & Verification Tools
- `npm run check:placeholders`: Audits all `[[CONFIRM: ...]]` placeholders across configuration and content files.
- `npm run check:links`: Verifies that all internal links across marketing and documentation pages resolve to valid routes.
- `node scripts/cleanup-ip-hashes.mjs`: Anonymizes IP hashes older than the configured 30-day retention window.
