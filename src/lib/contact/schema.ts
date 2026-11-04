import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Please enter your name.')
    .max(100, 'Name cannot exceed 100 characters.'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .max(255, 'Email cannot exceed 255 characters.'),
  topic: z.enum(['general', 'support', 'partnership', 'other'], {
    message: 'Please select a topic.',
  }),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters long.')
    .max(3000, 'Message cannot exceed 3,000 characters.'),
  consent: z.literal(true, {
    message: 'You must consent to the processing of your message per our Privacy Policy.',
  }),
  // Anti-bot fields
  hp_website: z.string().optional(),
  formLoadedAt: z.union([z.string(), z.number()]).optional(),
  turnstileToken: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

