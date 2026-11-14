import React from 'react';
import { 
  DollarSign, Briefcase, Plus, ArrowUpRight, ArrowDownLeft, 
  Sparkles, AlertCircle, RefreshCcw, Printer, FileText, CheckCircle2 
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { CoAAccount, BankOrWallet, Invoice, Bill } from './AccountingTypes';

interface DashboardViewProps {
  baseCurrency: string;
  convertFromSar: (amount: number) => number;
  totalRevenues: number;
  totalExpenses: number;
  netProfit: number;
  currentCash: number;
  banksAndWallets: BankOrWallet[];
  crmDeals: any[];
  qaNcrs: any[];
  invoices: Invoice[];
  bills: Bill[];
  coa: CoAAccount[];
  importCrmDealAsDraft: (deal: any) => void;
  importQaNcrAsCopqExpense: (ncr: any) => void;
  setShowAddBankModal: (show: boolean) => void;
  onPayPayrollClick: () => void;
  payrollExecuted: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  baseCurrency,
  convertFromSar,
  totalRevenues,
  totalExpenses,
  netProfit,
  currentCash,
  banksAndWallets,
  crmDeals,
  qaNcrs,
  invoices,
  bills,
  coa,
  importCrmDealAsDraft,
  importQaNcrAsCopqExpense,
  setShowAddBankModal,
  onPayPayrollClick,
  payrollExecuted
}) => {

  // Format numbers to clean locale strings
  const fmt = (num: number) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Cash flow chart data based on the screenshots
  const cashFlowTrendData = [
    { month: 'يناير', inflow: 38000, outflow: 24000 },
    { month: 'فبراير', inflow: 42000, outflow: 29000 },
    { month: 'مارس', inflow: 49000, outflow: 31000 },
    { month: 'أبريل', inflow: 51000, outflow: 35000 },
    { month: 'مايو (الحالي)', inflow: totalRevenues, outflow: totalExpenses },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      
      {/* 1. TOP KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* REVENUE */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">TOTAL REVENUE | إجمالي الإيرادات</span>
            <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {fmt(convertFromSar(totalRevenues))} <span className="text-xs font-bold">{baseCurrency}</span>
            </p>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">↑ 12% vs last month | مقارنة بالشهر السابق</p>
          </div>
        </div>

        {/* EXPENSES */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">OPERATING EXP | مصروفات التشغيل</span>
            <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {fmt(convertFromSar(totalExpenses))} <span className="text-xs font-bold">{baseCurrency}</span>
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Actual Cost Synced | تم مزامنة التكاليف الفعلية</p>
          </div>
        </div>

        {/* NET PROFIT */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">NET PROFIT | صافي الأرباح</span>
            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-indigo-600 font-mono">
              {fmt(convertFromSar(netProfit))} <span className="text-xs font-bold">{baseCurrency}</span>
            </p>
            <p className="text-[10px] text-indigo-500 font-semibold mt-1">View Breakout | تفاصيل توزيع الأرباح ←</p>
          </div>
        </div>

        {/* CURRENT CASH */}
        <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">CURRENT CASH | التدفق النقدي</span>
            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
              <RefreshCcw className="w-4 h-4 animate-spin-slow" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl font-black text-slate-900 font-mono">
              {fmt(convertFromSar(currentCash))} <span className="text-xs font-bold">{baseCurrency}</span>
            </p>
            {/* Progress bar loaded at around 80% as in screenshots */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '82%' }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. DUAL LAYOUT: MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* RIGHT COLUMN (8/12): charts and CRM deals */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* A. CASH FLOW COMPARISON CHART */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">CASH FLOW COMPARISON | مقارنة التدفق النقدي</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Inflow vs Outflow comparison across months | مقارنة الإيرادات والنفقات الشهرية</p>
              </div>
              <span className="bg-slate-100 text-slate-600 font-mono text-[9px] font-black px-2 py-1 rounded">2026 Monthly Trend</span>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlowTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="inflow" name="الإيرادات (Inflow)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outflow" name="النفقات (Outflow)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* B. DRAFT SALES INVOICES (CRM WON DEALS) */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">DRAFT SALES INVOICES (CRM WON DEALS)</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Instantly convert closed won deals from Sales CRM into billing | معالجة الفواتير المسحوبة من صفقات المبيعات الناجحة</p>
              </div>
              <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 animate-pulse" /> CRM Live
              </span>
            </div>

            {/* Simulated/Fetched Invoices matching Screenshot 1 */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold pb-2">
                    <th className="pb-3 pr-2">رقم الفاتورة / INV#</th>
                    <th className="pb-3">العميل والصفقة / CLIENT</th>
                    <th className="pb-3 text-left">المبلغ / AMOUNT</th>
                    <th className="pb-3">طريقة الدفع / METHOD</th>
                    <th className="pb-3 text-center">الحالة / STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.slice(0, 4).map((inv, idx) => (
                    <tr key={inv.id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 pr-2 font-mono font-bold text-slate-900">{inv.id}</td>
                      <td className="py-3.5">
                        <p className="font-bold text-slate-800">{inv.customer_name}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          {inv.items?.[0]?.product_name || 'خدمات استشارية معتمدة'}
                        </p>
                      </td>
                      <td className="py-3.5 text-left font-mono font-bold text-slate-900">
                        {fmt(inv.total_amount)} <span className="text-[10px]">{baseCurrency}</span>
                      </td>
                      <td className="py-3.5 font-medium text-slate-600">{inv.payment_method || 'حساب جاري'}</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          inv.status === 'sent' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {inv.status === 'paid' ? 'Paid / مدفوعة' :
                           inv.status === 'sent' ? 'Sent / مرسلة' : 'Draft / مسودة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Integrations Pending Deal Imports */}
            {crmDeals.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3">CRM Deals Awaiting Billing | صفقات بانتظار الفوترة :</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {crmDeals.slice(0, 4).map((deal, index) => (
                    <div key={deal.id || index} className="p-3 bg-purple-50/40 rounded-xl border border-purple-100/50 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{deal.title || deal.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono font-bold mt-0.5">{deal.value || deal.amount || '50,000'} {baseCurrency}</p>
                      </div>
                      <button
                        onClick={() => importCrmDealAsDraft(deal)}
                        className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10px] rounded-lg transition-colors whitespace-nowrap"
                      >
                        Bill / فوترة
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* LEFT COLUMN (4/12): vaults list & payroll widget */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* A. VAULTS & BANKS */}
          <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">VAULTS & BANKS | الخزائن والبنوك</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Liquidity assets across safe boxes and banking nodes | الأصول النقدية والسيولة</p>
              </div>
              <button 
                onClick={() => setShowAddBankModal(true)}
                className="w-6 h-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center transition-colors"
                title="أضف خزنة أو حساب"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {banksAndWallets.map((wallet) => (
                <div key={wallet.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      wallet.type === 'bank' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {wallet.type === 'bank' ? 'بنك' : 'خزنة'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{wallet.name_ar || wallet.name_en}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{wallet.bank_name || 'نقدية تشغيلية'} {wallet.account_number ? `(${wallet.account_number})` : ''}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 font-mono">{fmt(wallet.balance)} {wallet.currency}</p>
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Active / متصل</span>
                  </div>
                </div>
              ))}
              
              <div className="pt-2 border-t border-dashed flex justify-between items-center text-[11px] text-slate-500 font-bold">
                <span>TOTAL LIQUIDITY | إجمالي السيولة المتوفرة :</span>
                <span className="text-xs text-slate-900 font-black font-mono">{fmt(currentCash)} {baseCurrency}</span>
              </div>
            </div>
          </div>

          {/* B. NEXT PAYROLL RUN WIDGET */}
          <div className="bg-slate-900 text-white p-6 rounded-[1.5rem] border border-slate-800 shadow-md flex flex-col justify-between gap-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs font-extrabold uppercase tracking-widest">NEXT PAYROLL | موديول الرواتب</span>
                <span className="text-[8px] bg-indigo-500/20 text-indigo-300 font-black px-2 py-0.5 rounded-full uppercase">Accrual Cycle</span>
              </div>
              <p className="text-md font-bold text-slate-200 mt-2 font-mono">Date: 24 Feb, 2026</p>
              
              <div className="mt-4 space-y-2 text-xs border-t border-slate-800 pt-3">
                <div className="flex justify-between text-slate-400">
                  <span>Base Salaries / الرواتب الأساسية :</span>
                  <span className="font-mono text-slate-200">120,000 {baseCurrency}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>CRM Commissions / عمولات المبيعات :</span>
                  <span className="font-mono text-emerald-400 font-bold">+18,500 {baseCurrency}</span>
                </div>
                <div className="h-px bg-slate-800 my-1"></div>
                <div className="flex justify-between font-black text-white">
                  <span>TOTAL OUTFLOW / إجمالي الصرف :</span>
                  <span className="font-mono text-indigo-400">138,500 {baseCurrency}</span>
                </div>
              </div>
            </div>

            {payrollExecuted ? (
              <div className="w-full bg-emerald-950/40 border border-emerald-900/50 p-2.5 rounded-xl flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Wages Settled & Posted to Ledger! | تم صرف الرواتب بنجاح وقيدها</span>
              </div>
            ) : (
              <button 
                onClick={onPayPayrollClick}
                className="w-full py-2.5 bg-gradient-to-l from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-2"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Approve & Execute Payroll / صرف الرواتب وقيد المعاملة</span>
              </button>
            )}
          </div>

          {/* C. QUALITY ASSURANCE NCR COPQ PANEL */}
          {qaNcrs.length > 0 && (
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">COPQ RECOVERY | خسائر عيوب الجودة</h3>
                  <p className="text-[9px] text-slate-400 mt-0.5">Accrue Cost of Poor Quality (NCRs) to ledger | رصد تكاليف الهدر ومطابقة الجودة</p>
                </div>
                <span className="bg-rose-100 text-rose-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Loss Track</span>
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto">
                {qaNcrs.map((ncr, i) => (
                  <div key={ncr.id || i} className="p-3 bg-rose-50/30 rounded-xl border border-rose-100/50 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{ncr.title || ncr.ncr_number}</p>
                        <p className="text-[9px] text-slate-400 italic">Severity: {ncr.severity || 'Medium'}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-600 text-xs">
                        {ncr.cost_of_poor_quality || ncr.cost || '4,500'} {baseCurrency}
                      </span>
                    </div>
                    {/* Convert and book NCR cost */}
                    <button
                      onClick={() => importQaNcrAsCopqExpense(ncr)}
                      className="w-full py-1 bg-white hover:bg-rose-50 border border-rose-200 text-[10px] text-rose-700 font-extrabold rounded-lg transition-all"
                    >
                      Book COPQ Expense / قيد كخسارة تشغيلية
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
