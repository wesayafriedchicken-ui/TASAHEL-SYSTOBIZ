import React, { useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  Network, 
  ListChecks, 
  Boxes, 
  Activity, 
  Palette,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

// Static tab definitions - zero database fetching in layout wrapper
const ADMIN_NAV_TABS = [
  { 
    path: '/admin', 
    label: 'Overview', 
    icon: LayoutGrid, 
    permission: null,
    exact: true 
  },
  { 
    path: '/admin/users', 
    label: 'Users', 
    icon: Users, 
    permission: 'tab:Users',
    matchSubpaths: true 
  },
  { 
    path: '/admin/rbac', 
    label: 'RBAC', 
    icon: ShieldCheck, 
    permission: 'tab:RBAC Matrix' 
  },
  { 
    path: '/admin/org-chart', 
    label: 'Org Chart', 
    icon: Network, 
    permission: 'tab:Org Chart' 
  },
  { 
    path: '/admin/statuses', 
    label: 'Statuses', 
    icon: ListChecks, 
    permission: 'tab:Statuses' 
  },
  { 
    path: '/admin/modules', 
    label: 'Modules', 
    icon: Boxes, 
    permission: 'tab:System Modules' 
  },
  { 
    path: '/admin/audit-logs', 
    label: 'Audit Logs', 
    icon: Activity, 
    permission: 'tab:Audit Logs' 
  },
  { 
    path: '/admin/branding', 
    label: 'Company Branding', 
    icon: Palette, 
    permission: null 
  },
];

export const AdminLayout: React.FC = () => {
  const { checkPermission } = useAuth();
  const location = useLocation();

  // Memoize permissions check once per session/permission update - zero DB calls
  const allowedTabs = useMemo(() => {
    return ADMIN_NAV_TABS.filter(tab => {
      if (!tab.permission) return true;
      try {
        return (checkPermission as any)('Admin', tab.permission);
      } catch {
        return true;
      }
    });
  }, [checkPermission]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Control Panel</h2>
          <p className="text-slate-500 font-medium">Manage users, roles, and organizational structure.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full custom-scrollbar shrink-0">
          {allowedTabs.map(tab => {
            const isTabActive = tab.exact
              ? location.pathname === tab.path
              : tab.matchSubpaths 
                ? (location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`))
                : location.pathname === tab.path;

            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all no-underline whitespace-nowrap",
                  isTabActive
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Routed Content View with Motion Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AdminLayout;
