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
  hideCloseButton?: boolean;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  hideCloseButton = false,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            data-lenis-prevent
            className={cn(
              'relative z-50 w-full max-w-lg rounded-2xl sm:rounded-3xl border border-border bg-surface p-4 sm:p-6 text-foreground shadow-2xl max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto',
              className
            )}
          >
            {!hideCloseButton && (
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-xl p-1.5 text-muted-foreground hover:bg-surface-raised hover:text-foreground transition focus-visible:outline-none cursor-pointer z-20"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {title && (
              <h2 className="font-display text-lg font-bold tracking-tight text-foreground pr-8 shrink-0">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground shrink-0">{description}</p>
            )}

            {title ? <div className="mt-4 flex-1 min-h-0 flex flex-col">{children}</div> : children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
