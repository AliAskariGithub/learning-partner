'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui';

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: 'user' | 'assistant' | 'system';
}

export function Message({ from, className, children, ...props }: MessageProps) {
  const isUser = from === 'user';

  return (
    <div
      className={cn(
        'group flex w-full min-w-0 flex-col gap-2 transition-all duration-150',
        isUser ? 'items-end' : 'items-start',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface MessageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  from?: 'user' | 'assistant';
}

export function MessageContent({ from = 'assistant', className, children, ...props }: MessageContentProps) {
  const isUser = from === 'user';

  if (isUser) {
    return (
      <div
        className={cn(
          'p-3.5 px-4 rounded-2xl bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-[#262626] dark:border-[#383838] dark:text-[#f4f4f2] text-sm font-sans leading-relaxed w-fit max-w-[85%] sm:max-w-xl md:max-w-2xl text-left shadow-xs whitespace-pre-wrap break-words border',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  // AI Assistant response: Unboxed, rendered directly and openly on the canvas
  return (
    <div
      className={cn(
        'w-full min-w-0 max-w-full space-y-3 py-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface MessageActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function MessageActions({ className, children, ...props }: MessageActionsProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between pt-2.5 border-t border-zinc-200 dark:border-[#2a2a2a] text-xs text-zinc-500 dark:text-[#9a9a94]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface MessageActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip?: string;
  active?: boolean;
}

export function MessageAction({
  tooltip,
  active = false,
  className,
  children,
  ...props
}: MessageActionProps) {
  const button = (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-display transition cursor-pointer',
        active
          ? 'bg-zinc-200 text-zinc-900 dark:bg-[#262626] dark:text-[#f4f4f2]'
          : 'text-zinc-500 dark:text-[#9a9a94] hover:text-zinc-900 dark:hover:text-[#f4f4f2] hover:bg-zinc-100 dark:hover:bg-[#262626]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} side="top">
        {button}
      </Tooltip>
    );
  }

  return button;
}
