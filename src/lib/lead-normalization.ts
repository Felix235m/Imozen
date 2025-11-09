/**
 * Centralized Lead Data Normalization
 *
 * This module provides a single source of truth for normalizing lead data
 * from various backend sources (webhooks, API responses) to ensure consistent
 * field naming and values throughout the application.
 */

import type { Lead, LeadDetail } from '@/types/app-data';

/**
 * Extract and normalize lead_type from any backend data format
 * Handles all known variations: lead_type, Lead_Type, Lead_type, leadType, type
 */
export function extractLeadType(data: any): 'Buyer' | 'Seller' {
  // Try all known field name variations
  const rawType = data.lead_type
    || data.Lead_Type
    || data.Lead_type
    || data.leadType
    || data.type;

  // Normalize to proper case (case-insensitive match)
  if (rawType) {
    const normalized = String(rawType).toLowerCase();
    if (normalized === 'seller') {
      return 'Seller';
    }
    if (normalized === 'buyer') {
      return 'Buyer';
    }
  }

  // Log warning in development if we're defaulting
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Lead type not found or invalid, defaulting to Buyer. Raw data:', {
      lead_type: data.lead_type,
      Lead_Type: data.Lead_Type,
      Lead_type: data.Lead_type,
      leadType: data.leadType,
      type: data.type,
      lead_id: data.lead_id,
      name: data.name,
    });
  }

  // Safe default
  return 'Buyer';
}

/**
 * Extract and normalize lead_stage/Stage field
 */
export function extractLeadStage(data: any): string {
  return data.lead_stage || data.Stage || data.stage || 'New Lead';
}

/**
 * Extract and normalize temperature/Hot/Warm/Cold field
 */
export function extractTemperature(data: any): 'Hot' | 'Warm' | 'Cold' {
  const rawTemp = data.temperature
    || data['Hot/Warm/Cold']
    || data['Hot_Warm_Cold']
    || data.temp;

  if (rawTemp) {
    const normalized = String(rawTemp);
    if (['Hot', 'Warm', 'Cold'].includes(normalized)) {
      return normalized as 'Hot' | 'Warm' | 'Cold';
    }
  }

  return 'Cold'; // Default
}

/**
 * Normalize a raw lead object from backend to consistent Lead format
 * Use this for list data (leads page, tasks, etc.)
 */
export function normalizeLead(rawLead: any): Lead {
  const leadType = extractLeadType(rawLead);
  const leadStage = extractLeadStage(rawLead);
  const temperature = extractTemperature(rawLead);

  return {
    lead_id: rawLead.lead_id || rawLead.id,
    name: rawLead.name || '',
    temperature,
    stage: leadStage,
    lead_stage: leadStage,
    lead_type: leadType,
    image_url: rawLead.image_url || rawLead.imageUrl || '',
    contact: rawLead.contact || {
      phone: rawLead.phone || '',
      email: rawLead.email || '',
      language: rawLead.Language_preference || rawLead['Language preference'] || 'English',
    },
    property: rawLead.property || {
      type: rawLead.property_type || '',
      locations: Array.isArray(rawLead.location_preference)
        ? rawLead.location_preference
        : (rawLead.location_preference || '').split(',').map((s: string) => s.trim()),
      bedrooms: rawLead.bedrooms || 0,
      budget: rawLead.budget || 0,
      budget_formatted: rawLead.budget_formatted || '€0',
    },
    next_follow_up: rawLead.next_follow_up || {
      date: null,
      status: '',
      color: '',
      days_until: null,
    },
    created_at: rawLead.created_at || new Date().toISOString(),
    created_at_formatted: rawLead.created_at_formatted || '',
    row_number: rawLead.row_number || 0,
  };
}

/**
 * Normalize a raw lead object to LeadDetail format
 * Use this for detail page data
 */
export function normalizeLeadDetail(rawLead: any): LeadDetail {
  const leadType = extractLeadType(rawLead);
  const leadStage = extractLeadStage(rawLead);
  const temperature = extractTemperature(rawLead);

  // Parse location_preference (handle both array and string formats)
  let locations: string[] = [];
  if (rawLead.location_preference) {
    if (Array.isArray(rawLead.location_preference)) {
      locations = rawLead.location_preference.map((loc: any) => String(loc).trim());
    } else if (typeof rawLead.location_preference === 'string') {
      locations = rawLead.location_preference.split(',').map((loc: string) => loc.trim());
    }
  } else if (rawLead.property?.locations) {
    locations = Array.isArray(rawLead.property.locations)
      ? rawLead.property.locations
      : [];
  }

  return {
    lead_id: rawLead.lead_id || rawLead.id,
    name: rawLead.name || '',
    temperature,
    stage: leadStage,
    lead_stage: leadStage,
    lead_type: leadType,
    image_url: rawLead.image_url || rawLead.imageUrl || '',
    contact: {
      email: String(rawLead.email || rawLead.contact?.email || ''),
      phone: rawLead.phone || rawLead.contact?.phone || '',
      language: rawLead['Language preference']
        || rawLead['Language_preference']
        || rawLead.contact?.language
        || 'English',
    },
    property: {
      type: rawLead.property_type || rawLead.property?.type || '',
      locations,
      bedrooms: Number(rawLead.bedrooms || rawLead.property?.bedrooms || 0),
      budget: typeof rawLead.budget === 'string'
        ? parseFloat(rawLead.budget.replace(/[^0-9.-]/g, '')) || 0
        : Number(rawLead.budget || rawLead.property?.budget || 0),
      budget_formatted: rawLead.budget_formatted
        || rawLead.property?.budget_formatted
        || `€${rawLead.budget || 0}`,
    },
    purchase: rawLead.purchase || {},
    management: rawLead.management || {},
    next_follow_up: rawLead.next_follow_up || {
      date: null,
      status: '',
      color: '',
      days_until: null,
    },
    created_at: rawLead.created_at || new Date().toISOString(),
    created_at_formatted: rawLead.created_at_formatted || '',
    communication_history: rawLead.communication_history || [],
    row_number: rawLead.row_number || 0,
    notes: rawLead.notes || '',
  };
}

/**
 * Validate lead data and return issues
 * Use in development to catch data problems early
 */
export function validateLeadData(lead: Lead | LeadDetail): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check required fields
  if (!lead.lead_id) issues.push('Missing lead_id');
  if (!lead.name) issues.push('Missing name');

  // Check lead_type validity
  if (!['Buyer', 'Seller'].includes(lead.lead_type || '')) {
    issues.push(`Invalid lead_type: "${lead.lead_type}" (must be "Buyer" or "Seller")`);
  }

  // Check temperature validity
  if (!['Hot', 'Warm', 'Cold'].includes(lead.temperature || '')) {
    issues.push(`Invalid temperature: "${lead.temperature}" (must be "Hot", "Warm", or "Cold")`);
  }

  // Log issues in development
  if (issues.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Lead data validation issues:', {
      lead_id: lead.lead_id,
      name: lead.name,
      issues,
      data: lead,
    });
  }

  return { valid: issues.length === 0, issues };
}
