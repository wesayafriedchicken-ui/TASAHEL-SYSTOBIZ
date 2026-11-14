import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModuleMetadata, getCanonicalModuleId, ModuleMetadata } from '../../../utils/moduleRegistry';
import { SYSTEM_ROLE_PRESETS } from '../../../components/Admin/rbacPresets';
import { normalizeRolePermissions, serializeRolePermissions } from '../../../utils/rbacEngine';
import { safeSetItem } from '../../../utils/safeStorage';

export interface RBACContextType {
  roleId: string;
  moduleId: string;
  canonModule: string;
  role: { id: number; name: string; description?: string; permissions?: any } | null;
  moduleMetadata: ModuleMetadata | null;
  permissions: any;
  loading: boolean;
  saving: boolean;
  saveErrorMsg: string | null;
  setSaveErrorMsg: (msg: string | null) => void;
  hasChanges: boolean;
  savePermissions: () => Promise<boolean>;
  updateTabLevel: (tabName: string, level: number) => void;
  updateTabDataScope: (tabName: string, scope: string) => void;
  toggleTabVisibility: (tabName: string, visible: boolean) => void;
  toggleTabVisibilityWithCascade: (tabName: string, visible: boolean, childTabs?: string[]) => void;
  toggleCustomAction: (actionId: string, enabled: boolean) => void;
  setSeePermission: (key: string, value: 'no' | 'view' | 'full') => void;
  bulkSetSeePermissions: (keys: string[], value: 'no' | 'view' | 'full') => void;
  setSelfAccess: (allow: boolean, level: string) => void;
  toggleHomeWidget: (widgetId: string, enabled: boolean) => void;
  applyPreset: (presetId: string) => void;
  getTabLevel: (tabName: string) => number;
  getTabDataScope: (tabName: string) => string;
  isTabVisible: (tabName: string) => boolean;
  isCustomActionActive: (actionId: string) => boolean;
  getSeePermission: (key: string, fallback?: 'no' | 'view' | 'full') => 'no' | 'view' | 'full';
  matrixSearch: string;
  setMatrixSearch: (q: string) => void;
}

const RBACContext = createContext<RBACContextType | null>(null);

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { roleId = '', moduleId = '' } = useParams<{ roleId: string; moduleId: string }>();
  const navigate = useNavigate();

  const [role, setRole] = useState<{ id: number; name: string; description?: string } | null>(null);
  const [permissions, setPermissions] = useState<any>({});
  const [initialPermissionsStr, setInitialPermissionsStr] = useState<string>('{}');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [matrixSearch, setMatrixSearch] = useState<string>('');

  const canonModule = useMemo(() => {
    return getCanonicalModuleId(decodeURIComponent(moduleId));
  }, [moduleId]);

  const moduleMetadata = useMemo(() => {
    return getModuleMetadata(decodeURIComponent(moduleId));
  }, [moduleId]);

  // Fetch module permissions from server
  const fetchPermissions = useCallback(async () => {
    if (!roleId || !moduleId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const encodedMod = encodeURIComponent(decodeURIComponent(moduleId));
      const res = await fetch(`/api/admin/roles/${roleId}/modules/${encodedMod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch role module permissions');
      }
      const data = await res.json();
      setRole(data.role || { id: Number(roleId), name: `Role #${roleId}` });
      const currentPerms = data.permissions || {};
      setPermissions(currentPerms);
      setInitialPermissionsStr(JSON.stringify(currentPerms));
    } catch (err) {
      console.error('Error fetching RBAC permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [roleId, moduleId]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(permissions) !== initialPermissionsStr;
  }, [permissions, initialPermissionsStr]);

  // Save permissions to server
  const savePermissions = async (): Promise<boolean> => {
    if (!roleId || !moduleId || role?.name === 'Admin') return false;
    setSaving(true);
    setSaveErrorMsg(null);
    try {
      const token = localStorage.getItem('token');
      const storedUserStr = localStorage.getItem('user');
      let userId = localStorage.getItem('user_id') || '1';
      try {
        if (storedUserStr) {
          const parsed = JSON.parse(storedUserStr);
          if (parsed?.id) userId = String(parsed.id);
        }
      } catch (e) {}

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-user-id': userId
      };
      if (token && token !== 'null' && token !== 'undefined' && token !== '') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const encodedMod = encodeURIComponent(decodeURIComponent(moduleId));
      // Build standardized screens map conformant to RolePermissionPayload contract (Req 1)
      const standardScreens: Record<string, any> = {};
      const levels = permissions.levels || {};
      const scopes = permissions.data_scopes || {};
      const customActions = permissions.custom_actions || {};
      const seePerms = permissions.see_permissions || {};

      const screenKeys = new Set<string>();
      Object.keys(levels).forEach(k => screenKeys.add(k));
      Object.keys(scopes).forEach(k => screenKeys.add(k));
      if (canonModule === 'HR' && screenKeys.size === 0) {
        ['directory', 'payroll', 'departments', 'attendance', 'performance', 'recruitment', 'complaints', 'orgchart'].forEach(k => screenKeys.add(k));
      }

      screenKeys.forEach(sKey => {
        const lvl = levels[sKey];
        const lvlStr = (lvl === 3 || lvl === 'hidden') ? 'hidden' :
                       (lvl === 2 || lvl === 'readonly') ? 'readonly' :
                       (lvl === 1 || lvl === 0 || lvl === 'editable') ? 'editable' : 'default';
        const sc = scopes[sKey] || permissions.data_scope || 'own';
        const scStr = (sc === 'global' || sc === 'all') ? 'global' :
                      (sc === 'department' || sc === 'branch') ? 'department' :
                      (sc === 'team') ? 'team' : 'own';

        const grantedActions: string[] = [];
        Object.entries(customActions).forEach(([actK, actV]) => {
          if (actV === true) {
            grantedActions.push(actK);
          }
        });

        const fields: Record<string, 'full_access' | 'readonly' | 'hidden'> = {};
        Object.entries(seePerms).forEach(([fK, fV]) => {
          const mode = fV === 'no' ? 'hidden' : fV === 'view' ? 'readonly' : 'full_access';
          if (fK.startsWith(`${sKey}_`) || fK.includes(sKey)) {
            const cleanField = fK.replace(`${sKey}_`, '');
            fields[cleanField] = mode;
          } else {
            fields[fK] = mode;
          }
        });

        standardScreens[sKey] = {
          level: lvlStr,
          scope: scStr,
          actions: grantedActions,
          fields
        };
      });

      const enrichedPermissions: any = {
        ...permissions,
        is_enabled: permissions.view !== false && permissions.is_enabled !== false,
        screens: standardScreens
      };

      if (canonModule === 'Home' || moduleId.toLowerCase() === 'home' || moduleId.toLowerCase().includes('home')) {
        const hw: Record<string, any> = {};
        const t = permissions?.tabs || {};
        const lvl = permissions?.levels || {};
        Object.keys(t).forEach(k => {
          hw[k] = { enabled: Boolean(t[k]) && Number(lvl[k]) !== 3 };
        });
        enrichedPermissions.home_widgets = hw;
      }

      const res = await fetch(`/api/admin/roles/${roleId}/modules/${encodedMod}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ permissions: enrichedPermissions })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save permissions');
      }

      setInitialPermissionsStr(JSON.stringify(permissions));

      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u && Number(u.role_id) === Number(roleId)) {
            const userPerms = u.permissions || {};
            userPerms[canonModule] = enrichedPermissions;
            const isProd = canonModule === 'Products/Services' || moduleId.toLowerCase().includes('product') || moduleId.toLowerCase().includes('catalog');
            const isKnowledge = canonModule === 'Knowledge Base' || moduleId.toLowerCase().includes('knowledge') || moduleId.toLowerCase() === 'kb';
            if (canonModule === 'HR' || moduleId.toLowerCase() === 'hr' || moduleId.toLowerCase().includes('human')) {
              userPerms['HR'] = enrichedPermissions;
              userPerms['HR Management'] = enrichedPermissions;
              userPerms['hr'] = enrichedPermissions;
              userPerms['hr_management'] = enrichedPermissions;
            }
            if (canonModule === 'QA') {
              userPerms['QA'] = enrichedPermissions;
              userPerms['Quality Assurance'] = enrichedPermissions;
              userPerms['qa'] = enrichedPermissions;
            }
            if (isProd) {
              userPerms['Products/Services'] = enrichedPermissions;
              userPerms['Products%2FServices'] = enrichedPermissions;
              userPerms['Products & Services'] = enrichedPermissions;
              userPerms['Catalog'] = enrichedPermissions;
              userPerms['catalog'] = enrichedPermissions;
              userPerms['products'] = enrichedPermissions;
            }
            if (isKnowledge) {
              userPerms['Knowledge Base'] = enrichedPermissions;
              userPerms['Knowledge%20Base'] = enrichedPermissions;
              userPerms['kb'] = enrichedPermissions;
              userPerms['knowledge_base'] = enrichedPermissions;
              userPerms['knowledge'] = enrichedPermissions;
            }
            if (canonModule === 'Home' || moduleId.toLowerCase() === 'home' || moduleId.toLowerCase().includes('home')) {
              userPerms['Home'] = enrichedPermissions;
              userPerms['home'] = enrichedPermissions;
              userPerms['Home / Workspace'] = enrichedPermissions;
            }
            if (canonModule === 'QA' || moduleId.toLowerCase() === 'qa' || moduleId.toLowerCase().includes('quality')) {
              userPerms['QA'] = enrichedPermissions;
              userPerms['Quality Assurance'] = enrichedPermissions;
              userPerms['qa'] = enrichedPermissions;
              userPerms['quality_assurance'] = enrichedPermissions;
            }
            const standardizedUserPerms = serializeRolePermissions(normalizeRolePermissions(userPerms, roleId));
            u.permissions = { ...userPerms, ...standardizedUserPerms };
            safeSetItem('user', JSON.stringify(u));
          }

          const storedPreview = localStorage.getItem('preview_role');
          if (storedPreview) {
            const pRole = JSON.parse(storedPreview);
            if (pRole && Number(pRole.id) === Number(roleId)) {
              const pPerms = pRole.permissions || {};
              pPerms[canonModule] = enrichedPermissions;
              if (canonModule === 'HR' || moduleId.toLowerCase() === 'hr' || moduleId.toLowerCase().includes('human')) {
                pPerms['HR'] = enrichedPermissions;
                pPerms['HR Management'] = enrichedPermissions;
                pPerms['hr'] = enrichedPermissions;
                pPerms['hr_management'] = enrichedPermissions;
              }
              if (canonModule === 'Home' || moduleId.toLowerCase() === 'home' || moduleId.toLowerCase().includes('home')) {
                pPerms['Home'] = enrichedPermissions;
                pPerms['home'] = enrichedPermissions;
                pPerms['Home / Workspace'] = enrichedPermissions;
              }
              if (canonModule === 'QA' || moduleId.toLowerCase() === 'qa' || moduleId.toLowerCase().includes('quality')) {
                pPerms['QA'] = enrichedPermissions;
                pPerms['Quality Assurance'] = enrichedPermissions;
                pPerms['qa'] = enrichedPermissions;
                pPerms['quality_assurance'] = enrichedPermissions;
              }
              const standardizedPPerms = serializeRolePermissions(normalizeRolePermissions(pPerms, roleId));
              pRole.permissions = { ...pPerms, ...standardizedPPerms };
              safeSetItem('preview_role', JSON.stringify(pRole));
            }
          }
        }
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('sys_permissions_updated', { 
        detail: { roleId, moduleId, canonModule, permissions: enrichedPermissions } 
      }));
      return true;
    } catch (err) {
      const errorMsg = (err as Error)?.message || 'Failed to save permissions';
      console.error('Error saving RBAC permissions:', err);
      setSaveErrorMsg(errorMsg);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Helper getters
  const getTabLevel = useCallback((tabName: string): number => {
    const safeTab = tabName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const levels = permissions?.levels || {};
    if (levels[safeTab] !== undefined) return Number(levels[safeTab]);
    if (levels[tabName] !== undefined) return Number(levels[tabName]);
    return 0; // Default
  }, [permissions]);

  const getTabDataScope = useCallback((tabName: string): string => {
    const safeTab = tabName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const scopes = permissions?.data_scopes || {};
    if (scopes[safeTab]) return scopes[safeTab];
    if (scopes[tabName]) return scopes[tabName];
    return 'own';
  }, [permissions]);

  const isTabVisible = useCallback((tabName: string): boolean => {
    const safeTab = tabName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const tabsPerm = permissions?.tabs;
    if (tabsPerm === undefined) return true;
    if (typeof tabsPerm === 'object') {
      if (tabsPerm[safeTab] !== undefined) return !!tabsPerm[safeTab];
      if (tabsPerm[tabName] !== undefined) return !!tabsPerm[tabName];
    }
    return true;
  }, [permissions]);

  const isCustomActionActive = useCallback((actionId: string): boolean => {
    const customActions = permissions?.custom_actions || {};
    return !!customActions[actionId];
  }, [permissions]);

  const getSeePermission = useCallback((key: string, fallback: 'no' | 'view' | 'full' = 'full'): 'no' | 'view' | 'full' => {
    const seePerms = permissions?.see_permissions || {};
    return seePerms[key] || fallback;
  }, [permissions]);

  // Updaters
  const updateTabLevel = useCallback((tabName: string, level: number) => {
    if (role?.name === 'Admin') return;
    const safeTab = tabName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setPermissions((prev: any) => {
      const currentLevels = { ...(prev?.levels || {}) };
      currentLevels[safeTab] = level;
      currentLevels[tabName] = level;
      return { ...prev, levels: currentLevels };
    });
  }, [role]);

  const updateTabDataScope = useCallback((tabName: string, scope: string) => {
    if (role?.name === 'Admin') return;
    const safeTab = tabName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setPermissions((prev: any) => {
      const currentScopes = { ...(prev?.data_scopes || {}) };
      currentScopes[safeTab] = scope;
      currentScopes[tabName] = scope;
      return { ...prev, data_scopes: currentScopes };
    });
  }, [role]);

  const toggleTabVisibility = useCallback((tabName: string, visible: boolean) => {
    if (role?.name === 'Admin') return;
    const safeTab = tabName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setPermissions((prev: any) => {
      const currentTabs = typeof prev?.tabs === 'object' ? { ...(prev?.tabs || {}) } : {};
      currentTabs[safeTab] = visible;
      currentTabs[tabName] = visible;

      const currentLevels = { ...(prev?.levels || {}) };
      if (!visible) {
        currentLevels[safeTab] = 3; // Hidden
        currentLevels[tabName] = 3;
      } else {
        if (currentLevels[safeTab] === 3) currentLevels[safeTab] = 0;
        if (currentLevels[tabName] === 3) currentLevels[tabName] = 0;
      }

      return {
        ...prev,
        tabs: currentTabs,
        levels: currentLevels
      };
    });
  }, [role]);

  const toggleTabVisibilityWithCascade = useCallback((tabName: string, visible: boolean, childTabs: string[] = []) => {
    if (role?.name === 'Admin') return;
    const allTabsToUpdate = [tabName, ...childTabs];
    setPermissions((prev: any) => {
      const currentTabs = typeof prev?.tabs === 'object' ? { ...(prev?.tabs || {}) } : {};
      const currentLevels = { ...(prev?.levels || {}) };

      allTabsToUpdate.forEach(t => {
        const safe = t.toLowerCase().replace(/[^a-z0-9]/g, '_');
        currentTabs[safe] = visible;
        currentTabs[t] = visible;
        if (!visible) {
          currentLevels[safe] = 3;
          currentLevels[t] = 3;
        } else {
          if (currentLevels[safe] === 3) currentLevels[safe] = 0;
          if (currentLevels[t] === 3) currentLevels[t] = 0;
        }
      });

      return {
        ...prev,
        tabs: currentTabs,
        levels: currentLevels
      };
    });
  }, [role]);

  const toggleCustomAction = useCallback((actionId: string, enabled: boolean) => {
    if (role?.name === 'Admin') return;
    setPermissions((prev: any) => {
      const currentActions = { ...(prev?.custom_actions || {}) };
      currentActions[actionId] = enabled;
      return { ...prev, custom_actions: currentActions };
    });
  }, [role]);

  const setSeePermission = useCallback((key: string, value: 'no' | 'view' | 'full') => {
    if (role?.name === 'Admin') return;
    setPermissions((prev: any) => {
      const currentSee = { ...(prev?.see_permissions || {}) };
      currentSee[key] = value;
      return { ...prev, see_permissions: currentSee };
    });
  }, [role]);

  const bulkSetSeePermissions = useCallback((keys: string[], value: 'no' | 'view' | 'full') => {
    if (role?.name === 'Admin') return;
    setPermissions((prev: any) => {
      const currentSee = { ...(prev?.see_permissions || {}) };
      keys.forEach(k => {
        currentSee[k] = value;
      });
      return { ...prev, see_permissions: currentSee };
    });
  }, [role]);

  const setSelfAccess = useCallback((allow: boolean, level: string) => {
    if (role?.name === 'Admin') return;
    setPermissions((prev: any) => ({
      ...prev,
      self_access: { allow, level }
    }));
  }, [role]);

  const toggleHomeWidget = useCallback((widgetId: string, enabled: boolean) => {
    if (role?.name === 'Admin') return;
    setPermissions((prev: any) => {
      const homeWidgets = { ...(prev?.home_widgets || {}) };
      homeWidgets[widgetId] = {
        ...(homeWidgets[widgetId] || {}),
        enabled
      };
      return { ...prev, home_widgets: homeWidgets };
    });
  }, [role]);

  const applyPreset = useCallback((presetId: string) => {
    if (role?.name === 'Admin') return;
    const preset = SYSTEM_ROLE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setPermissions((prev: any) => {
      const updated = { ...prev };
      
      // Update core CRUD actions
      Object.entries(preset.permissions).forEach(([act, val]) => {
        updated[act] = val;
      });

      // Update levels and scopes for tabs
      const levels: Record<string, number> = { ...(prev?.levels || {}) };
      const scopes: Record<string, string> = { ...(prev?.data_scopes || {}) };
      const seePerms: Record<string, string> = { ...(prev?.see_permissions || {}) };
      const customActions: Record<string, boolean> = { ...(prev?.custom_actions || {}) };

      if (moduleMetadata) {
        moduleMetadata.tabs.forEach(tab => {
          const safe = tab.id.toLowerCase().replace(/[^a-z0-9]/g, '_');
          levels[safe] = preset.level;
          levels[tab.id] = preset.level;
          scopes[safe] = preset.dataScope;
          scopes[tab.id] = preset.dataScope;

          if (tab.actions) {
            tab.actions.forEach(a => {
              // Grant custom actions if editor/manager, disable if viewer
              if (preset.id === 'viewer') {
                customActions[a.id] = false;
              } else if (a.id.includes('customize_layout')) {
                // Layout schema customization is strictly restricted and disabled by default for non-admin presets
                customActions[a.id] = preset.id === 'admin' || preset.id === 'super_admin';
              } else if (preset.id === 'manager' || preset.id === 'admin') {
                customActions[a.id] = true;
              } else {
                // For contributor or requester, leave safe defaults
                customActions[a.id] = !a.category || a.category !== 'sensitive';
              }
            });
          }

          if (tab.sections) {
            tab.sections.forEach(sec => {
              seePerms[sec.key] = preset.seePermissions;
              sec.fields.forEach(f => {
                const safeF = f.key.toLowerCase().replace(/[^a-z0-9]/g, '_');
                seePerms[`${sec.key}_${safeF}`] = preset.seePermissions;
              });
            });
          }
        });
      }

      updated.levels = levels;
      updated.data_scopes = scopes;
      updated.see_permissions = seePerms;
      updated.custom_actions = customActions;

      return updated;
    });
  }, [role, moduleMetadata]);

  const value = {
    roleId,
    moduleId,
    canonModule,
    role,
    moduleMetadata,
    permissions,
    loading,
    saving,
    saveErrorMsg,
    setSaveErrorMsg,
    hasChanges,
    savePermissions,
    updateTabLevel,
    updateTabDataScope,
    toggleTabVisibility,
    toggleTabVisibilityWithCascade,
    toggleCustomAction,
    setSeePermission,
    bulkSetSeePermissions,
    setSelfAccess,
    toggleHomeWidget,
    applyPreset,
    getTabLevel,
    getTabDataScope,
    isTabVisible,
    isCustomActionActive,
    getSeePermission,
    matrixSearch,
    setMatrixSearch
  };

  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
};
