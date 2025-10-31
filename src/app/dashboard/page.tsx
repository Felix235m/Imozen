
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
import { useLanguage } from '@/hooks/useLanguage';
import { callAuthApi, callLeadApi } from '@/lib/auth-api';

export default function AgentDashboardPage() {
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  const initialStats = [
    { title: t.dashboard.stats.leadsForFollowUp, value: '0', icon: Users },
    { title: t.dashboard.stats.newLeadsThisWeek, value: '0', icon: ClipboardList },
    { title: t.dashboard.stats.hotLeads, value: '0', icon: Flame, color: "text-red-500" },
    { title: t.dashboard.stats.conversionRate, value: '0%', icon: TrendingUp, color: "text-green-500" },
  ];

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
      { title: t.dashboard.stats.leadsForFollowUp, value: counts.all?.toString() || '0', icon: Users },
      { title: t.dashboard.stats.newLeadsThisWeek, value: counts.new_this_week?.toString() || '0', icon: ClipboardList },
      { title: t.dashboard.stats.hotLeads, value: counts.hot?.toString() || '0', icon: Flame, color: "text-red-500" },
      { title: t.dashboard.stats.conversionRate, value: `${dashboardData.conversion_rate || 0}%`, icon: TrendingUp, color: "text-green-500" },
    ]
  }, [dashboardData, initialStats, t]);
  
  return (
    <div className="p-4 pb-20">
      <section className="py-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {t.dashboard.welcomeBack.replace('{{name}}', agentName || 'Agent')}
        </h2>
      </section>

      <section className="grid grid-cols-2 gap-4 mb-6">
        {(isLoading ? initialStats : dynamicStats).map((stat) => (
          <Card key={stat.title} className="shadow-sm">
            <CardContent className="p-4">
              <stat.icon className={`h-6 w-6 mb-2 text-gray-400 ${stat.color || ''}`} />
              {isLoading ? (
                <div className="flex items-center justify-center h-10">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : (
                <p className={`text-3xl font-bold ${stat.color || ''}`}>{stat.value}</p>
              )}
              <p className="text-sm text-gray-500">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
          <Button className="w-full bg-primary" size="lg" onClick={handleAddNewLead} disabled={isCheckingSession}>
            {isCheckingSession ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
            {t.dashboard.addNewLead}
          </Button>
      </section>
    </div>
  );
}
