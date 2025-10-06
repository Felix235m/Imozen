"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

interface NewLeadLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onCancel: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
}

export default function NewLeadLayout({
  children,
  currentStep,
  totalSteps,
  onCancel,
  onNext,
  isNextDisabled = false,
}: NewLeadLayoutProps) {
    const router = useRouter();

  const progressValue = (currentStep / totalSteps) * 100;

  const handleBack = () => {
    if (currentStep > 1) {
        router.back();
    } else {
        router.push('/leads');
    }
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center border-b bg-white px-4 py-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="flex-1 px-4">
          <Progress value={progressValue} className="w-full" />
        </div>
        <div className="w-9"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto">
            {children}
          </div>
      </main>

      <footer className="grid grid-cols-2 gap-4 border-t bg-white p-4 sticky bottom-0">
        <Button variant="outline" size="lg" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="lg" onClick={onNext} disabled={isNextDisabled}>
          Next
        </Button>
      </footer>
    </div>
  );
}
