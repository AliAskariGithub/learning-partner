'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, Badge, Button } from '@/components/ui';
import { Source, SourceChunk } from '@/db/schema';
import { getSourceChunks } from '@/app/app/notebook-actions';
import { FileText, Search, Hash, BookOpen, Layers } from 'lucide-react';

interface SourceViewerDialogProps {
  source: Source | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightChunkId?: string | null;
}

export function SourceViewerDialog({
  source,
  open,
  onOpenChange,
  highlightChunkId,
}: SourceViewerDialogProps) {
  const [chunks, setChunks] = useState<SourceChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [activeChunkIndex, setActiveChunkIndex] = useState<number | null>(null);

  useEffect(() => {
    if (source && open) {
      setLoading(true);
      getSourceChunks(source.id)
        .then((data) => {
          setChunks(data);
          if (highlightChunkId) {
            const match = data.find((c) => c.id === highlightChunkId);
            if (match) {
              setActiveChunkIndex(match.chunkIndex);
              setTimeout(() => {
                const el = document.getElementById(`chunk-${match.chunkIndex}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 150);
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load chunks:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setChunks([]);
      setFilterQuery('');
      setActiveChunkIndex(null);
    }
  }, [source, open, highlightChunkId]);

  if (!source) return null;

  const filteredChunks = chunks.filter((c) =>
    filterQuery ? c.content.toLowerCase().includes(filterQuery.toLowerCase()) : true
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={source.title}
      description={`Source details, word count, and indexed retrieval chunks for citation anchoring.`}
      className="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Source metadata header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface-raised border border-border text-xs">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
              Format:
            </span>
            <Badge variant="brand">{source.type.toUpperCase()}</Badge>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-muted-foreground">
              {source.wordCount.toLocaleString()} words
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-muted-foreground">
              {chunks.length} chunks
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search in source..."
              className="bg-surface border border-border rounded-lg pl-8 pr-3 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-brand-500 font-sans w-48"
            />
          </div>
        </div>

        {/* Chunks scroll view */}
        <div
          className="max-h-[60vh] overflow-y-auto pr-1 space-y-3 font-serif text-sm leading-relaxed"
          data-lenis-prevent
        >
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-xs font-sans">
              <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading source chunks...</span>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-xs font-sans border border-dashed border-border rounded-xl">
              {filterQuery ? 'No matching text chunks found.' : 'No chunks available for this source yet.'}
            </div>
          ) : (
            filteredChunks.map((chunk) => {
              const isHighlighted = activeChunkIndex === chunk.chunkIndex;
              return (
                <div
                  key={chunk.id}
                  id={`chunk-${chunk.chunkIndex}`}
                  onClick={() => setActiveChunkIndex(chunk.chunkIndex)}
                  className={`p-4 rounded-xl border transition cursor-pointer text-foreground ${
                    isHighlighted
                      ? 'bg-brand-500/10 border-brand-500 shadow-sm'
                      : 'bg-surface border-border hover:border-brand-500/40 hover:bg-surface-raised'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/50 text-[11px] font-mono text-muted-foreground">
                    <div className="flex items-center gap-1.5 font-display font-semibold text-brand-400">
                      <Hash className="h-3 w-3" />
                      <span>Chunk {chunk.chunkIndex + 1}</span>
                      {chunk.pageNumber && (
                        <span className="text-muted-foreground ml-1">
                          (Page {chunk.pageNumber})
                        </span>
                      )}
                    </div>
                    <span>{chunk.tokenCount} tokens</span>
                  </div>

                  <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-foreground/90">
                    {chunk.content}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Close Viewer
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
