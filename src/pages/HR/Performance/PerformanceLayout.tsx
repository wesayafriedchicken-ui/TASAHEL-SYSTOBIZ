import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  PlusCircle, 
  Settings, 
  BarChart3, 
  Cpu, 
  Sparkles,
  LayoutGrid,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { PerformanceProvider, usePerformanceContext } from './PerformanceContext';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';

const PerformanceLayoutContent: React.FC = () => {
  const { isHRAdmin, canRead, checkPermission, canNewEvaluation } = useHRContext();
  const location = useLocation();
  const navigate = useNavigate();

  const performanceSubTabs = [
    {
      id: 'core',
      path: '/hr/performance',
      exact: true,
      label: 'Performance Core',
      arabicLabel: 'لوحة الأداء الحية',
      icon: Award,
      keys: ['Performance & OKRs', 'HR Performance']
    },
    {
      id: 'new',
      path: '/hr/performance/new',
      exact: false,
      label: 'New Appraisal',
      arabicLabel: 'تقييم موظف جديد',
      icon: PlusCircle,
      keys: ['Performance & OKRs', 'HR Performance']
    },
    {
      id: 'engine',
      path: '/hr/performance/engine',
      exact: false,
      label: 'Appraisal Engine & Rules',
      arabicLabel: 'محرك وقواعد التقييم',
      icon: Cpu,
      keys: ['Performance & OKRs', 'HR Performance']
    },
    {
      id: 'analysis',
      path: '/hr/performance/analysis',
      exact: false,
      label: 'Performance Analysis Hub',
      arabicLabel: 'مركز تحليل أداء الموظفين',
      icon: BarChart3,
      keys: ['Performance & OKRs', 'HR Performance']
    }
  ];

  const availableTabs = performanceSubTabs.filter(tab => {
    if (isHRAdmin) return true;
    return tab.keys.some(k => canRead('HR', k) && (checkPermission as any)('HR', 'tab:' + k) !== false);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-Navigation Bar & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl w-full md:w-fit overflow-x-auto max-w-full scrollbar-none border border-slate-200/60 shadow-2xs">
          {availableTabs.map(tab => {
            const IconComp = tab.icon;
            const isTabActive = tab.exact 
              ? location.pathname === tab.path 
              : location.pathname.startsWith(tab.path);

            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                end={tab.exact}
                className={cn(
                  "px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer no-underline border",
                  isTabActive
                    ? "bg-white text-indigo-600 border-indigo-100/80 shadow-xs"
                    : "text-slate-600 border-transparent hover:bg-white/60 hover:text-slate-900"
                )}
              >
                <IconComp className={cn("w-4 h-4", isTabActive ? "text-indigo-600" : "text-slate-400")} />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => navigate('/hr/performance/engine')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs border",
              location.pathname.startsWith('/hr/performance/engine')
                ? "bg-emerald-800 text-white border-emerald-900"
                : "bg-[#1b5e20] hover:bg-emerald-900 text-white border-transparent"
            )}
            title="Appraisal Engine & Evaluation Rules"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">Engine Rules</span>
            <span className="sm:hidden">Rules</span>
          </button>

          {(isHRAdmin || canNewEvaluation) && (
            <button
              type="button"
              onClick={() => navigate('/hr/performance/new')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs border",
                location.pathname.startsWith('/hr/performance/new')
                  ? "bg-indigo-800 text-white border-indigo-900"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent"
              )}
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-200" />
              <span>New Appraisal</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Route View Content Container with Motion Transitions */}
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

export const PerformanceLayout: React.FC = () => {
  return (
    <PerformanceProvider>
      <PerformanceLayoutContent />
    </PerformanceProvider>
  );
};

export default PerformanceLayout;
