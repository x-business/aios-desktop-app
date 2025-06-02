'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleAuthCallback } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');
      
      if (error) {
        console.error('Authentication error:', error);
        router.push('/signin?error=' + error);
        return;
      }
      
      if (!token) {
        console.error('No token received');
        router.push('/signin?error=auth_failed');
        return;
      }

      const success = await handleAuthCallback(token);
      
      if (!success) {
        router.push('/signin?error=auth_failed');
      }
      // Successful authentication will redirect to dashboard in handleAuthCallback
    };

    handleCallback();
  }, [searchParams, handleAuthCallback, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold">Completing authentication...</h2>
        <p className="text-gray-600">Please wait while we set up your account.</p>
      </div>
    </div>
  );
} 