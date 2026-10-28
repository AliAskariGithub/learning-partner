import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:border-brand-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-error focus-visible:ring-error',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
