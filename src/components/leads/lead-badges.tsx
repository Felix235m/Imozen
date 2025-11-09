/**
 * Reusable badge components for displaying lead information
 * - LeadTypeBadge: Green (Buyer) / Purple (Seller)
 * - TemperatureBadge: Red (Hot) / Orange (Warm) / Blue (Cold)
 * - StageBadge: Gray badge for lead stage
 */

import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface LeadTypeBadgeProps {
  leadType?: 'Buyer' | 'Seller';
  className?: string;
}

export function LeadTypeBadge({ leadType = 'Buyer', className }: LeadTypeBadgeProps) {
  const { t } = useLanguage();
  const isBuyer = leadType === 'Buyer';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        isBuyer
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        className
      )}
    >
      {leadType === 'Buyer' ? t.leads.buyer : t.leads.seller}
    </span>
  );
}

interface TemperatureBadgeProps {
  temperature: 'Hot' | 'Warm' | 'Cold' | string;
  className?: string;
}

export function TemperatureBadge({ temperature, className }: TemperatureBadgeProps) {
  const colorClasses = {
    Hot: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    Warm: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    Cold: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        colorClasses[temperature as keyof typeof colorClasses] || colorClasses.Cold,
        className
      )}
    >
      {temperature}
    </span>
  );
}

interface StageBadgeProps {
  stage: string;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        className
      )}
    >
      {stage}
    </span>
  );
}

interface LeadBadgeGroupProps {
  leadType?: 'Buyer' | 'Seller';
  temperature?: 'Hot' | 'Warm' | 'Cold' | string;
  stage?: string;
  className?: string;
  showLeadType?: boolean;
  showTemperature?: boolean;
  showStage?: boolean;
}

/**
 * Combined badge group with proper ordering:
 * Lead Type → Temperature → Stage
 */
export function LeadBadgeGroup({
  leadType = 'Buyer',
  temperature,
  stage,
  className,
  showLeadType = true,
  showTemperature = true,
  showStage = true,
}: LeadBadgeGroupProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {showLeadType && leadType && <LeadTypeBadge leadType={leadType} />}
      {showTemperature && temperature && <TemperatureBadge temperature={temperature} />}
      {showStage && stage && <StageBadge stage={stage} />}
    </div>
  );
}
