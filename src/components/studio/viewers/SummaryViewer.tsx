'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { MessageContent } from '@/components/chat/MessageContent';
import {
  Copy,
  Download,
  Printer,
  Headphones,
  AlignLeft,
  Check,
  X,
} from 'lucide-react';

export function SummaryViewer({
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: 'Copied to Clipboard',
        description: 'Summary briefing has been copied.',
        variant: 'success',
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
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-briefing.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Markdown file saved.', variant: 'success' });
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#191919] text-[#f4f4f2]">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-[#303030] bg-[#1f1f1f] px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 pr-4">
          <AlignLeft className="w-4 h-4 text-cyan-400 shrink-0" />
          <h2 className="font-display font-bold text-sm text-[#f4f4f2] truncate">
            {title}
          </h2>
          <span className="text-[10px] font-display font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0 hidden sm:inline-block">
            Briefing Doc
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] border border-transparent hover:border-[#383838] transition cursor-pointer ml-1"
              title="Close Summary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 max-w-3xl mx-auto w-full print:p-0 print:bg-white print:text-black">
        <article className="prose prose-invert prose-brand max-w-none font-serif text-sm md:text-base leading-relaxed text-[#dcdcd8]">
          <MessageContent content={content} />
        </article>
      </div>
    </div>
  );
}
