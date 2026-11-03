'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  FileText,
  FileCode,
  File,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import {
  exportToPdf,
  exportToMarkdown,
  exportToTxt,
  printFormattedDocument,
  formatConversationForExport,
} from '@/lib/export/export-helper';
import { Message } from '@/db/schema';
import { cn } from '@/lib/utils';

export interface ExportDropdownProps {
  title: string;
  content?: string;
  notebookTitle?: string;
  type?: 'message' | 'conversation' | 'report' | 'study_guide' | 'summary' | 'quiz' | 'flashcards' | 'mindmap';
  messages?: Message[];
  className?: string;
  variant?: 'button' | 'icon' | 'badge';
  label?: string;
}

export function ExportDropdown({
  title,
  content = '',
  notebookTitle,
  type = 'message',
  messages,
  className = '',
  variant = 'icon',
  label = 'Download',
}: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Determine export text: single message content or full chat formatted
  const getExportText = () => {
    if (type === 'conversation' && messages && messages.length > 0) {
      return formatConversationForExport(messages, notebookTitle, title);
    }
    return content;
  };

  const safeFilename = (title || 'export')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'document';

  const handleExportPdf = () => {
    try {
      const exportContent = getExportText();
      exportToPdf({
        filename: `${safeFilename}.pdf`,
        title,
        subtitle: type === 'conversation' ? 'Complete Chat Transcript' : undefined,
        content: exportContent,
        metadata: {
          notebookTitle,
          type: type.toUpperCase(),
        },
      });
      toast({
        title: 'Downloaded PDF',
        description: `${title}.pdf has been saved.`,
        variant: 'success',
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err.message || 'Could not generate PDF.',
        variant: 'error',
      });
    }
  };

  const handleExportMarkdown = () => {
    try {
      const exportContent = getExportText();
      exportToMarkdown(`${safeFilename}.md`, exportContent);
      toast({
        title: 'Downloaded Markdown',
        description: `${safeFilename}.md saved.`,
        variant: 'success',
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err.message || 'Could not save Markdown.',
        variant: 'error',
      });
    }
  };

  const handleExportTxt = () => {
    try {
      const exportContent = getExportText();
      exportToTxt(`${safeFilename}.txt`, exportContent);
      toast({
        title: 'Downloaded Text',
        description: `${safeFilename}.txt saved.`,
        variant: 'success',
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err.message || 'Could not save plain text.',
        variant: 'error',
      });
    }
  };

  const handlePrint = () => {
    try {
      const exportContent = getExportText();
      printFormattedDocument(title, exportContent, {
        notebookTitle,
        type: type.toUpperCase(),
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: 'Print Failed',
        description: err.message || 'Could not open print preview.',
        variant: 'error',
      });
    }
  };

  return (
    <div className={cn('relative inline-flex items-center', className)} ref={containerRef}>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 p-1 px-1.5 rounded-lg text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626] transition-colors cursor-pointer text-xs"
          title="Download (PDF, .md, Print)"
          aria-label="Download options"
          aria-expanded={open}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px] font-medium">Download</span>
        </button>
      ) : variant === 'button' ? (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="h-8 px-2.5 rounded-xl bg-[#222222] hover:bg-[#2a2a2a] text-[#f4f4f2] border border-[#333333] flex items-center gap-1.5 text-xs font-display font-medium transition-colors cursor-pointer shadow-sm"
          aria-label="Download conversation"
          aria-expanded={open}
        >
          <Download className="w-3.5 h-3.5 text-brand-400" />
          <span>{label}</span>
          <ChevronDown className={cn('w-3 h-3 text-[#9a9a94] transition-transform', open && 'rotate-180')} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/30 text-[10px] font-display font-medium hover:bg-brand-500/20 transition cursor-pointer"
          aria-label="Download options"
          aria-expanded={open}
        >
          <Download className="w-3 h-3 text-brand-400" />
          <span>{label}</span>
        </button>
      )}

      {/* Popover Dropdown Menu */}
      {open && (
        <div
          className="absolute right-0 bottom-full mb-2 w-52 rounded-2xl bg-[#1f1f1f] border border-[#303030] shadow-2xl p-1.5 z-50 text-xs text-[#f4f4f2] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          <div className="px-2.5 py-1 text-[10px] font-display font-bold uppercase tracking-wider text-[#9a9a94] border-b border-[#2a2a2a] mb-1">
            Download Formats
          </div>

          <button
            type="button"
            onClick={handleExportPdf}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-xs font-sans text-[#f4f4f2] hover:bg-[#2a2a2a] transition cursor-pointer"
            role="menuitem"
          >
            <FileText className="w-4 h-4 text-rose-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs leading-none">Download PDF</div>
              <div className="text-[10px] text-[#9a9a94] mt-0.5">Formatted .pdf document</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportMarkdown}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-xs font-sans text-[#f4f4f2] hover:bg-[#2a2a2a] transition cursor-pointer"
            role="menuitem"
          >
            <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs leading-none">Download Markdown</div>
              <div className="text-[10px] text-[#9a9a94] mt-0.5">Raw .md with formatting</div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleExportTxt}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-xs font-sans text-[#f4f4f2] hover:bg-[#2a2a2a] transition cursor-pointer"
            role="menuitem"
          >
            <File className="w-4 h-4 text-zinc-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs leading-none">Download Text</div>
              <div className="text-[10px] text-[#9a9a94] mt-0.5">Plain text file (.txt)</div>
            </div>
          </button>

          <div className="h-px bg-[#2a2a2a] my-1" />

          <button
            type="button"
            onClick={handlePrint}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left text-xs font-sans text-[#f4f4f2] hover:bg-[#2a2a2a] transition cursor-pointer"
            role="menuitem"
          >
            <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs leading-none">Print / Save as PDF</div>
              <div className="text-[10px] text-[#9a9a94] mt-0.5">Clean printable document</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

