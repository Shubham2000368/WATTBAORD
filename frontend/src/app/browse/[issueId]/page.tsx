'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ticketService, Ticket, TicketStatus, Comment, Attachment, ActivityLog, UserBasic } from '@/services/ticketService';
import { sprintService } from '@/services/sprintService';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Calendar, 
  Tag, 
  AlertCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  History,
  CheckCircle2,
  Bookmark,
  ChevronDown,
  Paperclip,
  Clock,
  Plus,
  X,
  MoreVertical,
  Trash2,
  Send,
  Download,
  FileText,
  Sparkles,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STATUS_CONFIG: Record<TicketStatus, { label: string, color: string, bg: string }> = {
  'TODO': { label: 'To Do', color: 'text-slate-600', bg: 'bg-slate-100' },
  'IN PROGRESS': { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-100' },
  'READY FOR QA': { label: 'Ready for QA', color: 'text-purple-700', bg: 'bg-purple-100' },
  'IN QA': { label: 'In QA', color: 'text-orange-700', bg: 'bg-orange-100' },
  'BLOCKED': { label: 'Blocked', color: 'text-rose-700', bg: 'bg-rose-100' },
  'QA ACCEPTED': { label: 'QA Accepted', color: 'text-teal-700', bg: 'bg-teal-100' },
  'COMPLETED': { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  'REOPENED': { label: 'Reopened', color: 'text-pink-700', bg: 'bg-pink-100' },
  'TO BE GROOMED': { label: 'To Be Groomed', color: 'text-slate-500', bg: 'bg-slate-50' },
  'GROOMED': { label: 'Groomed', color: 'text-sky-600', bg: 'bg-sky-50' },
  'READY FOR SPRINT': { label: 'Ready for Sprint', color: 'text-violet-600', bg: 'bg-violet-50' },
  'IN SPRINT': { label: 'In Sprint', color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export default function IssueDetailPage() {
  const { user } = useAuth();
  const { issueId } = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editedDesc, setEditedDesc] = useState('');
  
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subtasks, setSubtasks] = useState<Ticket[]>([]);
  const [isCreatingSubtask, setIsCreatingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmittingSubtask, setIsSubmittingSubtask] = useState(false);

  const [showAssigneeSearch, setShowAssigneeSearch] = useState(false);
  const [showTimeTracking, setShowTimeTracking] = useState(false);

  const [currentTime, setCurrentTime] = useState(Date.now());
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [availableSprints, setAvailableSprints] = useState<any[]>([]);
  const [targetSprintId, setTargetSprintId] = useState('');
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadTicket = useCallback(async () => {
    if (!issueId) return;
    setLoading(true);
    try {
      const data = await ticketService.getTicketByIssueId(issueId as string);
      if (data) {
        setTicket(data);
        setEditedTitle(data.title);
        setEditedDesc(data.description || '');
        const subData = await ticketService.getSubtasks(data._id);
        setSubtasks(subData);
      } else {
        setError('Issue not found');
      }
    } catch (err) {
      setError('Failed to load issue');
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  const handleOpenMoveModal = async () => {
    if (!ticket) return;
    const projectId = typeof ticket.project === 'object' ? ticket.project._id : ticket.project as any;
    try {
      const sprints = await sprintService.getSprints(projectId);
      setAvailableSprints(sprints.filter(s => s.status !== 'completed'));
      setShowMoveModal(true);
    } catch (err) {
      setError('Failed to load sprints');
    }
  };

  const handleConfirmMove = async () => {
    if (!ticket || !targetSprintId) return;
    setIsMoving(true);
    try {
      const updated = await ticketService.updateTicket(ticket._id, {
        sprint: targetSprintId as any,
        folder: null as any,
        status: 'TODO'
      });
      if (updated) {
        setTicket(updated);
        setShowMoveModal(false);
        setTargetSprintId('');
      }
    } catch (err) {
      setError('Failed to move ticket to sprint');
    } finally {
      setIsMoving(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;

    // "IN SPRINT" → auto-move to active sprint
    if (newStatus === 'IN SPRINT') {
      const projectId = typeof ticket.project === 'object' ? ticket.project._id : ticket.project as any;
      try {
        const sprints = await sprintService.getSprints(projectId);
        const active = sprints.find(s => s.status === 'active');
        if (active) {
          // Auto-move to active sprint with TODO status
          const updated = await ticketService.updateTicket(ticket._id, {
            sprint: active._id as any,
            folder: null as any,
            status: 'TODO'
          });
          if (updated) {
            setTicket(updated);
            setError(null);
          }
        } else {
          // No active sprint — open sprint selection modal
          setAvailableSprints(sprints.filter(s => s.status !== 'completed'));
          setShowMoveModal(true);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to move to sprint');
      }
      return;
    }

    try {
      const updated = await ticketService.updateTicket(ticket._id, { status: newStatus });
      if (updated) {
        setTicket(updated);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return;
    try {
      const updated = await ticketService.updateTicket(ticket._id, { priority: newPriority as any });
      if (updated) {
        setTicket(updated);
        setError(null);
      }
    } catch (err: any) {
      setError('Failed to update priority');
    }
  };

  const handleTypeChange = async (newType: string) => {
    if (!ticket) return;
    try {
      const updated = await ticketService.updateTicket(ticket._id, { type: newType as any });
      if (updated) {
        setTicket(updated);
        setError(null);
      }
    } catch (err: any) {
      setError('Failed to update type');
    }
  };

  const handleTitleSave = async () => {
    if (!ticket || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const updated = await ticketService.updateTicket(ticket._id, { title: editedTitle });
      if (updated) {
        setTicket(updated);
        setIsEditingTitle(false);
      }
    } catch (err) {
      setError('Failed to update title');
    }
  };

  const handleDescSave = async () => {
    if (!ticket) return;
    try {
      const updated = await ticketService.updateTicket(ticket._id, { description: editedDesc });
      if (updated) {
        setTicket(updated);
        setIsEditingDesc(false);
      }
    } catch (err) {
      setError('Failed to update description');
    }
  };

  const handleAddComment = async () => {
    if (!ticket || !commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      const newComment = await ticketService.addComment(ticket._id, commentText);
      if (newComment) {
        setTicket(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
        setCommentText('');
      }
    } catch (err) {
      setError('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ticket) return;
    try {
      const attachmentData = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      };
      const newAttachment = await ticketService.addAttachment(ticket._id, attachmentData);
      if (newAttachment) {
        setTicket(prev => prev ? { ...prev, attachments: [...prev.attachments, newAttachment] } : null);
      }
    } catch (err) {
      setError('Failed to upload attachment');
    }
  };

  const handleCreateSubtask = async () => {
    if (!ticket || !newSubtaskTitle.trim()) return;
    setIsSubmittingSubtask(true);
    try {
      const parentId = ticket._id;
      const projectId = typeof ticket.project === 'object' ? ticket.project._id : ticket.project as any;
      const sprintId = typeof ticket.sprint === 'object' ? ticket.sprint?._id : ticket.sprint;
      
      const newSub = await ticketService.createTicket(projectId, {
        title: newSubtaskTitle,
        parent: parentId,
        status: 'TODO',
        type: 'Subtask',
        sprint: sprintId as any
      });
      
      if (newSub) {
        setSubtasks(prev => [...prev, newSub]);
        setNewSubtaskTitle('');
        setIsCreatingSubtask(false);
      }
    } catch (err) {
      setError('Failed to create subtask');
    } finally {
      setIsSubmittingSubtask(false);
    }
  };

  const toggleAssignee = async (user: UserBasic) => {
    if (!ticket) return;
    const isAssigned = ticket.assignees.some(a => a._id === user._id);
    let newAssignees;
    if (isAssigned) {
      newAssignees = ticket.assignees.filter(a => a._id !== user._id);
    } else {
      newAssignees = [...ticket.assignees, user];
    }

    try {
      const updated = await ticketService.updateTicket(ticket._id, { assignees: newAssignees.map(a => a._id) as any });
      if (updated) {
        setTicket(updated);
      }
    } catch (err) {
      setError('Failed to update assignees');
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const formatDateTime = (date: any) => {
    return new Date(date).toLocaleString([], { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  const handleDeleteTicket = async () => {
    if (!ticket) return;
    if (window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) {
      try {
        const success = await ticketService.deleteTicket(ticket._id);
        if (success) {
          router.push('/dashboard');
        }
      } catch (err) {
        setError('Failed to delete ticket');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-rose-50 border border-rose-100 p-8 rounded-3xl">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Issue Not Found</h2>
          <p className="text-slate-500 mb-6">The issue identifier "{issueId}" might be incorrect or you don't have access.</p>
          <button onClick={() => router.back()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold">Go Back</button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const projectMembers = (ticket.project as any).members || [];

  return (
    <>
      <div className="min-h-full bg-white flex flex-col">
        <header className="border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-20">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-slate-400 uppercase tracking-tighter">{ticket.issueId}</span>
               {ticket.parent && (
                 <>
                   <span className="text-slate-200">/</span>
                   <Link 
                    href={`/browse/${typeof ticket.parent === 'object' ? ticket.parent.issueId : ticket.parent}`}
                    className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-black rounded-lg hover:bg-purple-100 transition-colors uppercase tracking-widest flex items-center gap-1"
                   >
                     <Sparkles size={10} />
                     <span>Parent: {typeof ticket.parent === 'object' ? ticket.parent.issueId : 'View'}</span>
                   </Link>
                 </>
               )}
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={copyUrl} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 text-slate-500 text-sm font-bold rounded-lg transition-all">
               <Copy size={16} />
               <span>Copy Link</span>
             </button>
             <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all">
               <ExternalLink size={16} />
               <span>Share</span>
             </button>
             {user?.role === 'admin' && (
                <div className="relative group">
                  <button className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-all">
                    <MoreVertical size={20} />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                     <button onClick={handleDeleteTicket} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all rounded-2xl">
                        <Trash2 size={16} />
                        <span>Delete Ticket</span>
                     </button>
                  </div>
                </div>
             )}
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-bold flex items-center gap-3">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="mb-8">
              {isEditingTitle ? (
                <div className="flex flex-col gap-2">
                  <input autoFocus className="text-4xl font-black text-slate-900 tracking-tighter bg-slate-50 p-2 rounded-xl border border-indigo-200 outline-none w-full" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()} />
                  <p className="text-[10px] text-slate-400 font-bold uppercase ml-2">Press Enter to save • Esc to cancel</p>
                </div>
              ) : (
                <h1 onClick={() => setIsEditingTitle(true)} className="text-4xl font-black text-slate-900 tracking-tighter hover:bg-slate-50 cursor-pointer p-2 -ml-2 rounded-xl transition-all">{ticket.title}</h1>
              )}
            </div>

            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
               <button onClick={() => document.getElementById('comment-input')?.focus()} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition-all border border-slate-200">
                  <MessageSquare size={16} />
                  <span>Comment</span>
               </button>
               <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition-all border border-slate-200">
                  <Paperclip size={16} />
                  <span>Attach</span>
               </button>
               <button onClick={() => setIsCreatingSubtask(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm font-bold transition-all border border-purple-200">
                  <Sparkles size={16} />
                  <span>Add Subtask</span>
                </button>
               <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
            </div>

            <div className="mb-12">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-500" />
                    <span>Subtasks</span>
                  </h3>
               </div>
               
               {isCreatingSubtask && (
                 <div className="mb-6 p-4 bg-purple-50/30 border border-purple-100 rounded-2xl animate-in slide-in-from-top-2 duration-200">
                    <input autoFocus className="w-full bg-white border border-purple-200 rounded-xl px-4 py-2 text-sm font-medium outline-none mb-3" placeholder="Subtask title..." value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateSubtask()} />
                    <div className="flex gap-2 justify-end">
                       <button onClick={() => setIsCreatingSubtask(false)} className="px-3 py-1.5 text-slate-500 text-xs font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                       <button onClick={handleCreateSubtask} disabled={!newSubtaskTitle.trim() || isSubmittingSubtask} className="px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg shadow-lg shadow-purple-100 disabled:opacity-50">
                         {isSubmittingSubtask ? 'Creating...' : 'Create'}
                       </button>
                    </div>
                 </div>
               )}

               <div className="space-y-2">
                  {subtasks.length > 0 ? (
                    subtasks.map(sub => (
                      <Link key={sub._id} href={`/browse/${sub.issueId}`} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/10 transition-all group">
                         <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-purple-400 transition-colors">{sub.issueId}</span>
                            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{sub.title}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <div className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter", STATUS_CONFIG[sub.status].bg, STATUS_CONFIG[sub.status].color)}>{STATUS_CONFIG[sub.status].label}</div>
                         </div>
                      </Link>
                    ))
                  ) : !isCreatingSubtask && (
                    <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                       <p className="text-sm font-bold text-slate-400">No subtasks yet</p>
                       <button onClick={() => setIsCreatingSubtask(true)} className="text-xs font-black text-purple-600 uppercase tracking-widest mt-2 hover:text-purple-700 transition-colors">+ Add Subtask</button>
                    </div>
                  )}
               </div>
            </div>

            <div className="mb-12">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Description</h3>
               {isEditingDesc ? (
                 <div className="flex flex-col gap-3">
                   <textarea autoFocus value={editedDesc} onChange={(e) => setEditedDesc(e.target.value)} className="w-full min-h-[200px] p-4 bg-slate-50 border border-indigo-200 rounded-2xl outline-none text-slate-700 leading-relaxed font-medium" placeholder="Describe this issue..." />
                   <div className="flex gap-2 justify-end">
                      <button onClick={() => setIsEditingDesc(false)} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-lg">Cancel</button>
                      <button onClick={handleDescSave} className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-100">Save</button>
                   </div>
                 </div>
               ) : (
                 <div onClick={() => setIsEditingDesc(true)} className="text-slate-600 leading-relaxed text-lg min-h-[100px] hover:bg-slate-50 p-4 -ml-4 rounded-2xl transition-all cursor-pointer">
                    {ticket.description || <span className="text-slate-400 italic">No description provided...</span>}
                 </div>
               )}
            </div>

            <div className="mb-12">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                 <MessageSquare size={16} />
                 <span>Comments</span>
               </h3>
               <div className="space-y-8 mb-8">
                  {ticket.comments && ticket.comments.map(c => (
                    <div key={c._id} className="flex gap-4">
                       <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-[11px] font-black shrink-0">{c.userName?.[0] || 'U'}</div>
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className="text-sm font-black text-slate-900">{c.userName || 'Anonymous'}</span>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-600 text-[15px] leading-relaxed">{c.text}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-[11px] font-black shrink-0">{user?.name?.[0] || 'U'}</div>
                  <div className="flex-1 flex gap-2">
                     <input id="comment-input" value={commentText} onChange={(e) => setCommentText(e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium" placeholder="Type a comment..." onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                     <button onClick={handleAddComment} disabled={!commentText.trim() || isSubmittingComment} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100">
                       {isSubmittingComment ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                     </button>
                  </div>
               </div>
            </div>

            <div>
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <History size={16} />
                 <span>Activity History</span>
               </h3>
               <div className="space-y-6 pl-4 border-l-2 border-slate-100">
                  {ticket.activityLogs && ticket.activityLogs.slice().reverse().map(log => (
                    <div key={log._id} className="relative">
                       <div className="absolute -left-6 top-1 h-3 w-3 rounded-full bg-slate-100 border-2 border-white shadow-sm ring-4 ring-white" />
                       <div className="flex flex-col">
                          <div className="flex items-center gap-x-2 text-[13px]">
                             <span className="font-bold text-slate-900">{(log.user as UserBasic)?.name || 'Someone'}</span>
                             <span className="text-slate-500">{log.action}</span>
                             <span className="text-slate-400 font-bold">{log.details}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(log.createdAt).toLocaleString()}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="w-96 border-l border-slate-100 p-8 shrink-0 bg-slate-50/20 overflow-y-auto custom-scrollbar">
             <div className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Details</h3>
                    <Settings size={14} className="text-slate-400" />
                  </div>
                  <div className="space-y-5">
                     <div className="grid grid-cols-3 items-center gap-4">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Status</label>
                       <select value={ticket.status} onChange={(e) => handleStatusChange(e.target.value as TicketStatus)} className={cn("col-span-2 px-3 py-1.5 rounded-lg font-bold text-xs border-none shadow-sm cursor-pointer outline-none transition-all", STATUS_CONFIG[ticket.status].bg, STATUS_CONFIG[ticket.status].color)}>
                         {Object.entries(STATUS_CONFIG).filter(([val]) => {
                           const backlogStatuses = ['TO BE GROOMED', 'GROOMED', 'READY FOR SPRINT', 'IN SPRINT'];
                           if (ticket.sprint) {
                             // Sprint ticket: show only normal sprint statuses
                             return !backlogStatuses.includes(val);
                           } else {
                             // Backlog ticket: show only backlog statuses
                             return backlogStatuses.includes(val);
                           }
                         }).map(([val, cfg]) => <option key={val} value={val}>{cfg.label}</option>)}
                       </select>
                     </div>
                     
                     {ticket.status === 'READY FOR SPRINT' && (
                       <div className="grid grid-cols-3 items-center gap-4">
                         <div />
                         <button 
                          onClick={handleOpenMoveModal}
                          className="col-span-2 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                         >
                           <Send size={14} />
                           <span>Move to Sprint</span>
                         </button>
                       </div>
                     )}
                     <div className="grid grid-cols-3 items-center gap-4">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Priority</label>
                       <select value={ticket.priority} onChange={(e) => handlePriorityChange(e.target.value)} className="col-span-2 w-full bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none">
                          <option value="Blocker">🚨 Blocker</option>
                          <option value="High">🔴 High</option>
                          <option value="Medium">🟠 Medium</option>
                          <option value="Low">🟢 Low</option>
                       </select>
                     </div>
                     <div className="grid grid-cols-3 items-center gap-4">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Reporter</label>
                       <div className="col-span-2 flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-black">{ticket.reporter.name[0]}</div>
                          <span className="text-sm font-bold text-slate-900">{ticket.reporter.name}</span>
                       </div>
                     </div>
                     <div className="grid grid-cols-3 items-start gap-4">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-2">Assignees</label>
                       <div className="col-span-2 relative">
                         <div className="flex flex-wrap gap-2">
                            {ticket.assignees.map(a => (
                              <div key={a._id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg pl-1 pr-2 py-1 shadow-sm">
                                <div className="h-5 w-5 rounded bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">{a.name[0]}</div>
                                <span className="text-[11px] font-bold text-slate-700">{a.name}</span>
                                {user?.role === 'admin' && (
                                  <button onClick={() => toggleAssignee(a)} className="ml-1 text-slate-400 hover:text-rose-500 transition-colors"><X size={12} /></button>
                                )}
                              </div>
                            ))}
                            {user?.role === 'admin' && (
                              <button onClick={() => setShowAssigneeSearch(!showAssigneeSearch)} className="flex items-center justify-center h-7 w-7 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all">
                                <Plus size={14} />
                              </button>
                            )}
                         </div>
                         {showAssigneeSearch && user?.role === 'admin' && (
                           <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto p-2 animate-in fade-in zoom-in-95 duration-200">
                              {projectMembers.length > 0 ? projectMembers.map((member: any) => {
                                const u = member.user;
                                if (!u) return null;
                                const isAssigned = ticket.assignees.some(a => a._id === u._id);
                                return (
                                  <button key={u._id} onClick={() => { toggleAssignee(u); setShowAssigneeSearch(false); }} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl transition-colors group">
                                    <div className="h-6 w-6 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-black">{u.name ? u.name[0] : 'U'}</div>
                                    <span className="text-xs font-bold text-slate-700 flex-1 text-left">{u.name || u.email || 'Unknown Member'}</span>
                                    {isAssigned && <CheckCircle2 size={14} className="text-indigo-600" />}
                                  </button>
                                )
                              }) : (
                                <div className="p-3 text-center text-xs text-slate-500 font-medium">No project members found. Add members in project settings.</div>
                              )}
                           </div>
                         )}
                       </div>
                     </div>
                  </div>
                </div>

                {/* Collapsible Time Tracking */}
                <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 overflow-hidden transition-all duration-300">
                   <button onClick={() => setShowTimeTracking(!showTimeTracking)} className="w-full flex items-center justify-between text-[11px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
                      <div className="flex items-center gap-2">
                         <Clock size={14} />
                         <span>Time Tracking</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", showTimeTracking && "rotate-180")} />
                   </button>
                   
                   {showTimeTracking && (
                      <div className="pt-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                         <div className="flex justify-between items-end">
                            <div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Total Spent</p>
                               <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                 {formatDuration(ticket.timeTracking.totalDuration + (ticket.status === 'COMPLETED' ? 0 : (currentTime - new Date(ticket.timeTracking.currentStatusStartedAt || ticket.createdAt).getTime())))}
                               </p>
                            </div>
                            <div className="text-right text-[10px] font-bold text-slate-400 uppercase">
                               {ticket.status === 'COMPLETED' ? <span className="text-green-600">Finished</span> : <span className="text-indigo-600">Running</span>}
                            </div>
                         </div>
                         <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full w-[65%]" />
                         </div>
                         <div className="pt-4 border-t border-indigo-100/50 space-y-3">
                            {ticket.timeTracking.statusHistory.slice().reverse().map((h, i) => (
                               <div key={i} className="flex justify-between items-center bg-white/40 p-2 rounded-lg border border-indigo-100/30">
                                  <span className="text-[9px] font-black text-slate-400 uppercase">{h.status}</span>
                                  <span className="text-[10px] font-black text-indigo-600">{formatDuration(h.duration)}</span>
                               </div>
                            ))}
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>
        </main>
      </div>

      {/* Move to Sprint Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-indigo-500/20">
            <div className="p-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">Move to Sprint</h2>
              <p className="text-sm text-slate-500 font-medium mb-6">Select the target sprint. Status will be auto-set to TODO.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Select Sprint</label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    value={targetSprintId}
                    onChange={(e) => setTargetSprintId(e.target.value)}
                  >
                    <option value="">Choose a sprint...</option>
                    {availableSprints.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.status})</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => { setShowMoveModal(false); setTargetSprintId(''); }}
                    className="flex-1 px-6 py-4 text-sm font-black text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmMove}
                    disabled={!targetSprintId || isMoving}
                    className="flex-1 px-6 py-4 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 disabled:bg-indigo-400 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isMoving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    <span>Move</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
