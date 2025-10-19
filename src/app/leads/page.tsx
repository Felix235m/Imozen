
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, Plus, MoreVertical, X, Edit, Zap, Trash2, Loader2, Users, UserPlus, PhoneCall, UserCheck, Calendar, Home, Tag, MessageCircle, FileSignature, PartyPopper, ThumbsDown, UserX, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { callLeadApi, callLeadStatusApi, callAuthApi } from '@/lib/auth-api';
import { transformWebhookResponseToLeadListItem } from '@/lib/lead-transformer';
import { format, isValid } from 'date-fns';

// Helper function to safely format follow-up dates
function formatFollowUpDate(dateValue: string | null | undefined): string {
  // Handle null, undefined, empty string, or "-"
  if (!dateValue || dateValue === '-' || dateValue.trim() === '') {
    return 'Not set';
  }

  try {
    const parsedDate = new Date(dateValue);

    // Check if the date is valid
    if (isValid(parsedDate)) {
      return format(parsedDate, 'MMM d, yyyy');
    } else {
      return 'Not set';
    }
  } catch (error) {
    // If any error occurs during parsing/formatting, return "Not set"
    return 'Not set';
  }
}

type LeadTemperature = 'Hot' | 'Warm' | 'Cold';
type LeadStatus = 'Active' | 'Inactive';

type LeadStage =
  | 'New Lead'
  | 'Contacted'
  | 'Qualified'
  | 'Property Viewing Scheduled'
  | 'Property Viewed'
  | 'Offer Made'
  | 'Negotiation'
  | 'Under Contract'
  | 'Converted'
  | 'Lost'
  | 'Not Interested';

type Lead = {
  lead_id: string;
  name: string;
  temperature: LeadTemperature;
  status: LeadStatus;
  lead_stage?: LeadStage;
  next_follow_up: {
    status: string;
    date: string | null;
  };
};

const LEAD_STAGES: { value: LeadStage; label: string; color: string; description: string, icon: React.ElementType }[] = [
  { value: 'New Lead', label: 'New Lead', color: 'bg-blue-100 text-blue-700', description: 'Just received, not yet contacted', icon: UserPlus },
  { value: 'Contacted', label: 'Contacted', color: 'bg-purple-100 text-purple-700', description: 'Initial contact made', icon: PhoneCall },
  { value: 'Qualified', label: 'Qualified', color: 'bg-indigo-100 text-indigo-700', description: 'Lead is qualified and interested', icon: UserCheck },
  { value: 'Property Viewing Scheduled', label: 'Viewing Scheduled', color: 'bg-cyan-100 text-cyan-700', description: 'Property viewing appointment set', icon: Calendar },
  { value: 'Property Viewed', label: 'Property Viewed', color: 'bg-teal-100 text-teal-700', description: 'Lead has viewed property', icon: Home },
  { value: 'Offer Made', label: 'Offer Made', color: 'bg-orange-100 text-orange-700', description: 'Lead made an offer', icon: Tag },
  { value: 'Negotiation', label: 'Negotiation', color: 'bg-yellow-100 text-yellow-700', description: 'In negotiation phase', icon: MessageCircle },
  { value: 'Under Contract', label: 'Under Contract', color: 'bg-lime-100 text-lime-700', description: 'Contract signed, pending closing', icon: FileSignature },
  { value: 'Converted', label: 'Converted', color: 'bg-green-100 text-green-700', description: 'Deal successfully closed', icon: PartyPopper },
  { value: 'Lost', label: 'Lost', color: 'bg-red-100 text-red-700', description: 'Deal lost', icon: ThumbsDown },
  { value: 'Not Interested', label: 'Not Interested', color: 'bg-gray-100 text-gray-700', description: 'Lead no longer interested', icon: UserX },
];

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

  const [isCheckingSession, setIsCheckingSession] = useState(false);
  
  const [isLeadStageDialogOpen, setIsLeadStageDialogOpen] = useState(false);
  const [isStageConfirmDialogOpen, setIsStageConfirmDialogOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<LeadStage | null>(null);
  const [selectedLeadForStageChange, setSelectedLeadForStageChange] = useState<Lead | null>(null);


  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await callLeadApi('get_all_leads');
        
        let data;
        if (Array.isArray(response) && response.length > 0) {
            data = response[0];
        } else if (typeof response === 'object' && response !== null && !Array.isArray(response)) {
            data = response;
        }

        if (data && Array.isArray(data.leads)) {
            setLeads(data.leads);
        } else {
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

  const leadToDeleteName = useMemo(() => {
    if (!leadToDelete) return '';
    return leads.find(lead => lead.lead_id === leadToDelete)?.name || '';
  }, [leadToDelete, leads]);


  if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }
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

  const openStatusDialog = (lead: Lead) => {
    setSelectedLeadForStatus(lead);
    setIsStatusDialogOpen(true);
  };

  const handleStatusSave = async (leadId: string, newStatus: LeadTemperature, note: string) => {
    try {
        // Construct payload for the status change API
        const payload = {
            lead_id: leadId,
            operation: 'change_priority',
            new_priority: newStatus,
            note: note,
        };

        // Call the status change API
        const response = await callApi(LEAD_STATUS_URL, payload);

        // Transform the webhook response to match the frontend lead list item format
        const transformedLead = transformWebhookResponseToLeadListItem(response);

        if (transformedLead) {
            // Update the leads list with the fresh data from the server
            setLeads(prevLeads =>
              prevLeads.map(lead =>
                lead.lead_id === leadId ? { ...lead, ...transformedLead } : lead
              )
            );
        } else {
            // Fallback: If transformation fails, just update the temperature locally
            setLeads(prevLeads =>
              prevLeads.map(lead =>
                lead.lead_id === leadId ? { ...lead, temperature: newStatus } : lead
              )
            );
        }

        toast({
          title: 'Priority Updated',
          description: `Lead priority changed to ${newStatus} and note was added.`,
        });
        
    } catch (error: any) {
         console.error('Priority update error:', error);
         toast({ variant: "destructive", title: "Error", description: error.message || "Could not update lead priority." });
    } finally {
        setIsStatusDialogOpen(false);
    }
  };
  
  const handleStageSelect = (newStage: LeadStage) => {
    if (selectedLeadForStageChange && newStage !== selectedLeadForStageChange.lead_stage) {
      setSelectedStage(newStage);
      setIsStageConfirmDialogOpen(true);
      setIsLeadStageDialogOpen(false);
    }
  };

  const openLeadStageDialog = (lead: Lead) => {
    setSelectedLeadForStageChange(lead);
    setIsLeadStageDialogOpen(true);
  };

  const confirmLeadStageChange = async () => {
    if (!selectedLeadForStageChange || !selectedStage) return;

    try {
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('sessionToken');
        if (!token) throw new Error('No authentication token found');

        const webhookUrl = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-status';
        const webhookPayload = {
            lead_id: selectedLeadForStageChange.lead_id,
            operation: 'status_change',
            status: selectedStage
        };

        let response;
        try {
            response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(webhookPayload)
            });
        } catch (fetchError: any) {
            // Network errors: connection refused, DNS failure, timeout, etc.
            if (fetchError.name === 'TypeError' || fetchError.message.includes('fetch')) {
                throw new Error('Server is busy or could not be reached. Please check your connection and try again.');
            }
            if (fetchError.name === 'AbortError') {
                throw new Error('Request timed out. The server is taking too long to respond.');
            }
            throw new Error('Network error occurred. Please check your connection and try again.');
        }

        if (!response.ok) {
            // Handle server errors (5xx)
            if (response.status >= 500) {
                throw new Error('Server error occurred. Please try again later.');
            }
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update lead status');
        }

        setLeads(prevLeads => prevLeads.map(l =>
            l.lead_id === selectedLeadForStageChange.lead_id
            ? { ...l, lead_stage: selectedStage, status: selectedStage as any }
            : l
        ));

        toast({
            title: "Status Updated",
            description: `Lead status changed to "${selectedStage}".`,
        });
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error.message || 'Could not update lead status.'
        });
    } finally {
        setIsStageConfirmDialogOpen(false);
        setSelectedStage(null);
        setSelectedLeadForStageChange(null);
    }
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
  const currentStageInfo = LEAD_STAGES.find(s => s.value === selectedLeadForStageChange?.lead_stage);
  const selectedStageInfo = LEAD_STAGES.find(s => s.value === selectedStage);
  
  const LeadCard = ({lead}: {lead: Lead }) => {
    // Map the 'status' field from API to lead_stage for display
    const leadStage = (lead as any).status || lead.lead_stage;
    const stageInfo = leadStage ? LEAD_STAGES.find(s => s.value === leadStage) : null;
    const StageIcon = stageInfo?.icon;

    return (
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
            {stageInfo && StageIcon && (
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-full shrink-0", stageInfo.color)}>
                <StageIcon className="h-5 w-5" />
              </div>
            )}
            <div className="grid gap-0.5">
              <div className='flex items-center gap-2'>
                <span className={cn("font-semibold", isBulkEditing && 'cursor-pointer')}>{lead.name}</span>
                {lead.status === 'Inactive' && (
                    <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-xs", getStatusBadgeClass(lead.temperature))}>{lead.temperature}</Badge>
                {stageInfo && (
                  <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300">{stageInfo.label}</Badge>
                )}
                <p className="text-sm text-gray-500">
                  Next follow-up:
                  <span className="ml-1">
                    {formatFollowUpDate(lead.next_follow_up.date)}
                  </span>
                </p>
              </div>
            </div>
          </div>
          {isNavigating === lead.lead_id && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50 p-4 pb-20">
       <div className="flex items-center justify-between py-4">
        <h1 className="text-2xl font-bold">Leads</h1>
        <Button variant="default" className="bg-primary" onClick={handleAddNewLead} disabled={isCheckingSession}>
          {isCheckingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Add New Lead
        </Button>
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
        {filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
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
                      <DropdownMenuItem onSelect={() => openLeadStageDialog(lead)}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        <span>Change Status</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={() => confirmDeleteSingleLead(lead.lead_id)} className="text-red-500">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete Lead</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <Users className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold text-gray-500">No leads available</h2>
          </div>
        )}
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

      <AlertDialog open={!!leadToDelete} onOpenChange={() => setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead
              for {leadToDeleteName}.
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

       <Dialog open={isLeadStageDialogOpen} onOpenChange={setIsLeadStageDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>Change Lead Status</DialogTitle>
                <DialogDescription>
                    Select the new status for this lead in the sales pipeline.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto p-1">
                {LEAD_STAGES.map((stage) => {
                    const isCurrent = selectedLeadForStageChange?.lead_stage === stage.value;
                    return (
                        <button
                            key={stage.value}
                            onClick={() => handleStageSelect(stage.value)}
                            disabled={isCurrent}
                            className={cn(
                                "w-full text-left p-4 rounded-lg border-2 hover:border-primary transition-all focus:outline-none focus:ring-2 focus:ring-primary relative",
                                isCurrent ? "border-primary bg-primary/5" : "border-gray-200 hover:bg-gray-50/50",
                                isCurrent && "cursor-default"
                            )}
                        >
                            {isCurrent && <Badge className="absolute -top-2 -right-2">Current</Badge>}
                            <div className="flex items-start gap-4">
                                <div className={cn("mt-1 flex h-8 w-8 items-center justify-center rounded-full shrink-0", stage.color)}>
                                    <stage.icon className="h-5 w-5" />
                                </div>
                                <div className='flex-1'>
                                    <p className="font-semibold">{stage.label}</p>
                                    <p className="text-sm text-gray-500">{stage.description}</p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>
            <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsLeadStageDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
        </DialogContent>
       </Dialog>

       <AlertDialog open={isStageConfirmDialogOpen} onOpenChange={setIsStageConfirmDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
                <AlertDialogDescription>
                    {currentStageInfo && selectedStageInfo
                        ? `Change status from "${currentStageInfo.label}" to "${selectedStageInfo.label}"`
                        : 'Are you sure you want to change the lead status?'}
                </AlertDialogDescription>
            </AlertDialogHeader>
            {currentStageInfo && selectedStageInfo && (
                <div className="flex items-center justify-center gap-4 my-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full shrink-0", currentStageInfo.color)}>
                            <currentStageInfo.icon className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">{currentStageInfo.label}</span>
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-400 shrink-0" />
                    <div className="flex flex-col items-center gap-2">
                        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full shrink-0", selectedStageInfo.color)}>
                            <selectedStageInfo.icon className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">{selectedStageInfo.label}</span>
                    </div>
                </div>
            )}
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                    setIsStageConfirmDialogOpen(false);
                    setIsLeadStageDialogOpen(true);
                }}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmLeadStageChange}>
                  Confirm
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
