'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  MoreVertical, 
  Trash2, 
  Loader2,
  Calendar,
  Settings,
  FolderLock,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  FolderOpen
} from 'lucide-react';
import { teamService, Team } from '@/services/teamService';
import { projectService, Project } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import { AddMembersModal } from '@/components/teams/AddMembersModal';
import { EditMemberModal } from '@/components/teams/EditMemberModal';
import Link from 'next/link';

export default function TeamDetailsPage() {
  const { teamId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<{ _id: string, name: string, email: string } | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [togglingAccess, setTogglingAccess] = useState<{ userId: string; projectId: string } | null>(null);
  const [openAccessDropdown, setOpenAccessDropdown] = useState<string | null>(null);
  const [localAccessState, setLocalAccessState] = useState<Record<string, boolean>>({});
  const [isSavingAccess, setIsSavingAccess] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number, left: number } | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const currentUserMember = team?.members.find(m => m && m.user && m.user._id === user?.id);
  const isAdmin = user?.role?.toLowerCase() === 'admin' || currentUserMember?.role?.toLowerCase() === 'admin' || team?.lead?._id === user?.id;

  useEffect(() => {
    if (teamId) {
      fetchData(true);
    }
  }, [teamId]);

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const teamData = await teamService.getTeam(teamId as string);
      setTeam(teamData);
      const allProjects = await projectService.getProjects();
      setProjects(allProjects.filter(p => (typeof p.team === 'object' && p.team !== null ? (p.team as any)._id : p.team) === teamId));
    } catch (err: any) {
      console.error('Failed to fetch data', err);
      if (showLoading) setError(err.message || 'Failed to load team data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    setRemovingMemberId(userId);
    try {
      await teamService.removeMember(team!._id, userId);
      await fetchData(false);
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      await teamService.updateMemberRole(team!._id, userId, newRole);
      await fetchData(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleSaveAccess = async (userId: string) => {
    setIsSavingAccess(true);
    try {
      const success = await projectService.bulkToggleAccess(userId, localAccessState);
      if (success) {
        await fetchData(false);
        setOpenAccessDropdown(null);
      } else {
        alert('Backend failed to save changes');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save access changes');
    } finally {
      setIsSavingAccess(false);
    }
  };

  const handleToggleProjectCreation = async () => {
    if (!team) return;
    try {
      const updatedTeam = await teamService.updateTeam(team._id, {
        allowProjectCreation: !team.allowProjectCreation
      });
      setTeam(updatedTeam);
    } catch (err: any) {
      alert(err.message || 'Failed to update team settings');
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
           <div className="relative">
             <Loader2 className="h-12 w-12 animate-spin text-indigo-600 relative z-10" />
             <div className="absolute inset-0 h-12 w-12 bg-indigo-500/10 blur-xl rounded-full" />
           </div>
           <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Team Data...</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md w-full bg-white p-12 rounded-[4rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="h-24 w-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-rose-100/50">
             <Shield size={48} />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Access Denied</h2>
            <p className="text-sm font-bold text-slate-500 leading-relaxed">{error || "This team is currently unavailable or you don't have the required permissions."}</p>
          </div>
          <div className="flex flex-col gap-4 pt-4">
            <button 
              onClick={() => fetchData(true)}
              className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-sm hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95"
            >
              Try Re-syncing
            </button>
            <Link href="/teams" className="w-full py-5 bg-slate-50 text-slate-600 rounded-3xl font-black text-sm hover:bg-slate-100 transition-all">
              Return to Teams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      {/* Dynamic Premium Header */}
      <div className="relative group">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 relative z-10">
          <div className="space-y-6">
            <Link 
              href="/teams" 
              className="group/back flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all text-xs font-black uppercase tracking-widest"
            >
              <div className="p-1.5 bg-white rounded-lg border border-slate-100 group-hover/back:border-indigo-100 group-hover/back:bg-indigo-50 transition-all shadow-sm">
                <ChevronLeft size={14} />
              </div>
              <span>Teams Hierarchy</span>
            </Link>
            
            <div className="flex items-center gap-8">
               <div className={`h-24 w-24 ${team.color || 'bg-indigo-500'} rounded-[3rem] flex items-center justify-center text-white text-4xl font-black shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] ring-4 ring-white`}>
                  {team.name[0]}
               </div>
               <div>
                  <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none mb-4">{team.name}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                     <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/40 shadow-sm">
                        <Calendar size={12} className="text-indigo-400" />
                        <span>Est. {new Date(team.createdAt).toLocaleDateString()}</span>
                     </div>
                     <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest bg-indigo-50/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm">
                        <Users size={12} />
                        <span>{team.members.length} Collaborators</span>
                     </div>
                     {isAdmin && (
                       <div className="flex items-center gap-2 text-orange-600 text-[10px] font-black uppercase tracking-widest bg-orange-50 px-4 py-2 rounded-2xl border border-orange-100 shadow-sm">
                          <Shield size={12} />
                          <span>Admin Control Active</span>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md p-3 rounded-[2.5rem] border border-white/60 shadow-xl shadow-slate-200/40 self-start lg:self-center">
               <div className="flex items-center gap-3 px-6 py-4 bg-white/60 rounded-2xl border border-white/40">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Project Creation</span>
                     <span className={`text-[10px] font-black uppercase tracking-tight ${team.allowProjectCreation ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {team.allowProjectCreation ? 'Unlocked' : 'Restricted'}
                     </span>
                  </div>
                  <button 
                    onClick={handleToggleProjectCreation}
                    className="transition-all hover:scale-110 active:scale-95 text-indigo-600"
                  >
                    {team.allowProjectCreation ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-300" />}
                  </button>
               </div>
               
               <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-3 bg-slate-900 px-10 py-4 rounded-[1.5rem] text-sm font-black text-white hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-300 hover:shadow-indigo-200 active:scale-95 hover:-translate-y-1"
               >
                  <UserPlus size={20} />
                  <span>Invite New Talent</span>
               </button>
            </div>
          )}
        </div>
        
        {/* Abstract shapes for premium feel */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-10 right-20 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-10" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        {/* Main Member Content */}
        <div className="xl:col-span-3 space-y-8">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-indigo-500 rounded-full" />
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Members</h2>
              </div>
              <div className="px-4 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200/50">
                Live Directory
              </div>
           </div>

           <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collaborator</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Scope</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {team.members.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-10 py-32 text-center">
                           <div className="max-w-xs mx-auto space-y-6">
                              <div className="h-24 w-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mx-auto border border-slate-100 shadow-inner">
                                 <Users size={40} />
                              </div>
                              <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-900">Workspace Empty</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">No active members in this team yet.</p>
                              </div>
                              {isAdmin && (
                                <button 
                                  onClick={() => setIsAddModalOpen(true)}
                                  className="px-8 py-3 bg-indigo-50 text-indigo-600 text-xs font-black rounded-2xl hover:bg-indigo-100 transition-all"
                                >
                                  Onboard First Member
                                </button>
                              )}
                           </div>
                        </td>
                      </tr>
                    ) : (
                      team.members
                        .filter(member => member && member.user)
                        .map((member, mIdx) => (
                        <tr key={member.user._id} className="group hover:bg-slate-50/50 transition-all duration-300">
                          <td className="px-10 py-6">
                            <div 
                              className={`flex items-center gap-5 transition-all ${isAdmin ? 'cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-slate-100/50 p-3 rounded-3xl -ml-3 border border-transparent hover:border-slate-100' : ''}`}
                              onClick={() => {
                                if (isAdmin) {
                                  setEditingMember({ _id: member.user._id, name: member.user.name, email: member.user.email });
                                }
                              }}
                            >
                              <div className={`h-14 w-14 ${mIdx % 2 === 0 ? 'bg-indigo-600' : 'bg-slate-900'} rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-xl shadow-slate-100 group-hover:scale-105 transition-transform`}>
                                {member.user.name?.[0] || '?'}
                              </div>
                              <div>
                                <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{member.user.name || 'Anonymous User'}</div>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                                  <Mail size={12} className="text-slate-300" />
                                  <span>{member.user.email || 'no-email@wattmonk.com'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                             {isAdmin && member.user._id !== user?.id ? (
                               <div className="relative inline-block group/select">
                                 <select
                                   value={member.role}
                                   onChange={(e) => handleUpdateRole(member.user._id, e.target.value)}
                                   className={`appearance-none cursor-pointer inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border transition-all ${
                                     member.role === 'admin' ? 'bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100' : 
                                     member.role === 'developer' ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' :
                                     member.role === 'qa' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' :
                                     'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                   }`}
                                 >
                                    <option value="member">Member</option>
                                    <option value="developer">Developer</option>
                                    <option value="qa">QA</option>
                                    <option value="admin">Admin</option>
                                 </select>
                                 <ChevronLeft size={10} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-90deg] pointer-events-none text-slate-400" />
                               </div>
                             ) : (
                               <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                 member.role === 'admin' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                                 member.role === 'developer' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                 member.role === 'qa' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                 'bg-slate-100 text-slate-600 border-slate-200'
                               }`}>
                                  <Shield size={12} />
                                  <span>{member.role}</span>
                               </div>
                             )}
                          </td>
                          <td className="px-10 py-6 min-w-[240px]">
                            {projects.length === 0 ? (
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-4 py-2 border border-slate-50 rounded-xl">Isolation Mode</span>
                            ) : (
                              <div className="relative">
                                {isAdmin && member.user._id !== user?.id ? (
                                  <>
                                    <button 
                                      ref={el => { if (el) triggerRefs.current[member.user._id] = el; }}
                                      onClick={(e) => {
                                        if (openAccessDropdown === member.user._id) {
                                          setOpenAccessDropdown(null);
                                          setDropdownPos(null);
                                        } else {
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          setDropdownPos({
                                            top: rect.bottom + window.scrollY,
                                            left: rect.left + window.scrollX
                                          });
                                          setOpenAccessDropdown(member.user._id);
                                          
                                          const initialState: Record<string, boolean> = {};
                                          projects.forEach(p => {
                                            const projMember = p.members?.find(m => {
                                              const mUserId = typeof m.user === 'string' ? m.user : m.user?._id;
                                              return String(mUserId) === String(member.user._id);
                                            });
                                            initialState[p._id] = projMember?.hasAccess ?? false;
                                          });
                                          setLocalAccessState(initialState);
                                        }
                                      }}
                                      className={`group/btn px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                                        openAccessDropdown === member.user._id 
                                        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200' 
                                        : 'bg-slate-50 text-slate-600 hover:bg-white hover:shadow-lg hover:shadow-slate-100 border border-transparent hover:border-slate-100'
                                      }`}
                                    >
                                      <FolderLock size={16} className={openAccessDropdown === member.user._id ? 'text-indigo-200' : 'text-indigo-500'} />
                                      <span>Scope ({
                                        projects.filter(p => p.members?.some(m => {
                                          const mUserId = typeof m.user === 'string' ? m.user : m.user?._id;
                                          return String(mUserId) === String(member.user._id) && m.hasAccess;
                                        })).length
                                      })</span>
                                    </button>
                                    
                                    {openAccessDropdown === member.user._id && dropdownPos && createPortal(
                                      <>
                                        <div className="fixed inset-0 z-[9998] bg-slate-900/10 backdrop-blur-[2px]" onClick={() => { setOpenAccessDropdown(null); setDropdownPos(null); }} />
                                        <div 
                                          className="absolute w-80 bg-white rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] border border-slate-100 z-[9999] p-3 overflow-visible animate-in fade-in slide-in-from-top-4 duration-300"
                                          style={{
                                            top: dropdownPos.top + 12,
                                            left: dropdownPos.left
                                          }}
                                        >
                                          <div className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-3 flex items-center justify-between">
                                            <span>Project Permissions</span>
                                            <FolderOpen size={14} />
                                          </div>
                                          <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                            {projects.map(proj => {
                                              const hasAccess = localAccessState[proj._id] ?? false;
                                              return (
                                                <label 
                                                  key={proj._id} 
                                                  className={`flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer group relative border ${hasAccess ? 'bg-indigo-50/50 border-indigo-100' : 'bg-white border-transparent hover:bg-slate-50'}`}
                                                >
                                                  <div className="flex flex-col truncate pr-3">
                                                    <span className={`text-[11px] font-black truncate ${hasAccess ? 'text-indigo-700' : 'text-slate-700'}`}>{proj.name}</span>
                                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{proj.key}</span>
                                                  </div>
                                                  <div className="flex items-center gap-3">
                                                    <div className="relative flex items-center">
                                                      <input 
                                                        type="checkbox" 
                                                        checked={hasAccess} 
                                                        onChange={(e) => setLocalAccessState(prev => ({ ...prev, [proj._id]: e.target.checked }))}
                                                        className="w-6 h-6 rounded-lg shadow-inner focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none border-2 transition-all checked:bg-indigo-600 checked:border-indigo-600 bg-slate-100 border-slate-200"
                                                      />
                                                      {hasAccess && (
                                                        <CheckCircle2 size={16} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none" />
                                                      )}
                                                    </div>
                                                  </div>
                                                </label>
                                              );
                                            })}
                                          </div>
                                          <div className="p-3 border-t border-slate-50 mt-4">
                                            <button 
                                              onClick={() => handleSaveAccess(member.user._id)}
                                              disabled={isSavingAccess}
                                              className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-100"
                                            >
                                              {isSavingAccess ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Save Manifest</>}
                                            </button>
                                          </div>
                                        </div>
                                      </>,
                                      document.body
                                    )}
                                  </>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {projects.filter(p => p.members?.some(m => (typeof m.user === 'string' ? m.user : m.user?._id) === member.user._id && m.hasAccess)).slice(0, 2).map(proj => (
                                      <span key={proj._id} className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                                        {proj.key}
                                      </span>
                                    ))}
                                    {projects.filter(p => p.members?.some(m => (typeof m.user === 'string' ? m.user : m.user?._id) === member.user._id && m.hasAccess)).length > 2 && (
                                      <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-100">
                                        +{projects.filter(p => p.members?.some(m => (typeof m.user === 'string' ? m.user : m.user?._id) === member.user._id && m.hasAccess)).length - 2} more
                                      </span>
                                    )}
                                    {projects.filter(p => p.members?.some(m => (typeof m.user === 'string' ? m.user : m.user?._id) === member.user._id && m.hasAccess)).length === 0 && (
                                      <span className="text-[9px] font-black uppercase text-slate-300 tracking-tighter">Restricted Profile</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-10 py-6 text-right">
                             {isAdmin && member.user._id !== user?.id && (
                               <button 
                                onClick={() => handleRemoveMember(member.user._id)}
                                disabled={removingMemberId === member.user._id}
                                className="h-11 w-11 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100 shadow-sm hover:shadow-rose-100/20 active:scale-90"
                               >
                                  {removingMemberId === member.user._id ? (
                                    <Loader2 size={18} className="animate-spin text-rose-500" />
                                  ) : (
                                    <Trash2 size={18} />
                                  )}
                               </button>
                             )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Premium Sidebar Content */}
        <div className="space-y-10">
           {/* Team Lead Card */}
           <div className="relative group overflow-hidden">
             <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-100 relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8 flex items-center gap-3">
                   <div className="h-1.5 w-6 bg-indigo-500 rounded-full" />
                   <span>Orchestrator</span>
                </h3>
                <div className="flex flex-col items-center text-center space-y-6">
                   <div className="relative">
                     <div className="h-28 w-28 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] flex items-center justify-center text-5xl font-black shadow-2xl ring-4 ring-white/10 group-hover:scale-105 transition-transform duration-500">
                        {team.lead?.name?.[0] || '?'}
                     </div>
                     <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-indigo-500 border-4 border-slate-900 rounded-full flex items-center justify-center shadow-xl">
                        <Shield size={16} />
                     </div>
                   </div>
                   <div className="space-y-2">
                      <div className="text-2xl font-black text-white tracking-tight">{team.lead?.name || 'Vacant Role'}</div>
                      <div className="text-xs font-bold text-indigo-300/70 tracking-tight">{team.lead?.email || 'Awaiting assignment'}</div>
                   </div>
                   
                   <div className="w-full h-px bg-white/10 my-4" />
                   
                   <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/10 backdrop-blur-sm">
                      View Lead Profile
                   </button>
                </div>
             </div>
             {/* Background glow */}
             <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 blur-[80px] transition-opacity duration-700 pointer-events-none" />
           </div>

           {/* Elegant Activity Feed */}
           <div className="bg-white/80 backdrop-blur-md border border-white rounded-[3rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Chronicle</h3>
                <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-200" />
              </div>
              <div className="space-y-10 relative">
                 {/* Timeline rail */}
                 <div className="absolute left-[3px] top-2 bottom-2 w-px bg-slate-100" />
                 
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="flex gap-6 relative group/item">
                      <div className={`h-2 w-2 mt-2 rounded-full shrink-0 z-10 transition-all duration-300 border-2 border-white ${i === 1 ? 'bg-indigo-600 scale-150 shadow-lg shadow-indigo-100' : 'bg-slate-300'}`} />
                      <div className="space-y-2">
                         <p className={`text-xs font-bold transition-colors ${i === 1 ? 'text-slate-900' : 'text-slate-500'}`}>
                           Team structure {i === 1 ? 're-optimized' : 'updated'}
                         </p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                           <Calendar size={10} />
                           {i === 1 ? 'Present Day' : `${i + 1} Cycles Ago`}
                         </p>
                      </div>
                   </div>
                 ))}
                 
                 <button className="w-full text-center text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] pt-4 hover:tracking-[0.3em] transition-all">
                   Full History
                 </button>
              </div>
           </div>
        </div>
      </div>

      {team && (
        <AddMembersModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          team={team}
          onSuccess={() => fetchData()}
        />
      )}
      
      {editingMember && (
        <EditMemberModal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          member={editingMember}
          onSuccess={() => fetchData()}
        />
      )}
    </div>
  );
}
