import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export interface ActionControl {
  id: number;
  company_id: number;
  action_key: string;
  tab_id: string;
  section_name: string;
  label_en: string;
  label_ar?: string;
  state: 'active' | 'disabled' | 'hidden';
  permission_scope: 'super_admin' | 'direct_manager' | 'self' | 'everyone';
  tooltip_text?: string;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ActionSecurityStatus {
  isVisible: boolean;
  isDisabled: boolean;
  tooltip?: string;
  labelEn: string;
  labelAr?: string;
  state: 'active' | 'disabled' | 'hidden';
  permissionScope: 'super_admin' | 'direct_manager' | 'self' | 'everyone';
}

// In-memory cache & in-flight promise tracker for action controls across all components
interface CacheEntry {
  data: ActionControl[];
  timestamp: number;
}

const controlsCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<ActionControl[]>>();
const CACHE_TTL_MS = 60000; // 1 minute

async function fetchActionControlsWithRetry(tabId?: string, retries = 3, delay = 400): Promise<ActionControl[]> {
  const cacheKey = tabId || '__all__';

  // Return existing in-flight request if one is already running
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  const promise = (async () => {
    let lastError: any = null;
    const url = tabId 
      ? `/api/hr/action-controls?tab_id=${encodeURIComponent(tabId)}`
      : `/api/hr/action-controls`;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const token = typeof window !== 'undefined' 
          ? (localStorage.getItem('token') || localStorage.getItem('auth_token'))
          : null;
          
        const headers: Record<string, string> = {
          'Accept': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(url, { headers });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to load action controls`);
        }
        const data: ActionControl[] = await res.json();
        
        // Update in-memory cache
        controlsCache.set(cacheKey, {
          data: data || [],
          timestamp: Date.now()
        });

        // Backup to sessionStorage
        try {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(`hr_action_controls_${cacheKey}`, JSON.stringify(data || []));
          }
        } catch {
          // ignore storage quota errors
        }

        return data || [];
      } catch (err: any) {
        lastError = err;
        if (attempt < retries - 1) {
          // Exponential backoff
          await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
        }
      }
    }

    // Fallback 1: Return from memory cache if available
    const cached = controlsCache.get(cacheKey);
    if (cached && cached.data.length > 0) {
      return cached.data;
    }

    // Fallback 2: Return from sessionStorage if available
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(`hr_action_controls_${cacheKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {
      // ignore
    }

    // Fallback 3: Return empty array gracefully instead of throwing to prevent app crash
    return [];
  })();

  inFlightRequests.set(cacheKey, promise);

  try {
    return await promise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}

export function useActionControls(tabId?: string) {
  const { user } = useAuth();
  const cacheKey = tabId || '__all__';

  // Synchronously initialize from cache or sessionStorage if available
  const [controls, setControls] = useState<ActionControl[]>(() => {
    const cached = controlsCache.get(cacheKey);
    if (cached && cached.data) return cached.data;
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem(`hr_action_controls_${cacheKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(controls.length === 0);
  const [error, setError] = useState<string | null>(null);

  const fetchControls = useCallback(async (force = false) => {
    if (!force) {
      const cached = controlsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS && cached.data.length > 0) {
        setControls(cached.data);
        setLoading(false);
        setError(null);
        return;
      }
    }

    try {
      if (controls.length === 0) {
        setLoading(true);
      }
      const data = await fetchActionControlsWithRetry(tabId);
      setControls(data);
      setError(null);
    } catch (err: any) {
      // Graceful handling without breaking the app
      if (controls.length === 0) {
        setError(err.message || 'Unable to load action controls');
      }
    } finally {
      setLoading(false);
    }
  }, [tabId, cacheKey, controls.length]);

  useEffect(() => {
    fetchControls();

    const handleRefresh = () => {
      controlsCache.delete(cacheKey);
      fetchControls(true);
    };

    window.addEventListener('hr-action-controls-updated', handleRefresh);
    return () => {
      window.removeEventListener('hr-action-controls-updated', handleRefresh);
    };
  }, [fetchControls, cacheKey]);

  const updateControl = async (id: number, updates: Partial<ActionControl>) => {
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('token') || localStorage.getItem('auth_token'))
      : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/hr/action-controls/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update action control');
    }
    const updated = await res.json();
    controlsCache.clear();
    setControls(prev => prev.map(c => c.id === id ? updated : c));
    window.dispatchEvent(new CustomEvent('hr-action-controls-updated'));
    return updated;
  };

  const createControl = async (data: Omit<ActionControl, 'id' | 'company_id'>) => {
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('token') || localStorage.getItem('auth_token'))
      : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/hr/action-controls`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create action control');
    }
    const created = await res.json();
    controlsCache.clear();
    setControls(prev => [...prev, created]);
    window.dispatchEvent(new CustomEvent('hr-action-controls-updated'));
    return created;
  };

  const deleteControl = async (id: number) => {
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('token') || localStorage.getItem('auth_token'))
      : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/hr/action-controls/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete action control');
    }
    controlsCache.clear();
    setControls(prev => prev.filter(c => c.id !== id));
    window.dispatchEvent(new CustomEvent('hr-action-controls-updated'));
  };

  const resetDefaults = async () => {
    const token = typeof window !== 'undefined' 
      ? (localStorage.getItem('token') || localStorage.getItem('auth_token'))
      : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`/api/hr/action-controls/reset`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to reset action controls');
    controlsCache.clear();
    await fetchControls(true);
    window.dispatchEvent(new CustomEvent('hr-action-controls-updated'));
  };

  /**
   * Check dynamic button status for a specific action key
   */
  const getActionStatus = useCallback((
    actionKey: string, 
    targetEmployeeUserId?: number | string | null,
    targetEmployeeReportingToId?: number | string | null
  ): ActionSecurityStatus => {
    const control = controls.find(c => c.action_key === actionKey);
    
    // If not found in loaded controls, default to active / visible
    if (!control) {
      return {
        isVisible: true,
        isDisabled: false,
        labelEn: actionKey,
        state: 'active',
        permissionScope: 'everyone'
      };
    }

    if (control.state === 'hidden') {
      return {
        isVisible: false,
        isDisabled: true,
        tooltip: 'This action is hidden by administrative security policy.',
        labelEn: control.label_en,
        labelAr: control.label_ar,
        state: 'hidden',
        permissionScope: control.permission_scope
      };
    }

    const isSuperAdmin = Boolean(
      user && (
        (user as any).is_super_admin || 
        user.role === 'admin' || 
        user.role === 'super_admin' || 
        (user as any).permissions?.includes?.('all') ||
        (user as any).permissions?.includes?.('super_admin')
      )
    );

    // If state is disabled, always greyed out with tooltip for non-super-admins
    if (control.state === 'disabled') {
      return {
        isVisible: true,
        isDisabled: !isSuperAdmin,
        tooltip: control.tooltip_text || 'You are not authorized to perform this action',
        labelEn: control.label_en,
        labelAr: control.label_ar,
        state: 'disabled',
        permissionScope: control.permission_scope
      };
    }

    // Evaluate permission scope
    let hasScopePermission = true;
    let fallbackTooltip: string | undefined = undefined;

    switch (control.permission_scope) {
      case 'super_admin':
        if (!isSuperAdmin) {
          hasScopePermission = false;
          fallbackTooltip = 'Only Super Admins are authorized to perform this action';
        }
        break;

      case 'direct_manager':
        if (!isSuperAdmin) {
          const currentUserId = String(user?.id);
          const isDirectManager = targetEmployeeReportingToId && String(targetEmployeeReportingToId) === currentUserId;
          if (!isDirectManager) {
            hasScopePermission = false;
            fallbackTooltip = 'Only direct managers and Super Admins are authorized to perform this action';
          }
        }
        break;

      case 'self':
        if (!isSuperAdmin) {
          const currentUserId = String(user?.id);
          const isSelf = targetEmployeeUserId && String(targetEmployeeUserId) === currentUserId;
          if (!isSelf) {
            hasScopePermission = false;
            fallbackTooltip = 'Only the employee themselves or a Super Admin is authorized to perform this action';
          }
        }
        break;

      case 'everyone':
      default:
        hasScopePermission = true;
        break;
    }

    return {
      isVisible: true,
      isDisabled: !hasScopePermission,
      tooltip: !hasScopePermission ? (control.tooltip_text || fallbackTooltip) : undefined,
      labelEn: control.label_en,
      labelAr: control.label_ar,
      state: control.state,
      permissionScope: control.permission_scope
    };
  }, [controls, user]);

  return {
    controls,
    loading,
    error,
    refreshControls: fetchControls,
    updateControl,
    createControl,
    deleteControl,
    resetDefaults,
    getActionStatus
  };
}
