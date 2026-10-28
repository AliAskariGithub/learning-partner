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
}

export default async function NotebookDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const profile = await getOrCreateProfile(user);
  const { id: notebookId } = await params;

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

  const latestConv = convs[0] || null;
  const initialMessages = latestConv ? await getConversationMessages(latestConv.id) : [];

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
      initialMessages={initialMessages}
      initialOutputs={outputs}
    />
  );
}
