'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';

export interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt = 'Uploaded study diagram', onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);

  // Close on ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (src) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Image preview lightbox"
      >
        {/* Top Control Bar */}
        <div
          className="absolute top-4 right-4 flex items-center gap-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            className="p-2 rounded-xl bg-[#262626]/80 hover:bg-[#333333] text-[#f4f4f2] border border-[#3e3e3e] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="p-2 rounded-xl bg-[#262626]/80 hover:bg-[#333333] text-[#f4f4f2] border border-[#3e3e3e] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <a
            href={src}
            download="study-image"
            className="p-2 rounded-xl bg-[#262626]/80 hover:bg-[#333333] text-[#f4f4f2] border border-[#3e3e3e] transition-colors cursor-pointer"
            title="Download Image"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#262626]/80 hover:bg-[#333333] text-[#f4f4f2] border border-[#3e3e3e] transition-colors cursor-pointer"
            title="Close Lightbox (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Centered Image */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-w-[90vw] max-h-[85vh] flex items-center justify-center overflow-hidden cursor-zoom-out"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl select-none"
            style={{ transform: `scale(${scale})`, transition: 'transform 0.15s ease-out' }}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

