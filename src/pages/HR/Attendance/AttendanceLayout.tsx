import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  CalendarDays, 
  Coffee, 
  Palmtree, 
  ArrowLeftRight, 
  BarChart3, 
  ArrowLeft 
} from 'lucide-react';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';
import { ModuleCustomizeLayoutDropdown } from '../../../components/HR/ModuleSchema';
import { ActionGuard } from '../../../components/Common/Guard';

export const AttendanceLayout: React.FC = () => {
  const { isHRAdmin, canRead, checkPermission } = useHRContext();
  const location = useLocation();
  const navigate = useNavigate();

  const isHubRoute = location.pathname === '/hr/attendance' || location.pathname === '/hr/attendance/';

  const attendanceSubTabs = [
    { id: 'daily-logs', path: '/hr/attendance/daily-logs', label: 'DAILY LOGS', icon: Clock, keys: ['DAILY LOGS'] },
    { id: 'shifts', path: '/hr/attendance/shifts', label: 'SHIFT SCHEDULE', icon: CalendarDays, keys: ['SHIFT SCHEDULE'] },
    { id: 'breaks', path: '/hr/attendance/breaks', label: 'BREAKS', icon: Coffee, keys: ['BREAKS'] },
    { id: 'leaves', path: '/hr/attendance/leaves', label: 'LEAVE MANAGEMENT', icon: Palmtree, keys: ['LEAVE MANAGEMENT', 'Time Off & Leaves'] },
    { id: 'swaps', path: '/hr/attendance/swaps', label: 'SHIFT SWAPS', icon: ArrowLeftRight, keys: ['SHIFT SWAPS', 'Swap Management'] },
    { id: 'reports', path: '/hr/attendance/reports', label: 'REPORTS', icon: BarChart3, keys: ['DAILY LOGS', 'SHIFT SCHEDULE', 'LEAVE MANAGEMENT'] }
  ];

  const availableTabs = attendanceSubTabs.filter(tab => {
    if (isHRAdmin) return true;
    return tab.keys.some(k => canRead('HR', k) && (checkPermission as any)('HR', 'tab:' + k) !== false);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Attendance Module Sub-Navigation Bar (Hidden on Hub Index) */}
      {!isHubRoute && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full pb-1">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            {/* Back to Attendance Hub Button */}
            <button
              type="button"
              onClick={() => navigate('/hr/attendance')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
              title="Return to Attendance Launchpad"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Attendance Hub</span>
            </button>

            {/* Sub-Tabs Pills */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl w-full sm:w-fit overflow-x-auto max-w-full scrollbar-none border border-slate-200/60 dark:border-slate-700/60">
              {availableTabs.map(tab => {
                const IconComp = tab.icon;
                const isActive = 
                  location.pathname.startsWith(tab.path) || 
                  (tab.id === 'daily-logs' && (location.pathname === '/hr/attendance/daily' || location.pathname.startsWith('/hr/attendance/daily/')));
                return (
                  <NavLink
                    key={tab.id}
                    to={tab.path}
                    className={cn(
                      "px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer no-underline",
                      isActive
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700"
                        : "text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200"
                    )}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <ActionGuard actionKey="hr:attendance:customize_layout" module="HR" screen="attendance">
              <ModuleCustomizeLayoutDropdown 
                targetPage="attendance" 
                iconOnly={true}
              />
            </ActionGuard>
          </div>
        </div>
      )}

      {/* Sub-Route View Content Container */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AttendanceLayout;
