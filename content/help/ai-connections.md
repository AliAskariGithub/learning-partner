---
title: "Connecting Your AI Providers (BYOK)"
summary: "Detailed instructions for connecting Google Gemini, ChatGPT Plus/Pro, Anthropic, OpenAI, Groq, and custom self-hosted inference servers."
category: "AI Connections"
order: 5
lastUpdated: "November 4, 2026"
relatedArticles: ["getting-started", "troubleshooting"]
---

## Why Bring Your Own AI?

Learning Partner does not mark up per-token API prices or trap you behind expensive monthly SaaS tiers. By connecting your own API keys or subscriptions:
1. You only pay provider wholesale rates (often fractions of a cent per study session), or use free tiers.
2. You control data privacy agreements directly with each AI provider.
3. You can switch models instantly without losing your study materials, sources, or memory.

---

## 1. Google Gemini Key (Recommended)

Google offers a generous free tier for developers and students.

### How to Get Your Key:
1. Visit **Google AI Studio**: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with your Google account.
3. Click **Create API Key** and copy the string (starts with `AIzaSy...`).
4. In Learning Partner, open the model selector, choose **Gemini**, and paste your key.

### Free-Tier Limits & Privacy:
- **Rate Limits**: Typically 15 requests per minute (RPM) and 1,500 requests per day (RPD) on the Gemini 2.5/3.8 Flash free tier.
- **Privacy Notice**: Per Google's official developer terms, prompts sent on the Free Tier may be reviewed by human annotators to train Google models. If you require strict non-training privacy, Google requires enabling billing for paid-tier access or using Anthropic/OpenAI.

---

## 2. OpenAI API Key

1. Visit the **OpenAI Developer Platform**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new secret key (starts with `sk-proj-...`).
3. Set a monthly billing cap in your OpenAI account settings (e.g., $5.00/month) to prevent unexpected charges.
4. Paste the key in Learning Partner. All responses use the OpenAI official API, which does not train models on customer API data.

---

## 3. Anthropic Claude Key

1. Visit the **Anthropic Console**: [https://console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Generate an API key (starts with `sk-ant-...`).
3. Paste into Learning Partner. Anthropic provides strong reasoning and long context windows for research papers.

---

## 4. Groq & OpenRouter

- **Groq** (`console.groq.com`): Ultra-fast inference on open models like Llama 3 and Mistral.
- **OpenRouter** (`openrouter.ai`): A unified aggregator providing access to hundreds of open-source and proprietary models with customizable routing.

---

## 5. Custom Self-Hosted Endpoints

If you run local inference models using **Ollama**, **vLLM**, or **LocalAI**:
1. Configure your endpoint URL (e.g., `http://192.168.1.100:11434/v1` or public tunnel).
2. Choose **Server Mode** (proxied through the application server with SSRF filtering) or **Browser Mode** (direct browser-to-server requests for local networks).
3. Specify your model identifier.

