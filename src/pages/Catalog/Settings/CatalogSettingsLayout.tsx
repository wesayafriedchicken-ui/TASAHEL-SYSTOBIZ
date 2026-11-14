import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  SlidersHorizontal,
  Layers,
  ChevronRight,
  ShieldCheck,
  Package
} from 'lucide-react';

export const CatalogSettingsLayout: React.FC = () => {
  const location = useLocation();

  const navTabs = [
    {
      to: '/catalog/setting/Manage-Fields',
      label: 'Dynamic Schema & Metadata Builder',
      icon: Layers,
      badge: 'Fields, Repeater Tables & Security'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Breadcrumb */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span>Products & Services</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="font-semibold text-slate-800">Catalog Governance</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <SlidersHorizontal className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Catalog Settings & Metadata Hub
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Decoupled control plane for products, services, tier matrices, promo vouchers, and field-level metadata customization
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Catalog Governance</span>
            </span>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              location.pathname.toLowerCase() === tab.to.toLowerCase() ||
              (tab.to.includes('Manage-Fields') && location.pathname.toLowerCase().includes('manage-fields'));

            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 no-underline cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-normal px-2 py-0.5 rounded-md ${
                    isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {tab.badge}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Main Routed Content */}
      <Outlet />
    </div>
  );
};

export default CatalogSettingsLayout;
