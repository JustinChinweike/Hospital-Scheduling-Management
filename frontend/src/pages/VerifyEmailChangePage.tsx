import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { toast } from '../components/ui/use-toast';

const VerifyEmailChangePage: React.FC = () => {
  const [search] = useSearchParams();
  const token = search.get('token') || '';
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('token');
  useEffect(() => {
    const run = async () => {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        toast({ title: 'Login required', description: 'Please login to verify your email', variant: 'destructive' });
        navigate('/auth');
        return;
      }
      try {
        await authAPI.verifyEmailChange(authToken, token);
        toast({ title: 'Email updated', description: 'Your email has been verified.' });
        navigate('/profile');
      } catch (e: any) {
        toast({ title: 'Verification failed', description: e?.message || 'Invalid or expired token', variant: 'destructive' });
        navigate('/profile');
      }
    };
    if (token) run();
    else navigate('/');
  }, [token]);
  return <div className="min-h-screen flex items-center justify-center">Verifying email…</div>;
};

export default VerifyEmailChangePage;
