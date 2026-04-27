export interface UserBasic {
  _id: string;
  name: string;
  email: string;
}

export type TicketStatus =
  | 'TODO'
  | 'IN PROGRESS'
  | 'READY FOR QA'
  | 'IN QA'
  | 'BLOCKED'
  | 'QA ACCEPTED'
  | 'REOPENED'
  | 'COMPLETED'
  | 'TO BE GROOMED'
  | 'GROOMED'
  | 'READY FOR SPRINT';

export interface Comment {
  _id: string;
  user: UserBasic;
  userName?: string;
  text: string;
  createdAt: string;
}

export interface Attachment {
  _id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  user?: UserBasic;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  user: UserBasic | string;
  action: string;
  details?: string;
  createdAt: string;
}

export interface TimeTracking {
  totalDuration: number;
  currentStatusStartedAt?: string;
  statusHistory: {
    status: string;
    startTime: string;
    endTime: string;
    duration: number;
  }[];
}

export interface Ticket {
  _id: string;
  issueId: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Blocker';
  type: 'Task' | 'Bug' | 'Story' | 'Subtask';
  parent?: string | Ticket;
  labels: string[];
  assignees: UserBasic[];
  assignee?: UserBasic; // Backward compatibility
  reporter: UserBasic;
  project: string | { _id: string; name: string; key: string, members?: UserBasic[] };
  sprint?: {
    _id: string;
    name: string;
  };
  comments: Comment[];
  attachments: Attachment[];
  activityLogs: ActivityLog[];
  timeTracking: TimeTracking;
  createdAt: string;
  updatedAt: string;
}

import { API_BASE_URL } from '../config/api';

const API_PROJECTS_URL = `${API_BASE_URL}/projects`;
const API_TICKETS_URL = `${API_BASE_URL}/tickets`;

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

export const ticketService = {
  getTickets: async (projectId: string, sprintId?: string): Promise<Ticket[]> => {
    const url = new URL(`${API_PROJECTS_URL}/${projectId}/tickets`);
    if (sprintId) {
      url.searchParams.append('sprintId', sprintId);
    }

    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success ? data.data : [];
  },

  getTicketByIssueId: async (issueId: string): Promise<Ticket | null> => {
    const res = await fetch(`${API_TICKETS_URL}/browse/${issueId}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  createTicket: async (projectId: string, ticketData: Partial<Ticket>): Promise<Ticket | null> => {
    const res = await fetch(`${API_PROJECTS_URL}/${projectId}/tickets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(ticketData),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to create ticket');
    }
    return data.data;
  },

  updateTicket: async (id: string, ticketData: Partial<Ticket>): Promise<Ticket | null> => {
    const res = await fetch(`${API_TICKETS_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(ticketData),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data.success ? data.data : null;
  },

  addComment: async (ticketId: string, text: string): Promise<Comment | null> => {
    const res = await fetch(`${API_TICKETS_URL}/${ticketId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  addAttachment: async (ticketId: string, attachmentData: Partial<Attachment>): Promise<Attachment | null> => {
    const res = await fetch(`${API_TICKETS_URL}/${ticketId}/attachments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(attachmentData),
    });
    const data = await res.json();
    return data.success ? data.data : null;
  },

  deleteTicket: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_TICKETS_URL}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success;
  },

  getSubtasks: async (ticketId: string): Promise<Ticket[]> => {
    const res = await fetch(`${API_TICKETS_URL}/${ticketId}/subtasks`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success ? data.data : [];
  },

  searchTickets: async (query: string): Promise<Ticket[]> => {
    const res = await fetch(`${API_TICKETS_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.success ? data.data : [];
  },
};
