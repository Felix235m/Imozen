import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyIconWrapperProps {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function LazyIconWrapper({
  fallback = <Loader2 className="h-4 w-4 animate-spin" />,
  children,
  className
}: LazyIconWrapperProps) {
  return (
    <Suspense fallback={<span className={className}>{fallback}</span>}>
      {children}
    </Suspense>
  );
}