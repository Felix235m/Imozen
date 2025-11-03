
/**
 * Transforms webhook response data to frontend Lead format
 * Handles field name mapping, type conversions, and data structure transformation
 */

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

  return {
    lead_id: data.lead_id,
    name: data.name || '',
    temperature: data['Hot/Warm/Cold'] || data.temperature || 'Cold',
    stage: data.Stage || 'New Lead',
    lead_stage: data.Stage || 'New Lead',
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

  // Parse location preferences
  const locations = data.location_preference
    ? data.location_preference.split(',').map(loc => loc.trim())
    : [];

  return {
    lead_id: data.lead_id,
    name: data.name || '',
    temperature: data['Hot/Warm/Cold'] || data.temperature || 'Cold',
    stage: data.Stage || 'New Lead',
    lead_stage: data.Stage || 'New Lead',
    next_follow_up: {
      date: data['next follow-up date'] || null,
      status: data['follow-up_task'] || '',
      color: '', // Will be calculated by frontend
      days_until: null, // Will be calculated by frontend
    },
    contact: {
      email: String(data.email || ''),
      phone: data.phone || '',
      language: data['Language preference'] || 'English',
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
 * Format ISO date string to readable format
 */
function formatDate(isoDate: string): string {
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
