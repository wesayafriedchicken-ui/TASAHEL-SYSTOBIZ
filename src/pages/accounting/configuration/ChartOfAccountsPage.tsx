import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, CheckCircle2, ChevronRight } from 'lucide-react';
import { AccountingPageHeader } from '../components/AccountingPageHeader';
import { DEFAULT_COA } from '../../../components/Accounting/AccountingSeeds';
import { cn } from '../../../lib/utils';

export const ChartOfAccountsPage: React.FC = () => {
  const navigate = useNavigate();

  // Load accounts from localStorage or seed
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('acct_coa');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure payment_reconciliation exists on all accounts
        return parsed.map((a: any) => ({
          ...a,
          payment_reconciliation: a.payment_reconciliation ?? (
            // Default to true for Receivable, Payable, and Bank/Cash accounts
            a.id === '10100' || a.id === '10200' || a.id === '10300' || 
            a.id === '10400' || a.id === '20100' || a.id === '20200'
          )
        }));
      }
    } catch (e) {
      // fallback
    }

    // Default COA with initial payment reconciliation state matching standard accounting
    return DEFAULT_COA.map((a: any) => ({
      ...a,
      payment_reconciliation: (
        a.id === '10100' || a.id === '10200' || a.id === '10300' || 
        a.id === '10400' || a.id === '20100' || a.id === '20200'
      )
    }));
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter accounts
  const filtered = accounts.filter((a: any) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return a.id.toLowerCase().includes(q) || 
           a.name_en.toLowerCase().includes(q) || 
           (a.name_ar && a.name_ar.toLowerCase().includes(q));
  });

  // Toggle Payment Reconciliation for an account (Matching Image 1)
  const handleToggleReconciliation = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation(); // Prevent opening account details
    
    const updated = accounts.map((acc: any) => {
      if (acc.id === accountId) {
        return { ...acc, payment_reconciliation: !acc.payment_reconciliation };
      }
      return acc;
    });

    setAccounts(updated);
    try {
      localStorage.setItem('acct_coa', JSON.stringify(updated));
      const target = updated.find((a: any) => a.id === accountId);
      setToastMessage(`Payment Reconciliation ${target?.payment_reconciliation ? 'enabled' : 'disabled'} for ${accountId}`);
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err) {
      // error saving
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

      {/* Header */}
      <AccountingPageHeader
        breadcrumbs={[
          { label: 'Configuration', href: '/accounting/configuration/settings' },
          { label: 'Chart of Accounts' }
        ]}
        title="Chart of Accounts"
        badge={`${accounts.length} Accounts`}
        primaryAction={{
          label: 'New Account',
          onClick: () => navigate('/accounting/configuration/chart-of-accounts/new'),
          icon: <Plus className="w-4 h-4" />
        }}
      />

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code or account title..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Type:</span>
          {['all', 'assets', 'liabilities', 'equity', 'revenue', 'expenses'].map((t) => (
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
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area (Replaced Status column with Payment Reconciliation matching Image 1) */}
      <div className="p-6 flex-1">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">
                <th className="py-3 px-4 w-28">Code</th>
                <th className="py-3 px-4">Account Name (EN)</th>
                <th className="py-3 px-4">Account Name (AR)</th>
                <th className="py-3 px-4 w-36">Category Type</th>
                {/* Replaced Status with Payment Reconciliation matching Image 1 */}
                <th className="py-3 px-4 w-44 text-center">Payment Reconciliation</th>
                <th className="py-3 px-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map((acc: any) => {
                const isReconciled = Boolean(acc.payment_reconciliation);

                return (
                  <tr 
                    key={acc.id} 
                    onClick={() => navigate(`/accounting/configuration/chart-of-accounts/${encodeURIComponent(acc.id)}`)}
                    className="hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                      {acc.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {acc.name_en}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium" dir="rtl">
                      {acc.name_ar || '—'}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {acc.type}
                      </span>
                    </td>

                    {/* Payment Reconciliation Toggle Column (Exact Replica of Image 1) */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleReconciliation(e, acc.id)}
                          aria-label={`Toggle Payment Reconciliation for ${acc.id}`}
                          title={`Payment Reconciliation is ${isReconciled ? 'Enabled' : 'Disabled'}. Click to toggle.`}
                          className={cn(
                            "w-8 h-4 rounded-full transition-all relative cursor-pointer focus:outline-none",
                            isReconciled 
                              ? "bg-[#00a86b] dark:bg-emerald-500" 
                              : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600"
                          )}
                        >
                          <span 
                            className={cn(
                              "w-3 h-3 rounded-full transition-transform absolute top-0.5",
                              isReconciled 
                                ? "bg-white shadow-xs right-0.5" 
                                : "bg-slate-400 dark:bg-slate-400 left-0.5"
                            )} 
                          />
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
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

export default ChartOfAccountsPage;
