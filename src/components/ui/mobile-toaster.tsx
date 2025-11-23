"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import {
  MobileToast,
  MobileToastClose,
  MobileToastDescription,
  MobileToastProvider,
  MobileToastTitle,
  MobileToastViewport,
  MobileToastIcon,
  MobileToastProgress,
} from "@/components/ui/mobile-toast"
import { getNotificationConfig } from "@/lib/notification-icons"

export function MobileToaster() {
  const { toasts } = useToast()
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 768
      );
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Only render mobile toasts on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <MobileToastProvider>
      {toasts.map(function ({ id, title, description, action, variant = "default", ...props }) {
        // Get notification config based on title or description
        const notificationType = props.className?.includes('mobile-toast-success') ? 'success' :
                              props.className?.includes('mobile-toast-error') ? 'error' :
                              props.className?.includes('mobile-toast-progress') ? 'progress' :
                              props.className?.includes('mobile-toast-warning') ? 'warning' :
                              props.className?.includes('mobile-toast-info') ? 'info' : 'default';
        
        const config = getNotificationConfig(notificationType);
        const Icon = config.icon;

        return (
          <MobileToast key={id} {...props} variant={variant} mobile={true}>
            <div className="grid gap-1 flex-1">
              <div className="flex items-start gap-3">
                <MobileToastIcon>
                  <Icon className="w-5 h-5" />
                </MobileToastIcon>
                <div className="flex-1 min-w-0">
                  {title && <MobileToastTitle>{title}</MobileToastTitle>}
                  {description && (
                    <MobileToastDescription>{description}</MobileToastDescription>
                  )}
                </div>
              </div>
              {action && (
                <div className="mt-2 flex gap-2 justify-end">
                  {action}
                </div>
              )}
            </div>
            <MobileToastClose />
            {props.className?.includes('mobile-toast-progress') && (
              <MobileToastProgress value={75} />
            )}
          </MobileToast>
        )
      })}
      <MobileToastViewport />
    </MobileToastProvider>
  )
}