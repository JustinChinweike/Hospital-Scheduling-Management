
import * as React from "react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "../hooks/use-toast";

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
        <Button 
          className="bg-red-600 hover:bg-red-700 text-white py-6 text-lg uppercase"
          onClick={handleLogout}
        >
          Logout
        </Button>
      )}
      
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
      
      {isAdmin && (
        <Button 
          className="bg-orange-600 hover:bg-orange-700 text-white py-6 text-lg uppercase"
          onClick={() => navigate("/admin")}
        >
          ADMIN DASHBOARD
        </Button>
      )}
    </div>
  );
};

export default Navigation;
