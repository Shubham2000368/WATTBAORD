'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Layout, 
  Kanban, 
  BarChart2, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  ClipboardList,
  Target,
  Rocket,
  Plus,
  Search,
  Bell,
  Sparkles,
  LogOut,
  Folder,
  Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { projectService, Project } from '@/services/projectService';
import { sprintService, Sprint } from '@/services/sprintService';
import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [sprints, setSprints] = useState<Record<string, Sprint[]>>({});
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Failed to fetch projects for sidebar', err);
      }
    };
    fetchProjects();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleProjectSprints = async (projectId: string) => {
    const isExpanding = !expandedProjects[projectId];
    setExpandedProjects(prev => ({ ...prev, [projectId]: isExpanding }));
    
    if (isExpanding && !sprints[projectId]) {
      try {
        const data = await sprintService.getSprints(projectId);
        setSprints(prev => ({ ...prev, [projectId]: data }));
      } catch (err) {
        console.error(`Failed to fetch sprints for project ${projectId}`, err);
      }
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart2 },
    { 
      name: 'Projects', 
      href: '/projects', 
      icon: Layout, 
      isExpandable: true,
      hasSubmissions: projects.length > 0
    },
    { name: 'Sprints', href: '/sprints', icon: Target },
    { name: 'My Tasks', href: '/tasks', icon: ClipboardList },
    ...(user?.role === 'admin' ? [{ name: 'Teams', href: '/teams', icon: Users }] : []),
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside 
      className={cn(
        "bg-gradient-to-b from-slate-900 via-indigo-950/90 to-slate-900 text-slate-300 flex flex-col h-screen transition-all duration-300 relative border-r border-slate-800/50 z-30 shadow-2xl shadow-indigo-900/20 backdrop-blur-xl",
        collapsed ? "w-16" : "w-64",
        "fixed inset-y-0 left-0 lg:relative lg:translate-x-0 transform transition-transform duration-300 ease-in-out font-sans",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-xl flex-shrink-0 shadow-lg shadow-indigo-500/30 transform hover:rotate-12 transition-all duration-300 group">
          <Sparkles className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        </div>
        {!collapsed && (
          <span className="font-heading font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70 animate-in fade-in slide-in-from-left-4">
            WattBoard
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-grow px-3 mt-4 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              {item.isExpandable ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <Link
                      href={item.href}
                      className={cn(
                        "flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[13px] font-semibold group",
                        pathname === item.href 
                          ? "bg-indigo-600/20 text-indigo-300 shadow-inner shadow-indigo-500/20 border border-indigo-500/20" 
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 flex-shrink-0 transition-all duration-300",
                        pathname === item.href ? "text-indigo-400 scale-110 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "group-hover:scale-110 group-hover:text-slate-200"
                      )} />
                      {!collapsed && (
                        <span className="animate-in fade-in slide-in-from-left-2">{item.name}</span>
                      )}
                    </Link>
                    {!collapsed && item.hasSubmissions && (
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          setProjectsExpanded(!projectsExpanded);
                        }}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300 transition-all"
                      >
                        <ChevronDown 
                          size={14} 
                          className={cn("transition-transform duration-300", projectsExpanded ? "" : "-rotate-90")} 
                        />
                      </button>
                    )}
                  </div>
                  
                  {/* Level 1: Projects */}
                  {!collapsed && projectsExpanded && (
                    <ul className="mt-1 ml-4 space-y-0.5 border-l border-white/5 pl-2 animate-in slide-in-from-top-2 duration-300">
                      {projects.map(proj => (
                        <li key={proj._id} className="flex flex-col">
                          <div className="flex items-center gap-1 group/proj">
                            <Link
                              href={`/project/${proj._id}/board`}
                              className={cn(
                                "flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold transition-all truncate",
                                pathname.startsWith(`/project/${proj._id}`)
                                  ? "text-white bg-white/10 shadow-sm"
                                  : "text-white/40 hover:text-white hover:bg-white/5"
                              )}
                            >
                              <div className="h-5 w-5 flex-shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-[9px] font-black group-hover/proj:bg-white/20 transition-all overflow-hidden px-0.5">
                                {proj.key ? proj.key.substring(0, 2).toUpperCase() : proj.name.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="truncate">{proj.name}</span>
                            </Link>
                            {/* Info icon to access project overview */}
                            <Link
                              href={`/project/${proj._id}`}
                              title="Project Overview"
                              className="p-1.5 hover:bg-white/10 rounded-lg text-white/20 hover:text-white/70 transition-all opacity-0 group-hover/proj:opacity-100"
                            >
                              <Info size={12} />
                            </Link>
                            <button 
                              onClick={() => toggleProjectSprints(proj._id)}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-all opacity-0 group-hover/proj:opacity-100"
                            >
                               <ChevronDown 
                                size={12} 
                                className={cn("transition-transform duration-300", expandedProjects[proj._id] ? "" : "-rotate-90")} 
                               />
                            </button>
                          </div>

                          {/* Level 2: Folders & Sprints */}
                          {expandedProjects[proj._id] && (
                            <ul className="mt-0.5 ml-4 border-l border-white/5 pl-2 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                              {/* Folders */}
                              {proj.folders?.map(folder => {
                                const isBacklog = folder.name.toLowerCase().includes('backlog');
                                const targetUrl = isBacklog 
                                  ? `/project/${proj._id}/board?sprint=backlog`
                                  : `/project/${proj._id}?folder=${folder._id}`;
                                
                                return (
                                  <li key={folder._id}>
                                    <Link
                                      href={targetUrl}
                                      className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all truncate",
                                        pathname.includes(folder._id) || (isBacklog && pathname.includes('/board') && typeof window !== 'undefined' && window.location.search.includes('sprint=backlog'))
                                          ? "text-white bg-white/10"
                                          : "text-white/30 hover:text-white hover:bg-white/5"
                                      )}
                                    >
                                      <Folder size={12} className="text-indigo-400/70" />
                                      <span className="truncate">{folder.name}</span>
                                    </Link>
                                  </li>
                                );
                              })}

                              {/* Sprints */}
                              {sprints[proj._id]?.map(sprint => (
                                <li key={sprint._id}>
                                  <Link
                                    href={`/sprints/${sprint._id}/board`}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all truncate",
                                      pathname.includes(`/sprints/${sprint._id}`)
                                        ? "text-white bg-white/10"
                                        : "text-white/30 hover:text-white hover:bg-white/5"
                                    )}
                                  >
                                    <Rocket size={12} className={cn("flex-shrink-0", sprint.status === 'active' ? "text-emerald-400" : "text-white/40")} />
                                    <span className="truncate">{sprint.name}</span>
                                    {sprint.status === 'active' && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto" />
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-[13px] font-semibold group",
                    pathname.startsWith(item.href) 
                      ? "bg-indigo-600/20 text-indigo-300 shadow-inner shadow-indigo-500/20 border border-indigo-500/20" 
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5 flex-shrink-0 transition-all duration-300",
                    pathname.startsWith(item.href) ? "text-indigo-400 scale-110 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" : "group-hover:scale-110 group-hover:text-slate-200"
                  )} />
                  {!collapsed && (
                    <span className="animate-in fade-in slide-in-from-left-2">{item.name}</span>
                  )}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 bg-indigo-600 text-white rounded-full p-1.5 transition-all shadow-lg shadow-indigo-900/50 hover:scale-110 hover:bg-indigo-500 border border-indigo-400/30 z-40"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* User Card */}
      <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
         {!collapsed ? (
            <div className="flex items-center justify-between p-3 rounded-[1.5rem] bg-white/5 border border-white/10 transition-all hover:bg-white/10 group/user">
              <Link href="/settings" className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center font-bold text-xs shadow-lg shadow-black/20 flex-shrink-0 border border-white/20">
                  {user?.name?.[0] || 'U'}
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-sm font-black text-white truncate leading-tight tracking-tight">{user?.name || 'User'}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                     <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                     <p className="text-[9px] text-white/40 font-black uppercase tracking-[0.1em] truncate">{user?.role || 'Member'}</p>
                  </div>
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="p-2.5 hover:bg-rose-500 text-white/40 hover:text-white rounded-xl transition-all opacity-0 group-hover/user:opacity-100 shadow-lg hover:shadow-rose-500/50"
                title="Logout"
              >
                 <LogOut size={16} />
              </button>
           </div>
         ) : (
           <Link 
             href="/settings"
             className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center font-bold text-xs mx-auto shadow-lg shadow-black/20 hover:scale-105 transition-all border border-white/20 group"
           >
             <span className="text-white">{user?.name?.[0] || 'U'}</span>
           </Link>
         )}
      </div>
    </aside>
  );
}
