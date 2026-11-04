'use server';

import { headers } from 'next/headers';
import { db } from '@/db';
import { contactMessages } from '@/db/schema';
import { contactFormSchema, ContactFormData } from './schema';
import { getSession } from '@/lib/auth/session';
import { hashIpAddress, verifySpamProtection } from '@/lib/security/spam';
import { getEmailProvider } from '@/lib/email';
import { siteConfig } from '@/config/site';

export interface ContactActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitContactMessage(
  rawData: unknown
): Promise<ContactActionResult> {
  try {
    // 1. Zod Schema Validation
    const parsed = contactFormSchema.safeParse(rawData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key != null) {
          fieldErrors[String(key)] = issue.message;
        }
      }
      return {
        success: false,
        error: 'Please fix the errors in the form.',
        fieldErrors,
      };
    }

    const data: ContactFormData = parsed.data;

    // 2. Extract Client Network Headers
    const headerList = await headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    const realIp = headerList.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';
    const userAgent = headerList.get('user-agent') || 'Unknown';

    // 3. Spam & Bot Protection Checks
    const spamCheck = await verifySpamProtection({
      honeypotValue: data.hp_website,
      formLoadedAt: data.formLoadedAt,
      turnstileToken: data.turnstileToken,
      clientIp,
    });

    if (!spamCheck.allowed) {
      return {
        success: false,
        error: spamCheck.reason || 'Security verification failed.',
      };
    }

    // 4. Session Check (optional user linkage)
    const session = await getSession();
    const userId = session?.user?.id || null;
    const ipHash = hashIpAddress(clientIp);

    // 5. SAVE FIRST to Neon Postgres Database
    const [inserted] = await db
      .insert(contactMessages)
      .values({
        userId,
        name: data.name,
        email: data.email,
        topic: data.topic,
        message: data.message,
        status: 'new',
        ipHash,
        userAgent: userAgent.slice(0, 500),
        emailStatus: 'skipped',
      })
      .returning({ id: contactMessages.id });

    // 6. Deliver Notification Email via Resend
    const emailProvider = getEmailProvider();
    const adminInboxUrl = `${siteConfig.url}/admin/inbox`;

    const deliveryResult = await emailProvider.sendAdminNotification({
      type: 'contact',
      name: data.name,
      email: data.email,
      topicOrCategory: data.topic,
      message: data.message,
      adminInboxUrl,
      metadata: {
        messageId: inserted?.id || 'unknown',
        signedInUser: userId ? `User ID: ${userId}` : 'Guest Visitor',
      },
    });

    // Update email status if notification was attempted
    if (inserted?.id && deliveryResult.status !== 'skipped') {
      try {
        const { eq } = await import('drizzle-orm');
        await db
          .update(contactMessages)
          .set({ emailStatus: deliveryResult.status })
          .where(eq(contactMessages.id, inserted.id));
      } catch {
        // Non-blocking log
      }
    }

    // 7. Optional Confirmation to Sender
    if (siteConfig.features.confirmationEmailEnabled) {
      await emailProvider.sendSenderConfirmation(data.email, data.name, data.topic);
    }

    return { success: true };
  } catch (err: any) {
    console.error('[submitContactMessage] Fatal error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while saving your message. Please try again.',
    };
  }
}

