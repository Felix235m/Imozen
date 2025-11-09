"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useAppData';
import { NOTIFICATION_CONFIG } from '@/lib/notification-icons';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/hooks/useLanguage';

export default function NotificationsPage() {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const { t } = useLanguage();

    // Get notifications from localStorage
    const { notifications: notificationsFromStorage, updateNotifications } = useNotifications();

    // Clean up invalid notifications on mount (client-side only)
    useEffect(() => {
        setIsClient(true);

        // Filter out invalid notifications
        const validNotifications = notificationsFromStorage.filter(notif =>
            notif &&
            notif.id &&
            notif.title &&
            notif.message &&
            notif.type
        );

        // Clean up localStorage if invalid notifications were found
        if (validNotifications.length !== notificationsFromStorage.length) {
            console.warn(`Removing ${notificationsFromStorage.length - validNotifications.length} invalid notifications`);
            updateNotifications(validNotifications);
        }
    }, [notificationsFromStorage.length]); // Only re-run when count changes

    // Handle notification click for retry actions and navigation
    const handleNotificationClick = (notif: any) => {
        // Check if notification has a retry action
        if (notif.action_type === 'retry_create_lead' && notif.action_data) {
            // Store failed form data in sessionStorage for retry
            sessionStorage.setItem('leadFormData', JSON.stringify(notif.action_data));
            sessionStorage.setItem('lead_id', crypto.randomUUID()); // Generate new UUID for retry

            // Mark notification as read
            const updatedNotifications = notificationsFromStorage.map(n =>
                n.id === notif.id ? { ...n, read: true } : n
            );
            updateNotifications(updatedNotifications);

            // Navigate to form
            router.push(notif.action_target || '/leads/new');
        }
        // Check if notification is for a new lead creation
        else if (notif.type === 'new_lead' && notif.lead_id) {
            // Mark notification as read
            const updatedNotifications = notificationsFromStorage.map(n =>
                n.id === notif.id ? { ...n, read: true } : n
            );
            updateNotifications(updatedNotifications);

            // Navigate to lead detail page
            router.push(`/leads/${notif.lead_id}`);
        }
    };

    // Filter and transform notifications (client-side only to avoid hydration issues)
    const notifications = !isClient ? [] : notificationsFromStorage
        .filter(notif =>
            notif &&
            notif.id &&
            notif.title &&
            notif.message &&
            notif.type
        )
        .map(notif => {
        const config = NOTIFICATION_CONFIG[notif.type] || { icon: Bell, color: 'text-gray-600', bgColor: 'bg-gray-50' };

        return {
            id: notif.id,
            icon: config.icon,
            title: notif.title || 'Notification',
            description: notif.message || '',
            time: notif.timestamp && !isNaN(new Date(notif.timestamp).getTime())
                ? new Date(notif.timestamp)
                : new Date(),
            read: notif.read || false,
            isClickable: notif.action_type === 'retry_create_lead' || (notif.type === 'new_lead' && notif.lead_id),
            originalNotif: notif, // Keep original for click handler
        };
    });

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
                                            : t.notifications.tapToView}
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
