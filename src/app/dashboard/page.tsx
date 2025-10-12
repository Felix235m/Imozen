
"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Phone,
  Calendar,
  Home,
  ChevronRight,
  ClipboardList,
  Flame,
  TrendingUp,
  Users,
  MessageSquare,
  Briefcase,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LeadFollowUpSheet } from '@/components/leads/lead-follow-up-sheet';
import { allLeadsData, type LeadData } from '@/lib/leads-data';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { callAuthApi, callLeadApi } from '@/lib/auth-api';
import { format, isToday, isTomorrow, formatRelative } from 'date-fns';

const initialStats = [
  { title: 'Leads for Follow-up', value: '0', icon: Users },
  { title: 'New Leads This Week', value: '0', icon: ClipboardList },
  { title: 'Hot Leads', value: '0', icon: Flame, color: "text-red-500" },
  { title: 'Conversion Rate', value: '0%', icon: TrendingUp, color: "text-green-500" },
];

const iconMap: { [key: string]: React.ElementType } = {
  email: Mail,
  phone: Phone,
  calendar: Calendar,
  home: Home,
  whatsapp: MessageSquare,
  briefcase: Briefcase,
  default: ClipboardList,
};

export default function AgentDashboardPage() {
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

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
    
    const fetchDashboardData = async () => {
        try {
            const response = await callLeadApi('get_dashboard');
            const data = Array.isArray(response) && response.length > 0 ? response[0] : null;
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
        }
    };
    fetchDashboardData();
  }, [toast]);

  const handleTaskClick = (leadId: string, icon: React.ElementType) => {
    if (icon === MessageSquare) {
      const lead = allLeadsData.find(l => l.id === leadId);
      if (lead) {
        setSelectedLead(lead);
        setIsFollowUpOpen(true);
      }
    } else {
        router.push(`/leads/${leadId}`);
    }
  };

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
        if (isToday(date)) return `Today - ${format(date, 'MMMM d, yyyy')}`;
        if (isTomorrow(date)) return `Tomorrow - ${format(date, 'MMMM d, yyyy')}`;
        return format(date, 'eeee - MMMM d, yyyy');
    }

    return dashboardData.tasks.map((taskGroup: any) => ({
      ...taskGroup,
      formattedDate: formatTaskDate(taskGroup.date)
    }));
  }, [dashboardData]);

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
                {group.items.map((task: any) => {
                  const Icon = iconMap[task.type] || iconMap.default;
                  return (
                    <Card 
                      key={task.id} 
                      className={cn("shadow-sm hover:shadow-md transition-shadow cursor-pointer")}
                      onClick={() => handleTaskClick(task.leadId, Icon)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                           <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{task.name}</p>
                          <p className="text-sm text-gray-500">{task.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </CardContent>
                    </Card>
                  )
                })}
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

      <LeadFollowUpSheet 
        open={isFollowUpOpen}
        onOpenChange={setIsFollowUpOpen}
        lead={selectedLead}
      />
    </div>
  );
}
