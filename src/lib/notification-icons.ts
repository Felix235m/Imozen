/**
 * Notification Icon Mapping - Frontend-side icon and color configuration
 *
 * Maps notification types to Lucide React icons and Tailwind color classes
 */

import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Calendar,
  User,
  Zap,
  Trash2,
  Edit,
  Clock,
  UserPlus,
  PhoneCall,
  MessageSquare,
  TrendingUp,
  FileText,
  AlertCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NotificationConfig {
  icon: LucideIcon;
  color: string;
  bgColor?: string;
}

export const NOTIFICATION_CONFIG: Record<string, NotificationConfig> = {
  // Task/Follow-up notifications
  'mark_done': {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  'overdue_task': {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  'upcoming_task': {
    icon: Clock,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'task_rescheduled': {
    icon: RefreshCw,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  'task_cancelled': {
    icon: XCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },
  'task_completed': {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },

  // Lead notifications
  'new_lead': {
    icon: UserPlus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'lead_updated': {
    icon: Edit,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  'lead_deleted': {
    icon: Trash2,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  'priority_change': {
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  'stage_change': {
    icon: TrendingUp,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  },

  // Communication notifications
  'whatsapp_sent': {
    icon: MessageSquare,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  'call_made': {
    icon: PhoneCall,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'note_added': {
    icon: FileText,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },

  // System notifications
  'system_info': {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'system_warning': {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  'system_error': {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },

  // Default fallback
  'default': {
    icon: Bell,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  }
};

/**
 * Get notification configuration for a given type
 * Returns default config if type not found
 */
export function getNotificationConfig(type: string): NotificationConfig {
  return NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG['default'];
}

/**
 * Get icon component for a notification type
 */
export function getNotificationIcon(type: string): LucideIcon {
  return getNotificationConfig(type).icon;
}

/**
 * Get color class for a notification type
 */
export function getNotificationColor(type: string): string {
  return getNotificationConfig(type).color;
}

/**
 * Get background color class for a notification type
 */
export function getNotificationBgColor(type: string): string {
  return getNotificationConfig(type).bgColor || 'bg-gray-50';
}
