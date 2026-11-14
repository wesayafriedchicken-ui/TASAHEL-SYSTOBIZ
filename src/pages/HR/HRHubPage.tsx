import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserPlus,
  CircleDollarSign,
  Clock,
  Award,
  GitFork,
  ShieldAlert,
  Archive,
  ArrowRight,
  ShieldX
} from 'lucide-react';
import { useRBAC } from '../../context/RBACContext';
import { cn } from '../../lib/utils';

export interface HRModuleCardConfig {
  id: string;
  screenKey: string;
  name: string;
  title: string;
  route: string;
  subtitle: string;
  quickBadge: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'indigo' | 'emerald' | 'blue' | 'violet' | 'amber' | 'cyan' | 'rose' | 'teal' | 'orange' | 'slate';
  keyHighlights: string[];
}

export const HR_MODULE_CARDS: HRModuleCardConfig[] = [
  {
    id: 'dashboard',
    screenKey: 'dashboard',
    name: 'Dashboard',
    title: 'Dashboard',
    route: '/hr/dashboard',
    subtitle: 'Executive metrics, workforce KPIs, turnover rates, and real-time telemetry.',
    quickBadge: 'Analytics',
    icon: LayoutDashboard,
    accent: 'indigo',
    keyHighlights: ['Workforce KPIs', 'Turnover Rates', 'Live Telemetry']
  },
  {
    id: 'directory',
    screenKey: 'directory',
    name: 'Employee Directory',
    title: 'Directory',
    route: '/hr/directory',
    subtitle: 'Comprehensive staff profiles, contact lists, extensions, and employment files.',
    quickBadge: 'Core Data',
    icon: Users,
    accent: 'emerald',
    keyHighlights: ['Staff Profiles', 'Direct Contacts', 'Digital Files']
  },
  {
    id: 'departments',
    screenKey: 'departments',
    name: 'Departments & Structure',
    title: 'Departments',
    route: '/hr/departments',
    subtitle: 'Corporate hierarchy, teams structure, job titles, and role descriptions.',
    quickBadge: 'Structure',
    icon: Building2,
    accent: 'blue',
    keyHighlights: ['Divisions & Teams', 'Job Titles', 'Role Matrices']
  },
  {
    id: 'recruitment',
    screenKey: 'recruitment',
    name: 'Recruitment & Jobs',
    title: 'Hiring & Recruitment',
    route: '/hr/recruitment',
    subtitle: 'Talent acquisition pipeline, job vacancies, applicant tracking, and interviews.',
    quickBadge: 'Talent',
    icon: UserPlus,
    accent: 'violet',
    keyHighlights: ['Open Vacancies', 'Applicant Pipeline', 'Interview Hub']
  },
  {
    id: 'payroll',
    screenKey: 'payroll',
    name: 'Payroll & Salaries',
    title: 'Payroll & Salaries',
    route: '/hr/payroll',
    subtitle: 'Automated ledger runs, deductions, bonuses, payslips, and disbursements.',
    quickBadge: 'Financials',
    icon: CircleDollarSign,
    accent: 'amber',
    keyHighlights: ['Ledger Runs', 'Deductions & Bonuses', 'Digital Payslips']
  },
  {
    id: 'attendance',
    screenKey: 'attendance',
    name: 'Attendance & Clock In',
    title: 'Attendance & Clock In',
    route: '/hr/attendance',
    subtitle: 'Live biometric clock-ins, geofence radius tracking, shifts, and leaves.',
    quickBadge: 'Live Ops',
    icon: Clock,
    accent: 'cyan',
    keyHighlights: ['Biometric Sync', 'Shift Rotations', 'Leave Approvals']
  },
  {
    id: 'performance',
    screenKey: 'performance',
    name: 'Performance & OKRs',
    title: 'Performance & OKRs',
    route: '/hr/performance',
    subtitle: 'Quarterly reviews, goal scorecards, KPI evaluations, and appraisal cycles.',
    quickBadge: 'Growth',
    icon: Award,
    accent: 'rose',
    keyHighlights: ['Quarterly Appraisals', 'Goal Scorecards', 'KPI Tracking']
  },
  {
    id: 'orgchart',
    screenKey: 'orgchart',
    name: 'Org Chart',
    title: 'Organization Chart',
    route: '/hr/orgchart',
    subtitle: 'Interactive dynamic reporting hierarchy and visual company tree.',
    quickBadge: 'Hierarchy',
    icon: GitFork,
    accent: 'teal',
    keyHighlights: ['Dynamic Hierarchy', 'Reporting Lines', 'Visual Tree']
  },
  {
    id: 'complaints',
    screenKey: 'complaints',
    name: 'Complaints & Grievances',
    title: 'Complaints & Grievances',
    route: '/hr/complaints',
    subtitle: 'Confidential incident ticketing, policy violations, and conflict resolutions.',
    quickBadge: 'Compliance',
    icon: ShieldAlert,
    accent: 'orange',
    keyHighlights: ['Confidential Tickets', 'Dispute Resolution', 'Audit Trail']
  },
  {
    id: 'archived',
    screenKey: 'archived',
    name: 'Archived Employees',
    title: 'Archived Staff',
    route: '/hr/archived',
    subtitle: 'Past employees history, exit clearance records, and offboarded profiles.',
    quickBadge: 'Archives',
    icon: Archive,
    accent: 'slate',
    keyHighlights: ['Exit Clearances', 'Former Staff Profiles', 'Offboarding Files']
  }
];

const ACCENT_STYLES = {
  indigo: {
    cardBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700/60',
    cardGlow: 'group-hover:bg-indigo-500/5',
    topGlow: 'bg-indigo-500',
    iconBox: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 ring-1 ring-indigo-100 dark:ring-indigo-900/50',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
    titleHover: 'group-hover:text-indigo-700 dark:group-hover:text-indigo-400',
    button: 'text-indigo-600 group-hover:text-indigo-700 dark:text-indigo-400',
    chip: 'bg-indigo-50/70 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50'
  },
  emerald: {
    cardBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700/60',
    cardGlow: 'group-hover:bg-emerald-500/5',
    topGlow: 'bg-emerald-500',
    iconBox: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 ring-1 ring-emerald-100 dark:ring-emerald-900/50',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    titleHover: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-400',
    button: 'text-emerald-600 group-hover:text-emerald-700 dark:text-emerald-400',
    chip: 'bg-emerald-50/70 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50'
  },
  blue: {
    cardBorder: 'hover:border-blue-300 dark:hover:border-blue-700/60',
    cardGlow: 'group-hover:bg-blue-500/5',
    topGlow: 'bg-blue-500',
    iconBox: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 ring-1 ring-blue-100 dark:ring-blue-900/50',
    badge: 'bg-blue-50 text-blue-700 border-blue-200/70 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    titleHover: 'group-hover:text-blue-700 dark:group-hover:text-blue-400',
    button: 'text-blue-600 group-hover:text-blue-700 dark:text-blue-400',
    chip: 'bg-blue-50/70 text-blue-700 border-blue-100 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50'
  },
  violet: {
    cardBorder: 'hover:border-violet-300 dark:hover:border-violet-700/60',
    cardGlow: 'group-hover:bg-violet-500/5',
    topGlow: 'bg-violet-500',
    iconBox: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 ring-1 ring-violet-100 dark:ring-violet-900/50',
    badge: 'bg-violet-50 text-violet-700 border-violet-200/70 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800',
    titleHover: 'group-hover:text-violet-700 dark:group-hover:text-violet-400',
    button: 'text-violet-600 group-hover:text-violet-700 dark:text-violet-400',
    chip: 'bg-violet-50/70 text-violet-700 border-violet-100 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/50'
  },
  amber: {
    cardBorder: 'hover:border-amber-300 dark:hover:border-amber-700/60',
    cardGlow: 'group-hover:bg-amber-500/5',
    topGlow: 'bg-amber-500',
    iconBox: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 ring-1 ring-amber-100 dark:ring-amber-900/50',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    titleHover: 'group-hover:text-amber-700 dark:group-hover:text-amber-400',
    button: 'text-amber-600 group-hover:text-amber-700 dark:text-amber-400',
    chip: 'bg-amber-50/70 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50'
  },
  cyan: {
    cardBorder: 'hover:border-cyan-300 dark:hover:border-cyan-700/60',
    cardGlow: 'group-hover:bg-cyan-500/5',
    topGlow: 'bg-cyan-500',
    iconBox: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 ring-1 ring-cyan-100 dark:ring-cyan-900/50',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200/70 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
    titleHover: 'group-hover:text-cyan-700 dark:group-hover:text-cyan-400',
    button: 'text-cyan-600 group-hover:text-cyan-700 dark:text-cyan-400',
    chip: 'bg-cyan-50/70 text-cyan-700 border-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-900/50'
  },
  rose: {
    cardBorder: 'hover:border-rose-300 dark:hover:border-rose-700/60',
    cardGlow: 'group-hover:bg-rose-500/5',
    topGlow: 'bg-rose-500',
    iconBox: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 ring-1 ring-rose-100 dark:ring-rose-900/50',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    titleHover: 'group-hover:text-rose-700 dark:group-hover:text-rose-400',
    button: 'text-rose-600 group-hover:text-rose-700 dark:text-rose-400',
    chip: 'bg-rose-50/70 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50'
  },
  teal: {
    cardBorder: 'hover:border-teal-300 dark:hover:border-teal-700/60',
    cardGlow: 'group-hover:bg-teal-500/5',
    topGlow: 'bg-teal-500',
    iconBox: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400 ring-1 ring-teal-100 dark:ring-teal-900/50',
    badge: 'bg-teal-50 text-teal-700 border-teal-200/70 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
    titleHover: 'group-hover:text-teal-700 dark:group-hover:text-teal-400',
    button: 'text-teal-600 group-hover:text-teal-700 dark:text-teal-400',
    chip: 'bg-teal-50/70 text-teal-700 border-teal-100 dark:bg-teal-950/30 dark:text-teal-300 dark:border-teal-900/50'
  },
  orange: {
    cardBorder: 'hover:border-orange-300 dark:hover:border-orange-700/60',
    cardGlow: 'group-hover:bg-orange-500/5',
    topGlow: 'bg-orange-500',
    iconBox: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 ring-1 ring-orange-100 dark:ring-orange-900/50',
    badge: 'bg-orange-50 text-orange-700 border-orange-200/70 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    titleHover: 'group-hover:text-orange-700 dark:group-hover:text-orange-400',
    button: 'text-orange-600 group-hover:text-orange-700 dark:text-orange-400',
    chip: 'bg-orange-50/70 text-orange-700 border-orange-100 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/50'
  },
  slate: {
    cardBorder: 'hover:border-slate-400 dark:hover:border-slate-600',
    cardGlow: 'group-hover:bg-slate-500/5',
    topGlow: 'bg-slate-500',
    iconBox: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700',
    badge: 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    titleHover: 'group-hover:text-slate-900 dark:group-hover:text-white',
    button: 'text-slate-600 group-hover:text-slate-900 dark:text-slate-400',
    chip: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  }
};

export const HRHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isScreenHidden, getScreenLevel } = useRBAC();

  // Filter cards strictly based on active RBAC permissions
  const authorizedCards = useMemo(() => {
    return HR_MODULE_CARDS.filter(card => {
      if (isSuperAdmin) return true;
      const isHidden =
        isScreenHidden(card.screenKey, 'HR') ||
        isScreenHidden(card.name, 'HR') ||
        getScreenLevel(card.screenKey, 'HR') === 3 ||
        getScreenLevel(card.name, 'HR') === 3;
      return !isHidden;
    });
  }, [isSuperAdmin, isScreenHidden, getScreenLevel]);

  const handleCardClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="w-full animate-in fade-in duration-300 pb-12 font-sans">
      {authorizedCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {authorizedCards.map(card => {
            const style = ACCENT_STYLES[card.accent] || ACCENT_STYLES.emerald;
            const Icon = card.icon;

            return (
              <div
                key={card.id}
                role="button"
                tabIndex={0}
                onClick={() => handleCardClick(card.route)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(card.route);
                  }
                }}
                className={cn(
                  "group relative flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs",
                  "hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden",
                  style.cardBorder
                )}
              >
                {/* Top Subtle Color Accent Line */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                    style.topGlow
                  )}
                />

                {/* Subtle Hover Glow Background */}
                <div
                  className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                    style.cardGlow
                  )}
                />

                {/* Card Header & Content */}
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    {/* Icon Container */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-2xs",
                        style.iconBox
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Quick Badge */}
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-2xs",
                        style.badge
                      )}
                    >
                      {card.quickBadge}
                    </span>
                  </div>

                  <div>
                    <h2
                      className={cn(
                        "text-lg font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-200 flex items-center gap-1.5",
                        style.titleHover
                      )}
                    >
                      <span>{card.title}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1.5">
                      {card.subtitle}
                    </p>
                  </div>

                  {/* Highlights / Features Tag Pills */}
                  <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                    {card.keyHighlights.map((hl, i) => (
                      <span
                        key={i}
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md border",
                          style.chip
                        )}
                      >
                        {hl}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer / Direct Action */}
                <div className="relative z-10 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                    {card.route}
                  </span>

                  <div className={cn("inline-flex items-center gap-1 font-bold transition-all", style.button)}>
                    <span>Launch</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Fallback State if user has zero permissions */
        <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <ShieldX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No accessible HR modules
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You do not currently have permissions to view any HR modules. Please contact an administrator.
          </p>
        </div>
      )}
    </div>
  );
};

export default HRHubPage;
