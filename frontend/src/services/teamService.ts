export interface TeamMember {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: 'member' | 'admin';
}

export interface Team {
  _id: string;
  name: string;
  color: string;
  lead?: {
    _id: string;
    name: string;
    email: string;
  };
  members: TeamMember[];
  createdAt: string;
}

import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/teams`;

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const teamService = {
  getTeams: async (): Promise<Team[]> => {
    const res = await fetch(API_URL, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!data.success && data.message) {
      throw new Error(data.message);
    }
    return data.success ? data.data : [];
  },

  getTeam: async (id: string): Promise<Team> => {
    const res = await fetch(`${API_URL}/${id}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data.data;
  },

  createTeam: async (teamData: Partial<Team>): Promise<Team> => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(teamData),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data.data;
  },

  deleteTeam: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!data.success && data.error) {
       throw new Error(data.error);
    }
    return data.success;
  },

  addMembers: async (id: string, userIds: string[], role: string = 'member'): Promise<Team> => {
    const res = await fetch(`${API_URL}/${id}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userIds, role }),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data.data;
  },

  removeMember: async (teamId: string, userId: string): Promise<Team> => {
    const res = await fetch(`${API_URL}/${teamId}/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data.data;
  },
  
  updateMemberRole: async (teamId: string, userId: string, role: string): Promise<Team> => {
    const res = await fetch(`${API_URL}/${teamId}/members/${userId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data.data;
  },
};
