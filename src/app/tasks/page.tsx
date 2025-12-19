"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { format, isToday, isTomorrow, isValid, isPast, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import TaskCard from '@/components/dashboard/task-card';
import { useTasks } from '@/hooks/useAppData';
import { generateTaskReactKey } from '@/lib/react-key-utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

function TasksPageComponent() {
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [cancellingTaskIds, setCancellingTaskIds] = useState<Set<string>>(new Set());
  const [processedTasks, setProcessedTasks] = useState<{
    overdueTasks: any[];
    upcomingTasks: any[];
  }>({ overdueTasks: [], upcomingTasks: [] });
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const { toast } = useToast();
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : undefined;
  const searchParams = useSearchParams();

  // Hydration check - only render after client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Chunk load error handling
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      if (event.message && (
        event.message.includes('ChunkLoadError') ||
        event.message.includes('Loading chunk') ||
        event.message.includes('Failed to fetch dynamically imported module')
      )) {
        console.error('Chunk load error detected:', event);
        setError('Failed to load page components. Please refresh the page.');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && (
        event.reason.message?.includes('ChunkLoadError') ||
        event.reason.message?.includes('Loading chunk')
      )) {
        console.error('Chunk load rejection detected:', event.reason);
        setError('Failed to load page components. Please refresh the page.');
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Use localStorage-based tasks data
  const tasks = useTasks();

  // Handle URL parameter for task expansion (only after hydration)
  useEffect(() => {
    if (!isHydrated) return;

    const expandParam = searchParams?.get('expand');
    if (expandParam) {
      // Set expanded task from URL parameter
      setExpandedTaskId(expandParam);

      // Scroll to the expanded task after a short delay (client-side only)
      const timer = setTimeout(() => {
        if (typeof document !== 'undefined') {
          const element = document.getElementById(`task-${expandParam}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchParams, isHydrated]);

  // Format task date - helper function
  const formatTaskDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (!isValid(date)) return t.tasks.invalidDate;

    const formatOptions = { locale: dateLocale };
    const formattedDate = format(date, 'MMMM d, yyyy', formatOptions);

    if (isToday(date)) {
      return t.tasks.todayPrefix.replace('{{format}}', formattedDate);
    }
    if (isTomorrow(date)) {
      return t.tasks.tomorrowPrefix.replace('{{format}}', formattedDate);
    }

    return format(date, 'eeee - MMMM d, yyyy', formatOptions);
  };

  // Process tasks on CLIENT-SIDE ONLY to avoid hydration mismatch
  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration

    if (!tasks || tasks.length === 0) {
      setProcessedTasks({ overdueTasks: [], upcomingTasks: [] });
      setIsLoading(false);
      return;
    }

    // All date calculations happen here, on client only
    const today = startOfDay(new Date());
    const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const overdue: any[] = [];
    const upcoming: any[] = [];

    tasks.forEach((taskGroup: any) => {
      const taskDate = startOfDay(new Date(taskGroup.date));

      // 7-DAY FILTERING: Skip tasks beyond 7 days from today
      if (taskDate > sevenDaysFromNow) {
        console.log(`🗓️ Filtering out task group ${taskGroup.date} (beyond 7-day window)`);
        return; // Skip this group entirely
      }

      const formattedGroup = {
        ...taskGroup,
        formattedDate: formatTaskDate(taskGroup.date)
      };

      if (isPast(taskDate) && taskDate < today) {
        overdue.push(formattedGroup);
      } else {
        upcoming.push(formattedGroup);
      }
    });

    console.log(`📊 Task filtering results: ${overdue.length} overdue groups, ${upcoming.length} upcoming groups (7-day window applied)`);
    setProcessedTasks({ overdueTasks: overdue, upcomingTasks: upcoming });
    setIsLoading(false);
  }, [tasks, t, dateLocale, isHydrated]);

  const { overdueTasks, upcomingTasks } = processedTasks;

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId(prevId => (prevId === taskId ? null : taskId));
  };

  // Cancellation state management callbacks
  const handleCancellationStart = (taskId: string) => {
    setCancellingTaskIds(prev => new Set(prev).add(taskId));
    console.log(`🔄 Task ${taskId} cancellation started - hiding from UI`);
  };

  const handleCancellationRestore = (taskId: string) => {
    setCancellingTaskIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
    console.log(`↩️ Task ${taskId} cancellation failed - restoring to UI`);
  };

  const handleCancellationComplete = (taskId: string) => {
    console.log(`✅ Task ${taskId} cancellation completed - keeping in cancelled state until localStorage update`);
    // NOTE: Keep the task in cancellingTaskIds state until we're sure localStorage is updated
    // This prevents the task from briefly reappearing during the success transition
    // The task will be naturally hidden because it's removed from localStorage
    // We don't need to remove it from cancellingTaskIds since it will be filtered out anyway
  };

  const renderTaskSection = (tasks: any[], title: string, emptyMessage: string, isOverdue: boolean = false) => {
    // Defensive programming: ensure tasks is defined and is an array
    if (!tasks || !Array.isArray(tasks)) {
      console.warn('renderTaskSection received invalid tasks:', tasks);
      return null;
    }

    // Filter out tasks that are being cancelled BEFORE counting
    const filteredTasks = tasks.map((group: any) => {
      if (!group || !group.date) {
        console.warn('Skipping invalid task group:', group);
        return null;
      }

      const filteredItems = (group.items || []).filter((task: any) => {
        // Skip invalid tasks
        if (!task || !task.id) {
          console.warn('Skipping invalid task:', task);
          return false;
        }

        // Skip tasks that are being cancelled (optimistic UI)
        if (cancellingTaskIds.has(task.id)) {
          console.log(`⏳ Task ${task.id} is being cancelled - hiding from UI`);
          return false;
        }

        return true;
      });

      // Return null if no tasks left in this group after filtering
      if (filteredItems.length === 0) {
        return null;
      }

      return {
        ...group,
        items: filteredItems
      };
    }).filter(Boolean); // Remove null groups

    // Calculate total number of visible tasks (excluding cancelled ones)
    const totalVisibleTasks = filteredTasks.reduce((sum, group) => sum + (group.items?.length || 0), 0);

    // Don't render the section if no visible tasks
    if (totalVisibleTasks === 0 && !isLoading) {
      return null;
    }

    return (
      <section className="mb-8">
        <h3 className={`text-xl font-semibold mb-4 ${isOverdue ? 'text-red-600' : ''}`}>
          {title}
          {totalVisibleTasks > 0 && (
            <span className={`ml-2 text-sm font-normal ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
              ({totalVisibleTasks})
            </span>
          )}
        </h3>
        <div className="space-y-6">
          {filteredTasks.map((group: any) => {
            return (
              <div key={group.date}>
                <h4 className={`font-semibold mb-2 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                  {group.formattedDate || formatTaskDate(group.date)}
                </h4>
                <div className="space-y-3">
                  {group.items.map((task: any) => {
                    return (
                      <div key={generateTaskReactKey(task)} id={`task-${task.id}`}>
                        <TaskCard
                          task={task}
                          date={group.date}
                          isExpanded={expandedTaskId === task.id}
                          onExpand={() => handleToggleExpand(task.id)}
                          onCancellationStart={handleCancellationStart}
                          onCancellationRestore={handleCancellationRestore}
                          onCancellationComplete={handleCancellationComplete}
                          onTaskComplete={() => {
                            // Task completion callback - task should already be hidden via cancellation flow
                            // This callback exists for compatibility and future extensibility
                            console.log('📝 Task completion callback triggered - task should already be removed');
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {!isLoading && filteredTasks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {emptyMessage}
            </div>
          )}
        </div>
      </section>
    );
  };

  // Show loading state during hydration or initial loading
if (!isHydrated || isLoading) {
  return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}

// Show error state if chunk loading failed
if (error) {
  return (
    <div className="flex items-center justify-center h-96 p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button
            onClick={() => window.location.reload()}
            className="flex-1"
            variant="default"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
          <Button
            onClick={() => setError(null)}
            variant="outline"
            className="flex-1"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

return (
  <div className="p-4 pb-20">
    {renderTaskSection(
      overdueTasks,
      t.tasks.overdueTasks,
      t.tasks.noOverdueTasks,
      true
    )}

    {renderTaskSection(
      upcomingTasks,
      t.tasks.upcomingTasks,
      t.tasks.noUpcomingTasks,
      false
    )}
  </div>
);
}

function TasksPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <TasksPageComponent />
    </Suspense>
  );
}

export default TasksPage;