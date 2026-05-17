'use client';

import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { 
  Project, 
  projectService 
} from '@/services/projectService';
import { 
  Sprint, 
  sprintService 
} from '@/services/sprintService';
import { 
  ticketService 
} from '@/services/ticketService';
import { 
  X, 
  Plus, 
  Loader2, 
  AlertCircle,
  Folder as FolderIcon,
  Paperclip,
  Trash2,
  Image as ImageIcon,
  FileText
} from 'lucide-react';

interface IssueModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const IssueModalContext = createContext<IssueModalContextType | undefined>(undefined);

export function useIssueModal() {
  const context = useContext(IssueModalContext);
  if (!context) {
    throw new Error('useIssueModal must be used within an IssueModalProvider');
  }
  return context;
}

export function IssueModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSprint, setSelectedSprint] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [type, setType] = useState<'Task' | 'Bug' | 'Story'>('Task');
  const [attachmentPreview, setAttachmentPreview] = useState<{url: string, name: string, type: string, size: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = async () => {
    setIsOpen(true);
    setLoading(true);
    try {
      const projData = await projectService.getProjects();
      setProjects(projData);
      if (projData.length > 0) {
        setSelectedProject(projData[0]._id);
        fetchSprints(projData[0]._id);
        setFolders(projData[0].folders || []);
      }
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setError(null);
    setTitle('');
    setDescription('');
    setSelectedFolder('');
    setAttachmentPreview(null);
  };

  const fetchSprints = async (projectId: string) => {
    try {
      const sprintData = await sprintService.getSprints(projectId);
      setSprints(sprintData.filter(s => s.status !== 'completed'));
      
      const proj = projects.find(p => p._id === projectId);
      if (proj) setFolders(proj.folders || []);
    } catch (err) {
      console.error('Failed to load sprints');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSubmitting(true);
    setError(null);
    try {
      const newTicket = await ticketService.createTicket(selectedProject, {
        title,
        description,
        priority,
        type,
        sprint: selectedSprint || undefined,
        folder: selectedFolder || undefined
      });
      if (newTicket) {
        if (attachmentPreview) {
          try {
            await ticketService.addAttachment(newTicket._id, attachmentPreview);
          } catch (e) {
            console.error('Failed to attach file', e);
          }
        }
        closeModal();
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IssueModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
      
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-indigo-500/20">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Create Global Issue</h2>
                  <p className="text-sm text-slate-500 font-medium">Quickly add a ticket to any project.</p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                  <AlertCircle size={18} />
                  <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Target Project</label>
                      <select
                        required
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        value={selectedProject}
                        onChange={(e) => {
                          setSelectedProject(e.target.value);
                          fetchSprints(e.target.value);
                        }}
                      >
                        {projects.map(p => (
                          <option key={p._id} value={p._id}>{p.name} ({p.key})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Sprint (Optional)</label>
                      <select
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        value={selectedSprint}
                        onChange={(e) => setSelectedSprint(e.target.value)}
                      >
                        <option value="">No Sprint (Backlog)</option>
                        {sprints.map(s => (
                          <option key={s._id} value={s._id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Assign to Folder (Optional)</label>
                    <select
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      value={selectedFolder}
                      onChange={(e) => setSelectedFolder(e.target.value)}
                    >
                      <option value="">No Folder</option>
                      {folders.map(f => (
                        <option key={f._id} value={f._id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Issue Title</label>
                    <input
                      required
                      type="text"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      placeholder="What needs to be done?"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Type</label>
                      <select
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                      >
                        <option value="Task">Task</option>
                        <option value="Bug">Bug</option>
                        <option value="Story">Story</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Priority</label>
                      <select
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Description</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-slate-900 font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                      placeholder="Add more details..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Attachment (Optional)</label>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setAttachmentPreview({
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            url: reader.result as string
                          });
                        };
                        reader.readAsDataURL(file);
                      }} 
                    />
                    {!attachmentPreview ? (
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:bg-indigo-50/30 hover:text-indigo-500 transition-all gap-2"
                      >
                        <Paperclip size={24} />
                        <span className="text-xs font-bold">Click to attach a file</span>
                      </button>
                    ) : (
                      <div className="flex items-center justify-between p-3 border border-indigo-200 bg-indigo-50/50 rounded-2xl">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                             {attachmentPreview.type.startsWith('image/') ? (
                               <img src={attachmentPreview.url} alt="preview" className="w-full h-full object-contain rounded-lg p-0.5" />
                             ) : (
                               <FileText size={20} />
                             )}
                           </div>
                           <div className="flex-1 min-w-0 pr-2">
                             <p className="text-xs font-bold text-slate-700 truncate">{attachmentPreview.name}</p>
                             <p className="text-[10px] font-medium text-slate-400">{(attachmentPreview.size / 1024).toFixed(1)} KB</p>
                           </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setAttachmentPreview(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }} 
                          className="p-2 text-rose-400 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-colors shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-6 py-4 text-sm font-black text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] px-6 py-4 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 disabled:bg-indigo-400 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      <span>Create Issue</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </IssueModalContext.Provider>
  );
}
