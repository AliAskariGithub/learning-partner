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
    success: <CheckCircle2 className="h-4 w-4 text-success" />,
    error: <AlertCircle className="h-4 w-4 text-error" />,
    warning: <AlertTriangle className="h-4 w-4 text-warning" />,
    info: <Info className="h-4 w-4 text-info" />,
    brand: <CheckCircle2 className="h-4 w-4 text-[#a78bfa]" />,
    neutral: <Info className="h-4 w-4 text-muted-foreground" />,
  };

  const borders = {
    success: 'border-success/30 bg-surface',
    error: 'border-error/30 bg-surface',
    warning: 'border-warning/30 bg-surface',
    info: 'border-info/30 bg-surface',
    brand: 'border-[#7c3aed]/40 bg-surface',
    neutral: 'border-border bg-surface',
  };

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md',
                borders[t.variant || 'info']
              )}
            >
              <div className="shrink-0 mt-0.5">{icons[t.variant || 'info']}</div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-display font-bold text-foreground">{t.title}</h4>
                {t.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
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
