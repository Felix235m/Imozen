"use client";

import { useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';

interface TranslationProviderProps {
  children: React.ReactNode;
}

/**
 * TranslationProvider - Bridges React context translations to globalThis.translations
 *
 * This component ensures that translations are available globally via globalThis.translations
 * for utility functions that need access to translations outside of the React component tree.
 *
 * It synchronizes the current language translations from the LanguageContext to the global scope.
 */
export function TranslationProvider({ children }: TranslationProviderProps) {
  const { t, language } = useLanguage();

  useEffect(() => {
    // Inject translations into global scope for utility functions
    if (typeof window !== 'undefined') {
      // Initialize globalThis.translations if it doesn't exist
      if (!globalThis.translations) {
        (globalThis as any).translations = {};
      }

      // Update global translations with current language
      (globalThis as any).translations[language] = t;

      // Also set a default 'en' fallback if it doesn't exist
      if (!(globalThis as any).translations.en) {
        (globalThis as any).translations.en = t;
      }

      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 Translations injected for language: ${language}`);
        console.log(`📝 Available translation keys:`, Object.keys(t.leads?.eventTypes || {}));
      }
    }
  }, [t, language]);

  return <>{children}</>;
}