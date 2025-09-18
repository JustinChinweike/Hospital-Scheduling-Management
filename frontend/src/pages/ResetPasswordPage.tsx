import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { authAPI } from '../services/api';
import { toast } from "../components/ui/use-toast";

const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score; // 0..5
  }, [password]);

  const strengthLabel = useMemo(() => {
    const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
    return labels[strength];
  }, [strength]);

  useEffect(() => {
    const t = params.get('token');
    if (t) setToken(t);
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({ title: 'Missing token', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await authAPI.verifyPasswordReset(token, password);
      toast({ title: 'Password updated. Please log in.' });
      navigate('/auth');
    } catch (e: any) {
      toast({ title: 'Reset failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>Enter your new password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input id="token" value={token} onChange={(e) => setToken(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <div className="mt-1">
                <div className="h-2 w-full bg-gray-200 rounded">
                  <div className={`h-2 rounded ${
                    strength <= 1 ? 'bg-red-500' : strength === 2 ? 'bg-yellow-500' : strength === 3 ? 'bg-amber-500' : strength === 4 ? 'bg-green-500' : 'bg-emerald-600'
                  }`} style={{ width: `${(strength/5)*100}%` }} />
                </div>
                <div className="text-xs text-gray-600 mt-1">{strengthLabel}</div>
                <ul className="text-xs text-gray-600 list-disc pl-5 mt-1 space-y-0.5">
                  <li>Use at least 8 characters</li>
                  <li>Mix upper/lowercase, numbers, and symbols</li>
                  <li>Avoid common words or reused passwords</li>
                </ul>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Updating...' : 'Update password'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
