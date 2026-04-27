import React, { useState, useRef, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Ticket, TicketStatus } from '@/services/ticketService';
import { BoardTicket } from './BoardTicket';
import { MoreHorizontal, Plus, SearchX, Check, X as CloseIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BoardColumnProps {
  title: string;
  status: TicketStatus;
  tickets: Ticket[];
  indicatorColor: string;
  icon?: string;
  onCreateTicket: (title: string, status: TicketStatus) => Promise<void>;
  onMoveToActiveSprint?: (ticketId: string) => void;
  cardSize?: 'compact' | 'expanded';
}

export function BoardColumn({ title, status, tickets, indicatorColor, icon, onCreateTicket, onMoveToActiveSprint, cardSize = 'compact' }: BoardColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim() || loading) return;

    setLoading(true);
    try {
      await onCreateTicket(newTitle.trim(), status);
      setNewTitle('');
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create ticket', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTitle('');
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full glass rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300",
      cardSize === 'expanded' ? 'w-[320px] min-w-[320px]' : 'w-[260px] min-w-[260px]'
    )}>
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 px-5 pt-5 pb-3 bg-white/50 backdrop-blur-md border-b border-slate-100">
        <div className={cn("absolute top-0 left-0 right-0 h-1", indicatorColor)} />
        
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <span className="text-lg">{icon}</span>
            <div className="flex flex-col">
               <h3 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">
                 {title}
               </h3>
               <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">
                 {tickets.length} {tickets.length === 1 ? 'task' : 'tasks'}
               </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
             <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAdding(true);
                }}
                className="p-1.5 hover:bg-slate-900/5 rounded-lg text-slate-500 hover:text-slate-900 transition-all"
             >
               <Plus size={16} strokeWidth={3} />
             </button>
             <button className="p-1.5 hover:bg-slate-900/5 rounded-lg text-slate-500 hover:text-slate-900 transition-all">
               <MoreHorizontal size={16} />
             </button>
          </div>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex-grow px-3 py-4 transition-colors duration-300 overflow-y-auto custom-scrollbar",
              snapshot.isDraggingOver ? "bg-indigo-50/30" : ""
            )}
          >
            {/* Inline Quick Add */}
            {isAdding && (
              <div className="mb-4 animate-in slide-in-from-top-2 duration-200">
                <div className="bg-white rounded-2xl p-3 shadow-xl border border-indigo-100">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="What needs to be done?"
                    className="w-full text-sm font-semibold text-slate-800 outline-none px-1 py-1 placeholder:text-slate-300"
                    disabled={loading}
                  />
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded">Enter ⏎</span>
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter bg-slate-50 px-1.5 py-0.5 rounded">Esc</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setIsAdding(false)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"
                      >
                        <CloseIcon size={14} />
                      </button>
                      <button 
                        onClick={() => handleAdd()}
                        disabled={!newTitle.trim() || loading}
                        className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                      >
                        <Check size={14} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tickets.length > 0 ? (
              <div className="">
                {tickets.map((ticket, index) => (
                  <BoardTicket key={ticket._id} ticket={ticket} index={index} onMoveToActiveSprint={onMoveToActiveSprint} cardSize={cardSize} />
                ))}
              </div>
            ) : !isAdding && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200/50 group/empty">
                <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4 group-hover/empty:scale-110 transition-transform duration-500">
                   <SearchX className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-black text-slate-400 tracking-tight">No issues here</p>
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mt-1">Move tasks or create new</p>
                
                <button 
                  onClick={() => setIsAdding(true)}
                  className="mt-6 flex items-center gap-2 px-4 py-2 bg-white text-slate-600 rounded-xl text-xs font-black shadow-sm border border-slate-100 opacity-0 group-hover/empty:opacity-100 transition-all duration-300 hover:bg-slate-900 hover:text-white"
                >
                  <Plus size={14} strokeWidth={3} />
                  <span>Create Issue</span>
                </button>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
