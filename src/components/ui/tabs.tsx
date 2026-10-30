'use client';

import React, { createContext, useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
  hoveredTab: string | null;
  setHoveredTab: (id: string | null) => void;
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
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const activeTab = value !== undefined ? value : internalTab;

  const setActiveTab = (tab: string) => {
    if (value === undefined) setInternalTab(tab);
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, hoveredTab, setHoveredTab }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);

  return (
    <div
      onMouseLeave={() => context?.setHoveredTab(null)}
      className={cn(
        'relative inline-flex h-12 items-center justify-start sm:justify-center rounded-2xl bg-[#191919] p-1 text-muted-foreground border border-[#303030]',
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
  const isHovered = context.hoveredTab === value && !isActive;

  return (
    <button
      type="button"
      onClick={() => context.setActiveTab(value)}
      onMouseEnter={() => context.setHoveredTab(value)}
      className={cn(
        'relative h-10 inline-flex items-center justify-center whitespace-nowrap rounded-xl px-3.5 text-xs font-display font-semibold transition-colors focus-visible:outline-none cursor-pointer shrink-0',
        isActive ? 'text-white' : 'text-[#9a9a94] hover:text-[#f4f4f2]',
        className
      )}
    >
      {isActive && (
        <motion.div
          layoutId="active-tab-highlight"
          className="absolute inset-0 rounded-xl bg-brand-600 shadow-md shadow-brand-600/30"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      {isHovered && (
        <motion.div
          layoutId="hover-tab-highlight"
          className="absolute inset-0 rounded-xl bg-[#262626] border border-[#383838]"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
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
      role="tabpanel"
      className={cn(
        'mt-4 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 animate-in fade-in-50 duration-200',
        className
      )}
    >
      {children}
    </div>
  );
}
