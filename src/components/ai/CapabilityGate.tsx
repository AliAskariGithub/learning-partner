'use client';

import React, { useState } from 'react';
import { useModelCapabilities, CapabilityFeature } from '@/hooks/useModelCapabilities';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CapabilityGateProps {
  feature: CapabilityFeature;
  modelId: string;
  children: React.ReactNode;
  className?: string;
  tooltipPlacement?: 'top' | 'bottom';
}

/**
 * CapabilityGate: Wraps features and gracefully disables them with an explanatory tooltip
 * when the active model lacks the required capability (vision, audio, structured output, etc.).
 */
export function CapabilityGate({
  feature,
  modelId,
  children,
  className = '',
  tooltipPlacement = 'top',
}: CapabilityGateProps) {
  const { supports, getDisabledReason } = useModelCapabilities(modelId);
  const isSupported = supports(feature);
  const disabledReason = getDisabledReason(feature);

  const [tooltipVisible, setTooltipVisible] = useState(false);

  if (isSupported) {
    return <div className={cn('w-full h-full', className)}>{children}</div>;
  }

  return (
    <div
      className={cn('relative group w-full h-full', className)}
      onMouseEnter={() => setTooltipVisible(true)}
      onMouseLeave={() => setTooltipVisible(false)}
      onFocus={() => setTooltipVisible(true)}
      onBlur={() => setTooltipVisible(false)}
    >
      {/* Disabled target element */}
      <div className="w-full h-full cursor-not-allowed select-none">
        {children}
      </div>

      {/* Explanatory Tooltip when hovered or focused */}
      {tooltipVisible && disabledReason && (
        <div
          role="tooltip"
          className={`absolute ${
            tooltipPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } left-1/2 -translate-x-1/2 z-50 w-64 p-2.5 rounded-xl bg-[#262626] border border-[#3a3a3a] text-[#f4f4f2] text-xs shadow-2xl backdrop-blur-md pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-display font-semibold text-[11px] text-[#f4f4f2] mb-0.5">
                Model Does Not Support This
              </p>
              <p className="text-[11px] text-[#9a9a94] font-serif leading-tight">
                {disabledReason}
              </p>
            </div>
          </div>
          {/* Subtle caret arrow */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#262626] border-[#3a3a3a] ${
              tooltipPlacement === 'top'
                ? 'top-full -mt-1 border-r border-b'
                : 'bottom-full -mb-1 border-l border-t'
            }`}
          />
        </div>
      )}
    </div>
  );
}
