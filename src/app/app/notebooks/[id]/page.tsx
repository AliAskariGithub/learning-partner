import { notFound, redirect } from 'next/navigation';
import { requireUser, getOrCreateProfile } from '@/lib/auth/session';
import { getNotebookDetails, getUserNotebooks } from '@/app/app/notebook-actions';
import { getUserApiKeys } from '@/app/app/api-key-actions';
import { getConversations, getConversationMessages } from '@/app/app/chat-actions';
import { getNotebookOutputs } from '@/app/app/studio-actions';
import { NotebookClientPage } from './NotebookClientPage';

export const instant = false;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ chat?: string }>;
}

export default async function NotebookDetailPage({ params, searchParams }: PageProps) {
  const user = await requireUser();
  const profile = await getOrCreateProfile(user);
  const { id: notebookId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedChatId = resolvedSearchParams?.chat;

  const [details, allNotebooks, userKeys, convs, outputs] = await Promise.all([
    getNotebookDetails(notebookId),
    getUserNotebooks(),
    getUserApiKeys(),
    getConversations(notebookId),
    getNotebookOutputs(notebookId),
  ]);

  if (!details || !details.notebook) {
    // If not found or belongs to another user, redirect to main app
    redirect('/app');
  }

  // Find target conversation: requestedChatId if valid, else latest conv
  const targetConv = (requestedChatId && convs.find((c) => c.id === requestedChatId)) || convs[0] || null;
  const initialMessages = targetConv ? await getConversationMessages(targetConv.id) : [];

  return (
    <NotebookClientPage
      user={user}
      profile={profile}
      initialNotebook={details.notebook}
      initialSources={details.sources}
      initialNotes={details.notes}
      allNotebooks={allNotebooks}
      initialUserKeys={userKeys}
      initialConversations={convs}
      initialActiveConversationId={targetConv?.id || null}
      initialMessages={initialMessages}
      initialOutputs={outputs}
    />
  );
}
