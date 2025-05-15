
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, LogEntry, MonitoredUser } from "../types";
import { toast } from "../components/ui/use-toast";
import { authAPI, adminAPI } from "../services/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  logs: LogEntry[];
  monitoredUsers: MonitoredUser[];
  addLog: (action: LogEntry["action"], entityType: string, entityId: string) => void;
  fetchMonitoredUsers: () => Promise<void>;
  fetchLogs: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [monitoredUsers, setMonitoredUsers] = useState<MonitoredUser[]>([]);
  
  // Check for saved authentication on load
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      authAPI.getCurrentUser(savedToken)
        .then(data => {
          setUser({
            id: data.id,
            username: data.username, 
            email: data.email,
            role: data.role
          });
        })
        .catch(error => {
          console.error("Failed to fetch current user:", error);
          localStorage.removeItem("token");
          setToken(null);
        });
    }
  }, []);

  // Fetch monitored users and logs for admin users
  useEffect(() => {
    if (user?.role === "ADMIN" && token) {
      fetchMonitoredUsers();
      fetchLogs();
    }
  }, [user, token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await authAPI.login(email, password);
      
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        
        setUser({
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };
  
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const data = await authAPI.register(username, email, password);
      
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        
        setUser({
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };
  
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
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

  const fetchMonitoredUsers = async (): Promise<void> => {
    if (!token || user?.role !== "ADMIN") return;
    
    try {
      const data = await adminAPI.getMonitoredUsers(token);
      setMonitoredUsers(data);
    } catch (error) {
      console.error("Failed to fetch monitored users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch monitored users",
        variant: "destructive"
      });
    }
  };

  const fetchLogs = async (): Promise<void> => {
    if (!token || user?.role !== "ADMIN") return;
    
    try {
      const data = await adminAPI.getLogs(token);
      setLogs(data.data);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive"
      });
    }
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
        addLog,
        fetchMonitoredUsers,
        fetchLogs
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
