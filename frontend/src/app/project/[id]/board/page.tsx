'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Project, projectService } from '@/services/projectService';
import { Ticket, ticketService } from '@/services/ticketService';
import { Sprint, sprintService } from '@/services/sprintService';
import { KanbanBoard } from '@/components/KanbanBoard';
import { 
  ArrowLeft, 
  Layout, 
  Loader2, 
  Target, 
  AlertCircle,
  Filter,
  Plus,
  MoreVertical,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

export default function BoardPage() {
  const { id } = useParams();
  const { user, token, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const searchParams = useSearchParams();
  const [selectedSprint, setSelectedSprint] = useState<string>(searchParams.get('sprint') || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const router = useRouter();

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [projData, ticketData, sprintData] = await Promise.all([
        projectService.getProject(id as string),
        ticketService.getTickets(id as string),
        sprintService.getSprints(id as string)
      ]);
      setProject(projData);
      setTickets(ticketData);
      setSprints(sprintData);

      // Auto-select active sprint only if no sprint param in URL at load time
      const sprintParam = searchParams.get('sprint');
      if (!sprintParam) {
        const active = sprintData.find(s => s.status === 'active');
        if (active) setSelectedSprint(active._id);
      }
      
    } catch (err) {
      setError('Failed to load board data');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Sync selectedSprint with URL param changes (e.g. sidebar backlog click)
  useEffect(() => {
    const sprintParam = searchParams.get('sprint');
    if (sprintParam) {
      setSelectedSprint(sprintParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    } else if (token) {
      loadData();
    }
  }, [token, authLoading, router, loadData]);

  const handleUpdateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    try {
      await ticketService.updateTicket(ticketId, { status });
      // In a real app, we might just trust the optimistic update in KanbanBoard
    } catch (err) {
      setError('Failed to update ticket status on server');
    }
  };

  const handleMoveToActiveSprint = async (ticketId: string) => {
    const active = sprints.find(s => s.status === 'active');
    if (!active) {
      setError('No active sprint found');
      return;
    }
    try {
      const updated = await ticketService.updateTicket(ticketId, {
        sprint: active._id as any,
        folder: null as any,
        status: 'TODO'
      });
      if (updated) {
        setTickets(tickets.map(t => t._id === ticketId ? updated : t));
      }
    } catch (err) {
      setError('Failed to move ticket to active sprint');
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        const success = await projectService.deleteProject(project._id);
        if (success) {
          router.push('/dashboard');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete project');
      }
    }
  };

  const BACKLOG_SPRINT_STATUSES = ['TO BE GROOMED', 'GROOMED', 'READY FOR SPRINT', 'IN SPRINT'];

  const filteredTickets = selectedSprint === 'all' 
    ? tickets 
    : selectedSprint === 'backlog'
    ? tickets
        .filter(t => !t.sprint)
        .map(t => ({
          ...t,
          // If ticket has a non-backlog status, normalize it to TO BE GROOMED
          status: BACKLOG_SPRINT_STATUSES.includes(t.status) ? t.status : 'TO BE GROOMED'
        }))
    : tickets.filter(t => t.sprint?._id === selectedSprint);

  const backlogColumns = [
    { status: 'TO BE GROOMED', title: 'To Be Groomed', color: 'bg-slate-400', icon: '📋' },
    { status: 'GROOMED', title: 'Groomed', color: 'bg-blue-500', icon: '💎' },
    { status: 'READY FOR SPRINT', title: 'Ready for Sprint', color: 'bg-purple-600', icon: '🚀' }
  ];

  if (authLoading || (loading && !project)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 shrink-0 shadow-sm z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/project/${id}`} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
               <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                <Layout className="h-3 w-3" />
                <span>Projects</span>
                <span>/</span>
                <span className="text-indigo-600">{project?.name}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-none">Kanban Board</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 shadow-inner">
                <Target className="h-4 w-4 text-slate-500" />
                <select 
                  className="bg-transparent text-sm font-bold text-slate-700 outline-none pr-4 cursor-pointer"
                  value={selectedSprint}
                  onChange={(e) => setSelectedSprint(e.target.value)}
                >
                  <option value="all">All Issues</option>
                  <option value="backlog">Product Backlog</option>
                  {sprints.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.status === 'active' ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
             </div>
             
             <button className="hidden sm:flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                <Plus className="h-4 w-4" />
                <span>Add Issue</span>
             </button>

              {user?.role === 'admin' && (
                <div className="relative group">
                  <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-xl transition-all">
                    <MoreVertical size={20} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    <button 
                      onClick={handleDeleteProject}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 size={16} />
                      <span>Delete Project</span>
                    </button>
                  </div>
                </div>
              )}
          </div>
        </div>
      </header>

      {/* Board Layout */}
      <main className="flex-grow p-6 overflow-hidden">
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 animate-in slide-in-from-top">
            <AlertCircle className="h-4 w-4" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        )}

        <div className="h-full">
           {loading ? (
             <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
             </div>
           ) : (
             <KanbanBoard 
                initialTickets={filteredTickets as any} 
                onTicketUpdate={handleUpdateTicketStatus}
                onCreateTicket={async (title, status) => {
                  try {
                    await ticketService.createTicket(id as string, {
                      title,
                      status: selectedSprint === 'backlog' ? 'TO BE GROOMED' : status,
                      sprint: selectedSprint !== 'backlog' && selectedSprint !== 'all' ? selectedSprint : undefined,
                    });
                    await loadData();
                  } catch (err) {
                    setError('Failed to create ticket');
                  }
                }}
                customColumns={selectedSprint === 'backlog' ? backlogColumns as any : undefined}
                onMoveToActiveSprint={sprints.some(s => s.status === 'active') ? handleMoveToActiveSprint : undefined}
             />
           )}
        </div>
      </main>
    </div>
  );
}
