'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ticketService, Ticket } from '@/services/ticketService';
import { projectService } from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config/api';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  ChevronDown,
  Loader2,
  Calendar,
  X,
  User,
  CheckCircle2,
  Circle,
  AlertOctagon,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface UserFromAPI {
  _id: string;
  name: string;
  email: string;
  role: string;
}

const STATUS_OPTIONS = ['TODO', 'IN PROGRESS', 'READY FOR QA', 'IN QA', 'BLOCKED', 'QA ACCEPTED', 'COMPLETED', 'REOPENED', 'TO BE GROOMED', 'GROOMED', 'READY FOR SPRINT', 'IN SPRINT'];
const PRIORITY_OPTIONS = ['Blocker', 'High', 'Medium', 'Low'];

const STATUS_COLORS: Record<string, string> = {
  'TODO':          'bg-slate-100 text-slate-600',
  'IN PROGRESS':   'bg-blue-100 text-blue-700',
  'READY FOR QA':  'bg-purple-100 text-purple-700',
  'IN QA':         'bg-orange-100 text-orange-700',
  'BLOCKED':       'bg-rose-100 text-rose-700',
  'QA ACCEPTED':   'bg-teal-100 text-teal-700',
  'COMPLETED':     'bg-emerald-100 text-emerald-700',
  'REOPENED':      'bg-pink-100 text-pink-700',
  'TO BE GROOMED': 'bg-slate-50 text-slate-500',
  'GROOMED':       'bg-sky-50 text-sky-600',
  'READY FOR SPRINT': 'bg-violet-50 text-violet-600',
  'IN SPRINT':     'bg-emerald-50 text-emerald-600',
};

const PRIORITY_CONFIG: Record<string, { color: string; dot: string; emoji: string }> = {
  'Blocker': { color: 'bg-red-100 text-red-800',       dot: 'bg-red-600',     emoji: '🚨' },
  'High':    { color: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500',    emoji: '🔴' },
  'Medium':  { color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500',   emoji: '🟠' },
  'Low':     { color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', emoji: '🟢' },
};

export default function MyTasksPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [allTasks, setAllTasks] = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  const [allUsers, setAllUsers]               = useState<UserFromAPI[]>([]);
  // Multi-select: Set of _id strings. Empty = show ALL (admin) or self (non-admin)
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses]   = useState<Set<string>>(new Set());
  const [selectedPriorities, setSelectedPriorities] = useState<Set<string>>(new Set());
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  /* ── Fetch users for admin filter ── */
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setAllUsers(data.data);
      } catch (e) { console.error(e); }
    })();
  }, [isAdmin]);

  /* ── Fetch ALL tickets ── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const projects = await projectService.getProjects();
        let all: Ticket[] = [];
        for (const p of projects) {
          const t = await ticketService.getTickets(p._id);
          all = [...all, ...t];
        }
        setAllTasks(all);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user]);

  /* ── Close on outside click ── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setShowFilterPanel(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Toggle helpers ── */
  const toggleMember = (id: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleStatus = (s: string) => {
    setSelectedStatuses(prev => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  };
  const togglePriority = (p: string) => {
    setSelectedPriorities(prev => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };
  const clearFilters = () => {
    setSelectedMemberIds(new Set());
    setSelectedStatuses(new Set());
    setSelectedPriorities(new Set());
  };

  /* ── Filter logic ── */
  const filteredTasks = allTasks.filter(task => {
    // --- Assignee filter ---
    if (isAdmin) {
      if (selectedMemberIds.size > 0) {
        // Show tasks assigned to ANY of the selected members
        const match = task.assignees?.some(a => selectedMemberIds.has(a._id));
        if (!match) return false;
      }
      // If no member selected → admin sees ALL tasks (no assignee filter)
    } else {
      // Non-admin always sees only their own tasks
      if (!task.assignees?.some(a => a._id === user?.id)) return false;
    }

    // --- Search ---
    if (search && !task.title.toLowerCase().includes(search.toLowerCase()) &&
        !task.issueId.toLowerCase().includes(search.toLowerCase())) return false;

    // --- Status (multi) ---
    if (selectedStatuses.size > 0 && !selectedStatuses.has(task.status)) return false;

    // --- Priority (multi) ---
    if (selectedPriorities.size > 0 && !selectedPriorities.has(task.priority)) return false;

    return true;
  });

  const activeFilterCount = selectedMemberIds.size + selectedStatuses.size + selectedPriorities.size;

  /* ── Header label ── */
  const memberLabel = () => {
    if (!isAdmin) return user?.name || 'Me';
    if (selectedMemberIds.size === 0) return 'All Team Members';
    if (selectedMemberIds.size === 1) {
      const u = allUsers.find(u => u._id === [...selectedMemberIds][0]);
      return u?.name || 'Member';
    }
    return `${selectedMemberIds.size} Members`;
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
          {isAdmin && selectedMemberIds.size === 0
            ? <><Users className="text-indigo-500" size={28} /> All Tasks</>
            : <><ClipboardList className="text-indigo-500" size={28} /> {isAdmin ? `${memberLabel()}'s Tasks` : 'My Tasks'}</>
          }
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          {isAdmin
            ? selectedMemberIds.size === 0
              ? 'Viewing all tasks across every team member and project.'
              : `Viewing tasks for: ${memberLabel()}`
            : 'All issues assigned to you across all projects.'
          }
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
            placeholder="Search tasks by ID or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilterPanel(v => !v)}
            className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-sm font-bold transition-all ${
              activeFilterCount > 0
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="h-5 w-5 bg-white/30 rounded-full text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-4 w-4 opacity-60 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
          </button>

          {/* ── Filter Panel ── */}
          {showFilterPanel && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-5 space-y-5">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Filters</h3>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1">
                      <X size={12} /> Clear All
                    </button>
                  )}
                </div>

                {/* ── Member Filter (Admin only, multi-select) ── */}
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <User size={10} /> Team Member
                      <span className="ml-auto text-[9px] text-indigo-500 font-bold normal-case tracking-normal">Multi-select</span>
                    </label>

                    {/* All Members chip */}
                    <button
                      onClick={() => setSelectedMemberIds(new Set())}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedMemberIds.size === 0
                          ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200'
                          : 'hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center">
                          <Users size={12} className="text-slate-500" />
                        </div>
                        <span>All Members</span>
                      </div>
                      {selectedMemberIds.size === 0 && <CheckCircle2 size={14} className="text-indigo-600" />}
                    </button>

                    <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {allUsers.map(u => {
                        const isSelected = selectedMemberIds.has(u._id);
                        return (
                          <button
                            key={u._id}
                            onClick={() => toggleMember(u._id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                              isSelected ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white text-[9px] font-black ${isSelected ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                {u.name[0]}
                              </div>
                              <div className="text-left">
                                <div>{u.name}</div>
                                <div className="text-[9px] text-slate-400 font-medium capitalize">{u.role}</div>
                              </div>
                            </div>
                            {isSelected
                              ? <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                              : <Circle size={14} className="text-slate-200 shrink-0" />
                            }
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Status Filter (multi-select) ── */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Circle size={10} /> Status
                    <span className="ml-auto text-[9px] text-indigo-500 font-bold normal-case tracking-normal">Multi-select</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(s => {
                      const active = selectedStatuses.has(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleStatus(s)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                            active
                              ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-indigo-300'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── Priority Filter (multi-select) ── */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <AlertOctagon size={10} /> Priority
                    <span className="ml-auto text-[9px] text-indigo-500 font-bold normal-case tracking-normal">Multi-select</span>
                  </label>
                  <div className="flex gap-2">
                    {PRIORITY_OPTIONS.map(p => {
                      const cfg = PRIORITY_CONFIG[p];
                      const active = selectedPriorities.has(p);
                      return (
                        <button
                          key={p}
                          onClick={() => togglePriority(p)}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${
                            active ? cfg.color + ' ring-2 ring-offset-1 ring-indigo-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {cfg.emoji} {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400">
                  <span className="text-indigo-600 font-black">{filteredTasks.length}</span> tasks found
                </p>
                <p className="text-[11px] font-bold text-slate-500">{memberLabel()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Active filter chips ── */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active:</span>
          {[...selectedMemberIds].map(id => {
            const u = allUsers.find(u => u._id === id);
            return (
              <span key={id} className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                <User size={10} /> {u?.name || id}
                <button onClick={() => toggleMember(id)}><X size={10} /></button>
              </span>
            );
          })}
          {[...selectedStatuses].map(s => (
            <span key={s} className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[s]}`}>
              {s} <button onClick={() => toggleStatus(s)}><X size={10} /></button>
            </span>
          ))}
          {[...selectedPriorities].map(p => (
            <span key={p} className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${PRIORITY_CONFIG[p]?.color || ''}`}>
              {PRIORITY_CONFIG[p]?.emoji} {p}
              <button onClick={() => togglePriority(p)}><X size={10} /></button>
            </span>
          ))}
        </div>
      )}

      {/* ── Task Count Bar ── */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
        <span>
          Showing <span className="text-slate-700">{filteredTasks.length}</span> tasks
          {activeFilterCount === 0 && isAdmin && <span className="text-indigo-500 ml-1">(all team members)</span>}
        </span>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-rose-500 hover:text-rose-700 flex items-center gap-1 transition-colors">
            <X size={12} /> Clear all filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Key</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Summary</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Assignees</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
              <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTasks.map(task => (
              <tr key={task._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/browse/${task.issueId}`} className="text-sm font-bold text-indigo-600 hover:underline uppercase tracking-tight">
                    {task.issueId}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-700 line-clamp-1">{task.title}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex -space-x-1.5">
                    {task.assignees?.slice(0, 3).map(a => (
                      <div key={a._id} title={a.name} className="h-6 w-6 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-white text-[9px] font-black">
                        {a.name[0]}
                      </div>
                    ))}
                    {(task.assignees?.length || 0) > 3 && (
                      <div className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 text-[9px] font-black">
                        +{(task.assignees?.length || 0) - 3}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${STATUS_COLORS[task.status] || 'bg-slate-100 text-slate-500'}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${PRIORITY_CONFIG[task.priority]?.dot || 'bg-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-600">{task.priority}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Calendar size={13} />
                    <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
                  </div>
                </td>
              </tr>
            ))}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">No tasks found</h3>
                  <p className="text-slate-500 text-sm font-medium">
                    {activeFilterCount > 0 ? 'Try adjusting or clearing your filters.' : 'No tasks have been assigned yet.'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
