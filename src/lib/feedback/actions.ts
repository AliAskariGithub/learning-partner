'use server';

import { headers } from 'next/headers';
import { db } from '@/db';
import { feedbackReports } from '@/db/schema';
import { feedbackFormSchema, FeedbackFormData } from './schema';
import { getSession } from '@/lib/auth/session';
import { hashIpAddress, verifySpamProtection } from '@/lib/security/spam';
import { getEmailProvider } from '@/lib/email';
import { siteConfig } from '@/config/site';

export interface FeedbackActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function submitFeedbackReport(
  rawData: unknown
): Promise<FeedbackActionResult> {
  try {
    // 1. Schema Validation
    const parsed = feedbackFormSchema.safeParse(rawData);
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
        error: 'Please fix the errors in the feedback form.',
        fieldErrors,
      };
    }

    const data: FeedbackFormData = parsed.data;

    // 2. Client IP & User Agent
    const headerList = await headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    const realIp = headerList.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';

    // 3. Spam & Bot Protection
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

    // 4. Session Context
    const session = await getSession();
    const userId = session?.user?.id || null;
    const ipHash = hashIpAddress(clientIp);

    // 5. SAVE FIRST into Neon Postgres Database
    const [inserted] = await db
      .insert(feedbackReports)
      .values({
        userId,
        type: data.type,
        title: data.title,
        description: data.description,
        stepsToReproduce: data.stepsToReproduce || null,
        expectedResult: data.expectedResult || null,
        actualResult: data.actualResult || null,
        severity: data.severity,
        screenshotUrl: data.screenshotUrl || null,
        contextUrl: data.contextUrl || null,
        browserInfo: data.browserInfo || null,
        osInfo: data.osInfo || null,
        appVersion: data.appVersion || '0.1.0',
        status: 'new',
        emailStatus: 'skipped',
        ipHash,
      })
      .returning({ id: feedbackReports.id });

    // 6. Deliver Admin Notification Email via Resend
    const emailProvider = getEmailProvider();
    const adminInboxUrl = `${siteConfig.url}/admin/inbox`;

    const notificationMessage = [
      data.description,
      data.stepsToReproduce ? `\n\nSteps to reproduce:\n${data.stepsToReproduce}` : '',
      data.expectedResult ? `\n\nExpected: ${data.expectedResult}` : '',
      data.actualResult ? `\n\nActual: ${data.actualResult}` : '',
      data.screenshotUrl ? `\n\nScreenshot: ${data.screenshotUrl}` : '',
    ].join('');

    const deliveryResult = await emailProvider.sendAdminNotification({
      type: 'feedback',
      name: session?.user?.name || 'Anonymous User',
      email: session?.user?.email || 'noreply@learningpartner.internal',
      topicOrCategory: `${data.type.toUpperCase()} [${data.severity.toUpperCase()}]`,
      subjectTitle: data.title,
      message: notificationMessage,
      adminInboxUrl,
      metadata: {
        reportId: inserted?.id || 'unknown',
        type: data.type,
        severity: data.severity,
        contextUrl: data.contextUrl || 'N/A',
        browser: data.browserInfo || 'N/A',
        os: data.osInfo || 'N/A',
        version: data.appVersion || '0.1.0',
        screenshot: data.screenshotUrl || 'None',
      },
    });

    if (inserted?.id && deliveryResult.status !== 'skipped') {
      try {
        const { eq } = await import('drizzle-orm');
        await db
          .update(feedbackReports)
          .set({ emailStatus: deliveryResult.status })
          .where(eq(feedbackReports.id, inserted.id));
      } catch {
        // Non-blocking log
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('[submitFeedbackReport] Fatal error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while saving your feedback. Please try again.',
    };
  }
}

