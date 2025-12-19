"use client"

import { useIsMobile } from '@/hooks/use-mobile';
import { Toaster } from '@/components/ui/toaster';
import { MobileToaster } from '@/components/ui/mobile-toast';

export function UnifiedToaster() {
  const isMobile = useIsMobile();

  // Only render one toaster based on device type
  // The mobile toaster is optimized for mobile devices with better touch targets,
  // progress indicators, and haptic feedback
  return isMobile ? <MobileToaster /> : <Toaster />;
}