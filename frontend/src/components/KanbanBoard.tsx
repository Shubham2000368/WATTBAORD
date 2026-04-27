'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Ticket, TicketStatus } from '@/services/ticketService';
import { BoardColumn } from './BoardColumn';
import { AlertCircle, X, Sparkles, LayoutList, LayoutGrid } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KanbanBoardProps {
  initialTickets: Ticket[];
  onTicketUpdate: (ticketId: string, newStatus: TicketStatus) => void;
  onCreateTicket: (title: string, status: TicketStatus) => Promise<void>;
  customColumns?: { status: TicketStatus; title: string; color: string; icon: string }[];
  customTransitions?: Record<TicketStatus, TicketStatus[]>;
  onMoveToActiveSprint?: (ticketId: string) => void;
}

const DEFAULT_COLUMNS: { status: TicketStatus; title: string; color: string; icon: string }[] = [
  { status: 'TODO', title: 'To Do', color: 'bg-slate-500', icon: '📝' },
  { status: 'IN PROGRESS', title: 'In Progress', color: 'bg-blue-500', icon: '⚡' },
  { status: 'READY FOR QA', title: 'Ready for QA', color: 'bg-purple-500', icon: '🔬' },
  { status: 'IN QA', title: 'In QA', color: 'bg-orange-500', icon: '🔍' },
  { status: 'REOPENED', title: 'Reopened', color: 'bg-pink-500', icon: '🔄' },
  { status: 'BLOCKED', title: 'Blocked', color: 'bg-rose-600', icon: '🛑' },
  { status: 'QA ACCEPTED', title: 'QA Accepted', color: 'bg-teal-500', icon: '✔️' },
  { status: 'COMPLETED', title: 'Completed', color: 'bg-emerald-500', icon: '✅' },
];

const DEFAULT_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  'TODO': ['IN PROGRESS'],
  'IN PROGRESS': ['READY FOR QA', 'BLOCKED'],
  'READY FOR QA': ['IN QA'],
  'IN QA': ['QA ACCEPTED', 'REOPENED'],
  'QA ACCEPTED': ['COMPLETED', 'REOPENED'],
  'REOPENED': ['IN PROGRESS'],
  'BLOCKED': ['IN PROGRESS'],
  'COMPLETED': [],
  // Backlog transitions
  'TO BE GROOMED': ['GROOMED'],
  'GROOMED': ['READY FOR SPRINT', 'TO BE GROOMED'],
  'READY FOR SPRINT': ['GROOMED', 'IN SPRINT']
};

export function KanbanBoard({ initialTickets, onTicketUpdate, onCreateTicket, customColumns, customTransitions, onMoveToActiveSprint }: KanbanBoardProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [error, setError] = useState<string | null>(null);
  const [pendingBlocked, setPendingBlocked] = useState<{ id: string, status: TicketStatus } | null>(null);
  const [blockedReason, setBlockedReason] = useState('');
  const [onlyParents, setOnlyParents] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'All' | 'Task' | 'Bug' | 'Story' | 'Subtask'>('All');
  const [cardSize, setCardSize] = useState<'compact' | 'expanded'>('compact');
  
  const columns = customColumns || DEFAULT_COLUMNS;
  const transitions = customTransitions || DEFAULT_TRANSITIONS;

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TicketStatus;
    const oldStatus = source.droppableId as TicketStatus;

    const allowed = transitions[oldStatus];
    if (!allowed?.includes(newStatus)) {
      setError(`Invalid transition: ${oldStatus} to ${newStatus}`);
      return;
    }

    if (newStatus === 'BLOCKED') {
      setPendingBlocked({ id: draggableId, status: newStatus });
      return;
    }

    handleUpdate(draggableId, newStatus);
  };

  const handleUpdate = async (id: string, status: TicketStatus, descriptionAddon = '') => {
    const updatedTickets = [...tickets];
    const ticketIndex = updatedTickets.findIndex(t => t._id === id);
    
    if (ticketIndex !== -1) {
      const originalDescription = updatedTickets[ticketIndex].description || '';
      updatedTickets[ticketIndex] = {
        ...updatedTickets[ticketIndex],
        status: status,
        description: descriptionAddon ? `${originalDescription}\n\n[BLOCKER REASON]: ${descriptionAddon}` : originalDescription
      };
      setTickets(updatedTickets);

      try {
        await onTicketUpdate(id, status);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to update ticket');
        setTickets(initialTickets);
      }
    }
  };

  const confirmBlocked = () => {
    if (pendingBlocked) {
      handleUpdate(pendingBlocked.id, pendingBlocked.status, blockedReason);
      setPendingBlocked(null);
      setBlockedReason('');
    }
  };

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter(t => {
      if (t.status !== status) return false;

      const isSubtask = t.type === 'Subtask' || !!t.parent;

      if (onlyParents && isSubtask) return false;
      if (!showSubtasks && isSubtask) return false;

      // Type filter
      if (typeFilter !== 'All' && t.type !== typeFilter) return false;

      return true;
    });
  };

  return (
    <div className="h-full flex flex-col font-sans select-none">
      {/* Blocked Reason Modal */}
      {pendingBlocked && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300 border border-slate-100">
              <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6">
                <AlertCircle className="h-8 w-8 text-rose-500" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tighter">Issue Blocked</h3>
              <p className="text-slate-500 mb-8 font-medium leading-relaxed">Provide a clear reason why this task cannot proceed. This will be added to the issue description.</p>
              <textarea 
                className="w-full h-32 p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 transition-all text-sm mb-8 font-medium placeholder:text-slate-400"
                placeholder="Ex: Waiting for designs, API not ready..."
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
              />
              <div className="flex gap-4">
                 <button 
                  onClick={() => setPendingBlocked(null)}
                  className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                 >
                   Cancel
                 </button>
                 <button 
                  onClick={confirmBlocked}
                  disabled={!blockedReason.trim()}
                  className="flex-1 px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50 disabled:shadow-none active:scale-95"
                 >
                   Confirm
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="glass px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border-rose-100">
            <div className="h-8 w-8 bg-rose-500 rounded-xl flex items-center justify-center">
              <X className="h-4 w-4 text-white" />
            </div>
            <div className="flex-grow">
               <p className="text-sm font-black text-slate-900 leading-none mb-0.5">Restriction</p>
               <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="px-6 py-3 flex items-center gap-4 border-b border-slate-100 bg-white/60 backdrop-blur-sm sticky top-0 z-10 shrink-0">
         {/* Unified Dropdown Filter */}
         <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">Filter</span>
            <div className="relative group">
               <select
                 value={
                   onlyParents ? 'parents' :
                   (typeFilter === 'Subtask' && showSubtasks) ? 'subtasks' :
                   typeFilter
                 }
                 onChange={(e) => {
                   const val = e.target.value;
                   if (val === 'parents') {
                     setOnlyParents(true);
                     setShowSubtasks(false);
                     setTypeFilter('All');
                   } else if (val === 'subtasks') {
                     setOnlyParents(false);
                     setShowSubtasks(true);
                     setTypeFilter('Subtask');
                   } else {
                     setOnlyParents(false);
                     setShowSubtasks(true);
                     setTypeFilter(val as any);
                   }
                 }}
                 className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-10 text-xs font-bold text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer min-w-[160px]"
               >
                 <option value="All">🗂 All Issues</option>
                 <option value="parents">📦 Parents Only</option>
                 <option value="subtasks">✨ Subtasks Only</option>
                 <option value="Task">✅ Tasks Only</option>
                 <option value="Bug">🐛 Bugs Only</option>
                 <option value="Story">📖 Stories Only</option>
               </select>
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 flex items-center justify-center">
                 <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
               </div>
            </div>
         </div>

         <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
               <Sparkles size={11} className="text-purple-400" />
               <span>{tickets.filter(t => t.type === 'Subtask' || !!t.parent).length} Subtasks</span>
            </div>
            {/* Card Size Toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
              <button
                onClick={() => setCardSize('compact')}
                title="Compact view"
                className={`p-1.5 rounded-lg transition-all ${
                  cardSize === 'compact'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutList size={14} />
              </button>
              <button
                onClick={() => setCardSize('expanded')}
                title="Expanded view"
                className={`p-1.5 rounded-lg transition-all ${
                  cardSize === 'expanded'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid size={14} />
              </button>
            </div>
            <div className="flex items-center gap-1.5 pr-1">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live</span>
            </div>
         </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-grow overflow-x-auto pb-8 custom-scrollbar scroll-smooth">
          <div className="flex h-full p-4 gap-4 min-w-max">
            {columns.map((col) => (
              <BoardColumn 
                key={col.status}
                title={col.title} 
                status={col.status} 
                tickets={getTicketsByStatus(col.status)}
                indicatorColor={col.color}
                icon={col.icon}
                onCreateTicket={onCreateTicket}
                onMoveToActiveSprint={onMoveToActiveSprint}
                cardSize={cardSize}
              />
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}
