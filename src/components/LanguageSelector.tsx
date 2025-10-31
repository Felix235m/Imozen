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

  return (
    <Select value={language} onValueChange={(value) => setLanguage(value as 'pt' | 'en')}>
      <SelectTrigger className="w-[150px] h-10 gap-2 bg-white border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
        <Globe className="h-4 w-4 text-gray-600" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pt">
          <span className="flex items-center gap-2">
            <span>🇧🇷</span>
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
  );
}
