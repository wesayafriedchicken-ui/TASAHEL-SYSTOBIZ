import React, { useEffect, useState, useCallback } from 'react';
import {
  Route as RouteIcon,
  Download,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  DispatchTrip,
  DispatchTeam,
  DispatchRider,
  DispatchTripType,
  getDispatchAuthHeaders,
  formatDurationMMSS,
  formatShortDateTime
} from './types';

export function LiveDispatchTripsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'uncompleted'>('all');
  const [trips, setTrips] = useState<DispatchTrip[]>([]);
  const [teams, setTeams] = useState<DispatchTeam[]>([]);
  const [riders, setRiders] = useState<DispatchRider[]>([]);
  const [tripTypes, setTripTypes] = useState<DispatchTripType[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [teamFilter, setTeamFilter] = useState('all');
  const [tripTypeFilter, setTripTypeFilter] = useState('all');
  const [tripNumberFilter, setTripNumberFilter] = useState('');
  const [riderFilter, setRiderFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [manualFilter, setManualFilter] = useState('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Partial<DispatchTrip> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRefs = useCallback(async () => {
    try {
      const headers = getDispatchAuthHeaders(false);
      const [tRes, rRes, ttRes] = await Promise.all([
        fetch('/api/operations/live-dispatch/teams', { headers }),
        fetch('/api/operations/live-dispatch/riders?archived=false', { headers }),
        fetch('/api/operations/live-dispatch/settings/trip-types?status=active', { headers })
      ]);
      if (tRes.ok) setTeams(await tRes.json());
      if (rRes.ok) setRiders(await rRes.json());
      if (ttRes.ok) {
        const ttData = await ttRes.json();
        setTripTypes(Array.isArray(ttData) ? ttData : []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'uncompleted') params.set('tab', 'uncompleted');
      if (teamFilter !== 'all') params.set('team', teamFilter);
      if (tripTypeFilter !== 'all') params.set('tripType', tripTypeFilter);
      if (tripNumberFilter.trim()) params.set('tripNumber', tripNumberFilter.trim());
      if (riderFilter !== 'all') params.set('rider', riderFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (manualFilter !== 'all') params.set('manual', manualFilter);

      const res = await fetch(`/api/operations/live-dispatch/trips?${params.toString()}`, {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to load trips');
      const data = await res.json();
      setTrips(Array.isArray(data) ? data : []);
    } catch (err: any) {
      showToast(err?.message || 'Error loading trips', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, teamFilter, tripTypeFilter, tripNumberFilter, riderFilter, statusFilter, manualFilter]);

  useEffect(() => {
    fetchRefs();
  }, [fetchRefs]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const openCreateModal = () => {
    const defaultType = tripTypes[0];
    setEditingTrip({
      trip_number: '',
      trip_type: defaultType?.name || '',
      team_name: teams[0]?.name || 'فرع فيصل',
      rider_id: riders[0]?.id || null,
      rider_name: riders[0]?.name || '',
      status: 'Running',
      performance: 'NOT_RATED',
      is_manual: true,
      orders_count: 1,
      expecting_duration_min: 25,
      trip_duration_min: 0,
      trip_distance_km: 0,
      returning_duration_min: 0,
      estimate_returning_min: 5,
      planned_return_distance_km: 0,
      total_amount: 0,
      delivery_zone_extra_fees: defaultType?.base_fee || 0,
      live_location_percentage: 100
    });
    setIsModalOpen(true);
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;
    setSaving(true);
    try {
      const isEdit = Boolean(editingTrip.id);
      const url = isEdit
        ? `/api/operations/live-dispatch/trips/${editingTrip.id}`
        : '/api/operations/live-dispatch/trips';
      const selectedRider = riders.find((r) => Number(r.id) === Number(editingTrip.rider_id));
      const payload = {
        ...editingTrip,
        rider_name: selectedRider ? selectedRider.name : editingTrip.rider_name || ''
      };
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to save trip');
      setIsModalOpen(false);
      setEditingTrip(null);
      showToast(isEdit ? 'Trip updated in MySQL' : 'Trip created in MySQL');
      fetchTrips();
    } catch (err: any) {
      showToast(err?.message || 'Error saving trip', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrip = async (id: number) => {
    try {
      const res = await fetch(`/api/operations/live-dispatch/trips/${id}`, {
        method: 'DELETE',
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Trip deleted');
      fetchTrips();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete trip', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/operations/live-dispatch/trips/export', {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `live-dispatch-trips-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Trips Excel report downloaded');
    } catch (err: any) {
      showToast(err?.message || 'Failed to export trips', 'error');
    }
  };

  const perfStyle = (p?: string) => {
    if (p === 'EXCELLENT') return 'text-emerald-700 font-bold';
    if (p === 'GOOD') return 'text-blue-700 font-bold';
    if (p === 'LATE') return 'text-rose-700 font-bold';
    return 'text-slate-400';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
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

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <RouteIcon className="w-5 h-5 text-teal-600" />
          <div>
            <h2 className="text-base font-bold text-slate-900">Trips · إدارة الرحلات</h2>
            <p className="text-xs text-slate-500 tabular-nums">{trips.length} trips in MySQL database</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Trip</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Tabs matching screenshot #3 */}
      <div className="border-b border-slate-200 flex items-center gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'all' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Trips ({trips.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('uncompleted')}
          className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'uncompleted' ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Uncompleted / Cancelled
        </button>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
        >
          <option value="all">Team: All</option>
          {teams.map((t) => (
            <option key={t.id} value={t.name}>{t.name}</option>
          ))}
        </select>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={tripNumberFilter}
            onChange={(e) => setTripNumberFilter(e.target.value)}
            placeholder="Enter Trip Number"
            className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-200 rounded-xl"
          />
        </div>

        <select
          value={riderFilter}
          onChange={(e) => setRiderFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
        >
          <option value="all">Rider Name: All</option>
          {riders.map((r) => (
            <option key={r.id} value={r.name}>{r.name}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
        >
          <option value="all">Trip Status: All</option>
          <option value="Running">Running</option>
          <option value="Returning">Returning</option>
          <option value="Completed">Completed</option>
          <option value="Canceled">Canceled</option>
        </select>

        <select
          value={manualFilter}
          onChange={(e) => setManualFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
        >
          <option value="all">Manual Trip: All</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>

        <select
          value={tripTypeFilter}
          onChange={(e) => setTripTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
        >
          <option value="all">Trip Type: All</option>
          {tripTypes.map((tt) => (
            <option key={tt.id} value={tt.name}>
              {tt.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={fetchTrips}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Apply Search</span>
          </button>
        </div>
      </div>

      {/* High-Density Trips Table matching screenshot #3 */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-xs text-left whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
            <tr>
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Trip Number</th>
              <th className="px-3 py-2.5">Trip Type</th>
              <th className="px-3 py-2.5">Team Name</th>
              <th className="px-3 py-2.5">Rider Name</th>
              <th className="px-3 py-2.5 text-right">Orders Count</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Trip Performance</th>
              <th className="px-3 py-2.5">Manual Trip</th>
              <th className="px-3 py-2.5 text-right">Expecting Duration</th>
              <th className="px-3 py-2.5 text-right">Trip Duration</th>
              <th className="px-3 py-2.5 text-right">Trip Distance</th>
              <th className="px-3 py-2.5 text-right">Returning Duration</th>
              <th className="px-3 py-2.5 text-right">Est. Returning (min)</th>
              <th className="px-3 py-2.5 text-right">Planned Return Dist.</th>
              <th className="px-3 py-2.5 text-right">Trip Total Amount</th>
              <th className="px-3 py-2.5 text-right">Extra Fees</th>
              <th className="px-3 py-2.5 text-right">Live Location %</th>
              <th className="px-3 py-2.5">Create Date</th>
              <th className="px-3 py-2.5">Complete Date</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={21} className="px-4 py-10 text-center text-slate-400">
                  Loading trips from database...
                </td>
              </tr>
            ) : trips.length === 0 ? (
              <tr>
                <td colSpan={21} className="px-4 py-12 text-center">
                  <div className="text-slate-500 font-medium">No trips recorded yet.</div>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create First Trip</span>
                  </button>
                </td>
              </tr>
            ) : (
              trips.map((trip, idx) => (
                <tr key={trip.id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2.5 tabular-nums text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-blue-700">{trip.trip_number}</td>
                  <td className="px-3 py-2.5 font-medium text-teal-700">{trip.trip_type || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-700">{trip.team_name}</td>
                  <td className="px-3 py-2.5 text-blue-700 font-medium">{trip.rider_name || '—'}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{trip.orders_count}</td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{trip.status}</td>
                  <td className={`px-3 py-2.5 ${perfStyle(trip.performance)}`}>{trip.performance || 'NOT_RATED'}</td>
                  <td className="px-3 py-2.5 text-slate-600">{trip.is_manual ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                    {trip.expecting_duration_min ? formatDurationMMSS(trip.expecting_duration_min) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-800 font-medium">
                    {formatDurationMMSS(trip.trip_duration_min)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{Number(trip.trip_distance_km || 0)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                    {formatDurationMMSS(trip.returning_duration_min)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                    {trip.estimate_returning_min ? `${trip.estimate_returning_min} min` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                    {trip.planned_return_distance_km ? Number(trip.planned_return_distance_km) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900">
                    {Number(trip.total_amount || 0)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                    {Number(trip.delivery_zone_extra_fees || 0)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                    {Number(trip.live_location_percentage ?? 100)}%
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-600">{formatShortDateTime(trip.created_at)}</td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-600">{formatShortDateTime(trip.completed_at)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTrip({ ...trip });
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                        title="Edit Trip"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        title="Delete Trip"
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

      {/* Create / Edit Trip Modal */}
      {isModalOpen && editingTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTrip.id ? `Edit Trip ${editingTrip.trip_number}` : 'Create New Trip'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTrip} className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trip Number</label>
                  <input
                    type="text"
                    value={editingTrip.trip_number || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, trip_number: e.target.value })}
                    placeholder="Auto-generated"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trip Type</label>
                  <select
                    value={editingTrip.trip_type || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = tripTypes.find((tt) => tt.name === val);
                      setEditingTrip({
                        ...editingTrip,
                        trip_type: val,
                        ...(!editingTrip.id && matched && matched.base_fee > 0
                          ? { delivery_zone_extra_fees: matched.base_fee }
                          : {})
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">Select Trip Type</option>
                    {editingTrip.trip_type &&
                      !tripTypes.some((tt) => tt.name === editingTrip.trip_type) && (
                        <option value={editingTrip.trip_type}>{editingTrip.trip_type}</option>
                      )}
                    {tripTypes.map((tt) => (
                      <option key={tt.id} value={tt.name}>
                        {tt.code ? `${tt.name} (${tt.code})` : tt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Team Name</label>
                  <select
                    value={editingTrip.team_name || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, team_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rider</label>
                  <select
                    value={editingTrip.rider_id || ''}
                    onChange={(e) => setEditingTrip({ ...editingTrip, rider_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">Unassigned</option>
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={editingTrip.status || 'Running'}
                    onChange={(e) => setEditingTrip({ ...editingTrip, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Running">Running</option>
                    <option value="Returning">Returning</option>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Performance</label>
                  <select
                    value={editingTrip.performance || 'NOT_RATED'}
                    onChange={(e) => setEditingTrip({ ...editingTrip, performance: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="NOT_RATED">NOT_RATED</option>
                    <option value="EXCELLENT">EXCELLENT</option>
                    <option value="GOOD">GOOD</option>
                    <option value="LATE">LATE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Orders Count</label>
                  <input
                    type="number"
                    value={editingTrip.orders_count ?? 0}
                    onChange={(e) => setEditingTrip({ ...editingTrip, orders_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trip Duration (min)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingTrip.trip_duration_min ?? 0}
                    onChange={(e) => setEditingTrip({ ...editingTrip, trip_duration_min: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTrip.trip_distance_km ?? 0}
                    onChange={(e) => setEditingTrip({ ...editingTrip, trip_distance_km: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Amount (EGP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTrip.total_amount ?? 0}
                    onChange={(e) => setEditingTrip({ ...editingTrip, total_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Extra Fees</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTrip.delivery_zone_extra_fees ?? 0}
                    onChange={(e) => setEditingTrip({ ...editingTrip, delivery_zone_extra_fees: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Live Location %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingTrip.live_location_percentage ?? 100}
                    onChange={(e) => setEditingTrip({ ...editingTrip, live_location_percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 cursor-pointer">
                  {saving ? 'Saving...' : 'Save Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
