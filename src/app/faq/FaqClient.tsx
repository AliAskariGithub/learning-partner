'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge } from '@/components/ui';
import { Search, ChevronDown, HelpCircle, ArrowRight, X } from 'lucide-react';

interface FaqItem {
  id: string;
  topic: string;
  question: string;
  answer: string;
}

const FAQ_DATABASE: FaqItem[] = [
  // 1. Getting Started
  {
    id: 'gs-1',
    topic: 'Getting Started',
    question: 'How do I start studying with Learning Partner?',
    answer:
      'Create a free account, click "+ New Notebook" in your workspace, and upload your study materials (such as a lecture PDF, Word document, or web article). Then connect your AI key (Google Gemini free tier is recommended) and begin asking questions grounded in your uploaded documents.',
  },
  {
    id: 'gs-2',
    topic: 'Getting Started',
    question: 'Do I need a credit card to sign up?',
    answer:
      'No. Learning Partner requires zero credit card or billing details. The software is free and open-source, and you can study using Google Gemini’s free developer API key.',
  },

  // 2. Sources & Accuracy
  {
    id: 'src-1',
    topic: 'Sources & Accuracy',
    question: 'How does Learning Partner eliminate hallucinations?',
    answer:
      'Every answer is grounded in the source documents you have active. Our backend splits documents into semantic passages, performs dual full-text and vector retrieval, and enforces a strict absence-of-information rule: if your sources do not contain the answer, the AI explicitly states it cannot find that information rather than making up facts.',
  },
  {
    id: 'src-2',
    topic: 'Sources & Accuracy',
    question: 'What file formats can I upload?',
    answer:
      'Learning Partner supports PDF (.pdf), Microsoft Word (.docx), Markdown (.md), Plain Text (.txt), and live Web URLs. Files can be up to 25MB each, and you can attach up to 50 sources per notebook.',
  },
  {
    id: 'src-3',
    topic: 'Sources & Accuracy',
    question: 'Why does my PDF show "0 words • Error"?',
    answer:
      'Our engine extracts selectable digital text. If a PDF is a photocopy or scanned image without an embedded OCR text layer, our extractor finds zero words. Run the document through an OCR tool or re-upload a digitally exported PDF.',
  },

  // 3. Modes (Chat, Learn, Quiz)
  {
    id: 'mod-1',
    topic: 'Study Modes',
    question: 'What is the difference between Chat, Learn, and Quiz modes?',
    answer:
      'Chat mode provides fast, analytical answers with citation chips. Learn mode is an interactive Socratic tutor that guides you step-by-step and lets you attach photos of textbook problems. Quiz mode actively tests your memory with interactive multiple-choice questions, instant scoring, and explanations.',
  },
  {
    id: 'mod-2',
    topic: 'Study Modes',
    question: 'Can I upload photos of textbook pages or handwritten notes?',
    answer:
      'Yes! In Learning Mode, click the paperclip icon in the chat bar to attach up to 5 images (PNG, JPEG, WebP up to 10MB each). This requires selecting a vision-capable AI model (such as Gemini 3.8 Flash, GPT-4o, or Claude 3.5 Sonnet).',
  },

  // 4. Studio & Voice
  {
    id: 'stu-1',
    topic: 'Studio & Voice',
    question: 'How does the Voice Audio Overview work?',
    answer:
      'Studio Voice generates an engaging conversational script between two co-hosts (Alex and Jordan) who break down your documents like a podcast. Audio is synthesized using Google Gemini TTS, OpenAI TTS, or a zero-key Basic Voice browser fallback.',
  },
  {
    id: 'stu-2',
    topic: 'Studio & Voice',
    question: 'What other Studio Synthesizers are available?',
    answer:
      'In addition to Voice, Studio can generate: Practice Quizzes, Spaced Recall Flashcards, Structured Study Guides, Executive Summaries, Interactive Mind Maps, and Formal Academic Briefing Reports with citations.',
  },

  // 5. AI Connections & Keys
  {
    id: 'byok-1',
    topic: 'AI Connections & Keys',
    question: 'How does Bring Your Own Key (BYOK) protect my wallet?',
    answer:
      'Rather than paying $20+/month for third-party subscriptions, you connect directly to model providers. You can use Google Gemini’s free tier ($0), or pay providers wholesale per-token rates (often fractions of a cent per study session). Learning Partner adds zero markup.',
  },
  {
    id: 'byok-2',
    topic: 'AI Connections & Keys',
    question: 'Can I use my consumer Claude Pro or Gemini Advanced subscription?',
    answer:
      'No. Consumer web subscriptions from Anthropic and Google do not provide external API keys. You must generate an API key on Google AI Studio or Anthropic Console.',
  },
  {
    id: 'byok-3',
    topic: 'AI Connections & Keys',
    question: 'What is the difference between Server Mode and Browser Mode for custom endpoints?',
    answer:
      'Server Mode proxies requests through our secure backend with SSRF filtering. Browser Mode connects directly from your web browser to local services (e.g. localhost:11434 with Ollama) for 100% offline or LAN study sessions.',
  },

  // 6. Privacy & Data
  {
    id: 'priv-1',
    topic: 'Privacy & Data',
    question: 'Are my study documents used to train AI models?',
    answer:
      'Learning Partner never uses your documents or chats to train AI models. Your third-party AI provider processes data under their own terms: OpenAI and Anthropic commercial APIs explicitly prohibit training on customer data. For Google Gemini, the Free Tier permits human review/training, while their paid tier guarantees non-training privacy.',
  },
  {
    id: 'priv-2',
    topic: 'Privacy & Data',
    question: 'How are my API keys stored?',
    answer:
      'Your keys are encrypted using AES-256-GCM with unique initialization vectors before storage in Neon Postgres. Plaintext keys are never stored, never logged, and never returned to browser developer tools.',
  },

  // 7. Limits
  {
    id: 'lim-1',
    topic: 'Limits',
    question: 'What are the platform limits?',
    answer:
      'Each user can create up to 30 notebooks. Each notebook supports up to 50 sources (25MB max per document), 100 saved notes, and 100 studio outputs. Ingestion rate limits apply to prevent denial-of-service abuse.',
  },
  {
    id: 'lim-2',
    topic: 'Limits',
    question: 'Why did I receive a 429 "Too Many Requests" error?',
    answer:
      'This limit is set by your chosen AI provider (e.g. Google Gemini free-tier daily cap). Rate limits typically reset within 60 seconds (for per-minute caps) or midnight UTC. You can switch models or enable provider billing to remove limits.',
  },

  // 8. Account
  {
    id: 'acc-1',
    topic: 'Account',
    question: 'Can I export or delete all my study data?',
    answer:
      'Yes. In Settings, you can download a full, structured JSON backup of your notebooks, sources, notes, chats, memory, and outputs. You can also permanently delete your account with one click, which instantly wipes all records and credentials from Neon Postgres and Neon Auth.',
  },
];

export function FaqClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState<string>('All');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'gs-1': true,
    'src-1': true,
  });

  const topics = useMemo(() => {
    const list = Array.from(new Set(FAQ_DATABASE.map((item) => item.topic)));
    return ['All', ...list];
  }, []);

  const filteredItems = useMemo(() => {
    return FAQ_DATABASE.filter((item) => {
      const matchesTopic = activeTopic === 'All' || item.topic === activeTopic;
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTopic && matchesSearch;
    });
  }, [searchQuery, activeTopic]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Structured Data (FAQPage JSON-LD)
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATABASE.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Search Input */}
      <div className="relative max-w-xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions (e.g. citations, Gemini limits, memory)..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-surface border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Topic Filter Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {topics.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTopic(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-display font-semibold transition-all cursor-pointer ${
              activeTopic === t
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-surface border border-border/80 text-muted-foreground hover:text-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-surface border border-border rounded-2xl space-y-2">
            <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto" />
            <h3 className="font-display font-semibold text-foreground text-sm">No matching questions found</h3>
            <p className="font-serif text-xs text-muted-foreground">
              Try adjusting your search terms or send us a direct message.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isOpen = Boolean(openItems[item.id]);
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-surface border border-border/80 overflow-hidden transition-colors hover:border-border"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 font-display font-bold text-xs sm:text-sm text-foreground hover:text-brand-500 transition-colors cursor-pointer"
                >
                  <span className="flex-1 leading-snug">{item.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-500' : ''
                    }`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm font-serif text-muted-foreground leading-relaxed border-t border-border/40">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      {/* Still Have a Question? CTA */}
      <Card className="p-6 sm:p-8 bg-surface-raised border-border text-center space-y-3">
        <h3 className="font-display font-bold text-lg sm:text-xl text-foreground">
          Still have a question?
        </h3>
        <p className="font-serif text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Can’t find what you’re looking for? Reach out directly to our maintainer through our contact form.
        </p>
        <div className="pt-2">
          <Link href="/contact">
            <Button variant="primary" size="md">
              Contact Us <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

