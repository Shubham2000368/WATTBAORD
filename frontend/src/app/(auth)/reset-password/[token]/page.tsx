'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/config/api';
import { 
  Sparkles, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/resetpassword/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Reset failed');
      }
    } catch (err) {
      setError('Connection failure. Check your backend status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 overflow-hidden relative">
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
            <h2 className="text-4xl font-black tracking-tighter text-white mb-3">Update Identity</h2>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Establish new security credentials</p>
          </div>

          {!success ? (
            <form className="space-y-8" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-5 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                  <div className="bg-rose-500 rounded-full p-1 shrink-0 mt-0.5">
                    <AlertCircle size={14} className="text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-rose-400 uppercase tracking-widest">Update Blocked</p>
                    <p className="text-sm font-bold text-white/90">{error}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                    <Lock size={12} className="text-indigo-400" />
                    <span>New Security Key</span>
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:bg-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-white placeholder-slate-500"
                    placeholder="Create strong password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">
                    <Lock size={12} className="text-indigo-400" />
                    <span>Verify Security Key</span>
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full px-8 py-5 bg-white/5 border border-white/10 rounded-[1.5rem] outline-none focus:bg-white/10 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-white placeholder-slate-500"
                    placeholder="Repeat new password..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
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
                    <span>Confirm Update</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center animate-in fade-in zoom-in-95 duration-500">
               <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
               </div>
               <h3 className="text-2xl font-black text-white mb-4">Identity Re-established</h3>
               <p className="text-slate-400 font-medium mb-8 leading-relaxed">
                  Your security credentials have been updated. 
                  <br/>
                  Redirecting to Gateway for authorization...
               </p>
               <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
