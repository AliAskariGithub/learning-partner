'use client';

import React from 'react';
import { FileText, FileCode, Printer, Download } from 'lucide-react';
import { exportToPdf, exportToMarkdown, printFormattedDocument } from '@/lib/export/export-helper';
import { useToast } from '@/components/ui/toast';

interface GeneratedDocumentCardProps {
  title: string;
  content: string;
  notebookTitle?: string;
}

export function GeneratedDocumentCard({
  title,
  content,
  notebookTitle,
}: GeneratedDocumentCardProps) {
  const { toast } = useToast();

  const safeFilename = (title || 'document')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'document';

  const handleDownloadPdf = () => {
    try {
      exportToPdf({
        filename: `${safeFilename}.pdf`,
        title,
        content,
        metadata: {
          notebookTitle,
          type: 'AI STUDY DOCUMENT',
        },
      });
      toast({
        title: 'Downloaded PDF',
        description: `${safeFilename}.pdf saved to your device.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err.message || 'Could not generate PDF.',
        variant: 'error',
      });
    }
  };

  const handleDownloadMd = () => {
    try {
      exportToMarkdown(`${safeFilename}.md`, content);
      toast({
        title: 'Downloaded Markdown',
        description: `${safeFilename}.md saved to your device.`,
        variant: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Download Failed',
        description: err.message || 'Could not save Markdown.',
        variant: 'error',
      });
    }
  };

  const handlePrint = () => {
    try {
      printFormattedDocument(title, content, {
        notebookTitle,
        type: 'AI STUDY DOCUMENT',
      });
    } catch (err: any) {
      toast({
        title: 'Print Failed',
        description: err.message || 'Could not open print preview.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="my-3 p-3 rounded-2xl bg-[#1c1c1c] border border-[#2d2d2d] flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 shrink-0">
          <FileText className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <span className="font-display font-semibold text-xs text-[#f4f4f2] block truncate">
            {title}
          </span>
          <span className="text-[10px] text-[#9a9a94] font-serif block">
            Ready to export as PDF or Markdown
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="h-7 px-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-display font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          title="Download as PDF"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>PDF</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadMd}
          className="h-7 px-2.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 text-[11px] font-display font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          title="Download as Markdown"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>.md</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="h-7 px-2 rounded-lg bg-[#252525] hover:bg-[#2e2e2e] text-[#9a9a94] hover:text-[#f4f4f2] border border-[#383838] text-[11px] font-display font-medium flex items-center transition cursor-pointer"
          title="Print or Save as PDF"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

