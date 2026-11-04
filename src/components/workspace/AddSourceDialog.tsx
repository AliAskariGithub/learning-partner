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
  ImageIcon,
} from 'lucide-react';
import { ChatImageAttachment } from '@/db/schema';

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notebookId: string;
  onSourceAdded: () => void;
  onImageAttached?: (image: ChatImageAttachment) => void;
}

export function AddSourceDialog({
  open,
  onOpenChange,
  notebookId,
  onSourceAdded,
  onImageAttached,
}: AddSourceDialogProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'upload' | 'link' | 'text'>('upload');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unified File & Image State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageFile, setIsImageFile] = useState(false);
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
    setImagePreview(null);
    setIsImageFile(false);
    setUrl('');
    setLinkTitle('');
    setTextTitle('');
    setTextContent('');
    setErrorMessage(null);
  };

  const handleFileChange = (file: File) => {
    setErrorMessage(null);

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const validDocExtensions = ['.pdf', '.docx', '.txt', '.md'];
    const validImageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];

    const isImage = validImageExtensions.includes(ext);
    setIsImageFile(isImage);

    if (isImage) {
      if (file.size > STORAGE_LIMITS.IMAGE_LIMITS.MAX_IMAGE_SIZE_BYTES) {
        setErrorMessage(`Image exceeds the maximum allowed size of ${STORAGE_LIMITS.IMAGE_LIMITS.MAX_IMAGE_SIZE_MB}MB.`);
        setSelectedFile(null);
        setImagePreview(null);
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    } else if (validDocExtensions.includes(ext)) {
      if (file.size > STORAGE_LIMITS.MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`File exceeds the maximum allowed size of ${STORAGE_LIMITS.MAX_FILE_SIZE_MB}MB.`);
        setSelectedFile(null);
        setImagePreview(null);
        return;
      }
      setSelectedFile(file);
      setImagePreview(null);
    } else {
      setErrorMessage(`Unsupported format. Please upload PDF, Word, Markdown, Text, or Image (PNG, JPG, WebP).`);
      setSelectedFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmitFile = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      if (isImageFile && onImageAttached) {
        // Handle as image attachment
        const formData = new FormData();
        formData.append('file', selectedFile);

        const res = await fetch('/api/chat/upload-image', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload study image.');
        }

        toast({
          title: 'Study Image Attached',
          description: `${selectedFile.name} is ready for study analysis.`,
          variant: 'success',
        });

        onImageAttached({
          id: data.id,
          url: data.url,
          storageKey: data.storageKey,
          mimeType: data.mimeType,
          fileName: selectedFile.name,
          sizeBytes: selectedFile.size,
        });

        resetForm();
        onOpenChange(false);
      } else {
        // Handle as notebook document source
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
      }
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
    const trimmedContent = textContent.trim();
    if (!trimmedContent) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/notebooks/${notebookId}/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          title: textTitle.trim() || 'Pasted Study Notes',
          content: trimmedContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save pasted text.');
      }

      toast({
        title: 'Text Added',
        description: 'Study text has been added and indexed.',
        variant: 'success',
      });

      resetForm();
      onOpenChange(false);
      onSourceAdded();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving text source.');
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
        {/* Tab navigation: Upload File, Web Link, Paste Text */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-surface-raised rounded-xl border border-zinc-200 dark:border-border text-xs font-display font-semibold">
          <button
            onClick={() => {
              setTab('upload');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'upload'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-surface dark:text-foreground'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-muted-foreground dark:hover:text-foreground'
            }`}
          >
            <Upload className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span>Upload File</span>
          </button>

          <button
            onClick={() => {
              setTab('link');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'link'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-surface dark:text-foreground'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-muted-foreground dark:hover:text-foreground'
            }`}
          >
            <Globe className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span>Web Link</span>
          </button>

          <button
            onClick={() => {
              setTab('text');
              setErrorMessage(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition cursor-pointer ${
              tab === 'text'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-surface dark:text-foreground'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-muted-foreground dark:hover:text-foreground'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span>Paste Text</span>
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-error/10 dark:border-error/30 dark:text-error flex items-start gap-2 text-xs font-sans">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-error" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Unified Upload File Tab (Documents + Images) */}
        {tab === 'upload' && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
              }}
              accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp"
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
                  ? 'border-brand-500/50 bg-zinc-50 dark:bg-surface-raised'
                  : 'border-zinc-200 hover:border-brand-500/40 bg-zinc-50/50 hover:bg-zinc-100/60 dark:border-border dark:bg-surface/60 dark:hover:bg-surface-raised'
              }`}
            >
              {selectedFile ? (
                <div>
                  {imagePreview ? (
                    <div className="space-y-2 mb-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Study preview"
                        className="max-h-36 mx-auto rounded-lg object-contain border border-zinc-200 dark:border-[#333333] shadow-md"
                      />
                    </div>
                  ) : (
                    <FileUp className="h-8 w-8 mx-auto mb-2 text-brand-500 opacity-80" />
                  )}
                  <div className="font-display font-bold text-xs text-zinc-900 dark:text-foreground flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-success" />
                    <span>{selectedFile.name}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-muted-foreground font-mono mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                  </div>
                </div>
              ) : (
                <div>
                  <FileUp className="h-8 w-8 mx-auto mb-2 text-brand-500 dark:text-brand-400 opacity-80" />
                  <div className="font-display font-semibold text-xs text-zinc-900 dark:text-foreground">
                    Drop PDF, Word, Markdown, Text, or Study Image here
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-muted-foreground font-serif mt-1">
                    Supports .pdf, .docx, .md, .txt, .png, .jpg, .webp (up to {STORAGE_LIMITS.MAX_FILE_SIZE_MB}MB)
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
                {isImageFile && onImageAttached ? 'Attach Study Image' : 'Upload & Process'}
              </Button>
            </div>
          </div>
        )}

        {/* Web Link Tab */}
        {tab === 'link' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-zinc-600 dark:text-muted-foreground mb-1">
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
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-zinc-600 dark:text-muted-foreground mb-1">
                Custom Title (Optional)
              </label>
              <Input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="e.g. Transformers Research Paper"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-surface-raised dark:border-border text-xs text-zinc-600 dark:text-muted-foreground font-serif">
              Web links are scraped and cleaned to pure markdown, removing advertisements and boilerplate.
            </div>

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

        {/* Paste Text Tab */}
        {tab === 'text' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-zinc-600 dark:text-muted-foreground mb-1">
                Document Title
              </label>
              <Input
                type="text"
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="e.g. Lecture Notes Week 4"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-display font-semibold uppercase tracking-wider text-zinc-600 dark:text-muted-foreground mb-1">
                Text Content
              </label>
              <Textarea
                rows={6}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste articles, lecture transcripts, syllabus, or raw notes here..."
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
                Save Notes
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
