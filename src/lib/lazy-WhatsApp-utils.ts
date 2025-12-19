/**
 * Lazy-loaded WhatsApp utility functions
 * These functions are loaded on-demand when WhatsApp functionality is needed
 */

export interface WhatsAppNotification {
  taskId: string;
  leadId: string;
  leadName: string;
  timestamp: number;
  action: 'whatsapp_sent';
}

let whatsappUtilsLoaded = false;
let whatsappUtils: any = null;

const loadWhatsAppUtils = async () => {
  if (whatsappUtilsLoaded) return whatsappUtils;

  try {
    const module = await import('./whatsapp-utils');
    whatsappUtils = module;
    whatsappUtilsLoaded = true;
    return module;
  } catch (error) {
    console.error('Failed to load WhatsApp utilities:', error);
    throw new Error('WhatsApp utilities could not be loaded');
  }
};

// Lazy wrappers for WhatsApp functions
export const lazyFormatPhoneForWhatsApp = async (phone: string): Promise<string> => {
  const utils = await loadWhatsAppUtils();
  return utils.formatPhoneForWhatsApp(phone);
};

export const lazyStoreWhatsAppNotification = async (
  taskId: string,
  leadId: string,
  leadName: string
): Promise<void> => {
  const utils = await loadWhatsAppUtils();
  utils.storeWhatsAppNotification(taskId, leadId, leadName);
};

export const lazyGetWhatsAppNotifications = async (): Promise<WhatsAppNotification[]> => {
  const utils = await loadWhatsAppUtils();
  return utils.getWhatsAppNotifications();
};

export const lazyRemoveWhatsAppNotification = async (taskId: string): Promise<void> => {
  const utils = await loadWhatsAppUtils();
  utils.removeWhatsAppNotification(taskId);
};

export const lazyOpenWhatsApp = async (phoneNumber: string, message: string): Promise<void> => {
  const utils = await loadWhatsAppUtils();
  utils.openWhatsApp(phoneNumber, message);
};

export const lazyClearWhatsAppNotifications = async (): Promise<void> => {
  const utils = await loadWhatsAppUtils();
  utils.clearWhatsAppNotifications();
};