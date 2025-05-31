
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface TwoFactorInputProps {
  onSubmit: (code: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const TwoFactorInput: React.FC<TwoFactorInputProps> = ({ onSubmit, onCancel, isLoading }) => {
  const [code, setCode] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onSubmit(code);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Enter the 6-digit code from your authenticator app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="2fa-code">Authentication Code</Label>
            <Input
              id="2fa-code"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center text-lg tracking-widest"
            />
          </div>
          <div className="flex space-x-2">
            <Button 
              type="submit" 
              disabled={isLoading || code.length !== 6}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TwoFactorInput;
