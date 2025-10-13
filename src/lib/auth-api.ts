

const API_BASE_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/auth-agents';
const LEAD_CREATION_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-creation';
const LEAD_OPERATIONS_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-operations';
const LEAD_STATUS_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-status';
const FOLLOW_UP_URL = 'https://eurekagathr.app.n8n.cloud/webhook/follow-up_message';
const LEAD_COMMUNICATION_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/notes';


type Operation = 'login' | 'password_reset_request' | 'password_reset_complete' | 'onboard_agent' | 'update_agent' | 'validate_session';
type LeadOperation = 'get_dashboard' | 'get_all_leads' | 'get_lead_details' | 'edit_lead' | 'delete_lead' | 'upload_lead_image' | 'delete_lead_image' | 'add_new_note' | 'save_note';
type LeadStatus = 'active' | 'inactive';
type FollowUpOperation = 'regenerate_follow-up_message';

async function callApi(url: string, body: any) {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    const text = await response.text();

    if (!response.ok) {
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
        return JSON.parse(text);
    } catch (e) {
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
    const body = { operation, ...payload };
    let url = LEAD_OPERATIONS_URL;

    if (operation === 'add_new_note' || operation === 'save_note') {
        url = LEAD_COMMUNICATION_URL;
        const token = localStorage.getItem('auth_token');
        body.session_token = token;
    }

    return callApi(url, body);
}

export async function callFollowUpApi(operation: FollowUpOperation, payload: any = {}) {
    const token = localStorage.getItem('auth_token');
    const body = { operation, session_token: token, ...payload };
    return callApi(FOLLOW_UP_URL, body);
}

export async function callLeadStatusApi(leadId: string, status: LeadStatus | "change_priority", details?: { new_priority?: 'Hot' | 'Warm' | 'Cold', note?: string }) {
    const token = localStorage.getItem('auth_token');
    let body: any;

    if (status === 'change_priority' && details) {
        body = {
            token,
            lead_id: leadId,
            operation: 'change_priority',
            new_priority: details.new_priority,
            note: details.note,
        };
    } else if (status === 'active' || status === 'inactive') {
        body = {
            token,
            lead_id: leadId,
            operation: 'change_status',
            status: status,
        };
    } else {
        throw new Error("Invalid parameters for callLeadStatusApi");
    }
    
    await callApi(LEAD_STATUS_URL, body);
    
    if (status === 'active' || status === 'inactive') {
        return callLeadApi('edit_lead', { lead_id: leadId, status: status === 'active' ? 'Active' : 'Inactive' });
    } else if (status === 'change_priority' && details) {
        return callLeadApi('edit_lead', { lead_id: leadId, temperature: details.new_priority, note: details.note });
    }
}
