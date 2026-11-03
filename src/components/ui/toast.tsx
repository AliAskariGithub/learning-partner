'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'brand' | 'neutral' | 'generating';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toast: (options: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, variant, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  const isGenerating = (item: ToastItem) => {
    if (item.variant === 'generating') return true;
    const titleLower = (item.title || '').toLowerCase();
    const descLower = (item.description || '').toLowerCase();
    return (
      titleLower.includes('generating') ||
      titleLower.includes('synthesiz') ||
      titleLower.includes('in progress') ||
      titleLower.includes('loading') ||
      descLower.includes('synthesizing') ||
      descLower.includes('generating in background')
    );
  };

  const styleConfig: Record<ToastVariant, { card: string; title: string; desc: string }> = {
    success: {
      card: 'bg-[#00875a] text-white shadow-2xl shadow-black/40',
      title: 'text-white',
      desc: 'text-white/95',
    },
    error: {
      card: 'bg-[#d9383a] text-white shadow-2xl shadow-black/40',
      title: 'text-white',
      desc: 'text-white/95',
    },
    warning: {
      card: 'bg-[#e28400] text-white shadow-2xl shadow-black/40',
      title: 'text-white',
      desc: 'text-white/95',
    },
    info: {
      card: 'bg-[#0052cc] text-white shadow-2xl shadow-black/40',
      title: 'text-white',
      desc: 'text-white/95',
    },
    generating: {
      card: 'bg-[#0052cc] text-white shadow-2xl shadow-black/40',
      title: 'text-white',
      desc: 'text-white/95',
    },
    brand: {
      card: 'bg-[#0052cc] text-white shadow-2xl shadow-black/40',
      title: 'text-white',
      desc: 'text-white/95',
    },
    neutral: {
      card: 'bg-[#00875a] text-white shadow-2xl shadow-black/40',
      title: 'text-white',
      desc: 'text-white/95',
    },
  };

  const getToastIcon = (item: ToastItem) => {
    if (isGenerating(item)) {
      return <Loader2 className="h-5 w-5 text-white shrink-0 animate-spin" />;
    }
    const variantKey = item.variant || 'info';
    switch (variantKey) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-white shrink-0" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-white shrink-0" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-white shrink-0" />;
      case 'info':
        return <Info className="h-5 w-5 text-white shrink-0" />;
      case 'brand':
        return <Sparkles className="h-5 w-5 text-white shrink-0" />;
      case 'neutral':
        return <CheckCircle2 className="h-5 w-5 text-white shrink-0" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-white shrink-0" />;
    }
  };

  const getToastStyle = (item: ToastItem) => {
    if (isGenerating(item)) {
      return styleConfig.generating;
    }
    const variantKey = item.variant || 'info';
    return styleConfig[variantKey] || styleConfig.info;
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast container: On mobile fixed at top-4, on desktop fixed at bottom-4 right-4 */}
      <div className="fixed top-4 inset-x-4 sm:top-auto sm:bottom-4 sm:right-4 sm:left-auto sm:max-w-sm sm:w-full z-[9999] flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const style = getToastStyle(t);

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                className={cn(
                  'pointer-events-auto relative overflow-hidden flex gap-3 p-3.5 px-4 rounded-2xl shadow-2xl transition-all border-0 border-none outline-none ring-0',
                  t.description ? 'items-start' : 'items-center',
                  style.card
                )}
              >
                <div className={cn('shrink-0', t.description ? 'mt-0.5' : '')}>
                  {getToastIcon(t)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn('text-sm font-display font-bold leading-tight', style.title)}>
                    {t.title}
                  </h4>
                  {t.description && (
                    <p className={cn('mt-0.5 text-xs font-serif leading-snug line-clamp-2', style.desc)}>
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer hover:bg-black/15"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
