import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Download,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  Building2,
  Store,
  Users,
  Bike,
  Calendar,
  Home,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import {
  DispatchOrder,
  DispatchTeam,
  DispatchRider,
  DispatchProvider,
  getDispatchAuthHeaders,
  formatShortDateTime,
  formatShortDate,
  formatDurationMMSS
} from './types';

type OrdersSidebarMode = 'home' | 'providers' | 'stores' | 'teams' | 'riders' | 'dates';
type OrdersTab = 'orders' | 'uncompleted' | 'scheduled' | 'transfers' | 'abused' | 'remove_abuse';

const ORDER_STATUSES = [
  'Ready',
  'In Progress',
  'On Trip',
  'Picked-up',
  'Way To Customer',
  'Delivered',
  'Scheduled',
  'Paused',
  'Canceled',
  'Returned'
];

const PERFORMANCE_OPTIONS = ['NOT_RATED', 'EXCELLENT', 'GOOD', 'LATE'];

export function LiveDispatchOrdersPage() {
  const navigate = useNavigate();
  const [sidebarMode, setSidebarMode] = useState<OrdersSidebarMode>('home');
  const [activeTab, setActiveTab] = useState<OrdersTab>('orders');
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [teams, setTeams] = useState<DispatchTeam[]>([]);
  const [riders, setRiders] = useState<DispatchRider[]>([]);
  const [providers, setProviders] = useState<DispatchProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [cityFilter, setCityFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [riderFilter, setRiderFilter] = useState('all');
  const [orderNumberFilter, setOrderNumberFilter] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Partial<DispatchOrder> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchReferenceData = useCallback(async () => {
    try {
      const headers = getDispatchAuthHeaders(false);
      const [tRes, rRes, pRes] = await Promise.all([
        fetch('/api/operations/live-dispatch/teams', { headers }),
        fetch('/api/operations/live-dispatch/riders?archived=false', { headers }),
        fetch('/api/operations/live-dispatch/providers', { headers })
      ]);
      if (tRes.ok) setTeams(await tRes.json());
      if (rRes.ok) setRiders(await rRes.json());
      if (pRes.ok) setProviders(await pRes.json());
    } catch (err) {
      console.error('Failed to fetch dispatch references:', err);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'orders') params.set('tab', activeTab);
      if (cityFilter !== 'all') params.set('city', cityFilter);
      if (teamFilter !== 'all') params.set('team', teamFilter);
      if (storeFilter !== 'all') params.set('store', storeFilter);
      if (zoneFilter !== 'all') params.set('zone', zoneFilter);
      if (riderFilter !== 'all') params.set('rider', riderFilter);
      if (orderNumberFilter.trim()) params.set('orderNumber', orderNumberFilter.trim());

      const res = await fetch(`/api/operations/live-dispatch/orders?${params.toString()}`, {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err?.message || 'Error loading orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, cityFilter, teamFilter, storeFilter, zoneFilter, riderFilter, orderNumberFilter]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const distinctCities = useMemo(
    () => Array.from(new Set([...teams.map((t) => t.city), ...orders.map((o) => o.city)].filter(Boolean))),
    [teams, orders]
  );
  const distinctStores = useMemo(
    () => Array.from(new Set([...teams.map((t) => t.name), ...orders.map((o) => o.store_name)].filter(Boolean))),
    [teams, orders]
  );
  const distinctZones = useMemo(
    () => Array.from(new Set(orders.map((o) => o.customer_zone).filter(Boolean))),
    [orders]
  );

  // Grouped summary when viewing By Providers / Stores / Teams / Riders / Dates
  const groupedSummary = useMemo(() => {
    if (sidebarMode === 'home') return [];
    const map = new Map<
      string,
      { key: string; count: number; delivered: number; canceled: number; amount: number; balance: number }
    >();
    orders.forEach((o) => {
      const k =
        sidebarMode === 'providers'
          ? o.provider_name || 'Unassigned Provider'
          : sidebarMode === 'stores'
          ? o.store_name || 'Unknown Store'
          : sidebarMode === 'teams'
          ? o.team_name || 'Unknown Team'
          : sidebarMode === 'riders'
          ? o.rider_name || 'Unassigned Rider'
          : formatShortDate(o.shift_date || o.created_at);

      const entry = map.get(k) || { key: k, count: 0, delivered: 0, canceled: 0, amount: 0, balance: 0 };
      entry.count += 1;
      if (o.status === 'Delivered') entry.delivered += 1;
      if (o.status === 'Canceled' || o.status === 'Returned') entry.canceled += 1;
      entry.amount += Number(o.amount || 0);
      entry.balance += Number(o.balance_due || 0);
      map.set(k, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [orders, sidebarMode]);

  const openCreateModal = () => {
    const defaultTeam = teams[0];
    const defaultProv = providers[0];
    setEditingOrder({
      order_number: '',
      customer_name: '',
      customer_mobile: '',
      customer_zone: '',
      address: '',
      city: defaultTeam?.city || 'الجيزة',
      team_name: defaultTeam?.name || 'فرع فيصل',
      store_name: defaultTeam?.name || 'فرع فيصل',
      store_code: defaultTeam?.store_code || 'RBST-002',
      brand: defaultProv?.name || 'Wesaya',
      provider_name: defaultProv?.name || 'Wesaya',
      amount: 0,
      balance_due: 0,
      payment_type: 'Cash',
      status: 'Ready',
      performance: 'NOT_RATED',
      vehicle_type: 'Motorcycle',
      in_zone: true,
      is_manual: true,
      note: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (order: DispatchOrder) => {
    setEditingOrder({ ...order });
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder?.customer_name?.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingOrder.id);
      const url = isEdit
        ? `/api/operations/live-dispatch/orders/${editingOrder.id}`
        : '/api/operations/live-dispatch/orders';

      const selectedRider = riders.find((r) => Number(r.id) === Number(editingOrder.rider_id));
      const payload = {
        ...editingOrder,
        rider_name: selectedRider ? selectedRider.name : editingOrder.rider_name || '',
        rider_mobile: selectedRider ? selectedRider.mobile_number : editingOrder.rider_mobile || ''
      };

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save order');
      }
      setIsModalOpen(false);
      setEditingOrder(null);
      showToast(isEdit ? 'Order updated in MySQL database' : 'Order created in MySQL database');
      fetchOrders();
    } catch (err: any) {
      showToast(err?.message || 'Error saving order', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    try {
      const res = await fetch(`/api/operations/live-dispatch/orders/${id}`, {
        method: 'DELETE',
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to delete order');
      showToast('Order deleted');
      fetchOrders();
    } catch (err: any) {
      showToast(err?.message || 'Error deleting order', 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await fetch('/api/operations/live-dispatch/orders/export', {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `live-dispatch-orders-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Orders Excel report downloaded');
    } catch (err: any) {
      showToast(err?.message || 'Failed to export report', 'error');
    }
  };

  const resetFilters = () => {
    setCityFilter('all');
    setTeamFilter('all');
    setStoreFilter('all');
    setZoneFilter('all');
    setRiderFilter('all');
    setOrderNumberFilter('');
  };

  const sidebarItems: { id: OrdersSidebarMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'providers', label: 'By Providers', icon: Building2 },
    { id: 'stores', label: 'By Stores', icon: Store },
    { id: 'teams', label: 'By Teams', icon: Users },
    { id: 'riders', label: 'By Riders', icon: Bike },
    { id: 'dates', label: 'By Dates', icon: Calendar }
  ];

  const tabs: { id: OrdersTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'uncompleted', label: 'Uncompleted / Cancelled', icon: AlertCircle },
    { id: 'scheduled', label: 'Scheduled', icon: Clock },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'abused', label: 'Abused', icon: ShieldAlert },
    { id: 'remove_abuse', label: 'Remove Abuse Requests', icon: ShieldCheck }
  ];

  const perfTextClass = (p?: string) => {
    if (p === 'EXCELLENT') return 'text-emerald-700 font-bold';
    if (p === 'GOOD') return 'text-blue-700 font-bold';
    if (p === 'LATE') return 'text-rose-700 font-bold';
    return 'text-slate-400';
  };

  const statusTextClass = (s?: string) => {
    if (s === 'Delivered') return 'text-emerald-700 font-semibold';
    if (s === 'Canceled' || s === 'Returned') return 'text-rose-700 font-semibold';
    if (s === 'Ready' || s === 'On Trip' || s === 'Way To Customer') return 'text-blue-700 font-semibold';
    if (s === 'Paused' || s === 'In Progress') return 'text-amber-700 font-semibold';
    return 'text-slate-700 font-medium';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Left Grouping Sub-Sidebar (matches screenshot #5) */}
      <aside className="w-full lg:w-48 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 self-start">
        <div className="px-2 py-2 text-xs font-bold text-slate-900 border-b border-slate-100 mb-2">
          Orders
        </div>
        <div className="flex lg:flex-col gap-1 overflow-x-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = sidebarMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSidebarMode(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Orders Workspace */}
      <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Orders / {sidebarMode === 'home' ? 'Home / Orders' : `Grouped ${sidebarItems.find((s) => s.id === sidebarMode)?.label}`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {orders.length} records loaded from MySQL database
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/operations-hub/LiveDispatchSystem/orders/New')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Order</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="border-b border-slate-200 flex items-center gap-5 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 pb-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Multi-Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="all">City: All</option>
            {distinctCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Team: All</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>

          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Store: All</option>
            {distinctStores.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Customer Zone: All</option>
            {distinctZones.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>

          <select
            value={riderFilter}
            onChange={(e) => setRiderFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-teal-500"
          >
            <option value="all">Rider Name: All</option>
            {riders.map((r) => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orderNumberFilter}
                onChange={(e) => setOrderNumberFilter(e.target.value)}
                placeholder="Order # / Customer"
                className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="px-2.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
              title="Reset Filters"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={fetchOrders}
              className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Grouped Breakdown View when sidebarMode !== 'home' */}
        {sidebarMode !== 'home' && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Group</th>
                  <th className="px-3 py-2.5 text-right">Total Orders</th>
                  <th className="px-3 py-2.5 text-right">Delivered</th>
                  <th className="px-3 py-2.5 text-right">Cancelled</th>
                  <th className="px-3 py-2.5 text-right">Total Amount (EGP)</th>
                  <th className="px-3 py-2.5 text-right">Balance Due (EGP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groupedSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No orders found for this grouping.
                    </td>
                  </tr>
                ) : (
                  groupedSummary.map((row) => (
                    <tr key={row.key} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{row.key}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{row.count}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700 font-semibold">{row.delivered}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-rose-700">{row.canceled}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{row.amount.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{row.balance.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Main High-Density Orders Table */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Created Date</th>
                <th className="px-3 py-2.5">Shift Date</th>
                <th className="px-3 py-2.5">Order Number</th>
                <th className="px-3 py-2.5">Trip Number</th>
                <th className="px-3 py-2.5">Performance</th>
                <th className="px-3 py-2.5 text-right">Balance Due</th>
                <th className="px-3 py-2.5 text-right">Amount</th>
                <th className="px-3 py-2.5">Customer Name</th>
                <th className="px-3 py-2.5">Rider Name</th>
                <th className="px-3 py-2.5">Manually Created</th>
                <th className="px-3 py-2.5">Created By</th>
                <th className="px-3 py-2.5">Set As Ready By</th>
                <th className="px-3 py-2.5">Rider Mobile</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Store</th>
                <th className="px-3 py-2.5">Store Code</th>
                <th className="px-3 py-2.5">Brand</th>
                <th className="px-3 py-2.5">Customer Zone</th>
                <th className="px-3 py-2.5 text-right">Order Duration</th>
                <th className="px-3 py-2.5 text-right">Distance</th>
                <th className="px-3 py-2.5 text-right">Map Distance</th>
                <th className="px-3 py-2.5">Team</th>
                <th className="px-3 py-2.5">In Zone</th>
                <th className="px-3 py-2.5">Customer Mobile</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={26} className="px-4 py-10 text-center text-slate-400">
                    Loading orders from database...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={26} className="px-4 py-12 text-center">
                    <div className="text-slate-500 font-medium">No orders recorded yet.</div>
                    <button
                      type="button"
                      onClick={() => navigate('/operations-hub/LiveDispatchSystem/orders/New')}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create First Order</span>
                    </button>
                  </td>
                </tr>
              ) : (
                orders.map((order, idx) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2.5 tabular-nums text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-600">{formatShortDateTime(order.created_at)}</td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-600">{formatShortDate(order.shift_date || order.created_at)}</td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-blue-700">
                      <button
                        type="button"
                        onClick={() => navigate(`/operations-hub/LiveDispatchSystem/orders/${order.id}`)}
                        className="hover:underline cursor-pointer"
                      >
                        {order.order_number}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-blue-600">{order.trip_number || '—'}</td>
                    <td className={`px-3 py-2.5 ${perfTextClass(order.performance)}`}>{order.performance || 'NOT_RATED'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-medium">{Number(order.balance_due || 0)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900">{Number(order.amount || 0)}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{order.customer_name}</td>
                    <td className="px-3 py-2.5 text-blue-700 font-medium">{order.rider_name || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600">{order.is_manual ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2.5 text-slate-600">{order.created_by || 'System'}</td>
                    <td className="px-3 py-2.5 text-slate-600">{order.set_as_ready_by || '—'}</td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-600">{order.rider_mobile || '—'}</td>
                    <td className={`px-3 py-2.5 ${statusTextClass(order.status)}`}>{order.status}</td>
                    <td className="px-3 py-2.5 text-slate-700">{order.store_name || '—'}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">{order.store_code || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-700">{order.brand || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-700">{order.customer_zone || '—'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">{formatDurationMMSS(order.order_duration_min)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{Number(order.distance_km || 0)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{Number(order.map_distance_km || 0)}</td>
                    <td className="px-3 py-2.5 text-slate-700">{order.team_name || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600">{order.in_zone ? 'In Zone' : 'Out Zone'}</td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-700">{order.customer_mobile || '—'}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/operations-hub/LiveDispatchSystem/orders/${order.id}`)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                          title="Open Order Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Order Modal */}
      {isModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingOrder.id ? `Edit Order #${editingOrder.order_number}` : 'Create New Dispatch Order'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveOrder} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Order Number</label>
                  <input
                    type="text"
                    value={editingOrder.order_number || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, order_number: e.target.value })}
                    placeholder="Auto-generated if empty"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editingOrder.customer_name || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Mobile</label>
                  <input
                    type="text"
                    value={editingOrder.customer_mobile || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer_mobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Team / Store</label>
                  <select
                    value={editingOrder.team_name || ''}
                    onChange={(e) =>
                      setEditingOrder({ ...editingOrder, team_name: e.target.value, store_name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Zone</label>
                  <input
                    type="text"
                    value={editingOrder.customer_zone || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, customer_zone: e.target.value })}
                    placeholder="e.g. التعاون فيصل"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={editingOrder.city || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={editingOrder.address || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Amount (EGP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingOrder.amount ?? 0}
                    onChange={(e) => {
                      const amt = Number(e.target.value);
                      setEditingOrder({
                        ...editingOrder,
                        amount: amt,
                        balance_due: editingOrder.payment_type === 'Paid' ? 0 : amt
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Balance Due</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingOrder.balance_due ?? 0}
                    onChange={(e) => setEditingOrder({ ...editingOrder, balance_due: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Type</label>
                  <select
                    value={editingOrder.payment_type || 'Cash'}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        payment_type: e.target.value,
                        balance_due: e.target.value === 'Paid' ? 0 : editingOrder.amount ?? 0
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Paid">Paid</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={editingOrder.status || 'Ready'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Assigned Rider</label>
                  <select
                    value={editingOrder.rider_id || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, rider_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">Unassigned</option>
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Performance</label>
                  <select
                    value={editingOrder.performance || 'NOT_RATED'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, performance: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    {PERFORMANCE_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Brand / Provider</label>
                  <input
                    type="text"
                    value={editingOrder.brand || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, brand: e.target.value, provider_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notes</label>
                  <input
                    type="text"
                    value={editingOrder.note || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, note: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex items-end gap-4 pb-2">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingOrder.is_abused)}
                      onChange={(e) => setEditingOrder({ ...editingOrder, is_abused: e.target.checked })}
                    />
                    <span>Flag Abused</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingOrder.is_transferred)}
                      onChange={(e) => setEditingOrder({ ...editingOrder, is_transferred: e.target.checked })}
                    />
                    <span>Transferred</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingOrder.id ? 'Save Changes' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
