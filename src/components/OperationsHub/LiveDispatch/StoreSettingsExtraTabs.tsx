import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileX2,
  CalendarClock,
  PauseCircle,
  Ban,
  TimerOff,
  Trash2,
  Coffee,
  Plus,
  Search,
  Edit2,
  X,
  RefreshCw,
  SlidersHorizontal,
  Coins,
  ArrowUpDown,
  RotateCcw,
  Tags
} from 'lucide-react';
import {
  DispatchReason,
  DispatchReasonCategory,
  DispatchRiderRevenueRule,
  DispatchTripType,
  getDispatchAuthHeaders
} from './types';

interface NotifyProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
}

/* ========================================================================= */
/* 1. REASONS SETTINGS SECTION (7 stacked panels matching screenshot)        */
/* ========================================================================= */

interface ReasonCategoryMeta {
  key: DispatchReasonCategory;
  title: string;
  hasTypeColumn?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

const REASON_CATEGORIES: ReasonCategoryMeta[] = [
  { key: 'cancellation', title: 'Cancellation Reasons', icon: FileX2 },
  { key: 'schedule', title: 'Schedule Reasons', icon: CalendarClock },
  { key: 'pause', title: 'Pause Reasons', icon: PauseCircle },
  { key: 'cancel_shift', title: 'Cancel Shift', icon: Ban },
  { key: 'end_shift', title: 'End Shift', hasTypeColumn: true, icon: TimerOff },
  { key: 'remove_from_trip', title: 'Remove From Trip', icon: Trash2 },
  { key: 'break', title: 'Break Reasons', icon: Coffee }
];

const END_SHIFT_TYPES = ['Normal', 'Voluntary', 'Forced', 'Emergency', 'System'];

export function ReasonsSettingsSection({ onNotify }: NotifyProps) {
  const [reasons, setReasons] = useState<DispatchReason[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-section filter & pagination state
  const [statusDraft, setStatusDraft] = useState<Record<string, 'all' | 'active' | 'inactive'>>({});
  const [appliedStatus, setAppliedStatus] = useState<Record<string, 'all' | 'active' | 'inactive'>>({});
  const [pageSizes, setPageSizes] = useState<Record<string, number>>({});
  const [pages, setPages] = useState<Record<string, number>>({});
  const [sortConfig, setSortConfig] = useState<Record<string, { key: 'name' | 'reason_type' | 'is_active'; dir: 'asc' | 'desc' }>>({});

  // Create / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ReasonCategoryMeta>(REASON_CATEGORIES[0]);
  const [editingReason, setEditingReason] = useState<DispatchReason | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Normal');
  const [formActive, setFormActive] = useState(true);

  // Delete confirm modal
  const [deletingReason, setDeletingReason] = useState<DispatchReason | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReasons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operations/live-dispatch/settings/reasons', {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to load reasons');
      const data = await res.json();
      setReasons(Array.isArray(data) ? data : []);
    } catch (err: any) {
      onNotify('error', err?.message || 'Unable to load reasons.');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchReasons();
  }, [fetchReasons]);

  const openCreateModal = (cat: ReasonCategoryMeta) => {
    setActiveCategory(cat);
    setEditingReason(null);
    setFormName('');
    setFormType('Normal');
    setFormActive(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: ReasonCategoryMeta, item: DispatchReason) => {
    setActiveCategory(cat);
    setEditingReason(item);
    setFormName(item.name);
    setFormType(item.reason_type || 'Normal');
    setFormActive(Boolean(item.is_active));
    setModalOpen(true);
  };

  const handleSaveReason = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) {
      onNotify('error', 'Reason name is required.');
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editingReason?.id);
      const url = isEdit
        ? `/api/operations/live-dispatch/settings/reasons/${editingReason!.id}`
        : '/api/operations/live-dispatch/settings/reasons';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          category: activeCategory.key,
          name: trimmed,
          reason_type: activeCategory.hasTypeColumn ? formType : '',
          is_active: formActive
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save reason');
      }
      setModalOpen(false);
      setEditingReason(null);
      onNotify('success', isEdit ? `${activeCategory.title} updated.` : `Added to ${activeCategory.title}.`);
      fetchReasons();
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to save reason.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: DispatchReason) => {
    try {
      const res = await fetch(`/api/operations/live-dispatch/settings/reasons/${item.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ is_active: !item.is_active })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setReasons((prev) =>
        prev.map((r) => (r.id === item.id ? { ...r, is_active: !r.is_active } : r))
      );
      onNotify('success', `Reason ${!item.is_active ? 'activated' : 'deactivated'}.`);
    } catch (err: any) {
      onNotify('error', err?.message || 'Unable to update status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReason) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/settings/reasons/${deletingReason.id}`, {
        method: 'DELETE',
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to delete reason');
      setDeletingReason(null);
      onNotify('success', 'Reason deleted.');
      fetchReasons();
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to delete reason.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSort = (catKey: string, colKey: 'name' | 'reason_type' | 'is_active') => {
    setSortConfig((prev) => {
      const curr = prev[catKey];
      if (curr && curr.key === colKey) {
        return { ...prev, [catKey]: { key: colKey, dir: curr.dir === 'asc' ? 'desc' : 'asc' } };
      }
      return { ...prev, [catKey]: { key: colKey, dir: 'asc' } };
    });
  };

  return (
    <div className="space-y-4">
      {REASON_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const draftVal = statusDraft[cat.key] || 'all';
        const appliedVal = appliedStatus[cat.key] || 'all';
        const pageSize = pageSizes[cat.key] || 140;
        const currentPage = pages[cat.key] || 1;
        const sort = sortConfig[cat.key];

        let rows = reasons.filter((r) => r.category === cat.key);
        if (appliedVal === 'active') rows = rows.filter((r) => r.is_active);
        if (appliedVal === 'inactive') rows = rows.filter((r) => !r.is_active);

        if (sort) {
          rows = [...rows].sort((a, b) => {
            const mult = sort.dir === 'asc' ? 1 : -1;
            if (sort.key === 'is_active') {
              return (Number(a.is_active) - Number(b.is_active)) * mult;
            }
            const av = String(a[sort.key] || '').toLowerCase();
            const bv = String(b[sort.key] || '').toLowerCase();
            return av.localeCompare(bv) * mult;
          });
        }

        const totalItems = rows.length;
        const totalPages = Math.max(0, Math.ceil(totalItems / pageSize));
        const safePage = totalPages === 0 ? 0 : Math.min(currentPage, totalPages);
        const visibleRows =
          safePage === 0 ? [] : rows.slice((safePage - 1) * pageSize, safePage * pageSize);

        return (
          <section
            key={cat.key}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
          >
            {/* Section Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 truncate">{cat.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => openCreateModal(cat)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="px-5 py-3 flex flex-wrap items-end gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500">Status</label>
                <select
                  value={draftVal}
                  onChange={(e) =>
                    setStatusDraft((prev) => ({
                      ...prev,
                      [cat.key]: e.target.value as 'all' | 'active' | 'inactive'
                    }))
                  }
                  className="w-56 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="all">Activation Type (All)</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAppliedStatus((prev) => ({ ...prev, [cat.key]: draftVal }));
                  setPages((prev) => ({ ...prev, [cat.key]: 1 }));
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-teal-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Apply Search</span>
              </button>
            </div>

            {/* Table */}
            <div className="px-5">
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5 w-16">#</th>
                      <th className="px-3.5 py-2.5">
                        <button
                          type="button"
                          onClick={() => toggleSort(cat.key, 'name')}
                          className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                        >
                          <span>Name</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </button>
                      </th>
                      {cat.hasTypeColumn && (
                        <th className="px-3.5 py-2.5 w-48">
                          <button
                            type="button"
                            onClick={() => toggleSort(cat.key, 'reason_type')}
                            className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                          >
                            <span>Type</span>
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          </button>
                        </th>
                      )}
                      <th className="px-3.5 py-2.5 w-44">
                        <button
                          type="button"
                          onClick={() => toggleSort(cat.key, 'is_active')}
                          className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                        >
                          <span>Active</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </button>
                      </th>
                      <th className="px-3.5 py-2.5 w-32 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={cat.hasTypeColumn ? 5 : 4}
                          className="px-4 py-5 text-slate-400"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : visibleRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={cat.hasTypeColumn ? 5 : 4}
                          className="px-4 py-4 text-slate-500"
                        >
                          No Data Found
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="px-3.5 py-2.5 tabular-nums text-slate-500">
                            {(safePage - 1) * pageSize + idx + 1}
                          </td>
                          <td className="px-3.5 py-2.5 font-medium text-slate-800">{item.name}</td>
                          {cat.hasTypeColumn && (
                            <td className="px-3.5 py-2.5 text-slate-600">
                              {item.reason_type || 'Normal'}
                            </td>
                          )}
                          <td className="px-3.5 py-2.5">
                            <button
                              type="button"
                              onClick={() => handleToggleActive(item)}
                              className="inline-flex items-center gap-2 cursor-pointer"
                              title="Toggle active status"
                            >
                              <span
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  item.is_active ? 'bg-teal-600' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                    item.is_active ? 'translate-x-4.5' : 'translate-x-1'
                                  }`}
                                />
                              </span>
                              <span
                                className={`text-[11px] font-semibold ${
                                  item.is_active ? 'text-emerald-700' : 'text-slate-500'
                                }`}
                              >
                                {item.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </button>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(cat, item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                                title="Edit Reason"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingReason(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                                title="Delete Reason"
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

            {/* Pagination Footer */}
            <div className="px-5 py-3 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-2.5">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSizes((prev) => ({ ...prev, [cat.key]: Number(e.target.value) }));
                    setPages((prev) => ({ ...prev, [cat.key]: 1 }));
                  }}
                  className="px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 tabular-nums"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={140}>140</option>
                </select>
                <span className="tabular-nums">
                  Page {totalPages === 0 ? 1 : safePage} of {totalPages} - total items: {totalItems}
                </span>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPages((prev) => ({ ...prev, [cat.key]: Math.max(1, safePage - 1) }))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setPages((prev) => ({ ...prev, [cat.key]: Math.min(totalPages, safePage + 1) }))
                    }
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* Create / Edit Reason Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingReason ? `Edit ${activeCategory.title}` : `Create ${activeCategory.title}`}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Saved directly to Live Dispatch configuration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveReason} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Reason Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter reason label..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {activeCategory.hasTypeColumn && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    End Shift Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {END_SHIFT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Active Status</div>
                  <div className="text-[11px] text-slate-500">
                    Show this reason to dispatchers and riders
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormActive((v) => !v)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    formActive ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      formActive ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingReason ? 'Save Changes' : 'Create Reason'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingReason && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Delete Reason</h3>
            <p className="text-xs text-slate-600 mt-1.5">
              Are you sure you want to remove <span className="font-semibold text-slate-900">{deletingReason.name}</span>? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingReason(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* 2. RIDER REVENUE SETTINGS SECTION (Company Defaults + All Teams table)    */
/* ========================================================================= */

function formatEgpNumber(val: number): string {
  const num = Number(val || 0);
  if (!Number.isFinite(num)) return '00';
  if (Number.isInteger(num) && num >= 0 && num < 10) {
    return String(num).padStart(2, '0');
  }
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function StatusTag({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
        enabled ? 'bg-teal-600 text-white' : 'bg-slate-500 text-white'
      }`}
    >
      {enabled ? 'ON' : 'OFF'}
    </span>
  );
}

export function RiderRevenueSettingsSection({ onNotify }: NotifyProps) {
  const [companyDefaults, setCompanyDefaults] = useState<DispatchRiderRevenueRule | null>(null);
  const [teams, setTeams] = useState<DispatchRiderRevenueRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamSearch, setTeamSearch] = useState('');

  // Modal state (shared for Company Defaults and Team Overrides)
  const [modalTarget, setModalTarget] = useState<'company' | DispatchRiderRevenueRule | null>(null);
  const [formRule, setFormRule] = useState<DispatchRiderRevenueRule | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/operations/live-dispatch/settings/rider-revenue', {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to load rider revenue rules');
      const data = await res.json();
      setCompanyDefaults(data.companyDefaults || null);
      setTeams(Array.isArray(data.teams) ? data.teams : []);
    } catch (err: any) {
      onNotify('error', err?.message || 'Unable to load rider revenue settings.');
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => String(t.team_name || '').toLowerCase().includes(q));
  }, [teams, teamSearch]);

  const openCompanyModal = () => {
    if (!companyDefaults) return;
    setModalTarget('company');
    setFormRule({ ...companyDefaults });
  };

  const openTeamModal = (teamRule: DispatchRiderRevenueRule) => {
    setModalTarget(teamRule);
    setFormRule({ ...teamRule });
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRule || !modalTarget) return;
    setSaving(true);
    try {
      const isCompany = modalTarget === 'company';
      const url = isCompany
        ? '/api/operations/live-dispatch/settings/rider-revenue/company'
        : `/api/operations/live-dispatch/settings/rider-revenue/team/${modalTarget.team_id}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(formRule)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save revenue rules');
      }
      setModalTarget(null);
      setFormRule(null);
      onNotify(
        'success',
        isCompany
          ? 'Company rider revenue defaults updated.'
          : `Rider revenue updated for ${(modalTarget as DispatchRiderRevenueRule).team_name}.`
      );
      fetchRevenue();
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to save revenue rules.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetTeamToDefault = async () => {
    if (!modalTarget || modalTarget === 'company' || !modalTarget.team_id) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/operations/live-dispatch/settings/rider-revenue/team/${modalTarget.team_id}`,
        {
          method: 'DELETE',
          headers: getDispatchAuthHeaders(false)
        }
      );
      if (!res.ok) throw new Error('Failed to reset team override');
      setModalTarget(null);
      setFormRule(null);
      onNotify('success', `${modalTarget.team_name} reset to Company Defaults.`);
      fetchRevenue();
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to reset team settings.');
    } finally {
      setSaving(false);
    }
  };

  const currency = companyDefaults?.currency || 'EGP';

  return (
    <div className="space-y-4">
      {/* Top Card: Company Defaults */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Company Defaults</h2>
              <p className="text-[11px] text-slate-500">
                Baseline rider revenue and penalty rules applied to all teams unless overridden.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={loading || !companyDefaults}
            onClick={openCompanyModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span>Edit</span>
          </button>
        </div>

        {loading || !companyDefaults ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin text-teal-600 mx-auto mb-2" />
            Loading rider revenue defaults...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 px-5 py-4 gap-y-4">
            {/* Column 1 */}
            <div className="space-y-3 lg:pr-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusTag enabled={companyDefaults.online_shift_hours_enabled} />
                <span className="font-semibold text-slate-900">Online Shift Hours</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Hour Price</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.online_shift_hour_price} {currency}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-900">Excellent Trip Revenue</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Revenue</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.excellent_trip_revenue} {currency}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-900">Good Trip Revenue</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Revenue</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.good_trip_revenue} {currency}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-900">Late Trip Revenue</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Revenue</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.late_trip_revenue} {currency}
                </span>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-3 pt-3 lg:pt-0 lg:px-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-900">Abuse Trip Revenue</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Deduction</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold tabular-nums">
                  {companyDefaults.abuse_trip_deduction} {currency}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-900">Order Revenue In Excellent Trip</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Revenue</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.order_rev_excellent} {currency}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-900">Order Revenue in Good Trip</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Revenue</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.order_rev_good} {currency}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-900">Order Revenue in Late Trip</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Revenue</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.order_rev_late} {currency}
                </span>
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-3 pt-3 lg:pt-0 lg:pl-5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-900">Order Revenue in Abuse Trip</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">Revenue</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.order_rev_abuse} {currency}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusTag enabled={companyDefaults.trip_ignoring_enabled} />
                <span className="font-semibold text-slate-900">Trip Ignoring Deduction</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.trip_ignoring_deduction} {currency}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusTag enabled={companyDefaults.trip_ignoring_penalization_enabled} />
                <span className="font-semibold text-slate-900">
                  Trip Ignoring penalization Deduction
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.trip_ignoring_penalization_deduction} {currency}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusTag enabled={companyDefaults.rider_abuse_penalization_enabled} />
                <span className="font-semibold text-slate-900">
                  Rider Abuse Penalization Deduction
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-900 tabular-nums">
                  {companyDefaults.rider_abuse_penalization_deduction} {currency}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Card: All Teams Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-bold text-slate-900">All Teams</h3>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              placeholder="Search For Teams"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                  Teams
                </th>
                <th className="px-4 py-3">Online Shift Hours</th>
                <th className="px-4 py-3">Excellent Trip Revenue</th>
                <th className="px-4 py-3">Good Trip Revenue</th>
                <th className="px-4 py-3">Late Trip Revenue</th>
                <th className="px-4 py-3">Abuse Trip Revenue</th>
                <th className="px-4 py-3">Order Revenue In Excellent Trip</th>
                <th className="px-4 py-3">Order Revenue in Good Trip</th>
                <th className="px-4 py-3">Order Revenue in Late Trip</th>
                <th className="px-4 py-3">Order Revenue in Abuse Trip</th>
                <th className="px-4 py-3">Trip Ignoring Deduction</th>
                <th className="px-4 py-3">Trip Ignoring penalization Deduction</th>
                <th className="px-4 py-3">Rider Abuse Penalization Deduction</th>
                <th className="px-4 py-3 sticky right-0 bg-slate-50 z-10 border-l border-slate-200 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={14} className="px-5 py-8 text-center text-slate-400">
                    Loading teams revenue matrix...
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-5 py-8 text-center text-slate-500">
                    No matching teams found.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((tm) => (
                  <tr key={tm.team_id ?? tm.team_name} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 sticky left-0 bg-white z-10 border-r border-slate-100 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{tm.team_name}</span>
                        {tm.has_override && (
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-slate-900">
                        {formatEgpNumber(tm.online_shift_hour_price)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-emerald-600">
                        {formatEgpNumber(tm.excellent_trip_revenue)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-emerald-600">
                        {formatEgpNumber(tm.good_trip_revenue)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-emerald-600">
                        {formatEgpNumber(tm.late_trip_revenue)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-rose-600">
                        {formatEgpNumber(tm.abuse_trip_deduction)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-emerald-600">
                        {formatEgpNumber(tm.order_rev_excellent)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-emerald-600">
                        {formatEgpNumber(tm.order_rev_good)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-emerald-600">
                        {formatEgpNumber(tm.order_rev_late)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-emerald-600">
                        {formatEgpNumber(tm.order_rev_abuse)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-rose-600">
                        {formatEgpNumber(tm.trip_ignoring_deduction)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-rose-600">
                        {formatEgpNumber(tm.trip_ignoring_penalization_deduction)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <span className="font-bold text-rose-600">
                        {formatEgpNumber(tm.rider_abuse_penalization_deduction)}
                      </span>{' '}
                      <span className="text-slate-500 text-[11px]">{tm.currency || 'EGP'}</span>
                    </td>
                    <td className="px-4 py-3 sticky right-0 bg-white z-10 border-l border-slate-100 text-center">
                      <button
                        type="button"
                        onClick={() => openTeamModal(tm)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                        title={`Configure Rider Revenue for ${tm.team_name}`}
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Company Defaults / Team Override Modal */}
      {modalTarget && formRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {modalTarget === 'company'
                    ? 'Edit Company Rider Revenue Defaults'
                    : `Configure Rider Revenue — ${modalTarget.team_name}`}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Configure trip earnings, per-order bonuses, and deduction rules in {formRule.currency || 'EGP'}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalTarget(null);
                  setFormRule(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="p-5 space-y-5">
              {/* Shift Hours */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormRule((p) =>
                        p ? { ...p, online_shift_hours_enabled: !p.online_shift_hours_enabled } : p
                      )
                    }
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                      formRule.online_shift_hours_enabled ? 'bg-teal-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        formRule.online_shift_hours_enabled ? 'translate-x-4.5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Online Shift Hours</div>
                    <div className="text-[11px] text-slate-500">Hourly payout rate during active shifts</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">Hour Price</span>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={formRule.online_shift_hour_price}
                    onChange={(e) =>
                      setFormRule((p) =>
                        p ? { ...p, online_shift_hour_price: Math.max(0, Number(e.target.value) || 0) } : p
                      )
                    }
                    className="w-24 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white tabular-nums"
                  />
                  <span className="text-[11px] font-semibold text-slate-500">EGP</span>
                </div>
              </div>

              {/* Trip Performance Revenue & Abuse Deduction */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Trip Performance Revenue & Deductions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'excellent_trip_revenue' as const, label: 'Excellent Trip Revenue (EGP)' },
                    { key: 'good_trip_revenue' as const, label: 'Good Trip Revenue (EGP)' },
                    { key: 'late_trip_revenue' as const, label: 'Late Trip Revenue (EGP)' },
                    { key: 'abuse_trip_deduction' as const, label: 'Abuse Trip Deduction (EGP)' }
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={formRule[field.key]}
                        onChange={(e) =>
                          setFormRule((p) =>
                            p ? { ...p, [field.key]: Math.max(0, Number(e.target.value) || 0) } : p
                          )
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-Order Revenue by Trip Rating */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Order Revenue By Trip Performance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'order_rev_excellent' as const, label: 'Order Revenue In Excellent Trip (EGP)' },
                    { key: 'order_rev_good' as const, label: 'Order Revenue in Good Trip (EGP)' },
                    { key: 'order_rev_late' as const, label: 'Order Revenue in Late Trip (EGP)' },
                    { key: 'order_rev_abuse' as const, label: 'Order Revenue in Abuse Trip (EGP)' }
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={formRule[field.key]}
                        onChange={(e) =>
                          setFormRule((p) =>
                            p ? { ...p, [field.key]: Math.max(0, Number(e.target.value) || 0) } : p
                          )
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Penalization & Ignoring Deductions */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Penalization & Ignoring Deductions
                </h4>
                <div className="space-y-2.5">
                  {[
                    {
                      toggleKey: 'trip_ignoring_enabled' as const,
                      valKey: 'trip_ignoring_deduction' as const,
                      label: 'Trip Ignoring Deduction'
                    },
                    {
                      toggleKey: 'trip_ignoring_penalization_enabled' as const,
                      valKey: 'trip_ignoring_penalization_deduction' as const,
                      label: 'Trip Ignoring penalization Deduction'
                    },
                    {
                      toggleKey: 'rider_abuse_penalization_enabled' as const,
                      valKey: 'rider_abuse_penalization_deduction' as const,
                      label: 'Rider Abuse Penalization Deduction'
                    }
                  ].map((item) => (
                    <div
                      key={item.valKey}
                      className="p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFormRule((p) => (p ? { ...p, [item.toggleKey]: !p[item.toggleKey] } : p))
                          }
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                            formRule[item.toggleKey] ? 'bg-teal-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              formRule[item.toggleKey] ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-semibold text-slate-800">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step="0.5"
                          value={formRule[item.valKey]}
                          onChange={(e) =>
                            setFormRule((p) =>
                              p ? { ...p, [item.valKey]: Math.max(0, Number(e.target.value) || 0) } : p
                            )
                          }
                          className="w-24 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg tabular-nums"
                        />
                        <span className="text-[11px] font-semibold text-slate-500">EGP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {modalTarget !== 'company' && modalTarget.has_override && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleResetTeamToDefault}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset to Company Defaults</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTarget(null);
                      setFormRule(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Revenue Rules'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* 3. TRIPS TYPE SETTINGS SECTION (Feeds Create New Trip selector)           */
/* ========================================================================= */

export function TripsTypeSettingsSection({ onNotify }: NotifyProps) {
  const [tripTypes, setTripTypes] = useState<DispatchTripType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<DispatchTripType | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    base_fee: 0,
    max_orders: 4,
    is_active: true
  });

  const [deletingItem, setDeletingItem] = useState<DispatchTripType | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTripTypes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchText.trim()) params.set('search', searchText.trim());
      const res = await fetch(
        `/api/operations/live-dispatch/settings/trip-types?${params.toString()}`,
        { headers: getDispatchAuthHeaders(false) }
      );
      if (!res.ok) throw new Error('Failed to load trip types');
      const data = await res.json();
      setTripTypes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      onNotify('error', err?.message || 'Unable to load trip types.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchText, onNotify]);

  useEffect(() => {
    fetchTripTypes();
  }, [fetchTripTypes]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      code: '',
      description: '',
      base_fee: 0,
      max_orders: 4,
      is_active: true
    });
    setModalOpen(true);
  };

  const openEdit = (item: DispatchTripType) => {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code || '',
      description: item.description || '',
      base_fee: Number(item.base_fee || 0),
      max_orders: Number(item.max_orders || 4),
      is_active: Boolean(item.is_active)
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onNotify('error', 'Trip type name is required.');
      return;
    }
    setSaving(true);
    try {
      const isEdit = Boolean(editing?.id);
      const url = isEdit
        ? `/api/operations/live-dispatch/settings/trip-types/${editing!.id}`
        : '/api/operations/live-dispatch/settings/trip-types';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim(),
          base_fee: Number(form.base_fee || 0),
          max_orders: Math.max(1, Math.round(Number(form.max_orders || 4))),
          is_active: form.is_active
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save trip type');
      }
      setModalOpen(false);
      setEditing(null);
      onNotify('success', isEdit ? 'Trip type updated.' : 'Trip type created.');
      fetchTripTypes();
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to save trip type.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: DispatchTripType) => {
    try {
      const res = await fetch(`/api/operations/live-dispatch/settings/trip-types/${item.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ is_active: !item.is_active })
      });
      if (!res.ok) throw new Error('Failed to update status');
      setTripTypes((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, is_active: !t.is_active } : t))
      );
      onNotify('success', `Trip type ${!item.is_active ? 'activated' : 'deactivated'}.`);
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to toggle trip type status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/settings/trip-types/${deletingItem.id}`, {
        method: 'DELETE',
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to delete trip type');
      setDeletingItem(null);
      onNotify('success', 'Trip type deleted.');
      fetchTripTypes();
    } catch (err: any) {
      onNotify('error', err?.message || 'Failed to delete trip type.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center">
            <Tags className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Trips Type</h2>
            <p className="text-[11px] text-slate-500">
              Define trip categories available when creating a new dispatch trip.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Trip Type</span>
        </button>
      </div>

      {/* Filters */}
      <div className="px-5 py-3.5 flex flex-wrap items-end gap-2.5">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500">Search</label>
          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Name or code..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-slate-500">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="w-44 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        <button
          type="button"
          onClick={fetchTripTypes}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-teal-700 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Apply Search</span>
        </button>
      </div>

      {/* Table */}
      <div className="px-5 pb-5">
        <div className="border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-3.5 py-2.5 w-14">#</th>
                <th className="px-3.5 py-2.5">Trip Type Name</th>
                <th className="px-3.5 py-2.5 w-28">Code</th>
                <th className="px-3.5 py-2.5">Description</th>
                <th className="px-3.5 py-2.5 w-36 text-right">Base Fee (EGP)</th>
                <th className="px-3.5 py-2.5 w-32 text-right">Max Orders</th>
                <th className="px-3.5 py-2.5 w-36">Active</th>
                <th className="px-3.5 py-2.5 w-28 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Loading trip types...
                  </td>
                </tr>
              ) : tripTypes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No trip types found. Create one to populate the Create New Trip selector.
                  </td>
                </tr>
              ) : (
                tripTypes.map((tt, idx) => (
                  <tr key={tt.id} className="hover:bg-slate-50/70">
                    <td className="px-3.5 py-2.5 tabular-nums text-slate-500">{idx + 1}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-slate-900">{tt.name}</td>
                    <td className="px-3.5 py-2.5 font-mono text-slate-600">{tt.code || '—'}</td>
                    <td className="px-3.5 py-2.5 text-slate-600 max-w-xs truncate">
                      {tt.description || '—'}
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums font-semibold text-slate-800">
                      {Number(tt.base_fee || 0).toFixed(2)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums text-slate-700">
                      {tt.max_orders}
                    </td>
                    <td className="px-3.5 py-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(tt)}
                        className="inline-flex items-center gap-2 cursor-pointer"
                      >
                        <span
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            tt.is_active ? 'bg-teal-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              tt.is_active ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </span>
                        <span
                          className={`text-[11px] font-semibold ${
                            tt.is_active ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {tt.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(tt)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 cursor-pointer"
                          title="Edit Trip Type"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(tt)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          title="Delete Trip Type"
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

      {/* Create / Edit Trip Type Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editing ? 'Edit Trip Type' : 'Create New Trip Type'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Active trip types appear in the Create New Trip form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trip Type Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Express Trip"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Code</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="EXP"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional operational description..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Base Fee / Extra (EGP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={form.base_fee}
                    onChange={(e) =>
                      setForm({ ...form, base_fee: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Max Orders
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={form.max_orders}
                    onChange={(e) =>
                      setForm({ ...form, max_orders: Math.max(1, Number(e.target.value) || 1) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Active</div>
                  <div className="text-[11px] text-slate-500">
                    Selectable when creating a new trip
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                    form.is_active ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      form.is_active ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Trip Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Delete Trip Type</h3>
            <p className="text-xs text-slate-600 mt-1.5">
              Remove <span className="font-semibold text-slate-900">{deletingItem.name}</span> from trip types? Existing trips will keep their saved label.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
