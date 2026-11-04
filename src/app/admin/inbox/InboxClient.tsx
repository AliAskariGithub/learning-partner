'use client';

import React, { useState } from 'react';
import { ContactMessage, FeedbackReport } from '@/db/schema';
import { updateContactMessage, updateFeedbackReport } from './actions';
import { Button, Card, Badge } from '@/components/ui';
import {
  Mail,
  Bug,
  Lightbulb,
  MessageSquare,
  Clock,
  ExternalLink,
  CheckCircle,
  FileText,
  AlertTriangle,
  User,
  Shield,
  X,
} from 'lucide-react';

interface InboxClientProps {
  initialMessages: ContactMessage[];
  initialReports: FeedbackReport[];
}

export function InboxClient({ initialMessages, initialReports }: InboxClientProps) {
  const [activeTab, setActiveTab] = useState<'messages' | 'feedback'>('messages');
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages);
  const [reports, setReports] = useState<FeedbackReport[]>(initialReports);

  const [messageFilter, setMessageFilter] = useState<string>('all');
  const [reportFilter, setReportFilter] = useState<string>('all');

  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [selectedReport, setSelectedReport] = useState<FeedbackReport | null>(null);

  const [adminNote, setAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter lists
  const filteredMessages = messages.filter((m) =>
    messageFilter === 'all' ? true : m.status === messageFilter
  );

  const filteredReports = reports.filter((r) =>
    reportFilter === 'all' ? true : r.status === reportFilter
  );

  const handleMessageStatusChange = async (newStatus: 'new' | 'read' | 'replied' | 'archived') => {
    if (!selectedMessage) return;
    setIsUpdating(true);
    await updateContactMessage(selectedMessage.id, newStatus, adminNote || undefined);

    setMessages((prev) =>
      prev.map((m) => (m.id === selectedMessage.id ? { ...m, status: newStatus, adminNote: adminNote || m.adminNote } : m))
    );
    setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus, adminNote: adminNote || prev.adminNote } : null));
    setIsUpdating(false);
  };

  const handleReportStatusChange = async (newStatus: 'new' | 'triaged' | 'in_progress' | 'done' | 'wontfix') => {
    if (!selectedReport) return;
    setIsUpdating(true);
    await updateFeedbackReport(selectedReport.id, newStatus, adminNote || undefined);

    setReports((prev) =>
      prev.map((r) => (r.id === selectedReport.id ? { ...r, status: newStatus, adminNote: adminNote || r.adminNote } : r))
    );
    setSelectedReport((prev) => (prev ? { ...prev, status: newStatus, adminNote: adminNote || prev.adminNote } : null));
    setIsUpdating(false);
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => {
            setActiveTab('messages');
            setSelectedReport(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-display font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'messages'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-surface text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Messages ({messages.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('feedback');
            setSelectedMessage(null);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-display font-semibold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'feedback'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-surface text-muted-foreground hover:text-foreground'
          }`}
        >
          <Bug className="w-4 h-4" />
          <span>Feedback &amp; Bugs ({reports.length})</span>
        </button>
      </div>

      {/* MESSAGES TAB */}
      {activeTab === 'messages' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-display">
            {['all', 'new', 'read', 'replied', 'archived'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setMessageFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  messageFilter === status
                    ? 'bg-surface-raised text-foreground font-semibold border border-brand-500/50'
                    : 'bg-surface text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* List View */}
            <div className="lg:col-span-2 space-y-2">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center bg-surface border border-border rounded-xl text-xs font-serif text-muted-foreground">
                  No messages found in this view.
                </div>
              ) : (
                filteredMessages.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMessage(m);
                      setAdminNote(m.adminNote || '');
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedMessage?.id === m.id
                        ? 'bg-surface-raised border-brand-500 shadow-sm'
                        : 'bg-surface border-border hover:border-brand-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-xs sm:text-sm text-foreground">
                          {m.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-raised text-muted-foreground border border-border">
                          {m.topic}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          m.status === 'new'
                            ? 'bg-rose-500/10 text-rose-500'
                            : m.status === 'replied'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-surface text-muted-foreground'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    <p className="font-serif text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {m.message}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                      <span>{m.email}</span>
                      <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detail Drawer */}
            <div className="space-y-4">
              {selectedMessage ? (
                <Card className="p-5 bg-surface border-border space-y-4 sticky top-24">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display font-bold text-base text-foreground">
                        {selectedMessage.name}
                      </h3>
                      <a href={`mailto:${selectedMessage.email}`} className="text-xs font-serif text-brand-500 underline">
                        {selectedMessage.email}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedMessage(null)}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs font-serif text-foreground bg-surface-raised p-3.5 rounded-xl border border-border leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>

                  <div className="space-y-2 text-[11px] font-mono text-muted-foreground">
                    <div><strong>Topic:</strong> {selectedMessage.topic}</div>
                    <div><strong>Submitted:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}</div>
                    <div><strong>Email Status:</strong> {selectedMessage.emailStatus}</div>
                    <div className="truncate"><strong>Salted IP Hash:</strong> {selectedMessage.ipHash.slice(0, 16)}...</div>
                  </div>

                  {/* Status update controls */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <label className="block text-xs font-display font-semibold text-foreground">
                      Update Message Status
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-display">
                      {(['new', 'read', 'replied', 'archived'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleMessageStatusChange(st)}
                          className={`p-1.5 rounded-lg border text-xs capitalize transition-colors cursor-pointer ${
                            selectedMessage.status === st
                              ? 'bg-brand-500/10 border-brand-500 text-brand-500 font-bold'
                              : 'bg-surface-raised border-border text-muted-foreground'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Private Admin Note */}
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <label className="block text-xs font-display font-semibold text-foreground">
                      Private Admin Note
                    </label>
                    <textarea
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add an internal note..."
                      className="w-full p-2.5 rounded-xl bg-surface-raised border border-border text-xs font-serif text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleMessageStatusChange(selectedMessage.status as any)}
                    >
                      Save Note
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="p-6 text-center bg-surface border border-border rounded-xl text-xs font-serif text-muted-foreground">
                  Select a message from the list to view details and status actions.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK & BUGS TAB */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-display">
            {['all', 'new', 'triaged', 'in_progress', 'done', 'wontfix'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setReportFilter(status)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  reportFilter === status
                    ? 'bg-surface-raised text-foreground font-semibold border border-brand-500/50'
                    : 'bg-surface text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* List View */}
            <div className="lg:col-span-2 space-y-2">
              {filteredReports.length === 0 ? (
                <div className="p-8 text-center bg-surface border border-border rounded-xl text-xs font-serif text-muted-foreground">
                  No feedback reports found in this view.
                </div>
              ) : (
                filteredReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setSelectedReport(r);
                      setAdminNote(r.adminNote || '');
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      selectedReport?.id === r.id
                        ? 'bg-surface-raised border-brand-500 shadow-sm'
                        : 'bg-surface border-border hover:border-brand-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.type === 'bug'
                              ? 'bg-rose-500/10 text-rose-500'
                              : r.type === 'idea'
                              ? 'bg-indigo-500/10 text-indigo-500'
                              : 'bg-amber-500/10 text-amber-500'
                          }`}
                        >
                          {r.type}
                        </span>
                        <span className="font-display font-bold text-xs sm:text-sm text-foreground">
                          {r.title}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          r.severity === 'high'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-surface text-muted-foreground'
                        }`}
                      >
                        {r.severity}
                      </span>
                    </div>
                    <p className="font-serif text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                      <span>Status: {r.status}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Detail Drawer */}
            <div className="space-y-4">
              {selectedReport ? (
                <Card className="p-5 bg-surface border-border space-y-4 sticky top-24">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-1.5 py-0.5 rounded bg-surface-raised border border-border text-[10px] font-mono font-bold uppercase">
                          {selectedReport.type}
                        </span>
                        <span className="text-[10px] font-mono text-rose-500 font-bold uppercase">
                          {selectedReport.severity} severity
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-base text-foreground">
                        {selectedReport.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReport(null)}
                      className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs font-serif text-foreground bg-surface-raised p-3.5 rounded-xl border border-border leading-relaxed whitespace-pre-wrap">
                    {selectedReport.description}
                  </div>

                  {selectedReport.stepsToReproduce && (
                    <div className="text-xs font-serif text-muted-foreground bg-surface-raised p-3 rounded-lg border border-border">
                      <strong className="text-foreground block mb-1">Steps to Reproduce:</strong>
                      {selectedReport.stepsToReproduce}
                    </div>
                  )}

                  {selectedReport.screenshotUrl && (
                    <div className="space-y-1">
                      <strong className="text-xs font-display text-foreground block">Attached Screenshot:</strong>
                      <a
                        href={selectedReport.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-brand-500 underline"
                      >
                        View Screenshot File <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  <div className="space-y-1 text-[11px] font-mono text-muted-foreground">
                    <div><strong>Context URL:</strong> {selectedReport.contextUrl || 'N/A'}</div>
                    <div><strong>OS:</strong> {selectedReport.osInfo || 'N/A'}</div>
                    <div><strong>Browser:</strong> {selectedReport.browserInfo || 'N/A'}</div>
                    <div><strong>Version:</strong> {selectedReport.appVersion}</div>
                  </div>

                  {/* Status update controls */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <label className="block text-xs font-display font-semibold text-foreground">
                      Update Report Status
                    </label>
                    <div className="grid grid-cols-3 gap-1 text-[11px] font-display">
                      {(['new', 'triaged', 'in_progress', 'done', 'wontfix'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleReportStatusChange(st)}
                          className={`p-1.5 rounded border capitalize transition-colors cursor-pointer ${
                            selectedReport.status === st
                              ? 'bg-brand-500/10 border-brand-500 text-brand-500 font-bold'
                              : 'bg-surface-raised border-border text-muted-foreground'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Private Admin Note */}
                  <div className="space-y-1.5 pt-2 border-t border-border/60">
                    <label className="block text-xs font-display font-semibold text-foreground">
                      Private Admin Note
                    </label>
                    <textarea
                      rows={3}
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Add an internal note..."
                      className="w-full p-2.5 rounded-xl bg-surface-raised border border-border text-xs font-serif text-foreground focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleReportStatusChange(selectedReport.status as any)}
                    >
                      Save Note
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="p-6 text-center bg-surface border border-border rounded-xl text-xs font-serif text-muted-foreground">
                  Select a report from the list to view details and update triage status.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

