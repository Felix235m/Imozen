"use client";
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useAppData';
import { getNotificationConfigSync, getNotificationConfigLazy } from '@/lib/notification-icons-lazy';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';

export default function NotificationsPage() {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [iconConfigs, setIconConfigs] = useState<Record<string, any>>({});
    const { t } = useLanguage();

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

    // PERFORMANCE FIX: Lazy load notification icons after initial render
    useEffect(() => {
        if (!isClient || notificationsFromStorage.length === 0) return;

        console.time('NotificationsPage-LoadIcons');
        console.log('🔍 [PERF] NotificationsPage: Starting lazy icon loading');

        // Get unique notification types
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

            setIconConfigs(configs);
            console.timeEnd('NotificationsPage-LoadIcons');
            console.log(`🔍 [PERF] NotificationsPage: Loaded ${Object.keys(configs).length} icon configs`);
        };

        // Use requestIdleCallback if available, otherwise setTimeout
        if (window.requestIdleCallback) {
            window.requestIdleCallback(loadIcons, { timeout: 1000 });
        } else {
            setTimeout(loadIcons, 100);
        }
    }, [isClient, notificationsFromStorage.length]);

    // PERFORMANCE FIX: Memoize notification validation function
    const isValidNotification = useCallback((notif: any) => {
        return notif && notif.id && notif.title && notif.message && notif.type;
    }, []);

    // Clean up invalid notifications on mount (client-side only)
    useEffect(() => {
        console.time('NotificationsPage-ClientHydration');
        console.log('🔍 [PERF] NotificationsPage: Starting client hydration');
        setIsClient(true);

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
            updateNotifications(validNotifications);
        }
        
        console.timeEnd('NotificationsPage-ClientHydration');
    }, [notificationsFromStorage.length, isValidNotification, updateNotifications]); // Only re-run when count changes

    // PERFORMANCE FIX: Memoize notification clickability check
    const isNotificationClickable = useCallback((notif: any) => {
        return notif.action_type === 'retry_create_lead' ||
               (notif.type === 'new_lead' && notif.lead_id) ||
               (notif.type === 'priority_changed' && notif.lead_id);
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
            // Check if notification has a retry action
            if (notif.action_type === 'retry_create_lead' && notif.action_data) {
                // Store failed form data in sessionStorage for retry
                sessionStorage.setItem('leadFormData', JSON.stringify(notif.action_data));
                sessionStorage.setItem('lead_id', crypto.randomUUID()); // Generate new UUID for retry

                // Mark notification as read
                markAsRead(notif.id);

                // Navigate to form
                router.push(notif.action_target || '/leads/new');
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
        });
    }, [markAsRead, router]);

    // PERFORMANCE FIX: Memoize notification transformation
    const notifications = useMemo(() => {
        if (!isClient) return [];
        
        console.time('NotificationsPage-Transform');
        console.log(`🔍 [PERF] NotificationsPage: Transforming ${notificationsFromStorage.length} notifications`);
        
        const transformed = notificationsFromStorage
            .filter(isValidNotification)
            .map(notif => {
                // PERFORMANCE FIX: Use lazy-loaded icon config if available, otherwise sync fallback
                const configLookupStart = performance.now();
                const config = iconConfigs[notif.type] || getNotificationConfigSync(notif.type);
                const configLookupTime = performance.now() - configLookupStart;
                
                if (configLookupTime > 1) {
                    console.warn(`🔍 [PERF] Slow config lookup for type "${notif.type}": ${configLookupTime.toFixed(2)}ms`);
                }

                // PERFORMANCE FIX: Cache timestamp parsing
                let parsedTime = new Date();
                if (notif.timestamp && !isNaN(new Date(notif.timestamp).getTime())) {
                    parsedTime = new Date(notif.timestamp);
                }

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
    }, [isClient, notificationsFromStorage, iconConfigs, isValidNotification, isNotificationClickable]);

    // Show loading state during initial client hydration
    if (!isClient) {
        return (
            <div className="p-4 pb-20">
                <div className="flex items-center justify-center h-96">
                    <div className="text-gray-400">{t.common.loadingNotifications}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-20">
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
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(notification.time, { addSuffix: true })}
                                </p>
                                {notification.isClickable && (
                                    <p className="text-xs text-primary font-medium mt-2">
                                        {notification.originalNotif.action_type === 'retry_create_lead'
                                            ? t.notifications.tapToRetry
                                            : 'View Lead Details'}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {notifications.length === 0 && (
                 <div className="flex flex-col items-center justify-center text-center h-96">
                    <Bell className="w-16 h-16 text-gray-300 mb-4" />
                    <h2 className="text-xl font-semibold text-gray-600">{t.notifications.noNotificationsTitle}</h2>
                    <p className="text-gray-400 mt-1">{t.notifications.noNotificationsDescription}</p>
                </div>
            )}
        </div>
    );
}
