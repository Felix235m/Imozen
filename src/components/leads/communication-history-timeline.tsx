"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getEventConfig, getCurrentAgentLanguage } from '@/lib/communication-history-utils';
import { cn } from '@/lib/utils';

export interface CommunicationEvent {
  id: string;
  event_type: string;
  timestamp: number | string;
  title?: string;
  description?: string;
  performed_by?: string | { agent_id: string; agent_name: string };
  metadata?: any;
}

interface CommunicationHistoryTimelineProps {
  events: CommunicationEvent[];
  className?: string;
}

export function CommunicationHistoryTimeline({
  events,
  className,
}: CommunicationHistoryTimelineProps) {
  // Get agent's language preference
  const agentLanguage = React.useMemo(() => getCurrentAgentLanguage(), []);

  // Sort events by timestamp (newest first)
  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
      const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
      const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }, [events]);

  if (sortedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No communication history available</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {sortedEvents.map((event, index) => {
        const config = getEventConfig(event.event_type, agentLanguage);
        const Icon = config.icon;
        const isLast = index === sortedEvents.length - 1;

        // Format timestamp with locale
        let formattedDate = 'Date not available';
        try {
          const timestamp = typeof event.timestamp === 'number'
            ? event.timestamp
            : new Date(event.timestamp).getTime();

          if (!isNaN(timestamp)) {
            const date = new Date(timestamp);
            const locale = agentLanguage === 'pt' ? ptBR : undefined;
            const formatStr = agentLanguage === 'pt' ? 'd MMM yyyy - HH:mm' : 'MMM d, yyyy - h:mm a';
            formattedDate = format(date, formatStr, { locale });
          }
        } catch (error) {
          console.error('Error formatting date:', error);
        }

        return (
          <div key={event.id} className="flex gap-3 pb-4 last:pb-0">
            {/* Icon and timeline line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "rounded-full h-9 w-9 flex items-center justify-center shrink-0",
                  config.bgColor
                )}
              >
                <Icon className={cn("h-4 w-4", config.iconColor)} />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-border mt-1.5 min-h-[30px]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-0.5">
              <h3 className="font-semibold text-sm text-foreground">
                {event.title || config.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formattedDate}
              </p>
              {event.description && event.event_type !== 'lead_created' && (
                <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">
                  {event.description}
                </p>
              )}
              {event.performed_by && event.event_type !== 'lead_created' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  by {typeof event.performed_by === 'string'
                    ? event.performed_by
                    : event.performed_by.agent_name || 'Agent'}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}