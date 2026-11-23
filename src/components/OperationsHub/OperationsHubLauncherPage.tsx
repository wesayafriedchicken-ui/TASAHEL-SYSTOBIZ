import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radio,
  Workflow,
  ArrowUpRight,
  RefreshCw,
  Package,
  MapPin,
  Wallet,
  Store,
  Layers
} from 'lucide-react';
import { DispatchKpis, getDispatchAuthHeaders } from './LiveDispatch/types';

interface DispatchSummaryStats {
  totalOrders: number;
  activeTripsCount: number;
  ridersOnDuty: number;
  storesCount: number;
}

interface OverviewStats {
  totalWorkOrders: number;
  activeWorkOrders: number;
  completedWorkOrders: number;
  netProfit: number;
}

export function OperationsHubLauncherPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dispatchStats, setDispatchStats] = useState<DispatchSummaryStats>({
    totalOrders: 0,
    activeTripsCount: 0,
    ridersOnDuty: 0,
    storesCount: 0
  });
  const [overviewStats, setOverviewStats] = useState<OverviewStats>({
    totalWorkOrders: 0,
    activeWorkOrders: 0,
    completedWorkOrders: 0,
    netProfit: 0
  });

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const [dispatchRes, workOrdersRes] = await Promise.all([
        fetch('/api/operations/live-dispatch/summary', {
          headers: getDispatchAuthHeaders(false)
        }).catch(() => null),
        fetch('/api/operations/work-orders', {
          headers: getDispatchAuthHeaders(false)
        }).catch(() => null)
      ]);

      if (dispatchRes && dispatchRes.ok) {
        const data = await dispatchRes.json();
        const kpis: Partial<DispatchKpis> = data?.kpis || {};
        setDispatchStats({
          totalOrders: Number(kpis.totalOrders || 0),
          activeTripsCount: Number(kpis.activeTripsCount || 0),
          ridersOnDuty: Number(kpis.ridersOnDuty || 0),
          storesCount: Number(data?.storesCount || 0)
        });
      }

      if (workOrdersRes && workOrdersRes.ok) {
        const data = await workOrdersRes.json();
        const orders = Array.isArray(data?.workOrders) ? data.workOrders : [];
        let completed = 0;
        let totalSales = 0;
        let totalCost = 0;
        for (const wo of orders) {
          const st = String(wo.status || '').toLowerCase();
          if (st.includes('deliver') || st.includes('complete') || st.includes('closed')) {
            completed += 1;
          }
          totalSales += Number(wo.sale_value || 0);
          totalCost += Number(wo.actual_cost_total || 0);
        }
        setOverviewStats({
          totalWorkOrders: orders.length,
          activeWorkOrders: Math.max(0, orders.length - completed),
          completedWorkOrders: completed,
          netProfit: Number((totalSales - totalCost).toFixed(2))
        });
      }
    } catch (err) {
      console.error('Failed to load Operations Hub metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const dispatchQuickLinks = [
    { label: 'Orders', path: '/operations-hub/LiveDispatchSystem/orders', icon: Package },
    { label: 'Dispatch', path: '/operations-hub/LiveDispatchSystem/Dispatch', icon: Radio },
    { label: 'Live Tracking', path: '/operations-hub/LiveDispatchSystem/live-tracking', icon: MapPin },
    { label: 'Accounting', path: '/operations-hub/LiveDispatchSystem/Accounting', icon: Wallet },
    { label: 'Store', path: '/operations-hub/LiveDispatchSystem/Store', icon: Store }
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Compact Header */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Operations Hub</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose a workspace to manage live fleet dispatch or oversee work orders and operational margins.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchMetrics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2 Primary Compact Workspace Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Live Dispatch System */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/operations-hub/LiveDispatchSystem')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/operations-hub/LiveDispatchSystem');
            }
          }}
          className="group bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-5 transition-all duration-150 hover:shadow-md flex flex-col justify-between min-h-[210px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
              Live Dispatch System
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Coordinate dispatch orders, live rider assignment, real-time GPS tracking, trips, rider wallets, and store geofences.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums flex-wrap">
                <span className="font-bold text-slate-900">
                  {loading ? '—' : dispatchStats.totalOrders} orders
                </span>
                <span aria-hidden="true">·</span>
                <span>{loading ? '—' : dispatchStats.activeTripsCount} active trips</span>
                <span aria-hidden="true">·</span>
                <span>{loading ? '—' : dispatchStats.ridersOnDuty} riders on duty</span>
              </div>
              <span className="text-xs font-semibold text-teal-700 group-hover:underline whitespace-nowrap shrink-0">
                Open
              </span>
            </div>

            {/* Direct sub-module text shortcuts */}
            <div
              className="flex items-center gap-2 flex-wrap pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              {dispatchQuickLinks.map((link, idx) => (
                <React.Fragment key={link.path}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-teal-700 hover:underline transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {link.label}
                  </button>
                  {idx < dispatchQuickLinks.length - 1 && (
                    <span className="text-slate-300 text-[11px]" aria-hidden="true">
                      ·
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Overview */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => navigate('/operations-hub/Overview')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/operations-hub/Overview');
            }
          }}
          className="group bg-white border border-slate-200 hover:border-teal-400 rounded-2xl p-5 transition-all duration-150 hover:shadow-md flex flex-col justify-between min-h-[210px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-teal-50 group-hover:text-teal-700 flex items-center justify-center shrink-0 transition-colors">
                <Workflow className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
            </div>

            <h2 className="mt-4 text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
              Overview
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              Manage work orders pipeline, multi-role assignment desk, direct operational cost overrides, auto-assign rules, and live net margins.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums flex-wrap">
                <span className="font-bold text-slate-900">
                  {loading ? '—' : overviewStats.totalWorkOrders} work orders
                </span>
                <span aria-hidden="true">·</span>
                <span>{loading ? '—' : overviewStats.activeWorkOrders} active</span>
                <span aria-hidden="true">·</span>
                <span>{loading ? '—' : overviewStats.completedWorkOrders} completed</span>
              </div>
              <span className="text-xs font-semibold text-teal-700 group-hover:underline whitespace-nowrap shrink-0">
                Open
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap pt-1">
              <span>Work Orders Pipeline</span>
              <span aria-hidden="true">·</span>
              <span>Assignment Desk</span>
              <span aria-hidden="true">·</span>
              <span>Cost Override</span>
              <span aria-hidden="true">·</span>
              <span>Auto Assign</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
