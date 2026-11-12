/**
 * Standardized Role Permissions Schema Contract
 * Immutable data contract for RBAC permissions across all modules
 */

export type RBACLevel = 'default' | 'editable' | 'readonly' | 'hidden';
export type RBACDataScope = 'own' | 'team' | 'department' | 'global';
export type RBACFieldMode = 'full_access' | 'readonly' | 'hidden';

// Aliases for compatibility
export type ScreenAccessLevel = RBACLevel;
export type DataScopeType = RBACDataScope;
export type FieldAccessMode = RBACFieldMode;

export interface ScreenPermission {
  level: RBACLevel;
  scope: RBACDataScope;
  actions: string[]; // e.g. ['hr:directory:add_employee']
  fields: {
    [fieldKey: string]: RBACFieldMode; // e.g. 'salary': 'hidden'
  };
}

export interface ModulePermission {
  is_enabled: boolean; // Controls module presence in main sidebar
  screens: {
    [screenKey: string]: ScreenPermission; // e.g. 'directory', 'payroll'
  };
}

export type ScreenPermissionDefinition = ScreenPermission;
export type ModulePermissionDefinition = ModulePermission;

export interface RolePermissionPayload {
  role_id: string;
  modules: {
    [moduleKey: string]: ModulePermission; // e.g. 'HR', 'SALES', 'QA', 'Knowledge Base'
  };
}

/**
 * Standard canonical module key mapping
 */
export const CANONICAL_MODULE_MAP: Record<string, string> = {
  home: 'Home',
  dashboard: 'Dashboard',
  'ai-business': 'AI Business',
  'ai business': 'AI Business',
  'meeting-hub': 'Meeting Hub',
  'meeting hub': 'Meeting Hub',
  marketing: 'Marketing Hub',
  'marketing hub': 'Marketing Hub',
  sops: 'SOPs',
  sop: 'SOPs',
  'sop management': 'SOPs',
  'process-mapping': 'Process Mapping',
  'process mapping': 'Process Mapping',
  kb: 'Knowledge Base',
  'knowledge base': 'Knowledge Base',
  knowledge: 'Knowledge Base',
  leads: 'Leads',
  'crm leads': 'Leads',
  crm: 'CRM',
  sales: 'CRM',
  'sales crm': 'CRM',
  'operations-hub': 'Operations Hub',
  'operations hub': 'Operations Hub',
  acct: 'Accounting',
  accounting: 'Accounting',
  automation: 'Automation',
  qa: 'QA',
  'quality assurance': 'QA',
  quality: 'QA',
  hr: 'HR',
  'hr management': 'HR',
  human_resources: 'HR',
  training: 'Training',
  'training hub': 'Training',
  tasks: 'Tasks',
  kpis: 'KPIs',
  'performance & kpis': 'KPIs',
  kpi: 'KPIs',
  risk: 'Risk',
  'risk register': 'Risk',
  kaizen: 'Kaizen',
  'kaizen improvement': 'Kaizen',
  'business-model': 'Business Model',
  'business model': 'Business Model',
  'products & services': 'Products/Services',
  'products/services': 'Products/Services',
  products: 'Products/Services',
  catalog: 'Products/Services',
  raci: 'RACI',
  'raci matrix': 'RACI',
  comm: 'Communication',
  communication: 'Communication',
  integration: 'Integrations',
  integrations: 'Integrations',
  'integration hub': 'Integrations',
  admin: 'Admin',
  'admin panel': 'Admin',
  build: 'Build'
};

export function getCanonicalModuleKey(mod?: string): string {
  if (!mod) return 'Home';
  const clean = mod.toLowerCase().trim().replace(/[^a-z0-9]/g, ' ');
  // Exact match first
  for (const [k, v] of Object.entries(CANONICAL_MODULE_MAP)) {
    if (clean === k) return v;
  }
  // Substring match second
  for (const [k, v] of Object.entries(CANONICAL_MODULE_MAP)) {
    if (clean.includes(k) || k.includes(clean)) return v;
  }
  return mod.trim();
}

/**
 * Normalizes legacy or partial permission formats into the immutable RolePermissionPayload contract
 */
export function normalizeToRolePermissionPayload(
  rawPerms: any,
  roleId: string | number = '1'
): RolePermissionPayload {
  const result: RolePermissionPayload = {
    role_id: String(roleId),
    modules: {}
  };

  if (!rawPerms || typeof rawPerms !== 'object') {
    return result;
  }

  const parseScreensAndLevels = (modObj: any): { isEnabled: boolean; screens: Record<string, ScreenPermission> } => {
    // If view or is_enabled is explicitly false, it is disabled
    const isEnabled = modObj.is_enabled !== false && modObj.view !== false;
    const screens: Record<string, ScreenPermission> = {};

    // 1. If modObj already has a screens object
    if (modObj.screens && typeof modObj.screens === 'object') {
      for (const [sKey, sVal] of Object.entries(modObj.screens)) {
        const sv = (sVal || {}) as any;
        screens[sKey] = {
          level: sv.level || 'default',
          scope: sv.scope || 'own',
          actions: Array.isArray(sv.actions) ? sv.actions : [],
          fields: sv.fields && typeof sv.fields === 'object' ? sv.fields : {}
        };
      }
    }

    // 2. Derive screens from legacy levels & tabs & custom_actions
    const levels = modObj.levels || {};
    const scopes = modObj.data_scopes || {};
    const seePerms = modObj.see_permissions || {};
    const customActions = modObj.custom_actions || {};

    const screenNames = new Set<string>();
    Object.keys(levels).forEach(k => screenNames.add(k));
    if (modObj.tabs && typeof modObj.tabs === 'object') {
      Object.keys(modObj.tabs).forEach(k => screenNames.add(k));
    }
    Object.keys(scopes).forEach(k => screenNames.add(k));

    Object.keys(customActions).forEach(actKey => {
      const parts = actKey.split(':');
      if (parts.length >= 2) {
        screenNames.add(parts[1]);
      }
    });

    screenNames.forEach(sName => {
      if (!screens[sName]) {
        const rawLvl = levels[sName];
        let lvl: RBACLevel = 'default';
        if (rawLvl === 3 || rawLvl === 'hidden' || (modObj.tabs && modObj.tabs[sName] === false)) {
          lvl = 'hidden';
        } else if (rawLvl === 2 || rawLvl === 'readonly') {
          lvl = 'readonly';
        } else if (rawLvl === 1 || rawLvl === 0 || rawLvl === 'editable') {
          lvl = 'editable';
        }

        const rawScope = scopes[sName] || modObj.data_scope || 'own';
        let sc: RBACDataScope = 'own';
        if (rawScope === 'global' || rawScope === 'all') sc = 'global';
        else if (rawScope === 'department' || rawScope === 'branch') sc = 'department';
        else if (rawScope === 'team') sc = 'team';

        const screenActions: string[] = [];
        Object.entries(customActions).forEach(([actK, actV]) => {
          if (actV === true) {
            if (actK.includes(`:${sName}:`) || actK.startsWith(`${sName}:`) || actK.endsWith(`:${sName}`)) {
              screenActions.push(actK);
            }
          }
        });

        const fields: Record<string, RBACFieldMode> = {};
        Object.entries(seePerms).forEach(([fKey, fVal]) => {
          if (fKey.startsWith(`${sName}_`) || fKey.includes(sName)) {
            const cleanField = fKey.replace(`${sName}_`, '');
            if (fVal === 'no') fields[cleanField] = 'hidden';
            else if (fVal === 'view') fields[cleanField] = 'readonly';
            else fields[cleanField] = 'full_access';
          }
        });

        screens[sName] = {
          level: lvl,
          scope: sc,
          actions: screenActions,
          fields
        };
      }
    });

    return { isEnabled, screens };
  };

  // 1. Process nested modules object if present (e.g. rawPerms.modules)
  if (rawPerms.modules && typeof rawPerms.modules === 'object') {
    for (const [modKey, modVal] of Object.entries(rawPerms.modules)) {
      if (!modVal || typeof modVal !== 'object' || Array.isArray(modVal)) continue;
      const canonMod = getCanonicalModuleKey(modKey);
      const parsed = parseScreensAndLevels(modVal);
      result.modules[canonMod] = {
        is_enabled: parsed.isEnabled,
        screens: parsed.screens
      };
    }
  }

  // 2. Process all top-level keys (e.g. SOPs, Tasks, CRM, Marketing Hub, etc.)
  for (const [key, val] of Object.entries(rawPerms)) {
    if (!val || typeof val !== 'object' || Array.isArray(val)) continue;
    if (key === 'role_id' || key === 'company_id' || key === 'modules') continue;

    const canonMod = getCanonicalModuleKey(key);
    const parsed = parseScreensAndLevels(val);

    // If canonMod already exists from rawPerms.modules, keep the screens if present, but respect disabled state
    if (result.modules[canonMod]) {
      const vAny = val as any;
      if (vAny.view === false || vAny.is_enabled === false) {
        result.modules[canonMod].is_enabled = false;
      }
      if (Object.keys(parsed.screens).length > 0 && Object.keys(result.modules[canonMod].screens).length === 0) {
        result.modules[canonMod].screens = parsed.screens;
      }
    } else {
      result.modules[canonMod] = {
        is_enabled: parsed.isEnabled,
        screens: parsed.screens
      };
    }
  }

  return result;
}
