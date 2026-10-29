'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * GlidingHighlight: Shared layout indicator that travels left-to-right,
 * right-to-left, or vertically across adjacent items on hover or selection (Image 2 pattern).
 */
export function GlidingHighlight({
  activeId,
  hoverId,
  itemId,
  layoutId,
  className,
}: {
  activeId?: string | null;
  hoverId?: string | null;
  itemId: string;
  layoutId: string;
  className?: string;
}) {
  const isHovered = hoverId === itemId && activeId !== itemId;
  const isActive = activeId === itemId;

  if (isActive) {
    return (
      <motion.div
        layoutId={`${layoutId}-active`}
        className={cn('absolute inset-0 rounded-xl bg-brand-600 shadow-md pointer-events-none', className)}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
    );
  }

  if (isHovered) {
    return (
      <motion.div
        layoutId={`${layoutId}-hover`}
        className={cn(
          'absolute inset-0 rounded-xl bg-[#262626] border border-[#383838] shadow-sm pointer-events-none',
          className
        )}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />
    );
  }

  return null;
}
