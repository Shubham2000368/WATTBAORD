export interface User {
  _id: string;
  id?: string; // normalized alias for _id, present after getMe calls
  name: string;
  email: string;
  avatar?: string;
  role: string;
  team?: string;
}

import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/users`;

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };
};

export const userService = {
  getUsers: async (): Promise<User[]> => {
    const res = await fetch(API_URL, {
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data.success ? data.data : [];
  },

  createUser: async (userData: any): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data.user;
  },

  // Admin: update name/email/password of any user
  adminUpdateUser: async (
    id: string,
    userData: { name?: string; email?: string; password?: string }
  ): Promise<User> => {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data.data;
  },

  // ── CRITICAL FIX ──────────────────────────────────────────────────────────
  // Previously there was no dedicated role-update method, so promoting a user
  // to admin via the Teams UI changed the team member role only — User.role
  // was never updated, and authorize('admin') always rejected the new admin.
  updateUserRole: async (id: string, role: 'user' | 'admin'): Promise<User> => {
    const res = await fetch(`${API_URL}/${id}`, {
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
  // ──────────────────────────────────────────────────────────────────────────

  updateMe: async (userData: { name?: string; email?: string; bio?: string; avatar?: string }): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/auth/updatedetails`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data.data;
  },

  updatePassword: async (passwordData: { currentPassword: string; newPassword: string }): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/auth/updatepassword`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(passwordData),
    });
    const data = await res.json();
    if (!data.success && data.error) {
      throw new Error(data.error);
    }
    return data;
  },
};

