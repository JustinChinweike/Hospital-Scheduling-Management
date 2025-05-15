
export interface Task {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
}

export interface LogEntry {
  id: string;
  userId: string;
  action: "CREATE" | "READ" | "UPDATE" | "DELETE";
  entityType: string;
  entityId: string;
  timestamp: Date;
}

export interface MonitoredUser {
  userId: string;
  username: string;
  reason: string;
  detectedAt: Date;
}

export type Schedule = {
  id: string;
  doctorName: string;
  patientName: string;
  dateTime: string;
  department: string;
};
