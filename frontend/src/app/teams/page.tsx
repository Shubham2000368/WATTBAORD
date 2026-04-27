'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Shield, 
  MoreHorizontal,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { teamService, Team } from '@/services/teamService';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await teamService.getTeams();
      setTeams(data);
    } catch (error) {
      console.error('Failed to fetch teams', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
     return (
       <div className="flex h-[80vh] items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
       </div>
     );
  }

  return (
    <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Premium Header */}
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
              Teams
            </h1>
            <p className="text-lg text-slate-500 font-medium tracking-tight">
              Manage permissions and collaborate across your organization.
            </p>
          </div>
          
          {isAdmin && (
            <button className="flex items-center gap-2 bg-slate-900 px-8 py-4 rounded-2xl text-sm font-black text-white hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 hover:-translate-y-1 active:scale-95 shrink-0 group">
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>Create New Team</span>
            </button>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10" />
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teams.map((team, idx) => (
          <div 
            key={team._id} 
            className="group relative bg-white/70 backdrop-blur-xl border border-white rounded-[3rem] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] hover:shadow-[0_48px_80px_-24px_rgba(79,70,229,0.12)] hover:border-indigo-200 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${team.color || 'bg-indigo-500'} opacity-[0.03] rounded-bl-[5rem] group-hover:opacity-[0.08] transition-opacity duration-500`} />
            
            <div className="flex items-start justify-between mb-10 relative z-10">
               <div className={`h-16 w-16 ${team.color || 'bg-indigo-500'} rounded-[2rem] flex items-center justify-center text-white text-2xl font-black shadow-2xl shadow-indigo-200 group-hover:scale-110 transition-transform duration-500`}>
                  {team.name[0]}
               </div>
               
               {isAdmin && (
                 <button 
                  onClick={async () => {
                    if (confirm('Delete this team?')) {
                      try {
                        await teamService.deleteTeam(team._id);
                        fetchTeams();
                      } catch (err) {
                        alert('Could not delete team');
                      }
                    }
                  }}
                  className="p-3 bg-slate-50 hover:bg-rose-50 rounded-2xl text-slate-400 hover:text-rose-500 transition-colors"
                 >
                    <MoreHorizontal size={20} />
                 </button>
               )}
            </div>

            <div className="mb-10 relative z-10">
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-indigo-600 transition-colors">{team.name}</h3>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${team._id === user?.team ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                   {team._id === user?.team ? 'My Team' : 'Guest'}
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                   <Shield size={12} className="text-indigo-400" />
                   Permissions Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
               <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Team Lead</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{team.lead?.name || 'Unassigned'}</p>
               </div>
               <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Members</p>
                  <div className="flex items-center gap-2">
                     <span className="text-sm font-black text-slate-800">{team.members?.length || 0}</span>
                     <Users size={14} className="text-slate-300" />
                  </div>
               </div>
            </div>

            <Link 
              href={`/teams/${team._id}`}
              className="w-full flex items-center justify-between px-6 py-4 bg-slate-900 group-hover:bg-indigo-600 text-white text-sm font-black rounded-2xl transition-all shadow-xl shadow-slate-100 group-hover:shadow-indigo-200 active:scale-95"
            >
               <span>Team Dashboard</span>
               <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ))}

        {isAdmin && (
          <div className="group relative border-4 border-dashed border-slate-200 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center hover:bg-white hover:border-indigo-300 transition-all cursor-pointer overflow-hidden">
             <div className="h-20 w-20 bg-slate-100 rounded-[2.5rem] flex items-center justify-center text-slate-400 mb-6 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:rotate-12 transition-all duration-500">
                <Plus size={32} />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Create Workspace</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[200px] leading-relaxed">Expand your team and manage new initiatives</p>
             
             {/* Hover Glow */}
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-all duration-700 pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}
