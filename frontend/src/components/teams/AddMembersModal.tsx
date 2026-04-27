'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { MultiSelect, Option } from '../ui/MultiSelect';
import { userService, User } from '@/services/userService';
import { teamService, Team } from '@/services/teamService';
import { Users, Plus, Loader2 } from 'lucide-react';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  onSuccess: (updatedTeam: Team) => void;
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({
  isOpen,
  onClose,
  team,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'create'>('search');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<'member' | 'admin'>('member');
  
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSelectedUserIds([]);
      setSelectedRole('member');
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setActiveTab('search');
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      if (activeTab === 'search') {
        if (selectedUserIds.length === 0) {
          alert('Please select at least one user');
          setSubmitting(false);
          return;
        }
        const updatedTeam = await teamService.addMembers(team._id, selectedUserIds, selectedRole);
        onSuccess(updatedTeam);
      } else {
        if (!newName.trim() || !newEmail.trim()) {
           alert('Name and Email are required');
           setSubmitting(false);
           return;
        }
        
        let userId;
        try {
          const newUser = await userService.createUser({
            name: newName.trim(),
            email: newEmail.trim(),
            password: newPassword || 'Pass@123',
            role: 'user'
          });
          userId = newUser._id;
        } catch (err: any) {
          if (err.message.toLowerCase().includes('duplicate') || err.message.toLowerCase().includes('exists')) {
             const allUsers = await userService.getUsers();
             const existing = allUsers.find(u => u.email.toLowerCase() === newEmail.trim().toLowerCase());
             if (existing) {
               userId = existing._id;
             } else {
               throw err;
             }
          } else {
            throw err;
          }
        }
        
        const updatedTeam = await teamService.addMembers(team._id, [userId], selectedRole);
        onSuccess(updatedTeam);
      }
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const existingMemberIds = team.members
    .filter(m => m && m.user)
    .map(m => m.user._id);

  const options: Option[] = users.map(user => ({
    id: user._id,
    label: user.name,
    subLabel: user.email,
    avatar: user.avatar,
    disabled: existingMemberIds.includes(user._id)
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expand Your Collective">
      <div className="space-y-8 p-2">
        <div className="flex p-1.5 bg-slate-100 rounded-[1.5rem]">
          <button 
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.2rem] transition-all duration-300 ${activeTab === 'search' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Search Talents
          </button>
          <button 
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.2rem] transition-all duration-300 ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            New Onboarding
          </button>
        </div>

        {activeTab === 'search' ? (
          <div className="space-y-6">
            <div className="bg-indigo-600/5 p-8 rounded-[2.5rem] flex items-center gap-6 border border-indigo-100/50">
              <div className="h-16 w-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                <Users size={28} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 tracking-tight">Active Search</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adding to {team.name}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Find Collaborators</label>
              <MultiSelect
                options={options}
                selectedIds={selectedUserIds}
                onChange={setSelectedUserIds}
                placeholder="Name or email address..."
                loading={loading}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-purple-600/5 p-8 rounded-[2.5rem] flex items-center gap-6 border border-purple-100/50">
              <div className="h-16 w-16 bg-purple-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-purple-200">
                <Plus size={28} />
              </div>
              <div>
                <h4 className="text-lg font-black text-slate-900 tracking-tight">Direct Invitation</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Immediate profile creation</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Full Identity</label>
                <input 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Harrison"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-300 transition-all font-bold text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Communication</label>
                <input 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex@organization.com"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-300 transition-all font-bold text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Security Key</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave empty for default"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:border-indigo-300 transition-all font-bold text-sm"
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 px-2">
           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Assign Privilege Level</label>
           <select 
             value={selectedRole}
             onChange={(e) => setSelectedRole(e.target.value as any)}
             className="w-full px-6 py-4 bg-slate-900 text-white rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all font-black text-xs uppercase tracking-widest cursor-pointer"
           >
              <option value="member">Regular Collaborator</option>
              <option value="admin">Lead Architect (Admin)</option>
           </select>
        </div>

        <div className="flex gap-4 pt-4 px-2">
          <button
            onClick={onClose}
            className="flex-1 px-8 py-5 rounded-3xl text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all active:scale-95 border border-transparent hover:border-slate-100"
          >
            Abort
          </button>
          <button
            onClick={handleAdd}
            disabled={submitting || (activeTab === 'search' ? selectedUserIds.length === 0 : (!newName.trim() || !newEmail.trim()))}
            className="flex-[2] flex items-center justify-center gap-3 bg-indigo-600 px-8 py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-slate-900 transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] active:scale-95 disabled:opacity-50 disabled:shadow-none hover:-translate-y-1"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>Commit Onboarding</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
