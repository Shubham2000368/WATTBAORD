'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  Project, 
  projectService 
} from '@/services/projectService';
import { 
  Ticket, 
  ticketService 
} from '@/services/ticketService';
import { useAuth } from '@/context/AuthContext';
import { 
  Layout, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  Activity,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

const COLORS = ['#94a3b8', '#3b82f6', '#a855f7', '#f97316', '#e11d48', '#10b981', '#ec4899'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTickets: 0,
    completedTickets: 0,
    pendingTickets: 0
  });
  const [statusData, setStatusData] = useState<any[]>([]);
  const [projectBreakdown, setProjectBreakdown] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const ALL_STATUSES = ['TO BE GROOMED', 'GROOMED', 'READY FOR SPRINT', 'TODO', 'IN PROGRESS', 'READY FOR QA', 'IN QA', 'QA ACCEPTED', 'REOPENED', 'BLOCKED', 'COMPLETED'];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const projData = await projectService.getProjects();
        setProjects(projData);

        let allTickets: Ticket[] = [];
        const breakdown = [];

        for (const p of projData) {
          const t = await ticketService.getTickets(p._id);
          allTickets = [...allTickets, ...t];
          
          const pCounts: Record<string, number> = {};
          ALL_STATUSES.forEach(s => pCounts[s] = 0);
          t.forEach(ticket => {
             pCounts[ticket.status] = (pCounts[ticket.status] || 0) + 1;
          });
          
          breakdown.push({
            id: p._id,
            name: p.name,
            key: p.key,
            counts: pCounts,
            total: t.length
          });
        }
        
        setProjectBreakdown(breakdown);

        const completed = allTickets.filter(t => t.status === 'COMPLETED').length;
        const pending = allTickets.length - completed;

        setStats({
          totalProjects: projData.length,
          totalTickets: allTickets.length,
          completedTickets: completed,
          pendingTickets: pending
        });

        // Charts Data - Ensure all statuses are present
        const counts: Record<string, number> = {};
        ALL_STATUSES.forEach(s => counts[s] = 0);
        allTickets.forEach(t => {
          counts[t.status] = (counts[t.status] || 0) + 1;
        });

        const statusChartData = ALL_STATUSES.map(s => ({ 
          name: s, 
          value: counts[s] 
        }));
        setStatusData(statusChartData);

        // My Tasks (Assigned to current user)
        const assigned = allTickets.filter(t => 
          t.assignees?.some(a => (typeof a === 'string' ? a : a._id) === user?.id) ||
          t.assignee?._id === user?.id
        );
        setMyTasks(assigned);

      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
      // Live sync every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Dashboard</h1>
          <p className="text-slate-500 font-medium">Welcome back, {user?.name || 'User'}. Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
           <Clock className="h-3 w-3" />
           <span>Last synced: Just now</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Projects" value={stats.totalProjects} icon={<Layout className="text-indigo-600" />} />
        <StatCard title="Total Tickets" value={stats.totalTickets} icon={<ClipboardList className="text-blue-600" />} />
        <StatCard title="Completed" value={stats.completedTickets} icon={<CheckCircle className="text-emerald-600" />} />
        <StatCard title="Pending" value={stats.pendingTickets} icon={<Activity className="text-rose-600" />} />
      </div>

      {/* Project Health Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-indigo-500" />
           <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Project Health</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectBreakdown.map(proj => (
            <Link key={proj.id} href={`/project/${proj.id}`} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 flex-shrink-0 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black group-hover:bg-indigo-600 transition-colors text-xs overflow-hidden">
                      {proj.key ? proj.key.substring(0, 3).toUpperCase() : proj.name.substring(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 tracking-tight">{proj.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{proj.total} Tickets</p>
                    </div>
                 </div>
                 <ArrowUpRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                 <MiniStatus count={proj.counts.TODO} label="TODO" color="bg-slate-400" />
                 <MiniStatus count={proj.counts['IN PROGRESS']} label="PROG" color="bg-blue-500" />
                 <MiniStatus count={proj.counts['IN QA']} label="QA" color="bg-orange-500" />
                 <MiniStatus count={proj.counts.COMPLETED} label="DONE" color="bg-emerald-500" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
             <div className="h-3 w-3 rounded-full bg-purple-500" />
             Tickets by Status
           </h3>
            <div className="h-[300px] w-full min-h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={statusData.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
             <div className="h-3 w-3 rounded-full bg-blue-500" />
             Progress Overview
           </h3>
            <div className="h-[300px] w-full min-h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} 
                    interval={0}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#cbd5e1' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc', radius: 10 }} 
                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={30}>
                     {statusData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* My Tasks */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">My Assigned Tasks</h3>
            <Link href="/tasks" className="px-4 py-2 bg-slate-50 text-[10px] font-black text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all uppercase tracking-widest">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Issue</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {myTasks.length > 0 ? myTasks.map(ticket => (
                  <tr key={ticket._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <Link href={`/browse/${ticket.issueId}`} className="text-sm font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-tight">
                        {ticket.issueId}
                      </Link>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-700 truncate max-w-[400px]">{ticket.title}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100/80 text-slate-500 text-[10px] font-black rounded-lg uppercase tracking-widest border border-slate-200/50">
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          <div className={cn("h-2.5 w-2.5 rounded-full shadow-sm", tIdx(ticket.priority))} />
                          <span className="text-[11px] font-black text-slate-500 uppercase">{ticket.priority}</span>
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center">
                       <div className="flex flex-col items-center gap-2 opacity-20">
                          <CheckCircle size={40} />
                          <p className="text-sm font-bold uppercase tracking-widest">Clear for now</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStatus({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className="bg-slate-50/50 rounded-2xl p-2 border border-slate-100 text-center">
       <div className={cn("h-1 w-full rounded-full mb-1.5", color)} />
       <p className="text-xs font-black text-slate-900 leading-none">{count}</p>
       <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-1">{label}</p>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-start justify-between group hover:shadow-md transition-all">
      <div>
        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</h4>
        <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
        {icon}
      </div>
    </div>
  );
}

function tIdx(p: string) {
  if (p === 'High') return 'bg-rose-500';
  if (p === 'Medium') return 'bg-amber-500';
  return 'bg-emerald-500';
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
