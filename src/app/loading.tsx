import { BookOpen, MessageSquare, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background radial ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-brand-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6">
          <div className="absolute -inset-2 rounded-3xl bg-brand-600/20 blur-md animate-pulse" />
          <div className="relative w-16 h-16 rounded-2xl bg-surface border border-brand-500/30 shadow-[0_0_30px_rgba(139,92,246,0.25)] flex items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-500 flex items-center justify-center text-white font-display font-extrabold text-base tracking-tight shadow-inner">
              LP
            </div>
          </div>
        </div>

        {/* Text Details */}
        <h2 className="font-display text-lg font-semibold text-foreground tracking-tight">
          Preparing your study space
        </h2>
        <p className="mt-1 text-xs text-muted-foreground font-serif">
          Grounding sources and verified study context...
        </p>

        {/* Shimmer progress bar */}
        <div className="w-52 h-1.5 bg-surface-raised rounded-full overflow-hidden relative my-6 border border-border/40">
          <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-brand-500 to-transparent animate-shimmer-slide" />
        </div>

        {/* Ghost study workspace cards */}
        <div className="w-full grid grid-cols-3 gap-2.5 pt-2">
          <div className="p-3 rounded-xl bg-surface/60 border border-border/50 flex flex-col items-center justify-center gap-1.5 transition-all">
            <BookOpen className="w-4 h-4 text-brand-400 animate-pulse" />
            <span className="text-[10px] font-medium text-muted-foreground">Sources</span>
          </div>
          <div className="p-3 rounded-xl bg-surface/60 border border-border/50 flex flex-col items-center justify-center gap-1.5 transition-all">
            <MessageSquare className="w-4 h-4 text-brand-400 animate-pulse" />
            <span className="text-[10px] font-medium text-muted-foreground">Chat</span>
          </div>
          <div className="p-3 rounded-xl bg-surface/60 border border-border/50 flex flex-col items-center justify-center gap-1.5 transition-all">
            <Sparkles className="w-4 h-4 text-brand-400 animate-pulse" />
            <span className="text-[10px] font-medium text-muted-foreground">Studio</span>
          </div>
        </div>
      </div>
    </div>
  );
}
