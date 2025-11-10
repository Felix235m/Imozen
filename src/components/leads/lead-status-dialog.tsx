
"use client"

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

type LeadTemperature = 'Hot' | 'Warm' | 'Cold';
type Lead = {
  id: string;
  name: string;
  status: LeadTemperature;
};

type LeadStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead;
  onSave: (leadId: string, newStatus: LeadTemperature, note: string) => void;
};

export function LeadStatusDialog({ open, onOpenChange, lead, onSave }: LeadStatusDialogProps) {
  const { t } = useLanguage();
  const [newStatus, setNewStatus] = useState<LeadTemperature>(lead.status);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const statusOptions: LeadTemperature[] = ['Hot', 'Warm', 'Cold'];
  const availableStatuses = statusOptions.filter(s => s !== lead.status);

  const getPriorityLabel = (temperature: LeadTemperature) => {
    switch (temperature) {
      case 'Hot': return t.leads.priorityHot;
      case 'Warm': return t.leads.priorityWarm;
      case 'Cold': return t.leads.priorityCold;
      default: return temperature;
    }
  };

  const handleSaveClick = () => {
    if (note.trim() === '') {
      alert('Note is required to change priority.');
      return;
    }
    setIsSaving(true);
    // Call onSave immediately without timeout
    onSave(lead.id, newStatus, note);
    // Close dialog immediately after calling onSave
    onOpenChange(false);
    setIsSaving(false);
    setNote('');
  };
  
  useEffect(() => {
    if (open) {
        setNewStatus(availableStatuses[0]); // Default to the first available option
        setNote('');
    }
  }, [open, lead.status]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.leads.priorityDialog.title.replace('{{name}}', lead.name)}</DialogTitle>
          <DialogDescription>
            {t.leads.priorityDialog.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>{t.leads.priorityDialog.newPriorityLabel}</Label>
            <RadioGroup
              value={newStatus}
              onValueChange={(value: LeadTemperature) => setNewStatus(value)}
              className="flex gap-4"
            >
              {availableStatuses.map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <RadioGroupItem value={status} id={`s-${status.toLowerCase()}`} />
                  <Label htmlFor={`s-${status.toLowerCase()}`}>{getPriorityLabel(status)}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status-note">{t.leads.priorityDialog.noteRequired}</Label>
            <Textarea
              id="status-note"
              placeholder={t.leads.priorityDialog.notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t.common.cancel}</Button>
          <Button onClick={handleSaveClick} disabled={isSaving || !note.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.leads.priorityDialog.saveChanges}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

    
