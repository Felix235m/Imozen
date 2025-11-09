/**
 * Selective Webhooks - Helper functions for triggering specific data refreshes
 *
 * These functions are called selectively after mutations to keep localStorage in sync
 * with the server, without redundantly fetching all data.
 */

import { cachedCallLeadApi } from './cached-api';
import { localStorageManager } from './local-storage-manager';
import { extractLeadType, extractLeadStage, extractTemperature, normalizeLead, normalizeLeadDetail } from './lead-normalization';
import { transformBackendTasks } from './task-transformer';

/**
 * Refresh dashboard statistics
 * Called after: priority changes, lead deletion, new lead creation, task operations
 */
export async function refreshDashboard(): Promise<void> {
  try {
    console.log('🔄 Selective refresh: Dashboard');
    const response = await cachedCallLeadApi('get_dashboard', {}, { forceRefetch: true });
    const data = Array.isArray(response) ? response[0] : response;

    if (data && data.success) {
      localStorageManager.updateDashboard(data);
      console.log('✅ Dashboard refreshed');
    }
  } catch (error) {
    console.error('❌ Failed to refresh dashboard:', error);
    // Silent fail - don't block user experience
  }
}

/**
 * Refresh tasks list
 * Called after: task operations (20 second delay)
 */
export async function refreshTasks(): Promise<void> {
  try {
    console.log('🔄 Selective refresh: Tasks');
    const response = await cachedCallLeadApi('get_tasks', {}, { forceRefetch: true });
    const data = Array.isArray(response) ? response[0] : response;

    if (data && data.success) {
      // Transform backend tasks to frontend format
      const transformedTasks = transformBackendTasks(data.tasks || []);
      localStorageManager.updateTasks(transformedTasks);
      console.log('✅ Tasks refreshed and transformed');
    }
  } catch (error) {
    console.error('❌ Failed to refresh tasks:', error);
    // Silent fail - don't block user experience
  }
}

/**
 * Refresh specific lead details
 * Called after: task operations for specific lead (20 second delay)
 */
export async function refreshLeadDetails(leadId: string): Promise<void> {
  try {
    console.log(`🔄 Selective refresh: Lead details for ${leadId}`);
    const response = await cachedCallLeadApi('get_lead_details', { lead_id: leadId }, { forceRefetch: true });
    const data = Array.isArray(response) ? response[0] : response;

    if (data) {
      localStorageManager.updateLeadDetails(leadId, data);
      console.log(`✅ Lead details refreshed for ${leadId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to refresh lead details for ${leadId}:`, error);
    // Silent fail - don't block user experience
  }
}

/**
 * Refresh all leads list
 * Called after: new lead creation (in addition to dashboard)
 */
export async function refreshAllLeads(): Promise<void> {
  try {
    console.log('🔄 Selective refresh: All leads');
    const response = await cachedCallLeadApi('get_all_leads', {}, { forceRefetch: true });
    const data = Array.isArray(response) ? response[0] : response;

    if (data && Array.isArray(data.leads)) {
      // Use centralized normalization for all leads
      const transformedLeads = data.leads.map((lead: any) => {
        const normalized = normalizeLead(lead);
        console.log(`🔍 refreshAllLeads - Processing lead ${normalized.lead_id}: lead_type = ${normalized.lead_type}`);
        return normalized;
      });

      localStorageManager.updateLeads(transformedLeads);

      // Ensure leadDetails[leadId] exists for each lead (prevents webhook lead errors)
      transformedLeads.forEach((lead: any) => {
        const leadId = lead.lead_id;
        const existingDetail = localStorageManager.getLeadDetails(leadId);

        if (!existingDetail) {
          // Create minimal detail entry from list data using centralized normalization
          const minimalDetail = normalizeLeadDetail(lead);

          localStorageManager.updateLeadDetails(leadId, minimalDetail);
          console.log(`📝 Created leadDetails entry for ${leadId} with lead_type: ${minimalDetail.lead_type}`);
        }
      });

      console.log('✅ All leads refreshed with leadDetails sync');
    }
  } catch (error) {
    console.error('❌ Failed to refresh all leads:', error);
    // Silent fail - don't block user experience
  }
}

/**
 * Refresh after task operation (tasks + lead details, 20 second delay)
 * This combines both refreshes needed after task operations
 */
export async function refreshAfterTaskOperation(leadId: string): Promise<void> {
  await Promise.all([
    refreshTasks(),
    refreshLeadDetails(leadId)
  ]);
}
