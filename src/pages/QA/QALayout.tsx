import React, { useState, Suspense, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  LayoutDashboard, 
  ReceiptText, 
  ClipboardCheck, 
  History, 
  Settings, 
  Loader2,
  ChevronRight,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';

export const QALayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkPermission, canRead, user, previewRole } = useAuth();

  const isSuperAdmin = !previewRole && (user?.role_id === 1 || (user as any)?.is_super_admin || user?.role === 'Admin' || user?.role_name === 'Admin');

  // Check if current page is a deep workflow / stepper form
  const isDeepFormPage = useMemo(() => {
    const p = location.pathname;
    return (
      p.includes('/new') ||
      p.includes('/audit/') ||
      /\/qa\/transactions-audit\/[^\/]+\/[^\/]+/.test(p) ||
      (p.includes('/internal-audit/perform') && p !== '/qa/internal-audit/perform')
    );
  }, [location.pathname]);

  const allNavItems = [
    {
      to: '/qa/dashboard',
      label: 'Quality Dashboard',
      labelAr: 'لوحة قيادة الجودة',
      icon: LayoutDashboard,
      activePattern: /^\/qa\/dashboard/
    },
    {
      to: '/qa/transactions-audit',
      label: 'Transactions Audit',
      labelAr: 'تدقيق المعاملات والعمليات',
      icon: ReceiptText,
      activePattern: /^\/qa\/transactions-audit/
    },
    {
      to: '/qa/internal-audit',
      label: 'Internal Audit',
      labelAr: 'التدقيق الداخلي والامتثال',
      icon: ClipboardCheck,
      activePattern: /^\/qa\/internal-audit/
    },
    {
      to: '/qa/history',
      label: 'Audit History',
      labelAr: 'سجل التدقيق التاريخي',
      icon: History,
      activePattern: /^\/qa\/(audit-history|history)/
    }
  ];

  const { isModuleVisible, isScreenHidden } = useRBAC();

  // Check module-level visibility (never cascade unmount)
  const hasModuleAccess = isSuperAdmin || isModuleVisible('QA') || checkPermission('QA', 'view') || canRead('QA');

  // Filter tabs based on RBAC permissions
  const primaryNavItems = useMemo(() => {
    if (isSuperAdmin) return allNavItems;
    return allNavItems.filter(item => {
      const screenKey = item.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (isScreenHidden(screenKey, 'QA') || isScreenHidden(item.label, 'QA')) {
        return false;
      }
      return canRead('QA', item.label);
    });
  }, [isSuperAdmin, canRead, isScreenHidden]);

  // Check Settings permission & Settings Button permission
  const canAccessSettings = isSuperAdmin || 
    canRead('QA', 'QA Settings & Integrations') || 
    canRead('QA', 'Settings') ||
    checkPermission('QA', 'custom:qa_settings_button') ||
    checkPermission('QA', 'custom:access_qa_settings') || 
    checkPermission('QA', 'action:QA Settings & Integrations:read');

  // Quick sync configuration slider icon permission
  const canQuickSync = isSuperAdmin ||
    checkPermission('QA', 'custom:qa_quick_sync_config') ||
    checkPermission('QA', 'custom:quick_sync_configuration') ||
    checkPermission('QA', 'custom:qa_quick_settings_modal') ||
    checkPermission('QA', 'custom:access_qa_settings') ||
    canRead('QA', 'QA Settings & Integrations');

  // Current tab permission check
  const isCurrentTabAllowed = useMemo(() => {
    if (isSuperAdmin) return true;
    if (location.pathname === '/qa' || location.pathname === '/qa/' || location.pathname === '/qa/hub') return true;
    if (location.pathname.startsWith('/qa/settings')) return canAccessSettings;
    if (location.pathname.startsWith('/qa/dashboard')) return canRead('QA', 'Quality Dashboard');
    if (location.pathname.startsWith('/qa/transactions-audit')) return canRead('QA', 'Transactions Audit');
    if (location.pathname.startsWith('/qa/internal-audit')) return canRead('QA', 'Internal Audit');
    if (location.pathname.startsWith('/qa/audit-history') || location.pathname.startsWith('/qa/history')) return canRead('QA', 'Audit History');
    return true;
  }, [isSuperAdmin, location.pathname, canAccessSettings, canRead]);

  // If entire QA module is forbidden
  if (!hasModuleAccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50 font-sans" id="qa-access-denied">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
            <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
              Your assigned role ({user?.role_name || user?.role || `Role #${user?.role_id || 'User'}`}) does not have permission to view the <strong className="text-slate-800">Quality Assurance (QA)</strong> module.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Main Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isHubRoute = location.pathname === '/qa' || location.pathname === '/qa/' || location.pathname === '/qa/hub';

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 font-sans text-slate-800" id="qa-root-layout">
      {/* Top Header: Hidden on /qa hub launchpad; Sleek single-row navigation on sub-routes */}
      {!isHubRoute && (
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 gap-3">
              
              {/* Left Side: Return to Hub + Primary Navigation Tabs */}
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
                <button
                  type="button"
                  onClick={() => navigate('/qa')}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-800 transition-all font-bold text-xs shrink-0 cursor-pointer group"
                  title="Return to QA Launchpad Hub"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:inline font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">QA Hub</span>
                </button>

                <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

                {/* Primary Navigation Tabs */}
                {primaryNavItems.length > 0 && (
                  <nav className="flex items-center gap-1">
                    {primaryNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.activePattern.test(location.pathname);

                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 font-extrabold shadow-2xs border border-indigo-100/80'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </NavLink>
                      );
                    })}
                  </nav>
                )}
              </div>

              {/* Right Side: Stepper Back / Settings Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {isDeepFormPage && (
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                )}

                {(canAccessSettings || canQuickSync) && (
                  <div className="flex items-center gap-1">
                    <NavLink
                      to="/qa/settings"
                      className={({ isActive }) => `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60'
                      }`}
                      title="QA Integration Settings"
                    >
                      <Settings className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden md:inline">Settings</span>
                    </NavLink>
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isHubRoute ? 'pt-6' : 'pt-4'}`}>
        {!isCurrentTabAllowed ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Section Access Restricted</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Your role is not authorized to access this section in Quality Assurance. Please navigate to an authorized section using the tabs above.
            </p>
            {primaryNavItems.length > 0 && (
              <button
                onClick={() => navigate(primaryNavItems[0].to)}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <span>Go to {primaryNavItems[0].label}</span>
              </button>
            )}
          </div>
        ) : (
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Quality Module Data...</p>
            </div>
          }>
            <Outlet />
          </Suspense>
        )}
      </main>
    </div>
  );
};

export default QALayout;
