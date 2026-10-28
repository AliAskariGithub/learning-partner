'use client';

import React, { useState, useRef } from 'react';
import { Dialog, Button, Input, Textarea } from '@/components/ui';
import { useToast } from '@/components/ui/toast';
import { STORAGE_LIMITS } from '@/config/limits';
import {
  Upload,
  Globe,
  FileText,
  FileUp,
  AlertCircle,
  CheckCircle2,
  Paperclip,
} from 'lucide-react';

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  onSourceAdded: () => void;
}

export function AddSourceDialog({
  open,
  onOpenChange,
  notebookId,
  onSourceAdded,
}: AddSourceDialogProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'upload' | 'link' | 'text'>('upload');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link State
  const [url, setUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');

  // Text State
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  const resetForm = () => {
    setSelectedFile(null);
    setUrl('');
    setLinkTitle('');
    setTextTitle('');
    setTextContent('');
    setErrorMessage(null);
  };

  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    if (file.size > STORAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds the maximum allowed size of ${STORAGE_LIMITS.MAX_FILE_SIZE_MB}MB.`);
      setSelectedFile(null);
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!STORAGE_LIMITS.ALLOWED_FILE_EXTENSIONS.includes(ext as any)) {
      setErrorMessage(`Unsupported format. Please upload: ${STORAGE_LIMITS.ALLOWED_FILE_EXTENSIONS.join(', ')}`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmitFile = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload document.');
      }

      toast({
        title: 'Source Added',
        description: `${selectedFile.name} is indexing in the background.`,
        variant: 'success',
      });

      resetForm();
      onOpenChange(false);
      onSourceAdded();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error uploading file.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLink = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'url',
          url: trimmedUrl,
          title: linkTitle.trim() || trimmedUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to import web page.');
      }

      toast({
        title: 'Link Added',
        description: 'Web content is being extracted in the background.',
        variant: 'success',
      });

      resetForm();
      onOpenChange(false);
      onSourceAdded();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error importing link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitText = async () => {
    const content = textContent.trim();
    if (!content) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          title: textTitle.trim() || 'Pasted Notes',
          content,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add notes.');
      }

      toast({
        title: 'Notes Added',
        description: 'Pasted text added and indexed successfully.',
        variant: 'success',
      });

      resetForm();
      onOpenChange(false);
      onSourceAdded();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving notes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
      title="Add Sources to Notebook"
      description="Sources ground your study partner so all answers reference verifiable citations."
    >
      <div className="space-y-4">
        {/* Tab navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-raised rounded-xl border border-border text-xs font-display font-semibold">
          <button
            onClick={() => {
              setTab('upload');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'upload'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-brand-400" />
            <span>Upload File</span>
          </button>

          <button
            onClick={() => {
              setTab('link');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'link'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-brand-400" />
            <span>Web Link</span>
          </button>

          <button
            onClick={() => {
              setTab('text');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'text'
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-brand-400" />
            <span>Paste Text</span>
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error flex items-start gap-2 text-xs font-sans">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Upload File Tab */}
        {tab === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
              }}
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-brand-500 bg-brand-500/5'
                  : selectedFile
                  ? 'border-brand-500/50 bg-surface-raised'
                  : 'border-border hover:border-brand-500/40 bg-surface/60 hover:bg-surface-raised'
              }`}
            >
              <FileUp className="h-8 w-8 mx-auto mb-2 text-brand-400 opacity-80" />
              {selectedFile ? (
                <div>
                  <div className="font-display font-bold text-xs text-foreground flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    <span>{selectedFile.name}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-display font-semibold text-xs text-foreground">
                    Drop PDF, Word document, Markdown or text file here
                  </div>
                  <div className="text-[11px] text-muted-foreground font-serif mt-1">
                    Supports .pdf, .docx, .md, .txt (up to {STORAGE_LIMITS.MAX_FILE_SIZE_MB}MB)
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedFile}
                isLoading={loading}
                onClick={handleSubmitFile}
              >
                Upload & Process
              </Button>
            </div>
          </div>
        )}

        {/* 2. Web Link Tab */}
        {tab === 'link' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Web Article URL
              </label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://arxiv.org/abs/... or https://en.wikipedia.org/..."
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Title (Optional)
              </label>
              <Input
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Custom title for this reference"
              />
            </div>

            <p className="text-[11px] text-muted-foreground font-serif">
              Learning Partner will extract the main article text and generate search chunks automatically.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!url.trim()}
                isLoading={loading}
                onClick={handleSubmitLink}
              >
                Import Article
              </Button>
            </div>
          </div>
        )}

        {/* 3. Paste Text Tab */}
        {tab === 'text' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Note Title
              </label>
              <Input
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="e.g. Consensus Lecture Transcript §2"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Content
              </label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={6}
                placeholder="Paste notes, transcripts, or excerpt here..."
                className="font-serif leading-relaxed text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!textContent.trim()}
                isLoading={loading}
                onClick={handleSubmitText}
              >
                Add Text Source
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
