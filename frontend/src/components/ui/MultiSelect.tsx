'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check } from 'lucide-react';

export interface Option {
  id: string;
  label: string;
  subLabel?: string;
  avatar?: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: Option[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  loading?: boolean;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedIds,
  onChange,
  placeholder = "Select options...",
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(query.toLowerCase()) || 
    opt.subLabel?.toLowerCase().includes(query.toLowerCase())
  );

  const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div 
        onClick={() => setIsOpen(true)}
        className={`min-h-[56px] w-full bg-slate-50 border-2 transition-all cursor-text flex flex-wrap gap-2 p-2 rounded-2xl ${
          isOpen ? 'border-indigo-600 bg-white shadow-lg shadow-indigo-50' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {selectedOptions.map(opt => (
          <div 
            key={opt.id} 
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold animate-in zoom-in-90 duration-200"
          >
            <span>{opt.label}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleOption(opt.id);
              }}
              className="hover:bg-indigo-500 rounded-full p-0.5 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={selectedIds.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium px-2 min-w-[120px] text-slate-900 placeholder:text-slate-400"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in slide-in-from-top-2 duration-200 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm font-bold text-slate-400">Loading users...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="p-4 text-center text-sm font-bold text-slate-400">No users found</div>
          ) : (
            filteredOptions.map(opt => (
              <button
                key={opt.id}
                disabled={opt.disabled}
                onClick={() => {
                  toggleOption(opt.id);
                  setQuery("");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedIds.includes(opt.id) ? 'bg-indigo-50/50' : ''
                }`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black ${
                  opt.disabled ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white'
                }`}>
                  {opt.avatar ? <img src={opt.avatar} className="h-full w-full object-cover rounded-xl" /> : opt.label[0]}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-slate-900">{opt.label}</div>
                  {opt.subLabel && <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{opt.subLabel}</div>}
                </div>
                {selectedIds.includes(opt.id) && (
                  <div className="h-6 w-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <Check size={14} />
                  </div>
                )}
                {opt.disabled && (
                  <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Already in team</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
