"use client";

import * as React from "react";
import { WifiOff, Wifi } from "lucide-react";
import { offlineDetector } from "@/lib/offline-detector";

/**
 * OfflineBanner - Shows a banner when the user is offline
 *
 * Features:
 * - Automatically shows/hides based on network status
 * - Smooth slide-in animation
 * - Fixed position at top of screen
 * - Shows reconnection message when back online
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = React.useState(false);
  const [showReconnected, setShowReconnected] = React.useState(false);

  React.useEffect(() => {
    // Subscribe to offline status changes
    const unsubscribe = offlineDetector.subscribe((offline) => {
      if (offline) {
        setIsOffline(true);
        setShowReconnected(false);
      } else {
        // If was offline and now online, show reconnected message
        if (isOffline) {
          setShowReconnected(true);
          setTimeout(() => {
            setShowReconnected(false);
          }, 3000);
        }
        setIsOffline(false);
      }
    });

    return unsubscribe;
  }, [isOffline]);

  if (!isOffline && !showReconnected) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isOffline || showReconnected ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {isOffline ? (
        <div className="bg-red-500 text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-5 w-5" />
            <span className="font-medium">
              You are currently offline. Please check your internet connection.
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-green-500 text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <Wifi className="h-5 w-5" />
            <span className="font-medium">
              You are back online!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
