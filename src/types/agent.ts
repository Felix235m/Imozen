export interface AgentData {
  agent_id: string;
  agent_name: string;
  agent_email: string;
  agent_phone: string;
  agent_language: 'English' | 'Portuguese' | 'French';
  agent_image_url?: string;
  login_username?: string;
  sheet_url?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  agent: AgentData;
  error?: {
    message: string;
  };
}

export type AppLanguage = 'pt' | 'en';

// Map agent language values to app language codes
export const LANGUAGE_MAP: Record<string, AppLanguage> = {
  'Portuguese': 'pt',
  'English': 'en',
  'French': 'en' // Fallback to English for French
};

// Reverse map for converting app language codes back to agent language values
export const REVERSE_LANGUAGE_MAP: Record<AppLanguage, string> = {
  'pt': 'Portuguese',
  'en': 'English'
};
