import React from 'react';
import { Ticket } from '@/services/ticketService';
import { Draggable } from '@hello-pangea/dnd';
import { AlertCircle, CheckCircle2, Bookmark, MoreHorizontal, MessageSquare, Paperclip, Sparkles } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BoardTicketProps {
  ticket: Ticket;
  index: number;
  onMoveToActiveSprint?: (ticketId: string) => void;
  cardSize?: 'compact' | 'expanded';
}

export function BoardTicket({ ticket, index, onMoveToActiveSprint, cardSize = 'compact' }: BoardTicketProps) {
  const typeIcons = {
    Task: <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />,
    Bug: <AlertCircle className="h-3.5 w-3.5 text-rose-500" />,
    Story: <Bookmark className="h-3.5 w-3.5 text-emerald-500" />,
    Subtask: <Sparkles className="h-3.5 w-3.5 text-purple-500" />,
  };

  const priorityColors = {
    High: "bg-rose-500",
    Medium: "bg-amber-500",
    Low: "bg-emerald-500"
  };

  const parentId = typeof ticket.parent === 'object' ? ticket.parent?.issueId : (typeof ticket.parent === 'string' ? ticket.parent : null);

  return (
    <Draggable draggableId={ticket._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "bg-white rounded-[14px] p-4 mb-2 border border-gray-300 shadow-sm transition-all duration-200 relative group select-none",
            snapshot.isDragging 
              ? "shadow-lg border-blue-500 ring-2 ring-blue-500/10 scale-[1.02] z-50 rotate-1 bg-white" 
              : "hover:shadow-md hover:-translate-y-[2px] hover:border-gray-400"
          )}
        >
          {/* Priority Indicator Line */}
          <div className={cn(
            "absolute left-0 top-4 bottom-4 w-1 rounded-r-full",
            priorityColors[ticket.priority as keyof typeof priorityColors] || "bg-slate-300"
          )} />

          <div className="flex flex-col h-full pl-2">
            {/* Header: ID + Actions */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                 <div className="h-6 w-6 rounded-lg bg-slate-50 flex items-center justify-center p-1 border border-slate-100">
                    {typeIcons[ticket.type as keyof typeof typeIcons] || typeIcons.Task}
                 </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ticket.issueId}</span>
                      {ticket.type !== 'Subtask' && (
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tighter",
                          ticket.type === 'Bug' ? "bg-rose-50 text-rose-500" : 
                          ticket.type === 'Story' ? "bg-emerald-500/10 text-emerald-600" : 
                          "bg-indigo-50 text-indigo-500"
                        )}>
                          {ticket.type}
                        </span>
                      )}
                    </div>
                    {ticket.type === 'Subtask' && (
                      <span className="text-[8px] font-black text-purple-400 uppercase tracking-tighter">Subtask of {parentId || 'Parent'}</span>
                    )}
                  </div>
              </div>
              <button className="text-slate-300 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100">
                <MoreHorizontal size={14} />
              </button>
            </div>

            {/* Title */}
            <Link 
              href={`/browse/${ticket.issueId}`}
              className={cn(
                "font-semibold text-slate-800 leading-[1.4] mb-3 hover:text-indigo-600 transition-colors block",
                cardSize === 'expanded' ? "text-[14px] line-clamp-3" : "text-[13.5px] line-clamp-2"
              )}
            >
              {ticket.title}
            </Link>

            {/* Description (expanded only) */}
            {cardSize === 'expanded' && ticket.description && (
              <p className="text-[12px] text-slate-400 leading-relaxed mb-3 line-clamp-2">
                {ticket.description}
              </p>
            )}

            {/* Priority label (expanded only) */}
            {cardSize === 'expanded' && (
              <div className="flex items-center gap-1.5 mb-3">
                <div className={cn(
                  "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                  ticket.priority === 'High' ? 'bg-rose-50 text-rose-600' :
                  ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                  ticket.priority === 'Blocker' ? 'bg-rose-100 text-rose-700' :
                  'bg-emerald-50 text-emerald-600'
                )}>
                  {ticket.priority}
                </div>
              </div>
            )}

            {/* Labels */}
            {ticket.labels && ticket.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {ticket.labels.slice(0, 2).map(label => (
                  <span key={label} className="px-2 py-0.5 bg-slate-100/50 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-wider border border-slate-100">
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Footer: User + Metadata */}
            <div className="flex items-center justify-between mt-auto">
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1 text-slate-400">
                    <MessageSquare size={12} />
                    <span className="text-[10px] font-bold">2</span>
                 </div>
                 <div className="flex items-center gap-1 text-slate-400">
                    <Paperclip size={12} />
                    <span className="text-[10px] font-bold">1</span>
                 </div>
              </div>
              
              {/* Multiple Assignees Stack */}
              <div className="flex -space-x-2 overflow-hidden">
                {ticket.assignees && ticket.assignees.length > 0 ? (
                  ticket.assignees.slice(0, 3).map((user, i) => (
                    <div 
                      key={user._id}
                      className="h-7 w-7 rounded-lg bg-slate-900 border-2 border-white flex items-center justify-center text-white text-[9px] font-black shadow-sm ring-1 ring-slate-100"
                      title={user?.name}
                      style={{ zIndex: 3 - i }}
                    >
                      {user?.name?.[0] || '?'}
                    </div>
                  ))
                ) : (
                  <div className="h-7 w-7 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-slate-400 text-[9px] font-black shadow-sm ring-1 ring-slate-100">
                     <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                  </div>
                )}
                {ticket.assignees && ticket.assignees.length > 3 && (
                  <div className="h-7 w-7 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 text-[8px] font-black z-0">
                    +{ticket.assignees.length - 3}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Overlay (Move to Sprint) */}
            {ticket.status === 'READY FOR SPRINT' && onMoveToActiveSprint && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToActiveSprint(ticket._id);
                }}
                className="mt-3 w-full py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 border border-indigo-100"
              >
                <span>Move to Active Sprint</span>
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
