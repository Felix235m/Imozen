
const API_BASE_URL = 'https://eurekagathr.app.n8n.cloud/webhook/domain/auth-agents';

type Operation = 'login' | 'password_reset_request' | 'password_reset_complete' | 'onboard_agent' | 'update_agent';

export async function callAuthApi(operation: Operation, payload: any) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add the token to the header for all operations except login
  if (operation !== 'login') {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ operation, ...payload })
  });

  const text = await response.text();
  
  if (!response.ok) {
    try {
        const errorData = JSON.parse(text);
        // The error response could have the message in `error.message` or just `message`
        throw new Error(errorData.error?.message || errorData.message || 'API request failed');
    } catch (e: any) {
        // If parsing fails, it could be that `e` is the error from the `throw new Error` above.
        // Or it could be a raw string error from the server.
        // We'll prioritize the message from the thrown error if it exists.
        if (e.message.includes('{')) {
             throw new Error(text || 'API request failed with non-JSON response');
        }
        throw new Error(e.message || text || 'API request failed with non-JSON response');
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
