import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { overbookAPI } from '../services/api';
import { toast } from '../components/ui/use-toast';

const OverbookConfirmPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle'|'working'|'done'|'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Missing token');
      return;
    }
    const run = async () => {
      setStatus('working');
      try {
        const authToken = localStorage.getItem('token');
        const res = await overbookAPI.confirmInvite(authToken, token);
        setStatus('done');
        setMessage('Appointment confirmed!');
        toast({ title: 'Confirmed', description: 'Your appointment is booked.' });
        setTimeout(() => navigate('/calendar'), 1500);
      } catch (e: any) {
        setStatus('error');
        setMessage(e?.message || 'Failed to confirm');
      }
    };
    run();
  }, [location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-md shadow p-6 text-center">
        <h1 className="text-xl font-semibold mb-2">Claiming Your Slot</h1>
        {status === 'working' && <p>Please wait while we confirm…</p>}
        {status !== 'working' && <p>{message}</p>}
      </div>
    </div>
  );
};

export default OverbookConfirmPage;
