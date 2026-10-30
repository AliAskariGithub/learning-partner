'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConsentRecord } from '@/config/cookies';
import {
  getClientConsent,
  saveClientConsent,
  deleteNonEssentialCookies,
  setClientPreferenceCookie,
  isGpcSignalEnabled,
} from '@/lib/cookies/consent';

export interface UseConsentResult {
  consent: ConsentRecord | null;
  hasAnswered: boolean;
  isGpc: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  updateConsent: (categories: { preferences: boolean; analytics: boolean }) => void;
  withdrawConsent: () => void;
  setPreference: (name: string, value: string) => boolean;
}

export function useConsent(): UseConsentResult {
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(true); // default true to avoid flash on mount
  const [isGpc, setIsGpc] = useState<boolean>(false);

  useEffect(() => {
    const gpcActive = isGpcSignalEnabled();
    setIsGpc(gpcActive);

    const stored = getClientConsent();
    if (stored) {
      setConsent(stored);
      setHasAnswered(true);
    } else {
      setHasAnswered(false);
      if (gpcActive) {
        // GPC defaults to non-essential rejected
        const defaultGpc = saveClientConsent({ preferences: false, analytics: false });
        setConsent(defaultGpc);
        setHasAnswered(true);
      }
    }
  }, []);

  const acceptAll = useCallback(() => {
    const updated = saveClientConsent({ preferences: true, analytics: false });
    setConsent(updated);
    setHasAnswered(true);
  }, []);

  const rejectNonEssential = useCallback(() => {
    const updated = saveClientConsent({ preferences: false, analytics: false });
    setConsent(updated);
    setHasAnswered(true);
  }, []);

  const updateConsent = useCallback((categories: { preferences: boolean; analytics: boolean }) => {
    const updated = saveClientConsent(categories);
    setConsent(updated);
    setHasAnswered(true);
  }, []);

  const withdrawConsent = useCallback(() => {
    deleteNonEssentialCookies();
    const updated = saveClientConsent({ preferences: false, analytics: false });
    setConsent(updated);
    setHasAnswered(true);
  }, []);

  const setPreference = useCallback((name: string, value: string): boolean => {
    return setClientPreferenceCookie(name, value);
  }, []);

  return {
    consent,
    hasAnswered,
    isGpc,
    acceptAll,
    rejectNonEssential,
    updateConsent,
    withdrawConsent,
    setPreference,
  };
}

