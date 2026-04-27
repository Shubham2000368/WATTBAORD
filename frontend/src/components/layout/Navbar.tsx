import { 
  Search, 
  Plus, 
  Bell, 
  HelpCircle,
  Menu,
  ChevronDown,
  Inbox,
  Loader2,
  Settings,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useIssueModal } from '@/context/IssueModalContext';
import { useAuth } from '@/context/AuthContext';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { ticketService, Ticket } from '@/services/ticketService';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Navbar() {
  const { toggleMobile } = useSidebar();
  const { openModal } = useIssueModal();
  const { user, logout } = useAuth();
  const router = useRouter();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ticket[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Profile Dropdown State
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await ticketService.searchTickets(searchQuery);
        setSearchResults(results);
        setShowResults(true);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleResultClick = (issueId: string) => {
    router.push(`/browse/${issueId}`);
    setShowResults(false);
    setSearchQuery('');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="h-16 glass sticky top-0 z-40 flex items-center justify-between px-6 border-b border-white/10">
      <div className="flex items-center gap-6 flex-grow">
        <button 
          className="lg:hidden p-2 hover:bg-black/5 rounded-xl transition-all"
          onClick={toggleMobile}
        >
          <Menu className="h-5 w-5 text-slate-600" />
        </button>

        {/* Search Bar */}
        <div className="relative max-w-md w-full hidden sm:block" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 bg-slate-900/5 border border-slate-200/50 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all font-medium"
            placeholder="Search tasks, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {isSearching ? (
              <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
            ) : (
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">⌘K</span>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (searchResults.length > 0 || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
              <div className="max-h-[400px] overflow-y-auto p-2">
                {searchResults.map(ticket => (
                  <button
                    key={ticket._id}
                    onClick={() => handleResultClick(ticket.issueId)}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all text-left group"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{ticket.issueId}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(ticket.project as any)?.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{ticket.title}</span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <div className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter",
                        ticket.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                      )}>
                        {ticket.status}
                      </div>
                    </div>
                  </button>
                ))}
                {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="p-8 text-center">
                    <Search className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Filters / Utility Buttons */}
        <div className="hidden md:flex items-center gap-1 pr-1">
          <button className="p-2.5 hover:bg-indigo-50 rounded-xl text-slate-500 hover:text-indigo-600 transition-all relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 border-2 border-white rounded-full" />
          </button>
          <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-all">
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Create Issue Button */}
        <button 
          onClick={openModal}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span className="hidden sm:inline">Create</span>
        </button>

        <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 group p-1 pr-2 hover:bg-slate-50 rounded-2xl transition-all"
          >
            <div className="h-9 w-9 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all border-2 border-white group-hover:border-indigo-100">
              <div className="h-full w-full bg-slate-900 flex items-center justify-center text-white text-[11px] font-black tracking-tighter uppercase">
                {user ? getInitials(user.name) : '??'}
              </div>
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-[10px] font-black text-slate-900 leading-none mb-0.5">{user?.name || 'Loading...'}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{user?.role || 'Member'}</p>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-300", showProfileMenu && "rotate-180")} />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300 p-2">
               <div className="p-4 bg-slate-50 rounded-[1.5rem] mb-2">
                 <p className="text-xs font-black text-slate-900 mb-1">{user?.name}</p>
                 <p className="text-[10px] font-bold text-slate-400 truncate">{user?.email}</p>
               </div>
               
               <Link 
                 href="/settings" 
                 onClick={() => setShowProfileMenu(false)}
                 className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all group"
               >
                 <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-indigo-100 transition-all">
                    <Settings size={16} />
                 </div>
                 <span className="text-xs font-black uppercase tracking-widest">Account Settings</span>
               </Link>

               <div className="h-px bg-slate-50 my-1 mx-2" />

               <button 
                 onClick={handleLogout}
                 className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl transition-all group"
               >
                 <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-rose-100 transition-all">
                    <LogOut size={16} />
                 </div>
                 <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
               </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
