"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { pt, Translations } from '@/locales/pt';
import { en } from '@/locales/en';
import { LANGUAGE_MAP, REVERSE_LANGUAGE_MAP, type AgentData } from '@/types/agent';

export type Language = 'pt' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = { pt, en };

// Helper function to get language from agent data
function getLanguageFromAgentData(): Language | null {
  try {
    const agentDataString = localStorage.getItem('agent_data');
    if (!agentDataString) return null;

    const agentData: AgentData = JSON.parse(agentDataString);
    const agentLang = agentData.agent_language;

    if (!agentLang) return null;

    // Map agent language to app language code
    return LANGUAGE_MAP[agentLang] || null;
  } catch (error) {
    console.error('Failed to parse agent data for language:', error);
    return null;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with 'pt' as default - this will be the same on both server and client
  // preventing hydration mismatches. The language will update after mount via useEffect.
  const [language, setLanguageState] = useState<Language>('pt');

  useEffect(() => {
    // Priority 1: Agent profile language (highest priority)
    const agentLanguage = getLanguageFromAgentData();
    if (agentLanguage) {
      setLanguageState(agentLanguage);
      return;
    }

    // Priority 2: Standalone localStorage language (fallback)
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'pt' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
    }

    // Priority 3: Default Portuguese (final fallback - already set in useState)
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);

    // Also update agent_data if it exists (bidirectional sync)
    try {
      const agentDataString = localStorage.getItem('agent_data');
      if (agentDataString) {
        const agentData: AgentData = JSON.parse(agentDataString);
        agentData.agent_language = REVERSE_LANGUAGE_MAP[lang] as AgentData['agent_language'];
        localStorage.setItem('agent_data', JSON.stringify(agentData));
      }
    } catch (error) {
      console.error('Failed to update agent_data language:', error);
    }
  };

  // Always provide consistent context to prevent hydration mismatch
  // The language state starts as 'pt' on both server and client, then updates via useEffect
  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
