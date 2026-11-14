import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  ShieldCheck, 
  Network, 
  ListChecks, 
  Boxes, 
  Activity, 
  Palette,
  ArrowUpRight
} from 'lucide-react';

interface HubCardItem {
  id: string;
  path: string;
  title: string;
  desc: string;
  badge: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  iconBg: string;
}

const HUB_CARDS: HubCardItem[] = [
  {
    id: 'users',
    path: '/admin/users',
    title: 'Users & Accounts',
    desc: 'Manage team credentials, status, and profile assignments.',
    badge: 'Directory',
    icon: Users,
    iconColor: '#10b981', // Emerald
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100/80',
    badgeBg: 'bg-emerald-50/80 border-emerald-200/60',
    badgeText: 'text-emerald-700'
  },
  {
    id: 'rbac',
    path: '/admin/rbac',
    title: 'Role-Based Access (RBAC)',
    desc: 'Granular action gates, field visibility, and security matrices.',
    badge: 'Security',
    icon: ShieldCheck,
    iconColor: '#6366f1', // Indigo
    iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100/80',
    badgeBg: 'bg-indigo-50/80 border-indigo-200/60',
    badgeText: 'text-indigo-700'
  },
  {
    id: 'org-chart',
    path: '/admin/org-chart',
    title: 'Organizational Chart',
    desc: 'Company-wide reporting lines, departments, and leadership hierarchy.',
    badge: 'Structure',
    icon: Network,
    iconColor: '#06b6d4', // Cyan
    iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100/80',
    badgeBg: 'bg-cyan-50/80 border-cyan-200/60',
    badgeText: 'text-cyan-700'
  },
  {
    id: 'statuses',
    path: '/admin/statuses',
    title: 'Custom Statuses',
    desc: 'Configure system pipelines, lifecycle states, and badges.',
    badge: 'Workflows',
    icon: ListChecks,
    iconColor: '#f59e0b', // Amber
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100/80',
    badgeBg: 'bg-amber-50/80 border-amber-200/60',
    badgeText: 'text-amber-700'
  },
  {
    id: 'modules',
    path: '/admin/modules',
    title: 'Modules Manager',
    desc: 'Enable or disable global suites, custom apps, and sidebars.',
    badge: 'Core',
    icon: Boxes,
    iconColor: '#8b5cf6', // Purple
    iconBg: 'bg-purple-50 text-purple-600 border border-purple-100/80',
    badgeBg: 'bg-purple-50/80 border-purple-200/60',
    badgeText: 'text-purple-700'
  },
  {
    id: 'audit-logs',
    path: '/admin/audit-logs',
    title: 'System Audit Logs',
    desc: 'Track administrative activities, security events, and user logins.',
    badge: 'Compliance',
    icon: Activity,
    iconColor: '#f43f5e', // Rose
    iconBg: 'bg-rose-50 text-rose-600 border border-rose-100/80',
    badgeBg: 'bg-rose-50/80 border-rose-200/60',
    badgeText: 'text-rose-700'
  },
  {
    id: 'branding',
    path: '/admin/branding',
    title: 'Company Branding',
    desc: 'Logos, themes, color palettes, and tenant identity settings.',
    badge: 'Identity',
    icon: Palette,
    iconColor: '#14b8a6', // Teal
    iconBg: 'bg-teal-50 text-teal-600 border border-teal-100/80',
    badgeBg: 'bg-teal-50/80 border-teal-200/60',
    badgeText: 'text-teal-700'
  }
];

export const AdminHubPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* 7 Compact Cards Navigation Hub - Zero DB calls, Instant render */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {HUB_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => navigate(card.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(card.path);
                }
              }}
              className="group relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 h-[120px] flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden select-none focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              {/* Card Header: Icon + Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-200 shrink-0 ${card.iconBg}`}>
                  <Icon className="w-4 h-4" style={{ color: card.iconColor }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeBg} ${card.badgeText}`}>
                    {card.badge}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
                </div>
              </div>

              {/* Card Body: Title + Description */}
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {card.title}
                </h3>
                <p className="text-[11px] leading-tight text-slate-500 line-clamp-2">
                  {card.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminHubPage;
