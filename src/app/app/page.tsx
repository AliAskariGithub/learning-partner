import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getUserNotebooks } from './notebook-actions';
import { db } from '@/db';
import { notebooks } from '@/db/schema';

export const instant = false;

export default async function AppPage() {
  const user = await requireUser();
  const userNotebooks = await getUserNotebooks();

  if (userNotebooks.length > 0) {
    redirect(`/app/notebooks/${userNotebooks[0].id}`);
  }

  // Create a default initial notebook for new users
  const [starterNotebook] = await db
    .insert(notebooks)
    .values({
      userId: user.id,
      title: 'My First Notebook',
      description: 'Add your documents, PDFs, or links to start exploring source-grounded study sessions.',
      instructions:
        'ROLE You are my personal study partner. Answer questions strictly grounded in uploaded sources, prioritize clear step-by-step breakdowns, and always reference citations.',
      pinned: true,
    })
    .returning();

  redirect(`/app/notebooks/${starterNotebook.id}`);
}
