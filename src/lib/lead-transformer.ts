
/**
 * Transforms webhook response data to frontend Lead format
 * Handles field name mapping, type conversions, and data structure transformation
 */

import { extractLeadType, extractLeadStage, extractTemperature } from './lead-normalization';

type WebhookLeadData = {
  row_number?: number;
  lead_id: string;
  created_at?: string;
  Stage?: string;
  'Hot/Warm/Cold'?: string;
  name?: string;
  email?: string | number;
  phone?: string;
  source?: string;
  initial_message?: string;
  property_type?: string;
  location_preference?: string;
  num_of_rooms?: number;
  budget?: number;
  agent_notes?: string;
  purchase_timeframe?: string;
  'financing_type (Cash/Credit)'?: string;
  credit_pre_approved?: boolean;
  search_duration?: string;
  has_seen_properties?: string;
  'Language preference'?: string;
  Lead_Score?: number;
  'AI-Generated Message'?: string;
  'next follow-up date'?: string;
  image_url?: string;
  'follow-up_task'?: string;
  last_contacted_at?: string;
  last_updated_at?: string;
  [key: string]: any; // Allow other fields
};

/**
 * Transform webhook response to Lead type used in leads list page
 */
export function transformWebhookResponseToLeadListItem(response: any): any {
  // Extract first element if array
  const data: WebhookLeadData = Array.isArray(response) ? response[0] : response;

  if (!data || !data.lead_id) {
    console.warn('Invalid webhook response:', response);
    return null;
  }

  // Use centralized normalization functions
  const leadType = extractLeadType(data);
  const leadStage = extractLeadStage(data);
  const temperature = extractTemperature(data);
  console.log(`🔍 transformWebhookResponseToLeadListItem - lead_type: ${leadType}`);

  return {
    lead_id: data.lead_id,
    name: data.name || '',
    temperature,
    stage: leadStage,
    lead_stage: leadStage,
    lead_type: leadType,
    created_at: data.created_at,
    next_follow_up: {
      status: data['follow-up_task'] || '',
      date: data['next follow-up date'] || null,
    },
  };
}

/**
 * Transform webhook response to full LeadData type used in lead detail page
 */
export function transformWebhookResponseToLeadData(response: any): any {
  // Extract first element if array
  const data: WebhookLeadData = Array.isArray(response) ? response[0] : response;

  if (!data || !data.lead_id) {
    console.warn('Invalid webhook response:', response);
    return null;
  }

  // Parse location preferences (handle both array and string formats)
  let locations: string[] = [];
  if (data.location_preference) {
    if (Array.isArray(data.location_preference)) {
      locations = data.location_preference.map((loc: any) => String(loc).trim());
    } else if (typeof data.location_preference === 'string') {
      locations = data.location_preference.split(',').map(loc => loc.trim());
    }
  }

  // Use centralized normalization functions
  const leadType = extractLeadType(data);
  const leadStage = extractLeadStage(data);
  const temperature = extractTemperature(data);
  console.log(`🔍 transformWebhookResponseToLeadData - lead_type: ${leadType}`);

  return {
    lead_id: data.lead_id,
    name: data.name || '',
    temperature,
    stage: leadStage,
    lead_stage: leadStage,
    lead_type: leadType,
    next_follow_up: {
      date: data['next follow-up date'] || null,
      status: data['follow-up_task'] || '',
      color: '', // Will be calculated by frontend
      days_until: null, // Will be calculated by frontend
    },
    contact: {
      email: String(data.email || ''),
      phone: data.phone || '',
      language: data['Language preference'] || data['Language_preference'] || 'English',
    },
    property: {
      type: data.property_type || '',
      locations: locations,
      bedrooms: data.num_of_rooms || 0,
      budget: data.budget || 0,
      budget_formatted: data.budget ? `€${data.budget.toLocaleString()}` : '€0',
    },
    purchase: {
      timeframe: data.purchase_timeframe || '',
      financing_type: data['financing_type (Cash/Credit)'] || '',
      credit_pre_approved: data.credit_pre_approved || false,
      search_duration: data.search_duration || '',
      has_seen_properties: data.has_seen_properties || '',
    },
    management: {
      source: data.source || '',
      initial_message: data.initial_message || '',
      agent_notes: data.agent_notes || '',
      follow_up_task: data['follow-up_task'] || '',
      lead_score: data.Lead_Score || 0,
      ai_message: data['AI-Generated Message'] || '',
    },
    created_at: data.created_at || new Date().toISOString(),
    created_at_formatted: data.created_at ? formatDate(data.created_at) : '',
    image_url: data.image_url || '',
    communication_history: [],
    row_number: data.row_number || 0,
  };
}


/**
 * Transform new backend response structure to frontend format
 * Handles the new backend structure where:
 * - property.types (array) -> property.type (string)
 * - property.budget (string "€10000") -> property.budget (number)
 * - management.created_at -> created_at (top-level)
 * - management.language -> contact.language
 */
export function transformNewBackendResponse(backendLead: any): any {
  if (!backendLead) return backendLead;

  // Parse budget: "€10000" -> 10000
  const budgetNum = parseBudget(backendLead.property?.budget);

  // Parse bedrooms if it's a string
  const bedroomsNum = typeof backendLead.property?.bedrooms === 'string'
    ? parseInt(backendLead.property.bedrooms) || 0
    : backendLead.property?.bedrooms || 0;

  // Use centralized normalization for lead_type
  const leadType = extractLeadType(backendLead);
  console.log(`🔍 transformNewBackendResponse - lead_type: ${leadType}`);

  return {
    ...backendLead,
    // Set lead_type with proper fallback
    lead_type: leadType,
    // Move created_at to top level from management
    created_at: backendLead.management?.created_at || backendLead.created_at,
    created_at_formatted: formatDate(backendLead.management?.created_at || backendLead.created_at),

    // Fix property fields
    property: {
      ...backendLead.property,
      // Convert types array to single type string
      type: backendLead.property?.types?.[0] || backendLead.property?.type || '',
      // Convert budget string to number and format
      budget: budgetNum,
      budget_formatted: budgetNum ? `€${budgetNum.toLocaleString()}` : '€0',
      // Convert bedrooms string to number
      bedrooms: bedroomsNum,
    },

    // Move language from management to contact
    contact: {
      ...backendLead.contact,
      language: backendLead.management?.language || backendLead.contact?.language || 'English',
    },
  };
}

/**
 * Parse budget string to number
 * Handles formats like "€10000", "€10,000", "10000"
 */
function parseBudget(budgetStr: any): number {
  if (!budgetStr) return 0;
  if (typeof budgetStr === 'number') return budgetStr;

  // Remove currency symbols, spaces, and commas
  const cleaned = String(budgetStr).replace(/[€$,\s]/g, '');
  const parsed = parseInt(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format ISO date string to readable format
 */
function formatDate(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
