
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Schedule } from '../types';
import { toast } from '../components/ui/use-toast';
import { scheduleAPI } from '../services/api';

interface OfflineState {
  isOnline: boolean;
  isServerUp: boolean;
  pendingOperations: PendingOperation[];
  syncPendingOperations: () => Promise<void>;
  queueOperation: (op: PendingOperation) => void;
}

export interface PendingOperation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  data?: Schedule;
  timestamp: number;
}

const OfflineContext = createContext<OfflineState | undefined>(undefined);

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServerUp, setIsServerUp] = useState(true);
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>(() => {
    const stored = localStorage.getItem('pendingOperations');
    return stored ? JSON.parse(stored) : [];
  });
  
  const queueOperation = (op: PendingOperation) => {
    setPendingOperations(prev => [...prev, op]);
  };

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check server status periodically
  useEffect(() => {
    const checkServer = async () => {
      try {
        const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${API_URL}/health`, { method: 'GET' });
        setIsServerUp(res.ok);
      } catch {
        setIsServerUp(false);
      }
    };

    const interval = setInterval(checkServer, 30000); // Check every 30 seconds
    checkServer(); // Initial check

    return () => clearInterval(interval);
  }, []);

  // Save pending operations to localStorage
  useEffect(() => {
    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
  }, [pendingOperations]);

  // Sync function: attempts to replay queued operations against API
  const syncPendingOperations = async () => {
    if (!isOnline || !isServerUp || pendingOperations.length === 0) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    const remaining: PendingOperation[] = [];
    let processed = 0;
    for (const op of pendingOperations) {
      try {
        if (op.type === 'CREATE' && op.data) {
          const { id: _omit, ...payload } = op.data as any;
          await scheduleAPI.create(token, payload);
          processed++;
        } else if (op.type === 'UPDATE' && op.id && op.data) {
          await scheduleAPI.update(token, op.id, op.data);
          processed++;
        } else if (op.type === 'DELETE' && op.id) {
          await scheduleAPI.delete(token, op.id);
          processed++;
        } else {
          // malformed op, drop it
        }
      } catch (e) {
        // Keep operation to retry later
        remaining.push(op);
      }
    }
    setPendingOperations(remaining);
    if (processed > 0 && remaining.length === 0) {
      toast({ title: 'Synced', description: 'All pending changes were synced.' });
    } else if (processed > 0) {
      toast({ title: 'Partially Synced', description: 'Some changes synced; remaining will retry.' });
    }
  };

  // Try to sync whenever we come back online or server comes back up
  useEffect(() => {
    if (isOnline && isServerUp) {
      syncPendingOperations();
    }
  }, [isOnline, isServerUp]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isServerUp,
        pendingOperations,
        syncPendingOperations,
        queueOperation, 
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
