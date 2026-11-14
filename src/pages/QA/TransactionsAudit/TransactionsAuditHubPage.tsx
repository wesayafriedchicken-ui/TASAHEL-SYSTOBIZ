import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Clock, 
  CircleDollarSign, 
  XCircle, 
  Star, 
  ListTodo, 
  CheckSquare, 
  ArrowUpRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Lock,
  Settings
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface ActionCardConfig {
  id: string;
  title: string;
  badge: string;
  path: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    border: string;
    hoverBorder: string;
    iconBg: string;
    iconText: string;
    iconBorder: string;
    badgeBg: string;
    badgeText: string;
  };
}

export const TransactionsAuditHubPage: React.FC = () => {
  const navigate = useNavigate();
  const { canRead, user, previewRole } = useAuth();
  const isSuperAdmin = !previewRole && (user?.role_id === 1 || (user as any)?.is_super_admin || user?.role === 'Admin' || user?.role_name === 'Admin');

  const actionCards: ActionCardConfig[] = [
    {
      id: 'complaints',
      title: 'Customer Complaints',
      badge: 'Tickets',
      path: '/qa/transactions-audit/complaints',
      description: 'Customer escalations & dispute audits',
      icon: ShieldAlert,
      color: {
        border: 'border-indigo-100 dark:border-indigo-900/50',
        hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
        iconBg: 'bg-indigo-50 dark:bg-indigo-950/70',
        iconText: 'text-indigo-600 dark:text-indigo-400',
        iconBorder: 'border-indigo-100 dark:border-indigo-900/60',
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/80',
        badgeText: 'text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
      }
    },
    {
      id: 'delays',
      title: 'Operational Delays',
      badge: 'SLA Track',
      path: '/qa/transactions-audit/delays',
      description: 'Turnaround time & SLA breach tracking',
      icon: Clock,
      color: {
        border: 'border-amber-100 dark:border-amber-900/50',
        hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
        iconBg: 'bg-amber-50 dark:bg-amber-950/70',
        iconText: 'text-amber-600 dark:text-amber-400',
        iconBorder: 'border-amber-100 dark:border-amber-900/60',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/80',
        badgeText: 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      }
    },
    {
      id: 'refunds',
      title: 'Refunds & Claims',
      badge: 'Financial',
      path: '/qa/transactions-audit/refunds',
      description: 'Discrepancies & refund claims validation',
      icon: CircleDollarSign,
      color: {
        border: 'border-emerald-100 dark:border-emerald-900/50',
        hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/70',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        iconBorder: 'border-emerald-100 dark:border-emerald-900/60',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80',
        badgeText: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      }
    },
    {
      id: 'cancellations',
      title: 'Booking Cancellations',
      badge: 'Dropouts',
      path: '/qa/transactions-audit/cancellations',
      description: 'Dropout rates & order churn review',
      icon: XCircle,
      color: {
        border: 'border-rose-100 dark:border-rose-900/50',
        hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
        iconBg: 'bg-rose-50 dark:bg-rose-950/70',
        iconText: 'text-rose-600 dark:text-rose-400',
        iconBorder: 'border-rose-100 dark:border-rose-900/60',
        badgeBg: 'bg-rose-50 dark:bg-rose-950/80',
        badgeText: 'text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
      }
    },
    {
      id: 'nps',
      title: 'NPS & Sentiment',
      badge: 'Feedback',
      path: '/qa/transactions-audit/nps',
      description: 'CSAT, surveys & customer mood analysis',
      icon: Star,
      color: {
        border: 'border-purple-100 dark:border-purple-900/50',
        hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
        iconBg: 'bg-purple-50 dark:bg-purple-950/70',
        iconText: 'text-purple-600 dark:text-purple-400',
        iconBorder: 'border-purple-100 dark:border-purple-900/60',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/80',
        badgeText: 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
      }
    },
    {
      id: 'action-plans',
      title: 'Action Plans (CAPA)',
      badge: 'CAPA',
      path: '/qa/transactions-audit/action-plans',
      description: 'Remediation & corrective workflow tasks',
      icon: ListTodo,
      color: {
        border: 'border-teal-100 dark:border-teal-900/50',
        hoverBorder: 'hover:border-teal-300 dark:hover:border-teal-700',
        iconBg: 'bg-teal-50 dark:bg-teal-950/70',
        iconText: 'text-teal-600 dark:text-teal-400',
        iconBorder: 'border-teal-100 dark:border-teal-900/60',
        badgeBg: 'bg-teal-50 dark:bg-teal-950/80',
        badgeText: 'text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
      }
    },
    {
      id: 'checklists',
      title: 'Audit Checklists',
      badge: 'Standards',
      path: '/qa/transactions-audit/checklists',
      description: 'Quality scorecards & evaluation criteria',
      icon: CheckSquare,
      color: {
        border: 'border-sky-100 dark:border-sky-900/50',
        hoverBorder: 'hover:border-sky-300 dark:hover:border-sky-700',
        iconBg: 'bg-sky-50 dark:bg-sky-950/70',
        iconText: 'text-sky-600 dark:text-sky-400',
        iconBorder: 'border-sky-100 dark:border-sky-900/60',
        badgeBg: 'bg-sky-50 dark:bg-sky-950/80',
        badgeText: 'text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
      }
    }
  ];

  return (
    <div className="space-y-4 font-sans animate-fadeIn" id="transactions-audit-hub">
      {/* Header Strip with Back Link to QA Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/qa')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer group shrink-0"
            title="Return to QA Executive Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>QA Hub</span>
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500">
              <span>Transactions Audit</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Operational Launchpad</span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
              Select Operational Stream
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => navigate('/qa/settings')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700 shadow-2xs group"
            title="Open QA Data Integration & Google Sheets Settings"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:rotate-45 transition-transform" />
            <span>Settings</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span className="text-[11px] font-mono">7 Categories Active</span>
          </div>
        </div>
      </div>

      {/* 7 Compact Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 max-w-6xl mx-auto">
        {actionCards.map((card) => {
          const Icon = card.icon;
          const hasAccess = isSuperAdmin || canRead('QA', card.title) || canRead('QA', card.id) || canRead('QA', card.badge);

          return (
            <div
              key={card.id}
              onClick={() => {
                if (!hasAccess) return;
                navigate(card.path);
              }}
              className={`bg-white dark:bg-slate-900 border ${
                hasAccess 
                  ? `${card.color.border} ${card.color.hoverBorder} hover:shadow-md hover:-translate-y-0.5 cursor-pointer` 
                  : 'border-slate-200/60 dark:border-slate-800/60 opacity-60 cursor-not-allowed'
              } rounded-xl p-3.5 sm:p-4 h-[115px] shadow-xs transition-all duration-200 group flex flex-col justify-between relative overflow-hidden`}
              title={hasAccess ? `Open ${card.title}` : `Restricted: No permission to view ${card.title}`}
            >
              {/* Top Row: Icon Container + Badge + Arrow */}
              <div className="flex items-center justify-between gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-2xs ${
                  hasAccess 
                    ? `group-hover:scale-105 transition-transform ${card.color.iconBg} ${card.color.iconText} ${card.color.iconBorder}`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    hasAccess 
                      ? `${card.color.badgeBg} ${card.color.badgeText}`
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}>
                    {hasAccess ? card.badge : 'Restricted'}
                  </span>
                  {hasAccess ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
              </div>

              {/* Bottom Row: Title + Micro-Description */}
              <div className="min-w-0">
                <h3 className={`text-xs sm:text-sm font-black truncate transition-colors ${
                  hasAccess 
                    ? 'text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {hasAccess ? card.description : 'Permission required to access stream'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransactionsAuditHubPage;
