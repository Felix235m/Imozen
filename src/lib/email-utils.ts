/**
 * Email utility functions for opening default email client with pre-filled content
 */

/**
 * Generate email subject based on lead name and task context
 */
export function generateEmailSubject(leadName: string, taskType: string = 'Follow-up'): string {
  return `Follow-up: ${leadName}`;
}

/**
 * Open default email client with pre-filled subject and body
 * Uses mailto: protocol to open system default email client
 */
export function openEmail(email: string, subject: string, body: string): void {
  if (!email) {
    console.error('No email address provided');
    return;
  }

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);

  const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;

  window.location.href = mailtoUrl;
}
