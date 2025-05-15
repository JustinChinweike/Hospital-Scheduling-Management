
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Schedule } from '../types';

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
        // Simplified server check
        setIsServerUp(true);
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

  // Simplified sync function
  const syncPendingOperations = async () => {
    if (!isOnline || !isServerUp || pendingOperations.length === 0) return;
    
    // In a real app, we would sync with the server here
    setPendingOperations([]);
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
