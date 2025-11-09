"use client";

import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { format, isToday, isTomorrow, isValid, isPast, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskCard } from '@/components/dashboard/task-card';
import { useTasks } from '@/hooks/useAppData';

export default function TasksPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [processedTasks, setProcessedTasks] = useState<{
    overdueTasks: any[];
    upcomingTasks: any[];
  }>({ overdueTasks: [], upcomingTasks: [] });

  const { toast } = useToast();
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : undefined;

  // Use localStorage-based tasks data
  const tasks = useTasks();

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
    if (!tasks || tasks.length === 0) {
      setProcessedTasks({ overdueTasks: [], upcomingTasks: [] });
      setIsLoading(false);
      return;
    }

    // All date calculations happen here, on client only
    const today = startOfDay(new Date());
    const overdue: any[] = [];
    const upcoming: any[] = [];

    tasks.forEach((taskGroup: any) => {
      const taskDate = startOfDay(new Date(taskGroup.date));
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

    setProcessedTasks({ overdueTasks: overdue, upcomingTasks: upcoming });
    setIsLoading(false);
  }, [tasks, t, dateLocale]);

  const { overdueTasks, upcomingTasks } = processedTasks;

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId(prevId => (prevId === taskId ? null : taskId));
  };

  const renderTaskSection = (tasks: any[], title: string, emptyMessage: string, isOverdue: boolean = false) => {
    // Calculate total number of individual tasks (not task groups)
    const totalTasks = tasks.reduce((sum, group) => sum + (group.items?.length || 0), 0);

    return (
      <section className="mb-8">
        <h3 className={`text-xl font-semibold mb-4 ${isOverdue ? 'text-red-600' : ''}`}>
          {title}
          {totalTasks > 0 && (
            <span className={`ml-2 text-sm font-normal ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
              ({totalTasks})
            </span>
          )}
        </h3>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {tasks.map((group: any) => (
            <div key={group.date}>
              <h4 className={`font-semibold mb-2 ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                {group.formattedDate}
              </h4>
              <div className="space-y-3">
                {group.items.map((task: any) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    date={group.date}
                    isExpanded={expandedTaskId === task.id}
                    onExpand={() => handleToggleExpand(task.id)}
                    onTaskComplete={() => {
                      // Task updates handled by localStorage subscription
                      // No need to manually refresh
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              {emptyMessage}
            </div>
          )}
        </div>
      )}
      </section>
    );
  };

  return (
    <div className="p-4 pb-20">
      {overdueTasks.length > 0 && renderTaskSection(
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