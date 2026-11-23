import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  Plus,
  Users,
  Bike,
  Route as RouteIcon,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Sliders,
  ArrowRight,
  X,
  Pause,
  Clock
} from 'lucide-react';
import {
  DispatchKpis,
  DispatchOrder,
  DispatchRider,
  DispatchTeam,
  DispatchTrip,
  getDispatchAuthHeaders,
  formatElapsedFromIso
} from './types';

interface BoardResponse {
  kpis: DispatchKpis;
  teams: DispatchTeam[];
  providers: any[];
  riders: DispatchRider[];
  ongoingTrips: DispatchTrip[];
  orders: DispatchOrder[];
}

type QueueTab = 'all' | 'ready' | 'scheduled' | 'paused' | 'late';

export function LiveDispatchBoardPage() {
  const navigate = useNavigate();
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showKpis, setShowKpis] = useState(true);
  const [showRidersSection, setShowRidersSection] = useState(true);
  const [showTripsSection, setShowTripsSection] = useState(true);
  const [onlyAvailableRiders, setOnlyAvailableRiders] = useState(false);
  const [queueTab, setQueueTab] = useState<QueueTab>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isManualOrderOpen, setIsManualOrderOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isStartShiftOpen, setIsStartShiftOpen] = useState(false);
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [assignRiderId, setAssignRiderId] = useState<string>('');
  const [shiftRiderId, setShiftRiderId] = useState<string>('');
  const [capacityTeamId, setCapacityTeamId] = useState<string>('');
  const [capacityValue, setCapacityValue] = useState<number>(4);

  const [manualOrderForm, setManualOrderForm] = useState({
    order_number: '',
    customer_name: '',
    customer_mobile: '',
    customer_zone: '',
    address: '',
    amount: 0,
    payment_type: 'Cash',
    note: '',
    status: 'Ready',
    team_name: ''
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTeam !== 'all') params.set('team', selectedTeam);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());

      const res = await fetch(`/api/operations/live-dispatch/board?${params.toString()}`, {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to load dispatch board');
      const data: BoardResponse = await res.json();
      setBoard(data);
    } catch (err: any) {
      showToast(err?.message || 'Error loading dispatch board', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam, searchTerm]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const kpis = board?.kpis;
  const teams = board?.teams || [];
  const riders = board?.riders || [];
  const ongoingTrips = board?.ongoingTrips || [];
  const orders = board?.orders || [];

  const visibleRiders = useMemo(() => {
    if (!onlyAvailableRiders) return riders;
    return riders.filter((r) => r.status === 'On Duty' || r.status === 'In Zone');
  }, [riders, onlyAvailableRiders]);

  const queueOrders = useMemo(() => {
    const activeQueue = orders.filter((o) => !['Delivered', 'Canceled'].includes(o.status));
    if (queueTab === 'ready') return activeQueue.filter((o) => o.status === 'Ready');
    if (queueTab === 'scheduled') return activeQueue.filter((o) => o.status === 'Scheduled');
    if (queueTab === 'paused') return activeQueue.filter((o) => o.status === 'Paused');
    if (queueTab === 'late') return activeQueue.filter((o) => o.performance === 'LATE');
    return activeQueue;
  }, [orders, queueTab]);

  const toggleOrderSelect = (id: number) => {
    setSelectedOrderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderForm.customer_name.trim()) {
      showToast('Customer name is required', 'error');
      return;
    }
    try {
      const targetTeam = manualOrderForm.team_name || (selectedTeam !== 'all' ? selectedTeam : teams[0]?.name || 'فرع فيصل');
      const res = await fetch('/api/operations/live-dispatch/orders', {
        method: 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          ...manualOrderForm,
          team_name: targetTeam,
          store_name: targetTeam,
          is_manual: true
        })
      });
      if (!res.ok) throw new Error('Failed to create manual order');
      setIsManualOrderOpen(false);
      setManualOrderForm({
        order_number: '',
        customer_name: '',
        customer_mobile: '',
        customer_zone: '',
        address: '',
        amount: 0,
        payment_type: 'Cash',
        note: '',
        status: 'Ready',
        team_name: ''
      });
      showToast('Manual order saved to MySQL');
      fetchBoard();
    } catch (err: any) {
      showToast(err?.message || 'Error creating order', 'error');
    }
  };

  const handleAssignOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderIds.length || !assignRiderId) {
      showToast('Select orders and a rider first', 'error');
      return;
    }
    try {
      const res = await fetch('/api/operations/live-dispatch/orders/assign', {
        method: 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          order_ids: selectedOrderIds,
          rider_id: Number(assignRiderId),
          is_manual: true
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to assign orders');
      }
      setIsAssignModalOpen(false);
      setSelectedOrderIds([]);
      setAssignRiderId('');
      showToast('Orders assigned to rider & live trip updated');
      fetchBoard();
    } catch (err: any) {
      showToast(err?.message || 'Error assigning orders', 'error');
    }
  };

  const handleAdvanceOrderStatus = async (order: DispatchOrder, nextStatus: string) => {
    try {
      const res = await fetch(`/api/operations/live-dispatch/orders/${order.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          status: nextStatus,
          performance: nextStatus === 'Delivered' && order.performance === 'NOT_RATED' ? 'EXCELLENT' : order.performance
        })
      });
      if (!res.ok) throw new Error('Failed to update order status');
      showToast(`Order #${order.order_number} -> ${nextStatus}`);
      fetchBoard();
    } catch (err: any) {
      showToast(err?.message || 'Status update failed', 'error');
    }
  };

  const handleCompleteTrip = async (trip: DispatchTrip) => {
    try {
      const res = await fetch(`/api/operations/live-dispatch/trips/${trip.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          status: 'Completed',
          performance: trip.performance === 'NOT_RATED' ? 'EXCELLENT' : trip.performance
        })
      });
      if (!res.ok) throw new Error('Failed to complete trip');
      showToast(`Trip ${trip.trip_number} completed`);
      fetchBoard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to complete trip', 'error');
    }
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftRiderId) return;
    try {
      const res = await fetch('/api/operations/live-dispatch/shifts/start', {
        method: 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ rider_id: Number(shiftRiderId) })
      });
      if (!res.ok) throw new Error('Failed to start shift');
      setIsStartShiftOpen(false);
      setShiftRiderId('');
      showToast('Shift started & rider marked On Duty');
      fetchBoard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to start shift', 'error');
    }
  };

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = capacityTeamId || String(teams[0]?.id || '');
    if (!targetId) return;
    try {
      const res = await fetch(`/api/operations/live-dispatch/teams/${targetId}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ max_trip_capacity: capacityValue })
      });
      if (!res.ok) throw new Error('Failed to update capacity');
      setIsCapacityModalOpen(false);
      showToast('Max trip capacity updated in MySQL');
      fetchBoard();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update capacity', 'error');
    }
  };

  const nextOrderStep = (status: string): string | null => {
    if (status === 'On Trip' || status === 'Ready' || status === 'In Progress') return 'Picked-up';
    if (status === 'Picked-up') return 'Way To Customer';
    if (status === 'Way To Customer') return 'Delivered';
    return null;
  };

  const orderStatusBadgeStyle = (status: string) => {
    if (status === 'Delivered') return 'bg-emerald-600 text-white';
    if (status === 'Way To Customer') return 'bg-sky-600 text-white';
    if (status === 'Picked-up') return 'bg-purple-600 text-white';
    if (status === 'On Trip') return 'bg-blue-600 text-white';
    if (status === 'Ready') return 'bg-teal-600 text-white';
    if (status === 'Paused') return 'bg-slate-600 text-white';
    if (status === 'In Progress') return 'bg-amber-500 text-white';
    return 'bg-slate-200 text-slate-800';
  };

  return (
    <div className="space-y-4">
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

      {/* Top Controls Bar (matches screenshot #1) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search rider, trip, order..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-500"
            />
          </div>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="all">All Teams / الفروع ({teams.length})</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>{t.name} ({t.city})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showKpis}
              onChange={(e) => setShowKpis(e.target.checked)}
              className="accent-teal-600"
            />
            <span>KPIs</span>
          </label>
          <button
            type="button"
            onClick={fetchBoard}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Live KPIs Strip */}
      {showKpis && kpis && (
        <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-5 text-xs whitespace-nowrap tabular-nums">
            <div><span className="font-bold text-blue-700">{kpis.avgDeliveryMin} min</span> <span className="text-slate-500">Avg. Delivery</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-emerald-700">{kpis.excellentTasksPct}%</span> <span className="text-slate-500">Excellent Tasks</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-teal-700">{kpis.ridersPerformancePct}%</span> <span className="text-slate-500">Riders Perf.</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-slate-900">{kpis.totalOrders}</span> <span className="text-slate-500">Total Orders</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-rose-700">{kpis.abusedOrders}</span> <span className="text-slate-500">Abused ({kpis.abusedPct}%)</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-indigo-700">{kpis.automationPct}%</span> <span className="text-slate-500">Automation</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-purple-700">{kpis.scheduledCount}</span> <span className="text-slate-500">Scheduled</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-amber-700">{kpis.pendingCount}</span> <span className="text-slate-500">Pending</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-slate-700">{kpis.pausedCount}</span> <span className="text-slate-500">Paused</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-sky-700">{kpis.onTripsCount}</span> <span className="text-slate-500">On Trips</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-emerald-700">{kpis.deliveredCount}</span> <span className="text-slate-500">Delivered</span></div>
            <span className="text-slate-200">|</span>
            <div><span className="font-bold text-rose-700">{kpis.cancelledCount}</span> <span className="text-slate-500">Cancelled ({kpis.cancelledPct}%)</span></div>
          </div>
        </div>
      )}

      {/* Section 1: Riders Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-teal-600" />
              Riders
            </span>
            <span className="text-slate-500 tabular-nums">
              Total <strong className="text-slate-900">{kpis?.ridersTotal ?? 0}</strong> · On Duty <strong className="text-blue-700">{kpis?.ridersOnDuty ?? 0}</strong> · Available <strong className="text-emerald-700">{kpis?.ridersAvailable ?? 0}</strong> · Break <strong className="text-amber-700">{kpis?.ridersBreak ?? 0}</strong> · In Zone <strong className="text-teal-700">{kpis?.ridersInZone ?? 0}</strong> · No GPS <strong className="text-rose-700">{kpis?.ridersNoGps ?? 0}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyAvailableRiders}
                onChange={(e) => setOnlyAvailableRiders(e.target.checked)}
                className="accent-teal-600"
              />
              <span>On Duty only</span>
            </label>
            <button
              type="button"
              onClick={() => setIsStartShiftOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Play className="w-3 h-3" />
              <span>Start Shift</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/operations-hub/LiveDispatchSystem/Riders')}
              className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
            >
              All Riders
            </button>
            <button
              type="button"
              onClick={() => setShowRidersSection((v) => !v)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              {showRidersSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showRidersSection && (
          <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1">
            {visibleRiders.length === 0 ? (
              <div className="w-full py-4 text-center text-xs text-slate-400">
                No riders registered yet. Add riders from the Riders page or click Start Shift.
              </div>
            ) : (
              visibleRiders.map((rider) => (
                <div
                  key={rider.id}
                  onClick={() => {
                    if (selectedOrderIds.length > 0) {
                      setAssignRiderId(String(rider.id));
                      setIsAssignModalOpen(true);
                    }
                  }}
                  className={`min-w-[128px] max-w-[140px] border rounded-xl p-2.5 flex flex-col items-center text-center transition-colors ${
                    selectedOrderIds.length > 0 ? 'cursor-pointer hover:border-teal-500' : ''
                  } ${
                    rider.status === 'On Duty'
                      ? 'border-blue-200 bg-blue-50/30'
                      : rider.status === 'Hold'
                      ? 'border-rose-200 bg-rose-50/30'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-600 tabular-nums mb-1.5">
                    {rider.status} · {rider.active_orders_count || 0} ord
                  </div>
                  <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                    {rider.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-xs font-semibold text-slate-900 mt-1.5 truncate w-full">{rider.name}</div>
                  <div className="text-[10px] text-slate-500 truncate w-full">{rider.team_name}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Section 2: On Going Trips Horizontal Board */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
              <RouteIcon className="w-4 h-4 text-blue-600" />
              On Going Trips
            </span>
            <span className="text-slate-500 tabular-nums">
              Total Trips <strong className="text-slate-900">{ongoingTrips.length}</strong> · On Trip <strong className="text-blue-700">{kpis?.onTripOnlyCount ?? 0}</strong> · Picked <strong className="text-purple-700">{kpis?.pickedCount ?? 0}</strong> · Way To Customer <strong className="text-sky-700">{kpis?.wayToCustomerCount ?? 0}</strong> · Delivered <strong className="text-emerald-700">{kpis?.deliveredCount ?? 0}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const firstTeam = teams[0];
                if (firstTeam) {
                  setCapacityTeamId(String(firstTeam.id));
                  setCapacityValue(firstTeam.max_trip_capacity || 4);
                }
                setIsCapacityModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Max Trip Capacity</span>
            </button>
            <button
              type="button"
              onClick={() => setShowTripsSection((v) => !v)}
              className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              {showTripsSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showTripsSection && (
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            {ongoingTrips.length === 0 ? (
              <div className="w-full py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No ongoing trips right now. Select orders in the queue below and click <strong>Assign Orders</strong> to launch a live trip.
              </div>
            ) : (
              ongoingTrips.map((trip) => {
                const tripOrders = trip.orders || [];
                const deliveredInTrip = tripOrders.filter((o) => o.status === 'Delivered').length;
                return (
                  <div
                    key={trip.id}
                    className="min-w-[270px] max-w-[290px] bg-slate-50/70 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between shrink-0"
                  >
                    <div>
                      {/* Trip Card Header */}
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{trip.rider_name || 'Unassigned'}</div>
                          <div className="text-[11px] text-slate-500 truncate">{trip.team_name}</div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${
                            trip.status === 'Returning'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] py-2 text-slate-600 tabular-nums">
                        <span className="font-mono font-bold text-slate-800">{trip.trip_number}</span>
                        <span>{deliveredInTrip}/{tripOrders.length || trip.orders_count} orders</span>
                        <span className="font-mono text-slate-700">{formatElapsedFromIso(trip.started_at || trip.created_at)}</span>
                      </div>

                      {/* Trip Orders Stack */}
                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-0.5">
                        {tripOrders.length === 0 ? (
                          <div className="text-[11px] text-slate-400 text-center py-3">No orders linked</div>
                        ) : (
                          tripOrders.map((o) => {
                            const nextStep = nextOrderStep(o.status);
                            return (
                              <div key={o.id} className="bg-white border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                                <div className="flex items-center justify-between gap-1 text-[11px]">
                                  <span className="font-mono font-bold text-slate-900">#{o.order_number}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${orderStatusBadgeStyle(o.status)}`}>
                                    {o.status}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-slate-800 truncate">{o.customer_name}</span>
                                  <span className="font-bold tabular-nums text-slate-900">{o.amount} EGP</span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {o.customer_zone || o.address || '—'} · {o.payment_type}
                                </div>
                                {nextStep && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceOrderStatus(o, nextStep)}
                                    className="w-full mt-1 py-1 text-[10px] font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <span>Mark {nextStep}</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCompleteTrip(trip)}
                      className="mt-3 w-full py-1.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                    >
                      Complete Trip
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Section 3: Orders Queue Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl">
            {(
              [
                { id: 'all', label: `All Active (${orders.filter((o) => !['Delivered', 'Canceled'].includes(o.status)).length})` },
                { id: 'ready', label: `Ready (${orders.filter((o) => o.status === 'Ready').length})` },
                { id: 'scheduled', label: `Scheduled (${orders.filter((o) => o.status === 'Scheduled').length})` },
                { id: 'paused', label: `Paused (${orders.filter((o) => o.status === 'Paused').length})` },
                { id: 'late', label: `Late (${orders.filter((o) => o.performance === 'LATE' && !['Delivered', 'Canceled'].includes(o.status)).length})` }
              ] as { id: QueueTab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setQueueTab(t.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 cursor-pointer ${
                  queueTab === t.id ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/operations-hub/LiveDispatchSystem/orders/New')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manual Order</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!selectedOrderIds.length) {
                  showToast('Select at least one order from the table first', 'error');
                  return;
                }
                setIsAssignModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Assign Orders ({selectedOrderIds.length})</span>
            </button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-3 py-2.5 w-8">
                  <input
                    type="checkbox"
                    checked={queueOrders.length > 0 && selectedOrderIds.length === queueOrders.length}
                    onChange={(e) =>
                      setSelectedOrderIds(e.target.checked ? queueOrders.map((o) => o.id) : [])
                    }
                  />
                </th>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Actions</th>
                <th className="px-3 py-2.5">Order Number</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Elapsed</th>
                <th className="px-3 py-2.5">Store Name</th>
                <th className="px-3 py-2.5">Customer Zone</th>
                <th className="px-3 py-2.5">Customer Name</th>
                <th className="px-3 py-2.5 text-right">Balance Due</th>
                <th className="px-3 py-2.5">Pay Type</th>
                <th className="px-3 py-2.5">Address</th>
                <th className="px-3 py-2.5">Note</th>
                <th className="px-3 py-2.5">Vehicle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queueOrders.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-10 text-center text-slate-400">
                    No active orders in this queue. Click <strong>Manual Order</strong> to add one.
                  </td>
                </tr>
              ) : (
                queueOrders.map((o, idx) => (
                  <tr key={o.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(o.id)}
                        onChange={() => toggleOrderSelect(o.id)}
                      />
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleAdvanceOrderStatus(o, o.status === 'Paused' ? 'Ready' : 'Paused')
                          }
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer"
                          title={o.status === 'Paused' ? 'Resume to Ready' : 'Pause Order'}
                        >
                          {o.status === 'Paused' ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderIds([o.id]);
                            setIsAssignModalOpen(true);
                          }}
                          className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded hover:bg-blue-100 cursor-pointer"
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-blue-700">{o.order_number}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${orderStatusBadgeStyle(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatElapsedFromIso(o.created_at)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{o.store_name}</td>
                    <td className="px-3 py-2.5 text-slate-700">{o.customer_zone || '—'}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{o.customer_name}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{o.balance_due} EGP</td>
                    <td className="px-3 py-2.5 font-semibold text-emerald-700">{o.payment_type}</td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[240px] truncate">{o.address || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500 max-w-[180px] truncate">{o.note || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600">{o.vehicle_type}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Manual Order */}
      {isManualOrderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Create Manual Order</h3>
              <button type="button" onClick={() => setIsManualOrderOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateManualOrder} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Order Number</label>
                  <input
                    type="text"
                    value={manualOrderForm.order_number}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, order_number: e.target.value })}
                    placeholder="Auto"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Team / Branch</label>
                  <select
                    value={manualOrderForm.team_name || teams[0]?.name || ''}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, team_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={manualOrderForm.customer_name}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, customer_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Mobile</label>
                  <input
                    type="text"
                    value={manualOrderForm.customer_mobile}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, customer_mobile: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Zone</label>
                  <input
                    type="text"
                    value={manualOrderForm.customer_zone}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, customer_zone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Amount (EGP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualOrderForm.amount}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Address</label>
                <input
                  type="text"
                  value={manualOrderForm.address}
                  onChange={(e) => setManualOrderForm({ ...manualOrderForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Type</label>
                  <select
                    value={manualOrderForm.payment_type}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, payment_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Paid">Paid</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Note</label>
                  <input
                    type="text"
                    value={manualOrderForm.note}
                    onChange={(e) => setManualOrderForm({ ...manualOrderForm, note: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsManualOrderOpen(false)} className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 cursor-pointer">
                  Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Assign Orders to Rider */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Assign {selectedOrderIds.length} Order(s) to Rider</h3>
              <button type="button" onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAssignOrders} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Select Rider</label>
                <select
                  required
                  value={assignRiderId}
                  onChange={(e) => setAssignRiderId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">-- Choose Rider --</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} · {r.team_name} ({r.status} · {r.active_orders_count || 0} active)
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer">
                  Dispatch Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Start Shift */}
      {isStartShiftOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Start Rider Shift</h3>
              <button type="button" onClick={() => setIsStartShiftOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleStartShift} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Choose Rider</label>
                <select
                  required
                  value={shiftRiderId}
                  onChange={(e) => setShiftRiderId(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">-- Select Rider --</option>
                  {riders.map((r) => (
                    <option key={r.id} value={r.id}>{r.name} ({r.status})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsStartShiftOpen(false)} className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 cursor-pointer">
                  Start Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Max Trip Capacity */}
      {isCapacityModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Edit Max Trip Capacity</h3>
              <button type="button" onClick={() => setIsCapacityModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCapacity} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Team / Branch</label>
                <select
                  value={capacityTeamId}
                  onChange={(e) => {
                    setCapacityTeamId(e.target.value);
                    const found = teams.find((t) => String(t.id) === e.target.value);
                    if (found) setCapacityValue(found.max_trip_capacity || 4);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Orders Per Trip</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={capacityValue}
                  onChange={(e) => setCapacityValue(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsCapacityModalOpen(false)} className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 cursor-pointer">
                  Save Capacity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
