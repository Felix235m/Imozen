"use client"

import { Toaster } from '@/components/ui/toaster';
import { MobileToaster } from '@/components/ui/mobile-toaster';
import { useIsMobile } from '@/hooks/use-mobile';

export function MobileToasterWrapper() {
  const isMobile = useIsMobile();
  
  // Always show regular toaster, but add mobile toaster on mobile devices
  return (
    <>
      <Toaster />
      {isMobile && <MobileToaster />}
    </>
  );
}