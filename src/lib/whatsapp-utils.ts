/**
 * WhatsApp utility functions for opening WhatsApp with pre-filled messages
 */

const WHATSAPP_NOTIFICATION_KEY = 'whatsapp_pending_notifications';
const NOTIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface WhatsAppNotification {
  taskId: string;
  leadId: string;
  leadName: string;
  timestamp: number;
  action: 'whatsapp_sent';
}

/**
 * Format phone number for WhatsApp by removing non-digit characters
 * and ensuring it has the correct international format with + prefix
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Remove any + signs that are not at the beginning
  const parts = cleaned.split('+');
  cleaned = parts.filter(p => p).join(''); // Remove empty parts and join

  // Ensure the number starts with +
  if (!cleaned.startsWith('+')) {
    cleaned = `+${cleaned}`;
  }

  return cleaned;
}

/**
 * Store WhatsApp notification in localStorage
 */
export function storeWhatsAppNotification(taskId: string, leadId: string, leadName: string): void {
  try {
    const notification: WhatsAppNotification = {
      taskId,
      leadId,
      leadName,
      timestamp: Date.now(),
      action: 'whatsapp_sent',
    };

    const existing = getWhatsAppNotifications();
    const updated = [...existing, notification];
    localStorage.setItem(WHATSAPP_NOTIFICATION_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to store WhatsApp notification:', error);
  }
}

/**
 * Get all pending WhatsApp notifications
 * Automatically filters out expired notifications (older than 24 hours)
 */
export function getWhatsAppNotifications(): WhatsAppNotification[] {
  try {
    const stored = localStorage.getItem(WHATSAPP_NOTIFICATION_KEY);
    if (!stored) return [];

    const notifications: WhatsAppNotification[] = JSON.parse(stored);
    const now = Date.now();

    // Filter out expired notifications
    const validNotifications = notifications.filter(
      (n) => now - n.timestamp < NOTIFICATION_EXPIRY_MS
    );

    // Update storage if any notifications were filtered out
    if (validNotifications.length !== notifications.length) {
      localStorage.setItem(WHATSAPP_NOTIFICATION_KEY, JSON.stringify(validNotifications));
    }

    return validNotifications;
  } catch (error) {
    console.error('Failed to retrieve WhatsApp notifications:', error);
    return [];
  }
}

/**
 * Remove a specific WhatsApp notification
 */
export function removeWhatsAppNotification(taskId: string): void {
  try {
    const notifications = getWhatsAppNotifications();
    const filtered = notifications.filter((n) => n.taskId !== taskId);
    localStorage.setItem(WHATSAPP_NOTIFICATION_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove WhatsApp notification:', error);
  }
}

/**
 * Clear all WhatsApp notifications
 */
export function clearWhatsAppNotifications(): void {
  try {
    localStorage.removeItem(WHATSAPP_NOTIFICATION_KEY);
  } catch (error) {
    console.error('Failed to clear WhatsApp notifications:', error);
  }
}

/**
 * Open WhatsApp with pre-filled message
 * Opens in a new tab/window
 */
export function openWhatsApp(phoneNumber: string, message: string): void {
  const formattedPhone = formatPhoneForWhatsApp(phoneNumber);

  if (!formattedPhone) {
    console.error('Invalid phone number for WhatsApp');
    return;
  }

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

  window.open(whatsappUrl, '_blank');
}
