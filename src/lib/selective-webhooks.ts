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
 * Refresh after task operation (tasks only, 20 second delay)
 * Lead details are no longer refreshed via API - they use localStorage
 */
export async function refreshAfterTaskOperation(): Promise<void> {
  // Lead details now come from localStorage - no API refresh needed
  await refreshTasks();
}
