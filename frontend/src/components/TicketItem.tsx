'use client';

import React from 'react';
import { Ticket } from '@/services/ticketService';
import { 
  CheckCircle2, 
  AlertCircle, 
  Bookmark,
  MoreHorizontal,
  ChevronDown,
  ExternalLink,
  Copy,
  Folder,
  Send
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TicketItemProps {
  ticket: Ticket;
  onUpdateStatus?: (id: string, status: Ticket['status']) => void;
  onMoveToSprint?: (id: string) => void;
}

const BACKLOG_STATUSES: Record<string, { label: string, color: string, bg: string }> = {
  'TO BE GROOMED': { label: 'To Be Groomed', color: 'text-slate-500', bg: 'bg-slate-50' },
  'GROOMED': { label: 'Groomed', color: 'text-sky-600', bg: 'bg-sky-50' },
  'READY FOR SPRINT': { label: 'Ready for Sprint', color: 'text-violet-600', bg: 'bg-violet-50' },
};

export function TicketItem({ ticket, onUpdateStatus, onMoveToSprint }: TicketItemProps) {
  const priorityColors = {
    Low: 'text-emerald-500',
    Medium: 'text-amber-500',
    High: 'text-rose-500',
    Blocker: 'text-rose-700',
  };

  const typeIcons = {
    Task: <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />,
    Bug: <AlertCircle className="h-3.5 w-3.5 text-rose-500" />,
    Story: <Bookmark className="h-3.5 w-3.5 text-emerald-500" />,
    Subtask: <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />,
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/browse/${ticket.issueId}`;
    navigator.clipboard.writeText(url);
  };

  const handleStatusCycle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onUpdateStatus) return;

    const cycle: Record<string, string> = {
      'TO BE GROOMED': 'GROOMED',
      'GROOMED': 'READY FOR SPRINT',
      'READY FOR SPRINT': 'TO BE GROOMED'
    };

    const nextStatus = cycle[ticket.status] || 'TO BE GROOMED';
    onUpdateStatus(ticket._id, nextStatus as any);
  };

  return (
    <Link 
      href={`/browse/${ticket.issueId}`}
      className="block group bg-white border border-slate-200 rounded-[12px] p-4 hover:bg-slate-50 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer relative"
    >
      {/* Title */}
      <h4 className="text-[13px] font-bold text-slate-700 mb-3 line-clamp-2 group-hover:text-slate-900 transition-colors">
        {ticket.title}
      </h4>

      {/* Meta Info */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          {/* Type Icon */}
          <div className="flex-shrink-0">
            {typeIcons[ticket.type as keyof typeof typeIcons] || typeIcons.Task}
          </div>
          
          {/* Issue ID */}
          <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">
            {ticket.issueId}
          </span>

          {/* Backlog Status Badge - Now Clickable for Cycle */}
          {BACKLOG_STATUSES[ticket.status] && (
            <button 
              onClick={handleStatusCycle}
              className={cn(
                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm transition-all hover:scale-105 active:scale-95 border",
                BACKLOG_STATUSES[ticket.status].bg, 
                BACKLOG_STATUSES[ticket.status].color,
                "border-black/5"
              )}
            >
              {BACKLOG_STATUSES[ticket.status].label}
            </button>
          )}

          {/* Folder Indicator */}
          {ticket.folder && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded-lg border border-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-500 group-hover:border-indigo-200 transition-all">
              <Folder size={10} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Priority */}
          <div className={cn("h-1.5 w-1.5 rounded-full", 
            ticket.priority === 'High' ? "bg-rose-500" : 
            ticket.priority === 'Medium' ? "bg-amber-500" : "bg-emerald-500"
          )} />

          {/* Assignee Avatar */}
          <div className="h-6 w-6 rounded-xl bg-slate-900 flex items-center justify-center border border-white shadow-sm overflow-hidden text-white">
            {ticket.assignees && ticket.assignees.length > 0 ? (
              <span className="text-[8px] font-black uppercase tracking-tighter">
                {ticket.assignees[0].name.split(' ').map(n => n[0]).join('')}
              </span>
            ) : (
              <div className="h-full w-full bg-slate-800 flex items-center justify-center">
                 <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Overlay (Hidden by default) */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1.5 translate-y-1 group-hover:translate-y-0">
         {ticket.status === 'READY FOR SPRINT' && (
           <button 
             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveToSprint?.(ticket._id); }}
             className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 transition-all animate-in zoom-in-50"
             title="Move to Sprint"
           >
             <Send size={11} />
             <span>MOVE TO SPRINT</span>
           </button>
         )}
         <button 
           onClick={handleCopyLink}
           className="p-2 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 shadow-sm transition-all"
           title="Copy Link"
         >
           <Copy size={12} />
         </button>
      </div>
    </Link>
  );
}
