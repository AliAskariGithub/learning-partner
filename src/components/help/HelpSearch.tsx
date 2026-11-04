'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, X, FileText, ArrowRight } from 'lucide-react';

interface ArticleSearchItem {
  slug: string;
  title: string;
  summary: string;
  category: string;
}

export function HelpSearch({ articles }: { articles: ArticleSearchItem[] }) {
  const [query, setQuery] = useState('');

  const filtered = query.trim() === ''
    ? []
    : articles.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.summary.toLowerCase().includes(query.toLowerCase()) ||
          a.category.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="relative max-w-xl mx-auto w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documentation (e.g., chunking, quiz scoring, Gemini 429)..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-surface border border-border text-foreground placeholder:text-muted-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Live Search Results Dropdown */}
      {query.trim() !== '' && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-surface border border-border rounded-2xl shadow-2xl z-30 space-y-1 max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground font-serif">
              No articles matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item) => (
              <Link
                key={item.slug}
                href={`/help/${item.slug}`}
                onClick={() => setQuery('')}
                className="p-3 rounded-xl hover:bg-surface-raised flex items-start gap-3 transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-xs text-foreground group-hover:text-brand-500 transition-colors truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground bg-surface-raised px-1.5 py-0.2 rounded">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] font-serif text-muted-foreground line-clamp-1 mt-0.5">
                    {item.summary}
                  </p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

