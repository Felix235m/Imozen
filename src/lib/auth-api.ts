const API_BASE_URL = 'https://eurekagathr.app.n8n.cloud/webhook-test/domain/auth-agents';

type Operation = 'login' | 'password_reset_request' | 'password_reset_complete' | 'onboard_agent' | 'update_agent';

export async function callAuthApi(operation: Operation, payload: any) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operation, ...payload })
  });

  const text = await response.text();
  
  if (!response.ok) {
    try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.error?.message || errorData.message || 'API request failed');
    } catch (e) {
        // If parsing fails, it's likely a simple text error message from the server.
        throw new Error(text || 'API request failed with non-JSON response');
    }
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    // Handle cases where a successful response has no body (e.g. 204 No Content)
    // or is just a simple text response.
    return text || { success: true };
  }
}
