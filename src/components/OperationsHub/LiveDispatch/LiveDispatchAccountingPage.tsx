import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Wallet,
  Building2,
  UserCheck,
  FileText,
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Plus,
  Trash2,
  X,
  Check,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  SlidersHorizontal
} from 'lucide-react';
import {
  DispatchWalletStoreRow,
  DispatchWalletAgentRow,
  DispatchWalletTransaction,
  getDispatchAuthHeaders,
  formatShortDateTime
} from './types';

type AccountingTab = 'store' | 'agent' | 'transaction';
type SortDir = 'asc' | 'desc';

interface AccountingFiltersMeta {
  teams: string[];
  providers: string[];
  riders: Array<{
    id: number;
    name: string;
    enroll_id: string;
    team_name: string;
    provider_name: string;
    payroll_method: string;
    payroll_method_number: string;
  }>;
  types: string[];
}

interface AccountingCounts {
  stores: number;
  agents: number;
  transactions: number;
}

const PAYROLL_METHODS = [
  'Cash',
  'Vodafone Cash',
  'InstaPay',
  'Bank Transfer',
  'Fawry',
  'Orange Cash',
  'Etisalat Cash'
];

const TRANSACTION_TYPE_OPTIONS = [
  { value: 'COMPLETE_TRIP', label: 'COMPLETE_TRIP' },
  { value: 'COLLECTION', label: 'COLLECTION' },
  { value: 'COMMISSION', label: 'COMMISSION' },
  { value: 'BONUS', label: 'BONUS' },
  { value: 'DEDUCTION', label: 'DEDUCTION' },
  { value: 'MANUAL_ADJUSTMENT', label: 'MANUAL_ADJUSTMENT' },
  { value: 'SETTLEMENT', label: 'SETTLEMENT' }
];

function getMonthRangeDefaults() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return {
    fromDate: `${yyyy}-${mm}-01`,
    toDate: `${yyyy}-${mm}-${dd}`
  };
}

function formatAmountEgp(amount: number | string | null | undefined, currency = 'EGP'): string {
  const num = Number(amount || 0);
  if (!Number.isFinite(num)) return `0 ${currency}`;
  const formatted = Number.isInteger(num)
    ? num.toLocaleString('en-US')
    : num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formatted} ${currency}`;
}

export function LiveDispatchAccountingPage({
  defaultTab
}: {
  defaultTab?: AccountingTab;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const activeTab: AccountingTab = useMemo(() => {
    const p = location.pathname.replace(/\/+$/, '').toLowerCase();
    if (p.endsWith('/wallet/agent') || p.endsWith('/agent')) return 'agent';
    if (p.endsWith('/wallet/transaction') || p.endsWith('/wallet/transactions') || p.endsWith('/transaction')) {
      return 'transaction';
    }
    if (p.endsWith('/wallet/store') || p.endsWith('/store')) return 'store';
    return defaultTab || 'store';
  }, [location.pathname, defaultTab]);

  const monthDefaults = useMemo(() => getMonthRangeDefaults(), []);

  // Draft Filter States (applied when clicking Apply Search or switching tabs)
  const [teamFilter, setTeamFilter] = useState<string>(searchParams.get('team') || '');
  const [providerFilter, setProviderFilter] = useState<string>(searchParams.get('provider') || '');
  const [riderFilter, setRiderFilter] = useState<string>(searchParams.get('riderId') || '');
  const [tripNumberFilter, setTripNumberFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(monthDefaults.fromDate);
  const [toDate, setToDate] = useState<string>(monthDefaults.toDate);
  const [awardFilter, setAwardFilter] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState<boolean>(false);

  // Applied filter snapshot (used for fetches & exports)
  const [appliedFilters, setAppliedFilters] = useState({
    team: searchParams.get('team') || '',
    provider: searchParams.get('provider') || '',
    riderId: searchParams.get('riderId') || '',
    tripNumber: '',
    type: '',
    fromDate: monthDefaults.fromDate,
    toDate: monthDefaults.toDate,
    award: '',
    minAmount: '',
    maxAmount: ''
  });

  // Data States
  const [storeGrandTotal, setStoreGrandTotal] = useState<number>(0);
  const [storeRows, setStoreRows] = useState<DispatchWalletStoreRow[]>([]);
  const [agentRows, setAgentRows] = useState<DispatchWalletAgentRow[]>([]);
  const [txRows, setTxRows] = useState<DispatchWalletTransaction[]>([]);
  const [counts, setCounts] = useState<AccountingCounts>({
    stores: 0,
    agents: 0,
    transactions: 0
  });
  const [filtersMeta, setFiltersMeta] = useState<AccountingFiltersMeta>({
    teams: [],
    providers: [],
    riders: [],
    types: TRANSACTION_TYPE_OPTIONS.map((t) => t.value)
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState<boolean>(false);

  // Sorting state per tab
  const [sortField, setSortField] = useState<string>('');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Pagination for Transaction tab
  const [txPage, setTxPage] = useState<number>(1);
  const TX_PAGE_SIZE = 50;

  // Add To Wallet Modal
  const [walletModalOpen, setWalletModalOpen] = useState<boolean>(false);
  const [walletForm, setWalletForm] = useState({
    rider_id: '',
    rider_name: '',
    team_name: '',
    provider_name: '',
    enroll_id: '',
    transaction_type: 'COMPLETE_TRIP',
    is_award: true,
    amount: '',
    trip_number: '',
    notes: '',
    payroll_method: '',
    payroll_method_number: ''
  });

  // Delete Transaction Confirmation Modal
  const [deleteTxTarget, setDeleteTxTarget] = useState<DispatchWalletTransaction | null>(null);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3400);
  }, []);

  // Close Download dropdown on outside click
  useEffect(() => {
    const onOutside = () => setDownloadMenuOpen(false);
    window.addEventListener('click', onOutside);
    return () => window.removeEventListener('click', onOutside);
  }, []);

  const buildQueryParams = useCallback(
    (tab: AccountingTab, f: typeof appliedFilters) => {
      const params = new URLSearchParams();
      if (f.provider) params.set('provider', f.provider);
      if (tab === 'store') {
        if (f.fromDate) params.set('fromDate', f.fromDate);
        if (f.toDate) params.set('toDate', f.toDate);
      } else if (tab === 'agent') {
        if (f.team) params.set('team', f.team);
        if (f.riderId) params.set('riderId', f.riderId);
        if (f.fromDate) params.set('fromDate', f.fromDate);
        if (f.toDate) params.set('toDate', f.toDate);
      } else {
        if (f.team) params.set('team', f.team);
        if (f.riderId) params.set('riderId', f.riderId);
        if (f.tripNumber) params.set('tripNumber', f.tripNumber);
        if (f.type) params.set('type', f.type);
        if (f.award) params.set('award', f.award);
        if (f.minAmount) params.set('minAmount', f.minAmount);
        if (f.maxAmount) params.set('maxAmount', f.maxAmount);
        if (showAdvancedSearch) {
          if (f.fromDate) params.set('fromDate', f.fromDate);
          if (f.toDate) params.set('toDate', f.toDate);
        }
      }
      return params;
    },
    [showAdvancedSearch]
  );

  const fetchTabData = useCallback(
    async (tab: AccountingTab, f: typeof appliedFilters) => {
      setLoading(true);
      try {
        const endpoint =
          tab === 'agent'
            ? '/api/operations/live-dispatch/accounting/wallet/agent'
            : tab === 'transaction'
            ? '/api/operations/live-dispatch/accounting/wallet/transactions'
            : '/api/operations/live-dispatch/accounting/wallet/store';

        const qs = buildQueryParams(tab, f).toString();
        const res = await fetch(`${endpoint}${qs ? `?${qs}` : ''}`, {
          headers: getDispatchAuthHeaders(false)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to load accounting data');
        }
        const data = await res.json();
        if (data.counts) setCounts(data.counts);
        if (data.filters) setFiltersMeta(data.filters);

        if (tab === 'store') {
          setStoreGrandTotal(Number(data.grandTotal || 0));
          setStoreRows(Array.isArray(data.rows) ? data.rows : []);
        } else if (tab === 'agent') {
          setAgentRows(Array.isArray(data.rows) ? data.rows : []);
        } else {
          setTxRows(Array.isArray(data.rows) ? data.rows : []);
          setTxPage(1);
        }
      } catch (err: any) {
        showToast('error', err.message || 'Could not load accounting records');
      } finally {
        setLoading(false);
      }
    },
    [buildQueryParams, showToast]
  );

  useEffect(() => {
    setSortField('');
    fetchTabData(activeTab, appliedFilters);
  }, [activeTab, appliedFilters, fetchTabData]);

  const handleApplySearch = () => {
    setAppliedFilters({
      team: teamFilter,
      provider: providerFilter,
      riderId: riderFilter,
      tripNumber: tripNumberFilter.trim(),
      type: typeFilter,
      fromDate,
      toDate,
      award: awardFilter,
      minAmount,
      maxAmount
    });
  };

  const handleResetFilters = () => {
    const fresh = {
      team: '',
      provider: '',
      riderId: '',
      tripNumber: '',
      type: '',
      fromDate: monthDefaults.fromDate,
      toDate: monthDefaults.toDate,
      award: '',
      minAmount: '',
      maxAmount: ''
    };
    setTeamFilter('');
    setProviderFilter('');
    setRiderFilter('');
    setTripNumberFilter('');
    setTypeFilter('');
    setFromDate(monthDefaults.fromDate);
    setToDate(monthDefaults.toDate);
    setAwardFilter('');
    setMinAmount('');
    setMaxAmount('');
    setAppliedFilters(fresh);
  };

  const switchTab = (tab: AccountingTab) => {
    navigate(`/operations-hub/LiveDispatchSystem/accounting/wallet/${tab}`);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  // Sorted Store Rows
  const sortedStoreRows = useMemo(() => {
    if (!sortField) return storeRows;
    const copy = [...storeRows];
    copy.sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'total_amount') return (a.total_amount - b.total_amount) * mult;
      return a.team_name.localeCompare(b.team_name) * mult;
    });
    return copy;
  }, [storeRows, sortField, sortDir]);

  // Sorted Agent Rows
  const sortedAgentRows = useMemo(() => {
    if (!sortField) return agentRows;
    const copy = [...agentRows];
    copy.sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'total_amount') return (a.total_amount - b.total_amount) * mult;
      if (sortField === 'enroll_id') {
        const na = Number(a.enroll_id);
        const nb = Number(b.enroll_id);
        if (Number.isFinite(na) && Number.isFinite(nb)) return (na - nb) * mult;
        return a.enroll_id.localeCompare(b.enroll_id) * mult;
      }
      const va = String((a as any)[sortField] || '');
      const vb = String((b as any)[sortField] || '');
      return va.localeCompare(vb) * mult;
    });
    return copy;
  }, [agentRows, sortField, sortDir]);

  // Sorted & Paginated Transaction Rows
  const sortedTxRows = useMemo(() => {
    if (!sortField) return txRows;
    const copy = [...txRows];
    copy.sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'amount') return (a.amount - b.amount) * mult;
      if (sortField === 'is_award') return (Number(a.is_award) - Number(b.is_award)) * mult;
      if (sortField === 'created_at') {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * mult;
      }
      const va = String((a as any)[sortField] || '');
      const vb = String((b as any)[sortField] || '');
      return va.localeCompare(vb) * mult;
    });
    return copy;
  }, [txRows, sortField, sortDir]);

  const txTotalPages = Math.max(1, Math.ceil(sortedTxRows.length / TX_PAGE_SIZE));
  const paginatedTxRows = useMemo(() => {
    const start = (txPage - 1) * TX_PAGE_SIZE;
    return sortedTxRows.slice(start, start + TX_PAGE_SIZE);
  }, [sortedTxRows, txPage]);

  const openAddToWalletForAgent = (agent?: DispatchWalletAgentRow) => {
    if (agent) {
      setWalletForm({
        rider_id: String(agent.rider_id),
        rider_name: agent.rider_name,
        team_name: agent.team_name,
        provider_name: agent.provider_name,
        enroll_id: agent.enroll_id,
        transaction_type: 'COMPLETE_TRIP',
        is_award: true,
        amount: '',
        trip_number: '',
        notes: '',
        payroll_method: agent.payroll_method || '',
        payroll_method_number: agent.payroll_method_number || ''
      });
    } else {
      const firstRider = filtersMeta.riders[0];
      setWalletForm({
        rider_id: firstRider ? String(firstRider.id) : '',
        rider_name: firstRider ? firstRider.name : '',
        team_name: firstRider ? firstRider.team_name : '',
        provider_name: firstRider ? firstRider.provider_name : '',
        enroll_id: firstRider ? firstRider.enroll_id : '',
        transaction_type: 'COMPLETE_TRIP',
        is_award: true,
        amount: '',
        trip_number: '',
        notes: '',
        payroll_method: firstRider?.payroll_method || '',
        payroll_method_number: firstRider?.payroll_method_number || ''
      });
    }
    setWalletModalOpen(true);
  };

  const handleWalletRiderSelect = (riderIdStr: string) => {
    const found = filtersMeta.riders.find((r) => String(r.id) === riderIdStr);
    if (found) {
      setWalletForm((prev) => ({
        ...prev,
        rider_id: String(found.id),
        rider_name: found.name,
        team_name: found.team_name,
        provider_name: found.provider_name,
        enroll_id: found.enroll_id,
        payroll_method: found.payroll_method || '',
        payroll_method_number: found.payroll_method_number || ''
      }));
    } else {
      setWalletForm((prev) => ({ ...prev, rider_id: riderIdStr }));
    }
  };

  const handleSaveWalletTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(walletForm.amount);
    if (!walletForm.rider_id && !walletForm.rider_name.trim()) {
      showToast('error', 'Please select a rider');
      return;
    }
    if (!Number.isFinite(numericAmount) || walletForm.amount === '') {
      showToast('error', 'Please enter a valid numeric amount');
      return;
    }

    const signedAmount =
      walletForm.transaction_type === 'DEDUCTION' && numericAmount > 0
        ? -numericAmount
        : numericAmount;

    setSaving(true);
    try {
      const res = await fetch('/api/operations/live-dispatch/accounting/transactions', {
        method: 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          rider_id: walletForm.rider_id ? Number(walletForm.rider_id) : null,
          rider_name: walletForm.rider_name.trim(),
          team_name: walletForm.team_name.trim(),
          provider_name: walletForm.provider_name.trim(),
          enroll_id: walletForm.enroll_id.trim(),
          transaction_type: walletForm.transaction_type,
          is_award: walletForm.is_award,
          amount: signedAmount,
          trip_number: walletForm.trip_number.trim(),
          notes: walletForm.notes.trim(),
          payroll_method: walletForm.payroll_method.trim(),
          payroll_method_number: walletForm.payroll_method_number.trim()
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add wallet transaction');
      }
      setWalletModalOpen(false);
      showToast(
        'success',
        `Recorded ${formatAmountEgp(signedAmount)} for ${walletForm.rider_name}`
      );
      await fetchTabData(activeTab, appliedFilters);
    } catch (err: any) {
      showToast('error', err.message || 'Could not record wallet transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (tx: DispatchWalletTransaction) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/accounting/transactions/${tx.id}`, {
        method: 'DELETE',
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete transaction');
      }
      setDeleteTxTarget(null);
      showToast('success', 'Wallet transaction deleted');
      await fetchTabData(activeTab, appliedFilters);
    } catch (err: any) {
      showToast('error', err.message || 'Could not delete transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = async (format: 'xlsx' | 'csv') => {
    setDownloadMenuOpen(false);
    setExporting(true);
    try {
      const params = buildQueryParams(activeTab, appliedFilters);
      params.set('tab', activeTab);
      params.set('format', format);

      const res = await fetch(
        `/api/operations/live-dispatch/accounting/export?${params.toString()}`,
        {
          headers: getDispatchAuthHeaders(false)
        }
      );
      if (!res.ok) throw new Error('Failed to generate report');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `dispatch-accounting-${activeTab}-${stamp}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('success', `Downloaded ${activeTab} accounting report (.${format})`);
    } catch (err: any) {
      showToast('error', err.message || 'Could not download report');
    } finally {
      setExporting(false);
    }
  };

  const SortHeader = ({
    field,
    label,
    align = 'left'
  }: {
    field: string;
    label: string;
    align?: 'left' | 'right';
  }) => {
    const active = sortField === field;
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className={`inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-teal-700 transition-colors cursor-pointer whitespace-nowrap ${
          align === 'right' ? 'justify-end' : ''
        }`}
      >
        <span>{label}</span>
        {active ? (
          sortDir === 'asc' ? (
            <ChevronUp className="w-3.5 h-3.5 text-teal-600" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Floating Toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[140] flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-emerald-800'
              : 'bg-white border-rose-200 text-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Single-Elevation Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-5 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">Accounting</h1>
              <p className="text-xs text-slate-500">
                Rider collections, trip commissions, wallet balances, and settlement reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'transaction' && (
              <button
                type="button"
                onClick={() => openAddToWalletForAgent(undefined)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 text-teal-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add To Wallet</span>
              </button>
            )}

            {/* Download Report Dropdown */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                disabled={exporting}
                onClick={() => setDownloadMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{exporting ? 'Exporting...' : 'Download Report'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {downloadMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40">
                  <button
                    type="button"
                    onClick={() => handleDownloadReport('xlsx')}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Export Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadReport('csv')}
                    className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-teal-50 hover:text-teal-700 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export CSV (.csv)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Tabs Strip: Store | Agent | Transaction */}
        <div className="px-5 border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => switchTab('store')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'store'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Store</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('agent')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'agent'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Agent</span>
            <span
              className={`text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                activeTab === 'agent'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {counts.agents}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('transaction')}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'transaction'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Transaction</span>
            <span
              className={`text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${
                activeTab === 'transaction'
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {counts.transactions}
            </span>
          </button>
        </div>

        {/* =============================================================== */}
        {/* FILTER BAR PER TAB                                              */}
        {/* =============================================================== */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 space-y-3">
          {activeTab === 'store' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-52">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Provider
                </label>
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                >
                  <option value="">Select Provider</option>
                  {filtersMeta.providers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-44">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                />
              </div>

              <div className="w-full sm:w-44">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                />
              </div>

              <button
                type="button"
                onClick={handleApplySearch}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 text-teal-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Apply Search</span>
              </button>
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-44">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Team</label>
                <select
                  value={teamFilter}
                  onChange={(e) => setTeamFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                >
                  <option value="">Select Team</option>
                  {filtersMeta.teams.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-44">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Provider
                </label>
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                >
                  <option value="">Select Provider</option>
                  {filtersMeta.providers.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-48">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Rider name
                </label>
                <select
                  value={riderFilter}
                  onChange={(e) => setRiderFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                >
                  <option value="">Select Rider</option>
                  {filtersMeta.riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.enroll_id ? `(#${r.enroll_id})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-40">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                />
              </div>

              <div className="w-full sm:w-40">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                />
              </div>

              <button
                type="button"
                onClick={handleApplySearch}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 text-teal-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Apply Search</span>
              </button>
            </div>
          )}

          {activeTab === 'transaction' && (
            <>
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-full sm:w-40">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Team
                  </label>
                  <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  >
                    <option value="">Select Team</option>
                    {filtersMeta.teams.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-40">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Provider
                  </label>
                  <select
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  >
                    <option value="">Select Provider</option>
                    {filtersMeta.providers.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-40">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Trip Number
                  </label>
                  <input
                    type="text"
                    value={tripNumberFilter}
                    onChange={(e) => setTripNumberFilter(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleApplySearch();
                    }}
                    placeholder="Enter Number"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>

                <div className="w-full sm:w-44">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Rider name
                  </label>
                  <select
                    value={riderFilter}
                    onChange={(e) => setRiderFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  >
                    <option value="">Select Rider</option>
                    {filtersMeta.riders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-44">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  >
                    <option value="">Select Type</option>
                    {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleApplySearch}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 text-teal-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Apply Search</span>
                </button>
              </div>

              {/* Centered Advanced Search Toggle matching Screenshot 3 */}
              <div className="pt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSearch((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Advanced Search</span>
                  {showAdvancedSearch ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {showAdvancedSearch && (
                <div className="pt-3 border-t border-slate-200/70 flex flex-wrap items-end gap-3">
                  <div className="w-full sm:w-40">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                    />
                  </div>
                  <div className="w-full sm:w-40">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Award
                    </label>
                    <select
                      value={awardFilter}
                      onChange={(e) => setAwardFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                    >
                      <option value="">All</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Min Amount
                    </label>
                    <input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Max Amount
                    </label>
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      placeholder="10000"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* =============================================================== */}
        {/* DATA TABLES PER TAB                                             */}
        {/* =============================================================== */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-14 text-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-teal-600 mx-auto mb-2" />
              Loading accounting ledger...
            </div>
          ) : activeTab === 'store' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200">
                  <th className="px-5 py-3 w-1/2">
                    <SortHeader field="team_name" label="Team" />
                  </th>
                  <th className="px-5 py-3 w-1/2 border-l border-slate-200/70">
                    <SortHeader field="total_amount" label="Total Amount" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {/* Summary Row matching Screenshot 1 */}
                <tr className="bg-teal-50/40">
                  <td className="px-5 py-3.5 font-bold text-teal-700">All Stores Total</td>
                  <td className="px-5 py-3.5 font-bold text-teal-700 tabular-nums border-l border-slate-200/60">
                    {formatAmountEgp(storeGrandTotal)}
                  </td>
                </tr>

                {sortedStoreRows.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-10 text-center text-slate-400">
                      No store accounting records for the selected date range.
                    </td>
                  </tr>
                ) : (
                  sortedStoreRows.map((row) => (
                    <tr
                      key={row.team_name}
                      onClick={() => {
                        setTeamFilter(row.team_name);
                        setAppliedFilters((prev) => ({ ...prev, team: row.team_name }));
                        switchTab('agent');
                      }}
                      title="Click to inspect riders for this team"
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        <div>{row.team_name}</div>
                        <div className="text-[11px] font-normal text-slate-400 mt-0.5 tabular-nums">
                          {row.transactions_count} transaction{row.transactions_count === 1 ? '' : 's'}
                          {row.riders_count > 0 ? ` · ${row.riders_count} active riders` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 tabular-nums border-l border-slate-100">
                        {formatAmountEgp(row.total_amount, row.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : activeTab === 'agent' ? (
            <table className="w-full text-left border-collapse min-w-[820px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200">
                  <th className="px-4 py-3">
                    <SortHeader field="team_name" label="Team" />
                  </th>
                  <th className="px-4 py-3 border-l border-slate-200/60">
                    <SortHeader field="rider_name" label="Rider name" />
                  </th>
                  <th className="px-4 py-3 border-l border-slate-200/60">
                    <SortHeader field="enroll_id" label="Enroll ID" />
                  </th>
                  <th className="px-4 py-3 border-l border-slate-200/60">
                    <SortHeader field="total_amount" label="Total Amount" />
                  </th>
                  <th className="px-4 py-3 border-l border-slate-200/60">
                    <SortHeader field="payroll_method" label="Payroll Method" />
                  </th>
                  <th className="px-4 py-3 border-l border-slate-200/60">
                    <SortHeader field="payroll_method_number" label="Payroll Method Number" />
                  </th>
                  <th className="px-4 py-3 border-l border-slate-200/60 text-right w-40" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sortedAgentRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No riders found for the selected filters. Add riders in the Riders tab first.
                    </td>
                  </tr>
                ) : (
                  sortedAgentRows.map((agent) => (
                    <tr key={agent.rider_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {agent.team_name || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 border-l border-slate-100">
                        {agent.rider_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 tabular-nums border-l border-slate-100">
                        {agent.enroll_id || '—'}
                      </td>
                      <td
                        className={`px-4 py-3 font-semibold tabular-nums border-l border-slate-100 ${
                          agent.total_amount < 0 ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {formatAmountEgp(agent.total_amount, agent.currency)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 border-l border-slate-100">
                        {agent.payroll_method || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono tabular-nums border-l border-slate-100">
                        {agent.payroll_method_number || <span className="text-slate-300 font-sans">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right border-l border-slate-100">
                        <button
                          type="button"
                          onClick={() => openAddToWalletForAgent(agent)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add To Wallet</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <>
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700 w-12">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700 border-l border-slate-200/60">
                      Team
                    </th>
                    <th className="px-4 py-3 border-l border-slate-200/60">
                      <SortHeader field="created_at" label="Created Date" />
                    </th>
                    <th className="px-4 py-3 border-l border-slate-200/60">
                      <SortHeader field="rider_name" label="Rider name" />
                    </th>
                    <th className="px-4 py-3 border-l border-slate-200/60">
                      <SortHeader field="trip_number" label="Trip" />
                    </th>
                    <th className="px-4 py-3 border-l border-slate-200/60">
                      <SortHeader field="transaction_type" label="Type" />
                    </th>
                    <th className="px-4 py-3 border-l border-slate-200/60">
                      <SortHeader field="is_award" label="Award" />
                    </th>
                    <th className="px-4 py-3 border-l border-slate-200/60">
                      <SortHeader field="amount" label="Amount" />
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-700 border-l border-slate-200/60">
                      Notes
                    </th>
                    <th className="px-4 py-3 border-l border-slate-200/60 w-14 text-center" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedTxRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-5 py-12 text-center space-y-2">
                        <div className="text-slate-500 font-semibold">
                          No wallet transactions recorded yet
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Record rider collections, trip commissions, bonuses, or deductions using
                          the Add To Wallet button.
                        </p>
                        <button
                          type="button"
                          onClick={() => openAddToWalletForAgent(undefined)}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add First Transaction</span>
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedTxRows.map((tx, idx) => {
                      const rowNum = (txPage - 1) * TX_PAGE_SIZE + idx + 1;
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-slate-500 tabular-nums">{rowNum}</td>
                          <td className="px-4 py-3 font-medium text-slate-700 border-l border-slate-100">
                            {tx.team_name || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600 tabular-nums whitespace-nowrap border-l border-slate-100">
                            {formatShortDateTime(tx.created_at)}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900 border-l border-slate-100">
                            {tx.rider_name}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700 tabular-nums border-l border-slate-100">
                            {tx.trip_number || '—'}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700 border-l border-slate-100">
                            {tx.transaction_type}
                          </td>
                          <td className="px-4 py-3 border-l border-slate-100">
                            <span
                              className={`font-semibold ${
                                tx.is_award ? 'text-emerald-700' : 'text-slate-500'
                              }`}
                            >
                              {tx.is_award ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td
                            className={`px-4 py-3 font-semibold tabular-nums whitespace-nowrap border-l border-slate-100 ${
                              tx.amount < 0 ? 'text-rose-600' : 'text-slate-900'
                            }`}
                          >
                            {formatAmountEgp(tx.amount, tx.currency)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-[220px] truncate border-l border-slate-100">
                            {tx.notes || 'N/A'}
                          </td>
                          <td className="px-3 py-2.5 text-center border-l border-slate-100">
                            <button
                              type="button"
                              onClick={() => setDeleteTxTarget(tx)}
                              title="Delete Transaction"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination Footer */}
              {sortedTxRows.length > TX_PAGE_SIZE && (
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="tabular-nums">
                    Showing {(txPage - 1) * TX_PAGE_SIZE + 1}–
                    {Math.min(txPage * TX_PAGE_SIZE, sortedTxRows.length)} of {sortedTxRows.length}{' '}
                    transactions
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={txPage <= 1}
                      onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="px-2 tabular-nums font-semibold text-slate-700">
                      {txPage} / {txTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={txPage >= txTotalPages}
                      onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* ADD TO WALLET MODAL                                               */}
      {/* ================================================================= */}
      {walletModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Add To Wallet</h3>
              </div>
              <button
                type="button"
                onClick={() => setWalletModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWalletTransaction} className="p-5 space-y-4">
              {/* Rider Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rider <span className="text-rose-500">*</span>
                </label>
                <select
                  value={walletForm.rider_id}
                  onChange={(e) => handleWalletRiderSelect(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                >
                  <option value="">Select Rider</option>
                  {filtersMeta.riders.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.team_name ? `— ${r.team_name}` : ''}{' '}
                      {r.enroll_id ? `(#${r.enroll_id})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Transaction Type *
                  </label>
                  <select
                    value={walletForm.transaction_type}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setWalletForm((p) => ({
                        ...p,
                        transaction_type: nextType,
                        is_award: nextType !== 'DEDUCTION' && nextType !== 'SETTLEMENT'
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  >
                    {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (EGP) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={walletForm.amount}
                    onChange={(e) => setWalletForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder={
                      walletForm.transaction_type === 'DEDUCTION'
                        ? 'e.g. 50 (deducted automatically)'
                        : 'e.g. 150'
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Trip Number & Award */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trip Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={walletForm.trip_number}
                    onChange={(e) => setWalletForm((p) => ({ ...p, trip_number: e.target.value }))}
                    placeholder="e.g. anRF-807"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Award</label>
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setWalletForm((p) => ({ ...p, is_award: true }))}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        walletForm.is_award
                          ? 'border-teal-600 bg-teal-50 text-teal-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletForm((p) => ({ ...p, is_award: false }))}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        !walletForm.is_award
                          ? 'border-slate-600 bg-slate-100 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={walletForm.notes}
                  onChange={(e) => setWalletForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Collection note, commission details, or adjustment reason..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                />
              </div>

              {/* Rider Payroll Payout Info (optional quick update) */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Payroll Method
                  </label>
                  <select
                    value={walletForm.payroll_method}
                    onChange={(e) =>
                      setWalletForm((p) => ({ ...p, payroll_method: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  >
                    <option value="">Not Set</option>
                    {PAYROLL_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Payroll Method Number
                  </label>
                  <input
                    type="text"
                    value={walletForm.payroll_method_number}
                    onChange={(e) =>
                      setWalletForm((p) => ({ ...p, payroll_method_number: e.target.value }))
                    }
                    placeholder="Wallet phone or IBAN"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save To Wallet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* DELETE TRANSACTION CONFIRMATION MODAL                             */}
      {/* ================================================================= */}
      {deleteTxTarget && (
        <div className="fixed inset-0 z-[150] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Delete Transaction</h3>
              <button
                type="button"
                onClick={() => setDeleteTxTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete this wallet transaction of{' '}
                <strong className="text-slate-900 tabular-nums">
                  {formatAmountEgp(deleteTxTarget.amount, deleteTxTarget.currency)}
                </strong>{' '}
                for <strong className="text-slate-900">{deleteTxTarget.rider_name}</strong>?
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTxTarget(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDeleteTransaction(deleteTxTarget)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
