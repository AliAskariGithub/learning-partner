'use server';

import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { db } from '@/db';
import { contactMessages, feedbackReports } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * Server-side authorization check:
 * Validates that user is signed in and their email exists in ADMIN_EMAILS.
 * If unauthorized, unconditionally triggers notFound() (HTTP 404).
 */
export async function verifyAdminAuthorization() {
  const session = await getSession();
  if (!session || !session.user || !session.user.email) {
    notFound();
  }

  const userEmail = session.user.email.trim().toLowerCase();

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0 || !adminEmails.includes(userEmail)) {
    notFound();
  }

  return session.user;
}

export async function getAdminInboxData() {
  await verifyAdminAuthorization();

  const messages = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(100);

  const reports = await db
    .select()
    .from(feedbackReports)
    .orderBy(desc(feedbackReports.createdAt))
    .limit(100);

  return { messages, reports };
}

export async function updateContactMessage(
  id: string,
  status: 'new' | 'read' | 'replied' | 'archived',
  adminNote?: string
) {
  await verifyAdminAuthorization();

  await db
    .update(contactMessages)
    .set({
      status,
      adminNote: adminNote !== undefined ? adminNote : undefined,
      updatedAt: new Date(),
    })
    .where(eq(contactMessages.id, id));

  revalidatePath('/admin/inbox');
  return { success: true };
}

export async function updateFeedbackReport(
  id: string,
  status: 'new' | 'triaged' | 'in_progress' | 'done' | 'wontfix',
  adminNote?: string
) {
  await verifyAdminAuthorization();

  await db
    .update(feedbackReports)
    .set({
      status,
      adminNote: adminNote !== undefined ? adminNote : undefined,
      updatedAt: new Date(),
    })
    .where(eq(feedbackReports.id, id));

  revalidatePath('/admin/inbox');
  return { success: true };
}

