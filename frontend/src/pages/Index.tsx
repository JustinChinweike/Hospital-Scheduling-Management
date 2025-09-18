
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recent, setRecent] = useState<{ action: string; entityType: string; createdAt?: string }[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !user) return;
        const res = await authAPI.myLogs(token, 5);
        setRecent(res.data || []);
      } catch {}
    };
    fetchLogs();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Hospital Scheduling System</h1>
            <p className="text-gray-600">Manage hospital schedules efficiently</p>
          </div>
          
          <Navigation />
          {user && recent.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent activity</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {recent.map((r, i) => (
                  <li key={i} className="flex items-center justify-between border-b last:border-0 py-1">
                    <span>{r.action} • {r.entityType}</span>
                    {r.createdAt && <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
