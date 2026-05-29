/**
 * Centralized Role-Permission mapping for WattBoard.
 *
 * Design principle: permissions are DERIVED from the role at runtime — never
 * stored in the DB.  Adding a new capability means editing only this file.
 */

const ROLE_PERMISSIONS = {
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

/**
 * Returns the permission array for a given role.
 * Falls back to 'member' permissions for unknown roles.
 */
const getPermissions = (role) => ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.member;

/**
 * Returns true if the given role includes the requested permission.
 */
const can = (role, permission) => getPermissions(role).includes(permission);

module.exports = { ROLE_PERMISSIONS, getPermissions, can };
