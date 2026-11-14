import React from 'react';
import { useAuth } from '../../context/AuthContext';
export { ActionGuard } from './ActionGuard';
export { ScreenGuard, useScreenContext } from './ScreenGuard';
export { FieldGuard } from './FieldGuard';
export { DataScopeBadge } from './DataScopeBadge';

export interface GuardProps {
  module: string;
  tab?: string;
  form?: string;
  action?: string;
  customAction?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Guard: React.FC<GuardProps> = ({
  module,
  tab,
  form,
  action,
  customAction,
  children,
  fallback = null
}) => {
  const { checkPermission } = useAuth();
  const effectiveTab = tab || form || '';

  // 1. Custom Action check
  if (customAction) {
    const hasCustom = checkPermission(module, `custom:${customAction}`);
    if (!hasCustom) return <>{fallback}</>;
  }

  // 2. Granular Action check with tab/form
  if (action) {
    const normAction = action.toLowerCase();
    let queryAction = normAction;

    if (effectiveTab) {
      queryAction = `action:${effectiveTab}:${normAction}`;
    } else {
      queryAction = normAction;
    }

    const hasAction = checkPermission(module, queryAction);
    if (!hasAction) return <>{fallback}</>;
  } else if (effectiveTab) {
    // 3. Tab visibility check
    const hasTab = checkPermission(module, `tab:${effectiveTab}`);
    if (!hasTab) return <>{fallback}</>;
  } else {
    // 4. Module view check
    const hasModule = checkPermission(module, 'view');
    if (!hasModule) return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default Guard;
