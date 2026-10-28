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
          'p-3.5 px-4 rounded-2xl bg-[#262626] border border-[#383838] text-sm font-sans leading-relaxed text-[#f4f4f2] w-fit max-w-[85%] sm:max-w-xl md:max-w-2xl text-left shadow-sm whitespace-pre-wrap break-words',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'w-full min-w-0 max-w-full p-4 sm:p-5 rounded-2xl bg-[#1f1f1f] border border-[#303030] shadow-md space-y-3',
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
        'flex items-center justify-between pt-2.5 border-t border-[#2a2a2a] text-xs text-[#9a9a94]',
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
          ? 'bg-[#262626] text-[#f4f4f2]'
          : 'text-[#9a9a94] hover:text-[#f4f4f2] hover:bg-[#262626]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip}>
        {button}
      </Tooltip>
    );
  }

  return button;
}

