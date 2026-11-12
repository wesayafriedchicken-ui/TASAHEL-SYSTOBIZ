import { supabase } from '../lib/supabase';
import { applyDataScope } from '../lib/dataScope';
import { RBACDataScope } from '../types/rbac';

/**
 * Data Service Layer: Supabase fetchers with dynamic Data Scope Enforcement
 */

export async function fetchEmployeesWithScope(
  scope: RBACDataScope = 'global',
  currentUser: any
) {
  try {
    let query = supabase.from('employees').select('*');
    query = applyDataScope(query, scope, currentUser);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchEmployeesWithScope error:', err);
    // Fallback to local endpoint if Supabase table is not configured
    try {
      const res = await fetch('/api/hr/employees');
      if (res.ok) return await res.json();
    } catch {}
    return [];
  }
}

export async function fetchTasksWithScope(
  scope: RBACDataScope = 'global',
  currentUser: any
) {
  try {
    let query = supabase.from('tasks').select('*');
    query = applyDataScope(query, scope, currentUser);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchTasksWithScope error:', err);
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) return await res.json();
    } catch {}
    return [];
  }
}

export async function fetchDealsWithScope(
  scope: RBACDataScope = 'global',
  currentUser: any
) {
  try {
    let query = supabase.from('deals').select('*');
    query = applyDataScope(query, scope, currentUser);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchDealsWithScope error:', err);
    try {
      const res = await fetch('/api/crm/deals');
      if (res.ok) return await res.json();
    } catch {}
    return [];
  }
}
