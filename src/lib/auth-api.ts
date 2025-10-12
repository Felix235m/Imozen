

const API_BASE_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/auth-agents';
const LEAD_CREATION_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-creation';
const LEAD_OPERATIONS_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/lead-operations';
const LEAD_STATUS_URL = 'https://eurekagathr.app.n8n.cloud/webhook-test/domain/lead-status';

type Operation = 'login' | 'password_reset_request' | 'password_reset_complete' | 'onboard_agent' | 'update_agent' | 'validate_session';
type LeadOperation = 'get_dashboard' | 'get_all_leads' | 'get_lead_details' | 'edit_lead' | 'delete_lead' | 'upload_lead_image' | 'delete_lead_image';
type LeadStatusOperation = 'active' | 'inactive';

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
    return callApi(LEAD_OPERATIONS_URL, body);
}

export async function callLeadStatusApi(leadId: string, operation: LeadStatusOperation) {
    const token = localStorage.getItem('auth_token');
    const body = {
        token,
        lead_id: leadId,
        operation: operation,
    };
    await callApi(LEAD_STATUS_URL, body);
    
    // Also call the original API to update the status in the main system
    return callLeadApi('edit_lead', { lead_id: leadId, status: operation === 'active' ? 'Active' : 'Inactive' });
}
