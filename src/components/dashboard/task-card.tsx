
"use client";

import * as React from "react";
import { useState } from "react";
import {
  Mail,
  Phone,
  Calendar,
  Home,
  MessageSquare,
  Briefcase,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Edit,
  Copy,
  Save,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { cachedCallFollowUpApi, cachedCallTaskApi } from "@/lib/cached-api";
import { openWhatsApp, storeWhatsAppNotification, getWhatsAppNotifications, removeWhatsAppNotification } from "@/lib/whatsapp-utils";
import { openEmail, generateEmailSubject } from "@/lib/email-utils";
import { copyToClipboard } from "@/lib/task-utils";
import { RescheduleModal } from "./reschedule-modal";
import { CancelTaskDialog } from "./cancel-task-dialog";
import { CompleteTaskDialog } from "./complete-task-dialog";
import { useLanguage } from "@/hooks/useLanguage";

const iconMap: { [key: string]: React.ElementType } = {
  email: Mail,
  phone: Phone,
  calendar: Calendar,
  home: Home,
  whatsapp: MessageSquare,
  briefcase: Briefcase,
  default: ClipboardList,
};

interface TaskItem {
  id: string;
  name: string;
  description: string;
  type: "email" | "phone" | "whatsapp" | "calendar" | "home" | "briefcase";
  leadId: string;
  followUpMessage: string;
  time: string;
  leadContact?: {
    email: string;
    phone: string;
  };
  leadStatus: string;
  leadPriority: "Hot" | "Warm" | "Cold";
  propertyRequirements?: {
    locations?: string[];
    types?: string[];
    budget?: string;
  } | string;
}

interface TaskCardProps {
  task: TaskItem;
  date: string;
  isExpanded: boolean;
  onExpand: () => void;
  onTaskComplete: () => void;
}

export function TaskCard({ task, date, isExpanded, onExpand, onTaskComplete }: TaskCardProps) {
  const { t } = useLanguage();
  const [currentMessage, setCurrentMessage] = useState(task.followUpMessage);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMarkingDone, setIsMarkingDone] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { toast } = useToast();
  const Icon = iconMap[task.type] || iconMap.default;

  const showsAIMessage = task.type === "whatsapp" || task.type === "email";

  // Check for WhatsApp return notification when component mounts and when visibility changes
  React.useEffect(() => {
    const checkWhatsAppNotification = () => {
      const notifications = getWhatsAppNotifications();
      const matchingNotification = notifications.find((n) => n.taskId === task.id);

      if (matchingNotification && !document.hidden) {
        // Show the mark done dialog automatically
        setShowComplete(true);
        // Remove the notification after showing dialog
        removeWhatsAppNotification(task.id);
      }
    };

    // Check on mount
    checkWhatsAppNotification();

    // Listen for visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkWhatsAppNotification();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [task.id]);

  const getPriorityTranslation = (priority: string) => {
    switch (priority) {
      case "Hot": return t.leads.priorityHot;
      case "Warm": return t.leads.priorityWarm;
      case "Cold": return t.leads.priorityCold;
      default: return priority;
    }
  };

  const getStageTranslation = (status: string) => {
    const stageMap: { [key: string]: string } = {
      "New Lead": t.leads.stages.newLead,
      "Contacted": t.leads.stages.contacted,
      "Qualified": t.leads.stages.qualified,
      "Viewing Scheduled": t.leads.stages.viewingScheduled,
      "Property Viewing Scheduled": t.leads.stages.viewingScheduled,
      "Property Viewed": t.leads.stages.propertyViewed,
      "Offer Made": t.leads.stages.offerMade,
      "Negotiation": t.leads.stages.negotiation,
      "Under Contract": t.leads.stages.underContract,
      "Converted": t.leads.stages.converted,
      "Lost": t.leads.stages.lost,
      "Not Interested": t.leads.stages.notInterested,
    };
    return stageMap[status] || status;
  };

  const handleExpand = () => {
    onExpand();
  };

  const handleEditMessage = () => {
    setEditedMessage(currentMessage);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      await cachedCallTaskApi("edit_follow_up_message", {
        task_id: task.id,
        lead_id: task.leadId,
        edited_message: editedMessage,
      });

      setCurrentMessage(editedMessage);
      setIsEditing(false);

      toast({
        title: t.taskCard.messageUpdated,
        description: t.taskCard.messageSaved,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.newLead.messages.errorTitle,
        description: error.message || t.taskCard.messageUpdateError,
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedMessage("");
    setIsEditing(false);
  };

  const handleCopyMessage = async () => {
    const success = await copyToClipboard(currentMessage);
    if (success) {
      toast({
        title: t.taskCard.copiedToClipboard,
        description: t.taskCard.clipboardDescription,
      });
    } else {
      toast({
        variant: "destructive",
        title: t.taskCard.failedToCopy,
        description: t.taskCard.failedToCopyDescription,
      });
    }
  };

  const handleSendWhatsApp = () => {
    if (task.leadContact?.phone) {
      // Store notification in localStorage before opening WhatsApp
      storeWhatsAppNotification(task.id, task.leadId, task.name);
      openWhatsApp(task.leadContact.phone, currentMessage);
    } else {
      toast({
        variant: "destructive",
        title: t.taskCard.noPhoneNumber,
        description: t.taskCard.noPhoneDescription,
      });
    }
  };

  const handleSendEmail = () => {
    if (task.leadContact?.email) {
      const subject = generateEmailSubject(task.name);
      openEmail(task.leadContact.email, subject, currentMessage);
    } else {
      toast({
        variant: "destructive",
        title: t.taskCard.noEmailAddress,
        description: t.taskCard.noEmailDescription,
      });
    }
  };

  const handleReschedule = async (newDate: Date, newTime: string, note: string) => {
    setIsRescheduling(true);
    try {
      await cachedCallTaskApi("reschedule_task", {
        task_id: task.id,
        lead_id: task.leadId,
        date: newDate.toISOString(),
        time: newTime,
        note: note,
      });

      toast({
        title: t.taskCard.taskRescheduled,
        description: t.taskCard.taskRescheduledDescription.replace('{{date}}', newDate.toDateString()).replace('{{time}}', newTime),
      });

      setShowReschedule(false);
      onTaskComplete(); // Refresh dashboard
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.newLead.messages.errorTitle,
        description: error.message || t.taskCard.rescheduleError,
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleCancel = async (note: string, nextFollowUpDate?: Date, scheduleNext?: boolean) => {
    setIsCancelling(true);
    try {
      const payload: any = {
        task_id: task.id,
        lead_id: task.leadId,
        note: note,
        next_follow_up: scheduleNext ? "yes" : "no",
      };

      // Only include follow_up_date if a date was selected
      if (nextFollowUpDate) {
        payload.follow_up_date = nextFollowUpDate.toISOString();
      }

      await cachedCallTaskApi("cancel_task", payload);

      toast({
        title: t.taskCard.taskCancelled,
        description: t.taskCard.taskCancelledDescription,
      });

      setShowCancel(false);
      onTaskComplete(); // Refresh dashboard
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.newLead.messages.errorTitle,
        description: error.message || t.taskCard.cancelError,
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMarkDone = async (note: string, nextFollowUpDate?: Date) => {
    setIsMarkingDone(true);
    try {
      const payload: any = {
        task_id: task.id,
        lead_id: task.leadId,
        note: note,
      };

      // Only include next_follow_up_date if a date was selected
      if (nextFollowUpDate) {
        payload.next_follow_up_date = nextFollowUpDate.toISOString();
      }

      await cachedCallTaskApi("mark_done", payload);

      toast({
        title: t.taskCard.taskCompleted,
        description: t.taskCard.taskCompletedDescription,
      });

      setShowComplete(false);
      onTaskComplete(); // Refresh dashboard
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t.newLead.messages.errorTitle,
        description: error.message || t.taskCard.completeError,
      });
    } finally {
      setIsMarkingDone(false);
    }
  };

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const response = await cachedCallFollowUpApi('regenerate_follow-up_message', { 
                lead_id: task.leadId,
                task_id: task.id,
            });
            const responseData = Array.isArray(response) ? response[0] : null;

            if (responseData && responseData["AI-Generated Message"] && responseData.lead_id === task.leadId) {
                setCurrentMessage(responseData["AI-Generated Message"]);
                toast({ title: t.taskCard.messageRegeneratedSuccess });
            } else {
                throw new Error('Invalid response from server.');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: t.newLead.messages.errorTitle,
                description: error.message || t.taskCard.messageRegenerateError,
            });
        } finally {
            setIsRegenerating(false);
        }
    };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Hot":
        return "bg-red-100 text-red-700 border-red-200";
      case "Warm":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Cold":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <>
      <Card
        className={cn(
          "shadow-sm cursor-pointer transition-all duration-300 ease-in-out mb-3",
          "hover:shadow-md hover:-translate-y-0.5",
          "rounded-xl"
        )}
        onClick={handleExpand}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-lg font-semibold text-gray-800 mb-1">
                {task.name}
              </h4>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="outline" className={cn("text-sm", getPriorityColor(task.leadPriority))}>
                  {getPriorityTranslation(task.leadPriority)}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {getStageTranslation(task.leadStatus)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {task.description}
              </p>
            </div>
            
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-2">
                <div className="space-y-1 text-sm text-gray-600">
                  {task.leadContact && task.leadContact.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {task.leadContact.email}
                    </p>
                  )}
                  {task.leadContact && task.leadContact.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {task.leadContact.phone}
                    </p>
                  )}
                  {task.propertyRequirements && (
                    <p className="flex items-start gap-2">
                      <Home className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {typeof task.propertyRequirements === 'object'
                          ? [
                              task.propertyRequirements.types?.join(', '),
                              task.propertyRequirements.locations?.join(', '),
                              task.propertyRequirements.budget
                            ].filter(Boolean).join(' • ')
                          : task.propertyRequirements
                        }
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {showsAIMessage && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      {t.taskCard.followUpMessage}
                    </h4>

                    {isEditing ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editedMessage}
                          onChange={(e) => setEditedMessage(e.target.value)}
                          className="bg-white min-h-[120px] text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={isSavingEdit || editedMessage === currentMessage}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            {isSavingEdit ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            {t.common.save}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSavingEdit}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-2" />
                            {t.common.cancel}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white rounded-md p-3 mb-3">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {currentMessage || "No message available."}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleEditMessage}
                            className="h-9 text-xs bg-white hover:bg-gray-50"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            {t.common.edit}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleRegenerate}
                            disabled={isRegenerating}
                            className="h-9 text-xs bg-white hover:bg-gray-50"
                          >
                            {isRegenerating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                            {t.taskCard.regenerate}
                          </Button>

                          {task.type === "whatsapp" ? (
                            <Button
                              size="sm"
                              onClick={handleSendWhatsApp}
                              className="h-9 text-xs bg-green-500 hover:bg-green-600 text-white"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              {t.taskCard.whatsapp}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={handleSendEmail}
                              className="h-9 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              {t.taskCard.email}
                            </Button>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCopyMessage}
                          className="w-full h-9 text-xs bg-white hover:bg-gray-50 mt-2"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {t.taskCard.copyMessage}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowReschedule(true)}
                  className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-blue-500 hover:bg-blue-50"
                >
                  <Calendar className="h-7 w-7 text-blue-600" />
                  <span className="text-sm font-medium">{t.taskCard.reschedule}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowCancel(true)}
                  className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-red-500 hover:bg-red-50"
                >
                  <X className="h-7 w-7 text-red-600" />
                  <span className="text-sm font-medium">{t.common.cancel}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowComplete(true)}
                  disabled={isMarkingDone}
                  className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-green-500 hover:bg-green-50"
                >
                  {isMarkingDone ? (
                    <Loader2 className="h-7 w-7 text-green-600 animate-spin" />
                  ) : (
                    <>
                      <span className="text-2xl">✓</span>
                      <span className="text-sm font-medium">{t.taskCard.done}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RescheduleModal
        open={showReschedule}
        onOpenChange={setShowReschedule}
        currentDate={new Date(date)}
        currentTime={task.time}
        leadName={task.name}
        onConfirm={handleReschedule}
        isLoading={isRescheduling}
      />

      <CancelTaskDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        leadName={task.name}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />

      <CompleteTaskDialog
        open={showComplete}
        onOpenChange={setShowComplete}
        leadName={task.name}
        onConfirm={handleMarkDone}
        isLoading={isMarkingDone}
      />
    </>
  );
}
