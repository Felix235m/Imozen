/**
 * WhatsApp utility functions for opening WhatsApp with pre-filled messages
 */

/**
 * Format phone number for WhatsApp by removing non-digit characters
 * and ensuring it has the correct international format
 */
export function formatPhoneForWhatsApp(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters
  return phone.replace(/\D/g, '');
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
