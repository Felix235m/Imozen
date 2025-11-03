"use client";

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { ImoZenLogo } from '@/components/logo';

interface LoadingModalProps {
  isOpen: boolean;
  messages?: string[];
  currentStep?: number;
}

const DEFAULT_MESSAGES = [
  'Fetching data',
  'Loading the data',
  'Getting details from DB',
  'Preparing app data',
];

export function LoadingModal({
  isOpen,
  messages = DEFAULT_MESSAGES,
  currentStep = 0,
}: LoadingModalProps) {
  const [messageIndex, setMessageIndex] = React.useState(0);

  React.useEffect(() => {
    if (!isOpen) {
      setMessageIndex(0);
      return;
    }

    // Cycle through messages every 1 second
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, messages.length]);

  if (!isOpen) return null;

  const displayMessage = currentStep !== undefined && currentStep >= 0
    ? messages[Math.min(currentStep, messages.length - 1)]
    : messages[messageIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-8 rounded-lg bg-white p-12 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center">
          <ImoZenLogo size="lg" />
        </div>

        {/* Spinner */}
        <Loader2 className="h-16 w-16 animate-spin text-primary" />

        {/* Message */}
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-800 animate-pulse">
            {displayMessage}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {messages.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  index === messageIndex
                    ? 'bg-primary w-8'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
