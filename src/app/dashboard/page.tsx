
"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { callAuthApi } from '@/lib/auth-api';
import { useDashboard } from '@/hooks/useAppData';
import { checkForDraft, clearDraft, type DraftInfo } from '@/lib/draft-detector';
import { DraftResumeDialog } from '@/components/leads/draft-resume-dialog';
import { cn } from '@/lib/utils';

export default function AgentDashboardPage() {
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Draft detection state
  const [isDraftDialogOpen, setIsDraftDialogOpen] = useState(false);
  const [draftInfo, setDraftInfo] = useState<DraftInfo>({ exists: false });

  // Use localStorage-based dashboard data
  const dashboardData = useDashboard();

  const initialStats = [
    { title: t.dashboard.stats.leadsForFollowUp, value: '0', icon: Users },
    { title: t.dashboard.stats.newLeadsThisWeek, value: '0', icon: ClipboardList },
    { title: t.dashboard.stats.hotLeads, value: '0', icon: Flame, color: "text-red-500" },
    { title: t.dashboard.stats.conversionRate, value: '0%', icon: TrendingUp, color: "text-green-500" },
  ];

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

    // Data is loaded from localStorage via useDashboard hook
    setIsLoading(false);
  }, []);


  const handleAddNewLead = () => {
    // Check for existing draft
    const draft = checkForDraft();

    if (draft.exists) {
      // Show draft resume dialog
      setDraftInfo(draft);
      setIsDraftDialogOpen(true);
    } else {
      // No draft found, proceed with new lead creation
      startNewLead();
    }
  };

  const startNewLead = () => {
    // Generate lead_id immediately using crypto.randomUUID()
    const leadId = crypto.randomUUID();

    // Initialize sessionStorage with empty form data and lead_id
    sessionStorage.setItem('lead_id', leadId);
    sessionStorage.setItem('leadFormData', JSON.stringify({ _lastModified: Date.now() }));

    // Navigate instantly to the new lead form
    router.push('/leads/new');

    // Optionally validate session in background (non-blocking)
    validateSessionInBackground();
  };

  const handleContinueDraft = () => {
    // Close dialog and navigate to form (will auto-load from sessionStorage)
    setIsDraftDialogOpen(false);
    router.push('/leads/new');
  };

  const handleStartFresh = () => {
    // Clear existing draft and start new
    clearDraft();
    setIsDraftDialogOpen(false);
    startNewLead();
  };

  const validateSessionInBackground = async () => {
    try {
      const agentDataString = localStorage.getItem('agent_data');
      if (!agentDataString) return;

      const agentData = JSON.parse(agentDataString);

      await callAuthApi('validate_session', {
        agent: agentData,
        agent_id: agentData.agent_id,
      });
    } catch (error) {
      // Silent fail - session validation is not critical for form opening
      console.error('Background session validation failed:', error);
    }
  };

  const handleCardClick = (cardTitle: string) => {
    // Navigate to leads page with appropriate filter
    switch (cardTitle) {
      case t.dashboard.stats.leadsForFollowUp:
        router.push('/leads?filter=upcoming');
        break;
      case t.dashboard.stats.newLeadsThisWeek:
        router.push('/leads?filter=new_this_week');
        break;
      case t.dashboard.stats.hotLeads:
        router.push('/leads?filter=hot');
        break;
      // Conversion Rate: no action (non-clickable)
      default:
        break;
    }
  };

  const dynamicStats = useMemo(() => {
    if (!dashboardData) return initialStats;
    const counts = dashboardData.counts || {};
    return [
      { title: t.dashboard.stats.leadsForFollowUp, value: counts.leads_for_followup?.toString() || '0', icon: Users },
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
        {(isLoading ? initialStats : dynamicStats).map((stat, index) => {
          const isClickable = index < 3; // First 3 cards are clickable (not Conversion Rate)

          return (
            <Card
              key={stat.title}
              className={cn(
                "shadow-sm",
                isClickable && "cursor-pointer hover:shadow-lg transition-shadow"
              )}
              onClick={() => isClickable && !isLoading && handleCardClick(stat.title)}
            >
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
          );
        })}
      </section>

      <section>
          <Button className="w-full bg-primary" size="lg" onClick={handleAddNewLead} disabled={isCheckingSession}>
            {isCheckingSession ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
            {t.dashboard.addNewLead}
          </Button>
      </section>

      {/* Draft Resume Dialog */}
      <DraftResumeDialog
        open={isDraftDialogOpen}
        onOpenChange={setIsDraftDialogOpen}
        draftInfo={draftInfo}
        onContinue={handleContinueDraft}
        onStartFresh={handleStartFresh}
      />
    </div>
  );
}
