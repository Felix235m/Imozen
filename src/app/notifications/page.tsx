"use client";
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, UserPlus, FileText, BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const notifications = [
    {
        id: 1,
        icon: UserPlus,
        title: "New Lead Assigned",
        description: "You have a new lead: Sophia Carter.",
        time: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        read: false,
    },
    {
        id: 2,
        icon: FileText,
        title: "Contract Signed",
        description: "Congratulations! The contract for 123 Main St has been signed by Liam O'Connell.",
        time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
    },
    {
        id: 3,
        icon: BadgeCheck,
        title: "Task Completed",
        description: "You have completed the follow-up with Olivia Bennett.",
        time: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
    },
    {
        id: 4,
        icon: UserPlus,
        title: "New Lead Assigned",
        description: "You have a new lead: Noah Thompson.",
        time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        read: true,
    },
];

export default function NotificationsPage() {
    return (
        <div className="p-4 pb-20">
            <div className="space-y-4">
                {notifications.map(notification => (
                    <Card key={notification.id} className={notification.read ? 'bg-card' : 'bg-blue-50 border-blue-200'}>
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
