"use client";

import React, { useState, useMemo } from 'react';
import { Search, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


type LeadStatus = 'Hot' | 'Warm' | 'Cold';

const allLeads = [
  { id: 1, name: 'Ethan Carter', status: 'Hot' as LeadStatus, nextFollowUp: 'Overdue' },
  { id: 2, name: 'Olivia Bennett', status: 'Warm' as LeadStatus, nextFollowUp: 'Today' },
  { id: 3, name: 'Noah Thompson', status: 'Cold' as LeadStatus, nextFollowUp: 'This week' },
  { id: 4, name: 'Ava Rodriguez', status: 'Hot' as LeadStatus, nextFollowUp: 'Overdue' },
  { id: 5, name: 'Liam Harper', status: 'Warm' as LeadStatus, nextFollowUp: 'Next week' },
  { id: 6, name: 'Isabella Hayes', status: 'Cold' as LeadStatus, nextFollowUp: '15 Jul 2024' },
  { id: 7, name: 'Lucas Foster', status: 'Hot' as LeadStatus, nextFollowUp: 'Overdue' },
  { id: 8, name: 'Mia Coleman', status: 'Warm' as LeadStatus, nextFollowUp: '20 Jul 2024' },
];

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All Leads');

  const filteredLeads = useMemo(() => {
    return allLeads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === 'All Leads') {
        return matchesSearch;
      }
      const matchesTab = lead.status === activeTab.replace(' Leads', '');
      return matchesSearch && matchesTab;
    });
  }, [searchTerm, activeTab]);

  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'Warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 pb-16 p-4">
      <div className="flex gap-2 mb-4 pt-4">
        <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input 
            placeholder="Search leads" 
            className="pl-10 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <Link href="/leads/new">
          <Button size="icon" className="rounded-full bg-primary h-10 w-10 shrink-0">
            <Plus className="h-6 w-6" />
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-200">
          <TabsTrigger value="All Leads">All</TabsTrigger>
          <TabsTrigger value="Hot Leads">Hot</TabsTrigger>
          <TabsTrigger value="Warm Leads">Warm</TabsTrigger>
          <TabsTrigger value="Cold Leads">Cold</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <Checkbox id={`lead-${lead.id}`} />
                <div className="grid gap-0.5">
                  <label htmlFor={`lead-${lead.id}`} className="font-semibold cursor-pointer">{lead.name}</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-xs", getStatusBadgeClass(lead.status))}>{lead.status}</Badge>
                    <p className="text-sm text-gray-500">
                      Next follow-up:
                      <span className={cn(lead.nextFollowUp === 'Overdue' && "text-red-500 font-medium ml-1")}>
                        {lead.nextFollowUp}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5 text-gray-500" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
