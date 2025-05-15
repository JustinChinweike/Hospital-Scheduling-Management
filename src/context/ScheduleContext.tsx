
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Schedule } from "../types";

interface ScheduleContextType {
  schedules: Schedule[];
  filteredSchedules: Schedule[];
  setFilterCriteria: React.Dispatch<
    React.SetStateAction<{
      doctorName: string;
      patientName: string;
      department: string;
    }>
  >;
  addSchedule: (body: Omit<Schedule, "id">) => Promise<void>;
  updateSchedule: (schedule: Schedule) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  fetchSchedules: () => Promise<void>;
  getScheduleById: (id: string) => Schedule | undefined;
  loadNextPage: () => void;
  autoScheduleEnabled: boolean;
  toggleAutoSchedule: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// Mock data
const initialSchedules: Schedule[] = [
  {
    id: "1",
    doctorName: "Dr. Sarah Johnson",
    patientName: "James Wilson",
    dateTime: "2024-05-15T10:30:00",
    department: "Cardiology"
  },
  {
    id: "2",
    doctorName: "Dr. David Miller",
    patientName: "Emily Parker",
    dateTime: "2024-05-16T14:00:00",
    department: "Neurology"
  }
];

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [filterCriteria, setFilterCriteria] = useState({
    doctorName: "",
    patientName: "",
    department: "",
  });
  const [page, setPage] = useState(1);
  const [autoScheduleEnabled, setAutoScheduleEnabled] = useState(true);

  // Filtering
  const filteredSchedules = schedules.filter((s) => {
    const d = !filterCriteria.doctorName || s.doctorName.toLowerCase().includes(filterCriteria.doctorName.toLowerCase());
    const p = !filterCriteria.patientName || s.patientName.toLowerCase().includes(filterCriteria.patientName.toLowerCase());
    const dept = !filterCriteria.department || filterCriteria.department === "all" || s.department === filterCriteria.department;
    return d && p && dept;
  });

  const fetchSchedules = async () => {
    // In a real app, we would fetch from the API
    console.log("Fetching schedules for page:", page);
    // No need to do anything for this demo
  };

  useEffect(() => {
    fetchSchedules();
  }, [page]);

  const loadNextPage = () => setPage((p) => p + 1);

  const addSchedule = async (body: Omit<Schedule, "id">) => {
    const newSchedule: Schedule = {
      ...body,
      id: crypto.randomUUID(),
    };
    setSchedules(prev => [newSchedule, ...prev]);
  };

  const updateSchedule = async (schedule: Schedule) => {
    setSchedules(prev => prev.map(s => s.id === schedule.id ? schedule : s));
  };

  const deleteSchedule = async (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const getScheduleById = (id: string) => schedules.find(s => s.id === id);

  const toggleAutoSchedule = () => {
    setAutoScheduleEnabled(prev => !prev);
  };

  return (
    <ScheduleContext.Provider
      value={{
        schedules,
        filteredSchedules,
        setFilterCriteria,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        fetchSchedules,
        getScheduleById,
        loadNextPage,
        autoScheduleEnabled,
        toggleAutoSchedule,
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
