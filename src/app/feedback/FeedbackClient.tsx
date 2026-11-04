'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { submitFeedbackReport } from '@/lib/feedback/actions';
import { uploadFeedbackScreenshot } from '@/lib/feedback/upload';
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Send,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react';

export function FeedbackClient({
  initialContextUrl = '',
  isLoggedIn = false,
}: {
  initialContextUrl?: string;
  isLoggedIn?: boolean;
}) {
  const [type, setType] = useState<'bug' | 'idea' | 'other'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [contextUrl, setContextUrl] = useState(initialContextUrl);

  // Screenshot upload state
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Anti-bot
  const [hpWebsite, setHpWebsite] = useState('');
  const [formLoadedAt, setFormLoadedAt] = useState<number>(0);

  // Submission state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Non-sensitive environment detection
  const [browserInfo, setBrowserInfo] = useState('');
  const [osInfo, setOsInfo] = useState('');

  useEffect(() => {
    setFormLoadedAt(Date.now());
    if (typeof window !== 'undefined') {
      if (!contextUrl) {
        setContextUrl(window.location.href);
      }
      const ua = navigator.userAgent;
      setBrowserInfo(ua.slice(0, 150));

      let detectedOs = 'Unknown OS';
      if (ua.includes('Win')) detectedOs = 'Windows';
      else if (ua.includes('Mac')) detectedOs = 'macOS';
      else if (ua.includes('Linux')) detectedOs = 'Linux';
      else if (ua.includes('Android')) detectedOs = 'Android';
      else if (ua.includes('iPhone') || ua.includes('iPad')) detectedOs = 'iOS';
      setOsInfo(detectedOs);
    }
  }, [contextUrl]);

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Screenshot exceeds the maximum size limit of 5MB.');
      return;
    }

    setScreenshotFile(file);
    setUploadingImage(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('screenshot', file);

    const res = await uploadFeedbackScreenshot(formData);
    setUploadingImage(false);

    if (res.success && res.url) {
      setScreenshotUrl(res.url);
    } else {
      setScreenshotFile(null);
      setErrorMessage(res.error || 'Failed to upload screenshot.');
    }
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await submitFeedbackReport({
        type,
        title,
        description,
        stepsToReproduce: type === 'bug' ? stepsToReproduce : undefined,
        expectedResult: type === 'bug' ? expectedResult : undefined,
        actualResult: type === 'bug' ? actualResult : undefined,
        severity,
        screenshotUrl: screenshotUrl || undefined,
        contextUrl,
        browserInfo,
        osInfo,
        appVersion: '0.1.0',
        hp_website: hpWebsite,
        formLoadedAt,
      });

      if (res.success) {
        setSuccess(true);
        setTitle('');
        setDescription('');
        setStepsToReproduce('');
        setExpectedResult('');
        setActualResult('');
        removeScreenshot();
      } else {
        setErrorMessage(res.error || 'Failed to submit report. Please review the form.');
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 bg-surface border-border">
      {success ? (
        <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="font-display font-bold text-xl text-foreground">
            Thank you for your report!
          </h3>
          <p className="font-serif text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your feedback has been logged in our development inbox. We review all incoming issues to guide bug fixes and feature updates.
          </p>
          <div className="pt-4 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSuccess(false);
                setFormLoadedAt(Date.now());
              }}
            >
              Submit Another Report
            </Button>
            <Link href="/help">
              <Button variant="primary" size="sm">
                Return to Documentation
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-serif flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Honeypot field */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="hp_website">Leave blank</label>
            <input
              type="text"
              id="hp_website"
              name="hp_website"
              value={hpWebsite}
              onChange={(e) => setHpWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* Report Type Selector */}
          <div>
            <label className="block text-xs font-display font-semibold text-foreground mb-2">
              Report Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'bug', label: 'Bug / Defect', icon: Bug },
                { id: 'idea', label: 'Feature Idea', icon: Lightbulb },
                { id: 'other', label: 'General Feedback', icon: MessageSquare },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as any)}
                    className={`p-3 rounded-xl border text-xs font-display font-semibold transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 shadow-sm'
                        : 'bg-surface-raised border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-xs font-display font-semibold text-foreground mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'bug' ? 'e.g. PDF citation chip links to wrong page' : 'e.g. Export quiz deck to Anki format'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {fieldErrors.title && (
              <p className="text-[11px] text-rose-500 font-serif mt-1">{fieldErrors.title}</p>
            )}
          </div>

          {/* Severity (Only for bugs) */}
          {type === 'bug' && (
            <div>
              <label className="block text-xs font-display font-semibold text-foreground mb-1.5">
                Severity Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'low', label: 'Low (cosmetic, typo)' },
                  { id: 'medium', label: 'Medium (feature degraded)' },
                  { id: 'high', label: 'High (blocks study)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id as any)}
                    className={`py-2 px-3 rounded-lg border text-xs font-display transition-colors cursor-pointer text-center ${
                      severity === s.id
                        ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-semibold'
                        : 'bg-surface-raised border-border text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="description" className="block text-xs font-display font-semibold text-foreground">
                Description <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[11px] font-mono ${description.length > 4000 ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
                {description.length} / 4000
              </span>
            </div>
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or proposal clearly..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-serif leading-relaxed"
            />
            {fieldErrors.description && (
              <p className="text-[11px] text-rose-500 font-serif mt-1">{fieldErrors.description}</p>
            )}
          </div>

          {/* Bug Details: Steps to Reproduce & Expected vs Actual */}
          {type === 'bug' && (
            <div className="space-y-4 pt-2 border-t border-border/50">
              <div>
                <label htmlFor="steps" className="block text-xs font-display font-semibold text-foreground mb-1.5">
                  Steps to Reproduce (Optional)
                </label>
                <textarea
                  id="steps"
                  rows={2}
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder="1. Uploaded lecture.pdf&#10;2. Clicked Quiz mode&#10;3. Received error..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-serif"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expected" className="block text-xs font-display font-semibold text-foreground mb-1.5">
                    Expected Result
                  </label>
                  <input
                    type="text"
                    id="expected"
                    value={expectedResult}
                    onChange={(e) => setExpectedResult(e.target.value)}
                    placeholder="e.g. 5 multiple choice questions generate"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-raised border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label htmlFor="actual" className="block text-xs font-display font-semibold text-foreground mb-1.5">
                    Actual Result
                  </label>
                  <input
                    type="text"
                    id="actual"
                    value={actualResult}
                    onChange={(e) => setActualResult(e.target.value)}
                    placeholder="e.g. Blank output card"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface-raised border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Screenshot Upload */}
          <div className="space-y-2 pt-2 border-t border-border/50">
            <label className="block text-xs font-display font-semibold text-foreground">
              Screenshot (Optional • PNG, JPEG, WebP up to 5MB)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp"
              onChange={handleScreenshotChange}
              className="hidden"
              id="screenshot-input"
            />

            {screenshotUrl ? (
              <div className="p-3 rounded-xl bg-surface-raised border border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-foreground truncate">
                  <ImageIcon className="w-4 h-4 text-brand-500 shrink-0" />
                  <span className="truncate">{screenshotFile?.name || 'screenshot.png'}</span>
                  <span className="text-emerald-500 text-[10px] font-bold">Uploaded</span>
                </div>
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="p-1 rounded text-muted-foreground hover:text-rose-500 cursor-pointer"
                  title="Remove screenshot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="screenshot-input"
                className="w-full p-4 rounded-xl border border-dashed border-border bg-surface-raised/40 hover:bg-surface-raised flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs font-display font-semibold text-foreground">
                  {uploadingImage ? 'Validating and uploading...' : 'Click to attach screenshot'}
                </span>
                <span className="text-[10px] font-serif text-muted-foreground">
                  EXIF metadata is automatically stripped before saving
                </span>
              </label>
            )}
          </div>

          {/* Non-sensitive context summary */}
          <div className="p-3 rounded-xl bg-surface-raised border border-border/60 text-[11px] font-mono text-muted-foreground space-y-0.5">
            <div><strong>Detected Environment:</strong> {osInfo} • {browserInfo ? 'Modern Browser' : 'Browser'}</div>
            {contextUrl && <div className="truncate"><strong>URL Context:</strong> {contextUrl}</div>}
            <div><strong>Privacy Guarantee:</strong> We never attach API keys, source files, or notebook memory.</div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading || uploadingImage}
              className="w-full sm:w-auto"
            >
              {loading ? (
                'Submitting Report...'
              ) : (
                <>
                  Submit Report <Send className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

