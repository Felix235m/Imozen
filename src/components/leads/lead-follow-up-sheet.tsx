
"use client"

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LeadData } from '@/lib/leads-data';
import { callFollowUpApi } from '@/lib/auth-api';
import { useToast } from '@/hooks/use-toast';

type LeadFollowUpSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: LeadData | null;
};

export function LeadFollowUpSheet({ open, onOpenChange, lead }: LeadFollowUpSheetProps) {
    const [language, setLanguage] = useState('English');
    const [isRegenerating, setIsRegenerating] = useState(false);
    const { toast } = useToast();
    const [aiMessage, setAiMessage] = useState('');

    useEffect(() => {
        if (lead?.management.ai_message) {
            setAiMessage(lead.management.ai_message);
        } else if (lead) {
            setAiMessage(`Hi ${lead.name.split(' ')[0]}, thanks for your interest. I'd love to schedule a quick call to discuss your requirements and see how I can help you find your perfect home. Are you available for a brief chat sometime this week?`);
        }
    }, [lead]);
    
    const getStatusBadgeClass = (status: 'Hot' | 'Warm' | 'Cold' | null | undefined) => {
        if (!status) return 'bg-gray-100 text-gray-700';
        switch (status) {
            case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
            case 'Warm': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };
    
    if (!lead) return null;

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const response = await callFollowUpApi('regenerate_follow-up_message', { lead_id: lead.lead_id });
            if (response.ai_message && response.lead_id === lead.lead_id) {
                setAiMessage(response.ai_message);
                toast({ title: 'Message regenerated successfully!' });
            } else {
                throw new Error('Invalid response from server.');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Could not regenerate message.',
            });
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleSendToWhatsApp = () => {
        if (!lead.contact.phone) return;
        const phoneNumber = String(lead.contact.phone).replace(/\D/g, ''); // Remove non-digit characters
        const message = encodeURIComponent(aiMessage);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
                <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3 shrink-0">
                     <div className='flex items-center'>
                         <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="mr-2">
                           <ArrowLeft className="h-6 w-6" />
                         </Button>
                        <SheetTitle>Send to WhatsApp</SheetTitle>
                     </div>
                     <SheetDescription className="sr-only">
                       Send an AI-generated follow-up message to {lead.name}.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={lead.image_url} />
                            <AvatarFallback>{lead.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold">{lead.name}</h3>
                                <Badge variant="outline" className={cn("text-sm", getStatusBadgeClass(lead.temperature))}>{lead.temperature}</Badge>
                            </div>
                            <p className="text-sm text-gray-500">{String(lead.contact.phone || '')}</p>
                            <p className="text-sm text-gray-500">{lead.contact.email}</p>
                            <p className="text-xs text-gray-400 mt-1">Source: {lead.management.source} | Created: {lead.created_at_formatted}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="language">Message Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger id="language">
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Portuguese">Portuguese</SelectItem>
                                <SelectItem value="French">French</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold mb-2">AI-Generated Follow-up Message</h4>
                         <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                                <p className="text-blue-900 whitespace-pre-wrap">{aiMessage}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-3">
                         <Button variant="outline" className="w-full h-12" onClick={handleRegenerate} disabled={isRegenerating}>
                            {isRegenerating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <RefreshCw className="mr-2 h-5 w-5" />}
                            Regenerate Message
                        </Button>
                         <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white" onClick={handleSendToWhatsApp}>
                            <MessageSquare className="mr-2 h-5 w-5" />
                            Send to WhatsApp
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
