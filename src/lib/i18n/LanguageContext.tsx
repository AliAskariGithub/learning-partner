'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES_LIST,
  LanguageInfo,
  translations,
} from './translations';
import { updateProfileSettings } from '@/app/settings/actions';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: string, ...args: (string | number)[]) => string;
  isRTL: boolean;
  languageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'learning_partner_lang';

export function LanguageProvider({
  children,
  initialLanguage = 'en',
}: {
  children: React.ReactNode;
  initialLanguage?: string;
}) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (stored && translations[stored]) return stored;
    }
    const normalized = (initialLanguage || 'en').toLowerCase().slice(0, 2) as SupportedLanguage;
    return translations[normalized] ? normalized : 'en';
  });

  // Sync to localStorage and cookie on language change
  const setLanguage = useCallback(async (newLang: string) => {
    const normalized = newLang.toLowerCase().slice(0, 2) as SupportedLanguage;
    const finalCode: SupportedLanguage = translations[normalized] ? normalized : 'en';
    setLanguageState(finalCode);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, finalCode);
        document.cookie = `${STORAGE_KEY}=${finalCode};path=/;max-age=31536000;SameSite=Lax`;
      } catch (e) {
        console.warn('Failed to save language preference locally:', e);
      }
    }

    // Persist to user profile in database
    try {
      const fd = new FormData();
      fd.append('preferredLanguage', finalCode);
      await updateProfileSettings(fd);
    } catch {
      // Non-blocking if offline or guest
    }
  }, []);

  const languageInfo = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES_LIST.find((l) => l.code === language) || {
        code: 'en' as SupportedLanguage,
        name: 'English',
        native: 'English',
        dir: 'ltr' as const,
      }
    );
  }, [language]);

  const isRTL = languageInfo.dir === 'rtl';

  const t = useCallback(
    (key: string, ...args: (string | number)[]): string => {
      const dict = translations[language] || translations.en;
      let text = dict[key] || translations.en[key] || key;

      if (args && args.length > 0) {
        args.forEach((arg, index) => {
          text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
        });
      }

      return text;
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isRTL,
        languageInfo,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback for components used outside LanguageProvider
    return {
      language: 'en' as SupportedLanguage,
      setLanguage: async () => {},
      t: (key: string, ...args: (string | number)[]) => {
        let text = translations.en[key] || key;
        args.forEach((arg, index) => {
          text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
        });
        return text;
      },
      isRTL: false,
      languageInfo: {
        code: 'en' as SupportedLanguage,
        name: 'English',
        native: 'English',
        dir: 'ltr' as const,
      },
    };
  }
  return context;
}
