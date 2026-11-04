'use client';

import React from 'react';
import Link from 'next/link';
import { Bug } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReportProblemLinkProps {
  className?: string;
  sourceContext?: string;
}

export function ReportProblemLink({
  className,
  sourceContext,
}: ReportProblemLinkProps) {
  const query = sourceContext ? `?context=${encodeURIComponent(sourceContext)}` : '';

  return (
    <Link
      href={`/feedback${query}`}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-display transition-colors py-1 px-2 rounded-lg hover:bg-surface border border-transparent hover:border-border',
        className
      )}
      title="Report a problem or submit feedback"
    >
      <Bug className="w-3.5 h-3.5 text-brand-500" />
      <span>Report a problem</span>
    </Link>
  );
}

