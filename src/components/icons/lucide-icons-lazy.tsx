import { lazy, ComponentType } from 'react';

// Tree-shakable dynamic import utilities for Lucide icons
// Note: lucide-react exports icons individually for better tree-shaking
export const createLazyIcon = (iconName: string) => {
  return lazy(() => import(`lucide-react`).then(module => {
    // Get the specific icon from the module
    const IconComponent = module[iconName as keyof typeof module];
    if (IconComponent) {
      return { default: IconComponent };
    }
    throw new Error(`Icon ${iconName} not found in lucide-react`);
  }));
};

// Pre-defined lazy icons commonly used in TaskCard components
export const LazyMail = createLazyIcon('Mail');
export const LazyPhone = createLazyIcon('Phone');
export const LazyHome = createLazyIcon('Home');
export const LazyCalendar = createLazyIcon('Calendar');
export const LazyMessageSquare = createLazyIcon('MessageSquare');
export const LazyBriefcase = createLazyIcon('Briefcase');
export const LazyClipboardList = createLazyIcon('ClipboardList');
export const LazyChevronDown = createLazyIcon('ChevronDown');
export const LazyChevronUp = createLazyIcon('ChevronUp');
export const LazyX = createLazyIcon('X');
export const LazyLoader2 = createLazyIcon('Loader2');
export const LazyEdit = createLazyIcon('Edit');
export const LazySave = createLazyIcon('Save');
export const LazyCopy = createLazyIcon('Copy');
export const LazyRefreshCw = createLazyIcon('RefreshCw');

// Icon type mapping for dynamic loading
type IconType = 'email' | 'phone' | 'calendar' | 'home' | 'whatsapp' | 'briefcase' | 'default' | 'chevron-down' | 'chevron-up';

export const getLazyIcon = (iconType: IconType): ComponentType<any> => {
  const iconMap: Record<IconType, ComponentType<any>> = {
    email: LazyMail,
    phone: LazyPhone,
    calendar: LazyCalendar,
    home: LazyHome,
    whatsapp: LazyMessageSquare,
    briefcase: LazyBriefcase,
    default: LazyClipboardList,
    'chevron-down': LazyChevronDown,
    'chevron-up': LazyChevronUp,
  };

  return iconMap[iconType] || iconMap.default;
};