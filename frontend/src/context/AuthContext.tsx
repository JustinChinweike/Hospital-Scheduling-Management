
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { io as socketIO, Socket } from 'socket.io-client';
import { User, LogEntry, MonitoredUser } from "../types";
import { toast } from "../components/ui/use-toast";
import { authAPI, adminAPI } from "../services/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, twoFactorCode?: string) => Promise<boolean | "2FA_REQUIRED">;
  register: (username: string, email: string, password: string, adminInviteCode?: string) => Promise<boolean>;
  logout: () => void;
  logs: LogEntry[];
  monitoredUsers: MonitoredUser[];
  addLog: (action: LogEntry["action"], entityType: string, entityId: string) => void;
  fetchMonitoredUsers: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  updateUser: (partial: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [monitoredUsers, setMonitoredUsers] = useState<MonitoredUser[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Check for saved authentication on load
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      try {
        // First try to get user from localStorage
        const userString = localStorage.getItem("user");
        if (userString) {
          const savedUser = JSON.parse(userString);
          setUser(savedUser);
          console.log("User loaded from localStorage:", savedUser);
        }
        
        // Then fetch the current user from API to ensure data is up-to-date
        authAPI.getCurrentUser(savedToken)
          .then(data => {
            const currentUser = {
              id: data.id,
              username: data.username, 
              email: data.email,
              role: data.role,
              twoFactorEnabled: data.twoFactorEnabled,
              avatarUrl: data.avatarUrl || null
            };
            setUser(currentUser);
            // Update localStorage with fresh user data
            localStorage.setItem("user", JSON.stringify(currentUser));
            console.log("User updated from API:", currentUser);
          })
          .catch(error => {
            console.error("Failed to fetch current user:", error);
            // Don't clear token/user here as the API might be temporarily unavailable
            // and we don't want to log users out unnecessarily
          });
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }
  }, []);

  // Fetch monitored users and logs for admin users
  useEffect(() => {
    if (user?.role === "ADMIN" && token) {
      fetchMonitoredUsers();
      fetchLogs();
    }
  }, [user, token]);

  // Setup socket connection for admins
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      const s = socketIO(import.meta.env.VITE_API_URL || 'http://localhost:5000', { transports: ['websocket'] });
      setSocket(s);
      s.on('connect', () => {
        console.log('Socket connected');
      });
      s.on('monitoredUser:new', (payload: any) => {
        setMonitoredUsers(prev => {
          if (prev.find(m => m.id === payload.id)) return prev; // skip duplicates
          return [payload, ...prev];
        });
        toast({
          title: 'New Suspicious User',
          description: `${payload.username || payload.userId}: ${payload.reason}`
        });
      });
      return () => {
        s.disconnect();
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [user]);

  const login = async (email: string, password: string, twoFactorCode?: string): Promise<boolean | "2FA_REQUIRED"> => {
    try {
      const data = await authAPI.login(email, password, twoFactorCode);
      
      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        return "2FA_REQUIRED";
      }
      
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        
        const userData = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          twoFactorEnabled: data.user.twoFactorEnabled,
          avatarUrl: data.user.avatarUrl || null
        };
        
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        console.log("User set after login:", userData);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };
  
  const register = async (username: string, email: string, password: string, adminInviteCode?: string): Promise<boolean> => {
    try {
      const data = await authAPI.register(username, email, password, adminInviteCode);
      
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("token", data.token);
        
        const userData = {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          twoFactorEnabled: data.user.twoFactorEnabled,
          avatarUrl: data.user.avatarUrl || null
        };
        
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        console.log("User set after registration:", userData);
        
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

  const updateUser = (partial: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev;
      const merged = { ...prev, ...partial } as User;
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  };

  const refreshUser = async (): Promise<void> => {
    if (!token) return;
    try {
      const data = await authAPI.getCurrentUser(token);
      const currentUser: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role,
        twoFactorEnabled: data.twoFactorEnabled,
        avatarUrl: data.avatarUrl || null
      };
      setUser(currentUser);
      localStorage.setItem("user", JSON.stringify(currentUser));
    } catch (e) {
      console.error('refreshUser failed', e);
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
        fetchLogs,
        updateUser,
        refreshUser
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
