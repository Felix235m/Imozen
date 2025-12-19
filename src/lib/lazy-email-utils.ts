/**
 * Lazy-loaded email utility functions
 * These functions are loaded on-demand when email functionality is needed
 */

let emailUtilsLoaded = false;
let emailUtils: any = null;

const loadEmailUtils = async () => {
  if (emailUtilsLoaded) return emailUtils;

  try {
    const module = await import('./email-utils');
    emailUtils = module;
    emailUtilsLoaded = true;
    return module;
  } catch (error) {
    console.error('Failed to load email utilities:', error);
    throw new Error('Email utilities could not be loaded');
  }
};

// Lazy wrappers for email functions
export const lazyOpenEmail = async (email: string, subject: string, body: string): Promise<void> => {
  const utils = await loadEmailUtils();
  utils.openEmail(email, subject, body);
};

export const lazyGenerateEmailSubject = async (leadName: string): Promise<string> => {
  const utils = await loadEmailUtils();
  return utils.generateEmailSubject(leadName);
};