/**
 * Centralized client-side permission system for WattBoard.
 *
 * IMPORTANT: These permissions are derived at runtime from the user's role.
 * Never store permissions in localStorage or JWT — always derive from role.
 * This file must stay in sync with backend/utils/permissions.js.
 */

export type Permission =
  | 'manage:teams'
  | 'manage:users'
  | 'manage:projects'
  | 'view:all_tasks'
  | 'view:own_tasks'
  | 'assign:tasks'
  | 'create:tickets'
  | 'update:tickets'
  | 'delete:tickets'
  | 'view:reports'
  | 'export:data';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'manage:teams',
    'manage:users',
    'manage:projects',
    'view:all_tasks',
    'assign:tasks',
    'create:tickets',
    'update:tickets',
    'delete:tickets',
    'view:reports',
    'export:data',
  ],
  manager: [
    'view:all_tasks',
    'assign:tasks',
    'create:tickets',
    'update:tickets',
    'view:reports',
  ],
  member: [
    'view:own_tasks',
    'create:tickets',
    'update:tickets',
  ],
  user: [
    'view:own_tasks',
    'create:tickets',
    'update:tickets',
  ],
};

/** Returns the full permission list for a given role string. */
export const getPermissions = (role: string): Permission[] =>
  ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.member;

/** Returns true if the given role grants the requested permission. */
export const can = (role: string, permission: Permission): boolean =>
  getPermissions(role).includes(permission);
