"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";
import { Globe } from "lucide-react";

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
    console.log('🔍 HYDRATION DEBUG: LanguageSelector mounted');
    console.log('🔍 HYDRATION DEBUG: Current language value:', language);
  }, [language]);
  
  // Log when component is about to render
  React.useEffect(() => {
    if (isMounted) {
      console.log('🔍 HYDRATION DEBUG: LanguageSelector interactive render');
      // Check for any fdprocessedid attributes
      setTimeout(() => {
        const elements = document.querySelectorAll('[fdprocessedid]');
        if (elements.length > 0) {
          console.log('🔍 HYDRATION DEBUG: Found elements with fdprocessedid:', elements);
        }
      }, 100);
    }
  }, [isMounted, language]);

  // Don't render the interactive Select component until after hydration
  // This prevents the fdprocessedid attribute mismatch between server and client
  if (!isMounted) {
    return (
      <div className="w-[150px] h-10 gap-2 bg-white border-gray-200 shadow-sm rounded-md border px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-gray-600" />
          <span className="text-sm">🇵🇹 PT</span>
        </div>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </div>
    );
  }

  return (
    <div suppressHydrationWarning>
      <Select value={language} onValueChange={(value) => setLanguage(value as 'pt' | 'en')}>
        <SelectTrigger className="w-[150px] h-10 gap-2 bg-white border-gray-200 shadow-sm hover:bg-gray-50 transition-colors" suppressHydrationWarning>
          <Globe className="h-4 w-4 text-gray-600" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pt">
            <span className="flex items-center gap-2">
              <span>🇵🇹</span>
              <span>{t.common.portuguese}</span>
            </span>
          </SelectItem>
          <SelectItem value="en">
            <span className="flex items-center gap-2">
              <span>🇺🇸</span>
              <span>{t.common.english}</span>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

// Import ChevronDown for the non-interactive fallback
import { ChevronDown } from "lucide-react";
