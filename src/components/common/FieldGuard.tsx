import React from 'react';
import { useRBAC } from '../../context/RBACContext';
import { useScreenContext } from './ScreenGuard';

export interface FieldGuardProps {
  /**
   * The field key as registered in the screen's field permissions matrix.
   * e.g. "salary", "national_id", "email", "phone"
   */
  fieldKey: string;

  /**
   * Module name (e.g. "HR", "Sales", "QA"). Defaults to current screen context module.
   */
  module?: string;

  /**
   * Screen key (e.g. "directory", "payroll"). Defaults to current screen context screenKey.
   */
  screen?: string;

  /**
   * Input or component to render.
   */
  children: React.ReactNode;

  /**
   * Optional fallback when hidden. Defaults to null (completely unmounted).
   */
  fallback?: React.ReactNode;
}

/**
 * FieldGuard: Declarative Field Visibility Evaluator (Layer 5)
 * 
 * Enforces Field Visibility Modes:
 * - 'hidden': Completely unmounts the element from the DOM.
 * - 'readonly': Clones the input with disabled={true} and readOnly={true}.
 * - 'editable' / 'full_access': Renders normally.
 */
export const FieldGuard: React.FC<FieldGuardProps> = ({
  fieldKey,
  module,
  screen,
  children,
  fallback = null
}) => {
  const { getFieldMode } = useRBAC();
  const screenContext = useScreenContext();

  const activeModule = module || screenContext.module || 'HR';
  const activeScreen = screen || screenContext.screenKey || 'directory';

  const mode = getFieldMode(fieldKey, activeModule, activeScreen);

  // 1. HIDDEN: Unmount completely from DOM
  if (mode === 'hidden') {
    return <>{fallback}</>;
  }

  // 2. READONLY: Render input with disabled={true} and readOnly={true}
  if (mode === 'readonly' && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      readOnly: true,
      'aria-readonly': true,
      className: `${(children as any).props?.className || ''} bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none`
    });
  }

  // 3. EDITABLE: Normal rendering
  return <>{children}</>;
};

export default FieldGuard;
