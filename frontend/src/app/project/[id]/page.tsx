'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Project, projectService } from '@/services/projectService';
import { Sprint, sprintService } from '@/services/sprintService';
import { Ticket, ticketService } from '@/services/ticketService';
import { SprintItem } from '@/components/SprintItem';
import { TicketItem } from '@/components/TicketItem';
import { KanbanBoard } from '@/components/KanbanBoard';
import { API_BASE_URL } from '@/config/api';
import { 
  ArrowLeft, 
  Calendar, 
  Settings, 
  Plus, 
  Loader2, 
  Target, 
  AlertCircle,
  Layout,
  Ticket as TicketIcon,
  Filter,
  User as UserIcon,
  Tag,
  MoreVertical,
  Trash2,
  Users,
  X,
  Mail,
  UserPlus,
  Shield,
  Folder,
  FolderPlus,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProjectPage() {
  const { id } = useParams();
  const { token, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const currentFolderId = searchParams.get('folder');
  
  const selectedFolder = project?.folders?.find(f => f._id === currentFolderId);
  const isBacklogFolder = selectedFolder?.name.toLowerCase().includes('backlog');

  const filteredTickets = tickets.filter(t => {
    // If it's the backlog folder, show everything that is NOT in a sprint
    if (isBacklogFolder) {
      return !t.sprint;
    }
    
    if (!currentFolderId) return true;
    const tFolderId = typeof t.folder === 'string' ? t.folder : t.folder?._id;
    return tFolderId === currentFolderId;
  });
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [error, setError] = useState('');
  
  // New Sprint Form State
  const [newSprintName, setNewSprintName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Auto-calculate end date (14 days from start date)
  useEffect(() => {
    if (startDate) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + 14);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setEndDate(`${year}-${month}-${day}`);
    }
  }, [startDate]);

  // New Ticket Form State
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDesc, setNewTicketDesc] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Blocker'>('Medium');
  const [newTicketType, setNewTicketType] = useState<'Task' | 'Bug' | 'Story'>('Task');
  const [newTicketSprint, setNewTicketSprint] = useState('');
  const [newTicketFolder, setNewTicketFolder] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Manage Members
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [allUsers, setAllUsers] = useState<{_id: string; name: string; email: string; role: string}[]>([]);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [memberOpLoading, setMemberOpLoading] = useState(false);
  const [memberError, setMemberError] = useState('');

  // Folders State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderLoading, setFolderLoading] = useState(false);

  // Move Ticket State
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [moveTicketId, setMoveTicketId] = useState<string | null>(null);
  const [targetSprintId, setTargetSprintId] = useState('');

  const router = useRouter();

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !project) return;
    setFolderLoading(true);
    try {
      const folder = await projectService.addFolder(project._id, newFolderName.trim());
      if (folder) {
        setProject({ ...project, folders: [...(project.folders || []), folder] });
        setNewFolderName('');
        setShowFolderModal(false);
      }
    } catch (err) {
      setError('Failed to create folder');
    } finally {
      setFolderLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!project || !window.confirm('Delete this folder? Tickets will remain in project but lose folder assignment.')) return;
    try {
      const success = await projectService.deleteFolder(project._id, folderId);
      if (success) {
        setProject({ ...project, folders: (project.folders || []).filter(f => f._id !== folderId) });
      }
    } catch (err) {
      setError('Failed to delete folder');
    }
  };

  const handleConfirmMove = async () => {
    if (!moveTicketId || !targetSprintId) return;
    setCreateLoading(true);
    try {
      const updated = await ticketService.updateTicket(moveTicketId, {
        sprint: targetSprintId as any,
        folder: null as any, // Remove from backlog folder
        status: 'TODO'
      });
      if (updated) {
        setTickets(tickets.map(t => t._id === moveTicketId ? updated : t));
        setShowMoveModal(false);
        setMoveTicketId(null);
        setTargetSprintId('');
      }
    } catch (err) {
      setError('Failed to move ticket to sprint');
    } finally {
      setCreateLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [projData, sprintData, ticketData] = await Promise.all([
        projectService.getProject(id as string),
        sprintService.getSprints(id as string),
        ticketService.getTickets(id as string)
      ]);
      console.log('[ProjectPage] projData:', projData);
      console.log('[ProjectPage] sprintData:', sprintData);
      console.log('[ProjectPage] ticketData:', ticketData);
      setProject(projData);
      setSprints(sprintData);
      setTickets(ticketData);
      if (!projData) {
        setError('Project not found or access denied. Please check you are logged in.');
      }
    } catch (err: any) {
      console.error('[ProjectPage] loadData error:', err);
      setError(err.message || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !token) {
      router.push('/login');
    } else if (token) {
      loadData();
    }
  }, [token, authLoading, router, loadData]);

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const newSprint = await sprintService.createSprint(id as string, {
        name: newSprintName,
        startDate,
        endDate
      });
      if (newSprint) {
        setSprints([newSprint, ...sprints]);
        setShowSprintModal(false);
        setNewSprintName('');
        setStartDate('');
        setEndDate('');
      }
    } catch (err) {
      setError('Failed to create sprint');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateStatus = async (sprintId: string, status: Sprint['status']) => {
    try {
      const updated = await sprintService.updateSprint(sprintId, { status });
      if (updated) {
        setSprints(sprints.map(s => s._id === sprintId ? updated : s));
        // Refresh data if status changed to active or completed to show side effects (like auto-created next sprint)
        if (status === 'active' || status === 'completed') {
          loadData();
        }
      }
    } catch (err) {
      setError('Failed to update sprint status');
    }
  };

  const handleDeleteSprint = async (sprintId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const success = await sprintService.deleteSprint(sprintId);
      if (success) {
        setSprints(sprints.filter(s => s._id !== sprintId));
        setTickets(tickets.filter(t => {
          const tSprintId = typeof t.sprint === 'string' ? t.sprint : t.sprint?._id;
          return tSprintId !== sprintId;
        }));
      }
    } catch (err) {
      setError('Failed to delete sprint');
    }
  };

  const handleClearProjectData = async () => {
    if (!project) return;
    if (window.confirm(`WARNING: This will permanently delete ALL sprints and tickets in "${project.name}". Continue?`)) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/projects/${project._id}/clear-tickets`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          loadProject(); // Reload to show empty state
          alert('Project data cleared successfully');
        } else {
          setError(data.error || 'Failed to clear project data');
        }
      } catch (err) {
        setError('Failed to connect to server');
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        const success = await projectService.deleteProject(project._id);
        if (success) {
          router.push('/dashboard');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to delete project');
      }
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAllUsers(data.data);
    } catch (e) { console.error(e); }
  };

  const openMembersModal = async () => {
    await fetchAllUsers();
    setShowMembersModal(true);
    setMemberError('');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addMemberEmail.trim() || !project) return;
    setMemberOpLoading(true);
    setMemberError('');
    try {
      const updated = await projectService.addMember(project._id, addMemberEmail.trim());
      if (updated) {
        setProject(updated);
        setAddMemberEmail('');
      }
    } catch (err: any) {
      setMemberError(err.message || 'Failed to add member');
    } finally {
      setMemberOpLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!project) return;
    setMemberOpLoading(true);
    try {
      const updated = await projectService.removeMember(project._id, userId);
      if (updated) setProject(updated);
    } catch (err: any) {
      setMemberError(err.message || 'Failed to remove member');
    } finally {
      setMemberOpLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim()) return;
    setCreateLoading(true);
    setError('');
    try {
      const targetFolder = project?.folders?.find(f => f._id === newTicketFolder);
      const isBacklog = targetFolder?.name.toLowerCase().includes('backlog');

      const newTicket = await ticketService.createTicket(id as string, {
        title: newTicketTitle,
        description: newTicketDesc,
        priority: newTicketPriority,
        type: newTicketType,
        sprint: newTicketSprint || undefined,
        folder: newTicketFolder || undefined,
        status: isBacklog ? 'TO BE GROOMED' : 'TODO'
      });
      if (newTicket) {
        setTickets([newTicket, ...tickets]);
        setShowTicketModal(false);
        setNewTicketTitle('');
        setNewTicketDesc('');
        setNewTicketSprint('');
      }
    } catch (err: any) {
      console.error('[ProjectPage] handleCreateTicket error:', err);
      setError(err.message || 'Failed to create ticket');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    try {
      const updated = await ticketService.updateTicket(ticketId, { status });
      if (updated) {
        setTickets(tickets.map(t => t._id === ticketId ? updated : t));
      }
    } catch (err) {
      setError('Failed to update ticket status');
    }
  };

  if (authLoading || (loading && !project)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!project && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900">Project Not Found</h2>
        <Link href="/dashboard" className="text-indigo-600 mt-4 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-500">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Layout className="h-4 w-4" />
              <span>Projects</span>
              <span>/</span>
              <span className="text-slate-600">{project?.name}</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{project?.name}</h1>
              <p className="text-slate-500 mt-2 font-medium max-w-2xl">{project?.description}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button className="p-3 shadow-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200">
                <Settings className="h-5 w-5" />
              </button>

              {isAdmin && (
                <button
                  onClick={openMembersModal}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-50 text-violet-700 font-bold text-sm border border-violet-200 hover:bg-violet-100 transition-all shadow-sm active:scale-95"
                >
                  <Users className="h-4 w-4" />
                  <span>Manage Members</span>
                  <span className="bg-violet-200 text-violet-800 text-[10px] font-black rounded-full px-1.5 py-0.5">{project?.members?.length || 0}</span>
                </button>
              )}
              {user?.role === 'admin' && (
                <div className="relative group">
                  <button className="p-3 shadow-sm text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    <button 
                      onClick={handleClearProjectData}
                      className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black text-rose-600 hover:bg-rose-50 transition-colors uppercase tracking-widest text-left"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Clear Project Data</span>
                    </button>
                    <button 
                      onClick={handleDeleteProject}
                      className="w-full flex items-center gap-3 px-5 py-4 text-xs font-black text-rose-600 hover:bg-rose-50 transition-colors uppercase tracking-widest text-left border-t border-slate-50"
                    >
                      <Layout className="h-4 w-4" />
                      <span>Delete Project</span>
                    </button>
                  </div>
                </div>
              )}
              <Link href={`/project/${id}/board`}>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all border border-slate-200"
                >
                  <Layout className="h-5 w-5 text-indigo-500" />
                  <span>Kanban Board</span>
                </button>
              </Link>
              <button
                onClick={() => setShowTicketModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-50 px-6 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all border border-indigo-200 shadow-sm"
              >
                <Plus className="h-5 w-5" />
                <span>New Ticket</span>
              </button>
              <button
                onClick={() => setShowSprintModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <Plus className="h-5 w-5" />
                <span>Plan Sprint</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Folders Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Folder className="h-6 w-6 text-indigo-600" />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Folders</h2>
              <span className="ml-2 px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                {project?.folders?.length || 0}
              </span>
            </div>
            <button
              onClick={() => setShowFolderModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <FolderPlus size={14} />
              <span>New Folder</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {project?.folders?.map((folder) => {
              const isBacklog = folder.name.toLowerCase().includes('backlog');
              const count = tickets.filter(t => {
                if (isBacklog) return !t.sprint;
                const fId = typeof t.folder === 'string' ? t.folder : t.folder?._id;
                return fId === folder._id;
              }).length;

              return (
                <div 
                  key={folder._id}
                  onClick={() => {
                    if (isBacklog) {
                      router.push(`/project/${id}/board?sprint=backlog`);
                    } else {
                      router.push(`/project/${id}?folder=${folder._id}`);
                    }
                  }}
                  className={cn(
                    "group relative p-4 border rounded-[24px] transition-all cursor-pointer",
                    currentFolderId === folder._id 
                      ? "bg-indigo-50 border-indigo-200 shadow-lg shadow-indigo-100" 
                      : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5"
                  )}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className={cn("p-3 rounded-2xl transition-colors", currentFolderId === folder._id ? "bg-white" : "bg-indigo-50 group-hover:bg-indigo-100")}>
                      <Folder className={cn("h-6 w-6", isBacklog ? "text-purple-500" : "text-indigo-500")} />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-black text-slate-900 truncate w-full px-2 block">{folder.name}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{count} Tickets</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder._id); }}
                      className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
            
            {(!project?.folders || project.folders.length === 0) && (
              <div className="col-span-full py-8 border-2 border-dashed border-slate-100 rounded-[24px] flex flex-col items-center justify-center gap-2 text-slate-400">
                <p className="text-xs font-bold">No subfolders created yet</p>
                <button 
                  onClick={() => setShowFolderModal(true)}
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700"
                >
                  + Create First Folder
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mb-8">
          <Target className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-slate-900">Sprints</h2>
          <span className="ml-2 px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">
            {sprints.length}
          </span>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {sprints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
            <div className="p-4 bg-indigo-50 rounded-full mb-4">
               <Calendar className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No sprints planned</h3>
            <p className="text-slate-500 mt-1 mb-8 text-center max-w-sm">Every great project starts with a good plan. Create your first sprint to begin.</p>
            <button
              onClick={() => setShowSprintModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Initialize First Sprint
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sprints.map((sprint) => (
              <SprintItem 
                key={sprint._id} 
                sprint={sprint} 
                onUpdateStatus={handleUpdateStatus} 
                onDelete={handleDeleteSprint}
              />
            ))}
          </div>
        )}

        {/* Tickets Section */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <TicketIcon className={cn("h-6 w-6", isBacklogFolder ? "text-purple-600" : "text-indigo-600")} />
              <h2 className="text-2xl font-bold text-slate-900">
                {isBacklogFolder ? 'Product Backlog' : selectedFolder ? selectedFolder.name : 'Tickets'}
              </h2>
              <span className="ml-2 px-2.5 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs font-bold">
                {filteredTickets.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {isBacklogFolder && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 text-[10px] font-black uppercase tracking-widest mr-2">
                   <Layout size={12} />
                   <span>Grooming View</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-xl">
                <Filter className="h-4 w-4" />
                <span>{selectedFolder ? 'Folder: ' + selectedFolder.name : 'All Projects'}</span>
              </div>
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-3xl">
              <div className="p-4 bg-slate-50 rounded-full mb-4">
                 <TicketIcon className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {selectedFolder ? `No tickets in ${selectedFolder.name}` : 'No tickets yet'}
              </h3>
              <p className="text-slate-500 mt-1 mb-8 text-center max-w-sm">
                {selectedFolder ? 'This folder is currently empty.' : 'Start tracking work items by creating your first ticket.'}
              </p>
              <button
                onClick={() => {
                  if (selectedFolder) setNewTicketFolder(selectedFolder._id);
                  setShowTicketModal(true);
                }}
                className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
              >
                + Create a Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTickets.map((ticket) => (
                <TicketItem 
                  key={ticket._id} 
                  ticket={ticket} 
                  onUpdateStatus={handleUpdateTicketStatus}
                  onMoveToSprint={(tid) => {
                    setMoveTicketId(tid);
                    setShowMoveModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Sprint Modal */}
      {showSprintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden shadow-indigo-200/50">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Plan New Sprint</h2>
              <p className="text-sm text-slate-500 mb-8">Set the duration and goals for this time-boxed iteration.</p>
              
              <form onSubmit={handleCreateSprint} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Sprint Name</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g., Sprint 1: Foundation"
                    value={newSprintName}
                    onChange={(e) => setNewSprintName(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Start Date</label>
                    <input
                      required
                      type="date"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-widest">End Date</label>
                    <input
                      required
                      type="date"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSprintModal(false)}
                    className="flex-1 px-6 py-3 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-[2] px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 disabled:bg-indigo-400 transition-all flex items-center justify-center gap-2"
                  >
                    {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span>Create Sprint</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Create Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden shadow-indigo-200/50">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Create New Ticket</h2>
              <p className="text-sm text-slate-500 mb-8">Define the task, its priority, and classification.</p>
              
              <form onSubmit={handleCreateTicket} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Ticket Title</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="e.g., Fix nav bar alignment"
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Type</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      value={newTicketType}
                      onChange={(e) => setNewTicketType(e.target.value as any)}
                    >
                      <option value="Task">Task</option>
                      <option value="Bug">Bug</option>
                      <option value="Story">Story</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Priority</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                      value={newTicketPriority}
                      onChange={(e) => setNewTicketPriority(e.target.value as any)}
                    >
                      <option value="Blocker">🚨 Blocker</option>
                       <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Assign to Sprint (Optional)</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    value={newTicketSprint}
                    onChange={(e) => setNewTicketSprint(e.target.value)}
                  >
                    <option value="">No Sprint (Backlog)</option>
                    {sprints.filter(s => s.status !== 'completed').map(s => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-widest">Assign to Folder (Optional)</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    value={newTicketFolder}
                    onChange={(e) => setNewTicketFolder(e.target.value)}
                  >
                    <option value="">No Folder</option>
                    {project?.folders?.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowTicketModal(false)}
                    className="flex-1 px-6 py-3 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="flex-[2] px-6 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-100 disabled:bg-indigo-400 transition-all flex items-center justify-center gap-2"
                  >
                    {createLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span>Create Ticket</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Members Modal ── */}
      {showMembersModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Manage Members</h2>
                  <p className="text-sm text-slate-500 font-medium">{project?.name} · {project?.members?.length || 0} members</p>
                </div>
                <button onClick={() => setShowMembersModal(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                  <X size={20} />
                </button>
              </div>

              {/* Add Member Form */}
              <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="Enter user email to add..."
                    value={addMemberEmail}
                    onChange={e => setAddMemberEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={memberOpLoading}
                  className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white text-sm font-black rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                >
                  {memberOpLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Add
                </button>
              </form>

              {memberError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
                  <AlertCircle size={14} />{memberError}
                </div>
              )}

              {/* Current Members List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Current Members</p>
                {project?.members?.length === 0 && (
                  <p className="text-sm text-slate-400 font-medium text-center py-6">No members yet. Add someone above.</p>
                )}
                {project?.members?.map(member => (
                  <div key={member._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-sm font-black">
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{member.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{member.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member._id)}
                      disabled={memberOpLoading}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                      title="Remove from project"
                    >
                      {memberOpLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400">Changes apply immediately for all members</p>
              <button
                onClick={() => setShowMembersModal(false)}
                className="px-5 py-2.5 text-sm font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Create Folder</h2>
              <p className="text-sm text-slate-500 font-medium mb-6">Group tickets by module or category.</p>
              
              <form onSubmit={handleCreateFolder} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Folder Name</label>
                  <input
                    required
                    autoFocus
                    type="text"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    placeholder="e.g. Backlog, Frontend, API"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFolderModal(false)}
                    className="flex-1 px-6 py-4 text-sm font-black text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={folderLoading}
                    className="flex-1 px-6 py-4 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 disabled:bg-indigo-400 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {folderLoading ? <Loader2 size={16} className="animate-spin" /> : <FolderPlus size={16} />}
                    <span>Create</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Move to Sprint Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-indigo-500/20">
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Move to Sprint</h2>
              <p className="text-sm text-slate-500 font-medium mb-6">Select the target sprint for this ticket. Status will be auto-set to TODO.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Select Sprint</label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    value={targetSprintId}
                    onChange={(e) => setTargetSprintId(e.target.value)}
                  >
                    <option value="">Choose a sprint...</option>
                    {sprints.filter(s => s.status !== 'completed').map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setShowMoveModal(false); setMoveTicketId(null); }}
                    className="flex-1 px-6 py-4 text-sm font-black text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmMove}
                    disabled={!targetSprintId || createLoading}
                    className="flex-1 px-6 py-4 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 disabled:bg-indigo-400 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {createLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>Move</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
