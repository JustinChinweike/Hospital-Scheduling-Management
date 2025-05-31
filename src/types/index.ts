
export interface User {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  twoFactorEnabled?: boolean;
}

export interface LogEntry {
  id: string;
  userId: string;
  User?: {
    username: string;
    email: string;
  };
  action: "CREATE" | "READ" | "UPDATE" | "DELETE";
  entityType: string;
  entityId: string;
  timestamp: Date;
}

export interface MonitoredUser {
  userId: string;
  username?: string;
  User?: {
    username: string;
    email: string;
  };
  reason: string;
  detectedAt: Date;
}

export interface Schedule {
  id: string;
  doctorName: string;
  patientName: string;
  dateTime: string;
  department: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface Statistics {
  totalAppointments: number;
  busiestDoctor: string;
  popularDepartment: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}
