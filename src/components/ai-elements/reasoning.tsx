'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Brain, ChevronDown, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Shimmer } from './shimmer';

interface ReasoningContextValue {
  isStreaming: boolean;
  duration?: number;
}

const ReasoningContext = createContext<ReasoningContextValue>({ isStreaming: false });

export interface ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
  isStreaming?: boolean;
  defaultOpen?: boolean;
  duration?: number;
}

export function Reasoning({
  isStreaming = false,
  defaultOpen,
  duration: durationProp,
  className,
  children,
  ...props
}: ReasoningProps) {
  const [duration, setDuration] = useState<number | undefined>(durationProp);
  const [elapsed, setElapsed] = useState<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
      interval = setInterval(() => {
        if (startTimeRef.current) {
          setElapsed(Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000)));
        }
      }, 500);
    } else if (startTimeRef.current !== null) {
      const finalDuration = Math.max(1, Math.ceil((Date.now() - startTimeRef.current) / 1000));
      setDuration(finalDuration);
      startTimeRef.current = null;
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  // When finished streaming, keep collapsed by default for clean look, or user defaultOpen
  const resolvedDefaultOpen = defaultOpen ?? isStreaming;

  return (
    <ReasoningContext.Provider value={{ isStreaming, duration: duration ?? (isStreaming ? elapsed : undefined) }}>
      <Collapsible
        defaultOpen={resolvedDefaultOpen}
        className={cn('not-prose my-1.5 w-full', className)}
        {...props}
      >
        {children}
      </Collapsible>
    </ReasoningContext.Provider>
  );
}

export interface ReasoningTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
}

export function ReasoningTrigger({ className, title, children, ...props }: ReasoningTriggerProps) {
  const { isStreaming, duration } = useContext(ReasoningContext);

  return (
    <CollapsibleTrigger
      className={cn(
        'group inline-flex items-center gap-2 py-1 px-2.5 rounded-lg text-xs font-display font-medium text-[#a1a1aa] hover:text-[#f4f4f2] hover:bg-[#262626]/70 transition-all cursor-pointer select-none',
        className
      )}
      {...props}
    >
      {children ?? (
        <>
          <div className="relative flex items-center justify-center shrink-0">
            {isStreaming ? (
              <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            ) : (
              <Brain className="w-3.5 h-3.5 text-brand-400 group-hover:text-brand-300" />
            )}
          </div>

          {isStreaming ? (
            <div className="flex items-center gap-2">
              <Shimmer as="span" duration={2} baseColor="#c084fc" highlightColor="#ffffff" className="font-medium">
                {title || 'Thinking & synthesizing sources...'}
              </Shimmer>
              {duration !== undefined && duration > 0 && (
                <span className="text-[10px] font-mono text-[#71717a]">{duration}s</span>
              )}
            </div>
          ) : (
            <span className="text-[#a1a1aa] group-hover:text-[#f4f4f2] transition-colors">
              {title || (duration ? `Thought for ${duration}s` : 'Reasoning & source analysis')}
            </span>
          )}

          <ChevronDown className="w-3 h-3 text-[#71717a] transition-transform duration-200 group-data-[state=open]:rotate-180 group-aria-expanded:rotate-180 ml-0.5" />
        </>
      )}
    </CollapsibleTrigger>
  );
}

export interface ReasoningContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ReasoningContent({ className, children, ...props }: ReasoningContentProps) {
  const { isStreaming } = useContext(ReasoningContext);

  return (
    <CollapsibleContent
      className={cn(
        'mt-2.5 mb-2 pl-3.5 border-l-2 border-brand-500/40 text-xs text-[#a1a1aa] font-sans leading-relaxed space-y-2',
        className
      )}
      {...props}
    >
      {isStreaming && (
        <div className="w-full max-w-md h-0.5 bg-[#262626] rounded-full overflow-hidden relative mb-2">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '350%' }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
            className="w-1/3 h-full bg-gradient-to-r from-transparent via-brand-400 to-transparent"
          />
        </div>
      )}
      {children}
    </CollapsibleContent>
  );
}
