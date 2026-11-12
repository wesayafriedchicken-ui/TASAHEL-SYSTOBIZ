import { supabase } from './supabase';
import { normalizeModuleName } from '../context/AuthContext';

/**
 * Log an audit entry for any system action
 */
export async function logAudit(action: {
  module: string;
  action: string;
  record_id?: string;
  details?: any;
}) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  try {
    const res = await fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-id': user?.id?.toString() || '1'
      },
      body: JSON.stringify({
        module: action.module,
        action: action.action,
        record_id: action.record_id,
        details: action.details,
        user_id: user?.id
      })
    });
      
    if (!res.ok) console.error('Audit log failed');
  } catch (err) {
    console.error('Audit service error:', err);
  }
}

/**
 * Check if the current user has permission for a specific module/action
 */
export function checkPermission(module: string, action: string, user: any): boolean {
  if (!user) return false;
  if (
    user.role_id === 1 || 
    user.is_super_admin || 
    user.role === 'Admin' || 
    user.role_name === 'Admin' ||
    user.email === 'admin@gmail.com' ||
    user.email === 'admin@opex.com'
  ) return true;

  // If user has specific permissions object (from DB)
  if (user.permissions && typeof user.permissions === 'object') {
    const targetKey = normalizeModuleName(module) || '';
    const permKey = Object.keys(user.permissions).find(k => (k || '').toLowerCase() === targetKey.toLowerCase());
    
    if (permKey && user.permissions[permKey]) {
      const modulePerms = user.permissions[permKey];
      
      const actionLower = (action || '').toLowerCase();
      if (modulePerms[actionLower] !== undefined) {
        return !!modulePerms[actionLower];
      }
      
      if (modulePerms[action] !== undefined) {
        return !!modulePerms[action];
      }
    }
  }

  // Default view permission should be false if permissions are defined but this module isn't in them
  if (action === 'view') {
    if (user.permissions && Object.keys(user.permissions).length > 0) {
      return false;
    }
    return true;
  }

  return false;
}
