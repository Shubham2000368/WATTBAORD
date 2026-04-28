'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Prevent double login: if already logged in, go to dashboard
  React.useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection failure. Check your backend status.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://wattbaord.onrender.com';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 overflow-hidden relative">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
         <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="w-full max-w-xl px-4 z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 lg:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-500/50 mb-6 rotate-3 hover:rotate-12 transition-transform duration-500">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-white mb-3">Welcome Back</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Sign in to your WattBoard account</p>
          </div>

          {/* Google Sign In */}
          <GoogleAuthButton label="Sign in with Google" />

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">or sign in with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-5 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                <div className="bg-rose-500 rounded-full p-1 shrink-0 mt-0.5">
                  <AlertCircle size={14} className="text-white" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-white/90">The email or password you entered is incorrect.</p>
                  <Link href="/forgot-password" title="Recover Access" className="inline-block text-[10px] font-black text-rose-400 hover:text-white uppercase tracking-widest transition-colors border-b border-rose-400/30">
                    Need to reset password?
                  </Link>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                  <Mail size={12} className="text-indigo-400" />
                  <span>Email Address</span>
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    required
                    className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:bg-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-white placeholder-slate-500"
                    placeholder="e.g. rakesh@wattmonk.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <Lock size={12} className="text-indigo-400" />
                    <span>Password</span>
                  </label>
                  <Link href="/forgot-password" title="Recover Access" className="text-[10px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors">
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <input
                    type="password"
                    required
                    className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:bg-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-white placeholder-slate-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-3 rounded-[2rem] bg-indigo-600 px-8 py-5 text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-indigo-900/40 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 active:scale-95 disabled:bg-indigo-400 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.1em]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-indigo-400 hover:text-white transition-colors ml-2 inline-flex items-center gap-1 group">
                Create Account
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
