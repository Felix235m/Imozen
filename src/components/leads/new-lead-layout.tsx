"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const steps = [
  { path: "/leads/new/step-1", progress: 50 },
  { path: "/leads/new/step-2", progress: 100 },
];

export function NewLeadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentStep = steps.find((step) => pathname.startsWith(step.path));
  const progressValue = currentStep ? currentStep.progress : 0;

  const handleBack = () => {
    const currentIndex = steps.findIndex((step) =>
      pathname.startsWith(step.path)
    );
    if (currentIndex > 0) {
      router.push(steps[currentIndex - 1].path);
    } else {
      router.push("/leads");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="sticky top-16 z-10 bg-white p-4 border-b">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <Progress value={progressValue} className="w-full" />
        </div>
      </div>
      <main className="flex-1 overflow-y-auto pb-32">{children}</main>
    </div>
  );
}
