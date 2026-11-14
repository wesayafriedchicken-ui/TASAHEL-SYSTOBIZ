import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, ArrowDown, GripVertical, CheckCircle2, 
  SlidersHorizontal, ChevronRight, Check
} from 'lucide-react';
import { AccountingPageHeader } from '../components/AccountingPageHeader';
import { DEFAULT_TAXES_LIST, TaxRecord } from './TaxDetailPage';
import { cn } from '../../../lib/utils';

export const TaxesPage: React.FC = () => {
  const navigate = useNavigate();

  // Load taxes from localStorage or fallback to initial list matching Image 1
  const [taxes, setTaxes] = useState<TaxRecord[]>(() => {
    try {
      const saved = localStorage.getItem('acct_taxes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_TAXES_LIST;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Sales' | 'Purchases'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter taxes
  const filtered = taxes.filter(t => {
    if (typeFilter !== 'all' && t.tax_type !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.tax_name.toLowerCase().includes(q) || 
           (t.description && t.description.toLowerCase().includes(q)) ||
           (t.label_on_invoices && t.label_on_invoices.toLowerCase().includes(q));
  });

  // Toggle active status for tax row (Matching Image 1)
  const handleToggleActive = (e: React.MouseEvent, taxId: string) => {
    e.stopPropagation();
    const updated = taxes.map(t => {
      if (t.id === taxId) {
        return { ...t, active: !t.active };
      }
      return t;
    });

    setTaxes(updated);
    try {
      localStorage.setItem('acct_taxes', JSON.stringify(updated));
      const target = updated.find(t => t.id === taxId);
      setToastMessage(`Tax "${target?.tax_name}" is now ${target?.active ? 'Active' : 'Archived'}.`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      // error saving
    }
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e: React.MouseEvent, taxId: string) => {
    e.stopPropagation();
    if (selectedIds.includes(taxId)) {
      setSelectedIds(selectedIds.filter(id => id !== taxId));
    } else {
      setSelectedIds([...selectedIds, taxId]);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <AccountingPageHeader
        breadcrumbs={[
          { label: 'Configuration', href: '/accounting/configuration/settings' },
          { label: 'Taxes' }
        ]}
        title="Taxes"
        badge={`${taxes.length} Taxes`}
        primaryAction={{
          label: 'New Tax',
          onClick: () => navigate('/accounting/configuration/taxes/new'),
          icon: <Plus className="w-4 h-4" />
        }}
      />

      {/* Filter and Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tax name, description or label..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Type:</span>
          {(['all', 'Sales', 'Purchases'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors capitalize cursor-pointer",
                typeFilter === t
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {t === 'all' ? 'All Taxes' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table (Matching Image 1 Exactly) */}
      <div className="p-6 flex-1">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {/* Select All Checkbox */}
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-[#007A78] focus:ring-[#007A78] cursor-pointer"
                  />
                </th>
                {/* Drag Handle Column */}
                <th className="py-3 px-1 w-6"></th>
                <th className="py-3 px-4 w-44">Tax Name</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 w-32">Tax Type</th>
                <th className="py-3 px-4 w-32">
                  <div className="flex items-center gap-1">
                    <span>Tax Scope</span>
                    <ArrowDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 w-40">Label on Invoices</th>
                {/* Active Toggle Switch Column */}
                <th className="py-3 px-4 w-24 text-center">Active</th>
                {/* Settings / Customize Column Icon */}
                <th className="py-3 px-3 w-8 text-center text-slate-400">
                  <SlidersHorizontal className="w-3.5 h-3.5 inline-block" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((tax) => {
                const isSelected = selectedIds.includes(tax.id);

                return (
                  <tr 
                    key={tax.id}
                    onClick={() => navigate(`/accounting/configuration/taxes/${encodeURIComponent(tax.id)}`)}
                    className={cn(
                      "hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group",
                      isSelected && "bg-slate-50/70 dark:bg-slate-850"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="py-3 px-3" onClick={(e) => handleSelectOne(e, tax.id)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-[#007A78] focus:ring-[#007A78] cursor-pointer"
                      />
                    </td>

                    {/* Drag Handle */}
                    <td className="py-3 px-1 text-slate-300 dark:text-slate-600">
                      <GripVertical className="w-3.5 h-3.5" />
                    </td>

                    {/* Tax Name */}
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white group-hover:text-[#007A78] dark:group-hover:text-emerald-400 transition-colors">
                      {tax.tax_name}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                      {tax.description || ''}
                    </td>

                    {/* Tax Type */}
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">
                      {tax.tax_type}
                    </td>

                    {/* Tax Scope */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {tax.tax_scope || ''}
                    </td>

                    {/* Label on Invoices */}
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {tax.label_on_invoices || tax.tax_name}
                    </td>

                    {/* Active Toggle Switch (Matching Image 1) */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleActive(e, tax.id)}
                          aria-label={`Toggle active for ${tax.tax_name}`}
                          className={cn(
                            "w-8 h-4 rounded-full transition-all relative cursor-pointer focus:outline-none",
                            tax.active 
                              ? "bg-[#00a86b] dark:bg-emerald-500" 
                              : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600"
                          )}
                        >
                          <span 
                            className={cn(
                              "w-3 h-3 rounded-full transition-transform absolute top-0.5",
                              tax.active 
                                ? "bg-white shadow-xs right-0.5" 
                                : "bg-slate-400 dark:bg-slate-400 left-0.5"
                            )} 
                          />
                        </button>
                      </div>
                    </td>

                    {/* Arrow / Right */}
                    <td className="py-3 px-3 text-right">
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default TaxesPage;
