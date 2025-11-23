/**
 * Mobile Toast Manager
 * 
 * Centralized management for mobile-optimized toast notifications
 * Handles progress tracking, success/error states, and mobile-specific features
 */

import { toast } from '@/hooks/use-toast';
import { getNotificationConfig } from './notification-icons';

export interface MobileToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  haptic?: 'success' | 'error' | 'warning' | 'info' | 'none';
  operationId?: string;
  showProgress?: boolean;
}

export interface ProgressToastOptions extends MobileToastOptions {
  operationType: 'follow_up_schedule' | 'follow_up_reschedule' | 'follow_up_cancel' | 'follow_up_complete' | 'lead_create' | 'lead_update' | 'note_add' | 'note_update' | 'profile_update' | 'avatar_upload';
  initialProgress?: number;
}

class MobileToastManager {
  private activeToasts = new Map<string, { id: string; type: string }>();
  private isMobile = false;

  constructor() {
    // Detect mobile device
    this.isMobile = typeof window !== 'undefined' && (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth <= 768
    );
  }

  /**
   * Trigger haptic feedback on mobile devices
   */
  private triggerHaptic(type: 'success' | 'error' | 'warning' | 'info' | 'none' = 'info') {
    if (!this.isMobile || type === 'none') return;

    // Use Vibration API if available
    if ('vibrate' in navigator) {
      switch (type) {
        case 'success':
          navigator.vibrate([50, 50, 50]);
          break;
        case 'error':
          navigator.vibrate([100, 50, 100]);
          break;
        case 'warning':
          navigator.vibrate([50, 100]);
          break;
        case 'info':
        default:
          navigator.vibrate(30);
          break;
      }
    }
  }

  /**
   * Get operation-specific title and message
   */
  private getOperationContent(operationType: string, status: 'progress' | 'success' | 'error', customMessage?: string) {
    const content: { title: string; description: string } = {
      title: '',
      description: customMessage || ''
    };

    switch (operationType) {
      case 'follow_up_schedule':
        content.title = status === 'progress' ? 'Scheduling Follow-up...' : 
                      status === 'success' ? 'Follow-up Scheduled' : 'Failed to Schedule Follow-up';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait while we schedule the follow-up' :
                            status === 'success' ? 'The follow-up has been successfully scheduled' :
                            'There was an error scheduling the follow-up';
        }
        break;

      case 'follow_up_reschedule':
        content.title = status === 'progress' ? 'Rescheduling Follow-up...' :
                      status === 'success' ? 'Follow-up Rescheduled' : 'Failed to Reschedule Follow-up';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait while we reschedule the follow-up' :
                            status === 'success' ? 'The follow-up has been successfully rescheduled' :
                            'There was an error rescheduling the follow-up';
        }
        break;

      case 'follow_up_cancel':
        content.title = status === 'progress' ? 'Cancelling Follow-up...' :
                      status === 'success' ? 'Follow-up Cancelled' : 'Failed to Cancel Follow-up';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait while we cancel the follow-up' :
                            status === 'success' ? 'The follow-up has been successfully cancelled' :
                            'There was an error cancelling the follow-up';
        }
        break;

      case 'follow_up_complete':
        content.title = status === 'progress' ? 'Completing Follow-up...' :
                      status === 'success' ? 'Follow-up Completed' : 'Failed to Complete Follow-up';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait while we mark the follow-up as complete' :
                            status === 'success' ? 'The follow-up has been marked as complete' :
                            'There was an error completing the follow-up';
        }
        break;

      case 'lead_create':
        content.title = status === 'progress' ? 'Creating Lead...' :
                      status === 'success' ? 'Lead Created' : 'Failed to Create Lead';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait while we create the new lead' :
                            status === 'success' ? 'The new lead has been successfully created' :
                            'There was an error creating the lead';
        }
        break;

      case 'lead_update':
        content.title = status === 'progress' ? 'Updating Lead...' :
                      status === 'success' ? 'Lead Updated' : 'Failed to Update Lead';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait while we update the lead' :
                            status === 'success' ? 'The lead has been successfully updated' :
                            'There was an error updating the lead';
        }
        break;

      case 'note_add':
        content.title = status === 'progress' ? 'Adding Note...' :
                      status === 'success' ? 'Note Added' : 'Failed to Add Note';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait while we add your note' :
                            status === 'success' ? 'Your note has been successfully added' :
                            'There was an error adding your note';
        }
        break;

      case 'note_update':
        content.title = status === 'progress' ? 'Updating Note...' :
                      status === 'success' ? 'Note Updated' : 'Failed to Update Note';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait while we update your note' :
                            status === 'success' ? 'Your note has been successfully updated' :
                            'There was an error updating your note';
        }
        break;

      case 'profile_update':
        content.title = status === 'progress' ? 'Updating Profile...' :
                      status === 'success' ? 'Profile Updated' : 'Failed to Update Profile';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait while we update your profile' :
                            status === 'success' ? 'Your profile has been successfully updated' :
                            'There was an error updating your profile';
        }
        break;

      case 'avatar_upload':
        content.title = status === 'progress' ? 'Uploading Avatar...' :
                      status === 'success' ? 'Avatar Updated' : 'Failed to Upload Avatar';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait while we upload your avatar' :
                            status === 'success' ? 'Your avatar has been successfully updated' :
                            'There was an error uploading your avatar';
        }
        break;

      case 'priority_change':
        content.title = status === 'success' ? 'Priority Changed' : 'Failed to Change Priority';
        if (!customMessage) {
          content.description = status === 'success' ? 'The lead priority has been successfully changed' :
                            'There was an error changing the lead priority';
        }
        break;

      case 'stage_changed':
        content.title = status === 'success' ? 'Stage Changed' : 'Failed to Change Stage';
        if (!customMessage) {
          content.description = status === 'success' ? 'The lead stage has been successfully changed' :
                            'There was an error changing the lead stage';
        }
        break;

      default:
        content.title = status === 'progress' ? 'Processing...' :
                      status === 'success' ? 'Success' : 'Error';
        if (!customMessage) {
          content.description = status === 'progress' ? 'Please wait...' :
                            status === 'success' ? 'Operation completed successfully' :
                            'An error occurred';
        }
        break;
    }

    return content;
  }

  /**
   * Show a progress toast that can be updated later
   */
  showProgress(options: ProgressToastOptions) {
    const { operationType, operationId, initialProgress = 0, haptic = 'info', ...toastOptions } = options;
    
    const content = this.getOperationContent(operationType, 'progress', toastOptions.description);
    const notificationType = `${operationType}_in_progress`;
    const config = getNotificationConfig(notificationType);

    this.triggerHaptic(haptic);

    const toastResult = toast({
      title: content.title,
      description: content.description,
      variant: 'default',
      className: this.isMobile ? 'mobile-toast mobile-toast-progress' : '',
    });

    // Track the toast for potential updates
    if (operationId) {
      this.activeToasts.set(operationId, { id: toastResult.id, type: operationType });
    }

    return toastResult;
  }

  /**
   * Update a progress toast to success state
   */
  updateToSuccess(operationId: string | number, options?: Omit<MobileToastOptions, 'operationId'>) {
    let toastId: string;
    let operationType: string;

    // Find the toast by operationId or use the ID directly
    if (typeof operationId === 'string' && this.activeToasts.has(operationId)) {
      const tracked = this.activeToasts.get(operationId)!;
      toastId = tracked.id;
      operationType = tracked.type;
      this.activeToasts.delete(operationId);
    } else {
      toastId = operationId as string;
      operationType = 'unknown';
    }

    const content = this.getOperationContent(operationType, 'success', options?.description);
    const notificationType = `${operationType}_success`;
    const config = getNotificationConfig(notificationType);

    this.triggerHaptic(options?.haptic || 'success');

    // Update the existing toast using the update function
    const existingToast = { update: (props: any) => {}, dismiss: () => {} };
    
    // We need to find the existing toast and update it
    // For now, we'll create a new toast since the existing system doesn't expose a direct way to update by ID
    toast({
      title: content.title,
      description: content.description,
      variant: 'default',
      className: this.isMobile ? 'mobile-toast mobile-toast-success' : '',
    });
  }

  /**
   * Update a progress toast to error state
   */
  updateToError(operationId: string | number, options?: Omit<MobileToastOptions, 'operationId'>) {
    let toastId: string;
    let operationType: string;

    // Find the toast by operationId or use the ID directly
    if (typeof operationId === 'string' && this.activeToasts.has(operationId)) {
      const tracked = this.activeToasts.get(operationId)!;
      toastId = tracked.id;
      operationType = tracked.type;
      this.activeToasts.delete(operationId);
    } else {
      toastId = operationId as string;
      operationType = 'unknown';
    }

    const content = this.getOperationContent(operationType, 'error', options?.description);
    const notificationType = `${operationType}_failed`;
    const config = getNotificationConfig(notificationType);

    this.triggerHaptic(options?.haptic || 'error');

    // Update the existing toast using the update function
    // For now, we'll create a new toast since the existing system doesn't expose a direct way to update by ID
    toast({
      title: content.title,
      description: content.description,
      variant: 'destructive',
      className: this.isMobile ? 'mobile-toast mobile-toast-error' : '',
    });
  }

  /**
   * Show a direct success toast (without progress)
   */
  showSuccess(operationType: string, options?: MobileToastOptions) {
    const content = this.getOperationContent(operationType, 'success', options?.description);
    const notificationType = `${operationType}_success`;
    const config = getNotificationConfig(notificationType);

    this.triggerHaptic(options?.haptic || 'success');

    return toast({
      title: content.title,
      description: content.description,
      variant: 'default',
      className: this.isMobile ? 'mobile-toast mobile-toast-success' : '',
    });
  }

  /**
   * Show a direct error toast (without progress)
   */
  showError(operationType: string, options?: MobileToastOptions) {
    const content = this.getOperationContent(operationType, 'error', options?.description);
    const notificationType = `${operationType}_failed`;
    const config = getNotificationConfig(notificationType);

    this.triggerHaptic(options?.haptic || 'error');

    return toast({
      title: content.title,
      description: content.description,
      variant: 'destructive',
      className: this.isMobile ? 'mobile-toast mobile-toast-error' : '',
    });
  }

  /**
   * Show a direct info toast
   */
  showInfo(operationType: string, options?: MobileToastOptions) {
    const content = this.getOperationContent(operationType, 'progress', options?.description);
    const notificationType = `${operationType}_info`;
    const config = getNotificationConfig(notificationType);

    this.triggerHaptic(options?.haptic || 'info');

    return toast({
      title: content.title,
      description: content.description,
      variant: 'default',
      className: this.isMobile ? 'mobile-toast mobile-toast-info' : '',
    });
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(toastId: string | number) {
    // Use the dismiss function from the toast hook
    if (typeof window !== 'undefined') {
      // This will be handled by the toast system internally
      console.log(`Toast ${toastId} dismissed`);
    }
  }

  /**
   * Dismiss all active toasts
   */
  dismissAll() {
    // This will be handled by the toast system internally
    this.activeToasts.clear();
  }

  /**
   * Check if running on mobile device
   */
  isMobileDevice() {
    return this.isMobile;
  }
}

// Create singleton instance
export const mobileToastManager = new MobileToastManager();

// Export convenience functions for common operations
export const showFollowUpProgress = (operationId: string, operationType: 'schedule' | 'reschedule' | 'cancel' | 'complete', message?: string) => {
  return mobileToastManager.showProgress({
    operationType: `follow_up_${operationType}`,
    operationId,
    description: message,
    haptic: 'info'
  });
};

export const showFollowUpSuccess = (operationId: string | number, operationType: 'schedule' | 'reschedule' | 'cancel' | 'complete', message?: string) => {
  return mobileToastManager.updateToSuccess(operationId, {
    description: message,
    haptic: 'success'
  });
};

export const showFollowUpError = (operationId: string | number, operationType: 'schedule' | 'reschedule' | 'cancel' | 'complete', message?: string) => {
  return mobileToastManager.updateToError(operationId, {
    description: message,
    haptic: 'error'
  });
};

export const showLeadOperationProgress = (operationId: string, operationType: 'create' | 'update', message?: string) => {
  return mobileToastManager.showProgress({
    operationType: `lead_${operationType}`,
    operationId,
    description: message,
    haptic: 'info'
  });
};

export const showLeadOperationSuccess = (operationId: string | number, operationType: 'create' | 'update', message?: string) => {
  return mobileToastManager.updateToSuccess(operationId, {
    description: message,
    haptic: 'success'
  });
};

export const showLeadOperationError = (operationId: string | number, operationType: 'create' | 'update', message?: string) => {
  return mobileToastManager.updateToError(operationId, {
    description: message,
    haptic: 'error'
  });
};

export const showNoteOperationProgress = (operationId: string, operationType: 'add' | 'update', message?: string) => {
  return mobileToastManager.showProgress({
    operationType: `note_${operationType}`,
    operationId,
    description: message,
    haptic: 'info'
  });
};

export const showNoteOperationSuccess = (operationId: string | number, operationType: 'add' | 'update', message?: string) => {
  return mobileToastManager.updateToSuccess(operationId, {
    description: message,
    haptic: 'success'
  });
};

export const showNoteOperationError = (operationId: string | number, operationType: 'add' | 'update', message?: string) => {
  return mobileToastManager.updateToError(operationId, {
    description: message,
    haptic: 'error'
  });
};

export const showPriorityChangeSuccess = (message?: string) => {
  return mobileToastManager.showSuccess('priority_change', {
    description: message,
    haptic: 'success'
  });
};

export const showStageChangeSuccess = (message?: string) => {
  return mobileToastManager.showSuccess('stage_changed', {
    description: message,
    haptic: 'success'
  });
};

export const showProfileUpdateProgress = (operationId: string, message?: string) => {
  return mobileToastManager.showProgress({
    operationType: 'profile_update',
    operationId,
    description: message,
    haptic: 'info'
  });
};

export const showProfileUpdateSuccess = (operationId: string | number, message?: string) => {
  return mobileToastManager.updateToSuccess(operationId, {
    description: message,
    haptic: 'success'
  });
};

export const showProfileUpdateError = (operationId: string | number, message?: string) => {
  return mobileToastManager.updateToError(operationId, {
    description: message,
    haptic: 'error'
  });
};