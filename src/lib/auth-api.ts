

const API_BASE_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/auth-agents';
const LEAD_CREATION_URL = 'https://eurekagathr.app.n8n.cloud/webhook-test/domain/lead-creation';

type Operation = 'login' | 'password_reset_request' | 'password_reset_complete' | 'onboard_agent' | 'update_agent' | 'validate_session';

export async function callAuthApi(operation: Operation, payload: any) {
  const url = operation === 'validate_session' ? LEAD_CREATION_URL : API_BASE_URL;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body;
  if (operation === 'validate_session') {
    // This is the critical fix: Ensure the body is correctly structured for this specific operation.
    body = JSON.stringify({ operation: 'validate_session', agent: payload.agent });
  } else {
    body = JSON.stringify({ operation, ...payload });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: body
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
