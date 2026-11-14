import React from 'react';
import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Tag, Percent, Layers } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useCatalog } from '../CatalogContext';

export const PricingLayout: React.FC = () => {
  const location = useLocation();
  const { priceLists, promoCodes } = useCatalog();

  const isPriceListsActive = location.pathname.includes('/price-lists');
  const isPromoCodesActive = location.pathname.includes('/promo-codes');

  // If exact /catalog/pricing, redirect to /catalog/pricing/price-lists
  if (location.pathname === '/catalog/pricing' || location.pathname === '/catalog/pricing/') {
    return <Navigate to="/catalog/pricing/price-lists" replace />;
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Sub-tab switcher */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-max border border-slate-200/60">
        <NavLink
          to="/catalog/pricing/price-lists"
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all no-underline cursor-pointer",
            isPriceListsActive
              ? "bg-white text-slate-900 shadow-sm font-extrabold"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Multi-Tier Price Lists</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold">
            {priceLists.length}
          </span>
        </NavLink>

        <NavLink
          to="/catalog/pricing/promo-codes"
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all no-underline cursor-pointer",
            isPromoCodesActive
              ? "bg-white text-slate-900 shadow-sm font-extrabold"
              : "text-slate-500 hover:text-slate-800"
          )}
        >
          <Percent className="w-4 h-4 text-indigo-600" />
          <span>Discount Promo Codes</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold">
            {promoCodes.length}
          </span>
        </NavLink>
      </div>

      <Outlet />
    </div>
  );
};

export default PricingLayout;
