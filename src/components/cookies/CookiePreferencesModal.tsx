'use client';

import React, { useState } from 'react';
import { Dialog, Button } from '@/components/ui';
import { COOKIE_CATEGORIES, COOKIE_REGISTRY, CookieCategory } from '@/config/cookies';
import { useConsent } from '@/hooks/useConsent';
import { ShieldCheck, Lock, Sliders, Check, Trash2 } from 'lucide-react';

interface CookiePreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookiePreferencesModal({ open, onOpenChange }: CookiePreferencesModalProps) {
  const { consent, updateConsent, withdrawConsent, isGpc } = useConsent();

  const [preferencesEnabled, setPreferencesEnabled] = useState(
    consent?.categories.preferences ?? false
  );

  React.useEffect(() => {
    if (consent) {
      setPreferencesEnabled(consent.categories.preferences);
    }
  }, [consent]);

  const handleSave = () => {
    updateConsent({
      preferences: preferencesEnabled,
      analytics: false,
    });
    // Automatically close the popup after completing the action
    onOpenChange(false);
  };

  const handleWithdrawAll = () => {
    withdrawConsent();
    setPreferencesEnabled(false);
    // Automatically close the popup after completing the action
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cookie & Privacy Preferences"
      description="Manage which local device cookies and state Learning Partner may save. We do not use tracking or advertising cookies."
      className="max-w-2xl max-h-[92dvh] sm:max-h-[85vh] overflow-hidden flex flex-col p-4 sm:p-6"
    >
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1 sm:pr-2 py-1 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-[#383838]">
        {isGpc && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Global Privacy Control (GPC) Active:</strong> We detected your browser’s privacy signal. Non-essential cookies are automatically disabled by default.
            </span>
          </div>
        )}

        {/* Categories List */}
        {(['strictly_necessary', 'preferences', 'analytics'] as CookieCategory[]).map((catId) => {
          const category = COOKIE_CATEGORIES[catId];
          const cookiesInCategory = COOKIE_REGISTRY.filter((c) => c.category === catId);
          const isNecessary = category.required;

          return (
            <div
              key={catId}
              className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200 dark:bg-[#222222] dark:border-[#333333] space-y-3 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm text-zinc-900 dark:text-[#f4f4f2]">
                      {category.title}
                    </h3>
                    {isNecessary ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-200/80 border border-zinc-300 text-zinc-700 dark:bg-[#2a2a2a] dark:border-[#3e3e3e] dark:text-[#9a9a94] text-[10px] font-mono">
                        <Lock className="w-2.5 h-2.5" /> Always Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-semibold">
                        <Sliders className="w-2.5 h-2.5" /> Optional
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-[#9a9a94] font-serif leading-relaxed">
                    {category.description}
                  </p>
                </div>

                {!isNecessary && catId === 'preferences' && (
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferencesEnabled}
                      onChange={(e) => setPreferencesEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-zinc-300 dark:bg-[#3a3a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                )}

                {catId === 'analytics' && (
                  <span className="text-[11px] font-mono text-zinc-400 dark:text-[#9a9a94] italic shrink-0">
                    Not implemented
                  </span>
                )}
              </div>

              {/* Cookies in this category */}
              <div className="pt-2 border-t border-zinc-200 dark:border-[#2e2e2e] space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-[#888882]">
                  Associated Cookies ({cookiesInCategory.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cookiesInCategory.map((ck) => (
                    <div
                      key={ck.name}
                      className="p-2.5 rounded-xl bg-white border border-zinc-200 dark:bg-[#191919] dark:border-[#2e2e2e] text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-zinc-900 dark:text-[#f4f4f2]">{ck.name}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-[#9a9a94] font-mono">{ck.duration}</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 dark:text-[#9a9a94] font-serif leading-snug">
                        {ck.purpose}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions - Pinned and always visible */}
      <div className="pt-3.5 sm:pt-4 border-t border-zinc-200 dark:border-[#303030] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={handleWithdrawAll}
          className="inline-flex items-center justify-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium cursor-pointer py-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete non-essential cookies now</span>
        </button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-initial text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            className="flex-1 sm:flex-initial inline-flex items-center gap-1.5 text-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
