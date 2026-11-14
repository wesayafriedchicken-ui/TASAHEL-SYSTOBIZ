import React, { useState } from 'react';
import { 
  CheckCircle2, ArrowRight, RefreshCw, Sparkles, 
  HelpCircle, Building2, Check, X, Filter 
} from 'lucide-react';
import { AccountingPageHeader } from '../components/AccountingPageHeader';
import { cn } from '../../../lib/utils';

export const ReconcilePage: React.FC = () => {
  const [activeBank, setActiveBank] = useState('National Bank of Egypt');
  const [reconciledCount, setReconciledCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [statementLines, setStatementLines] = useState([
    {
      id: 1,
      date: '2026-10-01',
      label: 'Transfer from Al-Madina Hypermarkets',
      partner: 'Al-Madina Hypermarkets',
      amount: 10000.00,
      matchedInvoice: 'INV/2026/0001 (14,500.00 LE)',
      status: 'Ready to Validate'
    },
    {
      id: 2,
      date: '2026-10-02',
      label: 'Direct Debit AWS Cloud Hosting',
      partner: 'Amazon Web Services EMEA',
      amount: -3450.00,
      matchedInvoice: 'BILL/2026/0012 (3,450.00 LE)',
      status: 'Ready to Validate'
    },
    {
      id: 3,
      date: '2026-10-03',
      label: 'Payment Delta Engineering LLC',
      partner: 'Delta Engineering LLC',
      amount: 8200.00,
      matchedInvoice: 'INV/2026/0002 (8,200.00 LE)',
      status: 'Ready to Validate'
    }
  ]);

  const handleValidate = (id: number) => {
    setStatementLines(prev => prev.filter(item => item.id !== id));
    setReconciledCount(prev => prev + 1);
    setToastMessage('Transaction validated and reconciled with ledger.');
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-50/60 dark:bg-slate-950 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>{toastMessage}</span>
        </div>
      )}

      <AccountingPageHeader
        breadcrumbs={[
          { label: 'Accounting', href: '/accounting/operations/journal-entries' },
          { label: 'Bank Reconciliation' }
        ]}
        title="Bank Reconciliation"
        badge="Odoo Matcher"
        primaryAction={{
          label: 'Auto-Reconcile AI',
          onClick: () => {
            const count = statementLines.length;
            setStatementLines([]);
            setReconciledCount(prev => prev + count);
            setToastMessage(`${count} bank statement lines auto-reconciled with matching ledger items.`);
            setTimeout(() => setToastMessage(null), 4000);
          },
          icon: <Sparkles className="w-4 h-4" />
        }}
        secondaryAction={{
          label: 'Import Bank Statement',
          onClick: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.ofx, .csv, .xml, .camt';
            input.onchange = (ev: any) => {
              const file = ev.target?.files?.[0];
              if (file) {
                setToastMessage(`Bank statement "${file.name}" imported and parsed.`);
                setTimeout(() => setToastMessage(null), 4000);
              }
            };
            input.click();
          }
        }}
      />

      <div className="p-6 space-y-6 flex-1 max-w-6xl mx-auto w-full">
        {/* Bank selection tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {['National Bank of Egypt', 'Commercial International Bank (CIB)', 'Cash Drawer'].map((bank) => (
              <button
                key={bank}
                type="button"
                onClick={() => setActiveBank(bank)}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                  activeBank === bank
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                )}
              >
                {bank}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-500 font-semibold">
            {reconciledCount > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-2">
                ✓ {reconciledCount} reconciled today
              </span>
            )}
            <span>{statementLines.length} pending statements</span>
          </div>
        </div>

        {/* Reconciliation Cards */}
        {statementLines.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              All Items Reconciled!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Your bank statements for <strong>{activeBank}</strong> are fully balanced and matched with all invoices and bills.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {statementLines.map((line) => (
              <div 
                key={line.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all grid grid-cols-1 md:grid-cols-12 gap-4 items-center"
              >
                {/* Bank Statement Line */}
                <div className="md:col-span-5 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">{line.date}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Bank Statement
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {line.label}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Partner: {line.partner}
                  </p>
                </div>

                {/* Amount */}
                <div className="md:col-span-2 text-right md:text-center">
                  <span className={cn(
                    "text-sm font-black font-mono",
                    line.amount > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                  )}>
                    {line.amount > 0 ? `+${line.amount.toLocaleString()} LE` : `${line.amount.toLocaleString()} LE`}
                  </span>
                </div>

                {/* Matched Ledger Entry */}
                <div className="md:col-span-4 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-3 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Auto-Matched Ledger Rule</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {line.matchedInvoice}
                  </p>
                </div>

                {/* Action button */}
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleValidate(line.id)}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer active:scale-95"
                    title="Validate & Reconcile"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReconcilePage;
