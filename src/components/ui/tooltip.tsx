'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  delayDuration?: number;
  className?: string;
  containerClassName?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  delayDuration = 150,
  className,
  containerClassName,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    if (side === 'top') {
      top = rect.top - gap;
      if (align === 'start') left = rect.left;
      else if (align === 'end') left = rect.right;
      else left = rect.left + rect.width / 2;
    } else if (side === 'bottom') {
      top = rect.bottom + gap;
      if (align === 'start') left = rect.left;
      else if (align === 'end') left = rect.right;
      else left = rect.left + rect.width / 2;
    } else if (side === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
    } else {
      // right
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
    }

    setCoords({ top, left });
  }, [side, align]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    updatePosition();
    if (delayDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        updatePosition();
        setVisible(true);
      }, delayDuration);
    } else {
      setVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  if (!content) {
    return <>{children}</>;
  }

  // Calculate transform origin & translation based on side/align
  const getTransform = () => {
    if (side === 'top') {
      if (align === 'start') return 'translateY(-100%)';
      if (align === 'end') return 'translate(-100%, -100%)';
      return 'translate(-50%, -100%)';
    }
    if (side === 'bottom') {
      if (align === 'start') return 'translateY(0)';
      if (align === 'end') return 'translate(-100%, 0)';
      return 'translate(-50%, 0)';
    }
    if (side === 'left') {
      return 'translate(-100%, -50%)';
    }
    // right
    return 'translate(0, -50%)';
  };

  return (
    <div
      ref={triggerRef}
      className={cn('relative inline-flex', containerClassName)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {visible && (
              <div
                style={{
                  position: 'fixed',
                  top: coords.top,
                  left: coords.left,
                  transform: getTransform(),
                  zIndex: 999999,
                  pointerEvents: 'none',
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: side === 'top' ? 3 : side === 'bottom' ? -3 : 0 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  role="tooltip"
                  className={cn(
                    'select-none max-w-[280px] rounded-lg border border-[#383838] bg-[#1e1e1e]/98 text-[#f4f4f2] px-2.5 py-1 text-[11px] font-display font-medium shadow-2xl backdrop-blur-md leading-snug break-words',
                    className
                  )}
                >
                  {content}
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
