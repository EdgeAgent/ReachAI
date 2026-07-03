// src/hooks/useLeads.ts - Manage leads state with CRUD operations
import { useState, useEffect, useCallback } from 'react';
import type { Lead, LeadStatus } from '@/types';
import { mockLeads } from '@/lib/mockData';

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Try to load from store first, fallback to mock data
    const load = async () => {
      try {
        const val = await window.electronAPI?.storeGet('leads');
        if (val && Array.isArray(val) && (val as Lead[]).length > 0) {
          setLeads(val as Lead[]);
        } else {
          setLeads(mockLeads);
        }
      } catch {
        setLeads(mockLeads);
      }
      setLoaded(true);
    };
    // If electronAPI isn't ready, fallback after 500ms
    const timer = setTimeout(() => {
      if (!loaded) {
        setLeads(mockLeads);
        setLoaded(true);
      }
    }, 500);
    load();
    return () => clearTimeout(timer);
  }, []);

  const updateLeadStatus = useCallback(async (id: string, status: LeadStatus) => {
    setLeads(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, status, lastContact: new Date().toISOString() } : l);
      window.electronAPI?.storeSet('leads', updated);
      return updated;
    });
  }, []);

  const updateLeadNotes = useCallback(async (id: string, notes: string) => {
    setLeads(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, notes } : l);
      window.electronAPI?.storeSet('leads', updated);
      return updated;
    });
  }, []);

  const addLead = useCallback(async (lead: Lead) => {
    setLeads(prev => {
      const updated = [lead, ...prev];
      window.electronAPI?.storeSet('leads', updated);
      return updated;
    });
  }, []);

  const deleteLead = useCallback(async (id: string) => {
    setLeads(prev => {
      const updated = prev.filter(l => l.id !== id);
      window.electronAPI?.storeSet('leads', updated);
      return updated;
    });
  }, []);

  return {
    leads,
    loaded,
    updateLeadStatus,
    updateLeadNotes,
    addLead,
    deleteLead,
  };
}
