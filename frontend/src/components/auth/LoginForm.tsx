
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/ui/use-toast";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import TwoFactorInput from "./TwoFactorInput";

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result === "2FA_REQUIRED") {
        setShowTwoFactor(true);
      } else if (result === true) {
        toast({
          title: "Login Successful",
          description: "Welcome back!"
        });
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/");
        }
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Error",
        description: "An error occurred during login",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (code: string) => {
    setIsLoading(true);
    
    try {
      const success = await login(email, password, code);
      
      if (success === true) {
        toast({
          title: "Login Successful",
          description: "Welcome back!"
        });
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/");
        }
      } else {
        toast({
          title: "Invalid Code",
          description: "The authentication code is invalid",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify authentication code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorCancel = () => {
    setShowTwoFactor(false);
  };

  if (showTwoFactor) {
    return (
      <TwoFactorInput
        onSubmit={handleTwoFactorSubmit}
        onCancel={handleTwoFactorCancel}
        isLoading={isLoading}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          placeholder="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
        </div>
        <Input
          id="password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </Button>
      <div className="text-sm text-right">
        <button type="button" className="text-blue-600 hover:underline" onClick={() => navigate('/forgot-password')}>
          Forgot your password?
        </button>
      </div>
  
    </form>
  );
};

export default LoginForm;
