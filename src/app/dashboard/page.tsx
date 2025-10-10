
"use client";

import { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LeadFollowUpSheet } from '@/components/leads/lead-follow-up-sheet';
import { allLeadsData, type LeadData } from '@/lib/leads-data';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { callAuthApi } from '@/lib/auth-api';
import { useToast } from '@/hooks/use-toast';

const agentName = "Ethan";

const stats = [
  { title: 'Leads for Follow-up', value: '23', icon: Users },
  { title: 'New Leads This Week', value: '12', icon: ClipboardList },
  { title: 'Hot Leads', value: '5', icon: Flame, color: "text-red-500" },
  { title: 'Conversion Rate', value: '15%', icon: TrendingUp, color: "text-green-500" },
];

const tasks = [
  {
    date: 'Today - July 20, 2023',
    items: [
      {
        name: 'Olivia Rhye',
        description: 'Send follow-up email about 123 Main St.',
        icon: Mail,
        leadId: 'olivia-bennett-2',
      },
      {
        name: 'Liam Smith',
        description: 'Call to confirm viewing appointment.',
        icon: Phone,
        leadId: 'liam-harper-5',
      },
    ],
  },
  {
    date: 'Tomorrow - July 21, 2023',
    items: [
      {
        name: 'Ava Johnson',
        description: 'Schedule meeting to discuss offer.',
        icon: Calendar,
        leadId: 'ava-rodriguez-4',
      },
       {
        name: 'James Brown',
        description: 'Send WhatsApp message with new listings.',
        icon: MessageSquare,
        leadId: 'd2c5e5f3-a2f2-4f9c-9b0d-7d5b4a3a3c21',
      },
    ],
  },
  {
    date: 'Saturday - July 22, 2023',
    items: [
      {
        name: 'Noah Williams',
        description: 'Prepare for property visit at 456 Oak Ave.',
        icon: Home,
        leadId: 'noah-thompson-3',
      },
    ],
  },
  {
    date: 'Monday - July 24, 2023',
    items: [
      {
        name: 'Emma Garcia',
        description: 'Follow up on contract paperwork.',
        icon: Briefcase,
        leadId: 'isabella-hayes-6',
      },
      {
        name: 'Benjamin Martinez',
        description: 'Call to discuss feedback from showing.',
        icon: Phone,
        leadId: 'lucas-foster-7',
      },
    ],
  },
    {
    date: 'Tuesday - July 25, 2023',
    items: [
      {
        name: 'Mia Rodriguez',
        description: 'Send updated market analysis.',
        icon: Mail,
        leadId: 'mia-coleman-8',
      },
    ],
  },
];

export default function AgentDashboardPage() {
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const [isAddingLead, setIsAddingLead] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
    setIsAddingLead(true);
    try {
      const agentData = JSON.parse(localStorage.getItem('agent_data') || '{}');
      await callAuthApi('validate_session', agentData);
      router.push('/leads/new');
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
      setIsAddingLead(false);
    }
  };

  return (
    <div className="p-4 pb-20">
      <section className="py-4">
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, {agentName}!</h2>
      </section>

      <section className="grid grid-cols-2 gap-4 mb-6">
        {stats.map((stat) => (
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
          <Button className="w-full bg-primary" size="lg" onClick={handleAddNewLead} disabled={isAddingLead}>
            {isAddingLead ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Plus className="mr-2 h-5 w-5" />}
            Add New Lead
          </Button>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-4">Upcoming Follow-up Tasks</h3>
        <div className="space-y-6">
          {tasks.map((group) => (
            <div key={group.date}>
              <h4 className="font-semibold text-gray-600 mb-2">{group.date}</h4>
              <div className="space-y-3">
                {group.items.map((task) => (
                  <Card 
                    key={task.name} 
                    className={cn("shadow-sm hover:shadow-md transition-shadow cursor-pointer")}
                    onClick={() => handleTaskClick(task.leadId, task.icon)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                         <task.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{task.name}</p>
                        <p className="text-sm text-gray-500">{task.description}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
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
