import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardCheck, 
  ShieldAlert, 
  History, 
  ArrowUpRight, 
  Activity, 
  Users, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  XCircle, 
  Star, 
  ListChecks, 
  Settings2, 
  FileCheck, 
  CheckSquare, 
  AlertTriangle, 
  Wrench, 
  Archive,
  Download,
  FileText,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface SubRoutePill {
  label: string;
  labelAr?: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface HubCardConfig {
  id: string;
  title: string;
  titleAr: string;
  badge: string;
  route: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: {
    bgLight: string;
    border: string;
    text: string;
    iconBg: string;
    iconText: string;
    badgeBg: string;
    badgeText: string;
    pillHoverBorder: string;
    pillHoverBg: string;
    pillHoverText: string;
  };
  description: string;
  subRoutes: SubRoutePill[];
}

export const QAHubPage: React.FC = () => {
  const navigate = useNavigate();

  const hubCards: HubCardConfig[] = [
    // Card 1: Quality Dashboard
    {
      id: 'dashboard',
      title: 'Quality Dashboard',
      titleAr: 'لوحة قيادة الجودة والتحليلات',
      badge: 'QMS Analytics',
      route: '/qa/dashboard',
      icon: LayoutDashboard,
      accentColor: {
        bgLight: 'hover:border-indigo-300 dark:hover:border-indigo-700',
        border: 'border-indigo-100 dark:border-indigo-900/50',
        text: 'text-indigo-600 dark:text-indigo-400',
        iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
        iconText: 'text-indigo-600 dark:text-indigo-400',
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/80',
        badgeText: 'text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        pillHoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
        pillHoverBg: 'hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50',
        pillHoverText: 'hover:text-indigo-700 dark:hover:text-indigo-300'
      },
      description: 'Executive QMS intelligence, resolution cycle times, and employee performance tracking.',
      subRoutes: [
        {
          label: 'Overview',
          labelAr: 'نظرة عامة ومؤشرات',
          path: '/qa/dashboard/overview',
          icon: Activity
        },
        {
          label: 'Employee Quality Tracking',
          labelAr: 'تتبع جودة الموظفين',
          path: '/qa/dashboard/employee-tracking',
          icon: Users
        }
      ]
    },

    // Card 2: Transactions Audit
    {
      id: 'transactions-audit',
      title: 'Transactions Audit',
      titleAr: 'تدقيق المعاملات والعمليات',
      badge: 'Incident Audits',
      route: '/qa/transactions-audit',
      icon: ClipboardCheck,
      accentColor: {
        bgLight: 'hover:border-emerald-300 dark:hover:border-emerald-700',
        border: 'border-emerald-100 dark:border-emerald-900/50',
        text: 'text-emerald-600 dark:text-emerald-400',
        iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
        iconText: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/80',
        badgeText: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        pillHoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
        pillHoverBg: 'hover:bg-emerald-50/70 dark:hover:bg-emerald-950/50',
        pillHoverText: 'hover:text-emerald-700 dark:hover:text-emerald-300'
      },
      description: 'Granular incident workflows, SLA delays, refund reviews, dropout tracking, and CAPA pipelines.',
      subRoutes: [
        {
          label: 'Customer Complaints',
          labelAr: 'شكاوى العملاء',
          path: '/qa/transactions-audit/complaints',
          icon: AlertCircle
        },
        {
          label: 'Delays & Turnaround Time',
          labelAr: 'التأخيرات والمهل الزمنية',
          path: '/qa/transactions-audit/delays',
          icon: Clock
        },
        {
          label: 'Refunds & Financial Discrepancies',
          labelAr: 'الاستردادات والفروق المالية',
          path: '/qa/transactions-audit/refunds',
          icon: DollarSign
        },
        {
          label: 'Cancellations & Dropouts',
          labelAr: 'الإلغاءات والانسحابات',
          path: '/qa/transactions-audit/cancellations',
          icon: XCircle
        },
        {
          label: 'NPS & Customer Sentiment',
          labelAr: 'مؤشر رضا العملاء NPS',
          path: '/qa/transactions-audit/nps',
          icon: Star
        },
        {
          label: 'Action Plans & CAPA',
          labelAr: 'خطط العمل والمعالجة',
          path: '/qa/transactions-audit/action-plans',
          icon: ListChecks
        },
        {
          label: 'Root Cause Buckets',
          labelAr: 'أسباب الانحراف الجذرية',
          path: '/qa/transactions-audit/checklists',
          icon: Settings2
        }
      ]
    },

    // Card 3: Internal Audit
    {
      id: 'internal-audit',
      title: 'Internal Audit',
      titleAr: 'التدقيق الداخلي والامتثال',
      badge: 'Compliance',
      route: '/qa/internal-audit',
      icon: ShieldAlert,
      accentColor: {
        bgLight: 'hover:border-amber-300 dark:hover:border-amber-700',
        border: 'border-amber-100 dark:border-amber-900/50',
        text: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-50 dark:bg-amber-950/60',
        iconText: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/80',
        badgeText: 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        pillHoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
        pillHoverBg: 'hover:bg-amber-50/70 dark:hover:bg-amber-950/50',
        pillHoverText: 'hover:text-amber-700 dark:hover:text-amber-300'
      },
      description: 'Standardized checklist templates, audit evaluations, Non-Conformance Reports, and corrective actions.',
      subRoutes: [
        {
          label: 'Checklist Templates Audits',
          labelAr: 'نماذج وقوائم التفتيش',
          path: '/qa/internal-audit/templates',
          icon: FileCheck
        },
        {
          label: 'Quality Appraisals',
          labelAr: 'تقييم وتطبيق التدقيق',
          path: '/qa/internal-audit/perform',
          icon: CheckSquare
        },
        {
          label: 'NCR Incident Log',
          labelAr: 'سجل حالات عدم المطابقة NCR',
          path: '/qa/internal-audit/ncr-logs',
          icon: AlertTriangle
        },
        {
          label: 'CAPA Action Plans',
          labelAr: 'إجراءات CAPA التصحيحية',
          path: '/qa/internal-audit/capa',
          icon: Wrench
        }
      ]
    },

    // Card 4: Audit History
    {
      id: 'history',
      title: 'Audit History',
      titleAr: 'سجل التدقيق التاريخي',
      badge: 'Audit Trail',
      route: '/qa/history',
      icon: History,
      accentColor: {
        bgLight: 'hover:border-sky-300 dark:hover:border-sky-700',
        border: 'border-sky-100 dark:border-sky-900/50',
        text: 'text-sky-600 dark:text-sky-400',
        iconBg: 'bg-sky-50 dark:bg-sky-950/60',
        iconText: 'text-sky-600 dark:text-sky-400',
        badgeBg: 'bg-sky-50 dark:bg-sky-950/80',
        badgeText: 'text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
        pillHoverBorder: 'hover:border-sky-300 dark:hover:border-sky-700',
        pillHoverBg: 'hover:bg-sky-50/70 dark:hover:bg-sky-950/50',
        pillHoverText: 'hover:text-sky-700 dark:hover:text-sky-300'
      },
      description: 'Immutable historical logs, closed non-conformance records, verified certificates, and compliance exports.',
      subRoutes: [
        {
          label: 'Historical Incident Archive',
          labelAr: 'الأرشيف التاريخي للحالات',
          path: '/qa/history',
          icon: FileText
        },
        {
          label: 'Verified Compliance Trail',
          labelAr: 'سجل الامتثال المعتمد',
          path: '/qa/history',
          icon: ShieldCheck
        }
      ]
    }
  ];

  const handlePillClick = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigate(path);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-2 sm:py-4 font-sans space-y-6" id="qa-launchpad-hub">
      {/* Official QMS Branding & Real-Time Engine Indicator Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        {/* Top Status Strip */}
        <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400 font-mono">
              REAL-TIME ENGINE: CONNECTED
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>ISO 9001:2015 RACI STANDARD</span>
          </div>
        </div>

        {/* Title, Badge & Subtitle */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/60">
              QUALITY MANAGEMENT SYSTEM (QMS)
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              ISO 9001 / RACI Matrix
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-2">
            Quality Assurance & Compliance Management
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1 max-w-4xl">
            Build audit matrices derived from SOPs, resolve process deviations using RACI models, track Non-Conformance Reports (NCR) in real-time, and auto-deploy corrective CAPA pathways.
          </p>
        </div>
      </div>

      {/* 4 Modular Hub Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {hubCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              onClick={() => navigate(card.route)}
              className={`group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer relative overflow-hidden ${card.accentColor.bgLight}`}
            >
              {/* Card Top Header */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-2xs transition-transform duration-200 group-hover:scale-105 ${card.accentColor.iconBg} ${card.accentColor.iconText} ${card.accentColor.border}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {card.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${card.accentColor.badgeBg} ${card.accentColor.badgeText}`}>
                          {card.badge}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                        {card.titleAr}
                      </p>
                    </div>
                  </div>

                  {/* Header Action Arrow */}
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white flex items-center justify-center transition-all group-hover:scale-105 shrink-0">
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-3.5 line-clamp-2">
                  {card.description}
                </p>
              </div>

              {/* Sub-Route Quick Links Section */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <span>Sub-Route Quick Links ({card.subRoutes.length})</span>
                  <span className="text-[10px] lowercase font-mono">click to open</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {card.subRoutes.map((pill, pIdx) => {
                    const PillIcon = pill.icon;

                    return (
                      <button
                        key={`${card.id}-${pill.label}-${pIdx}`}
                        type="button"
                        onClick={(e) => handlePillClick(e, pill.path)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/70 transition-all cursor-pointer shadow-2xs hover:-translate-y-0.5 ${card.accentColor.pillHoverBorder} ${card.accentColor.pillHoverBg} ${card.accentColor.pillHoverText}`}
                        title={`Navigate directly to ${pill.label}`}
                      >
                        <PillIcon className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        <span>{pill.label}</span>
                        <ChevronRight className="w-3 h-3 opacity-40 ml-0.5 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QAHubPage;
