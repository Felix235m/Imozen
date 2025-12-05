"use client";

import * as React from "react";
import { format } from "date-fns";
// @ts-ignore - TypeScript declaration issue with date-fns locales
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/hooks/useLanguage";

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  disablePastDates?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
  disablePastDates = true,
}: DatePickerProps) {
  const { t, language } = useLanguage();
  const [open, setOpen] = React.useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateLocale = language === 'pt' ? ptBR : undefined;

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-12 bg-gray-50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "EEEE - MMMM d, yyyy", { locale: dateLocale }) : <span>{placeholder || t.common.selectDate}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          locale={dateLocale}
          disabled={disablePastDates ? (date) => date < today : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
