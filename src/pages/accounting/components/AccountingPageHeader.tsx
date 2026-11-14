import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Upload, Download, Filter, 
  ChevronRight, List, LayoutGrid, BarChart2, Table
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface AccountingPageHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  badge?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  extraActions?: React.ReactNode;
  viewMode?: 'list' | 'kanban' | 'pivot' | 'graph';
  onViewModeChange?: (mode: 'list' | 'kanban' | 'pivot' | 'graph') => void;
  count?: number;
}

export const AccountingPageHeader: React.FC<AccountingPageHeaderProps> = ({
  breadcrumbs,
  title,
  badge,
  primaryAction,
  secondaryAction,
  extraActions,
  viewMode = 'list',
  onViewModeChange,
  count
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Breadcrumbs + Title */}
        <div className="space-y-1">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Link 
              to="/accounting/dashboard" 
              className="hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              Accounting
            </Link>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                {crumb.href ? (
                  <Link 
                    to={crumb.href} 
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
          
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {badge && (
              <span className="px-2 py-0.5 text-[11px] font-bold tracking-wide rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {badge}
              </span>
            )}
            {typeof count === 'number' && (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                ({count} records)
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions + View switchers */}
        <div className="flex items-center flex-wrap gap-2.5">
          {extraActions}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              {secondaryAction.icon || <Upload className="w-3.5 h-3.5 text-slate-500" />}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
            >
              {primaryAction.icon || <Plus className="w-4 h-4" />}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {/* Odoo style view mode toggle */}
          {onViewModeChange && (
            <div className="hidden sm:flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 ml-1">
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                title="List View"
                className={cn(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  viewMode === 'list' 
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold" 
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('kanban')}
                title="Kanban View"
                className={cn(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  viewMode === 'kanban' 
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold" 
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('pivot')}
                title="Pivot View"
                className={cn(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  viewMode === 'pivot' 
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold" 
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                <Table className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('graph')}
                title="Graph View"
                className={cn(
                  "p-1.5 rounded-md transition-colors cursor-pointer",
                  viewMode === 'graph' 
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold" 
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                <BarChart2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
