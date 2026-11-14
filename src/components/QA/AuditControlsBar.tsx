import React, { useState, useRef, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  RefreshCw, 
  LayoutGrid, 
  List as ListIcon, 
  ChevronDown, 
  X, 
  RotateCcw,
  Check,
  Plus,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { QAAdvancedFilter } from './QAAdvancedFilter';

export type DatePreset = 'all' | 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'custom';

export interface AuditFilterState {
  searchQuery: string;
  deptFilter: string;
  approvalFilter: string;
  qaStatusFilter: string;
  slaFilter: string;
  datePreset: DatePreset;
  startDate: string;
  endDate: string;
}

interface AuditControlsBarProps {
  viewMode: 'list' | 'board';
  onViewModeChange: (mode: 'list' | 'board') => void;
  filters: AuditFilterState;
  onFilterChange: (updates: Partial<AuditFilterState>) => void;
  onResetFilters: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  departments?: string[];
  hideQaFilters?: boolean;
  totalCount?: number;
  showQAPassFilter?: boolean;
  showSLAFilter?: boolean;
  items?: any[];
  onAdvancedFilter?: (filteredItems: any[] | null, activeCount: number) => void;
  onNewItem?: () => void;
  newItemLabel?: string;
  onImport?: () => void;
  importing?: boolean;
  importTooltip?: string;
  onExport?: () => void;
  exportTooltip?: string;
}

export const AuditControlsBar: React.FC<AuditControlsBarProps> = ({
  viewMode,
  onViewModeChange,
  filters,
  onFilterChange,
  onResetFilters,
  onRefresh = () => {},
  loading = false,
  departments = ['Operations', 'Sales', 'Customer Service', 'System', 'Finance'],
  hideQaFilters = false,
  totalCount,
  showQAPassFilter = true,
  showSLAFilter = true,
  items,
  onAdvancedFilter,
  onNewItem,
  newItemLabel,
  onImport,
  importing = false,
  importTooltip,
  onExport,
  exportTooltip,
}) => {
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const dateRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setIsDateOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = dateStr.split('-');
      if (y && m && d) return `${d}/${m}/${y}`;
      const dt = new Date(dateStr);
      return dt.toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  const getDateRangeDisplay = () => {
    if (filters.startDate && filters.endDate) {
      return `${formatDateLabel(filters.startDate)} - ${formatDateLabel(filters.endDate)}`;
    }
    if (filters.startDate) return `From ${formatDateLabel(filters.startDate)}`;
    if (filters.endDate) return `Until ${formatDateLabel(filters.endDate)}`;
    if (filters.datePreset === 'today') return 'Today';
    if (filters.datePreset === 'yesterday') return 'Yesterday';
    if (filters.datePreset === 'last7') return 'Last 7 Days';
    if (filters.datePreset === 'last30') return 'Last 30 Days';
    if (filters.datePreset === 'thisMonth') return 'This Month';
    return 'All Dates';
  };

  const handleDatePresetSelect = (preset: DatePreset) => {
    const now = new Date();
    const toYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (preset === 'all') {
      onFilterChange({ datePreset: 'all', startDate: '', endDate: '' });
    } else if (preset === 'today') {
      const today = toYMD(now);
      onFilterChange({ datePreset: 'today', startDate: today, endDate: today });
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yesterday = toYMD(y);
      onFilterChange({ datePreset: 'yesterday', startDate: yesterday, endDate: yesterday });
    } else if (preset === 'last7') {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      onFilterChange({ datePreset: 'last7', startDate: toYMD(past), endDate: toYMD(now) });
    } else if (preset === 'last30') {
      const past = new Date(now);
      past.setDate(past.getDate() - 29);
      onFilterChange({ datePreset: 'last30', startDate: toYMD(past), endDate: toYMD(now) });
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      onFilterChange({ datePreset: 'thisMonth', startDate: toYMD(firstDay), endDate: toYMD(now) });
    } else {
      onFilterChange({ datePreset: 'custom' });
    }
  };

  // Count active non-default filters
  const activeFiltersCount = [
    filters.deptFilter !== 'All',
    filters.approvalFilter !== 'All',
    filters.qaStatusFilter !== 'All',
    filters.slaFilter !== 'All',
    Boolean(filters.startDate || filters.endDate || (filters.datePreset && filters.datePreset !== 'all'))
  ].filter(Boolean).length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
      
      {/* Left: Date Range Button & Filter Popover */}
      <div className="flex items-center gap-2 flex-wrap">
        
        {/* Date Range Pill */}
        <div className="relative" ref={dateRef}>
          <button
            type="button"
            onClick={() => {
              setIsDateOpen(!isDateOpen);
              setIsFilterOpen(false);
            }}
            className={`px-3.5 py-1.5 rounded-xl border font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
              filters.startDate || filters.endDate || filters.datePreset !== 'all'
                ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] whitespace-nowrap">{getDateRangeDisplay()}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {/* Date Range Dropdown Popover */}
          {isDateOpen && (
            <div className="absolute top-full left-0 mt-1.5 z-40 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[11px] font-bold text-slate-900">Select Date Range</span>
                {(filters.startDate || filters.endDate || filters.datePreset !== 'all') && (
                  <button
                    onClick={() => handleDatePresetSelect('all')}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: 'yesterday', label: 'Yesterday' },
                  { id: 'last7', label: 'Last 7 Days' },
                  { id: 'last30', label: 'Last 30 Days' },
                  { id: 'thisMonth', label: 'This Month' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleDatePresetSelect(p.id as DatePreset)}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                      filters.datePreset === p.id && !filters.startDate
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Pickers */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Custom Range</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">From</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => onFilterChange({ startDate: e.target.value, datePreset: 'custom' })}
                      className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">To</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => onFilterChange({ endDate: e.target.value, datePreset: 'custom' })}
                      className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDateOpen(false)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filters Button / Advanced Filter */}
        {items && onAdvancedFilter ? (
          <QAAdvancedFilter
            items={items}
            onFilter={(filtered, activeCount) => {
              onAdvancedFilter(filtered, activeCount);
            }}
            title="Advanced Filter Records"
            buttonLabel="Filters"
          />
        ) : (
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => {
                setIsFilterOpen(!isFilterOpen);
                setIsDateOpen(false);
              }}
              className={`px-3.5 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                activeFiltersCount > 0
                  ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px]">Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Filters Dropdown Popover */}
            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-[100] w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-bold text-slate-900">Filter Records</span>
                  <button
                    onClick={() => {
                      onResetFilters();
                      setIsFilterOpen(false);
                    }}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Department Filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Department</label>
                  <select
                    value={filters.deptFilter}
                    onChange={(e) => onFilterChange({ deptFilter: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 outline-none focus:bg-white"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Approval Filter */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Manager Review</label>
                  <select
                    value={filters.approvalFilter}
                    onChange={(e) => onFilterChange({ approvalFilter: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-800 outline-none focus:bg-white"
                  >
                    <option value="All">All Approvals</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending Approval</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* QA Status & SLA Filter */}
                {!hideQaFilters && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">QA Status</label>
                      <select
                        value={filters.qaStatusFilter}
                        onChange={(e) => onFilterChange({ qaStatusFilter: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-800 outline-none focus:bg-white"
                      >
                        <option value="All">All QA</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">SLA Status</label>
                      <select
                        value={filters.slaFilter}
                        onChange={(e) => onFilterChange({ slaFilter: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-800 outline-none focus:bg-white"
                      >
                        <option value="All">All SLA</option>
                        <option value="Met SLA">Met SLA</option>
                        <option value="Breached SLA">Breached SLA</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions, Refresh & View Switcher (List vs Board) */}
      <div className="flex items-center gap-2">
        {/* New Item Action Button */}
        {onNewItem && (
          <button
            type="button"
            onClick={onNewItem}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{newItemLabel || 'New Incident Audit'}</span>
          </button>
        )}

        {/* Pull Orders / Import Sheet (Icon only) */}
        {onImport && (
          <button
            type="button"
            onClick={onImport}
            disabled={importing}
            title={importTooltip || "Pull Orders / Import Sheet"}
            aria-label={importTooltip || "Pull Orders / Import Sheet"}
            className="p-2 bg-slate-50/90 hover:bg-slate-100 border border-slate-200/90 text-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 flex items-center justify-center shrink-0"
          >
            <Download className={`w-3.5 h-3.5 text-indigo-600 ${importing ? 'animate-bounce' : ''}`} />
          </button>
        )}

        {/* Export Excel (Icon only) */}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            title={exportTooltip || "Export to Excel / CSV"}
            aria-label={exportTooltip || "Export to Excel / CSV"}
            className="p-2 bg-slate-50/90 hover:bg-slate-100 border border-slate-200/90 text-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center justify-center shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          </button>
        )}

        {/* Refresh Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="px-3.5 py-1.5 bg-slate-50/90 hover:bg-slate-100 border border-slate-200/90 text-slate-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        {/* View Switcher Segmented Control */}
        <div className="bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 flex items-center">
          <button
            type="button"
            onClick={() => onViewModeChange('board')}
            title="Board / Cards View"
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'board'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            title="List Table View"
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              viewMode === 'list'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
