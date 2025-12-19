import React from "react";
import { Badge } from "@/components/ui/badge";
import { LeadTypeBadge } from "@/components/leads/lead-badges";
import { cn } from "@/lib/utils";
import { getLazyIcon } from "@/components/icons/lucide-icons-lazy";
import { LazyIconWrapper } from "@/components/ui/lazy-icon-wrapper";

// Dynamic icon mapping using lazy imports
const createIconMap = () => {
  const iconMap: { [key: string]: React.ElementType } = {
    email: getLazyIcon('email'),
    phone: getLazyIcon('phone'),
    calendar: getLazyIcon('calendar'),
    home: getLazyIcon('home'),
    whatsapp: getLazyIcon('whatsapp'),
    briefcase: getLazyIcon('briefcase'),
    default: getLazyIcon('default'),
  };
  return iconMap;
};

interface TaskItem {
  id: string;
  name: string;
  description: string;
  type: "email" | "phone" | "whatsapp" | "calendar" | "home" | "briefcase";
  leadType?: 'Buyer' | 'Seller';
  leadStatus: string;
  leadPriority: "Hot" | "Warm" | "Cold";
  leadContact?: {
    email: string;
    phone: string;
  };
  propertyRequirements?: {
    locations?: string[];
    types?: string[];
    budget?: string;
  } | string;
}

interface TaskCardHeaderProps {
  task: TaskItem;
  isExpanded: boolean;
  leadType: 'Buyer' | 'Seller';
  leadPriority: 'Hot' | 'Warm' | 'Cold';
  getPriorityTranslation: (priority: string) => string;
  getStageTranslation: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  isHydrated: boolean;
}

export function TaskCardHeader({
  task,
  isExpanded,
  leadType,
  leadPriority,
  getPriorityTranslation,
  getStageTranslation,
  getPriorityColor,
  isHydrated
}: TaskCardHeaderProps) {
  const iconMap = createIconMap();
  const Icon = iconMap[task.type] || iconMap.default;

  return (
    <div className="flex items-start gap-3">
      <div className="bg-blue-100 p-3 rounded-full flex-shrink-0">
        <LazyIconWrapper>
          <Icon className="h-6 w-6 text-blue-600" />
        </LazyIconWrapper>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-semibold text-gray-800 mb-1">
          {task.name}
        </h4>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <LeadTypeBadge leadType={leadType} />
          <Badge variant="outline" className={cn("text-sm", getPriorityColor(leadPriority))}>
            {getPriorityTranslation(leadPriority)}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {getStageTranslation(task.leadStatus)}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {task.description}
        </p>
      </div>

      {isExpanded ? (
        <LazyIconWrapper>
          {getLazyIcon('chevron-up')({ className: "h-5 w-5 text-gray-400 flex-shrink-0" })}
        </LazyIconWrapper>
      ) : (
        <LazyIconWrapper>
          {getLazyIcon('chevron-down')({ className: "h-5 w-5 text-gray-400 flex-shrink-0" })}
        </LazyIconWrapper>
      )}
    </div>
  );
}