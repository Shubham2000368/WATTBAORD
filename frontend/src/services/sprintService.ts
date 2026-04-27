import { API_BASE_URL } from '../config/api';

const API_URL = API_BASE_URL;

export interface Sprint {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed';
  project: string;
  createdAt: string;
}

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const sprintService = {
  getSprints: async (projectId: string): Promise<Sprint[]> => {
    const res = await fetch(`${API_URL}/projects/${projectId}/sprints`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getSprint: async (sprintId: string): Promise<Sprint | null> => {
    const res = await fetch(`${API_URL}/sprints/${sprintId}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  createSprint: async (projectId: string, sprintData: Partial<Sprint>): Promise<Sprint | null> => {
    const res = await fetch(`${API_URL}/projects/${projectId}/sprints`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(sprintData),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  updateSprint: async (sprintId: string, sprintData: Partial<Sprint>): Promise<Sprint | null> => {
    const res = await fetch(`${API_URL}/sprints/${sprintId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(sprintData),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  completeSprint: async (sprintId: string): Promise<Sprint | null> => {
    // We reuse updateSprint with status: 'completed' which triggers the rollover logic
    return await sprintService.updateSprint(sprintId, { status: 'completed' });
  },

  deleteSprint: async (sprintId: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/sprints/${sprintId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success;
  }
};
