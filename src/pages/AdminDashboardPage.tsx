
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

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, monitoredUsers, logs } = useAuth();
  const [recentLogs, setRecentLogs] = useState(logs.slice(0, 10));

  // Simulate monitoring a suspicious user
  const simulateAttack = () => {
    // Create 20 logs in rapid succession
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        if (user) {
          const fakeEntityId = crypto.randomUUID();
          const actions = ["CREATE", "READ", "UPDATE", "DELETE"];
          const randomAction = actions[Math.floor(Math.random() * actions.length)] as "CREATE" | "READ" | "UPDATE" | "DELETE";
          const log = {
            id: crypto.randomUUID(),
            userId: user.id,
            action: randomAction,
            entityType: "Schedule",
            entityId: fakeEntityId,
            timestamp: new Date()
          };
          
          // Add to logs (in a real app, this would be handled by the context)
          logs.push(log);
          setRecentLogs(logs.slice(0, 10));
        }
      }, i * 100); // Space them out by 100ms each
    }
    
    toast({
      title: "Simulated Attack",
      description: "20 rapid operations have been simulated. The user should be added to the monitored list soon.",
    });
  };

  // Check authentication and admin role
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to access this page",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    if (user.role !== "ADMIN") {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page",
        variant: "destructive"
      });
      navigate("/");
    }
  }, [user, navigate]);

  // Update recent logs when logs change
  useEffect(() => {
    setRecentLogs(logs.slice(0, 10));
  }, [logs]);

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
          <Button onClick={simulateAttack} variant="destructive">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Simulate Suspicious Activity
          </Button>
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
                      <TableCell>{monitoredUser.username}</TableCell>
                      <TableCell>{monitoredUser.reason}</TableCell>
                      <TableCell>
                        {new Date(monitoredUser.detectedAt).toLocaleString()}
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
                    <TableHead>User ID</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.userId}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entityType}</TableCell>
                      <TableCell className="truncate max-w-[100px]">{log.entityId}</TableCell>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleString()}
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
