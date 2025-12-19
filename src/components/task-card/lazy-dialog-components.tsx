import { lazy } from 'react';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load dialog components
const LazyTaskCardReschedule = lazy(() =>
  import('./task-card-reschedule').then(module => ({
    default: module.TaskCardReschedule
  }))
);

const LazyTaskCardCancel = lazy(() =>
  import('./task-card-cancel').then(module => ({
    default: module.TaskCardCancel
  }))
);

const LazyTaskCardComplete = lazy(() =>
  import('./task-card-complete').then(module => ({
    default: module.TaskCardComplete
  }))
);

// Dialog wrapper with loading fallback
interface DialogSuspenseWrapperProps {
  children: React.ReactNode;
}

function DialogSuspenseWrapper({ children }: DialogSuspenseWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export { LazyTaskCardReschedule, LazyTaskCardCancel, LazyTaskCardComplete, DialogSuspenseWrapper };