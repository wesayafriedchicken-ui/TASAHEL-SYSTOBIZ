import { 
  RolePermissionPayload, 
  ModulePermissionDefinition, 
  ScreenPermissionDefinition,
  ScreenAccessLevel,
  DataScopeType,
  FieldAccessMode 
} from '../types/rbac';

// Standard mapping of module aliases to canonical names
export const CANONICAL_MODULES: Record<string, string> = {
  hr: 'HR',
  'hr management': 'HR',
  'hr_management': 'HR',
  qa: 'QA',
  'quality assurance': 'QA',
  'quality': 'QA',
  kb: 'Knowledge Base',
  'knowledge base': 'Knowledge Base',
  'knowledge_base': 'Knowledge Base',
  'knowledge': 'Knowledge Base',
  crm: 'CRM',
  'sales crm': 'CRM',
  'sales': 'CRM',
  leads: 'Leads',
  'crm leads': 'Leads',
  products: 'Products/Services',
  'products/services': 'Products/Services',
  'products & services': 'Products/Services',
  'catalog': 'Products/Services',
  acct: 'Accounting',
  'accounting': 'Accounting',
  sops: 'SOPs',
  'sop management': 'SOPs',
  tasks: 'Tasks',
  comm: 'Communication',
  'communication': 'Communication',
  training: 'Training',
  'training hub': 'Training',
  kaizen: 'Kaizen',
  'kaizen improvement': 'Kaizen',
  automation: 'Automation',
  integration: 'Integrations',
  'integration hub': 'Integrations',
  admin: 'Admin',
  'admin panel': 'Admin',
  dashboard: 'Dashboard',
  'ai-business': 'AI Business',
  'meeting-hub': 'Meeting Hub',
  'business-model': 'Business Model',
  kpis: 'KPIs',
  risk: 'Risk',
  'operations-hub': 'Operations Hub',
  'process-mapping': 'Process Mapping',
  raci: 'RACI'
};

export function getCanonicalModuleName(rawName?: string): string {
  if (!rawName) return 'HR';
  const clean = rawName.toLowerCase().trim().replace(/[^a-z0-9]/g, ' ');
  const normalizedKey = clean.replace(/\s+/g, ' ').trim();
  
  if (CANONICAL_MODULES[normalizedKey]) {
    return CANONICAL_MODULES[normalizedKey];
  }
  
  // Partial search
  for (const [alias, canon] of Object.entries(CANONICAL_MODULES)) {
    if (normalizedKey === alias || normalizedKey.includes(alias) || alias.includes(normalizedKey)) {
      return canon;
    }
  }

  return rawName;
}

export function normalizeScreenKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/^(\/?[a-z0-9_-]+\/)/i, '') // strip leading module prefix like /hr/
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/^_+|_+$/g, '');
}

export function parseScreenLevel(val: any): ScreenAccessLevel {
  if (val === 'hidden' || val === 3 || val === '3' || val === 'no') return 'hidden';
  if (val === 'readonly' || val === 'read_only' || val === 2 || val === '2' || val === 'view') return 'readonly';
  if (val === 'editable' || val === 1 || val === '1' || val === 'full') return 'editable';
  return 'default';
}

export function parseDataScope(val: any): DataScopeType {
  if (!val) return 'own';
  const s = String(val).toLowerCase().trim();
  if (s === 'global' || s === 'all' || s === 'company' || s.includes('كل')) return 'global';
  if (s === 'department' || s === 'branch' || s.includes('قسم')) return 'department';
  if (s === 'team' || s === 'direct_reports' || s.includes('فريق')) return 'team';
  return 'own';
}

export function parseFieldMode(val: any): FieldAccessMode {
  if (!val) return 'full_access';
  const s = String(val).toLowerCase().trim();
  if (s === 'hidden' || s === 'no' || s === 'none' || s === 'deny' || s === 'false') return 'hidden';
  if (s === 'readonly' || s === 'read_only' || s === 'view') return 'readonly';
  return 'full_access';
}

/**
 * Normalizes any role permission data into the strict RolePermissionPayload contract.
 */
export function normalizeRolePermissions(
  raw: any, 
  roleId: string | number = '1'
): RolePermissionPayload {
  const roleIdStr = String(roleId);

  // Default empty payload structure
  const result: RolePermissionPayload = {
    role_id: roleIdStr,
    modules: {}
  };

  if (!raw || typeof raw !== 'object') {
    return result;
  }

  // Case 1: Already wrapped in standardized format with `modules`
  if (raw.modules && typeof raw.modules === 'object') {
    result.role_id = String(raw.role_id || roleIdStr);
    for (const [modKey, modDef] of Object.entries(raw.modules)) {
      const canonMod = getCanonicalModuleName(modKey);
      const screens: Record<string, ScreenPermissionDefinition> = {};

      if (modDef && typeof modDef === 'object') {
        const rawScreens = (modDef as any).screens || {};
        for (const [scrKey, scrDef] of Object.entries(rawScreens)) {
          const cleanScr = normalizeScreenKey(scrKey);
          const s = scrDef as any;
          screens[cleanScr] = {
            level: parseScreenLevel(s?.level),
            scope: parseDataScope(s?.scope),
            actions: Array.isArray(s?.actions) ? s.actions.map(String) : [],
            fields: {}
          };
          if (s?.fields && typeof s.fields === 'object') {
            for (const [fKey, fVal] of Object.entries(s.fields)) {
              screens[cleanScr].fields[fKey] = parseFieldMode(fVal);
            }
          }
        }

        result.modules[canonMod] = {
          is_enabled: (modDef as any).is_enabled !== false,
          screens
        };
      }
    }
    return result;
  }

  // Case 2: Legacy format with top-level module keys (e.g. { HR: { view: true, levels: {}, custom_actions: {} } })
  for (const [modKey, modData] of Object.entries(raw)) {
    if (!modData || typeof modData !== 'object' || modKey === 'role_id' || modKey === 'role') continue;

    const canonMod = getCanonicalModuleName(modKey);
    const m = modData as any;
    const isEnabled = m.view !== false;
    const screens: Record<string, ScreenPermissionDefinition> = {};

    const levels = m.levels || {};
    const scopes = m.data_scopes || {};
    const customActions = m.custom_actions || {};
    const seePerms = m.see_permissions || {};

    // Collect all referenced screen names from levels, scopes, tabs, etc.
    const allScreenKeys = new Set<string>();
    Object.keys(levels).forEach(k => allScreenKeys.add(normalizeScreenKey(k)));
    Object.keys(scopes).forEach(k => allScreenKeys.add(normalizeScreenKey(k)));
    if (m.tabs && typeof m.tabs === 'object') {
      Object.keys(m.tabs).forEach(k => allScreenKeys.add(normalizeScreenKey(k)));
    }

    // Default screens if none explicitly specified
    if (canonMod === 'HR' && allScreenKeys.size === 0) {
      ['dashboard', 'directory', 'payroll', 'departments', 'attendance', 'org_chart'].forEach(k => allScreenKeys.add(k));
    } else if (canonMod === 'QA' && allScreenKeys.size === 0) {
      ['dashboard', 'audits', 'incidents', 'remediations'].forEach(k => allScreenKeys.add(k));
    } else if (canonMod === 'Knowledge Base' && allScreenKeys.size === 0) {
      ['articles', 'categories', 'tags'].forEach(k => allScreenKeys.add(k));
    }

    for (const scr of allScreenKeys) {
      // Find matching level
      let rawLvl: any = levels[scr];
      if (rawLvl === undefined) {
        for (const [lk, lv] of Object.entries(levels)) {
          if (normalizeScreenKey(lk) === scr) {
            rawLvl = lv;
            break;
          }
        }
      }

      // Find matching scope
      let rawScope: any = scopes[scr];
      if (rawScope === undefined) {
        for (const [sk, sv] of Object.entries(scopes)) {
          if (normalizeScreenKey(sk) === scr) {
            rawScope = sv;
            break;
          }
        }
      }
      if (!rawScope) rawScope = scopes.see_scope || m.see_scope || m.data_scope || 'own';

      // Find permitted actions associated with this module/screen
      const grantedActions: string[] = [];
      for (const [actKey, actGranted] of Object.entries(customActions)) {
        if (actGranted) {
          const actLower = actKey.toLowerCase();
          if (actLower.includes(scr) || !actLower.includes(':') || actLower.startsWith(`${canonMod.toLowerCase()}:`)) {
            grantedActions.push(actKey);
          }
        }
      }

      // Find field permissions
      const fields: Record<string, FieldAccessMode> = {};
      for (const [seeKey, seeVal] of Object.entries(seePerms)) {
        const seeLower = seeKey.toLowerCase();
        if (seeLower.startsWith(scr) || seeLower.includes(`_${scr}_`)) {
          const fieldName = seeLower.replace(new RegExp(`^${scr}_?`), '');
          if (fieldName) {
            fields[fieldName] = parseFieldMode(seeVal);
          }
        }
      }

      screens[scr] = {
        level: parseScreenLevel(rawLvl),
        scope: parseDataScope(rawScope),
        actions: grantedActions,
        fields
      };
    }

    result.modules[canonMod] = {
      is_enabled: isEnabled,
      screens
    };
  }

  return result;
}

/**
 * Converts a RolePermissionPayload back into a combined payload containing both:
 * 1. The immutable `modules` contract as required.
 * 2. Legacy mirror properties for full backward compatibility across all legacy components.
 */
export function serializeRolePermissions(payload: RolePermissionPayload): Record<string, any> {
  const result: Record<string, any> = {
    role_id: payload.role_id,
    modules: payload.modules
  };

  // Mirror legacy module structures
  for (const [modKey, modDef] of Object.entries(payload.modules)) {
    const levels: Record<string, number> = {};
    const scopes: Record<string, string> = {};
    const customActions: Record<string, boolean> = {};
    const seePerms: Record<string, string> = {};
    const tabs: Record<string, boolean> = {};

    for (const [scrKey, scrDef] of Object.entries(modDef.screens || {})) {
      const lvlNum = scrDef.level === 'hidden' ? 3 : scrDef.level === 'readonly' ? 2 : scrDef.level === 'editable' ? 1 : 0;
      levels[scrKey] = lvlNum;
      scopes[scrKey] = scrDef.scope;
      tabs[scrKey] = scrDef.level !== 'hidden';

      // Actions
      (scrDef.actions || []).forEach(act => {
        customActions[act] = true;
      });

      // Fields
      for (const [fKey, fMode] of Object.entries(scrDef.fields || {})) {
        const seeVal = fMode === 'hidden' ? 'no' : fMode === 'readonly' ? 'view' : 'full';
        seePerms[`${scrKey}_${fKey}`] = seeVal;
        seePerms[fKey] = seeVal;
      }
    }

    const legacyModuleObj = {
      view: modDef.is_enabled !== false,
      levels,
      data_scopes: scopes,
      custom_actions: customActions,
      see_permissions: seePerms,
      tabs
    };

    result[modKey] = legacyModuleObj;

    // Add common legacy aliases
    if (modKey === 'HR') {
      result['HR Management'] = legacyModuleObj;
      result['hr'] = legacyModuleObj;
      result['hr_management'] = legacyModuleObj;
    } else if (modKey === 'QA') {
      result['Quality Assurance'] = legacyModuleObj;
      result['qa'] = legacyModuleObj;
    } else if (modKey === 'Knowledge Base') {
      result['KnowledgeBase'] = legacyModuleObj;
      result['kb'] = legacyModuleObj;
    } else if (modKey === 'Products/Services') {
      result['Products & Services'] = legacyModuleObj;
      result['Catalog'] = legacyModuleObj;
      result['products'] = legacyModuleObj;
    }
  }

  return result;
}
