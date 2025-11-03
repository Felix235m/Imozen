"use client";

import { useState, useEffect, useCallback } from 'react';
import { localStorageManager } from '@/lib/local-storage-manager';
import type { AppData, TaskGroup, Lead, LeadDetail, DashboardStats, Note, Notification } from '@/types/app-data';

/**
 * Custom hook for accessing and subscribing to app data from localStorage
 * Provides real-time updates when data changes
 */
export function useAppData() {
  const [appData, setAppData] = useState<AppData>(() => localStorageManager.getAppData());

  useEffect(() => {
    // Subscribe to changes
    const unsubscribe = localStorageManager.subscribe((newData) => {
      setAppData(newData);
    });

    // Initial sync
    setAppData(localStorageManager.getAppData());

    return unsubscribe;
  }, []);

  return appData;
}

/**
 * Hook for accessing tasks with real-time updates
 */
export function useTasks(): TaskGroup[] {
  const [tasks, setTasks] = useState<TaskGroup[]>(() => localStorageManager.getTasks());

  useEffect(() => {
    const unsubscribe = localStorageManager.subscribe((newData) => {
      setTasks(newData.tasks);
    });

    setTasks(localStorageManager.getTasks());

    return unsubscribe;
  }, []);

  const updateTasks = useCallback((newTasks: TaskGroup[]) => {
    localStorageManager.updateTasks(newTasks);
  }, []);

  return tasks;
}

/**
 * Hook for accessing leads with real-time updates
 */
export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>(() => localStorageManager.getLeads());

  useEffect(() => {
    const unsubscribe = localStorageManager.subscribe((newData) => {
      setLeads(newData.leads);
    });

    setLeads(localStorageManager.getLeads());

    return unsubscribe;
  }, []);

  const updateLeads = useCallback((newLeads: Lead[]) => {
    localStorageManager.updateLeads(newLeads);
  }, []);

  const updateSingleLead = useCallback((leadId: string, updates: Partial<Lead>) => {
    localStorageManager.updateSingleLead(leadId, updates);
  }, []);

  const deleteLead = useCallback((leadId: string) => {
    localStorageManager.deleteLead(leadId);
  }, []);

  const addLead = useCallback((lead: Lead) => {
    localStorageManager.addLead(lead);
  }, []);

  return {
    leads,
    updateLeads,
    updateSingleLead,
    deleteLead,
    addLead,
  };
}

/**
 * Hook for accessing dashboard stats with real-time updates
 */
export function useDashboard(): DashboardStats {
  const [dashboard, setDashboard] = useState<DashboardStats>(() => localStorageManager.getDashboard());

  useEffect(() => {
    const unsubscribe = localStorageManager.subscribe((newData) => {
      setDashboard(newData.dashboard);
    });

    setDashboard(localStorageManager.getDashboard());

    return unsubscribe;
  }, []);

  return dashboard;
}

/**
 * Hook for accessing specific lead details with real-time updates
 */
export function useLeadDetails(leadId: string) {
  const [leadDetails, setLeadDetails] = useState<LeadDetail | null>(() =>
    localStorageManager.getLeadDetails(leadId)
  );

  useEffect(() => {
    const unsubscribe = localStorageManager.subscribe((newData) => {
      setLeadDetails(newData.leadDetails[leadId] || null);
    });

    setLeadDetails(localStorageManager.getLeadDetails(leadId));

    return unsubscribe;
  }, [leadId]);

  const updateLeadDetails = useCallback(
    (details: LeadDetail) => {
      localStorageManager.updateLeadDetails(leadId, details);
    },
    [leadId]
  );

  return {
    leadDetails,
    updateLeadDetails,
  };
}

/**
 * Hook for accessing notes for a specific lead with real-time updates
 */
export function useNotes(leadId: string) {
  const [notes, setNotes] = useState<Note[]>(() => localStorageManager.getNotes(leadId));

  useEffect(() => {
    const unsubscribe = localStorageManager.subscribe((newData) => {
      setNotes(newData.notes[leadId] || []);
    });

    setNotes(localStorageManager.getNotes(leadId));

    return unsubscribe;
  }, [leadId]);

  const updateNotes = useCallback(
    (newNotes: Note[]) => {
      localStorageManager.updateNotes(leadId, newNotes);
    },
    [leadId]
  );

  return {
    notes,
    updateNotes,
  };
}

/**
 * Hook for accessing notifications with real-time updates
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    localStorageManager.getNotifications()
  );

  useEffect(() => {
    const unsubscribe = localStorageManager.subscribe((newData) => {
      setNotifications(newData.notifications);
    });

    setNotifications(localStorageManager.getNotifications());

    return unsubscribe;
  }, []);

  const updateNotifications = useCallback((newNotifications: Notification[]) => {
    localStorageManager.updateNotifications(newNotifications);
  }, []);

  return {
    notifications,
    updateNotifications,
  };
}

/**
 * Hook to check if data is stale
 */
export function useDataFreshness() {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const checkFreshness = () => {
      setIsStale(localStorageManager.isStale());
    };

    checkFreshness();

    // Check every minute
    const interval = setInterval(checkFreshness, 60000);

    return () => clearInterval(interval);
  }, []);

  return { isStale };
}
