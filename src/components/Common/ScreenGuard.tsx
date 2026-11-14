import React, { createContext, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Eye, Home, ArrowLeft } from 'lucide-react';
import { useRBAC, RBACLevel } from '../../context/RBACContext';

export interface ScreenGuardProps {
  screenKey: string;
  module?: string;
  title?: string;
  requiredAction?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export interface ScreenContextType {
  isReadOnly: boolean;
  isReadOnlyScreen: boolean;
  level: RBACLevel;
  screenKey: string;
  module: string;
}

const ScreenContext = createContext<ScreenContextType>({
  isReadOnly: false,
  isReadOnlyScreen: false,
  level: 'editable',
  screenKey: '',
  module: ''
});

export const useScreenContext = () => useContext(ScreenContext);

/**
 * AccessDenied (403) Page Component
 */
export const AccessDenied: React.FC<{
  screenKey?: string;
  module?: string;
  title?: string;
  message?: string;
}> = ({ screenKey = 'Screen', module = 'System', title, message }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[500px] w-full flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-rose-950/40 p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-black uppercase tracking-wider">
            HTTP 403 Forbidden / Access Denied
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">
            {title || 'Screen Access Restricted'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            {message || `Your current role does not have permission to access [${module} > ${screenKey}]. Contact your system administrator to adjust your role access permissions in /admin/rbac.`}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all shadow-md cursor-pointer border-none"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * ScreenGuard: Universal Screen Access Guard (Requirement 3)
 * 
 * Enforces Screen Access Levels:
 * - hidden: Renders Access Denied (403) or custom fallback.
 * - readonly: Renders screen, provides context flag isReadOnlyScreen = true
 *   and automatically disables submit buttons and inputs.
 * - editable / default: Renders screen normally.
 */
export const ScreenGuard: React.FC<ScreenGuardProps> = ({
  screenKey,
  module = 'HR',
  title,
  requiredAction,
  children,
  fallback
}) => {
  const { 
    getScreenLevelString, 
    canPerformAction, 
    isSuperAdmin 
  } = useRBAC();

  const rawLevel = useMemo(() => {
    if (isSuperAdmin) return 'editable';
    const primary = getScreenLevelString(screenKey, module);
    if (primary !== 'hidden') return primary;

    // Check common aliases and parent screen fallbacks
    if (screenKey === 'directory_add_employee' || screenKey === 'directory/new' || screenKey === '/hr/directory/new') {
      const sub = getScreenLevelString('directory_add_employee', module);
      if (sub !== 'hidden') return sub;
      const parent = getScreenLevelString('directory', module);
      if (parent !== 'hidden') return parent;
    }
    return primary;
  }, [isSuperAdmin, getScreenLevelString, screenKey, module]);

  // If a specific required action is specified on the route (e.g. requiredAction="create")
  const isActionAllowed = useMemo(() => {
    if (!requiredAction) return true;
    if (isSuperAdmin) return true;
    if (canPerformAction(requiredAction, module, screenKey)) return true;
    // If it's a dedicated sub-page (like add employee) and its screen level is enabled, allow access
    if ((screenKey === 'directory_add_employee' || screenKey === 'directory/new') && rawLevel !== 'hidden') return true;
    return false;
  }, [requiredAction, isSuperAdmin, canPerformAction, module, screenKey, rawLevel]);

  // 1. HIDDEN LEVEL: Render AccessDenied or custom fallback
  if (rawLevel === 'hidden' || (!isActionAllowed && requiredAction)) {
    if (fallback !== undefined) return <>{fallback}</>;
    return <AccessDenied screenKey={screenKey} module={module} title={title} />;
  }

  const isReadOnly = rawLevel === 'readonly';

  const contextValue: ScreenContextType = {
    isReadOnly,
    isReadOnlyScreen: isReadOnly,
    level: rawLevel,
    screenKey,
    module
  };

  // 2. READONLY LEVEL: Provide isReadOnlyScreen = true context & lock submit buttons / inputs
  if (isReadOnly) {
    return (
      <ScreenContext.Provider value={contextValue}>
        <div className="w-full relative screen-guard-readonly [&_button[type='submit']]:opacity-40 [&_button[type='submit']]:pointer-events-none [&_button[type='submit']]:cursor-not-allowed [&_.submit-action]:opacity-40 [&_.submit-action]:pointer-events-none">
          {/* Read-Only Status Banner */}
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 text-xs font-semibold shadow-sm">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>View-Only Mode:</strong> You have read-only access to this screen ({title || screenKey}). Form submissions and data alterations are disabled by your role permissions.
              </span>
            </div>
            <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-900/60 text-[10px] font-black uppercase tracking-wider">
              Read-Only
            </span>
          </div>

          {children}
        </div>
      </ScreenContext.Provider>
    );
  }

  // 3. EDITABLE / DEFAULT LEVEL: Normal full access
  return (
    <ScreenContext.Provider value={contextValue}>
      {children}
    </ScreenContext.Provider>
  );
};

export default ScreenGuard;
