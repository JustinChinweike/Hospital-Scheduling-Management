
import React from "react";
import { useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/use-toast";

const EditSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to access this page",
        variant: "destructive"
      });
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="mr-1" /> Back
      </Button>
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold">Edit Schedule {id}</h1>
        {/* Actual form implementation would go here */}
      </div>
    </div>
  );
};

export default EditSchedulePage;
