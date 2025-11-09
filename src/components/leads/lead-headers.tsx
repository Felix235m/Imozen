/**
 * Mobile-optimized header components for dialogs and sheets
 * - CompactLeadHeader: 60px height for space-constrained dialogs
 * - BalancedLeadHeader: 80px height for standard dialogs
 * - FullLeadHeader: 100px height for sheets with more space
 */

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LeadBadgeGroup } from './lead-badges';
import { cn } from '@/lib/utils';

interface CompactLeadHeaderProps {
  name: string;
  imageUrl?: string;
  leadType?: 'Buyer' | 'Seller';
  temperature?: 'Hot' | 'Warm' | 'Cold' | string;
  stage?: string;
  className?: string;
}

/**
 * Compact header: 60px height
 * - Avatar: 40px
 * - Single row layout: Name + Badges inline
 * - Smaller text sizes
 * Use for: Schedule Follow-up dialog, other space-constrained dialogs
 */
export function CompactLeadHeader({
  name,
  imageUrl,
  leadType = 'Buyer',
  temperature,
  stage,
  className,
}: CompactLeadHeaderProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn('flex items-center gap-3 min-h-[60px] py-2', className)}>
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={imageUrl} alt={name} />
        <AvatarFallback className="text-sm">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
        <h3 className="font-semibold text-base truncate">{name}</h3>
        <LeadBadgeGroup
          leadType={leadType}
          temperature={temperature}
          stage={stage}
          className="flex-shrink-0"
        />
      </div>
    </div>
  );
}

interface BalancedLeadHeaderProps {
  name: string;
  imageUrl?: string;
  leadType?: 'Buyer' | 'Seller';
  temperature?: 'Hot' | 'Warm' | 'Cold' | string;
  stage?: string;
  className?: string;
}

/**
 * Balanced header: 80px height
 * - Avatar: 48px
 * - Two row layout: Name on top, badges below
 * - Standard text sizes
 * Use for: Complete Task, Cancel Task, Reschedule Task dialogs
 */
export function BalancedLeadHeader({
  name,
  imageUrl,
  leadType = 'Buyer',
  temperature,
  stage,
  className,
}: BalancedLeadHeaderProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn('flex items-center gap-3 min-h-[80px] py-3', className)}>
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage src={imageUrl} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg mb-1.5 truncate">{name}</h3>
        <LeadBadgeGroup leadType={leadType} temperature={temperature} stage={stage} />
      </div>
    </div>
  );
}

interface FullLeadHeaderProps {
  name: string;
  imageUrl?: string;
  leadType?: 'Buyer' | 'Seller';
  temperature?: 'Hot' | 'Warm' | 'Cold' | string;
  stage?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Full header: 100px height
 * - Avatar: 56px
 * - Three row layout: Name, Subtitle (optional), Badges
 * - Larger text sizes with more spacing
 * Use for: Notes sheet, Communication History sheet, other sheets with space
 */
export function FullLeadHeader({
  name,
  imageUrl,
  leadType = 'Buyer',
  temperature,
  stage,
  subtitle,
  className,
}: FullLeadHeaderProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn('flex items-center gap-4 min-h-[100px] py-4', className)}>
      <Avatar className="h-14 w-14 flex-shrink-0">
        <AvatarImage src={imageUrl} alt={name} />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-xl mb-1 truncate">{name}</h3>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">{subtitle}</p>}
        <LeadBadgeGroup leadType={leadType} temperature={temperature} stage={stage} />
      </div>
    </div>
  );
}
