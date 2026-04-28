'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';

// Inner client component that safely uses useSearchParams
function GoogleSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        router.replace(`/login?error=${error}`);
        return;
      }

      if (token) {
        processed.current = true;
        try {
          // 1. Immediately store token
          localStorage.setItem('token', token);
          
          // 2. Redirect to dashboard
          // The AuthContext will pick up the token and fetch user details on mount
          router.replace('/dashboard');
        } catch (err) {
          console.error('Failed to store token:', err);
          router.replace('/login?error=storage_failed');
        }
      } else {
        router.replace('/login?error=no_token');
      }
  }, [searchParams, router, login]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <p className="text-slate-300 font-medium">Authenticating with Google...</p>
      </div>
    </div>
  );
}

// Main page export — wraps content in Suspense to fix Next.js build error
import { Suspense } from 'react';

export default function GoogleSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
            <p className="text-slate-300 font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <GoogleSuccessContent />
    </Suspense>
  );
}
