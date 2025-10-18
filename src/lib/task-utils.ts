/**
 * Task utility functions for clipboard, formatting, etc.
 */

import { format, parse } from 'date-fns';

/**
 * Copy text to clipboard using modern Clipboard API
 * Returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format task date and time for display
 */
export function formatTaskDateTime(date: string, time: string): string {
  try {
    const dateObj = new Date(date);
    const formattedDate = format(dateObj, 'MMM d, yyyy');
    return `${formattedDate} at ${time}`;
  } catch (error) {
    return `${date} at ${time}`;
  }
}

/**
 * Combine date and time strings into ISO format
 */
export function combineDateAndTime(dateStr: string, timeStr: string): string {
  try {
    const date = new Date(dateStr);
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':');

    let hour = parseInt(hours);
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    date.setHours(hour, parseInt(minutes), 0, 0);
    return date.toISOString();
  } catch (error) {
    console.error('Error combining date and time:', error);
    return new Date().toISOString();
  }
}
