"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const MobileToastProvider = ToastPrimitives.Provider

const MobileToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex max-h-screen w-full max-w-sm flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:left-auto sm:transform-none sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
MobileToastViewport.displayName = ToastPrimitives.Viewport.displayName

const mobileToastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200",
        info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
        progress: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
      },
      mobile: {
        true: "min-h-[60px] touch-manipulation",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      mobile: false,
    },
  }
)

const MobileToast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof mobileToastVariants>
>(({ className, variant, mobile, ...props }, ref) => {
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

  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(mobileToastVariants({ variant, mobile: isMobile }), className)}
      {...props}
    />
  )
})
MobileToast.displayName = ToastPrimitives.Root.displayName

const MobileToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 min-w-[60px] shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive touch-manipulation",
      className
    )}
    {...props}
  />
))
MobileToastAction.displayName = ToastPrimitives.Action.displayName

const MobileToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 touch-manipulation",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
MobileToastClose.displayName = ToastPrimitives.Close.displayName

const MobileToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
MobileToastTitle.displayName = ToastPrimitives.Title.displayName

const MobileToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
MobileToastDescription.displayName = ToastPrimitives.Description.displayName

// Progress indicator component for mobile toasts
const MobileToastProgress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value?: number; max?: number }
>(({ className, value = 0, max = 100, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("absolute bottom-0 left-0 h-1 w-full bg-gray-200 dark:bg-gray-700", className)}
    {...props}
  >
    <div
      className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
    />
  </div>
))
MobileToastProgress.displayName = "MobileToastProgress"

// Icon wrapper for mobile toasts
const MobileToastIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-shrink-0 w-6 h-6 mr-3", className)}
    {...props}
  >
    {children}
  </div>
))
MobileToastIcon.displayName = "MobileToastIcon"

type MobileToastProps = React.ComponentPropsWithoutRef<typeof MobileToast>

type MobileToastActionElement = React.ReactElement<typeof MobileToastAction>

export function MobileToaster() {
  const { toasts } = useToast()

  return (
    <MobileToastProvider>
      <MobileToastViewport>
        {toasts.map(function ({ id, title, description, action, variant, ...props }) {
          return (
            <MobileToast key={id} variant={variant} {...props}>
              <div className="grid gap-1">
                {title && <MobileToastTitle>{title}</MobileToastTitle>}
                {description && (
                  <MobileToastDescription>{description}</MobileToastDescription>
                )}
              </div>
              {action}
              <MobileToastClose />
            </MobileToast>
          )
        })}
      </MobileToastViewport>
    </MobileToastProvider>
  )
}

export {
  type MobileToastProps,
  type MobileToastActionElement,
  MobileToastProvider,
  MobileToastViewport,
  MobileToast,
  MobileToastTitle,
  MobileToastDescription,
  MobileToastClose,
  MobileToastAction,
  MobileToastProgress,
  MobileToastIcon,
}