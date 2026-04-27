export interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    role: string;
    hasAccess: boolean;
  }>;
  team: string;
  folders?: Array<{
    _id: string;
    name: string;
    icon: string;
    createdAt: string;
  }>;
  createdAt: string;
}

import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/projects`;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const res = await fetch(API_URL, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getProject: async (id: string): Promise<Project | null> => {
    const res = await fetch(`${API_URL}/${id}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  createProject: async (projectData: { name: string; description?: string }): Promise<Project | null> => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(projectData),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  updateProject: async (id: string, projectData: Partial<Project>): Promise<Project | null> => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(projectData),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  deleteProject: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success;
  },

  addMember: async (projectId: string, email: string): Promise<Project | null> => {
    const res = await fetch(`${API_URL}/${projectId}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  removeMember: async (projectId: string, userId: string): Promise<Project | null> => {
    const res = await fetch(`${API_URL}/${projectId}/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  toggleAccess: async (projectId: string, userId: string, hasAccess: boolean): Promise<Project | null> => {
    const res = await fetch(`${API_URL}/${projectId}/toggle-access`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ userId, hasAccess }),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  bulkToggleAccess: async (userId: string, accessUpdates: Record<string, boolean>): Promise<boolean> => {
    const res = await fetch(`${API_URL}/bulk-toggle-access`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ userId, accessUpdates }),
    });
    const data = await res.json();
    return data.success;
  },
  
  addFolder: async (projectId: string, name: string, icon: string = 'Folder') => {
    const res = await fetch(`${API_URL}/${projectId}/folders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, icon }),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  deleteFolder: async (projectId: string, folderId: string) => {
    const res = await fetch(`${API_URL}/${projectId}/folders/${folderId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success;
  },
};
