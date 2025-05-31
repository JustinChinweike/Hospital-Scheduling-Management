
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/ui/use-toast";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ChevronLeft, Shield, ShieldCheck } from "lucide-react";
import TwoFactorSetup from "../components/auth/TwoFactorSetup";
import { authAPI } from "../services/api";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);

  const handleDisable2FA = async () => {
    // This would need a proper dialog with password and 2FA code input
    // For now, showing a simple alert
    const password = prompt("Enter your password to disable 2FA:");
    const code = prompt("Enter your current 2FA code:");
    
    if (!password || !code) return;

    setIsDisabling2FA(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token");

      await authAPI.disable2FA(token, password, code);
      
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled"
      });
      
      // Refresh the page to update user state
      window.location.reload();
    } catch (error) {
      toast({
        title: "Failed to Disable 2FA",
        description: "Please check your password and 2FA code",
        variant: "destructive"
      });
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const handleTwoFactorComplete = () => {
    setShowTwoFactorSetup(false);
    // Refresh the page to update user state
    window.location.reload();
  };

  if (showTwoFactorSetup) {
    return (
      <div className="min-h-screen p-6 bg-gray-50">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setShowTwoFactorSetup(false)}
        >
          <ChevronLeft className="mr-1" /> Back
        </Button>
        
        <div className="max-w-md mx-auto">
          <TwoFactorSetup
            onComplete={handleTwoFactorComplete}
            onCancel={() => setShowTwoFactorSetup(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate("/")}
      >
        <ChevronLeft className="mr-1" /> Back to Home
      </Button>

      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-medium">Username:</span> {user?.username}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user?.email}
            </div>
            <div>
              <span className="font-medium">Role:</span> {user?.role}
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage your account security and two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                {user?.twoFactorEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <Shield className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">
                    {user?.twoFactorEnabled 
                      ? "Your account is protected with 2FA" 
                      : "Add an extra layer of security to your account"
                    }
                  </div>
                </div>
              </div>
              
              {user?.twoFactorEnabled ? (
                <Button 
                  variant="outline" 
                  onClick={handleDisable2FA}
                  disabled={isDisabling2FA}
                >
                  {isDisabling2FA ? "Disabling..." : "Disable"}
                </Button>
              ) : (
                <Button onClick={() => setShowTwoFactorSetup(true)}>
                  Enable 2FA
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={logout}>
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
