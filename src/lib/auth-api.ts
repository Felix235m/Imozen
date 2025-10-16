

const API_BASE_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/auth-agents';
const LEAD_CREATION_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-creation';
const LEAD_OPERATIONS_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-operations';
const LEAD_STATUS_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-status';
const FOLLOW_UP_URL = 'https://eurekagathr.app.n8n.cloud/webhook/follow-up_message';
const LEAD_COMMUNICATION_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/notes';


type Operation = 'login' | 'password_reset_request' | 'password_reset_complete' | 'onboard_agent' | 'update_agent' | 'validate_session';
type LeadOperation = 'get_dashboard' | 'get_all_leads' | 'get_lead_details' | 'edit_lead' | 'delete_lead' | 'upload_lead_image' | 'delete_lead_image' | 'add_new_note' | 'save_note' | 'get_notes';
type LeadStatus = 'active' | 'inactive';
type FollowUpOperation = 'regenerate_follow-up_message';

async function callApi(url: string, body: any) {
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

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    console.log('🟢 callApi - Response status:', response.status, response.statusText);

    const text = await response.text();
    console.log('🟢 callApi - Response text:', text);

    if (!response.ok) {
        console.error('❌ callApi - Request failed:', response.status);
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
        // Check if we have full payload for priority change
        if (isFullPayload) {
            const updatePayload = {
                ...detailsOrFullPayload,
                lead_id: leadId,
                temperature: detailsOrFullPayload.temperature || detailsOrFullPayload.new_priority
            };
            console.log('🔵 callLeadStatusApi - Updating lead with full payload for priority change:', updatePayload);
            return callLeadApi('edit_lead', updatePayload);
        } else {
            // Legacy: Only temperature and note (should be avoided)
            const details = detailsOrFullPayload as { new_priority?: 'Hot' | 'Warm' | 'Cold', note?: string };
            console.warn('⚠️ callLeadStatusApi - Using incomplete payload for priority change. This may clear other fields!');
            return callLeadApi('edit_lead', { lead_id: leadId, temperature: details.new_priority, note: details.note });
        }
    }
}
