
import { Schedule, User, LogEntry, MonitoredUser } from "../types";

const API_URL = "http://localhost:5000";

// Helper to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "API request failed");
  }
  return response.json();
};

// Auth API calls
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  register: async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    return handleResponse(response);
  },

  getCurrentUser: async (token: string) => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    return handleResponse(response);
  }
};

// Schedule API calls
export const scheduleAPI = {
  getAll: async (token: string, page = 1, filters = {}) => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...filters
    });
    
    const response = await fetch(`${API_URL}/schedules?${queryParams}`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    return handleResponse(response);
  },

  getById: async (token: string, id: string) => {
    const response = await fetch(`${API_URL}/schedules/${id}`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    return handleResponse(response);
  },

  create: async (token: string, scheduleData: Omit<Schedule, "id">) => {
    const response = await fetch(`${API_URL}/schedules`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(scheduleData),
    });
    return handleResponse(response);
  },

  update: async (token: string, id: string, scheduleData: Partial<Schedule>) => {
    const response = await fetch(`${API_URL}/schedules/${id}`, {
      method: "PATCH",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(scheduleData),
    });
    return handleResponse(response);
  },

  delete: async (token: string, id: string) => {
    const response = await fetch(`${API_URL}/schedules/${id}`, {
      method: "DELETE",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    return handleResponse(response);
  }
};

// Admin API calls
export const adminAPI = {
  getMonitoredUsers: async (token: string) => {
    const response = await fetch(`${API_URL}/admin/monitored-users`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    return handleResponse(response);
  },

  getLogs: async (token: string, page = 1) => {
    const response = await fetch(`${API_URL}/admin/logs?page=${page}`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    return handleResponse(response);
  },

  getStatistics: async (token: string) => {
    const response = await fetch(`${API_URL}/admin/statistics`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    return handleResponse(response);
  }
};
