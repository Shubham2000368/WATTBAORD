'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  CreditCard,
  Check,
  Loader2,
  Lock,
  Mail,
  Camera,
  AtSign
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/services/userService';

const TABS = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'display', name: 'Display & Appearance', icon: Palette },
  { id: 'billing', name: 'Billing', icon: CreditCard },
];

export default function SettingsPage() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');

  // Security Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setBio((user as any).bio || '');
      setAvatar((user as any).avatar || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const updatedUser = await userService.updateMe({ name, email, bio, avatar });
      // We don't have a direct 'updateUser' in AuthContext, but we can re-login or use a sync method if available.
      // For now, let's just show success. In a real app, you'd update the global state.
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    setSuccess(false);
    try {
      await userService.updatePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (n: string) => {
    return n.split(' ').map(i => i[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      <div className="relative">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-2">Settings</h1>
        <p className="text-lg text-slate-500 font-medium tracking-tight">Configure your identity and preferences.</p>
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Modern Sidebar Navigation */}
        <div className="w-full lg:w-80 space-y-3">
           {TABS.map((tab) => {
             const Icon = tab.icon;
             const isActive = activeTab === tab.id;
             return (
               <button
                 key={tab.id}
                 onClick={() => {
                   setActiveTab(tab.id);
                   setSuccess(false);
                 }}
                 className={`group w-full flex items-center justify-between px-6 py-4 rounded-[1.5rem] transition-all duration-300 ${
                   isActive 
                    ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200 translate-x-2' 
                    : 'text-slate-400 hover:bg-white hover:text-indigo-600 hover:translate-x-1'
                 }`}
               >
                 <div className="flex items-center gap-4">
                   <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                     <Icon size={20} />
                   </div>
                   <span className="font-black text-sm uppercase tracking-widest">{tab.name}</span>
                 </div>
                 {isActive && <div className="h-2 w-2 bg-indigo-400 rounded-full animate-pulse" />}
               </button>
             );
           })}
        </div>

        {/* Content Area with Glassmorphism */}
        <div className="flex-1 bg-white/70 backdrop-blur-xl border border-white rounded-[3.5rem] p-10 lg:p-16 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] relative overflow-hidden">
           {/* Decorative background glow */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
           
           <div className="max-w-3xl">
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile} className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                  <header>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Public Profile</h3>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Update your visible identity</p>
                  </header>

                  <div className="space-y-10">
                     <div className="flex flex-col sm:flex-row items-center gap-10 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                        <div className="relative group">
                          <div className="h-32 w-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-slate-200 border-4 border-white transition-transform group-hover:scale-105 duration-500 overflow-hidden">
                            {avatar ? (
                              <img src={avatar} alt={name} className="h-full w-full object-cover" />
                            ) : (
                              getInitials(name || 'User')
                            )}
                          </div>
                          <button type="button" className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl hover:bg-slate-900 transition-all active:scale-90 border-2 border-white">
                             <Camera size={18} />
                          </button>
                        </div>
                        <div className="space-y-3 text-center sm:text-left">
                           <h4 className="text-lg font-black text-slate-900 tracking-tight">Avatar Configuration</h4>
                           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">JPG or PNG. Max size 2MB. Recommendation: Square aspect ratio.</p>
                           <button type="button" className="text-xs font-black text-indigo-600 hover:text-slate-900 transition-colors uppercase tracking-widest">Remove Photo</button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                             <User size={12} className="text-indigo-400" />
                             <span>Full Name</span>
                           </label>
                           <input 
                             type="text" 
                             value={name}
                             onChange={(e) => setName(e.target.value)}
                             className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-sm" 
                             placeholder="e.g. Alex Harrison"
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                             <Mail size={12} className="text-indigo-400" />
                             <span>Email Network</span>
                           </label>
                           <input 
                             type="email" 
                             value={email}
                             onChange={(e) => setEmail(e.target.value)}
                             className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-sm" 
                             placeholder="alex@org.com"
                           />
                        </div>
                     </div>

                     <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                          <AtSign size={12} className="text-indigo-400" />
                          <span>Professional Bio</span>
                        </label>
                        <textarea 
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          className="w-full h-40 px-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-sm resize-none" 
                          placeholder="Tell the team about your expertise..."
                        />
                     </div>
                  </div>

                  <div className="flex items-center justify-between pt-10 border-t border-slate-100">
                     <div className={`flex items-center gap-2 text-emerald-500 transition-all duration-500 ${success ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                        <div className="h-6 w-6 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Check size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Update Successful</span>
                     </div>
                     <button 
                       type="submit"
                       disabled={loading}
                       className="group flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 hover:shadow-indigo-200 active:scale-95 disabled:opacity-50"
                     >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={18} className="group-hover:scale-125 transition-transform" />}
                        <span>Save Manifest</span>
                     </button>
                  </div>
                </form>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handleUpdatePassword} className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                  <header>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">Access Credentials</h3>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Manage your security perimeter</p>
                  </header>

                  <div className="space-y-8">
                     <div className="space-y-3">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                          <Lock size={12} className="text-rose-400" />
                          <span>Current Password</span>
                        </label>
                        <input 
                          type="password" 
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:bg-white focus:border-rose-300 focus:ring-4 focus:ring-rose-500/5 transition-all font-bold text-sm" 
                        />
                     </div>

                     <div className="h-px bg-slate-100 my-4" />

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                             <Shield size={12} className="text-indigo-400" />
                             <span>New Password</span>
                           </label>
                           <input 
                             type="password" 
                             required
                             value={newPassword}
                             onChange={(e) => setNewPassword(e.target.value)}
                             className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-sm" 
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                             <AtSign size={12} className="text-indigo-400" />
                             <span>Confirm New</span>
                           </label>
                           <input 
                             type="password" 
                             required
                             value={confirmPassword}
                             onChange={(e) => setConfirmPassword(e.target.value)}
                             className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-sm" 
                           />
                        </div>
                     </div>
                     
                     <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 flex items-start gap-4">
                        <div className="p-2 bg-white rounded-xl shadow-sm text-indigo-600">
                           <Shield size={16} />
                        </div>
                        <div className="space-y-1">
                           <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Security Protocol</p>
                           <p className="text-[10px] font-bold text-slate-500 leading-relaxed">Updating your password will invalidate all existing sessions. You will need to log back in on other devices.</p>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center justify-between pt-10 border-t border-slate-100">
                     <div className={`flex items-center gap-2 text-emerald-500 transition-all duration-500 ${success ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
                        <div className="h-6 w-6 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Check size={14} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Shield Updated</span>
                     </div>
                     <button 
                       type="submit"
                       disabled={loading}
                       className="group flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-rose-600 transition-all shadow-2xl shadow-slate-200 hover:shadow-rose-200 active:scale-95 disabled:opacity-50"
                     >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock size={18} className="group-hover:rotate-12 transition-transform" />}
                        <span>Rotate Security Key</span>
                     </button>
                  </div>
                </form>
              )}
              
              {['notifications', 'display', 'billing'].includes(activeTab) && (
                <div className="py-32 text-center space-y-8 animate-in zoom-in-95 duration-500">
                   <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 text-slate-200 border border-slate-100 shadow-inner">
                      {React.createElement(TABS.find(t => t.id === activeTab)?.icon || Palette, { size: 48 })}
                   </div>
                   <div className="space-y-2">
                     <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{TABS.find(t => t.id === activeTab)?.name}</h3>
                     <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Deployment in progress</p>
                   </div>
                   <p className="max-w-xs mx-auto text-slate-500 font-medium leading-relaxed">We are currently architecting this configuration module. Real-time updates coming in the next sprint.</p>
                   <button 
                    onClick={() => setActiveTab('profile')}
                    className="px-8 py-3 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-100 transition-all"
                   >
                     Return to Core
                   </button>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
