'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'brand' | 'neutral';

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

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />,
    info: <Info className="h-4 w-4 text-blue-400 shrink-0" />,
    brand: <CheckCircle2 className="h-4 w-4 text-brand-400 shrink-0" />,
    neutral: <Info className="h-4 w-4 text-[#9a9a94] shrink-0" />,
  };

  const styleConfig = {
    success: {
      card: 'border-emerald-500/40 bg-[#0d2216]/95 text-emerald-100 shadow-emerald-950/50',
      bar: 'bg-emerald-500',
      title: 'text-emerald-200',
      desc: 'text-emerald-300/80',
    },
    error: {
      card: 'border-red-500/40 bg-[#281114]/95 text-red-100 shadow-red-950/50',
      bar: 'bg-red-500',
      title: 'text-red-200',
      desc: 'text-red-300/80',
    },
    warning: {
      card: 'border-amber-500/40 bg-[#261d0c]/95 text-amber-100 shadow-amber-950/50',
      bar: 'bg-amber-500',
      title: 'text-amber-200',
      desc: 'text-amber-300/80',
    },
    info: {
      card: 'border-blue-500/40 bg-[#0f1c30]/95 text-blue-100 shadow-blue-950/50',
      bar: 'bg-blue-500',
      title: 'text-blue-200',
      desc: 'text-blue-300/80',
    },
    brand: {
      card: 'border-brand-500/40 bg-[#1d1233]/95 text-brand-100 shadow-brand-950/50',
      bar: 'bg-brand-500',
      title: 'text-brand-200',
      desc: 'text-brand-300/80',
    },
    neutral: {
      card: 'border-[#383838] bg-[#222222]/95 text-[#f4f4f2] shadow-black/40',
      bar: 'bg-[#52525b]',
      title: 'text-[#f4f4f2]',
      desc: 'text-[#9a9a94]',
    },
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const variantKey = t.variant || 'info';
            const style = styleConfig[variantKey] || styleConfig.info;

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                className={cn(
                  'pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-colors',
                  style.card
                )}
              >
                {/* Left Semantic Indicator Stripe */}
                <div className={cn('absolute left-0 top-0 bottom-0 w-1', style.bar)} />

                <div className="shrink-0 mt-0.5 ml-1">{icons[variantKey]}</div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn('text-xs font-display font-bold leading-tight', style.title)}>
                    {t.title}
                  </h4>
                  {t.description && (
                    <p className={cn('mt-0.5 text-xs font-sans leading-snug line-clamp-2', style.desc)}>
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded transition cursor-pointer"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
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
