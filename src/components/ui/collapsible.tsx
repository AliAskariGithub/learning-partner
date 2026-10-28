'use client';

import React, { createContext, useContext, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  contentId: string;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Collapsible({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className,
  children,
  ...props
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const contentId = useId();

  const handleSetOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    const nextOpen = typeof value === 'function' ? value(open) : value;
    if (!isControlled) {
      setUncontrolledOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <CollapsibleContext.Provider value={{ open, setOpen: handleSetOpen, contentId }}>
      <div className={cn('relative', className)} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

export function useCollapsible() {
  const ctx = useContext(CollapsibleContext);
  if (!ctx) {
    throw new Error('useCollapsible must be used within a Collapsible component');
  }
  return ctx;
}

export interface CollapsibleTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export function CollapsibleTrigger({
  className,
  children,
  onClick,
  ...props
}: CollapsibleTriggerProps) {
  const { open, setOpen, contentId } = useCollapsible();

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={contentId}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) {
          setOpen((prev) => !prev);
        }
      }}
      className={cn('cursor-pointer text-left', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export interface CollapsibleContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean;
}

export function CollapsibleContent({
  className,
  children,
  forceMount,
  ...props
}: CollapsibleContentProps) {
  const { open, contentId } = useCollapsible();

  return (
    <AnimatePresence initial={false}>
      {(open || forceMount) && (
        <motion.div
          id={contentId}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn('overflow-hidden', className)}
          {...(props as any)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

