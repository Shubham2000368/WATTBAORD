import React from 'react';
import { Sprint } from '@/services/sprintService';
import { Calendar, Play, CheckCircle2, MoreVertical, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SprintItemProps {
  sprint: Sprint;
  onUpdateStatus: (id: string, status: Sprint['status']) => void;
  onDelete?: (id: string, name: string) => void;
}

export function SprintItem({ sprint, onUpdateStatus, onDelete }: SprintItemProps) {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const isPlanned = sprint.status === 'planned';
  const isActive = sprint.status === 'active';
  const isCompleted = sprint.status === 'completed';

  return (
    <div className={cn(
      "flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border rounded-2xl transition-all duration-200 gap-4",
      isActive ? "border-indigo-500 ring-1 ring-indigo-500 shadow-sm" : "border-slate-200"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2.5 rounded-xl",
          isActive ? "bg-indigo-100 text-indigo-600" : 
          isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"
        )}>
          {isActive ? <Play className="h-5 w-5 fill-current" /> : 
           isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900">{sprint.name}</h4>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
              isActive ? "bg-indigo-600 text-white" : 
              isCompleted ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
            )}>
              {sprint.status}
            </span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isPlanned && (
          <button
            onClick={() => onUpdateStatus(sprint._id, 'active')}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100"
          >
            Start Sprint
          </button>
        )}
        
        {isActive && (
          <button
            onClick={() => onUpdateStatus(sprint._id, 'completed')}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-100"
          >
            Complete Sprint
          </button>
        )}
        
        {isAdmin && (
          <div className="relative group/menu">
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
              <MoreVertical className="h-5 w-5" />
            </button>
            
            <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[160px]">
              {isPlanned && (
                <button 
                  onClick={() => onUpdateStatus(sprint._id, 'active')}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  <Play size={14} />
                  <span>Start Sprint</span>
                </button>
              )}
              {isActive && (
                <button 
                  onClick={() => onUpdateStatus(sprint._id, 'completed')}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <CheckCircle2 size={14} />
                  <span>Complete Sprint</span>
                </button>
              )}
              <button 
                onClick={() => onDelete?.(sprint._id, sprint.name)}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100"
              >
                <Trash2 size={14} />
                <span>Delete Sprint</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
