
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Plus, MoreVertical, X, Edit, Zap, UserCheck, UserX, Trash2, Loader2 } from 'lucide-react';
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
import { callLeadApi, callLeadStatusApi } from '@/lib/auth-api';


type LeadTemperature = 'Hot' | 'Warm' | 'Cold';
type LeadStatus = 'Active' | 'Inactive';

type Lead = {
  lead_id: string;
  name: string;
  temperature: LeadTemperature;
  status: LeadStatus;
  next_follow_up: {
    status: string;
  };
};

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All Leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState<Lead | null>(null);

  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [leadsToDelete, setLeadsToDelete] = useState<string[] | null>(null);

  const [statusChangeInfo, setStatusChangeInfo] = useState<{ leadId: string; newStatus: LeadStatus } | null>(null);


  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await callLeadApi('get_all_leads');
        if (Array.isArray(response) && response.length > 0 && response[0].leads) {
            setLeads(response[0].leads);
        } else {
            console.error("API response is not in the expected format:", response);
            setLeads([]);
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load leads.",
        });
        setLeads([]);
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];
    
    let results = leads.filter(lead => 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTab !== 'All Leads') {
      const temperature = activeTab.replace(' Leads', '') as LeadTemperature;
      results = results.filter(lead => lead.temperature === temperature);
    }

    return results;
  }, [searchTerm, activeTab, leads]);

  const handleNavigateToLead = async (leadId: string) => {
    if (isBulkEditing) {
        handleSelectLead(leadId);
        return;
    }
    setIsNavigating(leadId);
    try {
        await callLeadApi('get_lead_details', { lead_id: leadId });
        router.push(`/leads/${leadId}`);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load lead details. The lead may have been deleted.",
        });
        setIsNavigating(null);
    }
  };

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
      setSelectedLeads(filteredLeads.map(lead => lead.lead_id));
    }
  }
  
  const cancelSelection = () => {
      setSelectedLeads([]);
  }

  const confirmLeadAction = (leadId: string, action: 'setActive' | 'setInactive') => {
    const newStatus = action === 'setActive' ? 'Active' : 'Inactive';
    setStatusChangeInfo({ leadId, newStatus });
  };

  const executeLeadAction = async () => {
    if (!statusChangeInfo) return;
    const { leadId, newStatus } = statusChangeInfo;

    try {
      await callLeadStatusApi(leadId, newStatus.toLowerCase() as 'active' | 'inactive');
      setLeads(leads.map(lead => 
        lead.lead_id === leadId ? { ...lead, status: newStatus } : lead
      ));
      toast({
        title: "Success",
        description: `Lead marked as ${newStatus.toLowerCase()}.`,
      });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: "Could not update lead status." });
    } finally {
      setStatusChangeInfo(null);
    }
  };

  const confirmDeleteSingleLead = (leadId: string) => {
    setLeadToDelete(leadId);
  }

  const executeDeleteSingleLead = async () => {
    if (!leadToDelete) return;
    try {
        await callLeadApi('delete_lead', { lead_id: leadToDelete });
        setLeads(prev => prev.filter(lead => lead.lead_id !== leadToDelete));
        toast({
          title: "Success",
          description: "Lead deleted.",
        });
    } catch(error) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete lead." });
    }
    setLeadToDelete(null);
  }

  const confirmDeleteBulkLeads = () => {
    setLeadsToDelete(selectedLeads);
  }

  const executeDeleteBulkLeads = async () => {
    if (!leadsToDelete) return;
    try {
        await Promise.all(leadsToDelete.map(id => callLeadApi('delete_lead', { lead_id: id })));
        setLeads(prev => prev.filter(lead => !leadsToDelete.includes(lead.lead_id)));
        toast({
            title: "Success",
            description: `${leadsToDelete.length} lead(s) deleted.`,
        });
        setSelectedLeads([]);
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Could not delete selected leads." });
    }
    setLeadsToDelete(null);
  }

  const handleBulkAction = async (action: 'setActive' | 'setInactive') => {
    const newStatus = action === 'setActive' ? 'Active' : 'Inactive';
    try {
        await Promise.all(selectedLeads.map(id => callLeadStatusApi(id, newStatus.toLowerCase() as 'active' | 'inactive')));
        setLeads(leads.map(lead => 
          selectedLeads.includes(lead.lead_id) ? { ...lead, status: newStatus } : lead
        ));
        setSelectedLeads([]);
        toast({
          title: "Success",
          description: `${selectedLeads.length} lead(s) marked as ${newStatus.toLowerCase()}.`,
        });
    } catch (error) {
       toast({ variant: "destructive", title: "Error", description: `Could not mark leads as ${newStatus.toLowerCase()}.` });
    }
  };

  const openStatusDialog = (lead: Lead) => {
    setSelectedLeadForStatus(lead);
    setIsStatusDialogOpen(true);
  };

  const handleStatusSave = (leadId: string, newStatus: LeadTemperature, note: string) => {
    callLeadStatusApi(leadId, "change_priority", { new_priority: newStatus, note }).then(() => {
        setLeads(prevLeads =>
          prevLeads.map(lead =>
            lead.lead_id === leadId ? { ...lead, temperature: newStatus } : lead
          )
        );
        toast({
          title: 'Priority Updated',
          description: `Lead priority changed to ${newStatus} and note was added.`,
        });
        setIsStatusDialogOpen(false);
    }).catch(() => {
         toast({ variant: "destructive", title: "Error", description: "Could not update lead priority." });
    })
  };


  const getStatusBadgeClass = (status: LeadTemperature) => {
    switch (status) {
      case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'Warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const isBulkEditing = selectedLeads.length > 0;
  
  const LeadCard = ({lead}: {lead: Lead }) => (
    <Card 
      className={cn("shadow-sm cursor-pointer hover:shadow-md transition-shadow", selectedLeads.includes(lead.lead_id) && "bg-blue-50 border-primary")}
      onClick={() => handleNavigateToLead(lead.lead_id)}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Checkbox 
              id={`lead-${lead.lead_id}`} 
              checked={selectedLeads.includes(lead.lead_id)}
              onCheckedChange={() => handleSelectLead(lead.lead_id)}
              onClick={(e) => e.stopPropagation()}
          />
          <div className="grid gap-0.5">
            <div className='flex items-center gap-2'>
              <span className={cn("font-semibold", isBulkEditing && 'cursor-pointer')}>{lead.name}</span>
              {lead.status === 'Inactive' && (
                  <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-xs", getStatusBadgeClass(lead.temperature))}>{lead.temperature}</Badge>
              <p className="text-sm text-gray-500">
                Next follow-up:
                <span className={cn(lead.next_follow_up.status === 'Overdue' && "text-red-500 font-medium ml-1")}>
                  {lead.next_follow_up.status}
                </span>
              </p>
            </div>
          </div>
        </div>
        {isNavigating === lead.lead_id && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      </CardContent>
    </Card>
  )

  if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  return (
    <div className="flex h-full flex-col bg-gray-50 p-4 pb-20">
       <div className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Link href="/leads/new/step-1">
          <Button variant="default" className="bg-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add New Lead
          </Button>
        </Link>
      </div>
      <div className="flex gap-2 mb-4 items-center">
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
           <div key={lead.lead_id} className="relative group">
             <LeadCard lead={lead} />
            {!isBulkEditing && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-5 w-5 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onSelect={() => router.push(`/leads/${lead.lead_id}?edit=true`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openStatusDialog(lead)}>
                        <Zap className="mr-2 h-4 w-4" />
                        <span>Priority (hot/warm/cold)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => confirmLeadAction(lead.lead_id, lead.status === 'Active' ? 'setInactive' : 'setActive')}>
                      {lead.status === 'Active' ? (
                        <UserX className="mr-2 h-4 w-4" />
                      ) : (
                        <UserCheck className="mr-2 h-4 w-4" />
                      )}
                      <span>Mark as {lead.status === 'Active' ? 'Inactive' : 'Active'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => confirmDeleteSingleLead(lead.lead_id)} className="text-red-500">
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
          key={selectedLeadForStatus.lead_id}
          open={isStatusDialogOpen}
          onOpenChange={setIsStatusDialogOpen}
          lead={{id: selectedLeadForStatus.lead_id, name: selectedLeadForStatus.name, status: selectedLeadForStatus.temperature}}
          onSave={handleStatusSave as any}
        />
      )}

      <AlertDialog open={!!statusChangeInfo} onOpenChange={() => setStatusChangeInfo(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will mark the lead as {statusChangeInfo?.newStatus.toLowerCase()}.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setStatusChangeInfo(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={executeLeadAction}>
                    Confirm
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
