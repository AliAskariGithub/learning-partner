'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            data-lenis-prevent
            className={cn(
              'relative z-50 w-full max-w-lg rounded-2xl border border-border bg-surface p-6 text-foreground shadow-2xl max-h-[85vh] overflow-y-auto',
              className
            )}
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-surface-raised hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {title && (
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground pr-8">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}

            <div className="mt-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
