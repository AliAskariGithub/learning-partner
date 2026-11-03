'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { MessageContent } from '@/components/chat/MessageContent';
import {
  Copy,
  Download,
  Printer,
  Headphones,
  BookOpen,
  List,
  Check,
  X,
  FileText,
  FileCode,
} from 'lucide-react';
import { exportToPdf, exportToMarkdown, printFormattedDocument } from '@/lib/export/export-helper';

export function StudyGuideViewer({
  title,
  content,
  onListen,
  onClose,
}: {
  title: string;
  content: string;
  onListen?: (textToRead: string) => void;
  onClose?: () => void;
}) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Extract headings from markdown for Table of Contents
  const toc = useMemo(() => {
    const lines = content.split('\n');
    const items: Array<{ level: number; text: string; id: string }> = [];
    lines.forEach((line) => {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[*_#]/g, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        items.push({ level, text, id });
      }
    });
    return items;
  }, [content]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: 'Copied to Clipboard',
        description: 'Study Guide markdown has been copied.',
        variant: 'success',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'error' });
    }
  };

  const handleDownloadPdf = () => {
    try {
      exportToPdf({
        filename: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-study-guide.pdf`,
        title,
        content,
        metadata: { type: 'STUDY GUIDE' },
      });
      toast({ title: 'Downloaded PDF', description: 'Study Guide PDF saved to your device.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Could not download PDF.', variant: 'error' });
    }
  };

  const handleDownloadMarkdown = () => {
    try {
      exportToMarkdown(`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-study-guide.md`, content);
      toast({ title: 'Downloaded Markdown', description: 'Markdown file saved.', variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Could not save Markdown.', variant: 'error' });
    }
  };

  const handlePrint = () => {
    try {
      printFormattedDocument(title, content, { type: 'Structured Curriculum Study Guide' });
    } catch (err: any) {
      toast({ title: 'Print Failed', description: err.message || 'Could not open print preview.', variant: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2]">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-4">
          <BookOpen className="w-4 h-4 text-emerald-400 shrink-0" />
          <h2 className="font-display font-bold text-sm text-[#f4f4f2] truncate">
            {title}
          </h2>
          <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0 hidden sm:inline-block">
            Curriculum Guide
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onListen && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onListen(content)}
              className="text-xs h-8 px-2.5 text-brand-300 border-brand-500/30 hover:bg-brand-950/20 mr-1"
            >
              <Headphones className="w-3.5 h-3.5 mr-1.5" />
              Listen
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-xs h-8 px-2.5 text-[#9a9a94] hover:text-[#f4f4f2]"
            title="Copy Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadPdf}
            className="text-xs h-8 px-2.5 text-rose-300 border-rose-500/30 hover:bg-rose-950/30 flex items-center gap-1.5 font-display font-medium"
            title="Download PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadMarkdown}
            className="text-xs h-8 px-2.5 text-blue-300 border-blue-500/30 hover:bg-blue-950/30 flex items-center gap-1.5 font-display font-medium"
            title="Download Markdown"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">.md</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-8 px-2.5 text-[#9a9a94] hover:text-[#f4f4f2]"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer ml-1"
              title="Close Study Guide"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Layout: TOC sidebar on desktop + Reading Canvas */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Table of Contents Column (desktop) */}
        {toc.length > 0 && (
          <aside className="w-64 border-r border-[#303030] bg-[#1a1a1a] p-4 overflow-y-auto hidden lg:block shrink-0 scrollbar-thin scrollbar-thumb-[#303030]">
            <div className="flex items-center gap-2 mb-3 text-xs font-display font-semibold text-[#9a9a94] uppercase tracking-wider">
              <List className="w-3.5 h-3.5" />
              <span>Table of Contents</span>
            </div>
            <nav className="space-y-1">
              {toc.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(item.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`w-full text-left text-xs py-1 px-2 rounded-lg transition-colors cursor-pointer truncate ${
                    item.level === 3 ? 'pl-5 text-[#9a9a94] hover:text-[#f4f4f2]' : 'text-[#f4f4f2] font-medium hover:bg-[#262626]'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 max-w-3xl mx-auto w-full print:p-0 print:bg-white print:text-black">
          <article className="prose prose-invert prose-brand max-w-none font-serif text-sm md:text-base leading-relaxed text-[#dcdcd8]">
            <MessageContent content={content} />
          </article>
        </main>
      </div>
    </div>
  );
}
