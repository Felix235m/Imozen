"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { callLeadApi } from '@/lib/auth-api';
import { format, isToday, isTomorrow, isValid, isPast, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskCard } from '@/components/dashboard/task-card';

export default function TasksPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const dateLocale = language === 'pt' ? ptBR : undefined;

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await callLeadApi('get_tasks');
      const data = Array.isArray(response) ? response[0] : response;

      if (data && data.success) {
        setDashboardData(data);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load tasks data.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load tasks data.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  const { overdueTasks, upcomingTasks } = useMemo(() => {
    if (!dashboardData || !dashboardData.tasks) {
      return { overdueTasks: [], upcomingTasks: [] };
    }

    const today = startOfDay(new Date());
    const overdue: any[] = [];
    const upcoming: any[] = [];

    dashboardData.tasks.forEach((taskGroup: any) => {
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

    return { overdueTasks: overdue, upcomingTasks: upcoming };
  }, [dashboardData]);

  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId(prevId => (prevId === taskId ? null : taskId));
  };

  const renderTaskSection = (tasks: any[], title: string, emptyMessage: string, isOverdue: boolean = false) => (
    <section className="mb-8">
      <h3 className={`text-xl font-semibold mb-4 ${isOverdue ? 'text-red-600' : ''}`}>
        {title}
        {tasks.length > 0 && (
          <span className={`ml-2 text-sm font-normal ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
            ({tasks.length} {tasks.length === 1 ? t.tasks.task : t.tasks.tasks})
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
                    onTaskComplete={fetchDashboardData}
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