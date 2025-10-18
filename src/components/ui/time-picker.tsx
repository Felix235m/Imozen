"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  value?: string; // Format: "03:00 PM"
  onChange: (time: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  // Parse the time value
  const parseTime = (timeStr?: string) => {
    if (!timeStr) return { hour: '3', minute: '00', period: 'PM' };

    try {
      const [time, period] = timeStr.split(' ');
      const [hour, minute] = time.split(':');
      return { hour, minute, period };
    } catch {
      return { hour: '3', minute: '00', period: 'PM' };
    }
  };

  const { hour, minute, period } = parseTime(value);

  const updateTime = (newHour: string, newMinute: string, newPeriod: string) => {
    const formattedTime = `${newHour.padStart(2, '0')}:${newMinute} ${newPeriod}`;
    onChange(formattedTime);
  };

  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Hour Selector */}
      <Select
        value={hour}
        onValueChange={(h) => updateTime(h, minute, period)}
      >
        <SelectTrigger className="w-[80px] bg-gray-50">
          <SelectValue placeholder="Hour" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="flex items-center text-gray-500">:</span>

      {/* Minute Selector */}
      <Select
        value={minute}
        onValueChange={(m) => updateTime(hour, m, period)}
      >
        <SelectTrigger className="w-[80px] bg-gray-50">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* AM/PM Selector */}
      <Select
        value={period}
        onValueChange={(p) => updateTime(hour, minute, p)}
      >
        <SelectTrigger className="w-[80px] bg-gray-50">
          <SelectValue placeholder="AM/PM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
