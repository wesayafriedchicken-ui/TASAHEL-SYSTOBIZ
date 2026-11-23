import React, { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  LayoutGrid,
  Package,
  Radio,
  MapPin,
  Route as RouteIcon,
  Bike,
  Wallet,
  Store,
  ChevronRight
} from 'lucide-react';

const DISPATCH_NAV_ITEMS = [
  {
    id: 'hub',
    label: 'Overview',
    arLabel: 'الرئيسية',
    path: '/operations-hub/LiveDispatchSystem',
    icon: LayoutGrid
  },
  {
    id: 'orders',
    label: 'Orders',
    arLabel: 'الطلبات',
    path: '/operations-hub/LiveDispatchSystem/orders',
    icon: Package
  },
  {
    id: 'dispatch',
    label: 'Dispatch',
    arLabel: 'التوزيع',
    path: '/operations-hub/LiveDispatchSystem/Dispatch',
    icon: Radio
  },
  {
    id: 'live-tracking',
    label: 'Live Tracking',
    arLabel: 'التتبع اللحظي',
    path: '/operations-hub/LiveDispatchSystem/live-tracking',
    icon: MapPin
  },
  {
    id: 'trip',
    label: 'Trips',
    arLabel: 'الرحلات',
    path: '/operations-hub/LiveDispatchSystem/trip',
    icon: RouteIcon
  },
  {
    id: 'riders',
    label: 'Riders',
    arLabel: 'المناديب',
    path: '/operations-hub/LiveDispatchSystem/Riders',
    icon: Bike
  },
  {
    id: 'accounting',
    label: 'Accounting',
    arLabel: 'الحسابات والمحافظ',
    path: '/operations-hub/LiveDispatchSystem/Accounting',
    icon: Wallet
  },
  {
    id: 'store',
    label: 'Store',
    arLabel: 'الفروع والمتاجر',
    path: '/operations-hub/LiveDispatchSystem/Store',
    icon: Store
  }
];

export function LiveDispatchLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = useMemo(() => {
    try {
      return decodeURIComponent(location.pathname).replace(/\/+$/, '').toLowerCase();
    } catch {
      return location.pathname.replace(/\/+$/, '').toLowerCase();
    }
  }, [location.pathname]);

  const isOrderSubPage = currentPath.startsWith('/operations-hub/livedispatchsystem/orders/');
  const isNewOrderPage = currentPath === '/operations-hub/livedispatchsystem/orders/new';
  const isAccountingArea =
    currentPath === '/operations-hub/livedispatchsystem/accounting' ||
    currentPath.startsWith('/operations-hub/livedispatchsystem/accounting/');
  const accountingSubLabel = currentPath.endsWith('/wallet/agent')
    ? 'Agent'
    : currentPath.endsWith('/wallet/transaction')
    ? 'Transaction'
    : currentPath.endsWith('/wallet/store')
    ? 'Store'
    : null;
  const isStoreSettingsPage = currentPath.startsWith('/operations-hub/livedispatchsystem/store/settings');
  const isSmartRoutesArea =
    currentPath.startsWith('/operations-hub/livedispatchsystem/store/smart routes') ||
    currentPath.startsWith('/operations-hub/livedispatchsystem/store/smart-routes');
  const isGeoFencePage = currentPath.includes('deliveryzonesgeofence');
  const isSmartRoutesListPage = isSmartRoutesArea && !isGeoFencePage;

  const activeItem =
    (isOrderSubPage
      ? DISPATCH_NAV_ITEMS.find((item) => item.id === 'orders')
      : isAccountingArea
      ? DISPATCH_NAV_ITEMS.find((item) => item.id === 'accounting')
      : isStoreSettingsPage || isSmartRoutesArea
      ? DISPATCH_NAV_ITEMS.find((item) => item.id === 'store')
      : DISPATCH_NAV_ITEMS.find((item) => item.path.toLowerCase() === currentPath)) ||
    DISPATCH_NAV_ITEMS[0];

  return (
    <div className="space-y-4">
      {/* Compact Top Bar matching Operations Hub & Systo Biz aesthetic */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/operations-hub')}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-teal-700 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Operations Hub</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <button
            type="button"
            onClick={() => navigate('/operations-hub/LiveDispatchSystem')}
            className="font-bold text-slate-800 hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Live Dispatch System
          </button>
          {activeItem.id !== 'hub' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              {isOrderSubPage ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/operations-hub/LiveDispatchSystem/orders')}
                    className="font-semibold text-slate-600 hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {activeItem.label}
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="font-semibold text-teal-700 whitespace-nowrap shrink-0">
                    {isNewOrderPage ? 'New Dispatch Order' : 'Order Details'}
                  </span>
                </>
              ) : isStoreSettingsPage ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/operations-hub/LiveDispatchSystem/Store')}
                    className="font-semibold text-slate-600 hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {activeItem.label}
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="font-semibold text-teal-700 whitespace-nowrap shrink-0">
                    Settings
                  </span>
                </>
              ) : isSmartRoutesArea ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/operations-hub/LiveDispatchSystem/Store')}
                    className="font-semibold text-slate-600 hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {activeItem.label}
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <button
                    type="button"
                    onClick={() =>
                      navigate('/operations-hub/LiveDispatchSystem/Store/Smart Routes/Routes')
                    }
                    className="font-semibold text-slate-600 hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Smart Routes
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="font-semibold text-teal-700 whitespace-nowrap shrink-0">
                    {isGeoFencePage
                      ? 'Deliveryzones GeoFence'
                      : isSmartRoutesListPage
                      ? 'Routes'
                      : 'Smart Routes'}
                  </span>
                </>
              ) : isAccountingArea && accountingSubLabel ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/operations-hub/LiveDispatchSystem/Accounting')}
                    className="font-semibold text-slate-600 hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {activeItem.label}
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="font-semibold text-teal-700 whitespace-nowrap shrink-0">
                    {accountingSubLabel}
                  </span>
                </>
              ) : (
                <span className="font-semibold text-teal-700 whitespace-nowrap shrink-0">
                  {activeItem.label}
                </span>
              )}
            </>
          )}
        </div>

        {/* Clean segmented route switcher */}
        <nav className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl">
          {DISPATCH_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub-page viewport */}
      <Outlet />
    </div>
  );
}
