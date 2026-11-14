import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Download, Upload, 
  ArrowUpDown, MoreHorizontal, CheckCircle2, Clock, 
  AlertCircle, FileText, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AccountingPageHeader, BreadcrumbItem } from './AccountingPageHeader';

export interface TableColumn<T = any> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface AccountingPlaceholderViewProps<T = any> {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  badge?: string;
  entityName: string;
  columns?: TableColumn<T>[];
  initialData?: T[];
  emptyDescription?: string;
  createFormFields?: Array<{
    name: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'select';
    options?: string[];
    defaultValue?: any;
    placeholder?: string;
  }>;
}

export function AccountingPlaceholderView<T extends Record<string, any>>({
  breadcrumbs,
  title,
  badge,
  entityName,
  columns,
  initialData = [],
  emptyDescription,
  createFormFields = [
    { name: 'reference', label: 'Reference / Number', placeholder: 'e.g. INV/2026/001' },
    { name: 'partner', label: 'Customer / Vendor / Account', placeholder: 'e.g. Al-Noor Global Trading' },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'amount', label: 'Total Amount (LE / SAR)', type: 'number', placeholder: '0.00' },
    { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Posted', 'Paid', 'Cancelled'] }
  ]
}: AccountingPlaceholderViewProps<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'pivot' | 'graph'>('list');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Default columns if not provided
  const resolvedColumns: TableColumn<T>[] = columns || [
    {
      key: 'reference',
      label: 'Number / Ref',
      render: (row) => (
        <span className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer">
          {row.reference || row.name || row.code || `REF-${Math.floor(1000 + Math.random() * 9000)}`}
        </span>
      )
    },
    {
      key: 'partner',
      label: 'Partner / Account',
      render: (row) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {row.partner || row.customer || row.vendor || row.account || 'Standard General Partner'}
        </span>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs">
          {row.date || new Date().toISOString().split('T')[0]}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Total',
      align: 'right',
      render: (row) => (
        <span className="font-mono font-bold text-slate-900 dark:text-white">
          {typeof row.amount === 'number' 
            ? `${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} LE` 
            : (row.amount || '0.00 LE')}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (row) => {
        const s = (row.status || 'Draft').toLowerCase();
        let colorClasses = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
        if (s.includes('paid') || s.includes('posted') || s.includes('active') || s.includes('reconciled')) {
          colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800';
        } else if (s.includes('draft') || s.includes('pending')) {
          colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800';
        } else if (s.includes('cancel') || s.includes('fail')) {
          colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
        }
        return (
          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", colorClasses)}>
            {row.status || 'Draft'}
          </span>
        );
      }
    }
  ];

  const filteredData = data.filter(item => {
    if (statusFilter !== 'all') {
      const s = (item.status || '').toLowerCase();
      if (!s.includes(statusFilter.toLowerCase())) return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(item).some(val => 
      String(val || '').toLowerCase().includes(q)
    );
  });

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((_, idx) => idx)));
    }
  };

  const toggleSelectRow = (idx: number) => {
    const next = new Set(selectedIds);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIds(next);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem = {
      id: Date.now(),
      reference: formData.reference || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      partner: formData.partner || 'New Business Account',
      date: formData.date || new Date().toISOString().split('T')[0],
      amount: parseFloat(formData.amount) || 0,
      status: formData.status || 'Draft',
      ...formData
    } as unknown as T;

    setData([newItem, ...data]);
    setShowCreateModal(false);
    setFormData({});
    setToastMessage(`Created new ${entityName} successfully.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-50/60 dark:bg-slate-950 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Odoo Style Breadcrumb & Actions Bar */}
      <AccountingPageHeader
        breadcrumbs={breadcrumbs}
        title={title}
        badge={badge}
        count={filteredData.length}
        primaryAction={{
          label: `New ${entityName}`,
          onClick: () => setShowCreateModal(true),
          icon: <Plus className="w-4 h-4" />
        }}
        secondaryAction={{
          label: 'Upload / Import',
          onClick: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv, .xlsx, .pdf';
            input.onchange = (ev: any) => {
              const file = ev.target?.files?.[0];
              if (file) {
                setToastMessage(`File "${file.name}" received for OCR ingestion and automatic entry generation.`);
                setTimeout(() => setToastMessage(null), 5000);
              }
            };
            input.click();
          }
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Filter / Sub-header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 dark:focus:border-emerald-400 font-medium text-slate-900 dark:text-slate-100"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {['all', 'draft', 'posted', 'paid'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors capitalize cursor-pointer",
                statusFilter === st
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6">
        {filteredData.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800/80">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No {title} Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {emptyDescription || `Create your first ${entityName.toLowerCase()} or upload files to start recording transactions.`}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create {entityName}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </th>
                    {resolvedColumns.map((col) => (
                      <th
                        key={col.key}
                        className={cn(
                          "py-3 px-4",
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                          col.className
                        )}
                      >
                        <div className={cn(
                          "flex items-center gap-1.5",
                          col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                        )}>
                          <span>{col.label}</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100 cursor-pointer" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredData.map((row, idx) => {
                    const isSelected = selectedIds.has(idx);
                    return (
                      <tr
                        key={idx}
                        className={cn(
                          "transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50 cursor-pointer",
                          isSelected && "bg-emerald-50/40 dark:bg-emerald-950/30"
                        )}
                        onClick={() => toggleSelectRow(idx)}
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(idx)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        {resolvedColumns.map((col) => (
                          <td
                            key={col.key}
                            className={cn(
                              "py-3 px-4",
                              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                              col.className
                            )}
                          >
                            {col.render ? col.render(row) : (row[col.key] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Showing <strong>{filteredData.length}</strong> of <strong>{data.length}</strong> {title.toLowerCase()}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-bold text-slate-700 dark:text-slate-200">1</span>
                <button
                  type="button"
                  disabled
                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create New Record */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  New {entityName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill in the details to create a new {entityName.toLowerCase()} record.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              {createFormFields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {field.label}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={formData[field.name] || field.options?.[0] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full text-xs font-semibold p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Save & Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
