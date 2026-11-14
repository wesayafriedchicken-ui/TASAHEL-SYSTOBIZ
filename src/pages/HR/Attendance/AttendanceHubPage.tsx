import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CalendarDays,
  Coffee,
  Palmtree,
  ArrowLeftRight,
  BarChart3,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { useRBAC } from '../../../context/RBACContext';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';

export interface AttendanceHubCard {
  id: string;
  route: string;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: 'emerald' | 'indigo' | 'amber' | 'sky' | 'purple' | 'rose';
  permissionKeys: string[];
}

export const ATTENDANCE_HUB_CARDS: AttendanceHubCard[] = [
  {
    id: 'daily-logs',
    route: '/hr/attendance/daily-logs',
    title: 'Daily Logs & Clock-Ins',
    badge: 'Live Ops',
    description: 'Monitor live biometric punches, GPS geofence verifications, and active work hours.',
    icon: Clock,
    accentColor: 'emerald',
    permissionKeys: ['DAILY LOGS', 'Attendance & Clock In']
  },
  {
    id: 'shifts',
    route: '/hr/attendance/shifts',
    title: 'Shift Schedule & Rostering',
    badge: 'Roster',
    description: 'Organize rotational schedules, morning/night shifts, and department assignments.',
    icon: CalendarDays,
    accentColor: 'indigo',
    permissionKeys: ['SHIFT SCHEDULE', 'Attendance & Clock In']
  },
  {
    id: 'breaks',
    route: '/hr/attendance/breaks',
    title: 'Breaks & Rest Intervals',
    badge: 'Policy',
    description: 'Configure break windows, grace periods, meal intervals, and auto-deductions.',
    icon: Coffee,
    accentColor: 'amber',
    permissionKeys: ['BREAKS', 'Attendance & Clock In']
  },
  {
    id: 'leaves',
    route: '/hr/attendance/leaves',
    title: 'Leave & Time Off',
    badge: 'Requests',
    description: 'Process vacation requests, sick leaves, emergency days, and employee balances.',
    icon: Palmtree,
    accentColor: 'sky',
    permissionKeys: ['LEAVE MANAGEMENT', 'Time Off & Leaves', 'Attendance & Clock In']
  },
  {
    id: 'swaps',
    route: '/hr/attendance/swaps',
    title: 'Shift Swaps & Coverage',
    badge: 'Workflows',
    description: 'Manage peer-to-peer exchange requests, supervisor approvals, and shift coverage.',
    icon: ArrowLeftRight,
    accentColor: 'purple',
    permissionKeys: ['SHIFT SWAPS', 'Swap Management', 'Attendance & Clock In']
  },
  {
    id: 'reports',
    route: '/hr/attendance/reports',
    title: 'Attendance Reports & Audits',
    badge: 'Exports',
    description: 'Generate monthly timesheets, late arrival trends, absence ratios, and CSV exports.',
    icon: BarChart3,
    accentColor: 'rose',
    permissionKeys: ['DAILY LOGS', 'SHIFT SCHEDULE', 'LEAVE MANAGEMENT', 'Attendance & Clock In']
  }
];

const ACCENT_STYLES = {
  emerald: {
    iconWrapper: 'bg-emerald-50 text-emerald-600 border-emerald-100/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50 group-hover:bg-emerald-500 group-hover:text-white',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    hoverBorder: 'hover:border-emerald-300/80 dark:hover:border-emerald-700/60',
    glow: 'from-emerald-500/5 to-transparent'
  },
  indigo: {
    iconWrapper: 'bg-indigo-50 text-indigo-600 border-indigo-100/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50 group-hover:bg-indigo-500 group-hover:text-white',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60',
    hoverBorder: 'hover:border-indigo-300/80 dark:hover:border-indigo-700/60',
    glow: 'from-indigo-500/5 to-transparent'
  },
  amber: {
    iconWrapper: 'bg-amber-50 text-amber-600 border-amber-100/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50 group-hover:bg-amber-500 group-hover:text-white',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    hoverBorder: 'hover:border-amber-300/80 dark:hover:border-amber-700/60',
    glow: 'from-amber-500/5 to-transparent'
  },
  sky: {
    iconWrapper: 'bg-sky-50 text-sky-600 border-sky-100/80 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/50 group-hover:bg-sky-500 group-hover:text-white',
    badge: 'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
    hoverBorder: 'hover:border-sky-300/80 dark:hover:border-sky-700/60',
    glow: 'from-sky-500/5 to-transparent'
  },
  purple: {
    iconWrapper: 'bg-purple-50 text-purple-600 border-purple-100/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/50 group-hover:bg-purple-500 group-hover:text-white',
    badge: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60',
    hoverBorder: 'hover:border-purple-300/80 dark:hover:border-purple-700/60',
    glow: 'from-purple-500/5 to-transparent'
  },
  rose: {
    iconWrapper: 'bg-rose-50 text-rose-600 border-rose-100/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50 group-hover:bg-rose-500 group-hover:text-white',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
    hoverBorder: 'hover:border-rose-300/80 dark:hover:border-rose-700/60',
    glow: 'from-rose-500/5 to-transparent'
  }
};

export const AttendanceHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { isHRAdmin, canRead, checkPermission } = useHRContext();
  const { isSuperAdmin, isScreenHidden, getScreenLevel } = useRBAC();

  // Filter accessible cards based on RBAC permissions (Zero DB queries)
  const accessibleCards = useMemo(() => {
    return ATTENDANCE_HUB_CARDS.filter(card => {
      if (isHRAdmin || isSuperAdmin) return true;
      if (
        isScreenHidden('attendance', 'HR') || 
        getScreenLevel('attendance', 'HR') === 3 ||
        isScreenHidden(card.id, 'HR')
      ) {
        return false;
      }
      return card.permissionKeys.some(
        key => canRead('HR', key) && (checkPermission as any)('HR', 'tab:' + key) !== false
      );
    });
  }, [isHRAdmin, isSuperAdmin, isScreenHidden, getScreenLevel, canRead, checkPermission]);

  // Fast client-side search filter
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return accessibleCards;
    const q = searchQuery.toLowerCase().trim();
    return accessibleCards.filter(
      c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.badge.toLowerCase().includes(q)
    );
  }, [accessibleCards, searchQuery]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => navigate('/hr')}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer group"
              title="Return to Main HR Launchpad"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>HR Hub</span>
            </button>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Attendance & Clock In</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Attendance Launchpad
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Real-time biometric punch logs, scheduling rosters, time-off requests, and audit reports.
          </p>
        </div>

        {/* Lightweight Search Input (Zero DB Load) */}
        <div className="flex items-center gap-2.5 w-full md:w-72">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter attendance modules..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 cursor-pointer"
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6 Sub-Workspace Bento Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredCards.map((card) => {
          const IconComp = card.icon;
          const styles = ACCENT_STYLES[card.accentColor];

          return (
            <div
              key={card.id}
              onClick={() => navigate(card.route)}
              className={cn(
                "group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden",
                styles.hoverBorder
              )}
            >
              {/* Subtle Ambient Background Gradient on Hover */}
              <div
                className={cn(
                  "absolute inset-0 bg-radial pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                  styles.glow
                )}
              />

              {/* Card Top: Icon & Badge */}
              <div className="flex items-start justify-between gap-3 relative z-10">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 shadow-2xs",
                    styles.iconWrapper
                  )}
                >
                  <IconComp className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                </div>

                <span
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide border shadow-2xs",
                    styles.badge
                  )}
                >
                  {card.badge}
                </span>
              </div>

              {/* Card Middle: Title & Description */}
              <div className="mt-4 mb-4 relative z-10 space-y-1.5">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  <span>{card.title}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  {card.description}
                </p>
              </div>

              {/* Card Footer: Action Link / Prompt */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 relative z-10">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  Open Module
                </span>
                <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-200 group-hover:translate-x-0.5">
                  <span className="text-[11px] font-extrabold">Launch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State when Search Query Yields No Results */}
      {filteredCards.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-base font-black text-slate-800 dark:text-slate-200">
            No matching attendance modules found
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or check your account permissions.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default AttendanceHubPage;
