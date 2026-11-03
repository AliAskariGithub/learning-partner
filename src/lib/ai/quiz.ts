import { z } from 'zod';
import { db } from '@/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { quizAttempts, memoryItems, outputs, QuizPerQuestionResult } from '@/db/schema';
import { filterSecrets } from '@/lib/ai/context';

export const QuizQuestionTypeEnum = z.enum([
  'multiple_choice',
  'true_false',
  'multiple_select',
  'short_answer',
]);

export type QuizQuestionType = z.infer<typeof QuizQuestionTypeEnum>;

export const QuizQuestionSchema = z.object({
  id: z.string(),
  type: QuizQuestionTypeEnum.default('multiple_choice'),
  question: z.string().min(3),
  options: z.array(z.string()).default([]),
  correctIndex: z.union([z.number(), z.array(z.number()), z.string()]),
  correctAnswerText: z.string().optional(),
  explanation: z.string().min(5),
  hint: z.string().optional(),
  topicTag: z.string().default('Core Concepts'),
  citationSnippet: z.string().optional(),
  sourceTitle: z.string().optional(),
  sourceId: z.string().optional(),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizPayloadSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  topicTags: z.array(z.string()).default([]),
  questions: z.array(QuizQuestionSchema).min(1),
});

export type QuizPayload = z.infer<typeof QuizPayloadSchema>;

/**
 * Checks if user input is intended as a quiz topic or if it's an unrelated general question.
 */
export function isQuizIntent(input: string): { isQuiz: boolean; suggestedTopic?: string } {
  const text = input.trim().toLowerCase();

  // Explicit quiz keywords
  const quizKeywords = [
    'quiz',
    'test',
    'exam',
    'questions',
    'multiple choice',
    'mcq',
    'flashcard',
    'assessment',
    'evaluate me',
    'practice',
    'knowledge check',
    'trivia',
  ];

  if (quizKeywords.some((kw) => text.includes(kw))) {
    return { isQuiz: true };
  }

  // Conversational questions that are clearly not a quiz topic request
  const conversationalStarters = [
    'what is',
    'who is',
    'explain',
    'how does',
    'why is',
    'can you tell me',
    'summarize',
    'write an essay',
    'help me with',
    'hello',
    'hi',
    'how are you',
  ];

  const looksConversational = conversationalStarters.some((s) => text.startsWith(s));
  if (looksConversational) {
    const topic = input
      .replace(/^(what is|who is|explain|how does|why is|can you tell me about|help me with)\s+/i, '')
      .replace(/[?.]+$/, '')
      .trim();
    return {
      isQuiz: false,
      suggestedTopic: topic ? `Quiz on ${topic}` : undefined,
    };
  }

  // Short topic titles like "Quantum mechanics", "Chapter 4", "Raft algorithm" are accepted as quiz topics
  if (input.split(/\s+/).length <= 8) {
    return { isQuiz: true };
  }

  return { isQuiz: true };
}

/**
 * Records a completed quiz attempt, calculates score, and feeds weak/strong topics into shared notebook memory.
 */
export async function saveQuizAttempt(params: {
  quizId: string;
  notebookId: string;
  userId: string;
  answers: Record<string, any>;
  perQuestionResults: QuizPerQuestionResult[];
  durationSeconds: number;
}) {
  const { quizId, notebookId, userId, answers, perQuestionResults, durationSeconds } = params;

  const totalQuestions = perQuestionResults.length;
  const correctCount = perQuestionResults.filter((q) => q.isCorrect).length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // 1. Insert attempt
  const [attempt] = await db
    .insert(quizAttempts)
    .values({
      quizId,
      notebookId,
      userId,
      answers,
      score,
      totalQuestions,
      durationSeconds,
      perQuestionResults,
    })
    .returning();

  // 2. Feed signals into shared notebook memory
  try {
    for (const q of perQuestionResults) {
      const tag = (q.topicTags && q.topicTags[0]) || 'General';
      if (q.isCorrect) {
        await db.insert(memoryItems).values({
          notebookId,
          userId,
          type: 'strong_topic',
          text: `Mastered topic: ${tag} (${q.question.slice(0, 80)}...)`,
          confidence: 90,
          sourceMode: 'quiz',
          pinned: false,
        });
      } else {
        await db.insert(memoryItems).values({
          notebookId,
          userId,
          type: 'weak_topic',
          text: `Needs review: ${tag} - struggled with: ${q.question.slice(0, 80)}...`,
          confidence: 85,
          sourceMode: 'quiz',
          pinned: false,
        });
      }
    }
  } catch (memErr) {
    console.warn('Failed to record quiz memory signals:', memErr);
  }

  return attempt;
}

/**
 * Fetches recent quiz attempts for a notebook, plus aggregates for charts.
 */
export async function getNotebookQuizHistory(notebookId: string, userId: string) {
  const attempts = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.notebookId, notebookId), eq(quizAttempts.userId, userId)))
    .orderBy(desc(quizAttempts.completedAt))
    .limit(10);

  let totalScore = 0;
  attempts.forEach((a) => {
    totalScore += a.score;
  });

  const averageScore = attempts.length > 0 ? Math.round(totalScore / attempts.length) : 0;

  // Breakdown by topic tags
  const topicStats: Record<string, { correct: number; total: number }> = {};

  attempts.forEach((a) => {
    const results = a.perQuestionResults || [];
    results.forEach((r) => {
      const tag = (r.topicTags && r.topicTags[0]) || 'General';
      if (!topicStats[tag]) topicStats[tag] = { correct: 0, total: 0 };
      topicStats[tag].total += 1;
      if (r.isCorrect) topicStats[tag].correct += 1;
    });
  });

  return {
    attempts,
    averageScore,
    totalQuizzes: attempts.length,
    topicStats,
  };
}

