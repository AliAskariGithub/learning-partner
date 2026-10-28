'use client';

import React, { createContext, useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [internalTab, setInternalTab] = useState(defaultValue || '');
  const activeTab = value !== undefined ? value : internalTab;

  const setActiveTab = (tab: string) => {
    if (value === undefined) setInternalTab(tab);
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl bg-surface-raised p-1 text-muted-foreground border border-border',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used inside Tabs');

  const isActive = context.activeTab === value;

  return (
    <button
      type="button"
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-display font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer',
        isActive ? 'text-white' : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab-highlight"
          className="absolute inset-0 rounded-lg bg-brand-600 shadow-sm"
          transition={{ type: 'spring', bounce: 0.15, duration: 0.3 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used inside Tabs');

  if (context.activeTab !== value) return null;

  return (
    <div
      className={cn(
        'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        className
      )}
    >
      {children}
    </div>
  );
}
