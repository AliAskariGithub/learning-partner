import { z } from 'zod';

export const feedbackFormSchema = z.object({
  type: z.enum(['bug', 'idea', 'other'], {
    message: 'Please select a report type.',
  }),
  title: z
    .string()
    .trim()
    .min(3, 'Please provide a clear title (at least 3 characters).')
    .max(150, 'Title cannot exceed 150 characters.'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters long.')
    .max(4000, 'Description cannot exceed 4,000 characters.'),
  stepsToReproduce: z.string().trim().max(2000).optional(),
  expectedResult: z.string().trim().max(1000).optional(),
  actualResult: z.string().trim().max(1000).optional(),
  severity: z.enum(['low', 'medium', 'high']).default('medium'),
  screenshotUrl: z.string().url().optional().or(z.literal('')),
  contextUrl: z.string().max(500).optional(),
  browserInfo: z.string().max(200).optional(),
  osInfo: z.string().max(200).optional(),
  appVersion: z.string().max(50).optional(),
  // Anti-bot fields
  hp_website: z.string().optional(),
  formLoadedAt: z.union([z.string(), z.number()]).optional(),
  turnstileToken: z.string().optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

