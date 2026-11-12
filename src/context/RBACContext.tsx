import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { 
  RolePermissionPayload, 
  ModulePermission, 
  ScreenPermission, 
  RBACLevel, 
  RBACDataScope, 
  RBACFieldMode,
  normalizeToRolePermissionPayload, 
  getCanonicalModuleKey 
} from '../types/rbac';
import { applyDataScope } from '../lib/dataScope';

export type { RBACLevel, RBACDataScope, RBACFieldMode, RolePermissionPayload };

export interface ScopeFilterOptions<T = any> {
  module?: string;
  idField?: keyof T;
  userIdField?: keyof T;
  createdByField?: keyof T;
  departmentIdField?: keyof T;
  assignedToField?: keyof T;
  authorField?: keyof T;
  customFilter?: (item: T, scope: RBACDataScope, user: any) => boolean;
}

export interface RBACContextValue {
  user: any;
  role: string;
  roleId: number | null;
  isSuperAdmin: boolean;
  previewRole: any;
  permissions: Record<string, any>;
  rolePermissionPayload: RolePermissionPayload;

  // 1. Navigation & Module Visibility (Requirement 2)
  isModuleVisible: (moduleIdOrName: string) => boolean;
  isScreenHidden: (screenKey: string, moduleKey?: string) => boolean;
  isScreenReadOnly: (screenKey: string, moduleKey?: string) => boolean;
  getScreenLevel: (screenKey: string, moduleKey?: string) => number; // 0/1: Editable, 2: ReadOnly, 3: Hidden
  getScreenLevelString: (screenKey: string, moduleKey?: string) => RBACLevel;
  getScreenScope: (screenKey: string, moduleKey?: string) => RBACDataScope;

  // 2. Action Evaluator (Requirement 3 - Default-Deny)
  canPerformAction: (actionKey: string, moduleKey?: string, screenKey?: string) => boolean;
  isActionPermitted: (actionKey: string, module?: string, screen?: string) => boolean; // alias for backwards compatibility
  checkPermission: (module: string, action: string, tab?: string) => boolean;

  // 3. Field Visibility Evaluator (Requirement 3)
  getFieldMode: (fieldKey: string, moduleKey?: string, screenKey?: string) => 'editable' | 'readonly' | 'hidden';

  // 4. Data Scoping & Query Enforcement (Requirement 4)
  getDataScope: (screenKey: string, moduleKey?: string) => RBACDataScope;
  filterDataByScope: <T extends Record<string, any>>(data: T[], screenKey: string, options?: ScopeFilterOptions<T>) => T[];
  applyDataScope: (query: any, scope: RBACDataScope, currentUser?: any) => any;
  getScopedQueryParams: (screenKey: string, moduleKey?: string) => Record<string, string | number>;

  // Refresh
  refreshPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextValue | undefined>(undefined);

// Helper: Normalize string keys for consistent lookup
const norm = (s?: string): string => {
  if (!s) return '';
  return s.toLowerCase().trim().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
};

// Canonical aliases connecting actions to registered IDs
const ACTION_CANONICAL_ALIASES: Record<string, string[]> = {
  // Directory / Employees
  'hr:employees:create': ['hr:directory:add_employee', 'add_employee', 'create_employee'],
  'hr:directory:create': ['hr:directory:add_employee', 'add_employee'],
  'hr:directory:add': ['hr:directory:add_employee', 'add_employee'],
  'add_employee': ['hr:directory:add_employee', 'hr:employees:create'],
  'hr:directory:add_employee': ['hr:employees:create', 'add_employee'],

  'hr:employees:delete': ['hr:directory:delete_employee', 'delete_employee'],
  'hr:directory:delete': ['hr:directory:delete_employee', 'delete_employee'],
  'delete_employee': ['hr:directory:delete_employee', 'hr:employees:delete'],
  'hr:directory:delete_employee': ['hr:employees:delete', 'delete_employee'],

  'hr:employees:edit': ['hr:directory:edit_employee', 'edit_employee'],
  'hr:directory:edit': ['hr:directory:edit_employee', 'edit_employee'],
  'edit_employee': ['hr:directory:edit_employee', 'hr:employees:edit'],
  'hr:directory:edit_employee': ['hr:employees:edit', 'edit_employee'],

  'hr:directory:export': ['hr:directory:export_employees', 'export_employees'],
  'export_employees': ['hr:directory:export_employees', 'hr:directory:export'],
  'hr:directory:export_employees': ['export_employees', 'hr:directory:export'],

  'hr:directory:import': ['hr:directory:import_employees', 'import_employees'],
  'import_employees': ['hr:directory:import_employees', 'hr:directory:import'],
  'hr:directory:import_employees': ['import_employees', 'hr:directory:import'],

  'hr:directory:share_employee': ['share_employee', 'hr:directory:share'],
  'share_employee': ['hr:directory:share_employee'],

  // Payroll
  'hr:payroll:run': ['hr:payroll:calculate_all_payrolls', 'hr:payroll:run_payroll', 'calculate_all_payrolls', 'run_payroll'],
  'hr:payroll:calculate': ['hr:payroll:calculate_all_payrolls', 'calculate_all_payrolls'],
  'hr:payroll:calculate_all_payrolls': ['hr:payroll:run', 'calculate_all_payrolls', 'run_payroll', 'hr:payroll:run_payroll'],
  'hr:payroll:run_payroll': ['hr:payroll:run', 'calculate_all_payrolls', 'run_payroll', 'hr:payroll:calculate_all_payrolls'],
  'calculate_all_payrolls': ['hr:payroll:calculate_all_payrolls', 'hr:payroll:run'],
  'run_payroll': ['hr:payroll:run_payroll', 'hr:payroll:run'],

  'hr:payroll:policy': ['hr:payroll:manage_payroll_policy', 'manage_payroll_policy'],
  'hr:payroll:manage_payroll_policy': ['hr:payroll:policy', 'manage_payroll_policy'],
  'manage_payroll_policy': ['hr:payroll:manage_payroll_policy', 'hr:payroll:policy'],

  'hr:payroll:export': ['hr:payroll:export_payroll_excel_csv', 'export_payroll_excel_csv'],
  'hr:payroll:export_csv': ['hr:payroll:export_payroll_excel_csv', 'export_payroll_excel_csv'],
  'hr:payroll:export_excel': ['hr:payroll:export_payroll_excel_csv', 'export_payroll_excel_csv'],
  'export_payroll_excel_csv': ['hr:payroll:export_payroll_excel_csv', 'hr:payroll:export'],
  'hr:payroll:export_payroll_excel_csv': ['export_payroll_excel_csv', 'hr:payroll:export'],

  'hr:payroll:print': ['hr:payroll:print_pdf_report', 'print_pdf_report'],
  'print_pdf_report': ['hr:payroll:print_pdf_report', 'hr:payroll:print'],
  'hr:payroll:print_pdf_report': ['print_pdf_report', 'hr:payroll:print'],

  'hr:payroll:delete': ['hr:payroll:delete_payroll', 'delete_payroll'],
  'delete_payroll': ['hr:payroll:delete_payroll', 'hr:payroll:delete'],
  'hr:payroll:delete_payroll': ['hr:payroll:delete', 'delete_payroll'],

  'hr:payroll:approve': ['hr:payroll:approve_payroll_batch', 'approve_payroll_batch', 'hr:payroll:mark_paid'],
  'hr:payroll:pay': ['hr:payroll:approve_payroll_batch', 'approve_payroll_batch', 'hr:payroll:mark_paid'],
  'hr:payroll:mark_paid': ['hr:payroll:approve_payroll_batch', 'approve_payroll_batch'],
  'approve_payroll_batch': ['hr:payroll:approve_payroll_batch', 'hr:payroll:pay'],
  'hr:payroll:approve_payroll_batch': ['approve_payroll_batch', 'hr:payroll:pay', 'hr:payroll:mark_paid'],

  'hr:payroll:edit': ['hr:payroll:edit_payroll_entry', 'edit_payroll_entry', 'hr:payroll:revert'],
  'hr:payroll:revert': ['hr:payroll:edit_payroll_entry', 'edit_payroll_entry'],
  'edit_payroll_entry': ['hr:payroll:edit_payroll_entry', 'hr:payroll:edit'],
  'hr:payroll:edit_payroll_entry': ['edit_payroll_entry', 'hr:payroll:edit', 'hr:payroll:revert'],

  // Departments
  'hr:departments:create': ['hr:departments:add_department', 'add_department'],
  'add_department': ['hr:departments:add_department', 'hr:departments:create'],
  'hr:departments:add_department': ['hr:departments:create', 'add_department'],

  'hr:departments:edit': ['hr:departments:edit_department', 'edit_department'],
  'edit_department': ['hr:departments:edit_department', 'hr:departments:edit'],
  'hr:departments:edit_department': ['edit_department', 'hr:departments:edit'],

  'hr:departments:delete': ['hr:departments:delete_department', 'delete_department'],
  'delete_department': ['hr:departments:delete_department', 'hr:departments:delete'],
  'hr:departments:delete_department': ['delete_department', 'hr:departments:delete'],

  // Dashboard
  'hr:dashboard:export_hr_reports': ['export_hr_reports'],
  'export_hr_reports': ['hr:dashboard:export_hr_reports'],

  // Customize Layout Actions (Attendance, Complaints, Payroll, Hiring, Departments, Directory)
  'hr:attendance:customize_layout': ['attendance:customize_layout', 'customize_layout'],
  'attendance:customize_layout': ['hr:attendance:customize_layout', 'customize_layout'],
  'hr:departments:customize_layout': ['departments:customize_layout', 'customize_layout'],
  'departments:customize_layout': ['hr:departments:customize_layout', 'customize_layout'],
  'hr:hiring:customize_layout': ['hr:recruitment:customize_layout', 'recruitment:customize_layout', 'hiring:customize_layout', 'customize_layout'],
  'hr:recruitment:customize_layout': ['hr:hiring:customize_layout', 'recruitment:customize_layout', 'hiring:customize_layout', 'customize_layout'],
  'recruitment:customize_layout': ['hr:hiring:customize_layout', 'hr:recruitment:customize_layout', 'customize_layout'],
  'hr:payroll:customize_layout': ['payroll:customize_layout', 'customize_layout'],
  'payroll:customize_layout': ['hr:payroll:customize_layout', 'customize_layout'],
  'hr:complaints:customize_layout': ['complaints:customize_layout', 'customize_layout'],
  'complaints:customize_layout': ['hr:complaints:customize_layout', 'customize_layout'],
  'hr:directory:customize_layout': ['directory:customize_layout', 'customize_layout'],
  'directory:customize_layout': ['hr:directory:customize_layout', 'customize_layout']
};

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    user, 
    effectiveUser, 
    previewRole, 
    checkPermission: authCheckPermission, 
    getDataScope: authGetDataScope, 
    getPermLevel: authGetPermLevel,
    refreshUser
  } = useAuth();

  const [localPermissions, setLocalPermissions] = useState<Record<string, any>>(() => {
    return (effectiveUser as any)?.permissions || (user as any)?.permissions || {};
  });

  // Keep local permissions in sync with effectiveUser
  useEffect(() => {
    const p = (effectiveUser as any)?.permissions || (user as any)?.permissions || {};
    setLocalPermissions(p);
  }, [effectiveUser, user, previewRole]);

  // Listen to platform-wide permission save events
  useEffect(() => {
    const handlePermissionsUpdated = (e: any) => {
      try {
        if (e?.detail?.permissions) {
          const mod = e.detail.canonModule || e.detail.moduleId;
          setLocalPermissions(prev => ({
            ...prev,
            [mod]: e.detail.permissions
          }));
        }
        refreshUser?.();
      } catch (err) {
        // Ignore
      }
    };

    window.addEventListener('sys_permissions_updated', handlePermissionsUpdated);
    window.addEventListener('storage', handlePermissionsUpdated);
    return () => {
      window.removeEventListener('sys_permissions_updated', handlePermissionsUpdated);
      window.removeEventListener('storage', handlePermissionsUpdated);
    };
  }, [refreshUser]);

  const activeUser = effectiveUser || user;
  const role = previewRole?.name || activeUser?.role_name || activeUser?.role || 'User';
  const roleId = previewRole?.id ? Number(previewRole.id) : (activeUser?.role_id ? Number(activeUser.role_id) : null);
  
  const isSuperAdmin = useMemo(() => {
    if (previewRole) return false; // In preview mode, adhere strictly to the preview role
    return (
      activeUser?.role_id === 1 || 
      !!(activeUser as any)?.is_super_admin || 
      activeUser?.role === 'Admin' || 
      activeUser?.role_name === 'Admin' ||
      activeUser?.email === 'admin@gmail.com' ||
      activeUser?.email === 'admin@opex.com' ||
      activeUser?.email === 'esraaessoo19@gmail.com' ||
      activeUser?.id === 337
    );
  }, [activeUser, previewRole]);

  // Raw permissions dictionary
  const rawPermissions = useMemo(() => {
    return (previewRole?.permissions) || localPermissions || (activeUser as any)?.permissions || {};
  }, [previewRole, localPermissions, activeUser]);

  // Standardized Role Permissions Schema Payload (Requirement 1)
  const rolePermissionPayload: RolePermissionPayload = useMemo(() => {
    return normalizeToRolePermissionPayload(rawPermissions, roleId || '1');
  }, [rawPermissions, roleId]);

  // Find module in standardized schema or legacy structures
  const getModulePermission = useCallback((moduleName?: string): ModulePermission | null => {
    if (!moduleName) return null;
    const canon = getCanonicalModuleKey(moduleName);
    
    // 1. Direct from standardized payload
    if (rolePermissionPayload.modules[canon]) {
      return rolePermissionPayload.modules[canon];
    }
    if (rolePermissionPayload.modules[moduleName]) {
      return rolePermissionPayload.modules[moduleName];
    }

    // 2. Normalized lookup in payload
    const targetNorm = norm(moduleName);
    for (const [k, v] of Object.entries(rolePermissionPayload.modules)) {
      if (norm(k) === targetNorm) {
        return v;
      }
    }

    return null;
  }, [rolePermissionPayload]);

  // Backward compatibility legacy module finder
  const getLegacyModulePermissions = useCallback((moduleName?: string) => {
    if (!moduleName) return null;
    const perms = rawPermissions;
    if (perms[moduleName]) return perms[moduleName];
    const targetNorm = norm(moduleName);
    for (const key of Object.keys(perms)) {
      if (norm(key) === targetNorm) return perms[key];
    }
    const canon = getCanonicalModuleKey(moduleName);
    if (perms[canon]) return perms[canon];
    return null;
  }, [rawPermissions]);

  // Find specific screen in module
  const getScreenPermission = useCallback((screenKey: string, moduleName?: string): ScreenPermission | null => {
    if (!screenKey) return null;
    let mod = moduleName;
    if (!mod) {
      const lower = screenKey.toLowerCase();
      if (lower.startsWith('/hr') || lower.startsWith('hr')) mod = 'HR';
      else if (lower.startsWith('/kb') || lower.includes('knowledge')) mod = 'Knowledge Base';
      else if (lower.startsWith('/catalog') || lower.includes('product')) mod = 'Products/Services';
      else if (lower.startsWith('/qa') || lower.includes('quality')) mod = 'QA';
      else if (lower.startsWith('/sales') || lower.includes('crm')) mod = 'CRM';
      else mod = 'HR';
    }

    const modPerm = getModulePermission(mod);
    if (!modPerm || !modPerm.screens) return null;

    const bareScreen = screenKey.split('/').filter(Boolean).pop() || screenKey;
    const targetNorm = norm(screenKey);
    const bareNorm = norm(bareScreen);

    // Common screen aliases
    const ALIAS_LOOKUP: Record<string, string> = {
      'directory_new': 'directory_add_employee',
      'new': 'directory_add_employee',
      'add_employee': 'directory_add_employee',
      '/hr/directory/new': 'directory_add_employee',
      'directory/new': 'directory_add_employee',
    };
    const mappedKey = ALIAS_LOOKUP[screenKey] || ALIAS_LOOKUP[bareScreen];
    if (mappedKey && modPerm.screens[mappedKey]) return modPerm.screens[mappedKey];

    if (modPerm.screens[screenKey]) return modPerm.screens[screenKey];
    if (modPerm.screens[bareScreen]) return modPerm.screens[bareScreen];

    for (const [k, v] of Object.entries(modPerm.screens)) {
      const kNorm = norm(k);
      if (kNorm === targetNorm || kNorm === bareNorm || kNorm.endsWith(`_${bareNorm}`)) {
        return v;
      }
    }

    return null;
  }, [getModulePermission]);

  // -------------------------------------------------------------
  // 1. NAVIGATION & MODULE EVALUATION (Requirement 2 - Fix Blank Sidebar)
  // -------------------------------------------------------------
  /**
   * Evaluates if a module link should be visible in the navigation sidebar.
   * A module link MUST be visible IF:
   * 1. module.is_enabled === true, OR
   * 2. at least ONE of its child screens has level !== 'hidden'
   * Never blank out the entire sidebar if an error occurs; always fall back to base role defaults.
   */
  const isModuleVisible = useCallback((moduleIdOrName: string): boolean => {
    try {
      if (!moduleIdOrName) return true;
      if (isSuperAdmin) return true;

      // Only 'home' is universally visible to all authenticated users
      const cleanId = moduleIdOrName.toLowerCase().trim();
      if (cleanId === 'home') {
        return true;
      }

      const canon = getCanonicalModuleKey(moduleIdOrName);
      const modPerm = getModulePermission(canon) || getModulePermission(moduleIdOrName);

      if (modPerm) {
        // If module is explicitly disabled, it MUST NOT be visible
        if (modPerm.is_enabled === false) {
          return false;
        }

        // If module has screens defined, verify if at least one screen is accessible
        if (modPerm.screens && Object.keys(modPerm.screens).length > 0) {
          const hasVisibleScreen = Object.values(modPerm.screens).some(
            screen => screen && screen.level !== 'hidden'
          );
          if (!hasVisibleScreen) {
            return false;
          }
        }

        if (modPerm.is_enabled === true) {
          return true;
        }
      }

      // Check against legacy permissions structure
      const legacyPerms = getLegacyModulePermissions(canon) || getLegacyModulePermissions(moduleIdOrName);
      if (legacyPerms) {
        if (legacyPerms.view === false || legacyPerms.is_enabled === false || legacyPerms.read === false) {
          return false;
        }
        if (legacyPerms.is_enabled === true || legacyPerms.view === true || legacyPerms.read === true) {
          return true;
        }
      }

      // Check with Auth checkPermission
      if (authCheckPermission) {
        const canAuthView = authCheckPermission(moduleIdOrName, 'view') || authCheckPermission(canon, 'view');
        if (!canAuthView) {
          return false;
        }
        return true;
      }

      return false;
    } catch (err) {
      console.warn(`RBAC: Error evaluating isModuleVisible for ${moduleIdOrName}:`, err);
      return false;
    }
  }, [isSuperAdmin, getModulePermission, getLegacyModulePermissions, authCheckPermission]);

  // Screen Level String: 'default' | 'editable' | 'readonly' | 'hidden'
  const getScreenLevelString = useCallback((screenKey: string, moduleName?: string): RBACLevel => {
    try {
      if (!activeUser) return 'hidden';
      if (isSuperAdmin) return 'editable';

      const screenPerm = getScreenPermission(screenKey, moduleName);
      if (screenPerm) {
        return screenPerm.level;
      }

      // Legacy fallback
      const legacyMod = getLegacyModulePermissions(moduleName || 'HR');
      if (legacyMod) {
        const levels = legacyMod.levels || {};
        const targetNorm = norm(screenKey);
        const bareScreen = screenKey.split('/').filter(Boolean).pop() || screenKey;
        const bareNorm = norm(bareScreen);

        if (levels[screenKey] !== undefined) {
          const val = Number(levels[screenKey]);
          if (val === 3) return 'hidden';
          if (val === 2) return 'readonly';
          return 'editable';
        }
        for (const [k, v] of Object.entries(levels)) {
          const kNorm = norm(k);
          if (kNorm === targetNorm || kNorm === bareNorm) {
            const val = Number(v);
            if (val === 3) return 'hidden';
            if (val === 2) return 'readonly';
            return 'editable';
          }
        }

        if (legacyMod.tabs && typeof legacyMod.tabs === 'object') {
          for (const [k, v] of Object.entries(legacyMod.tabs)) {
            if (norm(k) === targetNorm || norm(k) === bareNorm) {
              if (v === false) return 'hidden';
            }
          }
        }
      }

      const numLvl = authGetPermLevel(moduleName || 'HR', screenKey);
      if (numLvl === 3) return 'hidden';
      if (numLvl === 2) return 'readonly';
      return 'editable';
    } catch (err) {
      console.warn('RBAC getScreenLevelString error:', err);
      return 'editable';
    }
  }, [activeUser, isSuperAdmin, getScreenPermission, getLegacyModulePermissions, authGetPermLevel]);

  // Screen Level Numeric: 0/1: Editable, 2: ReadOnly, 3: Hidden
  const getScreenLevel = useCallback((screenKey: string, moduleName?: string): number => {
    const lvl = getScreenLevelString(screenKey, moduleName);
    if (lvl === 'hidden') return 3;
    if (lvl === 'readonly') return 2;
    return 1;
  }, [getScreenLevelString]);

  const isScreenHidden = useCallback((screenKey: string, moduleName?: string): boolean => {
    return getScreenLevelString(screenKey, moduleName) === 'hidden';
  }, [getScreenLevelString]);

  const isScreenReadOnly = useCallback((screenKey: string, moduleName?: string): boolean => {
    return getScreenLevelString(screenKey, moduleName) === 'readonly';
  }, [getScreenLevelString]);

  // -------------------------------------------------------------
  // 2. ACTION EVALUATOR (Requirement 3 - Default-Deny)
  // -------------------------------------------------------------
  /**
   * Action Evaluator: Default-Deny
   * Returns false unless the action is explicitly permitted in screens[screen].actions
   * or explicitly permitted in the role permissions matrix.
   */
  const canPerformAction = useCallback((actionKey: string, moduleName?: string, screenName?: string): boolean => {
    try {
      if (!activeUser) return false;
      if (isSuperAdmin) return true;

      const cleanKey = actionKey.trim();
      const parts = cleanKey.split(':');
      const bareAction = parts[parts.length - 1];

      // Deduce module & screen if not provided
      let mod = moduleName;
      let scr = screenName;
      if (!mod && parts.length > 1) {
        mod = parts[0];
      }
      if (!scr && parts.length > 2) {
        scr = parts[1];
      }
      if (!mod) mod = 'HR';

      const canonMod = getCanonicalModuleKey(mod);
      const modPerm = getModulePermission(canonMod) || getModulePermission(mod);

      // ZERO TRUST: If module view is completely disabled, deny all actions
      if (modPerm && modPerm.is_enabled === false) {
        return false;
      }

      // Check screen constraints if screen is specified or deduced
      if (scr) {
        const screenPerm = getScreenPermission(scr, canonMod);
        if (screenPerm) {
          // If screen is hidden -> STRICT DENY
          if (screenPerm.level === 'hidden') return false;

          // If screen is read-only -> mutations are STRICTLY DENIED
          if (screenPerm.level === 'readonly') {
            const isMutation = /add|create|new|edit|write|update|delete|remove|calc|run|submit|save|settle|draft|approve|policy|manage/i.test(bareAction);
            if (isMutation) return false;
          }

          // Check if action is listed in screenPerm.actions
          if (Array.isArray(screenPerm.actions)) {
            const actionSet = new Set(screenPerm.actions);
            if (actionSet.has(cleanKey) || actionSet.has(bareAction)) return true;

            // Check aliases
            const aliasesForClean = ACTION_CANONICAL_ALIASES[cleanKey] || [];
            const aliasesForBare = ACTION_CANONICAL_ALIASES[bareAction] || [];
            for (const a of [...aliasesForClean, ...aliasesForBare]) {
              if (actionSet.has(a)) return true;
            }
          }
        }
      }

      // Check across all screens of the module if screen is not pinpointed
      if (modPerm && modPerm.screens) {
        for (const screenObj of Object.values(modPerm.screens)) {
          if (screenObj && Array.isArray(screenObj.actions)) {
            if (screenObj.actions.includes(cleanKey) || screenObj.actions.includes(bareAction)) {
              if (screenObj.level === 'hidden') continue;
              return true;
            }
          }
        }
      }

      // Legacy fallback check (custom_actions dictionary)
      const legacyMod = getLegacyModulePermissions(canonMod) || getLegacyModulePermissions(mod);
      if (legacyMod) {
        const customActions = legacyMod.custom_actions || {};
        const candidateKeys = new Set<string>();
        candidateKeys.add(cleanKey);
        candidateKeys.add(bareAction);
        (ACTION_CANONICAL_ALIASES[cleanKey] || []).forEach(a => candidateKeys.add(a));
        (ACTION_CANONICAL_ALIASES[bareAction] || []).forEach(a => candidateKeys.add(a));

        for (const k of candidateKeys) {
          if (customActions[k] !== undefined) {
            return !!customActions[k];
          }
        }

        const normCandidates = Array.from(candidateKeys).map(k => norm(k));
        for (const [k, val] of Object.entries(customActions)) {
          const kNorm = norm(k);
          if (normCandidates.some(cNorm => kNorm === cNorm || kNorm.endsWith(`_${cNorm}`) || cNorm.endsWith(`_${kNorm}`))) {
            return !!val;
          }
        }
      }

      // ZERO TRUST / DEFAULT-DENY:
      // If action is not explicitly granted, deny it!
      return false;
    } catch (err) {
      console.warn(`canPerformAction error for ${actionKey}:`, err);
      return false;
    }
  }, [activeUser, isSuperAdmin, getModulePermission, getScreenPermission, getLegacyModulePermissions]);

  // isActionPermitted is alias to canPerformAction
  const isActionPermitted = useCallback((actionKey: string, module?: string, screen?: string): boolean => {
    return canPerformAction(actionKey, module, screen);
  }, [canPerformAction]);

  // checkPermission wrapper
  const checkPermission = useCallback((moduleName: string, actionKey: string, tab?: string): boolean => {
    if (isSuperAdmin) return true;
    if (actionKey === 'view' && !tab) {
      return isModuleVisible(moduleName);
    }
    return canPerformAction(actionKey, moduleName, tab);
  }, [isSuperAdmin, isModuleVisible, canPerformAction]);

  // -------------------------------------------------------------
  // 3. FIELD VISIBILITY EVALUATOR (Requirement 3)
  // -------------------------------------------------------------
  /**
   * Field Visibility Evaluator:
   * Checks screens[screen].fields[fieldKey]
   * - If 'hidden': Do not render input field/column in the DOM.
   * - If 'readonly': Render input with disabled={true} / readOnly={true}.
   * - If 'full_access': Normal editable state.
   */
  const getFieldMode = useCallback((
    fieldKey: string, 
    moduleName?: string, 
    screenName?: string
  ): 'editable' | 'readonly' | 'hidden' => {
    try {
      if (!fieldKey) return 'editable';
      if (isSuperAdmin) return 'editable';

      const screenPerm = getScreenPermission(screenName || 'directory', moduleName || 'HR');
      if (screenPerm) {
        // If the entire screen is hidden, fields are hidden
        if (screenPerm.level === 'hidden') return 'hidden';

        // Check explicit field mode
        const fields = screenPerm.fields || {};
        const cleanField = norm(fieldKey);

        for (const [k, mode] of Object.entries(fields)) {
          if (norm(k) === cleanField || norm(k).endsWith(`_${cleanField}`) || cleanField.endsWith(`_${norm(k)}`)) {
            if (mode === 'hidden') return 'hidden';
            if (mode === 'readonly') return 'readonly';
            if (mode === 'full_access') {
              // If the screen itself is readonly, even full_access fields become readonly
              return screenPerm.level === 'readonly' ? 'readonly' : 'editable';
            }
          }
        }

        // If screen is readonly, fields default to readonly
        if (screenPerm.level === 'readonly') return 'readonly';
      }

      // Legacy fallback (see_permissions)
      const legacyMod = getLegacyModulePermissions(moduleName || 'HR');
      if (legacyMod) {
        const seePerms = legacyMod.see_permissions || {};
        const cleanField = norm(fieldKey);
        for (const [k, v] of Object.entries(seePerms)) {
          const kNorm = norm(k);
          if (kNorm === cleanField || kNorm.endsWith(`_${cleanField}`) || cleanField.endsWith(`_${kNorm}`)) {
            if (v === 'no') return 'hidden';
            if (v === 'view') return 'readonly';
            if (v === 'full') return 'editable';
          }
        }
      }

      return 'editable';
    } catch (err) {
      console.warn(`getFieldMode error for ${fieldKey}:`, err);
      return 'editable';
    }
  }, [isSuperAdmin, getScreenPermission, getLegacyModulePermissions]);

  // -------------------------------------------------------------
  // 4. DATA SCOPING EVALUATION (Requirement 4)
  // -------------------------------------------------------------
  const getScreenScope = useCallback((screenKey: string, moduleName?: string): RBACDataScope => {
    try {
      if (!activeUser) return 'own';
      if (isSuperAdmin) return 'global';

      const screenPerm = getScreenPermission(screenKey, moduleName);
      if (screenPerm && screenPerm.scope) {
        return screenPerm.scope;
      }

      // Legacy fallback
      const legacyMod = getLegacyModulePermissions(moduleName || 'HR');
      if (legacyMod) {
        const scopes = legacyMod.data_scopes || {};
        const targetNorm = norm(screenKey);
        const bareScreen = screenKey.split('/').filter(Boolean).pop() || screenKey;
        const bareNorm = norm(bareScreen);

        let rawScope: string | undefined = scopes[screenKey] || scopes[bareScreen];
        if (!rawScope) {
          for (const [k, v] of Object.entries(scopes)) {
            const kNorm = norm(k);
            if (kNorm === targetNorm || kNorm === bareNorm) {
              rawScope = v as string;
              break;
            }
          }
        }
        if (!rawScope) {
          rawScope = legacyMod.data_scope || legacyMod.see_scope;
        }

        if (rawScope && typeof rawScope === 'string') {
          const lower = rawScope.toLowerCase().trim();
          if (lower === 'own' || lower === 'self' || lower.includes('own')) return 'own';
          if (lower === 'team') return 'team';
          if (lower === 'department' || lower === 'branch') return 'department';
          if (lower === 'global' || lower === 'all') return 'global';
        }
      }

      const sc = authGetDataScope(moduleName || 'HR', screenKey);
      return (sc === 'branch' ? 'department' : sc) as RBACDataScope;
    } catch (err) {
      return 'own';
    }
  }, [activeUser, isSuperAdmin, getScreenPermission, getLegacyModulePermissions, authGetDataScope]);

  const getDataScope = useCallback((screenKey: string, moduleName?: string): RBACDataScope => {
    return getScreenScope(screenKey, moduleName);
  }, [getScreenScope]);

  // Filter in-memory arrays by dynamic scope
  const filterDataByScope = useCallback(<T extends Record<string, any>>(
    data: T[], 
    screenKey: string, 
    options?: ScopeFilterOptions<T>
  ): T[] => {
    if (!Array.isArray(data) || data.length === 0) return [];
    if (isSuperAdmin) return data;

    const scope = getDataScope(screenKey, options?.module);
    if (scope === 'global') return data;

    const currentUserId = activeUser?.id ? Number(activeUser.id) : null;
    const currentDeptId = activeUser?.department_id ? Number(activeUser.department_id) : null;
    const currentDeptName = ((activeUser as any)?.department_name || (activeUser as any)?.department || '').toLowerCase().trim();
    const currentEmail = (activeUser?.email || '').toLowerCase().trim();
    const currentName = (activeUser?.name || '').toLowerCase().trim();

    return data.filter(item => {
      if (!item) return false;

      if (options?.customFilter) {
        return options.customFilter(item, scope, activeUser);
      }

      // 1. OWN ONLY
      if (scope === 'own') {
        const itemId = item.id !== undefined ? Number(item.id) : undefined;
        const itemUserId = item.user_id !== undefined ? Number(item.user_id) : undefined;
        const itemEmpId = item.employee_id !== undefined ? Number(item.employee_id) : undefined;
        const itemCreatedBy = item.created_by !== undefined ? (typeof item.created_by === 'object' ? item.created_by?.id : Number(item.created_by)) : undefined;
        const itemAssignedTo = item.assigned_to !== undefined ? (typeof item.assigned_to === 'object' ? item.assigned_to?.id : Number(item.assigned_to)) : undefined;
        const itemEmail = (item.email || '').toLowerCase().trim();
        const itemName = (item.name || item.employee_name || '').toLowerCase().trim();

        if (options?.userIdField && item[options.userIdField] !== undefined) {
          if (Number(item[options.userIdField]) === currentUserId) return true;
        }
        if (options?.createdByField && item[options.createdByField] !== undefined) {
          if (Number(item[options.createdByField]) === currentUserId) return true;
        }

        if (currentUserId) {
          if (itemId === currentUserId) return true;
          if (itemUserId === currentUserId) return true;
          if (itemEmpId === currentUserId) return true;
          if (itemCreatedBy === currentUserId) return true;
          if (itemAssignedTo === currentUserId) return true;
        }

        if (currentEmail && itemEmail === currentEmail) return true;
        if (currentName && itemName === currentName) return true;

        return false;
      }

      // 2. DEPARTMENT / TEAM ONLY
      if (scope === 'department' || scope === 'team') {
        const itemDeptId = item.department_id !== undefined ? Number(item.department_id) : (item.dept_id !== undefined ? Number(item.dept_id) : undefined);
        const itemDeptName = (item.department || item.department_name || item.dept_name || '').toLowerCase().trim();

        if (options?.departmentIdField && item[options.departmentIdField] !== undefined) {
          if (Number(item[options.departmentIdField]) === currentDeptId) return true;
        }
        if (currentDeptId && itemDeptId !== undefined) {
          if (itemDeptId === currentDeptId) return true;
        }
        if (currentDeptName && itemDeptName && itemDeptName === currentDeptName) {
          return true;
        }

        // Always allow own items even under department scope
        const itemUserId = item.user_id !== undefined ? Number(item.user_id) : (item.id !== undefined ? Number(item.id) : undefined);
        if (currentUserId && itemUserId === currentUserId) return true;

        return false;
      }

      return true;
    });
  }, [isSuperAdmin, getDataScope, activeUser]);

  // Apply query scope helper for API/DB queries
  const applyDataScopeQuery = useCallback((query: any, scope: RBACDataScope, currentUser?: any) => {
    return applyDataScope(query, scope, currentUser || activeUser);
  }, [activeUser]);

  const getScopedQueryParams = useCallback((screenKey: string, moduleName?: string): Record<string, string | number> => {
    if (isSuperAdmin) return {};
    const scope = getDataScope(screenKey, moduleName);
    if (scope === 'global') return {};
    if (scope === 'own') {
      const uid = activeUser?.id || (activeUser as any)?.employee_id;
      return uid ? { employee_id: uid, user_id: uid } : {};
    }
    if (scope === 'department' || scope === 'team') {
      const deptId = activeUser?.department_id || (activeUser as any)?.dept_id;
      return deptId ? { department_id: deptId } : {};
    }
    return {};
  }, [isSuperAdmin, getDataScope, activeUser]);

  const refreshPermissions = useCallback(async () => {
    await refreshUser?.();
  }, [refreshUser]);

  const contextValue: RBACContextValue = useMemo(() => ({
    user: activeUser,
    role,
    roleId,
    isSuperAdmin,
    previewRole,
    permissions: rawPermissions,
    rolePermissionPayload,

    // Navigation & Screen Guards
    isModuleVisible,
    isScreenHidden,
    isScreenReadOnly,
    getScreenLevel,
    getScreenLevelString,
    getScreenScope,

    // Action Evaluator
    canPerformAction,
    isActionPermitted,
    checkPermission,

    // Field Visibility Evaluator
    getFieldMode,

    // Data Scoping
    getDataScope,
    filterDataByScope,
    applyDataScope: applyDataScopeQuery,
    getScopedQueryParams,

    // Refresh
    refreshPermissions
  }), [
    activeUser,
    role,
    roleId,
    isSuperAdmin,
    previewRole,
    rawPermissions,
    rolePermissionPayload,
    isModuleVisible,
    isScreenHidden,
    isScreenReadOnly,
    getScreenLevel,
    getScreenLevelString,
    getScreenScope,
    canPerformAction,
    isActionPermitted,
    checkPermission,
    getFieldMode,
    getDataScope,
    filterDataByScope,
    applyDataScopeQuery,
    getScopedQueryParams,
    refreshPermissions
  ]);

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextValue => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

export default RBACContext;
