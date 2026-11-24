import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  BarChart2,
  Users,
  Building2,
  Briefcase,
  DollarSign,
  Clock,
  Award,
  Network,
  AlertCircle,
  Archive,
  UserPlus,
  FileSpreadsheet,
  Layers,
  BadgeCheck,
  FileText,
  UserCheck,
  CalendarCheck,
  SlidersHorizontal,
  Coffee,
  CalendarDays,
  ArrowLeftRight,
  BarChart3,
  FilePlus2,
  Cpu,
  LineChart,
  LayoutDashboard,
  ReceiptText,
  ClipboardCheck,
  History,
  Settings,
  Gauge,
  ShieldAlert,
  XCircle,
  Star,
  ListChecks,
  Settings2,
  CheckSquare,
  AlertTriangle,
  Wrench,
  List,
  Wallet,
  Compass,
  MessagesSquare,
  Megaphone,
  Workflow
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SidebarCategoryConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  moduleIds: string[];
}

export const SIDEBAR_CATEGORIES: SidebarCategoryConfig[] = [
  {
    id: 'cat-executive',
    name: 'Executive & Strategy',
    icon: Compass,
    moduleIds: ['dashboard', 'ai-business', 'business-model', 'risk', 'kaizen', 'kpis']
  },
  {
    id: 'cat-collaboration',
    name: 'Collaboration',
    icon: MessagesSquare,
    moduleIds: ['meeting-hub', 'comm']
  },
  {
    id: 'cat-sales-marketing',
    name: 'Sales & Marketing',
    icon: Megaphone,
    moduleIds: ['marketing', 'leads', 'crm']
  },
  {
    id: 'cat-operations-process',
    name: 'Operations & Process',
    icon: Workflow,
    moduleIds: ['operations-hub', 'products', 'tasks', 'sops', 'process-mapping', 'raci', 'kb']
  },
  {
    id: 'cat-setting',
    name: 'Setting',
    icon: Settings,
    moduleIds: ['admin', 'automation', 'integration', 'build']
  }
];

export const SIDEBAR_CATEGORY_MAP: Record<string, SidebarCategoryConfig> = SIDEBAR_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  },
  {} as Record<string, SidebarCategoryConfig>
);

export function getSidebarModuleRoute(moduleId: string): string {
  switch (moduleId) {
    case 'products':
      return '/catalog/dashboard';
    case 'comm':
      return '/comm/channels/1';
    case 'crm':
      return '/sales/dashboard';
    case 'sops':
      return '/sops/dashboard';
    case 'tasks':
      return '/tasks/board';
    case 'acct':
      return '/accounting/dashboard';
    default:
      return '/' + moduleId;
  }
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface SidebarSubPageItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  matchPaths?: string[];
  rbacName?: string;
}

export interface SidebarMainPageItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  matchPaths?: string[];
  rbacName?: string;
  children?: SidebarSubPageItem[];
}

function normalizePath(p: string): string {
  if (!p) return '/';
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
}

function matchesTarget(pathname: string, target: string, exact?: boolean): boolean {
  const current = normalizePath(pathname);
  const cleanTarget = normalizePath(target);
  if (exact) {
    return current === cleanTarget;
  }
  return current === cleanTarget || current.startsWith(cleanTarget + '/');
}

export function isSubPageActive(child: SidebarSubPageItem, pathname: string): boolean {
  if (matchesTarget(pathname, child.path, child.exact)) return true;
  if (child.matchPaths && child.matchPaths.length > 0) {
    return child.matchPaths.some((mp) => matchesTarget(pathname, mp, child.exact));
  }
  return false;
}

export function isMainPageActive(page: SidebarMainPageItem, pathname: string): boolean {
  if (matchesTarget(pathname, page.path, false)) return true;
  if (page.matchPaths && page.matchPaths.some((mp) => matchesTarget(pathname, mp, false))) {
    return true;
  }
  if (page.children && page.children.some((c) => isSubPageActive(c, pathname))) {
    return true;
  }
  return false;
}

export interface HrPermissionChecks {
  isHRAdmin: boolean;
  isSuperAdmin: boolean;
  isScreenHidden: (screen: string, module?: string) => boolean;
  getPermLevel: (module: string, screen: string) => number;
  canRead: (module: string, screen?: string) => boolean;
  checkPermission: (...args: any[]) => boolean;
}

export function buildHrSidebarPages(perms: HrPermissionChecks): SidebarMainPageItem[] {
  const rawPages: SidebarMainPageItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/hr/dashboard',
      icon: BarChart2,
      rbacName: 'Dashboard'
    },
    {
      id: 'directory',
      label: 'Directory',
      path: '/hr/directory',
      icon: Users,
      rbacName: 'Employee Directory',
      children: [
        {
          id: 'directory-list',
          label: 'Employee List',
          path: '/hr/directory',
          icon: List,
          exact: true
        },
        {
          id: 'directory-new',
          label: 'Add Employee',
          path: '/hr/directory/new',
          icon: UserPlus
        },
        {
          id: 'directory-spreadsheet',
          label: 'Spreadsheet Matrix',
          path: '/hr/directory/spreadsheet',
          icon: FileSpreadsheet
        }
      ]
    },
    {
      id: 'departments',
      label: 'Departments',
      path: '/hr/departments',
      icon: Building2,
      rbacName: 'Departments & Structure',
      children: [
        {
          id: 'departments-list',
          label: 'Departments List',
          path: '/hr/departments',
          icon: Building2,
          exact: true
        },
        {
          id: 'departments-teams',
          label: 'Teams Builder',
          path: '/hr/departments/teams',
          icon: Layers
        },
        {
          id: 'departments-titles',
          label: 'Job Titles',
          path: '/hr/departments/titles',
          icon: BadgeCheck
        },
        {
          id: 'departments-descriptions',
          label: 'Job Descriptions',
          path: '/hr/departments/descriptions',
          icon: FileText
        }
      ]
    },
    {
      id: 'recruitment',
      label: 'Hiring',
      path: '/hr/recruitment',
      icon: Briefcase,
      rbacName: 'Recruitment & Jobs',
      children: [
        {
          id: 'recruitment-jobs',
          label: 'Job Openings',
          path: '/hr/recruitment/jobs',
          icon: Briefcase
        },
        {
          id: 'recruitment-candidates',
          label: 'Candidates Pipeline',
          path: '/hr/recruitment/candidates',
          icon: UserCheck
        },
        {
          id: 'recruitment-interviews',
          label: 'Interviews & Scorecards',
          path: '/hr/recruitment/interviews',
          icon: CalendarCheck
        }
      ]
    },
    {
      id: 'payroll',
      label: 'Payroll',
      path: '/hr/payroll',
      icon: DollarSign,
      rbacName: 'Payroll & Salaries',
      children: [
        {
          id: 'payroll-runs',
          label: 'Payroll Runs',
          path: '/hr/payroll',
          icon: Wallet,
          exact: true
        },
        {
          id: 'payroll-policy',
          label: 'Policy Setup',
          path: '/hr/payroll/Policy-Setup',
          icon: SlidersHorizontal
        }
      ]
    },
    {
      id: 'attendance',
      label: 'Attendance',
      path: '/hr/attendance',
      icon: Clock,
      rbacName: 'Attendance & Clock In',
      children: [
        {
          id: 'attendance-daily',
          label: 'Daily Logs',
          path: '/hr/attendance/daily-logs',
          icon: Clock
        },
        {
          id: 'attendance-shifts',
          label: 'Shift Schedule',
          path: '/hr/attendance/shifts',
          icon: CalendarDays
        },
        {
          id: 'attendance-breaks',
          label: 'Breaks',
          path: '/hr/attendance/breaks',
          icon: Coffee
        },
        {
          id: 'attendance-leaves',
          label: 'Leave Management',
          path: '/hr/attendance/leaves',
          icon: CalendarCheck
        },
        {
          id: 'attendance-swaps',
          label: 'Shift Swaps',
          path: '/hr/attendance/swaps',
          icon: ArrowLeftRight
        },
        {
          id: 'attendance-reports',
          label: 'Reports',
          path: '/hr/attendance/reports',
          icon: BarChart3
        }
      ]
    },
    {
      id: 'performance',
      label: 'Performance',
      path: '/hr/performance',
      icon: Award,
      rbacName: 'Performance & OKRs',
      children: [
        {
          id: 'performance-core',
          label: 'Performance Core',
          path: '/hr/performance',
          icon: Award,
          exact: true
        },
        {
          id: 'performance-new',
          label: 'New Appraisal',
          path: '/hr/performance/new',
          icon: FilePlus2
        },
        {
          id: 'performance-engine',
          label: 'Appraisal Engine',
          path: '/hr/performance/engine',
          icon: Cpu
        },
        {
          id: 'performance-analysis',
          label: 'Analysis Hub',
          path: '/hr/performance/analysis',
          icon: LineChart
        }
      ]
    },
    {
      id: 'orgchart',
      label: 'Org Chart',
      path: '/hr/orgchart',
      icon: Network,
      rbacName: 'Org Chart'
    },
    {
      id: 'complaints',
      label: 'Complaints',
      path: '/hr/complaints',
      icon: AlertCircle,
      rbacName: 'Complaints & Grievances'
    },
    {
      id: 'archived',
      label: 'Archived Staff',
      path: '/hr/archived',
      icon: Archive,
      rbacName: 'Archived Employees'
    }
  ];

  if (perms.isHRAdmin || perms.isSuperAdmin) return rawPages;

  return rawPages.filter((item) => {
    const rbacName = item.rbacName || item.label;
    if (perms.isScreenHidden(item.id, 'HR') || perms.isScreenHidden(rbacName, 'HR')) return false;
    if (perms.getPermLevel('HR', item.id) === 3 || perms.getPermLevel('HR', rbacName) === 3) return false;
    return (
      (perms.canRead('HR', rbacName) || perms.canRead('HR Management', rbacName)) &&
      perms.checkPermission('HR', 'tab:' + rbacName) !== false
    );
  });
}

export interface QaPermissionChecks {
  isSuperAdmin: boolean;
  isScreenHidden: (screen: string, module?: string) => boolean;
  canRead: (module: string, screen?: string) => boolean;
  checkPermission: (...args: any[]) => boolean;
}

export function buildQaSidebarPages(perms: QaPermissionChecks): SidebarMainPageItem[] {
  const canAccessSettings =
    perms.isSuperAdmin ||
    perms.canRead('QA', 'QA Settings & Integrations') ||
    perms.canRead('QA', 'Settings') ||
    perms.checkPermission('QA', 'custom:qa_settings_button') ||
    perms.checkPermission('QA', 'custom:access_qa_settings') ||
    perms.checkPermission('QA', 'action:QA Settings & Integrations:read') ||
    perms.checkPermission('QA', 'custom:qa_quick_sync_config') ||
    perms.checkPermission('QA', 'custom:quick_sync_configuration') ||
    perms.checkPermission('QA', 'custom:qa_quick_settings_modal');

  const rawPages: SidebarMainPageItem[] = [
    {
      id: 'qa-dashboard',
      label: 'Quality Dashboard',
      path: '/qa/dashboard',
      icon: LayoutDashboard,
      rbacName: 'Quality Dashboard',
      children: [
        {
          id: 'qa-dashboard-overview',
          label: 'Overview',
          path: '/qa/dashboard/overview',
          icon: Gauge,
          exact: true,
          matchPaths: ['/qa/dashboard'],
          rbacName: 'Quality Dashboard'
        },
        {
          id: 'qa-dashboard-employee-tracking',
          label: 'Employee Tracking',
          path: '/qa/dashboard/employee-tracking',
          icon: Users,
          matchPaths: ['/qa/dashboard/employees'],
          rbacName: 'Employee Quality Tracking'
        }
      ]
    },
    {
      id: 'qa-transactions-audit',
      label: 'Transactions Audit',
      path: '/qa/transactions-audit',
      icon: ReceiptText,
      rbacName: 'Transactions Audit',
      children: [
        {
          id: 'qa-tx-complaints',
          label: 'Complaints',
          path: '/qa/transactions-audit/complaints',
          icon: ShieldAlert,
          rbacName: 'Complaints'
        },
        {
          id: 'qa-tx-delays',
          label: 'Delays',
          path: '/qa/transactions-audit/delays',
          icon: Clock,
          rbacName: 'Delays'
        },
        {
          id: 'qa-tx-refunds',
          label: 'Refunds',
          path: '/qa/transactions-audit/refunds',
          icon: DollarSign,
          rbacName: 'Refunds'
        },
        {
          id: 'qa-tx-cancellations',
          label: 'Cancellations',
          path: '/qa/transactions-audit/cancellations',
          icon: XCircle,
          rbacName: 'Cancellations'
        },
        {
          id: 'qa-tx-nps',
          label: 'NPS',
          path: '/qa/transactions-audit/nps',
          icon: Star,
          rbacName: 'NPS'
        },
        {
          id: 'qa-tx-action-plans',
          label: 'Action Plans',
          path: '/qa/transactions-audit/action-plans',
          icon: ListChecks,
          rbacName: 'Action Plans'
        },
        {
          id: 'qa-tx-checklists',
          label: 'Audit Checklists',
          path: '/qa/transactions-audit/checklists',
          icon: Settings2,
          rbacName: 'Audit Checklists'
        }
      ]
    },
    {
      id: 'qa-internal-audit',
      label: 'Internal Audit',
      path: '/qa/internal-audit',
      icon: ClipboardCheck,
      rbacName: 'Internal Audit',
      children: [
        {
          id: 'qa-ia-templates',
          label: 'Checklist Templates',
          path: '/qa/internal-audit/templates',
          icon: ClipboardCheck,
          matchPaths: ['/qa/internal-audit/checklists'],
          rbacName: 'Checklist Templates'
        },
        {
          id: 'qa-ia-perform',
          label: 'Perform Audits',
          path: '/qa/internal-audit/perform',
          icon: CheckSquare,
          rbacName: 'Perform Audits'
        },
        {
          id: 'qa-ia-ncr',
          label: 'NCR Incident Log',
          path: '/qa/internal-audit/ncr-logs',
          icon: AlertTriangle,
          matchPaths: ['/qa/internal-audit/ncr-log'],
          rbacName: 'NCR Incident Log'
        },
        {
          id: 'qa-ia-capa',
          label: 'CAPA Action Plans',
          path: '/qa/internal-audit/capa',
          icon: Wrench,
          matchPaths: ['/qa/internal-audit/capa-actions'],
          rbacName: 'CAPA Action Plans'
        }
      ]
    },
    {
      id: 'qa-history',
      label: 'Audit History',
      path: '/qa/history',
      icon: History,
      matchPaths: ['/qa/audit-history'],
      rbacName: 'Audit History'
    },
    {
      id: 'qa-settings',
      label: 'QA Settings',
      path: '/qa/settings',
      icon: Settings,
      rbacName: 'QA Settings & Integrations'
    }
  ];

  if (perms.isSuperAdmin) return rawPages;

  return rawPages
    .filter((page) => {
      if (page.id === 'qa-settings') return canAccessSettings;
      const rbacLabel = page.rbacName || page.label;
      const screenKey = rbacLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (perms.isScreenHidden(screenKey, 'QA') || perms.isScreenHidden(rbacLabel, 'QA')) {
        return false;
      }
      return perms.canRead('QA', rbacLabel);
    })
    .map((page) => {
      if (!page.children || page.children.length === 0) return page;
      const filteredChildren = page.children.filter((child) => {
        const key = child.rbacName || child.label;
        return perms.canRead('QA', key);
      });
      return {
        ...page,
        children: filteredChildren
      };
    });
}

interface SidebarModuleTreeProps {
  pages: SidebarMainPageItem[];
  pathname: string;
  onNavigate: (path: string) => void;
}

export const SidebarModuleTree: React.FC<SidebarModuleTreeProps> = ({
  pages,
  pathname,
  onNavigate
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const page of pages) {
      if (page.children && page.children.length > 0 && isMainPageActive(page, pathname)) {
        initial[page.id] = true;
      }
    }
    return initial;
  });

  // Automatically expand the active level-2 group when the URL changes
  useEffect(() => {
    const activePage = pages.find(
      (page) => page.children && page.children.length > 0 && isMainPageActive(page, pathname)
    );
    if (activePage) {
      setOpenGroups((prev) => (prev[activePage.id] ? prev : { ...prev, [activePage.id]: true }));
    }
  }, [pathname, pages]);

  const toggleGroup = useCallback((pageId: string) => {
    setOpenGroups((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  }, []);

  return (
    <div className="mt-1 ml-3.5 pl-2 border-l border-white/10 space-y-0.5 pb-1">
      {pages.map((page) => {
        const PageIcon = page.icon;
        const hasChildren = Boolean(page.children && page.children.length > 0);
        const pageActive = isMainPageActive(page, pathname);
        const anyChildActive = Boolean(
          hasChildren && page.children!.some((child) => isSubPageActive(child, pathname))
        );
        const isOpen = Boolean(openGroups[page.id]);

        return (
          <div key={page.id} className="w-full">
            <div
              className={cn(
                'w-full flex items-center rounded-lg transition-colors duration-150 group/sub',
                pageActive
                  ? anyChildActive
                    ? 'bg-emerald-500/10 text-emerald-300'
                    : 'bg-emerald-500/15 text-emerald-300'
                  : 'text-slate-300/85 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              <button
                type="button"
                title={page.label}
                onClick={() => {
                  if (hasChildren) {
                    if (pageActive && isOpen && normalizePath(pathname) === normalizePath(page.path)) {
                      toggleGroup(page.id);
                      return;
                    }
                    setOpenGroups((prev) => ({ ...prev, [page.id]: true }));
                  }
                  onNavigate(page.path);
                }}
                className={cn(
                  'flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 rounded-lg text-left cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/60',
                  pageActive ? 'font-semibold' : 'font-medium'
                )}
              >
                <PageIcon
                  className={cn(
                    'w-3.5 h-3.5 shrink-0 transition-colors',
                    pageActive
                      ? 'text-emerald-400'
                      : 'text-slate-400 group-hover/sub:text-slate-200'
                  )}
                />
                <span className="text-[11.5px] leading-snug tracking-[0.01em] truncate whitespace-nowrap">
                  {page.label}
                </span>
              </button>

              {hasChildren && (
                <button
                  type="button"
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${page.label}`}
                  aria-expanded={isOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroup(page.id);
                  }}
                  className={cn(
                    'p-1.5 mr-0.5 rounded-md transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/60',
                    pageActive
                      ? 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-500/15'
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.08]'
                  )}
                >
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
              )}
            </div>

            {hasChildren && (
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="mt-0.5 ml-3 pl-2 border-l border-white/[0.08] space-y-0.5 py-0.5">
                      {page.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isSubPageActive(child, pathname);
                        return (
                          <button
                            key={child.id}
                            type="button"
                            title={child.label}
                            onClick={() => onNavigate(child.path)}
                            className={cn(
                              'w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left transition-colors duration-150 group/child cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400/60',
                              childActive
                                ? 'bg-emerald-500/20 text-emerald-200 font-semibold'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] font-medium'
                            )}
                          >
                            {ChildIcon && (
                              <ChildIcon
                                className={cn(
                                  'w-3 h-3 shrink-0 transition-colors',
                                  childActive
                                    ? 'text-emerald-400'
                                    : 'text-slate-500 group-hover/child:text-slate-300'
                                )}
                              />
                            )}
                            <span className="text-[10.5px] leading-snug tracking-[0.01em] truncate whitespace-nowrap">
                              {child.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SidebarModuleTree;
