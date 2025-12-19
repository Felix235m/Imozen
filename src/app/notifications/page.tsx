"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useNotifications } from '@/hooks/useAppData';
import { getNotificationConfigSync, getNotificationConfigLazy } from '@/lib/notification-icons-lazy';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [iconConfigs, setIconConfigs] = useState<Record<string, any>>({});
    const { t } = useLanguage();
    const { toast } = useToast();

    // PERFORMANCE LOG: Track when component starts mounting
    React.useEffect(() => {
        console.time('NotificationsPage-Mount');
        console.log('🔍 [PERF] NotificationsPage: Starting mount');
        return () => {
            console.timeEnd('NotificationsPage-Mount');
        };
    }, []);

    // Get notifications from localStorage
    const { notifications: notificationsFromStorage, updateNotifications } = useNotifications();

    // REAL-TIME UPDATES: Listen for storage changes to trigger immediate re-renders
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'app_data' && event.newValue) {
                try {
                    const data = JSON.parse(event.newValue);
                    if (data.notifications) {
                        // Force re-render by updating a state trigger
                        unstable_batchedUpdates(() => {
                            // This will trigger the notifications hook to update
                            console.log('🔍 [STORAGE] Notifications updated via storage event');
                        });
                    }
                } catch (error) {
                    console.error('Failed to parse storage event data:', error);
                }
            }
        };

        // Listen for storage events
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // PERFORMANCE FIX: Lazy load notification icons after initial render
    useEffect(() => {
        if (notificationsFromStorage.length === 0) return;

        console.time('NotificationsPage-LoadIcons');
        console.log('🔍 [PERF] NotificationsPage: Starting lazy icon loading');

        // Get unique notification types - memoize to prevent unnecessary recalculations
        const uniqueTypes = [...new Set(notificationsFromStorage.map(n => n.type).filter(Boolean))];
        console.log(`🔍 [PERF] NotificationsPage: Found ${uniqueTypes.length} unique notification types`);

        // Load icons for each type
        const loadIcons = async () => {
            const configs: Record<string, any> = {};

            for (const type of uniqueTypes) {
                try {
                    configs[type] = await getNotificationConfigLazy(type);
                } catch (error) {
                    console.warn(`Failed to load icon for type "${type}":`, error);
                    configs[type] = getNotificationConfigSync(type);
                }
            }

            unstable_batchedUpdates(() => {
                setIconConfigs(configs);
            });
            console.timeEnd('NotificationsPage-LoadIcons');
            console.log(`🔍 [PERF] NotificationsPage: Loaded ${Object.keys(configs).length} icon configs`);
        };

        // Use requestIdleCallback if available, otherwise setTimeout
        if (window.requestIdleCallback) {
            window.requestIdleCallback(loadIcons, { timeout: 1000 });
        } else {
            setTimeout(loadIcons, 100);
        }
    }, [notificationsFromStorage]); // Use full array reference instead of length

    // PERFORMANCE FIX: Memoize notification validation function
    const isValidNotification = useCallback((notif: any) => {
        return notif && notif.id && notif.title && notif.message && notif.type;
    }, []);

    // Clean up invalid notifications on mount (client-side only)
    useEffect(() => {
        console.time('NotificationsPage-ClientHydration');
        console.log('🔍 [PERF] NotificationsPage: Starting client hydration');

        // Only set isClient to true once, don't toggle it back
        if (!isClient) {
            unstable_batchedUpdates(() => {
                setIsClient(true);
            });
        }

        // PERFORMANCE LOG: Track notification filtering
        console.time('NotificationsPage-FilterInvalid');
        console.log(`🔍 [PERF] NotificationsPage: Filtering ${notificationsFromStorage.length} notifications`);

        // Filter out invalid notifications
        const validNotifications = notificationsFromStorage.filter(isValidNotification);

        console.timeEnd('NotificationsPage-FilterInvalid');
        console.log(`🔍 [PERF] NotificationsPage: Filtered to ${validNotifications.length} valid notifications`);

        // Clean up localStorage if invalid notifications were found
        if (validNotifications.length !== notificationsFromStorage.length) {
            console.warn(`Removing ${notificationsFromStorage.length - validNotifications.length} invalid notifications`);
            unstable_batchedUpdates(() => {
                updateNotifications(validNotifications);
            });
        }

        console.timeEnd('NotificationsPage-ClientHydration');
    }, [notificationsFromStorage, isValidNotification, updateNotifications, isClient]); // Use full array and stable dependencies

    // PERFORMANCE FIX: Memoize notification clickability check
    const isNotificationClickable = useCallback((notif: any) => {
        // Cancellation notifications - only failed ones are clickable for retry
        if (notif.type === 'follow_up_cancellation_failed' && notif.action_type === 'retry_task_cancellation') {
            return true; // Only show retry for failed cancellations
        }

        // Successful and processing cancellation notifications are NOT clickable
        if (notif.type === 'follow_up_cancelled' ||
            notif.type === 'follow_up_cancellation_in_progress') {
            return false; // No buttons for successful/processing cancellations
        }

        // Other retry actions (non-cancellation)
        if (notif.action_type === 'retry_create_lead' ||
            notif.action_type === 'retry_follow_up') {
            return true;
        }

        // Navigation actions (successful operations)
        if (notif.action_type === 'navigate_to_follow_ups' ||
            notif.action_type === 'navigate_to_lead' ||
            notif.action_type === 'navigate_to_task') {
            return true;
        }

        // Notification type-based clickability (general notifications)
        return (notif.type === 'new_lead' && notif.lead_id) ||
               (notif.type === 'priority_changed' && notif.lead_id) ||
               (notif.type === 'stage_changed' && notif.lead_id) ||
               (notif.type === 'follow_up_scheduled' && notif.lead_id) ||
               (notif.type === 'follow_up_rescheduled' && notif.lead_id);
    }, []);

    // PERFORMANCE FIX: Memoize mark as read function
    const markAsRead = useCallback((notifId: string) => {
        const updatedNotifications = notificationsFromStorage.map(n =>
            n.id === notifId ? { ...n, read: true } : n
        );
        updateNotifications(updatedNotifications);
    }, [notificationsFromStorage, updateNotifications]);

    // Handle notification click for retry actions and navigation
    const handleNotificationClick = useCallback((notif: any) => {
        // Use requestAnimationFrame for smoother navigation
        requestAnimationFrame(() => {
            // Check if notification has a retry action for lead creation
            if (notif.action_type === 'retry_create_lead' && notif.action_data) {
                // Store failed form data in sessionStorage for retry
                sessionStorage.setItem('leadFormData', JSON.stringify(notif.action_data));

                // Use the stored lead_id from action_data, or generate new if not present (backward compatibility)
                const leadIdToUse = notif.action_data.lead_id || crypto.randomUUID();
                sessionStorage.setItem('lead_id', leadIdToUse);

                // Mark notification as read
                markAsRead(notif.id);

                // Navigate to form
                router.push(notif.action_target || '/leads/new');
            }
            // Check if notification has a retry action for follow-up scheduling
            else if (notif.action_type === 'retry_follow_up' && notif.action_data) {
                // Retry the follow-up scheduling
                retryFollowUpSchedule(notif.action_data);

                // Mark notification as read
                markAsRead(notif.id);
            }
            else if (notif.action_type === 'retry_task_cancellation' && notif.action_data) {
                // Retry the task cancellation
                retryTaskCancellation(notif.action_data);

                // Mark notification as read
                markAsRead(notif.id);
            }
            // Check if notification should navigate to follow-ups section
            else if (notif.action_type === 'navigate_to_follow_ups') {
                // Mark notification as read
                markAsRead(notif.id);

                // Navigate to follow-ups section with expanded view
                router.push(notif.action_target || '/leads?filter=upcoming');
            }
            // Check if notification should navigate to lead detail
            else if (notif.action_type === 'navigate_to_lead') {
                // Mark notification as read
                markAsRead(notif.id);

                // Navigate to lead detail page
                router.push(notif.action_target || `/leads/${notif.lead_id}`);
            }
            // Check if notification is for a new lead creation
            else if (notif.type === 'new_lead' && notif.lead_id) {
                // Mark notification as read
                markAsRead(notif.id);

                // Navigate to lead detail page
                router.push(`/leads/${notif.lead_id}`);
            }
            // Check if notification is for priority change
            else if (notif.type === 'priority_changed' && notif.lead_id) {
                // Mark notification as read
                markAsRead(notif.id);

                // Navigate to lead detail page
                router.push(notif.action_target || `/leads/${notif.lead_id}`);
            }
            // Check if notification is for stage change
            else if (notif.type === 'stage_changed' && notif.lead_id) {
                // Mark notification as read
                markAsRead(notif.id);

                // Navigate to lead detail page
                router.push(notif.action_target || `/leads/${notif.lead_id}`);
            }
            // Check if notification is for follow-up scheduled (fallback)
            else if (notif.type === 'follow_up_scheduled' && notif.lead_id) {
                // Mark notification as read
                markAsRead(notif.id);

                // Check if follow-up is within 7 days using action_data
                if (notif.action_data && notif.action_data.followUpDate) {
                    const followUpDate = new Date(notif.action_data.followUpDate);
                    const sevenDaysFromNow = new Date();
                    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
                    
                    if (followUpDate <= sevenDaysFromNow) {
                        // Navigate to follow-ups section
                        router.push('/leads?filter=upcoming');
                    } else {
                        // Navigate to lead detail page
                        router.push(`/leads/${notif.lead_id}`);
                    }
                } else {
                    // Fallback to lead detail page
                    router.push(`/leads/${notif.lead_id}`);
                }
            }
            // Check if notification should navigate to a specific task
            else if (notif.action_type === 'navigate_to_task') {
                // Mark notification as read
                markAsRead(notif.id);

                // Navigate to tasks page with specific task expansion
                router.push(notif.action_target || '/tasks');
            }
        });
    }, [markAsRead, router]);

    // Retry follow-up scheduling function
    const retryFollowUpSchedule = async (requestData: any) => {
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('sessionToken');
            if (!token) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No authentication token found'
                });
                return;
            }

            const webhookUrl = 'https://eurekagathr.app.n8n.cloud/webhook/task-operation';
            
            // Store request data again for potential retry
            localStorage.setItem('pending_follow_up', JSON.stringify({
                ...requestData,
                timestamp: Date.now()
            }));

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    lead_id: requestData.lead_id,
                    task_id: requestData.task_id,
                    operation: 'schedule_task',
                    follow_up_date: requestData.follow_up_date,
                    ...(requestData.note && { note: requestData.note })
                })
            });

            if (!response.ok) {
                if (response.status >= 500) {
                    throw new Error('Server error occurred. Please try again later.');
                }
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to schedule follow-up');
            }

            // Process successful response
            const responseData = await response.json();
            const data = Array.isArray(responseData) ? responseData[0] : responseData;
            
            if (data.success) {
                // Clear pending request data
                localStorage.removeItem('pending_follow_up');
                
                // Show success toast
                toast({
                    title: 'Follow-up Scheduled Successfully',
                    description: `Follow-up for ${requestData.lead_name} has been scheduled`,
                });

                // Refresh the page data
                window.location.reload();
            } else {
                throw new Error(data.message || 'Failed to schedule follow-up');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Retry Failed',
                description: error.message || 'Failed to retry follow-up scheduling'
            });
        }
    };

    // Retry task cancellation function
    const retryTaskCancellation = async (requestData: any) => {
        try {
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('sessionToken');
            if (!token) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No authentication token found'
                });
                return;
            }

            const webhookUrl = 'https://eurekagathr.app.n8n.cloud/webhook/task-operation';

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    task_id: requestData.taskId,
                    lead_id: requestData.leadId,
                    operation: 'cancel_task',
                    note: requestData.note,
                    ...(requestData.nextFollowUpDate && { follow_up_date: requestData.nextFollowUpDate })
                })
            });

            if (!response.ok) {
                if (response.status >= 500) {
                    throw new Error('Server error occurred. Please try again later.');
                }
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to cancel follow-up');
            }

            // Process successful response
            const responseData = await response.json();
            const data = Array.isArray(responseData) ? responseData[0] : responseData;

            if (data.success) {
                // Clear pending cancellation data
                localStorage.removeItem('pending_cancellation');

                // Show success toast
                toast({
                    title: 'Follow-up Cancelled Successfully',
                    description: `Follow-up has been cancelled successfully`,
                });

                // Refresh the page data
                window.location.reload();
            } else {
                throw new Error(data.message || 'Failed to cancel follow-up');
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Retry Failed',
                description: error.message || 'Failed to retry follow-up cancellation'
            });
        }
    };

    // HYDRATION FIX: Get safe locale for date formatting
    const dateLocale = useMemo(() => {
        // Use consistent locale for both server and client
        return t.language === 'pt' ? ptBR : enUS;
    }, [t.language]);

    // HYDRATION FIX: Safe time parsing that uses device time when needed
    const getSafeTime = useCallback((timestamp: string | undefined) => {
        // Always use timestamp if valid
        if (timestamp && !isNaN(new Date(timestamp).getTime())) {
            return new Date(timestamp);
        }
        // For invalid timestamps, use current device time but ensure consistency
        return new Date();
    }, []);

    // HYDRATION FIX: Safe distance formatting that doesn't change between renders
    const getSafeTimeDisplay = useCallback((time: Date) => {
        // For SSR, always return static text to prevent hydration mismatch
        if (typeof window === 'undefined') {
            return 'Recently';
        }
        // Only use dynamic formatting on client
        return formatDistanceToNow(time, { addSuffix: true, locale: dateLocale });
    }, [dateLocale]);

    // PERFORMANCE FIX: Memoize notification transformation
    const notifications = useMemo(() => {
        console.time('NotificationsPage-Transform');
        console.log(`🔍 [PERF] NotificationsPage: Transforming ${notificationsFromStorage.length} notifications`);

        // Always run the same transformation to prevent hydration mismatch
        const transformed = notificationsFromStorage
            .filter(isValidNotification)
            .map(notif => {
                // PERFORMANCE FIX: Use lazy-loaded icon config if available, otherwise sync fallback
                const config = iconConfigs[notif.type] || getNotificationConfigSync(notif.type);

                // HYDRATION FIX: Use safe time parsing that doesn't depend on current date
                const parsedTime = getSafeTime(notif.timestamp);

                return {
                    id: notif.id,
                    icon: config.icon,
                    title: notif.title || 'Notification',
                    description: notif.message || '',
                    time: parsedTime,
                    read: notif.read || false,
                    isClickable: isNotificationClickable(notif),
                    originalNotif: notif, // Keep original for click handler
                };
            });

        console.timeEnd('NotificationsPage-Transform');
        console.log(`🔍 [PERF] NotificationsPage: Transformed to ${transformed.length} notifications`);
        return transformed;
    }, [notificationsFromStorage, iconConfigs, isValidNotification, isNotificationClickable, getSafeTime]);

    // Mark all notifications as read - MOVED BEFORE CONDITIONAL RETURN TO FIX HOOKS ORDER
    const markAllAsRead = useCallback(() => {
        // Only run on client-side
        if (typeof window === 'undefined') return;

        const updatedNotifications = notificationsFromStorage.map(n => ({ ...n, read: true }));
        updateNotifications(updatedNotifications);

        toast({
            title: 'All Notifications Read',
            description: 'All notifications have been marked as read',
        });
    }, [notificationsFromStorage, updateNotifications]);

    return (
        <div className="p-4 pb-20">
            {/* Header with Mark All as Read button */}
            {notificationsFromStorage.length > 0 && (
                <div className="flex justify-end mb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-sm"
                    >
                        Mark All as Read
                    </Button>
                </div>
            )}

            {/* Always render consistent structure - use conditional content instead of conditional rendering */}
            <div className="space-y-4">
                {notifications.map(notification => (
                    <Card
                        key={notification.id}
                        className={`${notification.read ? 'bg-card' : 'bg-blue-50 border-blue-200'} ${notification.isClickable ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                        onClick={() => notification.isClickable && handleNotificationClick(notification.originalNotif)}
                    >
                        <CardContent className="flex items-start gap-4 p-4">
                            <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${notification.read ? 'bg-gray-100' : 'bg-primary/20'}`}>
                                <notification.icon className={`h-5 w-5 ${notification.read ? 'text-gray-500' : 'text-primary'}`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{notification.title}</h3>
                                    {!notification.read && <Badge className="bg-primary">{t.common.new}</Badge>}
                                </div>
                                <p className="text-sm text-gray-600">{notification.description}</p>
                                {/* HYDRATION FIX: Use safe time display that's consistent */}
                                <p className="text-xs text-gray-400 mt-1">
                                    {getSafeTimeDisplay(notification.time)}
                                </p>
                                {notification.isClickable && (
                                    <p className="text-xs text-primary font-medium mt-2">
                                        {notification.originalNotif.action_type === 'retry_create_lead'
                                            ? t.notifications.tapToRetry
                                            : notification.originalNotif.action_type === 'retry_follow_up'
                                            ? 'Tap to Retry Follow-up'
                                            : notification.originalNotif.action_type === 'navigate_to_follow_ups'
                                            ? t.notifications.viewFollowUps
                                            : notification.originalNotif.action_type === 'navigate_to_lead'
                                            ? t.notifications.viewLeadDetails
                                            : notification.originalNotif.action_type === 'navigate_to_task'
                                            ? t.notifications.viewTask
                                            : notification.originalNotif.type === 'follow_up_scheduled'
                                            ? t.notifications.viewFollowUp
                                            : notification.originalNotif.type === 'follow_up_rescheduled'
                                            ? t.notifications.viewRescheduledFollowUp
                                            : notification.originalNotif.type === 'follow_up_cancellation_failed'
                                            ? t.notifications.tapToRetryCancellation
                                            : t.notifications.tapToView}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty state - always render but conditionally display */}
            <div className={`flex flex-col items-center justify-center text-center h-96 ${notifications.length === 0 ? '' : 'hidden'}`}>
                <Bell className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-600">{t.notifications.noNotificationsTitle}</h2>
                <p className="text-gray-400 mt-1">{t.notifications.noNotificationsDescription}</p>
            </div>
        </div>
    );

}
