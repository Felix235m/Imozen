"use client";

import {
  Plus,
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
  Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

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
      },
      {
        name: 'Liam Smith',
        description: 'Call to confirm viewing appointment.',
        icon: Phone,
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
      },
       {
        name: 'James Brown',
        description: 'Send WhatsApp message with new listings.',
        icon: MessageSquare,
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
      },
      {
        name: 'Benjamin Martinez',
        description: 'Call to discuss feedback from showing.',
        icon: Phone,
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
      },
    ],
  },
];


export default function AgentDashboardPage() {
  return (
    <div className="p-4 pb-20">
      <section className="py-4">
        <h1 className="text-2xl font-bold text-gray-800">Welcome back, {agentName}!</h1>
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
         <Link href="/leads/new" className='w-full'>
            <Button className="w-full bg-primary" size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Add New Lead
            </Button>
         </Link>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Upcoming Follow-up Tasks</h2>
        <div className="space-y-6">
          {tasks.map((group) => (
            <div key={group.date}>
              <h3 className="font-semibold text-gray-600 mb-2">{group.date}</h3>
              <div className="space-y-3">
                {group.items.map((task) => (
                  <Card key={task.name} className="shadow-sm hover:shadow-md transition-shadow">
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
    </div>
  );
}
