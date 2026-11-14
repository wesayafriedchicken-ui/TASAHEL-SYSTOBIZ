import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Sliders, Trash2 } from 'lucide-react';
import { HRProvider, useHRContext } from './HRContext';
import { cn } from '../../lib/utils';
import DeleteConfirmation from '../../components/Common/DeleteConfirmation';
import HRPermissionsManagerModal from '../../components/HR/HRPermissionsManagerModal';

const HRLayoutContent: React.FC = () => {
  const {
    allowedHrTabs,
    isHRAdmin,
    canManagePermissions,
    showClearHrDataConfirm,
    setShowClearHrDataConfirm,
    showManagePermissionsModal,
    setShowManagePermissionsModal,
    handleClearHrData,
    hrToast
  } = useHRContext();

  const location = useLocation();
  const navigate = useNavigate();

  const isEmployeeProfileRoute =
    (location.pathname.startsWith('/hr/directory/') && location.pathname !== '/hr/directory/spreadsheet') ||
    location.pathname === '/hr/directory/new';

  const isPermissionsRoute = location.pathname.startsWith('/hr/permissions');
  const isHubTab = location.pathname === '/hr' || location.pathname === '/hr/' || location.pathname === '/hr/hub';

  // Completely hide top HR tabs bar on attendance operational routes, payroll routes, and recruitment routes
  const isPayrollRoute = location.pathname === '/hr/payroll' || location.pathname.startsWith('/hr/payroll/');
  const isRecruitmentRoute = location.pathname === '/hr/recruitment' || location.pathname.startsWith('/hr/recruitment/');
  const isAttendanceOperationalRoute =
    location.pathname.startsWith('/hr/attendance/leaves') ||
    location.pathname.startsWith('/hr/attendance/daily-logs') ||
    location.pathname.startsWith('/hr/attendance/daily') ||
    location.pathname.startsWith('/hr/attendance/shifts') ||
    location.pathname.startsWith('/hr/attendance/breaks') ||
    location.pathname.startsWith('/hr/attendance/swaps') ||
    location.pathname.startsWith('/hr/attendance/reports');

  const shouldHideMainTabs = isAttendanceOperationalRoute || isPayrollRoute || isRecruitmentRoute;

  // If current route path points to a hidden tab, automatically redirect to first allowed tab
  useEffect(() => {
    if (allowedHrTabs.length > 0) {
      const currentSegment = location.pathname.split('/')[2];
      if (currentSegment) {
        // Do not redirect standalone system routes or dedicated employee sub-pages (/hr/directory/new, /hr/directory/:id)
        if (isEmployeeProfileRoute || currentSegment === 'permissions' || currentSegment === 'hub') return;
        const isCurrentAllowed = allowedHrTabs.some(t => t.id === currentSegment);
        if (!isCurrentAllowed) {
          navigate(allowedHrTabs[0].path || `/hr/${allowedHrTabs[0].id}`, { replace: true });
        }
      }
    }
  }, [allowedHrTabs, isEmployeeProfileRoute, location.pathname, navigate]);

  return (
    <div className={cn("w-full max-w-full animate-in fade-in duration-500 overflow-x-hidden", !isEmployeeProfileRoute && !isPermissionsRoute && !shouldHideMainTabs && "space-y-4")}>
      {/* 1. Large Hero Header Section — RENDER ONLY on the Hub Tab (/hr or /hr/hub) */}
      {isHubTab && !isEmployeeProfileRoute && !isPermissionsRoute && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[10px] uppercase tracking-wider mb-1">
            <Briefcase className="w-3 h-3" />
            Human Capital Management
          </div>

          {/* Row 1: HR Control Center Title + Description on left, Action buttons on right */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                HR Control Center
              </h1>
              <div className="w-16 h-1 rounded-full bg-[#25A55F]" />
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Centralize employee management, payroll, attendance, and performance tracking in one place.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 flex-wrap sm:flex-nowrap">
              {isHRAdmin && (
                <button
                  type="button"
                  onClick={() => setShowClearHrDataConfirm(true)}
                  className="w-10 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 dark:border-rose-900/50 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                  title="Wipe HR Data / مسح البيانات"
                  aria-label="Wipe HR Data / مسح البيانات"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {canManagePermissions && (
                <button
                  type="button"
                  id="hr-manage-permissions-btn"
                  onClick={() => setShowManagePermissionsModal(true)}
                  className="w-10 h-10 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1E701E] border border-emerald-200/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-400 dark:border-emerald-900/50 flex items-center justify-center transition-all shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 cursor-pointer"
                  title="Manage Permissions / إدارة الصلاحيات"
                  aria-label="Manage Permissions / إدارة الصلاحيات"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Slim Compact Navigation Tabs Bar — Render on all operational sub-tabs, completely unmounted on Hub tab & operational attendance/payroll routes */}
      {!isHubTab && !isEmployeeProfileRoute && !isPermissionsRoute && !shouldHideMainTabs && (
        <div className="sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md py-2.5 transition-all mb-3 -mt-2">
          <div className="flex items-center justify-center overflow-x-auto scrollbar-none">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl max-w-full overflow-x-auto scrollbar-none border border-slate-200/50 dark:border-slate-700/50 shadow-2xs">
              {allowedHrTabs.map(tab => {
                const isTabActive = tab.path === '/hr'
                  ? (location.pathname === '/hr' || location.pathname === '/hr/' || location.pathname === '/hr/hub')
                  : (location.pathname === `/hr/${tab.id}` || location.pathname.startsWith(`/hr/${tab.id}/`) || (tab.id === 'attendance' && location.pathname.startsWith('/hr/attendance')));
                return (
                  <NavLink
                    key={tab.id}
                    to={tab.path || `/hr/${tab.id}`}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 no-underline cursor-pointer",
                      isTabActive
                        ? "bg-white dark:bg-slate-900 text-green-700 dark:text-green-400 shadow-xs ring-1 ring-green-200 dark:ring-green-800 font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Sub-routes View Container with Transition Animation */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {hrToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-5 right-5 z-[999] px-5 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-bold",
              hrToast.type === 'success' ? "bg-emerald-600 text-white border-emerald-500" :
              hrToast.type === 'error' ? "bg-rose-600 text-white border-rose-500" :
              "bg-slate-900 text-white border-slate-800"
            )}
          >
            <span>{hrToast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wipe Confirmation Dialog */}
      <DeleteConfirmation 
        isOpen={showClearHrDataConfirm}
        onClose={() => setShowClearHrDataConfirm(false)}
        onConfirm={handleClearHrData}
        title="Wipe HR Module Data / مسح بيانات الموارد البشرية"
        message="هل أنت متأكد من مسح جميع بيانات موديول الموارد البشرية؟ سيتم حذف الحضور، الإجازات، الرواتب، التوظيف، الورديات، والتقييمات نهائياً للبدء بداتا حقيقية."
      />

      {/* HR Permissions Manager Modal */}
      <HRPermissionsManagerModal
        isOpen={showManagePermissionsModal}
        onClose={() => setShowManagePermissionsModal(false)}
      />
    </div>
  );
};

export const HRLayout: React.FC = () => {
  return (
    <HRProvider>
      <HRLayoutContent />
    </HRProvider>
  );
};

export default HRLayout;
