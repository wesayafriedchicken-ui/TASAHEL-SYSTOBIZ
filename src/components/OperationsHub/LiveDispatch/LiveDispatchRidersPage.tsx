import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  Archive,
  Clock,
  DollarSign,
  Plus,
  Download,
  Upload,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  RotateCcw,
  Bike,
  X,
  CheckCircle2,
  AlertCircle,
  Play,
  Square
} from 'lucide-react';
import {
  DispatchRider,
  DispatchTeam,
  DispatchProvider,
  DispatchShift,
  getDispatchAuthHeaders,
  formatShortDate,
  formatShortDateTime
} from './types';

type RiderSection =
  | 'profiles'
  | 'teams'
  | 'providers'
  | 'archive_reasons'
  | 'archived'
  | 'shifts'
  | 'revenue';

export function LiveDispatchRidersPage() {
  const [section, setSection] = useState<RiderSection>('profiles');
  const [riders, setRiders] = useState<DispatchRider[]>([]);
  const [archivedRiders, setArchivedRiders] = useState<DispatchRider[]>([]);
  const [teams, setTeams] = useState<DispatchTeam[]>([]);
  const [providers, setProviders] = useState<DispatchProvider[]>([]);
  const [shifts, setShifts] = useState<DispatchShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filters
  const [teamFilter, setTeamFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [riderSearch, setRiderSearch] = useState('');
  const [accFilter, setAccFilter] = useState('');

  // Modals
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<Partial<DispatchRider> | null>(null);
  const [saving, setSaving] = useState(false);

  const [newTeamForm, setNewTeamForm] = useState({ name: '', city: 'الجيزة', zone_coverage: '', store_code: '', max_trip_capacity: 4 });
  const [newProviderForm, setNewProviderForm] = useState({ name: '', contact_phone: '', commission_rate: 0 });
  const [archiveTarget, setArchiveTarget] = useState<DispatchRider | null>(null);
  const [archiveReason, setArchiveReason] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getDispatchAuthHeaders(false);
      const params = new URLSearchParams();
      params.set('archived', 'false');
      if (teamFilter !== 'all') params.set('team', teamFilter);
      if (zoneFilter !== 'all') params.set('zone', zoneFilter);
      if (riderSearch.trim()) params.set('rider', riderSearch.trim());
      if (accFilter.trim()) params.set('accNumber', accFilter.trim());

      const [rRes, archRes, tRes, pRes, sRes] = await Promise.all([
        fetch(`/api/operations/live-dispatch/riders?${params.toString()}`, { headers }),
        fetch('/api/operations/live-dispatch/riders?archived=true', { headers }),
        fetch('/api/operations/live-dispatch/teams', { headers }),
        fetch('/api/operations/live-dispatch/providers', { headers }),
        fetch('/api/operations/live-dispatch/shifts', { headers })
      ]);

      if (rRes.ok) setRiders(await rRes.json());
      if (archRes.ok) setArchivedRiders(await archRes.json());
      if (tRes.ok) setTeams(await tRes.json());
      if (pRes.ok) setProviders(await pRes.json());
      if (sRes.ok) setShifts(await sRes.json());
    } catch (err: any) {
      showToast(err?.message || 'Error loading riders data', 'error');
    } finally {
      setLoading(false);
    }
  }, [teamFilter, zoneFilter, riderSearch, accFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const distinctZones = useMemo(
    () => Array.from(new Set(riders.map((r) => r.zone_coverage).filter(Boolean))),
    [riders]
  );

  const archiveReasonGroups = useMemo(() => {
    const map = new Map<string, number>();
    archivedRiders.forEach((r) => {
      const reason = r.archive_reason || 'Unspecified';
      map.set(reason, (map.get(reason) || 0) + 1);
    });
    return Array.from(map.entries()).map(([reason, count]) => ({ reason, count }));
  }, [archivedRiders]);

  const openCreateRider = () => {
    setEditingRider({
      enroll_id: '',
      name: '',
      team_name: teams[0]?.name || 'فرع فيصل',
      provider_name: providers[0]?.name || 'Wesaya',
      mobile_number: '',
      acc_number: '',
      status: 'On Duty',
      logged_in: true,
      on_demand: false,
      rating: 0,
      app_version: '2026.10.03',
      device_type: 'android',
      bundle_name: '',
      national_id: '',
      vehicle_type: 'Motorcycle',
      zone_coverage: 'فيصل - الهرم',
      hiring_date: new Date().toISOString().slice(0, 10),
      expiration_iqama_date: ''
    });
    setIsRiderModalOpen(true);
  };

  const handleSaveRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRider?.name?.trim()) {
      showToast('Rider name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingRider.id);
      const url = isEdit
        ? `/api/operations/live-dispatch/riders/${editingRider.id}`
        : '/api/operations/live-dispatch/riders';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(editingRider)
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save rider');
      }
      setIsRiderModalOpen(false);
      setEditingRider(null);
      showToast(isEdit ? 'Rider updated in MySQL' : 'Rider created in MySQL');
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Error saving rider', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDuty = async (rider: DispatchRider) => {
    const nextStatus = rider.status === 'On Duty' ? 'Off Duty' : 'On Duty';
    try {
      const res = await fetch(`/api/operations/live-dispatch/riders/${rider.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      showToast(`${rider.name} -> ${nextStatus}`);
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Status toggle failed', 'error');
    }
  };

  const handleArchiveRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveTarget) return;
    try {
      const res = await fetch(`/api/operations/live-dispatch/riders/${archiveTarget.id}/archive`, {
        method: 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ archive_reason: archiveReason || 'Archived by operations' })
      });
      if (!res.ok) throw new Error('Archive failed');
      setArchiveTarget(null);
      setArchiveReason('');
      showToast('Rider archived');
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Failed to archive rider', 'error');
    }
  };

  const handleRestoreRider = async (id: number) => {
    try {
      const res = await fetch(`/api/operations/live-dispatch/riders/${id}/restore`, {
        method: 'POST',
        headers: getDispatchAuthHeaders(true)
      });
      if (!res.ok) throw new Error('Restore failed');
      showToast('Rider restored to active profiles');
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Restore failed', 'error');
    }
  };

  const handleDeleteRider = async (id: number) => {
    try {
      const res = await fetch(`/api/operations/live-dispatch/riders/${id}`, {
        method: 'DELETE',
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Delete failed');
      showToast('Rider deleted');
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Delete failed', 'error');
    }
  };

  const handleExportExcel = async () => {
    try {
      const res = await fetch('/api/operations/live-dispatch/riders/export', {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dispatch-riders-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Riders Excel report downloaded');
    } catch (err: any) {
      showToast(err?.message || 'Export failed', 'error');
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/operations/live-dispatch/riders/import', {
        method: 'POST',
        headers: getDispatchAuthHeaders(false),
        body: fd
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Import failed');
      showToast(`Imported ${data.inserted || 0} rider(s) into MySQL`);
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Excel import failed', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamForm.name.trim()) return;
    try {
      const res = await fetch('/api/operations/live-dispatch/teams', {
        method: 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(newTeamForm)
      });
      if (!res.ok) throw new Error('Failed to create team');
      setNewTeamForm({ name: '', city: 'الجيزة', zone_coverage: '', store_code: '', max_trip_capacity: 4 });
      showToast('Team added to MySQL');
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Error creating team', 'error');
    }
  };

  const handleCreateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderForm.name.trim()) return;
    try {
      const res = await fetch('/api/operations/live-dispatch/providers', {
        method: 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(newProviderForm)
      });
      if (!res.ok) throw new Error('Failed to create provider');
      setNewProviderForm({ name: '', contact_phone: '', commission_rate: 0 });
      showToast('Provider added to MySQL');
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Error creating provider', 'error');
    }
  };

  const handleStartRiderShift = async (riderId: number) => {
    try {
      const res = await fetch('/api/operations/live-dispatch/shifts/start', {
        method: 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ rider_id: riderId })
      });
      if (!res.ok) throw new Error('Failed to start shift');
      showToast('Shift started');
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Failed to start shift', 'error');
    }
  };

  const handleEndShift = async (shiftId: number) => {
    try {
      const res = await fetch(`/api/operations/live-dispatch/shifts/${shiftId}/end`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({})
      });
      if (!res.ok) throw new Error('Failed to end shift');
      showToast('Shift completed');
      fetchAll();
    } catch (err: any) {
      showToast(err?.message || 'Failed to end shift', 'error');
    }
  };

  const sidebarItems: { id: RiderSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'teams', label: 'Teams', icon: Building2 },
    { id: 'providers', label: 'Providers', icon: Briefcase },
    { id: 'archive_reasons', label: 'Archive Reasons', icon: FileText },
    { id: 'archived', label: 'Archived Riders', icon: Archive },
    { id: 'shifts', label: 'Actual Shifts', icon: Clock },
    { id: 'revenue', label: 'Accounting Revenue', icon: DollarSign }
  ];

  const cardStatusBorder = (status: string) => {
    if (status === 'On Duty' || status === 'In Zone') return 'border-blue-400';
    if (status === 'Break') return 'border-amber-400';
    return 'border-rose-300';
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

      {/* Hidden Excel Import Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleImportExcel}
        className="hidden"
      />

      {/* Left Sidebar (matches screenshot #4) */}
      <aside className="w-full lg:w-52 shrink-0 bg-white border border-slate-200 rounded-2xl p-3 self-start">
        <div className="px-2 py-2 text-xs font-bold text-slate-900 border-b border-slate-100 mb-2">
          Riders
        </div>
        <div className="flex lg:flex-col gap-1 overflow-x-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        {/* Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Riders / {sidebarItems.find((s) => s.id === section)?.label}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
              {riders.length} active riders · {archivedRiders.length} archived · {teams.length} teams
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openCreateRider}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Data</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: PROFILES GRID (matches screenshot #4) */}
        {section === 'profiles' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              >
                <option value="all">Select Team: All</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>

              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              >
                <option value="all">Zone Coverage: All</option>
                {distinctZones.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={riderSearch}
                  onChange={(e) => setRiderSearch(e.target.value)}
                  placeholder="Rider Name"
                  className="w-full pl-8 pr-2.5 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <input
                type="text"
                value={accFilter}
                onChange={(e) => setAccFilter(e.target.value)}
                placeholder="Enter Account / Enroll ID"
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />

              <button
                type="button"
                onClick={fetchAll}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Apply Search</span>
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading rider profiles...</div>
            ) : riders.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                <div className="text-xs font-medium text-slate-500">No riders found in MySQL database.</div>
                <button
                  type="button"
                  onClick={openCreateRider}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Rider</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                {riders.map((rider) => (
                  <div
                    key={rider.id}
                    className={`bg-white border ${cardStatusBorder(rider.status)} rounded-2xl p-3.5 flex flex-col justify-between text-xs`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {rider.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{rider.name}</div>
                            <div className="text-[11px] text-slate-500 truncate">{rider.team_name}</div>
                            <div className="text-[10px] text-amber-500 tabular-nums">
                              {Number(rider.rating || 0).toFixed(1)} ★
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRider({ ...rider });
                              setIsRiderModalOpen(true);
                            }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-teal-700 cursor-pointer"
                            title="Edit Rider"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setArchiveTarget(rider)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-amber-700 cursor-pointer"
                            title="Archive Rider"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRider(rider.id)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-rose-700 cursor-pointer"
                            title="Delete Rider"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Status & Meta */}
                      <div className="py-2 border-b border-slate-100 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="text-slate-500">Status </span>
                          <span
                            className={`font-bold ${
                              rider.status === 'On Duty'
                                ? 'text-blue-700'
                                : rider.status === 'Break'
                                ? 'text-amber-700'
                                : 'text-rose-600'
                            }`}
                          >
                            {rider.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Logged in: </span>
                          <span className={rider.logged_in ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                            {rider.logged_in ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      {/* Exact Key-Value Profile Rows matching screenshot #4 */}
                      <dl className="mt-2 space-y-1 text-[11px] tabular-nums">
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">On Demand:</dt><dd className="text-slate-800 font-medium">{rider.on_demand ? 'Yes' : 'No'}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">Enroll ID:</dt><dd className="text-slate-800 font-medium">{rider.enroll_id || rider.id}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">Mobile Number:</dt><dd className="text-slate-800 font-medium">{rider.mobile_number || '—'}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">Acc Number:</dt><dd className="text-slate-800 font-medium">{rider.acc_number || '—'}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">App Version:</dt><dd className="text-slate-800">{rider.app_version || '—'}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">Device Type:</dt><dd className="text-slate-800">{rider.device_type || 'android'}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">Provider:</dt><dd className="text-slate-800">{rider.provider_name || '—'}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">National ID / SSN:</dt><dd className="text-slate-800 truncate max-w-[120px]">{rider.national_id || '—'}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">Vehicle Type:</dt><dd className="text-slate-800 inline-flex items-center gap-1"><Bike className="w-3 h-3 text-teal-600" /> {rider.vehicle_type || 'Motorcycle'}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">Hiring Date:</dt><dd className="text-slate-800">{formatShortDate(rider.hiring_date)}</dd></div>
                        <div className="flex justify-between gap-2"><dt className="text-slate-500">Expiration Iqama:</dt><dd className="text-slate-800">{formatShortDate(rider.expiration_iqama_date)}</dd></div>
                      </dl>
                    </div>

                    {/* Quick Duty Toggle & Start Shift */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleDuty(rider)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          rider.status === 'On Duty'
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {rider.status === 'On Duty' ? 'Set Off Duty' : 'Set On Duty'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartRiderShift(rider.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer"
                        title="Start Shift"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* SECTION 2: TEAMS */}
        {section === 'teams' && (
          <div className="space-y-4">
            <form onSubmit={handleCreateTeam} className="grid grid-cols-1 sm:grid-cols-6 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <input
                type="text"
                required
                placeholder="Team / Branch Name *"
                value={newTeamForm.name}
                onChange={(e) => setNewTeamForm({ ...newTeamForm, name: e.target.value })}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="City"
                value={newTeamForm.city}
                onChange={(e) => setNewTeamForm({ ...newTeamForm, city: e.target.value })}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Zone Coverage"
                value={newTeamForm.zone_coverage}
                onChange={(e) => setNewTeamForm({ ...newTeamForm, zone_coverage: e.target.value })}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Store Code"
                value={newTeamForm.store_code}
                onChange={(e) => setNewTeamForm({ ...newTeamForm, store_code: e.target.value })}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <input
                type="number"
                min={1}
                placeholder="Max Trip Cap"
                value={newTeamForm.max_trip_capacity}
                onChange={(e) => setNewTeamForm({ ...newTeamForm, max_trip_capacity: Number(e.target.value) })}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl tabular-nums"
              />
              <button type="submit" className="px-3 py-2 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 cursor-pointer">
                Add Team
              </button>
            </form>

            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Team Name</th>
                    <th className="px-3 py-2.5">City</th>
                    <th className="px-3 py-2.5">Zone Coverage</th>
                    <th className="px-3 py-2.5">Store Code</th>
                    <th className="px-3 py-2.5 text-right">Max Trip Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teams.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{t.name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{t.city}</td>
                      <td className="px-3 py-2.5 text-slate-600">{t.zone_coverage || '—'}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">{t.store_code || '—'}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{t.max_trip_capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: PROVIDERS */}
        {section === 'providers' && (
          <div className="space-y-4">
            <form onSubmit={handleCreateProvider} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <input
                type="text"
                required
                placeholder="Provider Name *"
                value={newProviderForm.name}
                onChange={(e) => setNewProviderForm({ ...newProviderForm, name: e.target.value })}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <input
                type="text"
                placeholder="Contact Phone"
                value={newProviderForm.contact_phone}
                onChange={(e) => setNewProviderForm({ ...newProviderForm, contact_phone: e.target.value })}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Commission %"
                value={newProviderForm.commission_rate}
                onChange={(e) => setNewProviderForm({ ...newProviderForm, commission_rate: Number(e.target.value) })}
                className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl tabular-nums"
              />
              <button type="submit" className="px-3 py-2 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 cursor-pointer">
                Add Provider
              </button>
            </form>

            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Provider</th>
                    <th className="px-3 py-2.5">Contact Phone</th>
                    <th className="px-3 py-2.5 text-right">Commission Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {providers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{p.name}</td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-600">{p.contact_phone || '—'}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{p.commission_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 4: ARCHIVE REASONS */}
        {section === 'archive_reasons' && (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Archive Reason</th>
                  <th className="px-3 py-2.5 text-right">Archived Riders Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {archiveReasonGroups.length === 0 ? (
                  <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400">No archived riders yet.</td></tr>
                ) : (
                  archiveReasonGroups.map((g) => (
                    <tr key={g.reason}>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{g.reason}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-bold">{g.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SECTION 5: ARCHIVED RIDERS */}
        {section === 'archived' && (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Rider Name</th>
                  <th className="px-3 py-2.5">Team</th>
                  <th className="px-3 py-2.5">Mobile</th>
                  <th className="px-3 py-2.5">Archive Reason</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {archivedRiders.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No archived riders.</td></tr>
                ) : (
                  archivedRiders.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{r.name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.team_name}</td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-600">{r.mobile_number}</td>
                      <td className="px-3 py-2.5 text-slate-600">{r.archive_reason || '—'}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleRestoreRider(r.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SECTION 6: ACTUAL SHIFTS */}
        {section === 'shifts' && (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Rider</th>
                  <th className="px-3 py-2.5">Team</th>
                  <th className="px-3 py-2.5">Shift Date</th>
                  <th className="px-3 py-2.5">Started At</th>
                  <th className="px-3 py-2.5">Ended At</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No shifts recorded yet. Start a shift from Rider Profiles or Dispatch Board.</td></tr>
                ) : (
                  shifts.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{s.rider_name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{s.team_name}</td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-600">{formatShortDate(s.shift_date)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-600">{formatShortDateTime(s.started_at)}</td>
                      <td className="px-3 py-2.5 tabular-nums text-slate-600">{formatShortDateTime(s.ended_at)}</td>
                      <td className="px-3 py-2.5 font-semibold text-teal-700">{s.status}</td>
                      <td className="px-3 py-2.5 text-right">
                        {s.status === 'Active' && (
                          <button
                            type="button"
                            onClick={() => handleEndShift(s.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold cursor-pointer"
                          >
                            <Square className="w-3 h-3" />
                            <span>End Shift</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* SECTION 7: ACCOUNTING REVENUE */}
        {section === 'revenue' && (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Rider</th>
                  <th className="px-3 py-2.5">Team</th>
                  <th className="px-3 py-2.5 text-right">Shifts Logged</th>
                  <th className="px-3 py-2.5 text-right">Orders Completed</th>
                  <th className="px-3 py-2.5 text-right">Cash Collected (EGP)</th>
                  <th className="px-3 py-2.5 text-right">Total Revenue (EGP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shifts.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No shift revenue logged yet.</td></tr>
                ) : (
                  shifts.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">{s.rider_name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{s.team_name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">1</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{s.orders_completed || 0}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{Number(s.cash_collected || 0).toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-bold text-emerald-700">{Number(s.revenue_total || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Rider Modal */}
      {isRiderModalOpen && editingRider && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRider.id ? `Edit Rider: ${editingRider.name}` : 'Create New Rider Profile'}
              </h3>
              <button type="button" onClick={() => setIsRiderModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveRider} className="p-5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rider Name *</label>
                  <input
                    type="text"
                    required
                    value={editingRider.name || ''}
                    onChange={(e) => setEditingRider({ ...editingRider, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Enroll ID</label>
                  <input
                    type="text"
                    value={editingRider.enroll_id || ''}
                    onChange={(e) => setEditingRider({ ...editingRider, enroll_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editingRider.mobile_number || ''}
                    onChange={(e) => setEditingRider({ ...editingRider, mobile_number: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Team / Branch</label>
                  <select
                    value={editingRider.team_name || ''}
                    onChange={(e) => setEditingRider({ ...editingRider, team_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Provider</label>
                  <select
                    value={editingRider.provider_name || ''}
                    onChange={(e) => setEditingRider({ ...editingRider, provider_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    {providers.map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={editingRider.status || 'Off Duty'}
                    onChange={(e) => setEditingRider({ ...editingRider, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="On Duty">On Duty</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Break">Break</option>
                    <option value="In Zone">In Zone</option>
                    <option value="Hold">Hold</option>
                    <option value="No GPS">No GPS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={editingRider.acc_number || ''}
                    onChange={(e) => setEditingRider({ ...editingRider, acc_number: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">National ID / SSN</label>
                  <input
                    type="text"
                    value={editingRider.national_id || ''}
                    onChange={(e) => setEditingRider({ ...editingRider, national_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Vehicle Type</label>
                  <select
                    value={editingRider.vehicle_type || 'Motorcycle'}
                    onChange={(e) => setEditingRider({ ...editingRider, vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Car">Car</option>
                    <option value="Van">Van</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Device Type</label>
                  <select
                    value={editingRider.device_type || 'android'}
                    onChange={(e) => setEditingRider({ ...editingRider, device_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="android">android</option>
                    <option value="IOS">IOS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">App Version</label>
                  <input
                    type="text"
                    value={editingRider.app_version || ''}
                    onChange={(e) => setEditingRider({ ...editingRider, app_version: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hiring Date</label>
                  <input
                    type="date"
                    value={formatShortDate(editingRider.hiring_date) === '—' ? '' : formatShortDate(editingRider.hiring_date)}
                    onChange={(e) => setEditingRider({ ...editingRider, hiring_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Expiration Iqama Date</label>
                  <input
                    type="date"
                    value={formatShortDate(editingRider.expiration_iqama_date) === '—' ? '' : formatShortDate(editingRider.expiration_iqama_date)}
                    onChange={(e) => setEditingRider({ ...editingRider, expiration_iqama_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Zone Coverage</label>
                  <input
                    type="text"
                    value={editingRider.zone_coverage || ''}
                    onChange={(e) => setEditingRider({ ...editingRider, zone_coverage: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex items-end gap-4 pb-2">
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingRider.logged_in)}
                      onChange={(e) => setEditingRider({ ...editingRider, logged_in: e.target.checked })}
                    />
                    <span>Logged In</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingRider.on_demand)}
                      onChange={(e) => setEditingRider({ ...editingRider, on_demand: e.target.checked })}
                    />
                    <span>On Demand</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setIsRiderModalOpen(false)} className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 cursor-pointer">
                  {saving ? 'Saving...' : 'Save Rider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Rider Modal */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Archive Rider: {archiveTarget.name}</h3>
              <button type="button" onClick={() => setArchiveTarget(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleArchiveRider} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Archive Reason</label>
                <input
                  type="text"
                  required
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  placeholder="e.g. Resigned, Inactive, Contract Ended"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setArchiveTarget(null)} className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 cursor-pointer">
                  Archive Rider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
