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
    success: <CheckCircle2 className="h-5 w-5 text-white shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-white shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-white shrink-0" />,
    info: <Info className="h-5 w-5 text-white shrink-0" />,
    brand: <CheckCircle2 className="h-5 w-5 text-white shrink-0" />,
    neutral: <Info className="h-5 w-5 text-white shrink-0" />,
  };

  const styleConfig = {
    success: {
      card: 'bg-emerald-600 text-white shadow-xl shadow-black/30',
      title: 'text-white',
      desc: 'text-emerald-50/90',
    },
    error: {
      card: 'bg-red-600 text-white shadow-xl shadow-black/30',
      title: 'text-white',
      desc: 'text-red-50/90',
    },
    warning: {
      card: 'bg-amber-600 text-white shadow-xl shadow-black/30',
      title: 'text-white',
      desc: 'text-amber-50/90',
    },
    info: {
      card: 'bg-emerald-600 text-white shadow-xl shadow-black/30',
      title: 'text-white',
      desc: 'text-emerald-50/90',
    },
    brand: {
      card: 'bg-emerald-600 text-white shadow-xl shadow-black/30',
      title: 'text-white',
      desc: 'text-emerald-50/90',
    },
    neutral: {
      card: 'bg-emerald-600 text-white shadow-xl shadow-black/30',
      title: 'text-white',
      desc: 'text-emerald-50/90',
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
                  'pointer-events-auto relative overflow-hidden flex gap-3 p-3.5 rounded-xl shadow-2xl transition-all border-0 border-none outline-none ring-0',
                  t.description ? 'items-start' : 'items-center',
                  style.card
                )}
              >
                <div className={cn('shrink-0', t.description ? 'mt-0.5' : '')}>
                  {icons[variantKey]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={cn('text-xs font-semibold leading-tight', style.title)}>
                    {t.title}
                  </h4>
                  {t.description && (
                    <p className={cn('mt-0.5 text-xs font-normal leading-snug line-clamp-2', style.desc)}>
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 text-white/80 hover:text-white p-1 rounded-md transition cursor-pointer hover:bg-black/10"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
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
