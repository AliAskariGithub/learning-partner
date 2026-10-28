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
  FileText,
} from 'lucide-react';

export function StudyGuideViewer({
  title,
  content,
  onListen,
}: {
  title: string;
  content: string;
  onListen?: (textToRead: string) => void;
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
        variant: 'brand',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'error' });
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-study-guide.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Markdown file saved.', variant: 'neutral' });
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleScrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2]">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h2 className="font-display font-bold text-sm text-[#f4f4f2] truncate max-w-sm sm:max-w-md">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onListen && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onListen(content)}
              className="text-xs h-8 px-2.5 text-brand-300 border-brand-500/30 hover:bg-brand-950/20"
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
            variant="ghost"
            size="sm"
            onClick={handleDownloadMarkdown}
            className="text-xs h-8 px-2.5 text-[#9a9a94] hover:text-[#f4f4f2]"
            title="Download Markdown"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrintPdf}
            className="text-xs h-8 px-2.5 text-[#9a9a94] hover:text-[#f4f4f2]"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Body with Sidebar TOC */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sticky TOC Sidebar */}
        {toc.length > 0 && (
          <aside className="w-64 border-r border-[#303030] bg-[#1a1a1a] p-5 overflow-y-auto hidden lg:block shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-display font-bold uppercase tracking-wider text-[#9a9a94] mb-3">
              <List className="w-3.5 h-3.5" />
              Table of Contents
            </div>
            <nav className="space-y-1.5">
              {toc.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleScrollToHeading(item.id)}
                  className={`text-left w-full text-xs transition-colors hover:text-brand-300 block truncate ${
                    item.level === 3 ? 'pl-3 text-[#7a7a74]' : 'font-display font-medium text-[#9a9a94]'
                  }`}
                >
                  {item.text}
                </button>
              ))}
            </nav>
          </aside>
        )}

        {/* Serif Reading View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 max-w-3xl mx-auto w-full print:p-0 print:bg-white print:text-black">
          <article className="prose prose-invert prose-brand max-w-none font-serif text-sm md:text-base leading-relaxed text-[#dcdcd8]">
            <MessageContent content={content} />
          </article>
        </main>
      </div>
    </div>
  );
}

