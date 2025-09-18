
export interface User {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  twoFactorEnabled?: boolean;
  avatarUrl?: string | null;
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
  id?: string;
  userId: string;
  username?: string;
  User?: {
    username: string;
    email: string;
  };
  reason: string;
  pattern?: 'HIGH_ACTIVITY' | 'AUTH_FAILURES' | 'UNKNOWN';
  activityCount?: number | null;
  failureCount?: number | null;
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
