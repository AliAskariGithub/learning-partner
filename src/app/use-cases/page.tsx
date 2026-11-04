import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/layout/PageShell';
import { Card, Badge, Button } from '@/components/ui';
import { siteConfig } from '@/config/site';
import { getSession } from '@/lib/auth/session';
import {
  GraduationCap,
  BookOpen,
  FileText,
  HelpCircle,
  Headphones,
  ArrowRight,
  CheckCircle,
  Paperclip,
  Layers,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Example Use Cases — ${siteConfig.name}`,
  description:
    'Explore realistic study scenarios: preparing for midterm exams, working through photographed textbook equations, generating flashcards, and commuting with voice overviews.',
  alternates: {
    canonical: `${siteConfig.url}/use-cases`,
  },
};

const SCENARIOS = [
  {
    id: 'exam-prep',
    badge: 'Scenario 1',
    title: 'Preparing for a University Midterm from Slides & Notes',
    description:
      'A student enrolled in an upper-division Biology course needs to synthesize 6 slide decks (PDF), a professor’s reading packet (DOCX), and personal lecture notes.',
    steps: [
      {
        step: 1,
        title: 'Create a Course Notebook',
        detail: 'Name the notebook "BIO 301 — Cellular Energetics" and paste the course syllabus into Notebook Instructions.',
      },
      {
        step: 2,
        title: 'Add Lecture Slides & Readings',
        detail: 'Upload the 6 slide decks and DOCX reading packets via "+ Add Source". The system indexes all 48,000 words into 60 passages.',
      },
      {
        step: 3,
        title: 'Query in Chat Mode with Citations',
        detail: 'Ask "Compare the regulatory mechanisms of glycolysis versus gluconeogenesis." The AI synthesizes a comparative table citing specific slide numbers.',
      },
      {
        step: 4,
        title: 'Generate a Study Guide',
        detail: 'Open the Studio panel and click "Study Guide". Save the resulting serif curriculum into your Saved Notes column.',
      },
    ],
  },
  {
    id: 'textbook-photos',
    badge: 'Scenario 2',
    title: 'Working Through STEM Problems via Photographed Textbook Pages',
    description:
      'A student working through a physical Calculus textbook needs step-by-step guidance understanding complex integration derivations without getting spoiled answers.',
    steps: [
      {
        step: 1,
        title: 'Select Learning Mode',
        detail: 'Switch the chat pill from Chat to "Learn Mode" (Socratic step-by-step tutor).',
      },
      {
        step: 2,
        title: 'Attach Textbook Photo',
        detail: 'Click the paperclip icon in the chat bar and upload a smartphone photo of the textbook page (PNG or JPEG).',
      },
      {
        step: 3,
        title: 'Guided Deductive Inquiry',
        detail: 'Ask: "I do not understand how the author transitioned from step 3 to step 4." The tutor highlights the intermediate algebraic substitution and asks you to evaluate the derivative before revealing the answer.',
      },
    ],
  },
  {
    id: 'research-synthesis',
    badge: 'Scenario 3',
    title: 'Turning a Dense Research Paper into Flashcards & Summary',
    description:
      'A graduate student needs to dissect a 30-page machine learning preprint on transformer attention mechanisms.',
    steps: [
      {
        step: 1,
        title: 'Ingest by Public URL',
        detail: 'Paste the arXiv paper URL into "+ Add Source". Our SSRF-safe parser extracts the full text and references.',
      },
      {
        step: 2,
        title: 'Generate Executive Summary',
        detail: 'Click "Summary" in the Studio panel. Review the core methodology, benchmark results, and stated limitations.',
      },
      {
        step: 3,
        title: 'Create Spaced Recall Flashcards',
        detail: 'Click "Flashcards" in Studio. Practice flipping through key definitions (e.g. KV-cache, rotary positional embeddings) to lock down terminology.',
      },
    ],
  },
  {
    id: 'quiz-revision',
    badge: 'Scenario 4',
    title: 'Targeted Revision from Quiz History & Shared Memory',
    description:
      'A professional certification candidate preparing for the Cloud Architect exam wants to test active recall and reinforce weak domains.',
    steps: [
      {
        step: 1,
        title: 'Take an Active Recall Quiz',
        detail: 'Switch to Quiz Mode and prompt: "Generate 5 tricky questions on identity federation and VPC peering."',
      },
      {
        step: 2,
        title: 'Live Interactive Scoring',
        detail: 'Click your answer choices. The system scores answers instantly, providing explanations and source citations for each choice.',
      },
      {
        step: 3,
        title: 'Automatic Memory Consolidation',
        detail: 'The notebook memory automatically records that you answered VPC peering transit routing incorrectly. On future prompts, the AI proactively reviews peering routing tables.',
      },
    ],
  },
  {
    id: 'voice-commute',
    badge: 'Scenario 5',
    title: 'Listening to an Audio Overview During a Commute',
    description:
      'A busy commuter wants to review history readings during a 25-minute train ride without staring at a screen.',
    steps: [
      {
        step: 1,
        title: 'Enable Relevant Chapters',
        detail: 'Check the boxes for Chapters 5 and 6 in the Sources panel.',
      },
      {
        step: 2,
        title: 'Generate Voice Overview',
        detail: 'Click "Voice Overview" in Studio. Select two co-hosts (Alex and Jordan) and select Google Gemini TTS or Basic Voice.',
      },
      {
        step: 3,
        title: 'Listen on Mobile',
        detail: 'Press Play and listen to the conversational dialogue exploring historical context, debates, and primary source excerpts with audio controls.',
      },
    ],
  },
];

export default async function UseCasesPage() {
  const session = await getSession();
  const isLoggedIn = !!session?.user;

  return (
    <PageShell
      title="Realistic Study Workflows"
      intro="See how students, researchers, and self-directed learners use Learning Partner to transform static PDFs and notes into active mastery."
      badge="Example Scenarios"
      isLoggedIn={isLoggedIn}
      maxWidth="xl"
    >
      <div className="space-y-12 sm:space-y-16">
        {/* Notice on Realism */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-border text-xs font-serif text-muted-foreground flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
          <span>
            <strong>Note on scenarios:</strong> These examples represent realistic workflows based strictly on features currently implemented in Learning Partner. We do not invent fake student testimonials or fabricated case studies.
          </span>
        </div>

        {/* Scenarios List */}
        <div className="space-y-8 sm:space-y-10">
          {SCENARIOS.map((scenario) => (
            <Card key={scenario.id} className="p-6 sm:p-8 bg-surface border-border space-y-6">
              <div className="space-y-2 border-b border-border/60 pb-4">
                <Badge variant="neutral">{scenario.badge}</Badge>
                <h3 className="font-display font-bold text-xl sm:text-2xl text-foreground">
                  {scenario.title}
                </h3>
                <p className="font-serif text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              {/* Exact App Steps */}
              <div className="space-y-4">
                <h4 className="font-display font-semibold text-xs text-brand-500 uppercase tracking-wider">
                  Step-by-Step App Actions:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {scenario.steps.map((st) => (
                    <div
                      key={st.step}
                      className="p-4 rounded-xl bg-surface-raised border border-border/70 space-y-1.5"
                    >
                      <div className="flex items-center gap-2 font-display font-bold text-xs text-foreground">
                        <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center text-[10px]">
                          {st.step}
                        </span>
                        {st.title}
                      </div>
                      <p className="font-serif text-xs text-muted-foreground leading-relaxed pl-7">
                        {st.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <section className="text-center py-6 border-t border-border space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
            Ready to build your own study workflow?
          </h2>
          <div className="flex items-center justify-center gap-3">
            {isLoggedIn ? (
              <Link href="/app">
                <Button variant="primary" size="lg">
                  Open Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button variant="primary" size="lg">
                  Get Started Free <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  );
}

