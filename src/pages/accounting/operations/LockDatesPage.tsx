import React, { useState } from 'react';
import { Lock, Save, ShieldAlert, CheckCircle2, Calendar } from 'lucide-react';
import { AccountingPageHeader } from '../components/AccountingPageHeader';

export const LockDatesPage: React.FC = () => {
  const [nonAdvisersDate, setNonAdvisersDate] = useState('2026-08-31');
  const [allUsersDate, setAllUsersDate] = useState('2025-12-31');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-50/60 dark:bg-slate-950">
      <AccountingPageHeader
        breadcrumbs={[
          { label: 'Accounting', href: '/accounting/operations/journal-entries' },
          { label: 'Lock Dates' }
        ]}
        title="Fiscal Lock Dates"
        badge="Governance"
      />

      <div className="p-6 max-w-3xl mx-auto w-full flex-1">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Fiscal Closing & Lock Dates
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Prevent retroactive edits to verified journal entries and closed fiscal periods.
              </p>
            </div>
          </div>

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Fiscal lock dates updated successfully. Past entries are now protected.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Lock Date for Non-Advisers (All Regular Users)
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Prevents operational staff from creating or modifying invoices, bills, and payments on or prior to this date.
                </p>
                <input
                  type="date"
                  value={nonAdvisersDate}
                  onChange={(e) => setNonAdvisersDate(e.target.value)}
                  className="p-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Hard Lock Date for All Users (Including Accounting Advisers)
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Completely closes the fiscal year. No user, regardless of permissions, can post entries prior to this date without lifting the lock.
                </p>
                <input
                  type="date"
                  value={allUsersDate}
                  onChange={(e) => setAllUsersDate(e.target.value)}
                  className="p-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Lock Dates</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LockDatesPage;
