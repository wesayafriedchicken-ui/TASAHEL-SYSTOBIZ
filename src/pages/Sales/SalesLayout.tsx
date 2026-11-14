import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Kanban, 
  Users, 
  Building2, 
  FileText, 
  Trophy, 
  MessageSquare, 
  Cpu, 
  Plus, 
  DollarSign, 
  Sparkles,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { SalesProvider, useSalesContext } from './context/SalesContext';
import { cn } from '../../lib/utils';

const navItems = [
  { id: 'dashboard', path: '/sales/dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'pipeline', path: '/sales/pipeline/deals', matchPrefix: '/sales/pipeline', label: 'Deals Pipeline', icon: Kanban },
  { id: 'leads', path: '/sales/leads/pool', matchPrefix: '/sales/leads', label: 'Leads & Convert', icon: Users },
  { id: 'contacts-accounts', path: '/sales/contacts-accounts/contacts', matchPrefix: '/sales/contacts-accounts', label: 'Contacts & Accounts', icon: Building2 },
  { id: 'quotations', path: '/sales/quotations/list', matchPrefix: '/sales/quotations', label: 'Quotations', icon: FileText },
  { id: 'team-performance', path: '/sales/team-performance/overview', matchPrefix: '/sales/team-performance', label: 'Team Performance', icon: Trophy },
  { id: 'unified-inbox', path: '/sales/unified-inbox/threads', matchPrefix: '/sales/unified-inbox', label: 'Unified Inbox', icon: MessageSquare },
  { id: 'auto-assign', path: '/sales/auto-assign/round-robin', matchPrefix: '/sales/auto-assign', label: 'Smart Auto-Assign', icon: Cpu },
  { id: 'settings', path: '/sales/setting/integration', matchPrefix: '/sales/setting', label: 'Settings', icon: SlidersHorizontal },
];

const SalesLayoutContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    baseCurrency, 
    setBaseCurrency, 
    currenciesList, 
    deals, 
    leads, 
    toast 
  } = useSalesContext();

  const totalPipelineValue = deals.reduce((sum, d) => sum + Number(d.value || 0), 0);

  return (
    <div className="w-full max-w-full space-y-6 animate-in fade-in duration-500 overflow-x-hidden">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={cn(
            "fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 transition-all duration-300",
            toast.type === 'success' && "bg-emerald-950 text-emerald-100 border-emerald-800",
            toast.type === 'error' && "bg-rose-950 text-rose-100 border-rose-800",
            toast.type === 'info' && "bg-slate-900 text-slate-100 border-slate-800"
          )}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Executive Title */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
          <span>Enterprise Sales CRM Engine</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-700 capitalize">{location.pathname.split('/')[2] || 'Overview'}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Sales CRM Hub
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                {deals.length} Active Deals
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">
              Accelerate pipeline velocity, manage omni-channel prospects, configure commissions, and automate deal flow.
            </p>
          </div>

          {/* Quick Actions & Currency Selector */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto shrink-0 flex-wrap sm:flex-nowrap">
            {/* Currency Pill */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 border border-slate-200/80 px-2.5 py-1.5 rounded-xl">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={baseCurrency}
                onChange={(e) => {
                  setBaseCurrency(e.target.value);
                  localStorage.setItem('acct_base_currency', e.target.value);
                }}
                className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer pr-1"
              >
                {currenciesList.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => navigate('/sales/leads/pool')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer border border-slate-200/60"
            >
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span>Leads ({leads.length})</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/sales/pipeline/deals/new')}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Deal</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-t border-slate-100 pt-3 flex justify-start lg:justify-center overflow-x-auto pb-1">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl max-w-full overflow-x-auto scrollbar-none border border-slate-200/50">
            {navItems.map((item) => {
              const isActive = item.matchPrefix 
                ? location.pathname.startsWith(item.matchPrefix) 
                : location.pathname === item.path;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 no-underline",
                    isActive
                      ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/80 font-black"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                  )}
                >
                  <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-indigo-600" : "text-slate-400")} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-routes View Container */}
      <main className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export const SalesLayout: React.FC = () => {
  return (
    <SalesProvider>
      <SalesLayoutContent />
    </SalesProvider>
  );
};
