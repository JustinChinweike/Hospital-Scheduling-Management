
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Schedule } from "../types";
import { scheduleAPI } from "../services/api";
import { useAuth } from "./AuthContext";
import { useOffline } from "./OfflineContext";
import { toast } from "../components/ui/use-toast";

interface ScheduleContextType {
  schedules: Schedule[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  filters: Record<string, string>;
  fetchSchedules: (page?: number, newFilters?: Record<string, string>, limit?: number) => Promise<void>;
  getScheduleById: (id: string) => Promise<Schedule | null>;
  createSchedule: (schedule: Omit<Schedule, "id">) => Promise<boolean>;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => Promise<boolean>;
  deleteSchedule: (id: string) => Promise<boolean>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, addLog } = useAuth();
  const { isOnline, isServerUp, queueOperation, syncPendingOperations } = useOffline();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  // Do not capture token at module render; always read fresh per call
  
  // Fetch schedules when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchSchedules();
    }
  }, [isAuthenticated]);

  const fetchSchedules = async (page = 1, newFilters?: Record<string, string>, limit?: number) => {
    const token = localStorage.getItem("token");
    if (!token || !isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const appliedFilters = newFilters !== undefined ? newFilters : filters;
      if (newFilters !== undefined) {
        setFilters(newFilters);
      }
      
    console.log(`Fetching schedules for page: ${page}`);
    const data = await scheduleAPI.getAll(token, page, appliedFilters, limit);
      
      setSchedules(data.data);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      
      // Log this read operation
      addLog("READ", "Schedule", "MULTIPLE");
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      setError("Failed to load schedules. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load schedules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getScheduleById = async (id: string): Promise<Schedule | null> => {
    const token = localStorage.getItem("token");
    if (!token || !isAuthenticated) return null;
    
    try {
      const schedule = await scheduleAPI.getById(token, id);
      
      // Log this read operation
      addLog("READ", "Schedule", id);
      
      return schedule;
    } catch (error) {
      console.error(`Failed to fetch schedule ${id}:`, error);
      toast({
        title: "Error",
        description: `Failed to load schedule details`,
        variant: "destructive"
      });
      return null;
    }
  };

  const createSchedule = async (schedule: Omit<Schedule, "id">): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token || !isAuthenticated) return false;
    
    try {
      const newSchedule = await scheduleAPI.create(token, schedule);
      
      // Update local state
      setSchedules(prev => [newSchedule, ...prev]);
      
      // Log this create operation
      addLog("CREATE", "Schedule", newSchedule.id);
      
      toast({
        title: "Success",
        description: "Schedule created successfully"
      });
      
      return true;
    } catch (error: any) {
      // If offline or server down, queue operation
      if (!isOnline || !isServerUp) {
        const tempId = `temp-${Date.now()}`;
  const optimistic: any = { ...schedule, id: tempId };
        setSchedules(prev => [optimistic, ...prev]);
  queueOperation({ id: tempId, type: 'CREATE', data: optimistic as Schedule, timestamp: Date.now() });
        toast({ title: 'Queued', description: 'Schedule will sync when back online.' });
        return true;
      }
      const msg = error?.message || 'Failed to create schedule';
      console.error("Failed to create schedule:", msg);
      toast({
        title: msg.includes('conflict') ? 'Schedule Conflict' : 'Error',
        description: msg,
        variant: "destructive"
      });
      return false;
    }
  };

  const updateSchedule = async (id: string, schedule: Partial<Schedule>): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token || !isAuthenticated) return false;
    
    try {
      const updatedSchedule = await scheduleAPI.update(token, id, schedule);
      
      // Update local state
      setSchedules(prev => 
        prev.map(s => s.id === id ? { ...s, ...updatedSchedule } : s)
      );
      
      // Log this update operation
      addLog("UPDATE", "Schedule", id);
      
      toast({
        title: "Success",
        description: "Schedule updated successfully"
      });
      
      return true;
    } catch (error: any) {
      if (!isOnline || !isServerUp) {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, ...schedule } as any : s));
        queueOperation({ id, type: 'UPDATE', data: schedule as any, timestamp: Date.now() });
        toast({ title: 'Queued', description: 'Update will sync when back online.' });
        return true;
      }
      const msg = error?.message || 'Failed to update schedule';
      console.error(`Failed to update schedule ${id}:`, msg);
      toast({
        title: msg.includes('conflict') ? 'Schedule Conflict' : 'Error',
        description: msg,
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteSchedule = async (id: string): Promise<boolean> => {
    const token = localStorage.getItem("token");
    if (!token || !isAuthenticated) return false;
    
    try {
      await scheduleAPI.delete(token, id);
      
      // Update local state
      setSchedules(prev => prev.filter(s => s.id !== id));
      
      // Log this delete operation
      addLog("DELETE", "Schedule", id);
      
      toast({
        title: "Success",
        description: "Schedule deleted successfully"
      });
      
      return true;
    } catch (error) {
      if (!isOnline || !isServerUp) {
        setSchedules(prev => prev.filter(s => s.id !== id));
        queueOperation({ id, type: 'DELETE', timestamp: Date.now() });
        toast({ title: 'Queued', description: 'Delete will sync when back online.' });
        return true;
      }
      console.error(`Failed to delete schedule ${id}:`, error);
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive"
      });
      return false;
    }
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        loading,
        error,
        currentPage,
        totalPages,
        filters,
        fetchSchedules,
        getScheduleById,
        createSchedule,
        updateSchedule,
        deleteSchedule
      }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
};
