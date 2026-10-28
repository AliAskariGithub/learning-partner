import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'error' | 'info';
}

export function Badge({ className, variant = 'brand', ...props }: BadgeProps) {
  const variants = {
    brand:
      'bg-brand-950 text-brand-300 border border-brand-700/60 font-semibold',
    neutral:
      'bg-surface-raised text-muted-foreground border border-border',
    success:
      'bg-success-soft text-success-text border border-success/30 font-semibold',
    warning:
      'bg-warning-soft text-warning-text border border-warning/30 font-semibold',
    error:
      'bg-error-soft text-error-text border border-error/30 font-semibold',
    info:
      'bg-info-soft text-info-text border border-info/30 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-display transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
