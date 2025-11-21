/**
 * Lazy Loading Notification Icon Mapping - Optimized for performance
 * 
 * This module provides lazy-loaded notification icons to reduce initial bundle size
 * and improve first-load performance of the notifications page.
 */

import type { LucideIcon } from 'lucide-react';
import { Bell } from 'lucide-react';

export interface NotificationConfig {
  icon: LucideIcon;
  color: string;
  bgColor?: string;
}

// Cache for loaded icons to avoid repeated imports
const iconCache = new Map<string, LucideIcon>();

/**
 * Lazy load notification icons on demand
 * This reduces the initial bundle size and improves first-load performance
 */
async function loadIcon(iconName: string): Promise<LucideIcon> {
  // Check cache first
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!;
  }

  let icon: LucideIcon;

  // Dynamic imports for icons - only loaded when needed
  switch (iconName) {
    case 'CheckCircle':
      const { CheckCircle } = await import('lucide-react');
      icon = CheckCircle;
      break;
    case 'AlertTriangle':
      const { AlertTriangle } = await import('lucide-react');
      icon = AlertTriangle;
      break;
    case 'Info':
      const { Info } = await import('lucide-react');
      icon = Info;
      break;
    case 'Calendar':
      const { Calendar } = await import('lucide-react');
      icon = Calendar;
      break;
    case 'User':
      const { User } = await import('lucide-react');
      icon = User;
      break;
    case 'Zap':
      const { Zap } = await import('lucide-react');
      icon = Zap;
      break;
    case 'Trash2':
      const { Trash2 } = await import('lucide-react');
      icon = Trash2;
      break;
    case 'Edit':
      const { Edit } = await import('lucide-react');
      icon = Edit;
      break;
    case 'Clock':
      const { Clock } = await import('lucide-react');
      icon = Clock;
      break;
    case 'UserPlus':
      const { UserPlus } = await import('lucide-react');
      icon = UserPlus;
      break;
    case 'PhoneCall':
      const { PhoneCall } = await import('lucide-react');
      icon = PhoneCall;
      break;
    case 'MessageSquare':
      const { MessageSquare } = await import('lucide-react');
      icon = MessageSquare;
      break;
    case 'TrendingUp':
      const { TrendingUp } = await import('lucide-react');
      icon = TrendingUp;
      break;
    case 'FileText':
      const { FileText } = await import('lucide-react');
      icon = FileText;
      break;
    case 'AlertCircle':
      const { AlertCircle } = await import('lucide-react');
      icon = AlertCircle;
      break;
    case 'XCircle':
      const { XCircle } = await import('lucide-react');
      icon = XCircle;
      break;
    case 'RefreshCw':
      const { RefreshCw } = await import('lucide-react');
      icon = RefreshCw;
      break;
    default:
      icon = Bell;
  }

  // Cache the loaded icon
  iconCache.set(iconName, icon);
  return icon;
}

// Static configuration without icon references
const NOTIFICATION_CONFIG_STATIC: Record<string, Omit<NotificationConfig, 'icon'> & { iconName: string }> = {
  // Task/Follow-up notifications
  'mark_done': {
    iconName: 'CheckCircle',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  'overdue_task': {
    iconName: 'AlertTriangle',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  'upcoming_task': {
    iconName: 'Clock',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'task_rescheduled': {
    iconName: 'RefreshCw',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  'task_cancelled': {
    iconName: 'XCircle',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },
  'task_completed': {
    iconName: 'CheckCircle',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  'follow_up_scheduled': {
    iconName: 'Calendar',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'follow_up_in_progress': {
    iconName: 'Clock',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  'follow_up_failed': {
    iconName: 'XCircle',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  'follow_up_cancellation_in_progress': {
    iconName: 'Clock',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  'follow_up_cancelled': {
    iconName: 'CheckCircle',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  'follow_up_cancellation_failed': {
    iconName: 'XCircle',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },

  // Lead notifications
  'new_lead': {
    iconName: 'UserPlus',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'lead_updated': {
    iconName: 'Edit',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  },
  'lead_deleted': {
    iconName: 'Trash2',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  'priority_change': {
    iconName: 'Zap',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  'priority_changed': {
    iconName: 'Zap',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  'stage_change': {
    iconName: 'TrendingUp',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  },
  'stage_changed': {
    iconName: 'TrendingUp',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50'
  },

  // Communication notifications
  'whatsapp_sent': {
    iconName: 'MessageSquare',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  'call_made': {
    iconName: 'PhoneCall',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'note_added': {
    iconName: 'FileText',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  },

  // System notifications
  'system_info': {
    iconName: 'Info',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  'system_warning': {
    iconName: 'AlertCircle',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  'system_error': {
    iconName: 'XCircle',
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },

  // Default fallback
  'default': {
    iconName: 'Bell',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50'
  }
};

/**
 * Get notification configuration with lazy-loaded icon
 * Returns a Promise that resolves to the complete config
 */
export async function getNotificationConfigLazy(type: string): Promise<NotificationConfig> {
  const staticConfig = NOTIFICATION_CONFIG_STATIC[type] || NOTIFICATION_CONFIG_STATIC['default'];
  
  try {
    const icon = await loadIcon(staticConfig.iconName);
    return {
      icon,
      color: staticConfig.color,
      bgColor: staticConfig.bgColor
    };
  } catch (error) {
    console.warn(`Failed to load icon for notification type "${type}":`, error);
    return {
      icon: Bell,
      color: staticConfig.color,
      bgColor: staticConfig.bgColor
    };
  }
}

/**
 * Get notification configuration synchronously with fallback icon
 * This is used for the initial render before icons are loaded
 */
export function getNotificationConfigSync(type: string): NotificationConfig {
  const staticConfig = NOTIFICATION_CONFIG_STATIC[type] || NOTIFICATION_CONFIG_STATIC['default'];
  
  return {
    icon: Bell, // Fallback icon until lazy load completes
    color: staticConfig.color,
    bgColor: staticConfig.bgColor
  };
}

/**
 * Preload commonly used notification icons
 * Call this during app initialization or idle time
 */
export async function preloadCommonIcons(): Promise<void> {
  const commonTypes = ['new_lead', 'mark_done', 'overdue_task', 'system_info'];
  
  const preloadPromises = commonTypes.map(async (type) => {
    try {
      await getNotificationConfigLazy(type);
    } catch (error) {
      console.warn(`Failed to preload icon for type "${type}":`, error);
    }
  });
  
  await Promise.allSettled(preloadPromises);
}