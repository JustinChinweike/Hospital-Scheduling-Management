
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "../../components/ui/use-toast";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [adminInviteCode, setAdminInviteCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !email || !password) {
      toast({
        title: "Registration Failed",
        description: "All fields are required",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
  const code = adminInviteCode.trim() || undefined;
  const success = await register(username, email, password, code);
      
      if (success) {
        toast({
          title: "Registration Successful",
          description: "Your account has been created!"
        });
        if (onSuccess) {
          onSuccess();
        } else {
          navigate("/");
        }
      } else {
        toast({
          title: "Registration Failed",
          description: "Email already in use",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Registration Error",
        description: "An error occurred during registration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          placeholder="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="admin-invite">Admin Invite Code (optional)</Label>
        <Input
          id="admin-invite"
          placeholder="Provide code only if authorized"
          value={adminInviteCode}
          onChange={(e) => setAdminInviteCode(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">First account auto-admin. Later admins require a valid invite code.</p>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Register"}
      </Button>
    </form>
  );
};

export default RegisterForm;
