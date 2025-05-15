
export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  createdAt: Date;
}

export enum UserRole {
  REGULAR = "REGULAR",
  ADMIN = "ADMIN"
}

export interface User {
  id: string;
  username: string;
  password: string; // This will be hashed
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LogEntry {
  id: string;
  userId: string;
  action: string;
  entityId: string;
  entityType: string;
  timestamp: Date;
}
