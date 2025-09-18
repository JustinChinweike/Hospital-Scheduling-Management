
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/use-toast";
import { Button } from "../components/ui/button";
import { ChevronLeft, AlertTriangle, Loader2, Download } from "lucide-react";
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
import { adminAPI, overbookAPI } from "../services/api";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

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
  const [simulatingAttack, setSimulatingAttack] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [obLoading, setObLoading] = useState<boolean>(false);
  const [obConfig, setObConfig] = useState<{ enabled: boolean; riskThreshold: 'low'|'medium'|'high'; maxPerHour: number; holdMinutes: number }|null>(null);

  const token = localStorage.getItem("token");
  
  // Format date function to handle various date formats
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    
    try {
      // Try parsing as ISO string first
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      
      // Format the date as a locale string
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };
  
  const exportLogs = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const { blob, limited } = await adminAPI.exportLogsCSV(token, {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'logs.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      if (limited) {
        toast({ title: 'Export Limited', description: 'Only the first set of rows were exported. Refine filters for a complete export.' });
      } else {
        toast({ title: 'Export Ready', description: 'Logs CSV downloaded.' });
      }
    } catch (e) {
      toast({ title: 'Export Failed', description: 'Could not export logs.', variant: 'destructive' });
    } finally {
      setExporting(false);
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
      loadOverbookConfig();
      
      // Also refresh monitored users and logs data
      fetchMonitoredUsers();
      fetchLogs();
    }
  }, [user, token]);

  // Refresh data periodically (every 5 seconds)
  useEffect(() => {
    if (user?.role === "ADMIN" && token) {
      const interval = setInterval(() => {
        fetchMonitoredUsers();
        fetchLogs();
      }, 5000);
      
      return () => clearInterval(interval);
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

  const loadOverbookConfig = async () => {
    if (!token) return;
    setObLoading(true);
    try {
      const cfg = await overbookAPI.getConfig(token);
      setObConfig({
        enabled: !!cfg.enabled,
        riskThreshold: cfg.riskThreshold || 'low',
        maxPerHour: Number(cfg.maxPerHour ?? 1),
        holdMinutes: Number(cfg.holdMinutes ?? 20)
      });
    } catch (e) {
      toast({ title: 'Failed to load overbook config', variant: 'destructive' });
    } finally {
      setObLoading(false);
    }
  };

  const saveOverbookConfig = async () => {
    if (!token || !obConfig) return;
    setObLoading(true);
    try {
      await overbookAPI.updateConfig(token, obConfig);
      toast({ title: 'Overbooking settings saved' });
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setObLoading(false);
    }
  };

  // Simulate suspicious activity globally (existing behavior using admin logs fetches)
  const simulateAttack = async () => {
    if (!token || simulatingAttack) return;
    
    setSimulatingAttack(true);
    
    toast({
      title: "Simulating Attack",
      description: "Creating multiple actions rapidly...",
    });
    
    // Perform 20 API calls in rapid succession to trigger monitoring
    try {
      const promises = [];
      for (let i = 0; i < 20; i++) {
        // Using getLogs API call to create activity
        promises.push(adminAPI.getLogs(token));
      }
      
      await Promise.all(promises);
      
      toast({
        title: "Simulation Complete",
        description: "Multiple actions performed. Checking monitored users list...",
      });
      
      // Refresh monitored users after a short delay
      setTimeout(async () => {
        await fetchMonitoredUsers();
        await fetchLogs();
        setSimulatingAttack(false);
        
        toast({
          title: "Data Refreshed",
          description: "Check the Monitored Users list for new entries.",
        });
      }, 3000);
    } catch (error) {
      console.error("Error during attack simulation:", error);
      setSimulatingAttack(false);
      
      toast({
        title: "Simulation Failed",
        description: "Error during attack simulation.",
        variant: "destructive"
      });
    }
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              onClick={exportLogs}
              variant="secondary"
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Logs (CSV)
                </>
              )}
            </Button>
            <Button 
              onClick={simulateAttack} 
              variant="destructive"
              disabled={simulatingAttack}
            >
              {simulatingAttack ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Generate Activity Burst
                </>
              )}
            </Button>
          </div>
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
            <CardTitle className="text-xl font-bold">Overbooking Settings</CardTitle>
            <CardDescription>Configure thresholds and holds for automated invites</CardDescription>
          </CardHeader>
          <CardContent>
            {!obConfig ? (
              <p className="text-muted-foreground">{obLoading ? 'Loading…' : 'No configuration loaded'}</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Enabled</Label>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={obConfig.enabled} onChange={(e)=> setObConfig(v => v ? { ...v, enabled: e.target.checked } : v)} />
                    <span>Enable overbooking and automated invites</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Risk Threshold</Label>
                  <Select value={obConfig.riskThreshold} onValueChange={(val: any)=> setObConfig(v => v ? { ...v, riskThreshold: val } : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Per Hour</Label>
                  <Input type="number" min={0} value={obConfig.maxPerHour} onChange={(e)=> setObConfig(v => v ? { ...v, maxPerHour: Math.max(0, parseInt(e.target.value||'0')) } : v)} />
                </div>
                <div className="space-y-2">
                  <Label>Hold Minutes</Label>
                  <Input type="number" min={5} value={obConfig.holdMinutes} onChange={(e)=> setObConfig(v => v ? { ...v, holdMinutes: Math.max(5, parseInt(e.target.value||'5')) } : v)} />
                </div>
                <div className="md:col-span-2">
                  <Button onClick={saveOverbookConfig} disabled={obLoading}>{obLoading ? 'Saving…' : 'Save Settings'}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
              <p className="text-muted-foreground">No users are currently monitored. Try simulating suspicious activity.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Counts</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Detected At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monitoredUsers.map((monitoredUser) => {
                    const patternLabel = monitoredUser.pattern === 'HIGH_ACTIVITY' ? 'High Activity' : monitoredUser.pattern === 'AUTH_FAILURES' ? 'Auth Failures' : 'Unknown';
                    const counts = monitoredUser.pattern === 'HIGH_ACTIVITY'
                      ? (monitoredUser.activityCount ?? '-')
                      : monitoredUser.pattern === 'AUTH_FAILURES'
                        ? (monitoredUser.failureCount ?? '-')
                        : '-';
                    return (
                      <TableRow key={monitoredUser.id || monitoredUser.userId}>
                        <TableCell>{monitoredUser.username || monitoredUser.User?.username}</TableCell>
                        <TableCell>{patternLabel}</TableCell>
                        <TableCell>{counts}</TableCell>
                        <TableCell>{monitoredUser.reason}</TableCell>
                        <TableCell>
                          {formatDate(monitoredUser.detectedAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
