'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ticketService, Ticket, TicketStatus, Comment, Attachment, ActivityLog, UserBasic } from '@/services/ticketService';
import { sprintService } from '@/services/sprintService';
import { useAuth } from '@/context/AuthContext';
import { AttachmentDropzone } from '@/components/AttachmentDropzone';
import { UploadQueueList } from '@/components/UploadQueueList';
import { useAttachmentUpload } from '@/hooks/useAttachmentUpload';
import RenderComment from '@/components/RenderComment';
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
  Settings,
  UploadCloud
} from 'lucide-react';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { can } from '@/lib/permissions';
import { AttachmentPreviewModal } from '@/components/AttachmentPreview';
import { MentionDropdown } from '@/components/MentionDropdown';

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
  const { user, token } = useAuth();
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
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Custom previews, Drag & Drop, and Mentions states
  const [activePreview, setActivePreview] = useState<Attachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
  const [filteredUsers, setFilteredUsers] = useState<UserBasic[]>([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<{name: string, id: string}[]>([]);

  const {
    queue: uploadQueue,
    addFiles,
    removeFile,
    retryUpload,
    isUploading,
    clearQueue,
    uploadedAttachments
  } = useAttachmentUpload(ticket?._id || '', token);

  // Effect to sync uploaded attachments to ticket state
  useEffect(() => {
    if (uploadedAttachments.length > 0) {
      setTicket(prev => {
        if (!prev) return prev;
        
        // Find which attachments are new
        const newAtts = uploadedAttachments.filter(
          newAtt => !prev.attachments.some(existing => existing._id === newAtt._id || existing.name === newAtt.name)
        );
        
        if (newAtts.length > 0) {
          return { ...prev, attachments: [...prev.attachments, ...newAtts] };
        }
        return prev;
      });
    }
  }, [uploadedAttachments]);

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

    let processedText = commentText;
    selectedMentions.forEach(m => {
      // Reconstruct backend syntax for mentions
      processedText = processedText.split(`@${m.name}`).join(`@[${m.name}](${m.id})`);
    });

    try {
      const newComment = await ticketService.addComment(ticket._id, processedText);
      if (newComment) {
        setTicket(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : null);
        setCommentText('');
        setSelectedMentions([]);
        clearQueue(); // Clear any completed uploads from the queue
        // Reset textarea height
        setTimeout(() => {
          const input = document.getElementById('comment-input') as HTMLTextAreaElement;
          if (input) input.style.height = 'auto';
        }, 10);
      }
    } catch (err) {
      setError('Failed to add comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!ticket) return;
    
    // Optimistic UI update
    const prevAttachments = ticket.attachments;
    setTicket({
      ...ticket,
      attachments: ticket.attachments.filter(a => a._id !== attachmentId)
    });

    try {
      await ticketService.deleteAttachment(ticket._id, attachmentId);
    } catch (err: any) {
      // Revert on failure
      setTicket({ ...ticket, attachments: prevAttachments });
      setError(err.message || 'Failed to delete attachment');
    }
  };

  // Client-Side Image Compression with Canvas to optimize repository storage sizes
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Restrict to maximum 1200px width/height while maintaining aspect ratio
          const MAX_LIMIT = 1200;
          if (width > height) {
            if (width > MAX_LIMIT) {
              height = Math.round((height * MAX_LIMIT) / width);
              width = MAX_LIMIT;
            }
          } else {
            if (height > MAX_LIMIT) {
              width = Math.round((width * MAX_LIMIT) / height);
              height = MAX_LIMIT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG format with 80% quality parameter
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadAndAttachFile = async (file: File) => {
    if (!ticket) return;
    setIsUploadingAttachment(true);
    setError(null);
    try {
      let fileUrl = '';
      if (file.type.startsWith('image/')) {
        fileUrl = await compressImage(file);
      } else {
        fileUrl = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result as string);
          r.onerror = () => reject(new Error('Failed to read file locally'));
          r.readAsDataURL(file);
        });
      }

      const attachmentData = {
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
      };

      const newAttachment = await ticketService.addAttachment(ticket._id, attachmentData);
      if (newAttachment) {
        setTicket(prev => prev ? { ...prev, attachments: [...prev.attachments, newAttachment] } : null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAndAttachFile(file);
    }
  };

  // Capture pastes (Ctrl+V or Cmd+V) to attach clipboard images instantly
  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const file = new File([blob], `paste_${Date.now()}.png`, { type: 'image/png' });
          await uploadAndAttachFile(file);
        }
      }
    }
  };

  // Mentions type-ahead processing
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCommentText(text);

    // Auto-resize textarea
    if (commentInputRef.current) {
      commentInputRef.current.style.height = 'auto';
      commentInputRef.current.style.height = `${commentInputRef.current.scrollHeight}px`;
    }

    // Process mentions
    const inputEle = e.target;
    // ensure we get the selection right after state update by using the event target directly
    const selectionStart = inputEle.selectionStart || 0;
    const textBeforeCursor = text.substring(0, selectionStart);
    const lastChar = textBeforeCursor.slice(-1);
    
    if (lastChar === '@') {
      setMentionTriggerIndex(selectionStart - 1);
      setMentionQuery('');
      const membersList = (ticket?.project as any)?.members || [];
      console.log('[DEBUG Mention] ticket.project:', ticket?.project);
      console.log('[DEBUG Mention] membersList:', membersList);
      console.log('[DEBUG Mention] mapped users:', membersList.map((m: any) => m.user).filter(Boolean));
      setFilteredUsers(membersList.map((m: any) => m.user).filter(Boolean));
      setActiveMentionIndex(0);
    } else if (mentionTriggerIndex !== -1) {
      const currentQuery = text.substring(mentionTriggerIndex + 1, selectionStart);
      if (currentQuery.includes(' ') || selectionStart <= mentionTriggerIndex) {
        // Break trigger context on whitespaces or if backspaced before trigger
        setMentionTriggerIndex(-1);
        setMentionQuery(null);
      } else {
        setMentionQuery(currentQuery);
        const membersList = (ticket?.project as any)?.members || [];
        const filtered = membersList
          .map((m: any) => m.user)
          .filter((u: any) => u && u.name && u.name.toLowerCase().includes(currentQuery.toLowerCase()));
        setFilteredUsers(filtered);
        setActiveMentionIndex(0);
      }
    }
  };

  const selectMention = (selectedUser: UserBasic) => {
    if (mentionTriggerIndex === -1) return;
    const beforeMention = commentText.substring(0, mentionTriggerIndex);
    const afterMention = commentText.substring(mentionTriggerIndex + (mentionQuery || '').length + 1);
    
    // Instead of raw format, just display @Name
    const newText = `${beforeMention}@${selectedUser.name}${afterMention}`;
    
    // Track selected mention
    setSelectedMentions(prev => {
      if (!prev.find(m => m.id === selectedUser._id)) {
        return [...prev, { name: selectedUser.name, id: selectedUser._id }];
      }
      return prev;
    });

    setCommentText(newText);
    setMentionTriggerIndex(-1);
    setMentionQuery(null);
    
    // Focus back on the comment input
    setTimeout(() => {
      const input = document.getElementById('comment-input') as HTMLTextAreaElement;
      if (input) {
        input.focus();
        const cursorPosition = beforeMention.length + selectedUser.name.length + 1; // Just @Name length
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  // Keyboard navigation inside mentions selection popovers
  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (mentionTriggerIndex !== -1 && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveMentionIndex(prev => (prev + 1) % filteredUsers.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectMention(filteredUsers[activeMentionIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setMentionTriggerIndex(-1);
        setMentionQuery(null);
      }
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

  const handleExportSubtasksCSV = () => {
    if (!subtasks || subtasks.length === 0) return;

    const headers = ['Issue ID', 'Title', 'Status', 'Priority', 'Type', 'Reporter', 'Assignees'];
    const rows = subtasks.map(sub => [
      sub.issueId,
      `"${sub.title.replace(/"/g, '""')}"`,
      sub.status,
      sub.priority,
      sub.type,
      `"${sub.reporter?.name || ''}"`,
      `"${sub.assignees?.map(a => a.name).join(', ') || ''}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${ticket?.issueId}-subtasks.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

    // Optimistic UI update
    setTicket({ ...ticket, assignees: newAssignees });

    try {
      const updated = await ticketService.updateTicket(ticket._id, { assignees: newAssignees.map(a => a._id) as any });
      if (updated) {
        setTicket(updated);
      }
    } catch (err) {
      // Revert on failure
      setTicket(ticket);
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
      <div 
        className={cn("min-h-full bg-white flex flex-col relative transition-all duration-300", isDragging && "after:absolute after:inset-0 after:bg-indigo-500/10 after:z-[100] after:border-4 after:border-dashed after:border-indigo-500")}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            await uploadAndAttachFile(files[0]);
          }
        }}
        onPaste={handlePaste}
      >
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
             {user && can(user.role, 'delete:tickets') && (
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
               <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingAttachment} className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-sm font-bold transition-all border border-slate-200 disabled:opacity-50">
                  {isUploadingAttachment ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                  <span>{isUploadingAttachment ? 'Attaching...' : 'Attach'}</span>
               </button>
               <button onClick={() => setIsCreatingSubtask(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-sm font-bold transition-all border border-purple-200">
                  <Sparkles size={16} />
                  <span>Add Subtask</span>
                </button>
               <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} onClick={(e) => { (e.target as HTMLInputElement).value = '' }} />
            </div>

            <div className="mb-12">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-500" />
                    <span>Subtasks</span>
                  </h3>
                  {user && can(user.role, 'export:data') && subtasks.length > 0 && (
                    <button 
                      onClick={handleExportSubtasksCSV}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition-all uppercase tracking-widest"
                    >
                      <Download size={14} />
                      <span>Export CSV</span>
                    </button>
                  )}
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
                 <div onClick={() => setIsEditingDesc(true)} className="text-slate-600 leading-relaxed text-lg min-h-[100px] hover:bg-slate-50 p-4 -ml-4 rounded-2xl transition-all cursor-pointer whitespace-pre-wrap">
                    {ticket.description || <span className="text-slate-400 italic">No description provided...</span>}
                 </div>
               )}
            </div>

            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="mb-12">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Paperclip size={16} />
                  <span>Attachments</span>
                </h3>
                <div className="flex flex-wrap gap-6">
                  {ticket.attachments.map(att => (
                    <div 
                      key={att._id} 
                      className="relative flex flex-col gap-2 p-3 border border-slate-200 rounded-2xl bg-white transition-all group overflow-hidden w-64"
                    >
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all z-10 flex items-center justify-center gap-3">
                        <button onClick={() => setActivePreview(att)} className="h-10 w-10 bg-white/20 hover:bg-white text-white hover:text-indigo-600 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md">
                          <FileText size={18} />
                        </button>
                        {user && (can(user.role, 'delete:tickets') || ticket.reporter._id === ((user as any)._id || user.id) || att.user?._id === ((user as any)._id || user.id)) && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteAttachment(att._id); }} className="h-10 w-10 bg-rose-500/80 hover:bg-rose-500 text-white rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                      {att.type.startsWith('image/') ? (
                        <div className="w-full h-40 bg-slate-900/5 rounded-xl overflow-hidden border border-slate-100 shrink-0 p-1 relative">
                          <img src={att.url} alt={att.name} className="w-full h-full object-cover rounded-lg" />
                        </div>
                      ) : (
                        <div className="w-full h-40 bg-indigo-50/50 text-indigo-400 rounded-xl flex flex-col gap-2 items-center justify-center shrink-0 border border-indigo-100/50">
                          <FileText size={40} className="text-indigo-400" />
                          <span className="text-[10px] font-bold text-indigo-600/50 uppercase tracking-widest">Document</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between w-full mt-2 px-1 relative z-0">
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="text-xs font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{att.name}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{(att.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <a href={att.url} download={att.name} className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 shrink-0 transition-all relative z-20">
                          <Download size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                          <RenderComment text={c.text} />
                       </div>
                    </div>
                  ))}
               </div>
               <div className="flex gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 relative items-start mt-4">
                  <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-[11px] font-black shrink-0">{user?.name?.[0] || 'U'}</div>
                  <div className="flex-1 flex flex-col gap-2 relative">
                     {mentionTriggerIndex !== -1 && (
                        <MentionDropdown users={filteredUsers} onSelect={selectMention} activeIndex={activeMentionIndex} />
                     )}
                     
                     <AttachmentDropzone onFilesSelected={addFiles}>
                       <textarea 
                         id="comment-input" 
                         ref={commentInputRef}
                         value={commentText} 
                         onChange={handleCommentChange} 
                         onKeyDown={(e) => {
                           handleCommentKeyDown(e);
                           if (e.key === 'Enter' && !e.shiftKey && mentionTriggerIndex === -1) {
                             e.preventDefault();
                             if (!isUploading) handleAddComment();
                           }
                         }}
                         className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-[15px] font-medium resize-none min-h-[48px] max-h-[200px]" 
                         placeholder="Type a comment... (Type @ to mention, Shift+Enter for new line) — Or drag & drop files here" 
                         rows={1}
                       />
                     </AttachmentDropzone>

                     <UploadQueueList 
                       queue={uploadQueue} 
                       onRemove={removeFile} 
                       onRetry={retryUpload} 
                     />

                     <div className="flex justify-between items-center mt-2">
                       <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                         <UploadCloud size={14} /> Paste (Ctrl+V) or drag & drop files
                       </p>
                       <button 
                         onClick={handleAddComment} 
                         disabled={(!commentText.trim() && uploadQueue.length === 0) || isSubmittingComment || isUploading} 
                         className="h-10 px-4 shrink-0 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100 font-bold text-sm"
                       >
                         {isSubmittingComment || isUploading ? <Loader2 size={18} className="animate-spin" /> : 'Send'}
                       </button>
                     </div>
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
                           const backlogStatuses = ['TODO', 'TO BE GROOMED', 'GROOMED', 'READY FOR SPRINT', 'IN SPRINT', 'COMPLETED', 'BLOCKED'];
                           if (ticket.sprint) {
                             return !backlogStatuses.includes(val) || val === 'COMPLETED' || val === 'BLOCKED';
                           } else {
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
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Type</label>
                       <select value={ticket.type} onChange={(e) => handleTypeChange(e.target.value)} className="col-span-2 w-full bg-white border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none">
                          <option value="Task">✅ Task</option>
                          <option value="Bug">🐛 Bug</option>
                          <option value="Story">📖 Story</option>
                          <option value="Subtask">✨ Subtask</option>
                       </select>
                     </div>
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
                                {user && can(user.role, 'assign:tasks') && (
                                  <button onClick={() => toggleAssignee(a)} className="ml-1 text-slate-400 hover:text-rose-500 transition-colors"><X size={12} /></button>
                                )}
                              </div>
                            ))}
                            {user && can(user.role, 'assign:tasks') && (
                              <button onClick={() => setShowAssigneeSearch(!showAssigneeSearch)} className="flex items-center justify-center h-7 w-7 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-white transition-all">
                                <Plus size={14} />
                              </button>
                            )}
                         </div>
                         {showAssigneeSearch && user && can(user.role, 'assign:tasks') && (
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
      {/* Attachment Preview Modal */}
      {activePreview && (
        <AttachmentPreviewModal attachment={activePreview} onClose={() => setActivePreview(null)} />
      )}
    </>
  );
}
