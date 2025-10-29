
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardList,
  Flame,
  TrendingUp,
  Users,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { callAuthApi, callLeadApi } from '@/lib/auth-api';
import { format, isToday, isTomorrow, isValid } from 'date-fns';
import { TaskCard } from '@/components/dashboard/task-card';

const initialStats = [
  { title: 'Leads for Follow-up', value: '0', icon: Users },
  { title: 'New Leads This Week', value: '0', icon: ClipboardList },
  { title: 'Hot Leads', value: '0', icon: Flame, color: "text-red-500" },
  { title: 'Conversion Rate', value: '0%', icon: TrendingUp, color: "text-green-500" },
];

export default function AgentDashboardPage() {
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await callLeadApi('get_dashboard');
        const data = Array.isArray(response) ? response[0] : response;

        if (data && data.success) {
            setDashboardData(data);
        } else {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load dashboard data.",
            });
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load dashboard data.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const agentDataString = localStorage.getItem('agent_data');
    if (agentDataString) {
      try {
        const agentData = JSON.parse(agentDataString);
        setAgentName(agentData.agent_name || 'Agent');
      } catch (error) {
        console.error("Failed to parse agent data from localStorage", error);
        setAgentName('Agent');
      }
    }

    fetchDashboardData();
  }, [fetchDashboardData]);


  const handleAddNewLead = async () => {
    setIsCheckingSession(true);
    try {
      const agentDataString = localStorage.getItem('agent_data');
      if (!agentDataString) {
        throw new Error('Agent data not found.');
      }
      const agentData = JSON.parse(agentDataString);

      const response = await callAuthApi('validate_session', {
        agent: agentData,
        agent_id: agentData.agent_id,
      });

      const sessionData = Array.isArray(response) ? response[0] : response;

      if (sessionData && sessionData.session_id && sessionData.lead_id) {
        sessionStorage.setItem('lead_creation_session_id', sessionData.session_id);
        sessionStorage.setItem('lead_id', sessionData.lead_id);
        router.push('/leads/new/step-1');
      } else {
        throw new Error('Invalid session. Please log in again.');
      }

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
      });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('agent_data');
      router.push('/');
    } finally {
      setIsCheckingSession(false);
    }
  };

  const dynamicStats = useMemo(() => {
    if (!dashboardData) return initialStats;
    const counts = dashboardData.counts || {};
    return [
      { title: 'Leads for Follow-up', value: counts.all?.toString() || '0', icon: Users },
      { title: 'New Leads This Week', value: counts.new_this_week?.toString() || '0', icon: ClipboardList },
      { title: 'Hot Leads', value: counts.hot?.toString() || '0', icon: Flame, color: "text-red-500" },
      { title: 'Conversion Rate', value: `${dashboardData.conversion_rate || 0}%`, icon: TrendingUp, color: "text-green-500" },
    ]
  },[dashboardData]);

  const formattedTasks = useMemo(() => {
    if (!dashboardData || !dashboardData.tasks) return [];
    
    const formatTaskDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (!isValid(date)) return 'Invalid Date';
        if (isToday(date)) return `Today - ${format(date, 'MMMM d, yyyy')}`;
        if (isTomorrow(date)) return `Tomorrow - ${format(date, 'MMMM d, yyyy')}`;
        return format(date, 'eeee - MMMM d, yyyy');
    }

    return dashboardData.tasks.map((taskGroup: any) => ({
      ...taskGroup,
      formattedDate: formatTaskDate(taskGroup.date)
    }));
  }, [dashboardData]);
  
  const handleToggleExpand = (taskId: string) => {
    setExpandedTaskId(prevId => (prevId === taskId ? null : taskId));
  };
  
  if (isLoading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <section className="py-4">
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, {agentName}!</h2>
      </section>

      <section className="grid grid-cols-2 gap-4 mb-6">
        {dynamicStats.map((stat) => (
          <Card key={stat.title} className="shadow-sm">
            <CardContent className="p-4">
              <stat.icon className={`h-6 w-6 mb-2 text-gray-400 ${stat.color || ''}`} />
              <p className={`text-3xl font-bold ${stat.color || ''}`}>{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mb-6">
          <Button className="w-full bg-primary" size="lg" onClick={handleAddNewLead} disabled={isCheckingSession}>
            {isCheckingSession ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
            Add New Lead
          </Button>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-4">Upcoming Follow-up Tasks</h3>
        <div className="space-y-6">
          {formattedTasks.map((group: any) => (
            <div key={group.date}>
              <h4 className="font-semibold text-gray-600 mb-2">{group.formattedDate}</h4>
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
          {formattedTasks.length === 0 && (
            <div className="text-center text-gray-500 py-8">
                No upcoming tasks.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
