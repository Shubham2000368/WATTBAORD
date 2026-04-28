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
    const handleSuccess = async () => {
      if (processed.current) return;
      
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        router.replace(`/login?error=${error}`);
        return;
      }

      if (token) {
        processed.current = true;
        try {
          // Fetch user data immediately to avoid race condition in AuthContext
          const res = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            // This updates global state AND redirects to dashboard
            login(token, data.data);
          } else {
            router.replace('/login?error=token_invalid');
          }
        } catch (err) {
          console.error('Auth verification failed:', err);
          router.replace('/login?error=verification_failed');
        }
      } else {
        router.replace('/login?error=no_token');
      }
    };

    handleSuccess();
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
