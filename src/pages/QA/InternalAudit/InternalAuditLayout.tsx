import React, { useMemo } from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { 
  ClipboardCheck, 
  CheckSquare, 
  AlertTriangle, 
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const InternalAuditLayout: React.FC = () => {
  const location = useLocation();
  const { canRead, user, previewRole } = useAuth();
  const isSuperAdmin = !previewRole && (user?.role_id === 1 || (user as any)?.is_super_admin || user?.role === 'Admin' || user?.role_name === 'Admin');

  const allTabs = [
    {
      to: '/qa/internal-audit/templates',
      label: 'Checklist Templates',
      labelAr: 'نماذج وقوائم التفتيش',
      icon: ClipboardCheck,
      pattern: /^\/qa\/internal-audit\/(templates|checklists)/
    },
    {
      to: '/qa/internal-audit/perform',
      label: 'Perform Audits',
      labelAr: 'تنفيذ التدقيق والتقييم',
      icon: CheckSquare,
      pattern: /^\/qa\/internal-audit\/perform/
    },
    {
      to: '/qa/internal-audit/ncr-logs',
      label: 'NCR Incident Log',
      labelAr: 'سجل حالات عدم المطابقة NCR',
      icon: AlertTriangle,
      pattern: /^\/qa\/internal-audit\/(ncr-logs|ncr-log)/
    },
    {
      to: '/qa/internal-audit/capa',
      label: 'CAPA Action Plans',
      labelAr: 'إجراءات تصحيحية ووقائية CAPA',
      icon: Wrench,
      pattern: /^\/qa\/internal-audit\/(capa|capa-actions)/
    }
  ];

  const internalTabs = useMemo(() => {
    if (isSuperAdmin) return allTabs;
    return allTabs.filter(t => canRead('QA', t.label));
  }, [isSuperAdmin, canRead]);

  if ((location.pathname === '/qa/internal-audit' || location.pathname === '/qa/internal-audit/') && internalTabs.length > 0) {
    return <Navigate to={internalTabs[0].to} replace />;
  }

  return (
    <div className="space-y-6 animate-fadeIn" id="internal-audit-layout">
      {/* Sub-Navigation for Internal Audit */}
      {internalTabs.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {internalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.pattern.test(location.pathname);

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-slate-400 text-[11px] font-semibold px-3 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Internal ISO Compliance & Standard Operating Procedures</span>
          </div>
        </div>
      )}

      {/* Internal Audit Route Outlet */}
      <Outlet />
    </div>
  );
};

export default InternalAuditLayout;
