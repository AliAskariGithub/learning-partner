'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface PromptInputProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PromptInput({ className, children, ...props }: PromptInputProps) {
  return (
    <div
      className={cn(
        'max-w-3xl w-full min-w-0 mx-auto rounded-3xl bg-[#262626] border border-[#303030] shadow-2xl p-3.5 focus-within:border-brand-500/60 focus-within:ring-1 focus-within:ring-brand-500/30 transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface PromptInputTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export function PromptInputTextarea({
  className,
  rows = 2,
  ...props
}: PromptInputTextareaProps) {
  return (
    <textarea
      rows={rows}
      className={cn(
        'w-full bg-transparent border-0 text-sm text-[#f4f4f2] placeholder-[#9a9a94] resize-none focus:outline-none px-2 pt-1 font-sans leading-relaxed',
        className
      )}
      {...props}
    />
  );
}

export interface PromptInputToolsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function PromptInputTools({ className, children, ...props }: PromptInputToolsProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#303030] px-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

