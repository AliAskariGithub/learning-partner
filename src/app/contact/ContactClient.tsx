'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { submitContactMessage } from '@/lib/contact/actions';
import { siteConfig } from '@/config/site';
import {
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  GitBranch,
  Lock,
} from 'lucide-react';

export function ContactClient({
  initialName = '',
  initialEmail = '',
  isLoggedIn = false,
}: {
  initialName?: string;
  initialEmail?: string;
  isLoggedIn?: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [topic, setTopic] = useState<'general' | 'support' | 'partnership' | 'other'>('general');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [hpWebsite, setHpWebsite] = useState(''); // Honeypot field
  const [formLoadedAt, setFormLoadedAt] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFormLoadedAt(Date.now());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!consent) {
      setErrorMessage('You must consent to the Privacy Policy to send a message.');
      return;
    }

    setLoading(true);

    try {
      const res = await submitContactMessage({
        name,
        email,
        topic,
        message,
        consent,
        hp_website: hpWebsite,
        formLoadedAt,
      });

      if (res.success) {
        setSuccess(true);
        setMessage('');
      } else {
        setErrorMessage(res.error || 'Failed to send message. Please try again.');
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Contact Form (2 columns) */}
      <div className="lg:col-span-2">
        <Card className="p-6 sm:p-8 bg-surface border-border">
          {success ? (
            <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground">
                Message Received!
              </h3>
              <p className="font-serif text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Thank you for reaching out. Your message has been saved to our inbox, and we will get back to you at <strong>{email}</strong> within {siteConfig.owner.expectedResponseTime}.
              </p>
              <div className="pt-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSuccess(false);
                    setFormLoadedAt(Date.now());
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-serif flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}

              {/* Honeypot field (hidden from real users) */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="hp_website">Leave this field blank</label>
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

              {/* Name & Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-xs font-display font-semibold text-foreground mb-1.5">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {fieldErrors.name && (
                    <p className="text-[11px] text-rose-500 font-serif mt-1">{fieldErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-display font-semibold text-foreground mb-1.5">
                    Your Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@university.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  {fieldErrors.email && (
                    <p className="text-[11px] text-rose-500 font-serif mt-1">{fieldErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Topic */}
              <div>
                <label htmlFor="topic" className="block text-xs font-display font-semibold text-foreground mb-1.5">
                  Topic <span className="text-rose-500">*</span>
                </label>
                <select
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="general">General Question</option>
                  <option value="support">Technical Support</option>
                  <option value="partnership">Partnership or Open-Source</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="message" className="block text-xs font-display font-semibold text-foreground">
                    Message <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono ${message.length > 3000 ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
                    {message.length} / 3000
                  </span>
                </div>
                <textarea
                  id="message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help? Please provide any relevant details..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-serif leading-relaxed"
                />
                {fieldErrors.message && (
                  <p className="text-[11px] text-rose-500 font-serif mt-1">{fieldErrors.message}</p>
                )}
              </div>

              {/* Privacy Consent Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 rounded border-border text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <label htmlFor="consent" className="text-xs font-serif text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the processing of my message in accordance with the{' '}
                  <Link href="/privacy" className="text-brand-500 underline underline-offset-2 hover:opacity-80">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    'Sending Message...'
                  ) : (
                    <>
                      Send Message <Send className="w-3.5 h-3.5 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>

      {/* Sidebar Info Card (1 column) */}
      <div className="space-y-4">
        <Card className="p-5 sm:p-6 bg-surface border-border space-y-4">
          <h3 className="font-display font-bold text-sm text-foreground">
            Direct Contact Information
          </h3>

          <div className="space-y-3 text-xs font-serif">
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-display font-semibold text-foreground block">Email</span>
                <a
                  href={`mailto:${siteConfig.owner.contactEmail}`}
                  className="text-brand-500 underline break-all"
                >
                  {siteConfig.owner.contactEmail}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-display font-semibold text-foreground block">Response Time</span>
                <span className="text-muted-foreground">{siteConfig.owner.expectedResponseTime}</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <GitBranch className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-display font-semibold text-foreground block">GitHub Issues</span>
                <a
                  href={siteConfig.owner.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-500 underline break-all"
                >
                  Report on GitHub
                </a>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/60 text-[11px] font-serif text-muted-foreground">
            Found a software defect or interface bug? Submit a report with an optional screenshot on our{' '}
            <Link href="/feedback" className="text-brand-500 underline">
              Bug Report Page
            </Link>
            .
          </div>
        </Card>
      </div>
    </div>
  );
}

