import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Upload, FileText, DollarSign, TrendingUp, 
  ArrowUpRight, ArrowDownRight, CreditCard, Building2, 
  Wallet, CheckCircle2, Clock, AlertCircle, MoreVertical,
  ExternalLink, Sparkles, RefreshCw, BarChart2, ShieldCheck
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AccountingPageHeader } from '../components/AccountingPageHeader';

export const AccountingDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [currency] = useState('LE');

  // Invoices & Bills stats from local storage or defaults
  const [stats, setStats] = useState(() => {
    try {
      const invs = JSON.parse(localStorage.getItem('acct_invoices') || '[]');
      const bills = JSON.parse(localStorage.getItem('acct_bills') || '[]');
      const invTotal = invs.reduce((sum: number, i: any) => sum + (Number(i.total || i.amount) || 0), 0);
      const billsTotal = bills.reduce((sum: number, b: any) => sum + (Number(b.total || b.amount) || 0), 0);
      return {
        customerInvoices: invTotal || 45280.00,
        vendorBills: billsTotal || 18450.00,
        cashBalance: 125000.00,
        bankBalance: 342190.00
      };
    } catch {
      return {
        customerInvoices: 45280.00,
        vendorBills: 18450.00,
        cashBalance: 125000.00,
        bankBalance: 342190.00
      };
    }
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-140px)] bg-slate-50/60 dark:bg-slate-950">
      {/* Odoo Style Page Header */}
      <AccountingPageHeader
        breadcrumbs={[{ label: 'Dashboard' }]}
        title="Accounting Dashboard"
        badge="Enterprise"
        primaryAction={{
          label: 'New Invoice',
          onClick: () => navigate('/accounting/customers/invoices'),
          icon: <Plus className="w-4 h-4" />
        }}
        secondaryAction={{
          label: 'Upload Bills',
          onClick: () => navigate('/accounting/vendors/bills'),
          icon: <Upload className="w-3.5 h-3.5" />
        }}
        extraActions={
          <div className="flex items-center gap-2">
            <Link
              to="/accounting/reporting"
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Financial Reports</span>
            </Link>
          </div>
        }
      />

      {/* Main Odoo Cards Grid */}
      <div className="p-6 space-y-6 flex-1">
        
        {/* Row 1: Odoo Functional Cards (Customer Invoices, Vendor Bills, Cash, Bank) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Card 1: Customer Invoices */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Customer Invoices
                    </h2>
                    <p className="text-[11px] text-slate-400">Sales Journal</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => navigate('/accounting/customers/invoices')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                    {stats.customerInvoices.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase">{currency}</span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>3 Invoices to validate</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/accounting/customers/invoices')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </button>
              <Link
                to="/accounting/customers/invoices"
                className="text-xs font-semibold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <span>View Invoices</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 2: Vendor Bills */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Vendor Bills
                    </h2>
                    <p className="text-[11px] text-slate-400">Purchases Journal</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => navigate('/accounting/vendors/bills')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                    {stats.vendorBills.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase">{currency}</span>
                </div>
                <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>2 Bills to pay</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/accounting/vendors/bills')}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Bill</span>
              </button>
              <Link
                to="/accounting/vendors/bills"
                className="text-xs font-semibold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1"
              >
                <span>View Bills</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 3: Bank Operations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Bank
                    </h2>
                    <p className="text-[11px] text-slate-400">National Bank Account</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => navigate('/accounting/operations/reconcile')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                    {stats.bankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase">{currency}</span>
                </div>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Reconciled up to date</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/accounting/operations/reconcile')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <span>Reconcile (5)</span>
              </button>
              <Link
                to="/accounting/configuration/journals"
                className="text-xs font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                <span>Statements</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card 4: Cash Drawer */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      Cash
                    </h2>
                    <p className="text-[11px] text-slate-400">Petty Cash Register</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => navigate('/accounting/operations/journal-entries')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                    {stats.cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold text-slate-500 uppercase">{currency}</span>
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
                  <span>Last counted today</span>
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/accounting/operations/journal-entries')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Entry</span>
              </button>
              <Link
                to="/accounting/review/journal-items"
                className="text-xs font-semibold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                <span>Transactions</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>

        {/* Row 2: Odoo Onboarding Banners matching Screenshots 1-5 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Sales Onboarding */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Sales</span>
                  <span className="text-slate-400 font-normal">·</span>
                  <span className="text-xs text-slate-500 font-normal">Get paid online. Send electronic invoices.</span>
                </h3>
              </div>

              <div className="py-6 flex items-center justify-around gap-4 text-center">
                <Link
                  to="/accounting/configuration/settings"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                    Set Company Data
                  </span>
                </Link>

                <div className="text-xs text-slate-400 font-medium">and</div>

                <Link
                  to="/accounting/configuration/online-payments"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline">
                    Activate E-Invoicing
                  </span>
                </Link>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Fast Invoicing Setup</span>
              <button
                type="button"
                onClick={() => navigate('/accounting/customers/invoices')}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Open Customer Invoices →
              </button>
            </div>
          </div>

          {/* Purchases Onboarding */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400 font-extrabold">Purchases</span>
                  <span className="text-slate-400 font-normal">·</span>
                  <span className="text-xs text-slate-500 font-normal">Let artificial intelligence scan your bills</span>
                </h3>
              </div>

              <div className="py-6 flex items-center justify-around gap-4 text-center">
                <div 
                  onClick={() => navigate('/accounting/vendors/bills')}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200 dark:border-purple-800 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline">
                    Upload Sample Bill
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-medium">or</div>

                <Link
                  to="/accounting/configuration/chart-of-accounts"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                    Review Chart of Accounts
                  </span>
                </Link>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">Automated Vendor AP</span>
              <button
                type="button"
                onClick={() => navigate('/accounting/vendors/bills')}
                className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
              >
                Open Vendor Bills →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AccountingDashboardPage;
