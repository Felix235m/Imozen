/**
 * Draft Detection and Management Utility
 * Handles incomplete lead form detection and management
 */

export interface DraftInfo {
  exists: boolean;
  leadId?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  lastModified?: number;
  timeAgo?: string;
  preview?: string;
}

/**
 * Check if a draft lead form exists in sessionStorage
 */
export function checkForDraft(): DraftInfo {
  if (typeof window === 'undefined') {
    return { exists: false };
  }

  try {
    const leadFormData = sessionStorage.getItem('leadFormData');
    const leadId = sessionStorage.getItem('lead_id');

    if (!leadFormData || !leadId) {
      return { exists: false };
    }

    const data = JSON.parse(leadFormData);

    // Check if draft has at least some meaningful data
    const hasMeaningfulData =
      data.firstName ||
      data.lastName ||
      data.phoneNumber ||
      data.email;

    if (!hasMeaningfulData) {
      return { exists: false };
    }

    // Calculate time since last modification
    const lastModified = data._lastModified || Date.now();
    const timeAgo = getTimeAgo(lastModified);

    // Create preview string
    const preview = createDraftPreview(data);

    return {
      exists: true,
      leadId,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      lastModified,
      timeAgo,
      preview,
    };
  } catch (error) {
    console.error('Error checking for draft:', error);
    return { exists: false };
  }
}

/**
 * Clear draft data from sessionStorage
 */
export function clearDraft(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('leadFormData');
    sessionStorage.removeItem('lead_id');
    sessionStorage.removeItem('lead_creation_session_id');
  } catch (error) {
    console.error('Error clearing draft:', error);
  }
}

/**
 * Update draft timestamp to track when it was last modified
 */
export function updateDraftTimestamp(): void {
  if (typeof window === 'undefined') return;

  try {
    const leadFormData = sessionStorage.getItem('leadFormData');
    if (leadFormData) {
      const data = JSON.parse(leadFormData);
      data._lastModified = Date.now();
      sessionStorage.setItem('leadFormData', JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error updating draft timestamp:', error);
  }
}

/**
 * Create a human-readable preview of the draft
 */
function createDraftPreview(data: any): string {
  const parts: string[] = [];

  // Add name if available
  if (data.firstName || data.lastName) {
    const name = [data.firstName, data.lastName].filter(Boolean).join(' ');
    parts.push(name);
  }

  // Add phone if available
  if (data.phoneNumber) {
    // Handle both formatted and unformatted phone numbers
    let phone = data.phoneNumber;
    if (data.countryCode && !phone.includes(data.countryCode)) {
      phone = `(${data.countryCode}) ${phone}`;
    }
    // Truncate if too long
    if (phone.length > 20) {
      phone = phone.substring(0, 17) + '...';
    }
    parts.push(phone);
  }

  // Add email if available and no other info
  if (parts.length === 0 && data.email) {
    parts.push(data.email);
  }

  return parts.length > 0 ? parts.join(' - ') : 'Unnamed lead';
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  } else {
    return 'just now';
  }
}

/**
 * Check if draft is too old (older than 7 days)
 */
export function isDraftStale(draftInfo: DraftInfo): boolean {
  if (!draftInfo.exists || !draftInfo.lastModified) {
    return false;
  }

  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const age = Date.now() - draftInfo.lastModified;

  return age > sevenDaysInMs;
}
