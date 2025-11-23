# Mobile Notification System with Internationalization Implementation Plan

## Overview
The mobile notification system has been successfully implemented with comprehensive support for all operations. However, to ensure proper internationalization (i18n) support for all toast messages, we need to update the mobile toast manager to use the translation system instead of hardcoded English/Portuguese strings.

## Current Implementation Status

### ✅ Completed Components
1. **Mobile Toast Manager** (`src/lib/mobile-toast-manager.ts`)
   - Centralized management for all mobile notifications
   - Progress tracking with automatic updates
   - Success/error state transitions
   - Haptic feedback integration using Vibration API
   - Operation-specific content generation

2. **Mobile Toast Components** (`src/components/ui/mobile-toast.tsx`)
   - Mobile-optimized styling with larger touch targets
   - Swipe gesture support for dismiss/action
   - Progress indicators for ongoing operations
   - Enhanced mobile animations and transitions
   - Dark mode support

3. **Mobile Toast Hook** (`src/hooks/use-mobile-toast.ts`)
   - Simplified API for mobile notifications
   - Automatic mobile detection
   - Convenience methods for all operations
   - Fallback to regular toasts on desktop

4. **Enhanced Notification Icons** (`src/lib/notification-icons.ts`)
   - Comprehensive support for all operations
   - Follow-up operations (schedule, reschedule, cancel, complete, in progress, failed)
   - Lead operations (create, update, delete)
   - Priority and stage changes
   - Notes operations (add, update, failed)
   - Profile operations (update, avatar upload, failed)

5. **Layout Integration** (`src/app/layout.tsx`)
   - Both mobile and regular toasters included
   - Mobile toasters only render on mobile devices
   - Regular toasters remain for desktop

6. **Mobile-Specific CSS** (`src/app/globals.css`)
   - Mobile-specific animations and transitions
   - Responsive breakpoints for different mobile sizes
   - Landscape orientation support
   - Dark mode compatibility

## 🔧 Required Internationalization Updates

### Issue Identified
The current mobile toast manager uses hardcoded English strings for all notification messages. This needs to be updated to use the translation system based on the user's language preference (English/Portuguese).

### Solution Approach

#### 1. Update Mobile Toast Manager
**File**: `src/lib/mobile-toast-manager.ts`

**Changes Required**:
- Import translation hooks and types
- Replace hardcoded strings with translation keys
- Add language parameter to all content generation methods
- Ensure proper TypeScript typing for translation functions

#### 2. Translation Keys to Add
Add the following translation keys to both `src/locales/en.ts` and `src/locales/pt.ts`:

**For English (`src/locales/en.ts`)**:
```typescript
mobileNotifications: {
  followUpSchedule: {
    progress: "Scheduling Follow-up...",
    success: "Follow-up Scheduled",
    error: "Failed to Schedule Follow-up",
    progressDescription: "Please wait while we schedule the follow-up",
    successDescription: "The follow-up has been successfully scheduled",
    errorDescription: "There was an error scheduling the follow-up"
  },
  followUpReschedule: {
    progress: "Rescheduling Follow-up...",
    success: "Follow-up Rescheduled", 
    error: "Failed to Reschedule Follow-up",
    // ... other follow-up operations
  },
  leadOperations: {
    create: {
      progress: "Creating Lead...",
      success: "Lead Created",
      error: "Failed to Create Lead"
    },
    update: {
      progress: "Updating Lead...",
      success: "Lead Updated",
      error: "Failed to Update Lead"
    },
    // ... other lead operations
  },
  noteOperations: {
    add: {
      progress: "Adding Note...",
      success: "Note Added",
      error: "Failed to Add Note"
    },
    update: {
      progress: "Updating Note...",
      success: "Note Updated", 
      error: "Failed to Update Note"
    }
    // ... other note operations
  },
  profileOperations: {
    update: {
      progress: "Updating Profile...",
      success: "Profile Updated",
      error: "Failed to Update Profile"
    },
    avatarUpload: {
      progress: "Uploading Avatar...",
      success: "Avatar Updated",
      error: "Failed to Upload Avatar"
    }
    // ... other profile operations
  },
  priorityStageChanges: {
    priorityChanged: "Priority Changed",
    stageChanged: "Stage Changed"
  },
  generic: {
    loading: "Loading...",
    success: "Success",
    error: "Error",
    info: "Info"
  }
}
```

**For Portuguese (`src/locales/pt.ts`)**:
```typescript
mobileNotifications: {
  followUpSchedule: {
    progress: "Agendando Acompanhamento...",
    success: "Acompanhamento Agendado",
    error: "Falha ao Agendar Acompanhamento",
    progressDescription: "Aguarde enquanto agendamos o acompanhamento",
    successDescription: "O acompanhamento foi agendado com sucesso",
    errorDescription: "Ocorreu um erro ao agendar o acompanhamento"
  },
  followUpReschedule: {
    progress: "Reagendando Acompanhamento...",
    success: "Acompanhamento Reagendado", 
    error: "Falha ao Reagendar Acompanhamento",
    // ... other follow-up operations
  },
  leadOperations: {
    create: {
      progress: "Criando Lead...",
      success: "Lead Criado",
      error: "Falha ao Criar Lead"
    },
    update: {
      progress: "Atualizando Lead...",
      success: "Lead Atualizado",
      error: "Falha ao Atualizar Lead"
    },
    // ... other lead operations
  },
  noteOperations: {
    add: {
      progress: "Adicionando Nota...",
      success: "Nota Adicionada",
      error: "Falha ao Adicionar Nota"
    },
    update: {
      progress: "Atualizando Nota...",
      success: "Nota Atualizada", 
      error: "Falha ao Atualizar Nota"
    }
    // ... other note operations
  },
  profileOperations: {
    update: {
      progress: "Atualizando Perfil...",
      success: "Perfil Atualizado",
      error: "Falha ao Atualizar Perfil"
    },
    avatarUpload: {
      progress: "Carregando Avatar...",
      success: "Avatar Atualizado",
      error: "Falha ao Carregar Avatar"
    }
    // ... other profile operations
  },
  priorityStageChanges: {
    priorityChanged: "Prioridade Alterada",
    stageChanged: "Estágio Alterado"
  },
  generic: {
    loading: "Carregando...",
    success: "Sucesso",
    error: "Erro",
    info: "Informação"
  }
}
```

#### 3. Update Mobile Toast Manager Implementation
**Key Changes**:
- Import `useLanguage` hook
- Add translation helper function
- Update `getOperationContent` method to use translations
- Update all convenience functions to pass language context
- Maintain backward compatibility with existing hardcoded fallbacks

#### 4. Update Mobile Toast Hook
**File**: `src/hooks/use-mobile-toast.ts`

**Changes Required**:
- Pass language context to mobile toast manager calls
- Ensure proper TypeScript typing for translation parameters
- Maintain existing API compatibility

#### 5. Update Example Integration
**File**: `src/components/leads/schedule-follow-up-dialog.tsx`

**Changes Required**:
- Update mobile toast usage to demonstrate proper i18n integration
- Show both progress and success/error states with translated messages
- Maintain existing functionality while adding i18n support

## Implementation Benefits

### 1. Complete Internationalization
- All toast messages will be properly translated based on user language preference
- Consistent messaging across the entire application
- Easy maintenance and updates to translation strings

### 2. Enhanced User Experience
- Users see messages in their preferred language
- Better accessibility with proper screen reader support
- Consistent terminology with existing application translations

### 3. Developer Experience
- Centralized translation management
- Type-safe translation key handling
- Easy to extend for new notification types

## Next Steps

1. **Update Translation Files**: Add the mobile notification translation keys to both language files
2. **Update Mobile Toast Manager**: Integrate translation system with proper language detection
3. **Update Mobile Toast Hook**: Ensure language context is properly passed through
4. **Update Example Integration**: Demonstrate proper i18n usage in the follow-up dialog
5. **Testing**: Verify all notifications work correctly in both English and Portuguese

## Files to Modify

1. `src/lib/mobile-toast-manager.ts` - Core internationalization integration
2. `src/hooks/use-mobile-toast.ts` - Language context passing
3. `src/locales/en.ts` - Add mobile notification translations
4. `src/locales/pt.ts` - Add mobile notification translations
5. `src/components/leads/schedule-follow-up-dialog.tsx` - Update example usage

## Priority Order

1. **High Priority**: Core mobile toast manager i18n integration
2. **Medium Priority**: Translation files updates
3. **Low Priority**: Example integration updates

## Testing Strategy

1. Test all notification types in both languages
2. Verify proper language switching
3. Test mobile-specific features (haptic, gestures)
4. Test accessibility with screen readers
5. Test responsive behavior on different mobile devices

This implementation plan ensures that the mobile notification system will provide a fully internationalized experience for all users, regardless of their language preference.