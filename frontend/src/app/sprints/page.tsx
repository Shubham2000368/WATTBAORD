'use client';

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Plus, 
  ArrowRight,
  Loader2,
  Calendar
} from 'lucide-react';
import { sprintService, Sprint } from '@/services/sprintService';
import { projectService } from '@/services/projectService';
import Link from 'next/link';

export default function SprintsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllSprints = async () => {
      setLoading(true);
      try {
        const projects = await projectService.getProjects();
        let aggregatedSprints: Sprint[] = [];
        for (const p of projects) {
          const s = await sprintService.getSprints(p._id);
          aggregatedSprints = [...aggregatedSprints, ...s];
        }
        setSprints(aggregatedSprints);
      } catch (err) {
        console.error('Failed to fetch sprints', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllSprints();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Sprints</h1>
          <p className="text-slate-500 font-medium">Plan and track your team's velocity and goals.</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 shrink-0">
          <Plus className="h-4 w-4" />
          <span>New Sprint</span>
        </button>
      </div>

      <div className="space-y-6">
        {sprints.length > 0 ? sprints.map((sprint) => (
          <div key={sprint._id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-100 transition-all group">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
               <div className="flex items-start gap-4 flex-grow">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    sprint.status === 'active' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 
                    sprint.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Target size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">{sprint.name}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${
                        sprint.status === 'active' ? 'bg-indigo-100 text-indigo-600' : 
                        sprint.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {sprint.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium line-clamp-1">Sprint from project aggregation</p>
                  </div>
               </div>

               <div className="flex flex-wrap items-center gap-8 lg:min-w-[400px]">
                  <div className="flex items-center gap-6 ml-auto">
                     <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duration</p>
                        <p className="text-xs font-bold text-slate-700">
                          {new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}
                        </p>
                     </div>
                     <Link href={`/sprints/${sprint._id}/board`}>
                        <button className="h-10 w-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                           <ArrowRight size={18} />
                        </button>
                     </Link>
                  </div>
               </div>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center">
             <div className="h-20 w-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Target className="h-10 w-10 text-slate-300" />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">No Sprints Found</h3>
             <p className="text-slate-500 font-medium">Create a project and add a sprint to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
