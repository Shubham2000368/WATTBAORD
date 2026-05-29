import React from 'react';
import { UserBasic } from '@/services/ticketService';

interface MentionDropdownProps {
  users: UserBasic[];
  onSelect: (user: UserBasic) => void;
  activeIndex: number;
}

export const MentionDropdown: React.FC<MentionDropdownProps> = ({ users, onSelect, activeIndex }) => {
  if (users.length === 0) return null;

  return (
    <div className="absolute z-50 bottom-full mb-2 left-0 w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl p-2 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
        Team Members
      </div>
      {users.map((u, i) => (
        <button
          key={u._id}
          type="button"
          onClick={() => onSelect(u)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${
            i === activeIndex ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="h-6 w-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black uppercase shrink-0">
            {u.name ? u.name[0] : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate leading-tight">{u.name || u.email}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{u.email}</p>
          </div>
        </button>
      ))}
    </div>
  );
};
