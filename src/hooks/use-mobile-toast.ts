"use client"

import { useCallback } from "react"
import { mobileToastManager } from "@/lib/mobile-toast-manager"
import { useToast } from "@/hooks/use-toast"

export function useMobileToast() {
  const { toast: regularToast } = useToast()

  // Detect if we're on mobile
  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768
  }, [])

  // Follow-up operations
  const showFollowUpProgress = useCallback((operationId: string, operationType: 'schedule' | 'reschedule' | 'cancel' | 'complete', message?: string) => {
    if (isMobile()) {
      return mobileToastManager.showProgress({
        operationType: `follow_up_${operationType}`,
        operationId,
        description: message,
        haptic: 'info'
      })
    } else {
      return regularToast({
        title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)}ing Follow-up...`,
        description: message || 'Please wait while we process your request',
      })
    }
  }, [isMobile, regularToast])

  const showFollowUpSuccess = useCallback((operationId: string | number, operationType: 'schedule' | 'reschedule' | 'cancel' | 'complete', message?: string) => {
    if (isMobile()) {
      return mobileToastManager.updateToSuccess(operationId, {
        description: message,
        haptic: 'success'
      })
    } else {
      return regularToast({
        title: `Follow-up ${operationType.charAt(0).toUpperCase() + operationType.slice(1)}d`,
        description: message || `The follow-up has been successfully ${operationType}d`,
      })
    }
  }, [isMobile, regularToast])

  const showFollowUpError = useCallback((operationId: string | number, operationType: 'schedule' | 'reschedule' | 'cancel' | 'complete', message?: string) => {
    if (isMobile()) {
      return mobileToastManager.updateToError(operationId, {
        description: message,
        haptic: 'error'
      })
    } else {
      return regularToast({
        title: `Failed to ${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Follow-up`,
        description: message || `There was an error ${operationType}ing the follow-up`,
        variant: "destructive",
      })
    }
  }, [isMobile, regularToast])

  // Lead operations
  const showLeadOperationProgress = useCallback((operationId: string, operationType: 'create' | 'update', message?: string) => {
    if (isMobile()) {
      return mobileToastManager.showProgress({
        operationType: `lead_${operationType}`,
        operationId,
        description: message,
        haptic: 'info'
      })
    } else {
      return regularToast({
        title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)}ing Lead...`,
        description: message || 'Please wait while we process your request',
      })
    }
  }, [isMobile, regularToast])

  const showLeadOperationSuccess = useCallback((operationId: string | number, operationType: 'create' | 'update', message?: string) => {
    if (isMobile()) {
      return mobileToastManager.updateToSuccess(operationId, {
        description: message,
        haptic: 'success'
      })
    } else {
      return regularToast({
        title: `Lead ${operationType.charAt(0).toUpperCase() + operationType.slice(1)}d`,
        description: message || `The lead has been successfully ${operationType}d`,
      })
    }
  }, [isMobile, regularToast])

  const showLeadOperationError = useCallback((operationId: string | number, operationType: 'create' | 'update', message?: string) => {
    if (isMobile()) {
      return mobileToastManager.updateToError(operationId, {
        description: message,
        haptic: 'error'
      })
    } else {
      return regularToast({
        title: `Failed to ${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Lead`,
        description: message || `There was an error ${operationType}ing the lead`,
        variant: "destructive",
      })
    }
  }, [isMobile, regularToast])

  // Note operations
  const showNoteOperationProgress = useCallback((operationId: string, operationType: 'add' | 'update', message?: string) => {
    if (isMobile()) {
      return mobileToastManager.showProgress({
        operationType: `note_${operationType}`,
        operationId,
        description: message,
        haptic: 'info'
      })
    } else {
      return regularToast({
        title: `${operationType.charAt(0).toUpperCase() + operationType.slice(1)}ing Note...`,
        description: message || 'Please wait while we process your request',
      })
    }
  }, [isMobile, regularToast])

  const showNoteOperationSuccess = useCallback((operationId: string | number, operationType: 'add' | 'update', message?: string) => {
    if (isMobile()) {
      return mobileToastManager.updateToSuccess(operationId, {
        description: message,
        haptic: 'success'
      })
    } else {
      return regularToast({
        title: `Note ${operationType.charAt(0).toUpperCase() + operationType.slice(1)}ed`,
        description: message || `Your note has been successfully ${operationType}ed`,
      })
    }
  }, [isMobile, regularToast])

  const showNoteOperationError = useCallback((operationId: string | number, operationType: 'add' | 'update', message?: string) => {
    if (isMobile()) {
      return mobileToastManager.updateToError(operationId, {
        description: message,
        haptic: 'error'
      })
    } else {
      return regularToast({
        title: `Failed to ${operationType.charAt(0).toUpperCase() + operationType.slice(1)} Note`,
        description: message || `There was an error ${operationType}ing your note`,
        variant: "destructive",
      })
    }
  }, [isMobile, regularToast])

  // Priority and stage changes
  const showPriorityChangeSuccess = useCallback((message?: string) => {
    if (isMobile()) {
      return mobileToastManager.showSuccess('priority_change', {
        description: message,
        haptic: 'success'
      })
    } else {
      return regularToast({
        title: 'Priority Changed',
        description: message || 'The lead priority has been successfully changed',
      })
    }
  }, [isMobile, regularToast])

  const showStageChangeSuccess = useCallback((message?: string) => {
    if (isMobile()) {
      return mobileToastManager.showSuccess('stage_changed', {
        description: message,
        haptic: 'success'
      })
    } else {
      return regularToast({
        title: 'Stage Changed',
        description: message || 'The lead stage has been successfully changed',
      })
    }
  }, [isMobile, regularToast])

  // Profile operations
  const showProfileUpdateProgress = useCallback((operationId: string, message?: string) => {
    if (isMobile()) {
      return mobileToastManager.showProgress({
        operationType: 'profile_update',
        operationId,
        description: message,
        haptic: 'info'
      })
    } else {
      return regularToast({
        title: 'Updating Profile...',
        description: message || 'Please wait while we update your profile',
      })
    }
  }, [isMobile, regularToast])

  const showProfileUpdateSuccess = useCallback((operationId: string | number, message?: string) => {
    if (isMobile()) {
      return mobileToastManager.updateToSuccess(operationId, {
        description: message,
        haptic: 'success'
      })
    } else {
      return regularToast({
        title: 'Profile Updated',
        description: message || 'Your profile has been successfully updated',
      })
    }
  }, [isMobile, regularToast])

  const showProfileUpdateError = useCallback((operationId: string | number, message?: string) => {
    if (isMobile()) {
      return mobileToastManager.updateToError(operationId, {
        description: message,
        haptic: 'error'
      })
    } else {
      return regularToast({
        title: 'Failed to Update Profile',
        description: message || 'There was an error updating your profile',
        variant: "destructive",
      })
    }
  }, [isMobile, regularToast])

  // Generic success/error/info
  const showSuccess = useCallback((title: string, description?: string) => {
    if (isMobile()) {
      return mobileToastManager.showSuccess('generic', {
        title,
        description,
        haptic: 'success'
      })
    } else {
      return regularToast({
        title,
        description,
      })
    }
  }, [isMobile, regularToast])

  const showError = useCallback((title: string, description?: string) => {
    if (isMobile()) {
      return mobileToastManager.showError('generic', {
        title,
        description,
        haptic: 'error'
      })
    } else {
      return regularToast({
        title,
        description,
        variant: "destructive",
      })
    }
  }, [isMobile, regularToast])

  const showInfo = useCallback((title: string, description?: string) => {
    if (isMobile()) {
      return mobileToastManager.showInfo('generic', {
        title,
        description,
        haptic: 'info'
      })
    } else {
      return regularToast({
        title,
        description,
      })
    }
  }, [isMobile, regularToast])

  return {
    // Mobile detection
    isMobile: isMobile(),
    
    // Follow-up operations
    showFollowUpProgress,
    showFollowUpSuccess,
    showFollowUpError,
    
    // Lead operations
    showLeadOperationProgress,
    showLeadOperationSuccess,
    showLeadOperationError,
    
    // Note operations
    showNoteOperationProgress,
    showNoteOperationSuccess,
    showNoteOperationError,
    
    // Priority and stage changes
    showPriorityChangeSuccess,
    showStageChangeSuccess,
    
    // Profile operations
    showProfileUpdateProgress,
    showProfileUpdateSuccess,
    showProfileUpdateError,
    
    // Generic operations
    showSuccess,
    showError,
    showInfo,
  }
}