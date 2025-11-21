import type { LucideIcon } from 'lucide-react';
import type { CommunicationEvent } from '@/types/app-data';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
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

export function getEventConfig(eventType: string, language: 'en' | 'pt' = 'en'): EventConfig {
  const config = EVENT_CONFIGS[eventType as EventType];
  if (config) {
    // Override title with localized version if language is specified
    const localizedTitle = getLocalizedEventTitle(eventType, language);
    return {
      ...config,
      title: localizedTitle,
    };
  }

  // Fallback for unknown event types
  return {
    icon: Tag,
    iconColor: 'text-gray-600',
    bgColor: 'bg-gray-100',
    title: getLocalizedEventTitle(eventType, language),
    category: 'lead',
  };
}

/**
 * Normalize timestamp to a Date object for proper formatting
 */
export function normalizeTimestamp(timestamp: any): Date {
  if (!timestamp) return new Date();

  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (typeof timestamp === 'string') {
    // Handle ISO format strings like "2025-11-20T11:54:21.144+00:00"
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }

  return new Date();
}

/**
 * Get localized description template with parameter substitution
 */
export function getLocalizedEventDescription(
  eventType: string,
  language: 'en' | 'pt' = 'en',
  params?: Record<string, string>
): string {
  try {
    const translationsKey = language === 'pt' ? 'pt' : 'en';

    // Try to get description templates from global translations
    const translations = (globalThis as any).translations?.[translationsKey]?.leads?.events;

    let template: string | undefined;

    // Handle different event types with their specific templates
    switch (eventType) {
      case 'follow_up_cancelled':
        template = translations?.followUpCancelled?.description;
        break;
      case 'follow_up_rescheduled':
        template = translations?.followUpRescheduled?.description;
        break;
      case 'priority_changed':
        template = translations?.priorityChanged?.description;
        break;
      case 'stage_changed':
        template = translations?.stageChanged?.description;
        break;
      case 'follow_up_completed':
        template = translations?.followUpCompleted?.description;
        break;
      case 'note_added':
        template = translations?.noteAdded?.description;
        break;
      case 'whatsapp_sent':
        template = translations?.whatsappSent?.description;
        break;
      case 'email_sent':
        template = translations?.emailSent?.description;
        break;
      case 'phone_call_logged':
        template = translations?.phoneCallLogged?.description;
        break;
      case 'viewing_scheduled':
        template = translations?.viewingScheduled?.description;
        break;
      case 'viewing_completed':
        template = translations?.viewingCompleted?.description;
        break;
      case 'offer_made':
        template = translations?.offerMade?.description;
        break;
      case 'offer_accepted':
        template = translations?.offerAccepted?.description;
        break;
      case 'offer_rejected':
        template = translations?.offerRejected?.description;
        break;
      case 'contract_sent':
        template = translations?.contractSent?.description;
        break;
      case 'contract_signed':
        template = translations?.contractSigned?.description;
        break;
      case 'deal_closed':
        template = translations?.dealClosed?.description;
        break;
      case 'deal_lost':
        template = translations?.dealLost?.description;
        break;
    }

    // Fallback to hardcoded templates if translation not found
    if (!template) {
      const fallbackTemplates: Record<string, Record<string, string>> = {
        pt: {
          'follow_up_cancelled': 'Acompanhamento cancelado por {{agent}}.{{reason}}',
          'follow_up_rescheduled': 'Acompanhamento reagendado por {{agent}} para {{date}}.{{reason}}',
          'priority_changed': 'Prioridade alterada de "{{from}}" para "{{to}}" por {{agent}}.{{reason}}',
          'stage_changed': 'Estágio alterado de "{{from}}" para "{{to}}" por {{agent}}.{{reason}}',
          'follow_up_completed': 'Acompanhamento concluído por {{agent}}.{{reason}}',
          'note_added': 'Nota adicionada por {{agent}}: {{note}}',
          'whatsapp_sent': 'Mensagem WhatsApp enviada por {{agent}} para {{contact}}',
          'email_sent': 'E-mail enviado por {{agent}} para {{contact}}',
          'phone_call_logged': 'Ligação registrada por {{agent}} com {{contact}}',
          'viewing_scheduled': 'Visita agendada por {{agent}} para {{date}}',
          'viewing_completed': 'Visita concluída por {{agent}} em {{date}}',
          'offer_made': 'Oferta feita por {{agent}} no valor de {{amount}}',
          'offer_accepted': 'Oferta aceita por {{agent}} em {{date}}',
          'offer_rejected': 'Oferta rejeitada por {{agent}} em {{date}}',
          'contract_sent': 'Contrato enviado por {{agent}} em {{date}}',
          'contract_signed': 'Contrato assinado por {{agent}} em {{date}}',
          'deal_closed': 'Negócio fechado por {{agent}} em {{date}}',
          'deal_lost': 'Negócio perdido por {{agent}} em {{date}}',
        },
        en: {
          'follow_up_cancelled': 'Follow-up cancelled by {{agent}}.{{reason}}',
          'follow_up_rescheduled': 'Follow-up rescheduled by {{agent}} to {{date}}.{{reason}}',
          'priority_changed': 'Priority changed from "{{from}}" to "{{to}}" by {{agent}}.{{reason}}',
          'stage_changed': 'Stage changed from "{{from}}" to "{{to}}" by {{agent}}.{{reason}}',
          'follow_up_completed': 'Follow-up completed by {{agent}}.{{reason}}',
          'note_added': 'Note added by {{agent}}: {{note}}',
          'whatsapp_sent': 'WhatsApp message sent by {{agent}} to {{contact}}',
          'email_sent': 'Email sent by {{agent}} to {{contact}}',
          'phone_call_logged': 'Phone call logged by {{agent}} with {{contact}}',
          'viewing_scheduled': 'Viewing scheduled by {{agent}} for {{date}}',
          'viewing_completed': 'Viewing completed by {{agent}} on {{date}}',
          'offer_made': 'Offer made by {{agent}} for {{amount}}',
          'offer_accepted': 'Offer accepted by {{agent}} on {{date}}',
          'offer_rejected': 'Offer rejected by {{agent}} on {{date}}',
          'contract_sent': 'Contract sent by {{agent}} on {{date}}',
          'contract_signed': 'Contract signed by {{agent}} on {{date}}',
          'deal_closed': 'Deal closed by {{agent}} on {{date}}',
          'deal_lost': 'Deal lost by {{agent}} on {{date}}',
        }
      };

      template = fallbackTemplates[language]?.[eventType] ||
                fallbackTemplates.en[eventType] ||
                'Event occurred: {{eventType}}';
    }

    // Substitute parameters
    if (params && template) {
      let result = template;

      // Replace all {{param}} placeholders with actual values
      Object.entries(params).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        result = result.replace(new RegExp(placeholder, 'g'), value);
      });

      // Clean up any unused placeholders that have conditional prefixes
      result = result.replace(/\.{{reason}}(\.)?/, (match) => {
        return params.reason ? match : '';
      });

      return result;
    }

    return template || 'Event occurred';
  } catch (error) {
    console.warn('Failed to get localized event description:', error);
    return 'Event occurred';
  }
}

/**
 * Get localized event title based on event type and language
 */
export function getLocalizedEventTitle(eventType: string, language: 'en' | 'pt' = 'en'): string {
  try {
    // Get translations from localStorage or use global translations
    const translationsKey = language === 'pt' ? 'pt' : 'en';

    // Try to get translations from the global scope (will be injected by components)
    const translations = (globalThis as any).translations?.[translationsKey]?.leads?.eventTypes;

    if (translations && translations[eventType]) {
      return translations[eventType];
    }

    // Fallback to hardcoded translations
    const fallbackTranslations: Record<string, Record<string, string>> = {
      pt: {
        'lead_created': 'Lead Criado',
        'lead_updated': 'Lead Atualizado',
        'lead_image_uploaded': 'Imagem Carregada',
        'lead_image_deleted': 'Imagem Excluída',
        'lead_deleted': 'Lead Excluído',
        'priority_changed': 'Prioridade Alterada',
        'stage_changed': 'Estágio Alterado',
        'follow_up_scheduled': 'Acompanhamento Agendado',
        'follow_up_rescheduled': 'Acompanhamento Reagendado',
        'follow_up_completed': 'Acompanhamento Concluído',
        'follow_up_cancelled': 'Acompanhamento Cancelado',
        'follow_up_message_edited': 'Mensagem Editada',
        'follow_up_message_regenerated': 'Mensagem Regenerada',
        'follow_up_overdue': 'Acompanhamento Atrasado',
        'note_added': 'Nota Adicionada',
        'note_edited': 'Nota Editada',
        'note_deleted': 'Nota Excluída',
        'whatsapp_sent': 'WhatsApp Enviado',
        'email_sent': 'E-mail Enviado',
        'phone_call_logged': 'Ligação Registrada',
        'viewing_scheduled': 'Visita Agendada',
        'viewing_completed': 'Visita Concluída',
        'viewing_cancelled': 'Visita Cancelada',
        'offer_made': 'Oferta Feita',
        'offer_accepted': 'Oferta Aceita',
        'offer_rejected': 'Oferta Rejeitada',
        'contract_sent': 'Contrato Enviado',
        'contract_signed': 'Contrato Assinado',
        'deal_closed': 'Negócio Fechado',
        'deal_lost': 'Negócio Perdido',
      },
      en: {
        'lead_created': 'Lead Created',
        'lead_updated': 'Lead Updated',
        'lead_image_uploaded': 'Image Uploaded',
        'lead_image_deleted': 'Image Deleted',
        'lead_deleted': 'Lead Deleted',
        'priority_changed': 'Priority Changed',
        'stage_changed': 'Stage Changed',
        'follow_up_scheduled': 'Follow-up Scheduled',
        'follow_up_rescheduled': 'Follow-up Rescheduled',
        'follow_up_completed': 'Follow-up Completed',
        'follow_up_cancelled': 'Follow-up Cancelled',
        'follow_up_message_edited': 'Message Edited',
        'follow_up_message_regenerated': 'Message Regenerated',
        'follow_up_overdue': 'Follow-up Overdue',
        'note_added': 'Note Added',
        'note_edited': 'Note Edited',
        'note_deleted': 'Note Deleted',
        'whatsapp_sent': 'WhatsApp Sent',
        'email_sent': 'Email Sent',
        'phone_call_logged': 'Phone Call Logged',
        'viewing_scheduled': 'Viewing Scheduled',
        'viewing_completed': 'Viewing Completed',
        'viewing_cancelled': 'Viewing Cancelled',
        'offer_made': 'Offer Made',
        'offer_accepted': 'Offer Accepted',
        'offer_rejected': 'Offer Rejected',
        'contract_sent': 'Contract Sent',
        'contract_signed': 'Contract Signed',
        'deal_closed': 'Deal Closed',
        'deal_lost': 'Deal Lost',
      }
    };

    return fallbackTranslations[language][eventType] ||
           fallbackTranslations.en[eventType] ||
           eventType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  } catch (error) {
    console.warn('Failed to get localized event title:', error);
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

/**
 * Get the current agent language from localStorage
 */
export function getCurrentAgentLanguage(): 'en' | 'pt' {
  try {
    const agentDataString = localStorage.getItem('agent_data');
    if (!agentDataString) return 'pt'; // Default to Portuguese

    const agentData = JSON.parse(agentDataString);
    const agentLang = agentData.agent_language;

    if (!agentLang) return 'pt';

    // Map agent language to app language code
    const LANGUAGE_MAP: Record<string, 'en' | 'pt'> = {
      'Portuguese': 'pt',
      'English': 'en',
      'French': 'en', // Fallback to English for French
    };

    return LANGUAGE_MAP[agentLang] || 'pt';
  } catch (error) {
    console.error('Failed to get agent language:', error);
    return 'pt'; // Default to Portuguese
  }
}

/**
 * Get the current agent name from localStorage
 */
export function getCurrentAgentName(): string | null {
  try {
    const agentDataString = localStorage.getItem('agent_data');
    if (!agentDataString) return null;

    const agentData = JSON.parse(agentDataString);
    return agentData.agent_name || null;
  } catch (error) {
    console.error('Failed to get current agent name:', error);
    return null;
  }
}

/**
 * Format date consistently across the application
 */
export function formatDateConsistently(date: Date | string | number, agentName?: string): string {
  const dateObj = normalizeTimestamp(date);

  // Detect locale from agent name or default to English
  const dateLocale = agentName && (agentName.includes('Agent') || agentName.includes('pt')) ? 'pt' : 'en';
  const locale = dateLocale === 'pt' ? ptBR : enUS;

  return format(dateObj, 'PPP', { locale });
}

/**
 * Format short date consistently across the application
 */
export function formatShortDate(date: Date | string | number, agentName?: string): string {
  const dateObj = normalizeTimestamp(date);

  // Detect locale from agent name or default to English
  const dateLocale = agentName && (agentName.includes('Agent') || agentName.includes('pt')) ? 'pt' : 'en';
  const locale = dateLocale === 'pt' ? ptBR : enUS;

  return format(dateObj, 'PP', { locale });
}

/**
 * Create a cancellation event for the communication history
 */
export function createCancellationEvent(
  taskId: string,
  agentName: string,
  note?: string
): CommunicationEvent {
  const now = new Date();
  const language = getCurrentAgentLanguage();

  // Use localized title and description
  const title = getLocalizedEventTitle('follow_up_cancelled', language);

  // Build localized description with parameters
  const descriptionParams: Record<string, string> = {
    agent: agentName,
  };

  // Add reason if provided
  if (note) {
    descriptionParams.reason = note;
  }

  const description = getLocalizedEventDescription('follow_up_cancelled', language, descriptionParams);

  return {
    id: `Event_${now.getTime()}`,
    event_type: 'follow_up_cancelled',
    title,
    timestamp: now.getTime(), // Convert to number for consistency
    description,
    performed_by: agentName,
    related_entities: {
      task_id: taskId,
    },
    metadata: {
      cancelled_at: now.toISOString(),
      agent_name: agentName,
      cancellation_note: note,
    }
  };
}

/**
 * Create a reschedule event for the communication history
 */
export function createRescheduleEvent(
  rescheduledTask: any,
  agentName: string
): CommunicationEvent {
  const now = new Date();
  const rescheduledDate = new Date(rescheduledTask.follow_up_date);
  const language = getCurrentAgentLanguage();

  // Use localized title and consistent date formatting
  const title = getLocalizedEventTitle('follow_up_rescheduled', language);
  const formattedDate = formatDateConsistently(rescheduledDate, agentName);

  // Build localized description with parameters
  const descriptionParams: Record<string, string> = {
    agent: agentName,
    date: formattedDate,
  };

  const description = getLocalizedEventDescription('follow_up_rescheduled', language, descriptionParams);

  return {
    id: `Event_${now.getTime() + 1}`, // Ensure different ID from cancellation event
    event_type: 'follow_up_rescheduled',
    title,
    timestamp: now.getTime(), // Use current time for event creation timestamp
    description,
    performed_by: agentName,
    related_entities: {
      task_id: rescheduledTask.id,
      lead_id: rescheduledTask.lead_id,
    },
    metadata: {
      rescheduled_at: now.toISOString(), // Keep creation time in metadata
      agent_name: agentName,
      original_task_id: rescheduledTask.id,
      new_follow_up_date: rescheduledTask.follow_up_date,
    }
  };
}

/**
 * Create a priority change event for the communication history
 */
export function createPriorityChangeEvent(
  leadId: string,
  fromPriority: string,
  toPriority: string,
  agentName: string,
  note?: string
): CommunicationEvent {
  const now = new Date();
  const language = getCurrentAgentLanguage();

  // Use localized title
  const title = getLocalizedEventTitle('priority_changed', language);

  // Build localized description with parameters
  const descriptionParams: Record<string, string> = {
    agent: agentName,
    from: fromPriority,
    to: toPriority,
  };

  // Add reason if provided
  if (note) {
    descriptionParams.reason = note;
  }

  const description = getLocalizedEventDescription('priority_changed', language, descriptionParams);

  return {
    id: `Event_${now.getTime()}`,
    event_type: 'priority_changed',
    title,
    timestamp: now.getTime(),
    description,
    performed_by: agentName,
    related_entities: {
      lead_id: leadId,
    },
    metadata: {
      changed_at: now.toISOString(),
      agent_name: agentName,
      from_priority: fromPriority,
      to_priority: toPriority,
      change_note: note,
    }
  };
}

/**
 * Create a stage change event for the communication history
 */
export function createStageChangeEvent(
  leadId: string,
  fromStage: string,
  toStage: string,
  agentName: string,
  note?: string
): CommunicationEvent {
  const now = new Date();
  const language = getCurrentAgentLanguage();

  // Use localized title
  const title = getLocalizedEventTitle('stage_changed', language);

  // Build localized description with parameters
  const descriptionParams: Record<string, string> = {
    agent: agentName,
    from: fromStage,
    to: toStage,
  };

  // Add reason if provided
  if (note) {
    descriptionParams.reason = note;
  }

  const description = getLocalizedEventDescription('stage_changed', language, descriptionParams);

  return {
    id: `Event_${now.getTime()}`,
    event_type: 'stage_changed',
    title,
    timestamp: now.getTime(),
    description,
    performed_by: agentName,
    related_entities: {
      lead_id: leadId,
    },
    metadata: {
      changed_at: now.toISOString(),
      agent_name: agentName,
      from_stage: fromStage,
      to_stage: toStage,
      change_note: note,
    }
  };
}