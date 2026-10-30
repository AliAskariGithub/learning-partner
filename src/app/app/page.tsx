import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/session';
import { getUserNotebooks } from './notebook-actions';
import { db } from '@/db';
import { notebooks } from '@/db/schema';

export const instant = false;

export default async function AppPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireUser();
  const userNotebooks = await getUserNotebooks();
  const sp = searchParams ? await searchParams : {};
  const queryString = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      v === undefined ? [] : Array.isArray(v) ? v.map((val) => [k, val]) : [[k, v]]
    )
  ).toString();
  const querySuffix = queryString ? `?${queryString}` : '';

  if (userNotebooks.length > 0) {
    redirect(`/app/notebooks/${userNotebooks[0].id}${querySuffix}`);
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

  redirect(`/app/notebooks/${starterNotebook.id}${querySuffix}`);
}
