
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/use-toast";
import { Button } from "../components/ui/button";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { adminAPI } from "../services/api";

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, monitoredUsers, logs, fetchMonitoredUsers, fetchLogs } = useAuth();
  const [recentLogs, setRecentLogs] = useState(logs.slice(0, 10));
  const [statistics, setStatistics] = useState({
    totalAppointments: 0,
    busiestDoctor: 'None',
    popularDepartment: 'None'
  });
  const [loading, setLoading] = useState<boolean>(false);

  const token = localStorage.getItem("token");
  
  // Format date function to handle various date formats
  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };
  
  // Effect for setting recent logs
  useEffect(() => {
    setRecentLogs(logs.slice(0, 10));
  }, [logs]);

  // Check authentication and admin role
  useEffect(() => {
    console.log("AdminDashboardPage - Current user:", user);
    
    if (!user) {
      console.log("AdminDashboardPage - No user, redirecting to /auth");
      toast({
        title: "Authentication Required",
        description: "Please login to access this page",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    if (user.role !== "ADMIN") {
      console.log("AdminDashboardPage - Not admin, redirecting to /");
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [user, navigate]);

  // Fetch statistics when the component mounts
  useEffect(() => {
    console.log("AdminDashboardPage - Fetching data, user role:", user?.role);
    if (user?.role === "ADMIN" && token) {
      fetchStatistics();
      
      // Also refresh monitored users and logs data
      fetchMonitoredUsers();
      fetchLogs();
    }
  }, [user, token]);

  const fetchStatistics = async () => {
    if (!token || !user || user.role !== "ADMIN") return;
    
    setLoading(true);
    try {
      const data = await adminAPI.getStatistics(token);
      setStatistics(data);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Simulate suspicious activity
  const simulateAttack = async () => {
    if (!token) return;
    
    toast({
      title: "Simulating Attack",
      description: "Creating multiple actions rapidly...",
    });
    
    // Perform 20 API calls in rapid succession to trigger monitoring
    for (let i = 0; i < 20; i++) {
      try {
        // Using getLogs API call to create activity
        await adminAPI.getLogs(token);
      } catch (error) {
        console.error("Error during attack simulation:", error);
      }
      
      // Very short delay between requests to not overload the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    toast({
      title: "Simulation Complete",
      description: "Multiple actions performed. Check the monitored users list shortly.",
    });
    
    // Refresh monitored users after a short delay
    setTimeout(() => {
      fetchMonitoredUsers();
    }, 3000);
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="mr-1" /> Back
      </Button>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => {
            console.log("Simulating attack...");
            simulateAttack();
          }} variant="destructive">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Simulate Suspicious Activity
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{statistics.totalAppointments}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Busiest Doctor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{statistics.busiestDoctor}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Popular Department</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{statistics.popularDepartment}</p>
            </CardContent>
          </Card>
        </div>

        {/* Monitored Users Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Monitored Users</CardTitle>
            <CardDescription>
              Users who have been flagged for suspicious activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monitoredUsers.length === 0 ? (
              <p className="text-muted-foreground">No users are currently monitored</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Detected At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monitoredUsers.map((monitoredUser) => (
                    <TableRow key={monitoredUser.userId}>
                      <TableCell>{monitoredUser.username || monitoredUser.User?.username}</TableCell>
                      <TableCell>{monitoredUser.reason}</TableCell>
                      <TableCell>
                        {formatDate(monitoredUser.detectedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Logs Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Recent Activity Logs</CardTitle>
            <CardDescription>
              Recent user actions in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-muted-foreground">No recent activity</p>
            ) : (
              <Table>
                <TableCaption>Showing the 10 most recent logs</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.User?.username || log.userId}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell className="truncate max-w-[100px]">{log.entityId}</TableCell>
                      <TableCell>
                        {formatDate(log.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
