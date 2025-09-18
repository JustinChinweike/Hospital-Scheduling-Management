
import { Schedule, User, LogEntry, MonitoredUser, TwoFactorSetup } from "../types";

 // Tries env first (Railway), falls back to localhost for local dev
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";


// Helper to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any));
    const msg = errorData.message || errorData.error || `HTTP ${response.status}`;
    throw new Error(msg);
  }
  return response.json();
};

// Auth API calls
export const authAPI = {
  login: async (email: string, password: string, twoFactorCode?: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, twoFactorCode }),
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
  },

  setup2FA: async (token: string): Promise<TwoFactorSetup> => {
    const response = await fetch(`${API_URL}/auth/2fa/setup`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    return handleResponse(response);
  },

  verify2FA: async (token: string, verificationCode: string) => {
    const response = await fetch(`${API_URL}/auth/2fa/verify`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token: verificationCode }),
    });
    return handleResponse(response);
  },

  disable2FA: async (token: string, password: string, twoFactorCode: string) => {
    const response = await fetch(`${API_URL}/auth/2fa/disable`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ password, twoFactorCode }),
    });
    return handleResponse(response);
  },

  updateProfile: async (token: string, username: string) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username })
    });
    return handleResponse(response);
  },

  changePassword: async (token: string, currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return handleResponse(response);
  },

  uploadAvatar: async (token: string, file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    const response = await fetch(`${API_URL}/auth/avatar`, {
      method: 'POST',
      headers: { "Authorization": `Bearer ${token}` },
      body: form
    });
    return handleResponse(response);
  },
  deleteAvatar: async (token: string) => {
    const response = await fetch(`${API_URL}/auth/avatar`, { method: 'DELETE', headers: { "Authorization": `Bearer ${token}` } });
    return handleResponse(response);
  },

  listSessions: async (token: string) => {
    const response = await fetch(`${API_URL}/auth/sessions`, { headers: { "Authorization": `Bearer ${token}` } });
    return handleResponse(response);
  },
  revokeSession: async (token: string, id: string) => {
    const response = await fetch(`${API_URL}/auth/sessions/${id}`, { method: 'DELETE', headers: { "Authorization": `Bearer ${token}` } });
    return handleResponse(response);
  },
  revokeOtherSessions: async (token: string) => {
    const response = await fetch(`${API_URL}/auth/sessions/revoke-others`, { method: 'POST', headers: { "Authorization": `Bearer ${token}` } });
    return handleResponse(response);
  },
  startEmailChange: async (token: string, newEmail: string) => {
    const response = await fetch(`${API_URL}/auth/email-change/start`, { method: 'POST', headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ newEmail }) });
    return handleResponse(response);
  },
  verifyEmailChange: async (token: string, verificationToken: string) => {
    const response = await fetch(`${API_URL}/auth/email-change/verify`, { method: 'POST', headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ token: verificationToken }) });
    return handleResponse(response);
  },
  myLogs: async (token: string, limit = 10) => {
    const response = await fetch(`${API_URL}/auth/my-logs?limit=${limit}`, { headers: { "Authorization": `Bearer ${token}` } });
    return handleResponse(response);
  },
  startPasswordReset: async (email: string) => {
    const response = await fetch(`${API_URL}/auth/password-reset/start`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    return handleResponse(response);
  },
  verifyPasswordReset: async (token: string, newPassword: string) => {
    const response = await fetch(`${API_URL}/auth/password-reset/verify`, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword })
    });
    return handleResponse(response);
  }
};

// Schedule API calls
export const scheduleAPI = {
  getAll: async (token: string, page = 1, filters: Record<string, any> = {}, limit?: number) => {
    const query: Record<string,string> = { page: page.toString() };
    for (const [k,v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') query[k] = String(v);
    }
    if (limit) query.limit = String(limit);
    const queryParams = new URLSearchParams(query);
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
  },
  exportCSV: async (token: string, filters: Record<string, any> = {}) => {
    const query: Record<string,string> = {};
    for (const [k,v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '' && k !== 'page' && k !== 'limit') query[k] = String(v);
    }
    const response = await fetch(`${API_URL}/schedules/export/csv?${new URLSearchParams(query)}` , {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Export failed');
    const limited = response.headers.get('X-Export-Limited') === 'true';
    const blob = await response.blob();
    return { blob, limited };
  },
  exportICS: async (token: string, filters: Record<string, any> = {}) => {
    const query: Record<string,string> = {};
    for (const [k,v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '' && k !== 'page' && k !== 'limit') query[k] = String(v);
    }
    const response = await fetch(`${API_URL}/schedules/export/ics?${new URLSearchParams(query)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Export failed');
    const limited = response.headers.get('X-Export-Limited') === 'true';
    const blob = await response.blob();
    return { blob, limited };
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
  },

  flagUser: async (token: string, userId: string) => {
    const response = await fetch(`${API_URL}/admin/flag-user/${userId}`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return handleResponse(response);
  },

  simulateActivity: async (token: string, userId: string, count = 5) => {
    const response = await fetch(`${API_URL}/admin/simulate-activity/${userId}?count=${count}`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    return handleResponse(response);
  },
  exportLogsCSV: async (token: string, filters: Record<string, any> = {}) => {
    const query: Record<string,string> = {};
    for (const [k,v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') query[k] = String(v);
    }
    const response = await fetch(`${API_URL}/admin/logs/export/csv?${new URLSearchParams(query)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Export failed');
    const limited = response.headers.get('X-Export-Limited') === 'true';
    const blob = await response.blob();
    return { blob, limited };
  }
};

// Overbooking + Waitlist API calls
export const overbookAPI = {
  listSuggestions: async (token: string, filters: Record<string, any> = {}) => {
    const query: Record<string, string> = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') query[k] = String(v);
    }
    const response = await fetch(`${API_URL}/overbook/suggestions?${new URLSearchParams(query)}` , {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
  },
  generateSuggestions: async (token: string, payload: Record<string, any> = {}) => {
    const response = await fetch(`${API_URL}/overbook/suggestions/generate`, {
      method: 'POST',
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  acceptSuggestion: async (token: string, id: string) => {
    const response = await fetch(`${API_URL}/overbook/suggestions/${id}/accept`, {
      method: 'POST',
      headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
  },
  declineSuggestion: async (token: string, id: string) => {
    const response = await fetch(`${API_URL}/overbook/suggestions/${id}/decline`, {
      method: 'POST',
      headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
  },
  joinWaitlist: async (token: string, payload: { patientName: string; patientEmail: string; department: string; doctorName?: string }) => {
    const response = await fetch(`${API_URL}/overbook/waitlist`, {
      method: 'POST',
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  inviteTopCandidate: async (token: string, payload: { department: string; doctorName?: string; dateTime: string }) => {
    const response = await fetch(`${API_URL}/overbook/waitlist/invite`, {
      method: 'POST',
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  },
  confirmInvite: async (tokenOrNull: string | null, token: string) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (tokenOrNull) headers["Authorization"] = `Bearer ${tokenOrNull}`;
    const response = await fetch(`${API_URL}/overbook/waitlist/confirm`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token })
    });
    return handleResponse(response);
  },
  getConfig: async (token: string) => {
    const response = await fetch(`${API_URL}/overbook/config`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    return handleResponse(response);
  },
  updateConfig: async (token: string, payload: { enabled?: boolean; riskThreshold?: 'low'|'medium'|'high'; maxPerHour?: number; holdMinutes?: number }) => {
    const response = await fetch(`${API_URL}/overbook/config`, {
      method: 'PATCH',
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return handleResponse(response);
  }
};
