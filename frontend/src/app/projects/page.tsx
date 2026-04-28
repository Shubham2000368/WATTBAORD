'use client';

import React, { useState, useEffect } from 'react';
import { projectService, Project } from '@/services/projectService';
import { 
  Plus, 
  Search, 
  Layout, 
  ArrowUpRight, 
  MoreVertical,
  Loader2,
  Calendar,
  Users,
  X,
  Trash2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectKey, setNewProjectKey] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setError(null);
    try {
      const newProj = await projectService.createProject({
        name: newProjectName,
        key: newProjectKey.toUpperCase(),
        description: newProjectDesc
      } as any);
      
      if (newProj) {
        setProjects([newProj, ...projects]);
        setShowCreateModal(false);
        setNewProjectName('');
        setNewProjectKey('');
        setNewProjectDesc('');
      } else {
        setError('Failed to create project. Check if the key is unique.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      const success = await projectService.deleteProject(id);
      if (success) {
        setProjects(projects.filter(p => p._id !== id));
      }
    } catch (err) {
      alert('Failed to delete project');
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.key.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Projects</h1>
          <p className="text-slate-500 font-medium">Manage and track your active projects.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 px-6 py-3 rounded-2xl text-sm font-bold text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            className="w-full pl-10 pr-4 py-2 text-sm font-medium border-none outline-none bg-transparent"
            placeholder="Search projects by name or key..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project._id} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden flex flex-col h-full">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors pointer-events-none" />
            
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                {project.key || project.name[0]}
              </div>
              {(isAdmin || project.owner?._id === user?.id) && (
                <div className="relative group/menu">
                  <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                    <MoreVertical size={18} />
                  </button>
                  <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[160px]">
                    <button 
                      onClick={() => handleDeleteProject(project._id, project.name)}
                      className="flex items-center gap-2 w-full px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Delete Project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-4 relative z-10 flex-1">
              <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">{project.name}</h3>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{project.key} Project</p>
              <p className="mt-2 text-xs text-slate-500 font-medium line-clamp-2 min-h-[2.5rem]">{project.description || 'No description provided.'}</p>
            </div>

            <div className="flex items-center gap-4 mb-6 text-[11px] font-bold text-slate-500 relative z-10">
               <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-slate-400" />
                  <span>{project.members?.length || 0} Members</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
               </div>
            </div>

            <div className="flex items-center gap-2 relative z-10">
               <Link href={`/project/${project._id}/board`} className="flex-1">
                 <button className="w-full py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all active:scale-95">
                    Open Board
                 </button>
               </Link>
               <Link href={`/project/${project._id}`} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all active:scale-95">
                  <ArrowUpRight size={18} />
               </Link>
            </div>
          </div>
        ))}

        {filteredProjects.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center">
             <div className="h-20 w-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Layout className="h-10 w-10 text-slate-300" />
             </div>
             <h3 className="text-xl font-black text-slate-900 mb-2">No Projects Found</h3>
             <p className="text-slate-500 font-medium">We couldn't find any projects matching your search.</p>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Create Project</h2>
                  <p className="text-sm text-slate-500 font-medium">Define your project goals and unique key.</p>
                </div>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in slide-in-from-top-2">
                  <AlertCircle size={18} />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Project Name</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
                    placeholder="e.g., Marketing Campaign 2026"
                    value={newProjectName}
                    onChange={(e) => {
                      setNewProjectName(e.target.value);
                      // Generate key automatically from name
                      if (!newProjectKey) {
                        setNewProjectKey(e.target.value.substring(0, 3).toUpperCase());
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Project Key (Unique)</label>
                  <input
                    required
                    type="text"
                    maxLength={10}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-black focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
                    placeholder="e.g., MST"
                    value={newProjectKey}
                    onChange={(e) => setNewProjectKey(e.target.value.toUpperCase())}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Description (Optional)</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300 resize-none"
                    placeholder="What is this project about?"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-4 text-sm font-black text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-[2] px-6 py-4 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 disabled:bg-indigo-400 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 shadow-sm" />}
                    <span>Create Project</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
