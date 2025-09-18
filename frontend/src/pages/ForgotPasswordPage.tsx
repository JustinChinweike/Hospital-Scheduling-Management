import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { authAPI } from '../services/api';
import { toast } from "../components/ui/use-toast";

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fallbackToken, setFallbackToken] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPreviewUrl(null);
    setFallbackToken(null);
    try {
      const res = await authAPI.startPasswordReset(email);
      toast({ title: 'If the email exists, we sent a link.' });
      if (res.previewUrl) setPreviewUrl(res.previewUrl);
      if (res.resetToken) setFallbackToken(res.resetToken);
    } catch (e: any) {
      toast({ title: 'Request failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>Enter your email to receive a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Sending...' : 'Send reset link'}</Button>
          </form>
          {previewUrl && (
            <div className="mt-4 text-sm">
              <div className="font-medium">Dev preview:</div>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{previewUrl}</a>
            </div>
          )}
          {fallbackToken && (
            <div className="mt-4 text-sm">
              <div className="font-medium">Email unavailable — use this token:</div>
              <code className="block break-all p-2 bg-gray-100 rounded">{fallbackToken}</code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
