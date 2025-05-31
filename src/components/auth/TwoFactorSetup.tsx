
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "../ui/use-toast";
import { authAPI } from "../../services/api";

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<"setup" | "verify">("setup");
  const [qrCode, setQrCode] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setupTwoFactor = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token");

      const setupData = await authAPI.setup2FA(token);
      setQrCode(setupData.qrCode);
      setManualKey(setupData.manualEntryKey);
      setStep("verify");
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Failed to setup two-factor authentication",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token");

      await authAPI.verify2FA(token, verificationCode);
      
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled successfully"
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Setup Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "setup" && (
          <>
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an extra layer of security to your account.
              You'll need an authenticator app like Google Authenticator or Authy.
            </p>
            <div className="flex space-x-2">
              <Button onClick={setupTwoFactor} disabled={isLoading} className="flex-1">
                {isLoading ? "Setting up..." : "Setup 2FA"}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {step === "verify" && (
          <>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium mb-2">Scan this QR code with your authenticator app:</p>
                {qrCode && (
                  <img src={qrCode} alt="2FA QR Code" className="mx-auto border rounded" />
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Or enter this key manually:</Label>
                <div className="p-2 bg-gray-100 rounded text-center font-mono text-sm break-all">
                  {manualKey}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Enter verification code:</Label>
                <Input
                  id="verification-code"
                  placeholder="6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={verifyTwoFactor} disabled={isLoading || verificationCode.length !== 6} className="flex-1">
                  {isLoading ? "Verifying..." : "Verify & Enable"}
                </Button>
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoFactorSetup;
