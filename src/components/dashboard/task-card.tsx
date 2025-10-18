
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
import { callFollowUpApi, callTaskApi } from "@/lib/auth-api";
import { openWhatsApp } from "@/lib/whatsapp-utils";
import { openEmail, generateEmailSubject } from "@/lib/email-utils";
import { copyToClipboard } from "@/lib/task-utils";
import { RescheduleModal } from "./reschedule-modal";
import { CancelTaskDialog } from "./cancel-task-dialog";

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
  propertyRequirements: string;
}

interface TaskCardProps {
  task: TaskItem;
  date: string;
  isExpanded: boolean;
  onExpand: () => void;
  onTaskComplete: () => void;
}

export function TaskCard({ task, date, isExpanded, onExpand, onTaskComplete }: TaskCardProps) {
  const [currentMessage, setCurrentMessage] = useState(task.followUpMessage);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMarkingDone, setIsMarkingDone] = useState(false);

  const { toast } = useToast();
  const Icon = iconMap[task.type] || iconMap.default;

  const showsAIMessage = task.type === "whatsapp" || task.type === "email";

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
      await callTaskApi("edit_follow_up_message", {
        task_id: task.id,
        lead_id: task.leadId,
        edited_message: editedMessage,
      });

      setCurrentMessage(editedMessage);
      setIsEditing(false);

      toast({
        title: "Message updated",
        description: "Your follow-up message has been saved.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not save message",
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
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy message to clipboard",
      });
    }
  };

  const handleSendWhatsApp = () => {
    if (task.leadContact?.phone) {
      openWhatsApp(task.leadContact.phone, currentMessage);
    } else {
      toast({
        variant: "destructive",
        title: "No phone number",
        description: "This lead doesn't have a phone number",
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
        title: "No email address",
        description: "This lead doesn't have an email address",
      });
    }
  };

  const handleReschedule = async (newDate: Date, newTime: string, note: string) => {
    setIsRescheduling(true);
    try {
      await callTaskApi("reschedule_task", {
        task_id: task.id,
        lead_id: task.leadId,
        new_date: newDate.toISOString(),
        new_time: newTime,
        note: note,
      });

      toast({
        title: "Task rescheduled",
        description: `Task moved to ${newDate.toDateString()} at ${newTime}`,
      });

      setShowReschedule(false);
      onTaskComplete(); // Refresh dashboard
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not reschedule task",
      });
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleCancel = async (reason: string, note: string) => {
    setIsCancelling(true);
    try {
      await callTaskApi("cancel_task", {
        task_id: task.id,
        lead_id: task.leadId,
        reason: reason,
        note: note,
      });

      toast({
        title: "Task cancelled",
        description: "The follow-up task has been cancelled",
      });

      setShowCancel(false);
      onTaskComplete(); // Refresh dashboard
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not cancel task",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleMarkDone = async () => {
    setIsMarkingDone(true);
    try {
      const token = localStorage.getItem("auth_token");

      await callTaskApi("mark_task_done", {
        task_id: task.id,
        lead_id: task.leadId,
        operation: "task_completed",
        session_token: token,
      });

      toast({
        title: "Task completed!",
        description: "The follow-up task has been marked as done",
      });

      onTaskComplete(); // Refresh dashboard
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Could not mark task as done",
      });
    } finally {
      setIsMarkingDone(false);
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
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
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
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-sm">
                    {task.leadStatus}
                  </Badge>
                  <Badge variant="outline" className={cn("text-sm", getPriorityColor(task.leadPriority))}>
                    {task.leadPriority}
                  </Badge>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  {task.leadContact?.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {task.leadContact.email}
                    </p>
                  )}
                  {task.leadContact?.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {task.leadContact.phone}
                    </p>
                  )}
                  {task.propertyRequirements && (
                    <p className="flex items-start gap-2">
                      <Home className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{task.propertyRequirements}</span>
                    </p>
                  )}
                </div>
              </div>

              {showsAIMessage && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      Follow-up Message
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
                            disabled={isSavingEdit}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            {isSavingEdit ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={isSavingEdit}
                            className="flex-1"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
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
                            Edit
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { /* No-op */ }}
                            className="h-9 text-xs bg-white hover:bg-gray-50"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Regenerate
                          </Button>

                          {task.type === "whatsapp" ? (
                            <Button
                              size="sm"
                              onClick={handleSendWhatsApp}
                              className="h-9 text-xs bg-green-500 hover:bg-green-600 text-white"
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              WhatsApp
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={handleSendEmail}
                              className="h-9 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Email
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
                          Copy Message
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
                  <span className="text-sm font-medium">Reschedule</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowCancel(true)}
                  className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-red-500 hover:bg-red-50"
                >
                  <X className="h-7 w-7 text-red-600" />
                  <span className="text-sm font-medium">Cancel</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleMarkDone}
                  disabled={isMarkingDone}
                  className="h-20 flex flex-col items-center justify-center gap-2 border-2 hover:border-green-500 hover:bg-green-50"
                >
                  {isMarkingDone ? (
                    <Loader2 className="h-7 w-7 text-green-600 animate-spin" />
                  ) : (
                    <>
                      <span className="text-2xl">✓</span>
                      <span className="text-sm font-medium">Done</span>
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
        onConfirm={handleReschedule}
        isLoading={isRescheduling}
      />

      <CancelTaskDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        onConfirm={handleCancel}
        isLoading={isCancelling}
      />
    </>
  );
}
