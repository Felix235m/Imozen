import type { LucideIcon } from 'lucide-react';
import {
  UserPlus,
  Edit,
  Upload,
  Trash2,
  TrendingUp,
  Target,
  Calendar,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  Eye,
  DollarSign,
  FileSignature,
  Handshake,
  PartyPopper,
  ThumbsDown,
  UserX,
  Building,
  Home,
  Warehouse,
  Mountain,
  Tag,
} from 'lucide-react';

export type EventType =
  // Lead Events
  | 'lead_created'
  | 'lead_updated'
  | 'lead_image_uploaded'
  | 'lead_image_deleted'
  | 'lead_deleted'
  // Priority/Stage
  | 'priority_changed'
  | 'stage_changed'
  // Follow-up/Task
  | 'follow_up_scheduled'
  | 'follow_up_rescheduled'
  | 'follow_up_completed'
  | 'follow_up_cancelled'
  | 'follow_up_message_edited'
  | 'follow_up_message_regenerated'
  | 'follow_up_overdue'
  // Communication
  | 'note_added'
  | 'note_edited'
  | 'note_deleted'
  | 'whatsapp_sent'
  | 'email_sent'
  | 'phone_call_logged'
  // Property/Transaction (future-ready)
  | 'viewing_scheduled'
  | 'viewing_completed'
  | 'viewing_cancelled'
  | 'offer_made'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'contract_sent'
  | 'contract_signed'
  | 'deal_closed'
  | 'deal_lost';

export interface EventConfig {
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  title: string;
  category: 'lead' | 'priority' | 'stage' | 'follow_up' | 'communication' | 'property' | 'transaction';
}

export const EVENT_CONFIGS: Record<EventType, EventConfig> = {
  // Lead Events
  lead_created: {
    icon: UserPlus,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    title: 'Lead Created',
    category: 'lead',
  },
  lead_updated: {
    icon: Edit,
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    title: 'Lead Updated',
    category: 'lead',
  },
  lead_image_uploaded: {
    icon: Upload,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    title: 'Image Uploaded',
    category: 'lead',
  },
  lead_image_deleted: {
    icon: Trash2,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    title: 'Image Deleted',
    category: 'lead',
  },
  lead_deleted: {
    icon: UserX,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    title: 'Lead Deleted',
    category: 'lead',
  },

  // Priority/Stage
  priority_changed: {
    icon: TrendingUp,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    title: 'Priority Changed',
    category: 'priority',
  },
  stage_changed: {
    icon: Target,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    title: 'Stage Changed',
    category: 'stage',
  },

  // Follow-up/Task
  follow_up_scheduled: {
    icon: Calendar,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    title: 'Follow-up Scheduled',
    category: 'follow_up',
  },
  follow_up_rescheduled: {
    icon: RefreshCw,
    iconColor: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    title: 'Follow-up Rescheduled',
    category: 'follow_up',
  },
  follow_up_completed: {
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    title: 'Follow-up Completed',
    category: 'follow_up',
  },
  follow_up_cancelled: {
    icon: XCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    title: 'Follow-up Cancelled',
    category: 'follow_up',
  },
  follow_up_message_edited: {
    icon: Edit,
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    title: 'Message Edited',
    category: 'follow_up',
  },
  follow_up_message_regenerated: {
    icon: RefreshCw,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    title: 'Message Regenerated',
    category: 'follow_up',
  },
  follow_up_overdue: {
    icon: Calendar,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    title: 'Follow-up Overdue',
    category: 'follow_up',
  },

  // Communication
  note_added: {
    icon: FileText,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    title: 'Note Added',
    category: 'communication',
  },
  note_edited: {
    icon: Edit,
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    title: 'Note Edited',
    category: 'communication',
  },
  note_deleted: {
    icon: Trash2,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    title: 'Note Deleted',
    category: 'communication',
  },
  whatsapp_sent: {
    icon: MessageSquare,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    title: 'WhatsApp Sent',
    category: 'communication',
  },
  email_sent: {
    icon: Mail,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    title: 'Email Sent',
    category: 'communication',
  },
  phone_call_logged: {
    icon: Phone,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    title: 'Phone Call',
    category: 'communication',
  },

  // Property/Transaction (future-ready)
  viewing_scheduled: {
    icon: Eye,
    iconColor: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    title: 'Viewing Scheduled',
    category: 'property',
  },
  viewing_completed: {
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    title: 'Viewing Completed',
    category: 'property',
  },
  viewing_cancelled: {
    icon: XCircle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    title: 'Viewing Cancelled',
    category: 'property',
  },
  offer_made: {
    icon: DollarSign,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    title: 'Offer Made',
    category: 'transaction',
  },
  offer_accepted: {
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    title: 'Offer Accepted',
    category: 'transaction',
  },
  offer_rejected: {
    icon: ThumbsDown,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    title: 'Offer Rejected',
    category: 'transaction',
  },
  contract_sent: {
    icon: FileSignature,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    title: 'Contract Sent',
    category: 'transaction',
  },
  contract_signed: {
    icon: Handshake,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    title: 'Contract Signed',
    category: 'transaction',
  },
  deal_closed: {
    icon: PartyPopper,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-100',
    title: 'Deal Closed',
    category: 'transaction',
  },
  deal_lost: {
    icon: ThumbsDown,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    title: 'Deal Lost',
    category: 'transaction',
  },
};

export function getEventConfig(eventType: string): EventConfig {
  const config = EVENT_CONFIGS[eventType as EventType];
  if (config) {
    return config;
  }

  // Fallback for unknown event types
  return {
    icon: Tag,
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    title: eventType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    category: 'lead',
  };
}