/**
 * Universal Data Scope Enforcement for Supabase & Database Queries
 * 
 * Enforces dynamic row-level data scoping according to the active role's
 * configured scope ('own' | 'team' | 'department' | 'global')
 */

export function applyDataScope(
  query: any, 
  scope: 'own' | 'team' | 'department' | 'global' = 'global', 
  currentUser: any = null
) {
  if (!query) return query;
  if (!currentUser) return query;

  try {
    if (scope === 'own') {
      const empId = currentUser.id || currentUser.employee_id || currentUser.user_id;
      if (typeof query.eq === 'function') {
        return query.eq('employee_id', empId);
      }
    }
    if (scope === 'team') {
      const deptId = currentUser.department_id || currentUser.dept_id;
      if (typeof query.eq === 'function') {
        return query.eq('department_id', deptId);
      }
    }
    if (scope === 'department') {
      const deptId = currentUser.department_id || currentUser.dept_id;
      if (typeof query.eq === 'function') {
        return query.eq('department_id', deptId);
      }
    }
    if (scope === 'global') {
      const compId = currentUser.company_id || 1;
      if (typeof query.eq === 'function') {
        return query.eq('company_id', compId);
      }
    }
  } catch (err) {
    console.warn('applyDataScope warning:', err);
  }

  return query; // fallback
}

export default applyDataScope;
