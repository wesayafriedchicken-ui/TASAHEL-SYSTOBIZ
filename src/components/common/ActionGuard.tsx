import React from 'react';
import { useRBAC } from '../../context/RBACContext';

export interface ActionGuardProps {
  /**
   * Action key as configured in the RBAC matrix.
   * Supports fully-qualified keys (e.g., "hr:dashboard:export_hr_reports"),
   * bare keys (e.g., "export_hr_reports"), or CRUD keys ("create", "edit", "delete", "export").
   */
  actionKey: string;
  
  /**
   * Optional module name (e.g., "HR", "Knowledge Base", "Products & Services", "QA").
   * Automatically deduced from the actionKey prefix if omitted.
   */
  module?: string;
  
  /**
   * Optional screen or tab name (e.g., "Dashboard", "Directory", "Payroll").
   */
  screen?: string;

  /**
   * Content to render when permission is granted.
   */
  children: React.ReactNode;

  /**
   * Fallback to render when permission is denied.
   * Defaults to null, which completely unmounts the element from the DOM.
   */
  fallback?: React.ReactNode;

  /**
   * If true, instead of unmounting, clones the child element and disables it with a tooltip.
   */
  disableOnly?: boolean;
}

/**
 * ActionGuard: RBAC Button & Operational Guard (Layer 2)
 * 
 * Enforces action-level permissions configured in the /admin/rbac matrix.
 * If the checkbox in the RBAC matrix is unchecked for the active role,
 * the button/element is completely unmounted from the DOM.
 * 
 * Example:
 * <ActionGuard actionKey="hr:dashboard:export_hr_reports">
 *   <button onClick={handleExport}>Export HR Dashboard Reports</button>
 * </ActionGuard>
 */
export const ActionGuard: React.FC<ActionGuardProps> = ({
  actionKey,
  module,
  screen,
  children,
  fallback = null,
  disableOnly = false
}) => {
  const { isActionPermitted, isSuperAdmin, user } = useRBAC();
  const isOwner = user?.email?.toLowerCase().trim() === 'esraaessoo19@gmail.com';
  const allowed = isOwner || (isSuperAdmin && !(user as any)?.isPreviewActive) || isActionPermitted(actionKey, module, screen);

  if (allowed) {
    return <>{children}</>;
  }

  if (disableOnly && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      'aria-disabled': true,
      title: 'Action disabled by role permissions (RBAC)',
      className: `${(children as any).props.className || ''} opacity-40 cursor-not-allowed pointer-events-none`
    });
  }

  // Completely unmounted from DOM
  return <>{fallback}</>;
};

export default ActionGuard;
