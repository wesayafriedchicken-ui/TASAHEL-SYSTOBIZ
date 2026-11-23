import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Radio,
  MapPin,
  Route as RouteIcon,
  Bike,
  Wallet,
  Store,
  ArrowUpRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DispatchKpis, getDispatchAuthHeaders } from './types';

interface SummaryResponse {
  kpis: DispatchKpis;
  activeShiftsCount: number;
  storesCount?: number;
  zonesCount?: number;
  routesCount?: number;
  walletTotalAmount?: number;
  walletTransactionsCount?: number;
  teams: any[];
  providers: any[];
}

export function LiveDispatchHubPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operations/live-dispatch/summary', {
        headers: getDispatchAuthHeaders(false)
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to load Live Dispatch summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const kpis = summary?.kpis;

  const cards = [
    {
      id: 'orders',
      title: 'Orders',
      arTitle: 'الطلبات',
      description: 'طلبات التشغيل، الفلاتر، حالات الإلغاء والمجدولة والتقارير.',
      route: '/operations-hub/LiveDispatchSystem/orders',
      icon: Package,
      accentBg: 'bg-teal-50 text-teal-700',
      hoverBorder: 'hover:border-teal-400',
      metricLabel: 'Total Orders',
      metricValue: kpis ? String(kpis.totalOrders) : '0',
      subMetric: kpis ? `${kpis.pendingCount} pending · ${kpis.deliveredCount} delivered` : 'Loading...'
    },
    {
      id: 'dispatch',
      title: 'Dispatch Board',
      arTitle: 'لوحة التوزيع اللحظي',
      description: 'توزيع الطلبات على المناديب ومتابعة الرحلات الجارية لحظياً.',
      route: '/operations-hub/LiveDispatchSystem/Dispatch',
      icon: Radio,
      accentBg: 'bg-blue-50 text-blue-700',
      hoverBorder: 'hover:border-blue-400',
      metricLabel: 'On Going Trips',
      metricValue: kpis ? String(kpis.activeTripsCount) : '0',
      subMetric: kpis ? `${kpis.onTripsCount} active orders · ${kpis.lateCount} late` : 'Loading...'
    },
    {
      id: 'live-tracking',
      title: 'Live Tracking',
      arTitle: 'التتبع المباشر GPS',
      description: 'خريطة حية لمواقع المناديب والطلبات الموزعة وغير الموزعة.',
      route: '/operations-hub/LiveDispatchSystem/live-tracking',
      icon: MapPin,
      accentBg: 'bg-emerald-50 text-emerald-700',
      hoverBorder: 'hover:border-emerald-400',
      metricLabel: 'On-Duty GPS',
      metricValue: kpis ? String(kpis.ridersOnDuty) : '0',
      subMetric: kpis ? `${kpis.ridersInZone} in zone · ${kpis.ridersNoGps} no GPS` : 'Loading...'
    },
    {
      id: 'trip',
      title: 'Trips',
      arTitle: 'إدارة الرحلات',
      description: 'سجل الرحلات المكتملة والملغاة وأوقات التنفيذ والمسافات.',
      route: '/operations-hub/LiveDispatchSystem/trip',
      icon: RouteIcon,
      accentBg: 'bg-indigo-50 text-indigo-700',
      hoverBorder: 'hover:border-indigo-400',
      metricLabel: 'All Trips',
      metricValue: kpis ? String(kpis.totalTrips) : '0',
      subMetric: kpis ? `${kpis.ridersPerformancePct}% on-time rate` : 'Loading...'
    },
    {
      id: 'riders',
      title: 'Riders',
      arTitle: 'إدارة المناديب',
      description: 'ملفات المناديب، الفرق، الشركات، الشيفتات والإيرادات.',
      route: '/operations-hub/LiveDispatchSystem/Riders',
      icon: Bike,
      accentBg: 'bg-amber-50 text-amber-700',
      hoverBorder: 'hover:border-amber-400',
      metricLabel: 'Active Riders',
      metricValue: kpis ? String(kpis.ridersTotal) : '0',
      subMetric: kpis ? `${kpis.ridersAvailable} available · ${kpis.ridersBreak} break` : 'Loading...'
    },
    {
      id: 'accounting',
      title: 'Accounting',
      arTitle: 'الحسابات والمحافظ والعمولات',
      description: 'متابعة حسابات الفروع، محافظ المناديب، العمولات، التحصيل وتصدير التقارير.',
      route: '/operations-hub/LiveDispatchSystem/Accounting',
      icon: Wallet,
      accentBg: 'bg-emerald-50 text-emerald-700',
      hoverBorder: 'hover:border-emerald-400',
      metricLabel: 'Wallet Ledger',
      metricValue: summary ? `${Number(summary.walletTotalAmount ?? 0).toLocaleString('en-US')} EGP` : '0 EGP',
      subMetric: summary ? `${summary.walletTransactionsCount ?? 0} transactions recorded` : 'Loading...'
    },
    {
      id: 'store',
      title: 'Store',
      arTitle: 'الفروع ومناطق التوصيل',
      description: 'بيانات الفروع، إحداثيات الخريطة، مناطق العملاء، خطوط السير وإعدادات التوزيع.',
      route: '/operations-hub/LiveDispatchSystem/Store',
      icon: Store,
      accentBg: 'bg-sky-50 text-sky-700',
      hoverBorder: 'hover:border-sky-400',
      metricLabel: 'Dispatch Stores',
      metricValue: summary ? String(summary.storesCount ?? 0) : '0',
      subMetric: summary ? `${summary.zonesCount ?? 0} zones · ${summary.routesCount ?? 0} routes` : 'Loading...'
    }
  ];

  return (
    <div className="space-y-5">
      {/* Compact Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            Live Dispatch System <span className="text-slate-400 font-medium text-sm">· نظام التوزيع والمتابعة اللحظية</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            اختر القسم للدخول المباشر على إدارة الطلبات، التوزيع اللحظي، التتبع المباشر على الخريطة، الرحلات، أو المناديب.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchSummary}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/operations-hub/LiveDispatchSystem/Dispatch')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Open Live Dispatch</span>
          </button>
        </div>
      </div>

      {/* 6 Compact Launcher Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => navigate(card.route)}
              className={`group text-left bg-white border border-slate-200 ${card.hoverBorder} rounded-2xl p-4 transition-all duration-150 hover:shadow-md flex flex-col justify-between min-h-[168px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-9 h-9 rounded-xl ${card.accentBg} flex items-center justify-center shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                </div>

                <div className="mt-3">
                  <div className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    {card.title}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">{card.arTitle}</div>
                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-2">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums leading-none">
                    {loading ? '—' : card.metricValue}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 truncate max-w-[165px]">
                    {card.subMetric}
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-teal-700 group-hover:underline whitespace-nowrap shrink-0">
                  Open
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Operational Metrics Strip (Real MySQL Data) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="px-4 py-2 flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Avg. Delivery Time</div>
              <div className="text-base font-bold text-slate-900 tabular-nums">
                {kpis ? `${kpis.avgDeliveryMin} min` : '0 min'}
              </div>
            </div>
          </div>
          <div className="px-4 py-2 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Delivered Orders</div>
              <div className="text-base font-bold text-slate-900 tabular-nums">
                {kpis ? kpis.deliveredCount : 0}
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  ({kpis ? `${kpis.excellentTasksPct}% excellent` : '0%'})
                </span>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 flex items-center gap-3">
            <Bike className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Active Shifts / Teams</div>
              <div className="text-base font-bold text-slate-900 tabular-nums">
                {summary?.activeShiftsCount ?? 0} shifts
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  · {summary?.teams?.length ?? 0} teams
                </span>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Late / Cancelled</div>
              <div className="text-base font-bold text-slate-900 tabular-nums">
                {kpis ? kpis.lateCount : 0} late
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  · {kpis ? kpis.cancelledCount : 0} cancelled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
