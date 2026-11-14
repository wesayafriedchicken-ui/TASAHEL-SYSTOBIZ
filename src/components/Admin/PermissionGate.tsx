import React, { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';

interface Permissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
}

interface PermissionGateProps {
  module: string;
  action: keyof Permissions | string;
  tab?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * PermissionGate: Global Action & Screen Visibility Gate
 * 
 * Enforces:
 * - Module visibility in Sidebar without cascading unmounts (Requirement 2)
 * - Default-Deny for operational actions (Requirement 1 & 3)
 * - Screen-level hidden states
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  module, 
  action, 
  tab,
  children, 
  fallback = null 
}) => {
  const { checkPermission } = useAuth();
  const { isSuperAdmin, isScreenHidden, isActionPermitted, isModuleVisible } = useRBAC();
  
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // 1. MODULE-LEVEL NAVIGATION EVALUATION (Requirement 2):
  // A module link in the sidebar MUST be visible IF module.is_enabled === true
  // (or if at least ONE of its child screens has level !== 'hidden').
  // Never blank out the entire sidebar if an error occurs.
  if (action === 'view' && !tab) {
    if (isModuleVisible(module)) {
      return <>{children}</>;
    }
    return <>{fallback}</>;
  }

  // 2. CHILD SCREEN / TAB EVALUATION:
  // If a child screen is marked level: 'hidden', hide ONLY that specific submenu item or tab,
  // without touching the parent navigation shell.
  if (action === 'view' && tab) {
    if (isScreenHidden(tab, module)) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }

  // If a tab is specified and marked hidden, deny all actions within it
  if (tab && isScreenHidden(tab, module)) {
    return <>{fallback}</>;
  }

  // 3. OPERATIONAL ACTION EVALUATION (Default-Deny Zero-Trust):
  const rbacPermitted = isActionPermitted(action as string, module, tab);
  const actionQuery = tab ? `action:${tab}:${action}` : (action as string);
  const authPermitted = checkPermission(module, actionQuery);

  if (rbacPermitted && authPermitted) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export const useHasPermission = (module: string, action: keyof Permissions | string, tab?: string) => {
  const { checkPermission } = useAuth();
  const { isSuperAdmin, isScreenHidden, isActionPermitted, isModuleVisible } = useRBAC();
  
  if (isSuperAdmin) return true;

  if (action === 'view' && !tab) {
    return isModuleVisible(module);
  }

  if (tab && isScreenHidden(tab, module)) {
    return false;
  }

  if (action === 'view' && tab) {
    return !isScreenHidden(tab, module);
  }

  const actionQuery = tab ? `action:${tab}:${action}` : (action as string);
  return isActionPermitted(action as string, module, tab) && checkPermission(module, actionQuery);
};
