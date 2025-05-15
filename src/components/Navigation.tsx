
import * as React from "react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Navigation = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem("authToken");
    setIsLoggedIn(!!token);

    // If logged in, check if admin
    if (token) {
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error("Failed to authenticate");
        })
        .then(user => {
          setIsAdmin(user.role === "ADMIN");
        })
        .catch(err => {
          console.error("Auth check error:", err);
          // Clear invalid token
          localStorage.removeItem("authToken");
          setIsLoggedIn(false);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    setIsAdmin(false);
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

      <Button 
        className="bg-purple-700 hover:bg-purple-800 text-white py-6 text-lg uppercase"
        onClick={() => navigate("/tasks")}
      >
        TASK MANAGER
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
