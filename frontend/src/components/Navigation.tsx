
import * as React from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "../hooks/use-toast";
import { LogOut, User, ShieldCheck, Settings, BadgeCheck } from "lucide-react";

const Navigation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate("/");
  };

  const handleAdminClick = () => {
    console.log("Admin button clicked, user:", user);
    console.log("Navigating to /admin");
    navigate("/admin");
  };

  return (
    <div className="flex flex-col space-y-4 w-full max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center my-6">HOSPITAL SCHEDULING MANAGEMENT</h1>
      
      {!isLoggedIn ? (
        <Button 
          className="bg-green-600 hover:bg-green-700 text-white py-6 text-lg uppercase"
          onClick={() => navigate("/auth")}
        >
          Login / Register
        </Button>
      ) : (
        <>
          <div className="border rounded-lg p-4 mb-2 bg-white">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img src={(user.avatarUrl.startsWith('http') ? user.avatarUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatarUrl}`)} alt="avatar" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                  {user.username?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{user.username}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 capitalize flex items-center gap-1">
                    <BadgeCheck className="h-3 w-3" /> {user.role?.toLowerCase()}
                  </span>
                  {user.twoFactorEnabled && <ShieldCheck className="w-4 h-4 text-green-600" />}
                </div>
                <div className="text-xs text-gray-600 break-all">{user.email}</div>
              </div>
            </div>
          </div>
          
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg uppercase"
            onClick={() => navigate("/profile")}
          >
            <Settings className="w-5 h-5 mr-2" />
            PROFILE SETTINGS
          </Button>
          
          <Button 
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-6 text-lg uppercase rounded-md shadow-md hover:shadow-lg transition-all duration-200"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </Button>
          
          <Button 
            className="bg-blue-900 hover:bg-blue-800 text-white py-6 text-lg uppercase"
            onClick={() => navigate("/add-schedule")}
          >
            ADD SCHEDULE
          </Button>
          
          <Button 
            className="bg-blue-900 hover:bg-blue-800 text-white py-6 text-lg uppercase"
            onClick={() => navigate("/list-schedule")}
          >
            LIST SCHEDULE & FILTERING
          </Button>

          <Button 
            className="bg-indigo-700 hover:bg-indigo-800 text-white py-6 text-lg uppercase"
            onClick={() => navigate("/calendar")}
          >
            CALENDAR (DnD)
          </Button>
          
          {isAdmin && (
            <Button 
              className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg uppercase"
              onClick={handleAdminClick}
            >
              <ShieldCheck className="w-5 h-5" />
              <span>ADMIN DASHBOARD</span>
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default Navigation;
