
"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  { path: "/leads/new/step-1", step: 1, title: "Contact Information" },
  { path: "/leads/new/step-2", step: 2, title: "Property Requirements" },
  { path: "/leads/new/step-3", step: 3, title: "Qualification" },
  { path: "/leads/new/step-4", step: 4, title: "Initial Note" },
];

export function NewLeadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentStepIndex = steps.findIndex((step) => pathname.startsWith(step.path));
  const currentStep = steps[currentStepIndex];

  const handleBack = () => {
    if (currentStepIndex > 0) {
      router.push(steps[currentStepIndex - 1].path);
    } else {
      router.push("/leads");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="sticky top-0 z-10 bg-white p-4 border-b">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <div className="flex flex-col items-center w-full">
            <h1 className="text-xl font-bold mb-2">New Lead</h1>
             <div className="w-full mb-2">
                {currentStep && (
                    <p className="text-sm text-center font-semibold text-gray-600">
                        Step {currentStep.step}: {currentStep.title}
                    </p>
                )}
            </div>
            <div className="flex w-full items-center gap-2">
              {steps.map((step) => (
                <div
                  key={step.step}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    currentStep && step.step <= currentStep.step
                      ? "bg-primary"
                      : "bg-gray-200"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto pb-32">{children}</main>
    </div>
  );
}
