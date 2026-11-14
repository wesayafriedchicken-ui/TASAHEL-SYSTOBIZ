import React, { useState } from 'react';
import { 
  BarChart2, FileText, Download, Printer, Filter, 
  TrendingUp, Calendar, ArrowUpRight, ArrowDownRight,
  ChevronDown, Table, Layers
} from 'lucide-react';
import { AccountingPageHeader } from '../components/AccountingPageHeader';
import { cn } from '../../../lib/utils';

export const ReportingPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<'balance-sheet' | 'pnl' | 'cash-flow' | 'tax-report'>('balance-sheet');
  const [dateRange, setDateRange] = useState('This Fiscal Year');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleExport = () => {
    setToastMessage('Financial report generated and export prepared (PDF / XLSX).');
    setTimeout(() => setToastMessage(null), 4000);
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
        breadcrumbs={[{ label: 'Reporting' }]}
        title="Financial Statements & Management Reports"
        badge="Audit-Grade"
        primaryAction={{
          label: 'Export PDF / XLSX',
          onClick: handleExport,
          icon: <Download className="w-4 h-4" />
        }}
        secondaryAction={{
          label: 'Print Report',
          onClick: () => window.print(),
          icon: <Printer className="w-3.5 h-3.5" />
        }}
      />

      {/* Report Switcher Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'balance-sheet', label: 'Balance Sheet' },
            { id: 'pnl', label: 'Profit & Loss (P&L)' },
            { id: 'cash-flow', label: 'Cash Flow Statement' },
            { id: 'tax-report', label: 'Tax Report (VAT)' }
          ].map((rep) => (
            <button
              key={rep.id}
              type="button"
              onClick={() => setActiveReport(rep.id as any)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0",
                activeReport === rep.id
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {rep.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold">Period:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
          >
            <option>This Fiscal Year (2026)</option>
            <option>Last Quarter (Q3 2026)</option>
            <option>Current Month (October 2026)</option>
            <option>Previous Fiscal Year (2025)</option>
          </select>
        </div>
      </div>

      {/* Main Report Body */}
      <div className="p-6 max-w-5xl mx-auto w-full flex-1">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 md:p-8 space-y-6">
          
          {/* Formal Report Header */}
          <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800 space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {activeReport === 'balance-sheet' && 'Balance Sheet (Statement of Financial Position)'}
              {activeReport === 'pnl' && 'Profit and Loss Statement (Income Statement)'}
              {activeReport === 'cash-flow' && 'Statement of Cash Flows (Direct Method)'}
              {activeReport === 'tax-report' && 'Tax Compliance Declaration & Input/Output VAT'}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Reporting Currency: <strong>Egyptian Pound (LE)</strong> · As of October 04, 2026
            </p>
          </div>

          {/* Statement Lines Table */}
          {activeReport === 'balance-sheet' && (
            <div className="space-y-6 text-xs">
              {/* ASSETS */}
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b-2 border-slate-900 dark:border-slate-100 font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  <span>1. ASSETS</span>
                  <span>Balance (LE)</span>
                </div>
                <div className="pl-4 space-y-1.5">
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300 font-semibold">
                    <span>Current Assets</span>
                    <span>467,190.00</span>
                  </div>
                  <div className="pl-4 space-y-1 text-slate-500">
                    <div className="flex justify-between">
                      <span>101000 Bank Accounts</span>
                      <span className="font-mono">342,190.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>102000 Cash on Hand</span>
                      <span className="font-mono">125,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>120000 Accounts Receivable (Trade Debtors)</span>
                      <span className="font-mono">45,280.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300 font-semibold pt-2">
                    <span>Non-Current (Fixed) Assets</span>
                    <span>655,000.00</span>
                  </div>
                  <div className="pl-4 space-y-1 text-slate-500">
                    <div className="flex justify-between">
                      <span>150000 Property, Plant & Equipment</span>
                      <span className="font-mono">750,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>159000 Accumulated Depreciation</span>
                      <span className="font-mono text-rose-600 dark:text-rose-400">-95,000.00</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between py-2.5 border-t border-slate-300 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/60 px-3 rounded-lg">
                  <span>TOTAL ASSETS</span>
                  <span className="font-mono">1,122,190.00 LE</span>
                </div>
              </div>

              {/* LIABILITIES & EQUITY */}
              <div className="space-y-2 pt-4">
                <div className="flex justify-between py-2 border-b-2 border-slate-900 dark:border-slate-100 font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  <span>2. LIABILITIES & EQUITY</span>
                  <span>Balance (LE)</span>
                </div>
                <div className="pl-4 space-y-1.5">
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300 font-semibold">
                    <span>Current Liabilities</span>
                    <span>18,450.00</span>
                  </div>
                  <div className="pl-4 space-y-1 text-slate-500">
                    <div className="flex justify-between">
                      <span>220000 Accounts Payable (Trade Creditors)</span>
                      <span className="font-mono">18,450.00</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300 font-semibold pt-2">
                    <span>Non-Current Liabilities (Long-Term Debt)</span>
                    <span>500,000.00</span>
                  </div>

                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300 font-semibold pt-2">
                    <span>Equity & Retained Earnings</span>
                    <span>603,740.00</span>
                  </div>
                </div>

                <div className="flex justify-between py-2.5 border-t border-slate-300 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white bg-emerald-50 dark:bg-emerald-950/40 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <span>TOTAL LIABILITIES & EQUITY</span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-300">1,122,190.00 LE</span>
                </div>
              </div>
            </div>
          )}

          {activeReport === 'pnl' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b-2 border-slate-900 dark:border-slate-100 font-bold uppercase tracking-wider">
                <span>Income & Revenue</span>
                <span>Amount (LE)</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
                <span>400000 Operating Revenue & Sales</span>
                <span className="font-mono font-bold text-emerald-600">840,000.00</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
                <span>500000 Cost of Goods Sold (COGS)</span>
                <span className="font-mono text-rose-600">-280,000.00</span>
              </div>
              <div className="flex justify-between py-2 border-y border-slate-200 dark:border-slate-800 font-bold bg-slate-50 dark:bg-slate-800/40 px-3 rounded">
                <span>GROSS PROFIT</span>
                <span className="font-mono">560,000.00 LE</span>
              </div>

              <div className="flex justify-between py-2 border-b-2 border-slate-900 dark:border-slate-100 font-bold uppercase tracking-wider pt-4">
                <span>Operating Expenses</span>
                <span>Amount (LE)</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
                <span>600100 Payroll & Staff Salaries</span>
                <span className="font-mono text-rose-600">-190,000.00</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
                <span>600200 Rent & Facility Utilities</span>
                <span className="font-mono text-rose-600">-45,000.00</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-700 dark:text-slate-300">
                <span>600300 General & Administrative</span>
                <span className="font-mono text-rose-600">-25,000.00</span>
              </div>

              <div className="flex justify-between py-3 border-t-2 border-slate-900 dark:border-slate-100 font-black text-sm bg-emerald-50 dark:bg-emerald-950/40 px-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span>NET OPERATING PROFIT</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-300">300,000.00 LE</span>
              </div>
            </div>
          )}

          {activeReport === 'cash-flow' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b-2 border-slate-900 dark:border-slate-100 font-bold uppercase tracking-wider">
                <span>Cash Flow Activity</span>
                <span>Net Flow (LE)</span>
              </div>
              <div className="flex justify-between pl-4">
                <span>Cash Receipts from Customers</span>
                <span className="font-mono font-bold text-emerald-600">+820,000.00</span>
              </div>
              <div className="flex justify-between pl-4">
                <span>Cash Paid to Suppliers & Employees</span>
                <span className="font-mono text-rose-600">-510,000.00</span>
              </div>
              <div className="flex justify-between py-2 border-y border-slate-200 dark:border-slate-800 font-bold bg-slate-50 dark:bg-slate-800/40 px-3 rounded">
                <span>NET CASH FROM OPERATING ACTIVITIES</span>
                <span className="font-mono">+310,000.00 LE</span>
              </div>
              <div className="flex justify-between pl-4">
                <span>Capital Expenditures (Equipment & Laptops)</span>
                <span className="font-mono text-rose-600">-45,000.00</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-slate-900 dark:border-slate-100 font-black text-sm bg-blue-50 dark:bg-blue-950/40 px-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <span>CLOSING CASH & BANK EQUIVALENTS</span>
                <span className="font-mono text-blue-700 dark:text-blue-300">467,190.00 LE</span>
              </div>
            </div>
          )}

          {activeReport === 'tax-report' && (
            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b-2 border-slate-900 dark:border-slate-100 font-bold uppercase tracking-wider">
                <span>Tax Breakdown</span>
                <span>Base (LE)</span>
                <span>Tax Due (LE)</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 pl-4 border-b border-slate-100 dark:border-slate-800">
                <span>Standard Output VAT 14% (Sales)</span>
                <span className="font-mono">840,000.00</span>
                <span className="font-mono font-bold text-emerald-600">117,600.00</span>
              </div>
              <div className="grid grid-cols-3 py-1.5 pl-4 border-b border-slate-100 dark:border-slate-800">
                <span>Standard Input VAT 14% (Purchases)</span>
                <span className="font-mono">280,000.00</span>
                <span className="font-mono text-rose-600">-39,200.00</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 border-slate-900 dark:border-slate-100 font-black text-sm bg-purple-50 dark:bg-purple-950/40 px-3 rounded-lg border border-purple-200 dark:border-purple-800">
                <span>NET TAX PAYABLE TO AUTHORITY</span>
                <span className="font-mono text-purple-700 dark:text-purple-300">78,400.00 LE</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ReportingPage;
