'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  sprintService, 
  Sprint 
} from '@/services/sprintService';
import { 
  ticketService, 
  Ticket, 
  TicketStatus 
} from '@/services/ticketService';
import { KanbanBoard } from '@/components/KanbanBoard';
import { 
  Loader2, 
  ArrowLeft, 
  Target, 
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useSidebar } from '@/context/SidebarContext';

export default function SprintBoardPage() {
  const { sprintId } = useParams();
  const router = useRouter();
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoardData = useCallback(async () => {
    if (!sprintId) return;
    setLoading(true);
    try {
      const sprintData = await sprintService.getSprint(sprintId as string);
      if (!sprintData) {
        setError('Sprint not found');
        return;
      }
      setSprint(sprintData);

      const ticketData = await ticketService.getTickets(sprintData.project, sprintId as string);
      setTickets(ticketData);
    } catch (err) {
      setError('Failed to load board data');
    } finally {
      setLoading(false);
    }
  }, [sprintId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const handleTicketUpdate = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      await ticketService.updateTicket(ticketId, { status: newStatus });
    } catch (err: any) {
      throw err;
    }
  };

  const handleTicketCreate = async (title: string, status: TicketStatus) => {
    if (!sprint) return;
    try {
      const projectId = typeof sprint.project === 'string' ? sprint.project : (sprint.project as any)._id;
      const newTicket = await ticketService.createTicket(projectId, {
        title,
        status,
        sprint: sprint._id as any,
        priority: 'Medium',
        type: 'Task'
      });
      if (newTicket) {
        setTickets(prev => [newTicket, ...prev]);
      }
    } catch (err: any) {
      console.error('Failed to create ticket', err);
      throw err;
    }
  };

  const handleCompleteSprint = async () => {
    if (!sprint) return;
    if (!window.confirm('Are you sure you want to complete this sprint? Incomplete tasks will move to the backlog.')) return;

    try {
      await sprintService.completeSprint(sprint._id);
      router.push('/sprints');
    } catch (err) {
      setError('Failed to complete sprint');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !sprint) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Error</h2>
          <p className="text-slate-500 mb-6">{error || 'Sprint not found'}</p>
          <button onClick={() => router.back()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#F4F5F7]">
      {/* Board Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/sprints" className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <Target size={16} className="text-indigo-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tighter">{sprint.name}</h1>
             </div>
             <div className="h-4 w-px bg-slate-200" />
             <div className="flex items-center gap-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                   <Calendar size={12} />
                   <span>{new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <div className="text-indigo-600 uppercase">{sprint.status}</div>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           {sprint.status === 'active' && (
             <button 
               onClick={handleCompleteSprint}
               className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
             >
               <CheckCircle2 size={16} />
               <span>Complete Sprint</span>
             </button>
           )}
        </div>
      </header>

      {/* Board Content */}
      <main className="flex-1 overflow-hidden p-4">
        <KanbanBoard 
          initialTickets={tickets} 
          onTicketUpdate={handleTicketUpdate} 
          onCreateTicket={handleTicketCreate}
        />
      </main>
    </div>
  );
}
