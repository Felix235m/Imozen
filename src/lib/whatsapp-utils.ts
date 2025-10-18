/**
 * WhatsApp utility functions for opening WhatsApp with pre-filled messages
 */

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
