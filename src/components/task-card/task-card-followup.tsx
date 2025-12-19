import React from "react";
import { Mail, MessageSquare, Edit, Save, X, Copy, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";

interface TaskCardFollowUpProps {
  currentMessage: string;
  isEditing: boolean;
  editedMessage: string;
  isSavingEdit: boolean;
  isRegenerating: boolean;
  taskType: "email" | "phone" | "whatsapp" | "calendar" | "home" | "briefcase";
  onEditMessage: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onCopyMessage: () => void;
  onRegenerate: () => void;
  onSendWhatsApp: () => void;
  onSendEmail: () => void;
  onEditedMessageChange: (value: string) => void;
}

export function TaskCardFollowUp({
  currentMessage,
  isEditing,
  editedMessage,
  isSavingEdit,
  isRegenerating,
  taskType,
  onEditMessage,
  onSaveEdit,
  onCancelEdit,
  onCopyMessage,
  onRegenerate,
  onSendWhatsApp,
  onSendEmail,
  onEditedMessageChange
}: TaskCardFollowUpProps) {
  const { t } = useLanguage();

  if (!isEditing) {
    return (
      <>
        <div className="bg-white rounded-md p-3 mb-3">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {currentMessage || t.taskCard.noMessageAvailable}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onEditMessage}
            className="h-9 text-xs bg-white hover:bg-gray-50"
          >
            <Edit className="h-3 w-3 mr-1" />
            {t.common.edit}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="h-9 text-xs bg-white hover:bg-gray-50"
          >
            {isRegenerating ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
            {t.taskCard.regenerate}
          </Button>

          {taskType === "whatsapp" ? (
            <Button
              size="sm"
              onClick={onSendWhatsApp}
              className="h-9 text-xs bg-green-500 hover:bg-green-600 text-white"
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              {t.taskCard.whatsapp}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onSendEmail}
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
          onClick={onCopyMessage}
          className="w-full h-9 text-xs bg-white hover:bg-gray-50 mt-2"
        >
          <Copy className="h-3 w-3 mr-1" />
          {t.taskCard.copyMessage}
        </Button>
      </>
    );
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={editedMessage}
        onChange={(e) => onEditedMessageChange(e.target.value)}
        className="bg-white min-h-[120px] text-sm"
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onSaveEdit}
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
          onClick={onCancelEdit}
          disabled={isSavingEdit}
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          {t.common.cancel}
        </Button>
      </div>
    </div>
  );
}