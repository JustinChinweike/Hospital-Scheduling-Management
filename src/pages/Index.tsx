
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Hospital Scheduling System</h1>
            <p className="text-gray-600">Manage hospital schedules efficiently</p>
          </div>
          
          <Navigation />
        </div>
      </div>
    </div>
  );
};

export default Index;
