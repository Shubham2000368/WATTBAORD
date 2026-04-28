'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';
import { useRouter } from 'next/navigation';
import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import {
  Sparkles,
  User as UserIcon,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
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
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (data.success) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="w-full max-w-xl px-4 z-10 animate-in fade-in zoom-in-95 duration-1000 py-12">
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 lg:p-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-600 shadow-2xl shadow-indigo-500/50 mb-6 rotate-3 hover:rotate-12 transition-transform duration-500">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-white mb-3">Create Account</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">
              Join WattBoard — Free to get started
            </p>
          </div>

          {/* Google Sign Up */}
          <GoogleAuthButton label="Sign up with Google" />

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">or sign up with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 flex items-start gap-3 animate-in slide-in-from-top-4 duration-500">
                <div className="bg-rose-500 rounded-full p-1 shrink-0 mt-0.5">
                  <AlertCircle size={14} className="text-white" />
                </div>
                <p className="text-sm font-bold text-white/90">{error}</p>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                <UserIcon size={12} className="text-indigo-400" />
                <span>Full Name</span>
              </label>
              <input
                id="name"
                type="text"
                required
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:bg-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-white placeholder-slate-500 text-sm"
                placeholder="e.g. Rakesh Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                <Mail size={12} className="text-indigo-400" />
                <span>Email Address</span>
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:bg-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-white placeholder-slate-500 text-sm"
                placeholder="e.g. rakesh@wattmonk.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                <Lock size={12} className="text-indigo-400" />
                <span>Password</span>
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:bg-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-white placeholder-slate-500 text-sm"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full items-center justify-center gap-3 rounded-[2rem] bg-indigo-600 px-8 py-5 text-xs font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-indigo-900/40 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/30 active:scale-95 disabled:bg-indigo-400 overflow-hidden mt-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.1em]">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-400 hover:text-white transition-colors ml-2 inline-flex items-center gap-1 group">
                Sign In
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
