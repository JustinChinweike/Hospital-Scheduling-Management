
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { toast } from "../components/ui/use-toast";
import { User, LogEntry } from "../types";

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [monitoredUsers, setMonitoredUsers] = useState<User[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          toast({
            title: "Unauthorized",
            description: "Please login first",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error("Failed to authenticate");
        }

        const userData = await response.json();
        if (userData.role !== "ADMIN") {
          toast({
            title: "Access Denied",
            description: "You need admin privileges to access this page",
            variant: "destructive",
          });
          navigate("/");
        } else {
          // If admin, load dashboard data
          loadDashboardData();
        }
      } catch (error) {
        console.error("Auth error:", error);
        toast({
          title: "Error",
          description: "Authentication failed. Please login again.",
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    checkAdmin();
  }, [navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load monitored users
      const monitoredResponse = await fetch("/api/admin/monitored-users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!monitoredResponse.ok) {
        throw new Error("Failed to fetch monitored users");
      }

      const monitored = await monitoredResponse.json();
      setMonitoredUsers(monitored);

      // Load recent logs
      const logsResponse = await fetch("/api/admin/recent-logs", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        }
      });

      if (!logsResponse.ok) {
        throw new Error("Failed to fetch logs");
      }

      const logs = await logsResponse.json();
      setRecentLogs(logs);
    } catch (error) {
      console.error("Dashboard data error:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateAttack = async () => {
    try {
      await fetch("/api/admin/simulate-attack", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json"
        }
      });

      toast({
        title: "Success",
        description: "Attack simulation initiated. The monitoring thread will detect this shortly."
      });

      // Refresh data after a short delay
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      console.error("Simulation error:", error);
      toast({
        title: "Error",
        description: "Failed to simulate attack",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>Key metrics and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Monitored Users</p>
                <p className="text-2xl font-bold">{monitoredUsers.length}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Recent Activity Logs</p>
                <p className="text-2xl font-bold">{recentLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription>System management tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={simulateAttack} variant="destructive">
              Simulate Attack
            </Button>
            <Button onClick={loadDashboardData} variant="outline">
              Refresh Dashboard Data
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Monitored Users */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Monitored Users</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Suspicious Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitoredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No monitored users at this time.
                  </TableCell>
                </TableRow>
              ) : (
                monitoredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        Suspicious Activity
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Recent Activity Logs */}
      <div>
        <h2 className="text-xl font-bold mb-4">Recent Activity Logs</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
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
              {recentLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No recent activity logs.
                  </TableCell>
                </TableRow>
              ) : (
                recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.userId}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        log.action === "CREATE" ? "bg-green-100 text-green-800" :
                        log.action === "UPDATE" ? "bg-blue-100 text-blue-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell>{log.entityId}</TableCell>
                    <TableCell>
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
