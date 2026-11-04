'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      setIsVisible(latest > 0.01);
    });
  }, [scrollYProgress]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none bg-transparent">
      <motion.div
        className="h-full bg-gradient-to-r from-brand-600 via-brand-400 to-indigo-400 origin-left shadow-[0_0_10px_rgba(139,92,246,0.6)]"
        style={{ scaleX }}
      />
    </div>
  );
}
