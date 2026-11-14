import React, { useMemo } from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Gauge, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export const QADashboardLayout: React.FC = () => {
  const location = useLocation();
  const { canRead, user, previewRole } = useAuth();
  const isSuperAdmin = !previewRole && (user?.role_id === 1 || (user as any)?.is_super_admin || user?.role === 'Admin' || user?.role_name === 'Admin');

  const allSubNavItems = [
    {
      to: '/qa/dashboard/overview',
      label: 'Overview',
      labelAr: 'النظرة العامة',
      icon: Gauge,
      exact: true
    },
    {
      to: '/qa/dashboard/employee-tracking',
      label: 'Employee Quality Tracking',
      labelAr: 'تتبع جودة الموظفين',
      icon: Users,
      exact: false
    }
  ];

  const subNavItems = useMemo(() => {
    if (isSuperAdmin) return allSubNavItems;
    return allSubNavItems.filter(item => {
      if (item.label === 'Overview') return canRead('QA', 'Quality Dashboard');
      return canRead('QA', item.label);
    });
  }, [isSuperAdmin, canRead]);

  if ((location.pathname === '/qa/dashboard' || location.pathname === '/qa/dashboard/') && subNavItems.length > 0 && subNavItems[0].to !== '/qa/dashboard') {
    return <Navigate to={subNavItems[0].to} replace />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Secondary Dashboard Sub-navigation */}
      {subNavItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {subNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location.pathname === item.to || location.pathname === '/qa/dashboard'
                : location.pathname.startsWith(item.to) || (item.to.includes('employee-tracking') && location.pathname.startsWith('/qa/dashboard/employees'));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px] px-3 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Real-time QMS Intelligence & Performance Analytics</span>
          </div>
        </div>
      )}

      {/* Dashboard Sub-Route Content */}
      <Outlet />
    </div>
  );
};

export default QADashboardLayout;
