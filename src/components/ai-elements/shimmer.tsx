'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { CSSProperties, ElementType } from 'react';
import React, { memo, useMemo } from 'react';

export interface TextShimmerProps {
  children: React.ReactNode;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | ElementType;
  className?: string;
  duration?: number;
  spread?: number;
  highlightColor?: string;
  baseColor?: string;
}

const motionMap: Record<string, any> = {
  span: motion.span,
  p: motion.p,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  h4: motion.h4,
};

const ShimmerComponent = ({
  children,
  as = 'p',
  className,
  duration = 2,
  spread = 2,
  highlightColor = '#ffffff',
  baseColor = '#8e8e88',
}: TextShimmerProps) => {
  const MotionComponent = (typeof as === 'string' && motionMap[as]) ? motionMap[as] : motion.span;

  const textLength = typeof children === 'string' ? children.length : 25;
  const dynamicSpread = useMemo(
    () => Math.max(24, textLength * spread),
    [textLength, spread]
  );

  return (
    <MotionComponent
      className={cn(
        'relative inline-block select-none font-medium',
        className
      )}
      style={
        {
          '--spread': `${dynamicSpread}px`,
          backgroundImage: `linear-gradient(90deg, transparent 0%, transparent calc(50% - var(--spread)), ${highlightColor} 50%, transparent calc(50% + var(--spread)), transparent 100%), linear-gradient(${baseColor}, ${baseColor})`,
          backgroundSize: '300% 100%, 100% 100%',
          backgroundRepeat: 'no-repeat, no-repeat',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        } as CSSProperties
      }
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: ['100% center', '0% center'] }}
      transition={{
        duration,
        ease: 'linear',
        repeat: Infinity,
      }}
    >
      {children}
    </MotionComponent>
  );
};

export const Shimmer = memo(ShimmerComponent);
export const TextShimmer = Shimmer;
