
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, LogEntry, MonitoredUser } from "../types";
import { toast } from "../components/ui/use-toast";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  logs: LogEntry[];
  monitoredUsers: MonitoredUser[];
  addLog: (action: LogEntry["action"], entityType: string, entityId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: User[] = [
  { id: "1", username: "admin", email: "admin@example.com", role: "ADMIN" },
  { id: "2", username: "user", email: "user@example.com", role: "USER" }
];

// Mock logs
const initialLogs: LogEntry[] = [];

// Mock monitored users
const initialMonitoredUsers: MonitoredUser[] = [];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [monitoredUsers, setMonitoredUsers] = useState<MonitoredUser[]>(initialMonitoredUsers);
  
  // Check for saved authentication on load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Background monitoring thread simulation
  useEffect(() => {
    if (!user) return;

    const monitoringInterval = setInterval(() => {
      // Count user actions in the last minute
      const lastMinute = new Date();
      lastMinute.setMinutes(lastMinute.getMinutes() - 1);
      
      const recentUserLogs = logs.filter(
        log => log.userId === user.id && new Date(log.timestamp) > lastMinute
      );
      
      // If user has more than 10 actions in the last minute, mark as suspicious
      if (recentUserLogs.length > 10 && user.role !== "ADMIN") {
        const existingMonitored = monitoredUsers.find(m => m.userId === user.id);
        
        if (!existingMonitored) {
          const newMonitoredUser: MonitoredUser = {
            userId: user.id,
            username: user.username,
            reason: `Performed ${recentUserLogs.length} actions in 1 minute`,
            detectedAt: new Date()
          };
          
          setMonitoredUsers(prev => [...prev, newMonitoredUser]);
          
          // Only show toast for admins
          if (user.role === "ADMIN") {
            toast({
              title: "New User Monitored",
              description: `${user.username} has been added to the monitored users list.`
            });
          }
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(monitoringInterval);
  }, [user, logs, monitoredUsers]);
  
  const login = async (email: string, password: string): Promise<boolean> => {
    // Demo login with mock data
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem("user", JSON.stringify(foundUser));
      return true;
    }
    
    return false;
  };
  
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    
    if (existingUser) {
      return false;
    }
    
    // Create new user
    const newUser: User = {
      id: crypto.randomUUID(),
      username,
      email,
      role: "USER" // New users are always regular users
    };
    
    // In a real app, we would send this to an API
    mockUsers.push(newUser);
    
    // Log in the new user
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    
    return true;
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };
  
  const addLog = (action: LogEntry["action"], entityType: string, entityId: string) => {
    if (!user) return;
    
    const newLog: LogEntry = {
      id: crypto.randomUUID(),
      userId: user.id,
      action,
      entityType,
      entityId,
      timestamp: new Date()
    };
    
    setLogs(prev => [...prev, newLog]);
  };
  
  return (
    <AuthContext.Provider 
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        logs,
        monitoredUsers,
        addLog
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
