
"use client";

import React, { useState, useMemo } from 'react';
import { Search, Plus, MoreVertical, X, Edit, Zap, UserCheck, UserX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { LeadStatusDialog } from '@/components/leads/lead-status-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"


type LeadStatus = 'Hot' | 'Warm' | 'Cold';
type LeadActiveStatus = 'Active' | 'Inactive';

type Lead = {
  id: string;
  name: string;
  status: LeadStatus;
  nextFollowUp: string;
  activeStatus: LeadActiveStatus;
};

const allLeads: Lead[] = [
  { id: 'd2c5e5f3-a2f2-4f9c-9b0d-7d5b4a3a3c21', name: 'Sophia Carter', status: 'Hot' as LeadStatus, nextFollowUp: 'Overdue', activeStatus: 'Active' as LeadActiveStatus },
  { id: 'olivia-bennett-2', name: 'Olivia Bennett', status: 'Warm' as LeadStatus, nextFollowUp: 'Today', activeStatus: 'Active' as LeadActiveStatus },
  { id: 'noah-thompson-3', name: 'Noah Thompson', status: 'Cold' as LeadStatus, nextFollowUp: 'This week', activeStatus: 'Active' as LeadActiveStatus },
  { id: 'ava-rodriguez-4', name: 'Ava Rodriguez', status: 'Hot' as LeadStatus, nextFollowUp: 'Overdue', activeStatus: 'Inactive' as LeadActiveStatus },
  { id: 'liam-harper-5', name: 'Liam Harper', status: 'Warm' as LeadStatus, nextFollowUp: 'Next week', activeStatus: 'Active' as LeadActiveStatus },
  { id: 'isabella-hayes-6', name: 'Isabella Hayes', status: 'Cold' as LeadStatus, nextFollowUp: '15 Jul 2024', activeStatus: 'Active' as LeadActiveStatus },
  { id: 'lucas-foster-7', name: 'Lucas Foster', status: 'Hot' as LeadStatus, nextFollowUp: 'Overdue', activeStatus: 'Active' as LeadActiveStatus },
  { id: 'mia-coleman-8', name: 'Mia Coleman', status: 'Warm' as LeadStatus, nextFollowUp: '20 Jul 2024', activeStatus: 'Inactive' as LeadActiveStatus },
];

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All Leads');
  const [leads, setLeads] = useState(allLeads);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState<Lead | null>(null);

  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [leadsToDelete, setLeadsToDelete] = useState<string[] | null>(null);


  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeTab === 'All Leads') {
        return matchesSearch;
      }
      const matchesTab = lead.status === activeTab.replace(' Leads', '');
      return matchesSearch && matchesTab;
    });
  }, [searchTerm, activeTab, leads]);

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prevSelected =>
      prevSelected.includes(leadId)
        ? prevSelected.filter(id => id !== leadId)
        : [...prevSelected, leadId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  }
  
  const cancelSelection = () => {
      setSelectedLeads([]);
  }

  const handleLeadAction = (leadId: string, action: 'setActive' | 'setInactive') => {
    let newLeads = [...leads];
    let message = '';
    
    const newStatus = action === 'setActive' ? 'Active' : 'Inactive';
    newLeads = leads.map(lead => 
      lead.id === leadId ? { ...lead, activeStatus: newStatus } : lead
    );
    message = `Lead marked as ${newStatus.toLowerCase()}.`;
    
    setLeads(newLeads);
    toast({
      title: "Success",
      description: message,
    });
  };

  const confirmDeleteSingleLead = (leadId: string) => {
    setLeadToDelete(leadId);
  }

  const executeDeleteSingleLead = () => {
    if (!leadToDelete) return;
    setLeads(prev => prev.filter(lead => lead.id !== leadToDelete));
    toast({
      title: "Success",
      description: "Lead deleted.",
    });
    setLeadToDelete(null);
  }

  const confirmDeleteBulkLeads = () => {
    setLeadsToDelete(selectedLeads);
  }

  const executeDeleteBulkLeads = () => {
    if (!leadsToDelete) return;
    setLeads(prev => prev.filter(lead => !leadsToDelete.includes(lead.id)));
     toast({
      title: "Success",
      description: `${leadsToDelete.length} lead(s) deleted.`,
    });
    setLeadsToDelete(null);
    setSelectedLeads([]);
  }

  const handleBulkAction = (action: 'setActive' | 'setInactive') => {
    let newLeads = [...leads];
    let message = '';
    
    const newStatus = action === 'setActive' ? 'Active' : 'Inactive';
    newLeads = leads.map(lead => 
      selectedLeads.includes(lead.id) ? { ...lead, activeStatus: newStatus } : lead
    );
    message = `${selectedLeads.length} lead(s) marked as ${newStatus.toLowerCase()}.`;
    
    setLeads(newLeads);
    setSelectedLeads([]);
    toast({
      title: "Success",
      description: message,
    });
  };

  const openStatusDialog = (lead: Lead) => {
    setSelectedLeadForStatus(lead);
    setIsStatusDialogOpen(true);
  };

  const handleStatusSave = (leadId: string, newStatus: LeadStatus, note: string) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );
    // In a real app, you would also save the note.
    toast({
      title: 'Status Updated',
      description: `Lead status changed to ${newStatus} and note was added.`,
    });
    setIsStatusDialogOpen(false);
  };


  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'Warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isBulkEditing = selectedLeads.length > 0;
  
  const LeadCard = ({lead}: {lead: Lead }) => (
    <Card className={cn("shadow-sm", selectedLeads.includes(lead.id) && "bg-blue-50 border-primary")}>
      <CardContent className="flex items-center justify-between p-4" >
        <div className="flex items-center gap-4" onClick={(e) => {
            if (isBulkEditing) {
                e.preventDefault();
                handleSelectLead(lead.id)
            }
        }}>
          <Checkbox 
              id={`lead-${lead.id}`} 
              checked={selectedLeads.includes(lead.id)}
              onCheckedChange={() => handleSelectLead(lead.id)}
              onClick={(e) => e.stopPropagation()}
          />
          <Link href={`/leads/${lead.id}`} className="grid gap-0.5">
            <span className={cn("font-semibold", isBulkEditing && 'cursor-pointer')}>{lead.name}</span>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", getStatusBadgeClass(lead.status))}>{lead.status}</Badge>
              {lead.activeStatus === 'Inactive' && (
                  <Badge variant="secondary">Inactive</Badge>
              )}
              <p className="text-sm text-gray-500">
                Next follow-up:
                <span className={cn(lead.nextFollowUp === 'Overdue' && "text-red-500 font-medium ml-1")}>
                  {lead.nextFollowUp}
                </span>
              </p>
            </div>
          </Link>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex h-full flex-col bg-gray-50 p-4 pb-20">
      <div className="flex gap-2 mb-4 pt-4 items-center">
        {isBulkEditing ? (
          <>
            <Button variant="ghost" size="icon" onClick={cancelSelection}>
              <X className="h-5 w-5" />
            </Button>
            <h3 className="font-semibold text-lg">{selectedLeads.length} selected</h3>
            <div className="flex-grow" />
            <Checkbox
              checked={selectedLeads.length > 0 && selectedLeads.length === filteredLeads.length}
              onCheckedChange={handleSelectAll}
              className="mr-2"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={confirmDeleteBulkLeads} className="text-red-500">
                  Delete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('setActive')}>Mark as Active</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('setInactive')}>Mark as Inactive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {!isBulkEditing && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-4 bg-gray-200">
            <TabsTrigger value="All Leads">All</TabsTrigger>
            <TabsTrigger value="Hot Leads">Hot</TabsTrigger>
            <TabsTrigger value="Warm Leads">Warm</TabsTrigger>
            <TabsTrigger value="Cold Leads">Cold</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pb-16">
        {filteredLeads.map((lead) => (
           <div key={lead.id} className="relative group">
             <LeadCard lead={lead} />
            {!isBulkEditing && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.preventDefault()}>
                      <MoreVertical className="h-5 w-5 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onSelect={() => router.push(`/leads/${lead.id}?edit=true`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openStatusDialog(lead)}>
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Change Status</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleLeadAction(lead.id, lead.activeStatus === 'Active' ? 'setInactive' : 'setActive')}>
                      {lead.activeStatus === 'Active' ? (
                        <UserX className="mr-2 h-4 w-4" />
                      ) : (
                        <UserCheck className="mr-2 h-4 w-4" />
                      )}
                      <span>Mark as {lead.activeStatus === 'Active' ? 'Inactive' : 'Active'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => confirmDeleteSingleLead(lead.id)} className="text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete Lead</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
           </div>
        ))}
      </div>
      {selectedLeadForStatus && (
        <LeadStatusDialog
          key={selectedLeadForStatus.id}
          open={isStatusDialogOpen}
          onOpenChange={setIsStatusDialogOpen}
          lead={selectedLeadForStatus}
          onSave={handleStatusSave}
        />
      )}

      <AlertDialog open={!!leadToDelete} onOpenChange={() => setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLeadToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteSingleLead} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!leadsToDelete} onOpenChange={() => setLeadsToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {leadsToDelete?.length} lead(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLeadsToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteBulkLeads} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

    