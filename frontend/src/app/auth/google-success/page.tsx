'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Inner client component that safely uses useSearchParams
function GoogleSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      router.replace(`/login?error=${error}`);
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      router.replace('/dashboard');
    } else {
      router.replace('/login?error=no_token');
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <p className="text-slate-300 font-medium">Signing you in with Google...</p>
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
