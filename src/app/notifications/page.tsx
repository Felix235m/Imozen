"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useAppData';
import { NOTIFICATION_CONFIG } from '@/lib/notification-icons';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const router = useRouter();

    // Get notifications from localStorage
    const { notifications: notificationsFromStorage, updateNotifications } = useNotifications();

    // Handle notification click for retry actions
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
    };

    // Transform webhook notifications to component format
    const notifications = notificationsFromStorage.map(notif => {
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
            isClickable: notif.action_type === 'retry_create_lead',
            originalNotif: notif, // Keep original for click handler
        };
    });
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
                                    {!notification.read && <Badge className="bg-primary">New</Badge>}
                                </div>
                                <p className="text-sm text-gray-600">{notification.description}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(notification.time, { addSuffix: true })}
                                </p>
                                {notification.isClickable && (
                                    <p className="text-xs text-primary font-medium mt-2">
                                        Tap to retry
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
                    <h2 className="text-xl font-semibold text-gray-600">No Notifications Yet</h2>
                    <p className="text-gray-400 mt-1">We'll let you know when something important happens.</p>
                </div>
            )}
        </div>
    );
}
