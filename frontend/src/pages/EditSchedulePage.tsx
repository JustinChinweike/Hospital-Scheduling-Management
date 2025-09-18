
import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSchedule } from "../context/ScheduleContext";
import { toast } from "../components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const departments = [
  "Cardiology",
  "Neurology",
  "Pediatrics", 
  "Orthopedics",
  "Oncology",
  "Emergency",
  "Surgery",
  "Internal Medicine",
  "Dermatology",
  "Psychiatry"
];

const EditSchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { getScheduleById, updateSchedule } = useSchedule();

  // Form state
  const [doctorName, setDoctorName] = useState("");
  const [patientName, setPatientName] = useState("");
  const [department, setDepartment] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please login to access this page",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    
    // Load schedule data
    if (id) {
      fetchSchedule(id);
    }
  }, [isAuthenticated, id, navigate]);

  const fetchSchedule = async (scheduleId: string) => {
    setIsFetching(true);
    const schedule = await getScheduleById(scheduleId);
    
    if (schedule) {
      setDoctorName(schedule.doctorName);
      setPatientName(schedule.patientName);
      setDepartment(schedule.department);
      
      // Format datetime for input
      const date = new Date(schedule.dateTime);
      const formattedDate = date.toISOString().slice(0, 16);
      setDateTime(formattedDate);
    } else {
      toast({
        title: "Error",
        description: "Unable to find the requested schedule",
        variant: "destructive"
      });
      navigate("/list-schedule");
    }
    
    setIsFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!doctorName || !patientName || !department || !dateTime || !id) {
      toast({
        title: "Validation Error",
        description: "Please fill out all fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await updateSchedule(id, {
        doctorName,
        patientName,
        department,
        dateTime
      });
      
      if (success) {
        toast({
          title: "Schedule Updated",
          description: "The appointment has been successfully updated"
        });
        navigate("/list-schedule");
      }
    } catch (error) {
      console.error("Error updating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to update the schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => navigate("/list-schedule")}
      >
        <ChevronLeft className="mr-1" /> Back to List
      </Button>
      
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Appointment</CardTitle>
            <CardDescription>
              Update the details of this appointment
            </CardDescription>
          </CardHeader>
          
          {isFetching ? (
            <CardContent className="text-center py-8">
              Loading schedule details...
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doctorName">Doctor Name</Label>
                  <Input
                    id="doctorName"
                    placeholder="Enter doctor's name"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    placeholder="Enter patient's name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select 
                    value={department} 
                    onValueChange={setDepartment}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateTime">Date & Time</Label>
                  <Input
                    id="dateTime"
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/list-schedule")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Update Schedule"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EditSchedulePage;
