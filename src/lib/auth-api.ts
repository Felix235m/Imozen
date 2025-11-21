

const API_BASE_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/auth-agents';
const LEAD_CREATION_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-creation';
const LEAD_OPERATIONS_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-operations';
const LEAD_STATUS_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-status';
const FOLLOW_UP_URL = 'https://eurekagathr.app.n8n.cloud/webhook/follow-up_message';
const LEAD_COMMUNICATION_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/notes';
const TASK_OPERATIONS_URL = 'https://eurekagathr.app.n8n.cloud/webhook/task-operation';
const AGENT_DATABASE_URL = 'https://eurekagathr.app.n8n.cloud/webhook/agent_data';


type Operation = 'login' | 'password_reset_request' | 'password_reset_complete' | 'onboard_agent' | 'update_agent' | 'validate_session' | 'agent_image_url';
type LeadOperation = 'get_dashboard' | 'get_tasks' | 'get_all_leads' | 'edit_lead' | 'delete_lead' | 'upload_lead_image' | 'upload_lead_profile_image' | 'delete_lead_image' | 'add_new_note' | 'save_note' | 'get_notes';
type LeadStatus = 'active' | 'inactive';
type FollowUpOperation = 'regenerate_follow-up_message';
type TaskOperation = 'reschedule_task' | 'cancel_task' | 'mark_task_done' | 'edit_follow_up_message';

export async function callApi(url: string, body: any) {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    let token = null;
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('auth_token') || sessionStorage.getItem('sessionToken');
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('🟢 callApi - Making request to:', url);
    console.log('🟢 callApi - Headers:', headers);
    console.log('🟢 callApi - Request body:', body);

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
    } catch (error: any) {
        // Network errors: connection refused, DNS failure, timeout, etc.
        console.error('❌ callApi - Network error:', error);

        if (error.name === 'TypeError' || error.message.includes('fetch')) {
            throw new Error('Server is busy or could not be reached. Please check your connection and try again.');
        }
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. The server is taking too long to respond.');
        }
        throw new Error('Network error occurred. Please check your connection and try again.');
    }

    console.log('🟢 callApi - Response status:', response.status, response.statusText);

    const text = await response.text();
    console.log('🟢 callApi - Response text:', text);

    if (!response.ok) {
        console.error('❌ callApi - Request failed:', response.status);

        // Handle 401 Unauthorized (session expired)
        if (response.status === 401) {
            console.error('❌ callApi - Session expired (401)');

            // Clear auth tokens and app data
            if (typeof window !== 'undefined') {
                const { localStorageManager } = require('@/lib/local-storage-manager');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('agent_data');
                sessionStorage.removeItem('sessionToken');
                localStorageManager.clearAppData();

                // Redirect to login
                window.location.href = '/';
            }

            throw new Error('Session expired. Please log in again.');
        }

        // Handle server errors (5xx)
        if (response.status >= 500) {
            throw new Error('Server error occurred. Please try again later.');
        }

        // Handle client errors (4xx) - try to parse error message from response
        try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error?.message || errorData.message || 'API request failed');
        } catch (e: any) {
            if (e.message.includes('{')) {
                throw new Error(text || 'API request failed with non-JSON response');
            }
            throw new Error(e.message || text || 'API request failed with non-JSON response');
        }
    }

    try {
        const parsed = JSON.parse(text);
        console.log('✅ callApi - Success response:', parsed);
        return parsed;
    } catch (e) {
        console.log('✅ callApi - Success (non-JSON response):', text);
        return text || { success: true };
    }
}


export async function callAuthApi(operation: Operation, payload: any) {
  const url = operation === 'validate_session' ? LEAD_CREATION_URL : API_BASE_URL;
  let body;
  if (operation === 'validate_session') {
    body = { operation, agent: payload.agent, agent_id: payload.agent_id };
  } else {
    body = { operation, ...payload };
  }
  
  // Debug logging for update_agent operation
  if (operation === 'update_agent') {
    console.log('🔍 DEBUG - callAuthApi - update_agent operation');
    console.log('🔍 DEBUG - callAuthApi - agent_phone in payload:', body.agent_phone);
    console.log('🔍 DEBUG - callAuthApi - full payload:', JSON.stringify(body, null, 2));
  }
  
  return callApi(url, body);
}

export async function callLeadApi(operation: LeadOperation, payload: any = {}) {
    // Extract lead_id from various possible field names
    const lead_id = payload.lead_id || payload.id || payload.leadId || payload._id;

    // Create a clean payload without duplicate ID fields
    const { id, leadId, _id, ...cleanPayload } = payload;

    const body: any = {
        operation,
        lead_id, // Explicit lead_id at top level
        ...cleanPayload // Spread cleaned payload (without duplicate IDs)
    };

    let url = LEAD_OPERATIONS_URL;

    // Use different URL for note operations
    if (operation === 'add_new_note' || operation === 'save_note' || operation === 'get_notes') {
        url = LEAD_COMMUNICATION_URL;
    }

    // Debug logging
    console.log('🔵 callLeadApi - Operation:', operation);
    console.log('🔵 callLeadApi - URL:', url);
    console.log('🔵 callLeadApi - Body:', JSON.stringify(body, null, 2));

    return callApi(url, body);
}

export async function callFollowUpApi(operation: FollowUpOperation, payload: any = {}) {
    const body = { operation, ...payload };
    return callApi(FOLLOW_UP_URL, body);
}

export async function callLeadStatusApi(
    leadId: string,
    status: LeadStatus | "change_priority",
    detailsOrFullPayload?: { new_priority?: 'Hot' | 'Warm' | 'Cold', note?: string } | any
) {
    let statusLogBody: any;

    // Determine if we have a full lead payload or just details
    const isFullPayload = detailsOrFullPayload &&
                          typeof detailsOrFullPayload === 'object' &&
                          ('name' in detailsOrFullPayload || 'contact' in detailsOrFullPayload);

    if (status === 'change_priority' && detailsOrFullPayload && !isFullPayload) {
        const details = detailsOrFullPayload as { new_priority?: 'Hot' | 'Warm' | 'Cold', note?: string };
        statusLogBody = {
            lead_id: leadId,
            operation: 'change_priority',
            new_priority: details.new_priority,
            note: details.note,
        };
    } else if (status === 'active' || status === 'inactive') {
        statusLogBody = {
            lead_id: leadId,
            operation: 'change_status',
            status: status,
        };
    } else if (status === 'change_priority' && detailsOrFullPayload && isFullPayload) {
        // When full payload is provided for priority change
        statusLogBody = {
            lead_id: leadId,
            operation: 'change_priority',
            new_priority: detailsOrFullPayload.temperature,
            note: detailsOrFullPayload.note || '',
        };
    } else {
        throw new Error("Invalid parameters for callLeadStatusApi");
    }

    console.log('🔵 callLeadStatusApi - Status log body:', statusLogBody);

    // First call: Log the status change
    await callApi(LEAD_STATUS_URL, statusLogBody);

    // Second call: Update the full lead object in the main database
    if (status === 'active' || status === 'inactive') {
        const updatePayload = isFullPayload
            ? { ...detailsOrFullPayload, lead_id: leadId, status: status === 'active' ? 'Active' : 'Inactive' }
            : { lead_id: leadId, status: status === 'active' ? 'Active' : 'Inactive' };

        console.log('🔵 callLeadStatusApi - Updating lead with payload:', updatePayload);
        return callLeadApi('edit_lead', updatePayload);
    } else if (status === 'change_priority' && detailsOrFullPayload) {
        // When priority changes, the status webhook *may* return the full object.
        // We return this directly instead of making a second call.
        return callApi(LEAD_STATUS_URL, statusLogBody);
    }
}

export async function callTaskApi(operation: TaskOperation, payload: any = {}) {
    const body = { operation, ...payload };

    console.log('🟣 callTaskApi - Operation:', operation);
    console.log('🟣 callTaskApi - URL:', TASK_OPERATIONS_URL);
    console.log('🟣 callTaskApi - Body:', JSON.stringify(body, null, 2));

    return callApi(TASK_OPERATIONS_URL, body);
}

/**
 * Fetch complete agent database (all app data in single call)
 * This replaces individual calls to get_tasks, get_dashboard, get_all_leads, etc.
 * @param token - Authentication token
 * @returns Complete agent database response
 */
export async function fetchAgentDatabase(token: string) {
    const body = {
        operation: 'agent_database',
    };

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };

    console.log('🟠 fetchAgentDatabase - Fetching complete database');
    console.log('🟠 fetchAgentDatabase - URL:', AGENT_DATABASE_URL);
    console.log('🟠 fetchAgentDatabase - Headers:', headers);
    console.log('🟠 fetchAgentDatabase - Request body:', body);

    let response;
    try {
        response = await fetch(AGENT_DATABASE_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });
    } catch (error: any) {
        console.error('❌ fetchAgentDatabase - Network error:', error);

        if (error.name === 'TypeError' || error.message.includes('fetch')) {
            throw new Error('Server is busy or could not be reached. Please check your connection and try again.');
        }
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. The server is taking too long to respond.');
        }
        throw new Error('Network error occurred. Please check your connection and try again.');
    }

    console.log('🟠 fetchAgentDatabase - Response status:', response.status, response.statusText);

    const text = await response.text();
    console.log('🟠 fetchAgentDatabase - Response text:', text);

    if (!response.ok) {
        console.error('❌ fetchAgentDatabase - Request failed:', response.status);

        // Handle 401 Unauthorized (session expired)
        if (response.status === 401) {
            console.error('❌ fetchAgentDatabase - Session expired (401)');

            // Clear auth tokens and app data
            if (typeof window !== 'undefined') {
                const { localStorageManager } = require('@/lib/local-storage-manager');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('agent_data');
                sessionStorage.removeItem('sessionToken');
                localStorageManager.clearAppData();

                // Redirect to login
                window.location.href = '/';
            }

            throw new Error('Session expired. Please log in again.');
        }

        if (response.status >= 500) {
            throw new Error('Server error occurred. Please try again later.');
        }

        try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error?.message || errorData.message || 'API request failed');
        } catch (e: any) {
            if (e.message.includes('{')) {
                throw new Error(text || 'API request failed with non-JSON response');
            }
            throw new Error(e.message || text || 'API request failed with non-JSON response');
        }
    }

    try {
      const parsed = JSON.parse(text);
      console.log('🔍 DEBUG: fetchAgentDatabase - Raw response text:', text);
      console.log('🔍 DEBUG: fetchAgentDatabase - Parsed JSON:', parsed);
      
      // Handle array response (webhook returns array with single object)
      const response = Array.isArray(parsed) ? parsed[0] : parsed;
      console.log('✅ fetchAgentDatabase - Database received:', response);
      console.log('🔍 DEBUG: fetchAgentDatabase - Response structure check:', {
        isArray: Array.isArray(parsed),
        firstElementKeys: Array.isArray(parsed) && parsed[0] ? Object.keys(parsed[0]) : 'none',
        responseType: typeof response
      });
      
      return response;
    } catch (e) {
      console.log('✅ fetchAgentDatabase - Success (non-JSON response):', text);
      return text || { success: true };
    }
}
