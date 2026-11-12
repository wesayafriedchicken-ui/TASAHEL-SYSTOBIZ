import { DataScopeType } from '../types/rbac';

/**
 * Dynamic Data Scope Enforcement in Queries (Requirement 4)
 * Applies scope filters directly to Supabase PostgREST query builders.
 */
export function applyDataScope(
  query: any, 
  scope: 'own' | 'team' | 'department' | 'global' | string, 
  currentUser: any,
  options?: {
    employeeIdColumn?: string;
    departmentIdColumn?: string;
    companyIdColumn?: string;
    teamIdColumn?: string;
  }
) {
  if (!query || !currentUser) return query;

  const empCol = options?.employeeIdColumn || 'employee_id';
  const deptCol = options?.departmentIdColumn || 'department_id';
  const compCol = options?.companyIdColumn || 'company_id';
  const teamCol = options?.teamIdColumn || 'team_id';

  if (scope === 'own') {
    // Check user id or employee id
    const userId = currentUser.employee_id || currentUser.id;
    return query.eq(empCol, userId);
  }

  if (scope === 'team') {
    if (currentUser.team_id) {
      return query.eq(teamCol, currentUser.team_id);
    }
    // Direct reports or self
    return query.eq('reporting_to', currentUser.id);
  }

  if (scope === 'department') {
    const deptId = currentUser.department_id || currentUser.department;
    return query.eq(deptCol, deptId);
  }

  if (scope === 'global') {
    const compId = currentUser.company_id || 1;
    return query.eq(compCol, compId);
  }

  return query; // fallback
}

/**
 * Universal array filtering by scope for in-memory collections (Layer 3 fallback)
 */
export function filterArrayByScope<T extends Record<string, any>>(
  data: T[],
  scope: 'own' | 'team' | 'department' | 'global' | string,
  currentUser: any,
  options?: {
    userIdField?: keyof T;
    departmentIdField?: keyof T;
    companyIdField?: keyof T;
  }
): T[] {
  if (!Array.isArray(data) || !currentUser) return data || [];
  if (scope === 'global') return data;

  const uidField = (options?.userIdField || 'employee_id') as string;
  const deptField = (options?.departmentIdField || 'department_id') as string;
  const compField = (options?.companyIdField || 'company_id') as string;

  const currentUserId = String(currentUser.employee_id || currentUser.id || '');
  const currentDeptId = String(currentUser.department_id || currentUser.department || '');

  return data.filter((item) => {
    if (!item) return false;

    if (scope === 'own') {
      const itemUid = String(item[uidField] || item.user_id || item.employee_id || item.created_by || item.author_id || item.id || '');
      return itemUid === currentUserId;
    }

    if (scope === 'team') {
      const itemManager = String(item.reporting_to || item.manager_id || '');
      const itemTeam = String(item.team_id || item.team || '');
      const userTeam = String(currentUser.team_id || currentUser.team || '');
      if (itemManager && itemManager === currentUserId) return true;
      if (itemTeam && userTeam && itemTeam === userTeam) return true;
      const itemUid = String(item[uidField] || item.user_id || item.employee_id || item.id || '');
      return itemUid === currentUserId;
    }

    if (scope === 'department') {
      const itemDept = String(item[deptField] || item.department || '');
      if (itemDept && currentDeptId && itemDept === currentDeptId) return true;
      const itemUid = String(item[uidField] || item.user_id || item.employee_id || item.id || '');
      return itemUid === currentUserId;
    }

    return true;
  });
}
