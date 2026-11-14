import React, { useMemo } from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Clock, 
  DollarSign, 
  XCircle, 
  Star, 
  ListChecks, 
  Settings2,
  Settings,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const TransactionsAuditLayout: React.FC = () => {
  const location = useLocation();
  const { canRead, user, previewRole } = useAuth();
  const isSuperAdmin = !previewRole && (user?.role_id === 1 || (user as any)?.is_super_admin || user?.role === 'Admin' || user?.role_name === 'Admin');

  const allTabs = [
    {
      to: '/qa/transactions-audit/complaints',
      label: 'Complaints',
      labelAr: 'الشكاوى',
      icon: ShieldAlert,
      pattern: /^\/qa\/transactions-audit\/complaints/
    },
    {
      to: '/qa/transactions-audit/delays',
      label: 'Delays',
      labelAr: 'التأخيرات',
      icon: Clock,
      pattern: /^\/qa\/transactions-audit\/delays/
    },
    {
      to: '/qa/transactions-audit/refunds',
      label: 'Refunds',
      labelAr: 'الاستردادات المالية',
      icon: DollarSign,
      pattern: /^\/qa\/transactions-audit\/refunds/
    },
    {
      to: '/qa/transactions-audit/cancellations',
      label: 'Cancellations',
      labelAr: 'الإلغاءات',
      icon: XCircle,
      pattern: /^\/qa\/transactions-audit\/cancellations/
    },
    {
      to: '/qa/transactions-audit/nps',
      label: 'NPS',
      labelAr: 'مؤشر رضا العملاء NPS',
      icon: Star,
      pattern: /^\/qa\/transactions-audit\/nps/
    },
    {
      to: '/qa/transactions-audit/action-plans',
      label: 'Action Plans',
      labelAr: 'خطط العمل التصحيحية',
      icon: ListChecks,
      pattern: /^\/qa\/transactions-audit\/action-plans/
    },
    {
      to: '/qa/transactions-audit/checklists',
      label: 'Audit Checklists',
      labelAr: 'قوائم التدقيق والنماذج',
      icon: Settings2,
      pattern: /^\/qa\/transactions-audit\/checklists/
    }
  ];

  const tabs = useMemo(() => {
    if (isSuperAdmin) return allTabs;
    return allTabs.filter(t => canRead('QA', t.label));
  }, [isSuperAdmin, canRead]);

  // Check if current route is the index hub
  const isIndexHub = location.pathname === '/qa/transactions-audit' || location.pathname === '/qa/transactions-audit/';

  // Check if current active sub-page is allowed for the user's role
  const isCurrentSubRouteAllowed = useMemo(() => {
    if (isSuperAdmin) return true;
    if (isIndexHub) return true;
    const matchingTab = allTabs.find(t => t.pattern.test(location.pathname));
    if (!matchingTab) return true;
    return canRead('QA', matchingTab.label);
  }, [isSuperAdmin, isIndexHub, allTabs, location.pathname, canRead]);

  // Don't show the subnav pills if we're on index launchpad or on a dedicated full-page stepper
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isStepperPage = 
    location.pathname.includes('/stepper') ||
    location.pathname.includes('/new') ||
    location.pathname.includes('/audit/') ||
    (pathParts.length >= 4 && pathParts[1] === 'transactions-audit');

  return (
    <div className="space-y-6 animate-fadeIn" id="transactions-audit-layout">
      {!isIndexHub && !isStepperPage && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* Clean Back to Hub button */}
            <NavLink
              to="/qa/transactions-audit"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all cursor-pointer shrink-0"
              title="Return to Transactions Audit Launchpad"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </NavLink>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.pattern.test(location.pathname);

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <NavLink
              to="/qa/settings"
              className={({ isActive }) => `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700'
              }`}
              title="QA Integration & Google Sheets Settings"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Settings</span>
            </NavLink>
            <div className="hidden xl:flex items-center gap-2 text-slate-400 text-[11px] font-semibold px-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Multi-Channel Operational Transaction Auditing</span>
            </div>
          </div>
        </div>
      )}

      {/* Sub-route Content or Access Restriction */}
      {!isCurrentSubRouteAllowed ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-lg mx-auto my-8 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">Sub-Route Access Restricted</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            Your role does not have authorization to view this operational queue. Please select an authorized stream or return to the launchpad.
          </p>
          <NavLink
            to="/qa/transactions-audit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Launchpad Hub</span>
          </NavLink>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  );
};

export default TransactionsAuditLayout;
