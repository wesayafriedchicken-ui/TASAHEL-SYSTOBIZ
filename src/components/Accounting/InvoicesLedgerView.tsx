import React, { useState } from 'react';
import { 
  Search, Plus, Download, Upload, Eye, FileText, Mail, Trash2, 
  CheckCircle2, RefreshCcw, Printer, ChevronRight, LayoutGrid, List, AlertCircle 
} from 'lucide-react';
import { 
  Invoice, Bill, JournalEntry, BankStatement, CoAAccount 
} from './AccountingTypes';
import { useAuth } from '../../context/AuthContext';

interface InvoicesLedgerViewProps {
  baseCurrency: string;
  convertFromSar: (amount: number) => number;
  invoices: Invoice[];
  bills: Bill[];
  journal: JournalEntry[];
  bankStatements: BankStatement[];
  coa: CoAAccount[];
  getAccountBalance: (accountId: string) => number;
  onAddInvoiceClick: () => void;
  onEditInvoiceClick: (inv: Invoice) => void;
  onAddBillClick: () => void;
  onEditBillClick: (bill: Bill) => void;
  onAddJournalClick: () => void;
  onAddStatementClick: () => void;
  markInvoiceAsPaid: (inv: Invoice) => void;
  payBill: (bill: Bill) => void;
  sendInvoiceReminder: (invId: string) => void;
  handleExportInvoices: () => void;
  handleImportInvoices: (e: React.ChangeEvent<HTMLInputElement>) => void;
  matchStatementToJournal: (statementId: string, jeId: string) => void;
  setBankStatements: React.Dispatch<React.SetStateAction<BankStatement[]>>;
  triggerSuccess: (msg: string) => void;
  setDeleteTarget: (target: { id: string; type: 'invoice' | 'bill' | 'coa' | 'journal' | 'statement' } | null) => void;
}

export const InvoicesLedgerView: React.FC<InvoicesLedgerViewProps> = ({
  baseCurrency,
  convertFromSar,
  invoices,
  bills,
  journal,
  bankStatements,
  coa,
  getAccountBalance,
  onAddInvoiceClick,
  onEditInvoiceClick,
  onAddBillClick,
  onEditBillClick,
  onAddJournalClick,
  onAddStatementClick,
  markInvoiceAsPaid,
  payBill,
  sendInvoiceReminder,
  handleExportInvoices,
  handleImportInvoices,
  matchStatementToJournal,
  setBankStatements,
  triggerSuccess,
  setDeleteTarget
}) => {

  const { checkPermission } = useAuth();

  const allSubTabs = [
    { id: 'invoices', label: 'الفواتير والعملاء (Sales Invoices)', name: 'Invoices Ledger' },
    { id: 'bills', label: 'المصروفات والمشتريات (Expenses & Bills)', name: 'Supplier Bills' },
    { id: 'journal', label: 'دفتر القيود اليومية (General Journal)', name: 'Journal Ledger' },
    { id: 'reconciliation', label: 'المطابقة البنكية (Bank Reconciliation)', name: 'Bank Reconciliation' },
    { id: 'reports', label: 'القوائم المالية (Financial Reports)', name: 'Financial Reports' },
  ];

  const allowedSubTabs = allSubTabs.filter(sub => (checkPermission as any)('Accounting', 'tab:' + sub.name));

  const [activeSubTab, setActiveSubTab] = useState<'invoices' | 'bills' | 'journal' | 'reconciliation' | 'reports'>(() => {
    const defaultSub = allSubTabs.find(sub => (checkPermission as any)('Accounting', 'tab:' + sub.name));
    return (defaultSub?.id || 'invoices') as any;
  });
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Bank reconciliation matching workstation state
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
  const [matchedJeId, setMatchedJeId] = useState('');

  // Report Period State
  const [selectedPeriod, setSelectedPeriod] = useState('2026-Q2');

  const fmt = (num: number) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const fmtClean = (num: number) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch = (inv.customer_name || '').toLowerCase().includes(term) || (inv.id || '').toString().toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'All' || inv.status === (statusFilter || '').toLowerCase();
    return matchesSearch && matchesStatus;
  });

  // Filtered bills
  const filteredBills = bills.filter(b => {
    const term = (searchTerm || '').toLowerCase();
    return (b.supplier_name || '').toLowerCase().includes(term) || (b.id || '').toString().toLowerCase().includes(term);
  });

  // Calculate matching rate for reconciliation
  const reconciledCount = bankStatements.filter(s => s.reconciled).length;
  const totalStatementsCount = bankStatements.length || 1;
  const matchingRate = ((reconciledCount / totalStatementsCount) * 100).toFixed(0);

  // Financial Reports Math
  const totalRevenues = coa.filter(a => a.type === 'revenue').reduce((sum, a) => sum + getAccountBalance(a.id), 0);
  const totalExpenses = coa.filter(a => a.type === 'expenses').reduce((sum, a) => sum + getAccountBalance(a.id), 0);
  const netProfit = totalRevenues - totalExpenses;

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* OPERATIONS INNER SUB-TABS */}
      <div className="flex overflow-x-auto gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
        {allowedSubTabs.map(sub => (
          <button
            key={sub.id}
            onClick={() => {
              setActiveSubTab(sub.id as any);
              setSearchTerm('');
            }}
            className={`flex-1 px-4 py-3 rounded-xl text-xs font-black transition-all flex-shrink-0 ${
              activeSubTab === sub.id
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/30'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* SUB-VIEW CONDITIONAL RENDER */}

      {/* ==================================
          SUBTAB 1: INVOICES WORKSTATION
          ================================== */}
      {activeSubTab === 'invoices' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* HEADER & BUTTONS */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-800">فواتير المبيعات الصادرة (Sales Invoices)</h3>
              <p className="text-[10px] text-slate-400 mt-1">إصدار وإدارة فواتير الخدمات والبرمجيات والمطابقة المالية المباشرة</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onAddInvoiceClick}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                إصدار فاتورة جديدة
              </button>
              
              <button
                onClick={handleExportInvoices}
                className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                تصدير CSV
              </button>
              
              <label className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>استيراد CSV</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleImportInvoices} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* SEARCH & TOGGLERS */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث برقم الفاتورة أو اسم العميل..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-right"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
              >
                <option value="All">كل الحالات (All)</option>
                <option value="Paid">مدفوعة (Paid)</option>
                <option value="Draft">مسودة (Draft)</option>
                <option value="Sent">مرسلة (Sent)</option>
                <option value="Overdue">متأخرة (Overdue)</option>
              </select>

              <div className="flex bg-slate-100 p-1 rounded-xl border">
                <button
                  onClick={() => setViewMode('board')}
                  className={`p-1.5 rounded-lg ${viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="لوحة العمليات Kanban"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="جدول قائمة الفواتير"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* RENDERING BASED ON VIEW MODE */}
          {viewMode === 'board' ? (
            /* KANBAN BOARD VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {['draft', 'sent', 'paid', 'overdue'].map(col => {
                const colInvoices = filteredInvoices.filter(i => i.status === col);
                return (
                  <div key={col} className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200/40 space-y-3.5 min-h-[300px]">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                        {col === 'draft' ? 'مسودات (Draft)' :
                         col === 'sent' ? 'مرسلة للعميل (Sent)' :
                         col === 'paid' ? 'مدفوعة (Paid)' : 'متأخرة السداد (Overdue)'}
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-black text-slate-500 border">
                        {colInvoices.length}
                      </span>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[500px]">
                      {colInvoices.length === 0 ? (
                        <p className="text-[10px] text-slate-400 italic text-center py-5">لا توجد فواتير هنا.</p>
                      ) : (
                        colInvoices.map(inv => (
                          <div key={inv.id} className="bg-white p-4 rounded-xl border border-slate-200/50 shadow-xs space-y-3 hover:shadow-sm transition-all">
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-black text-slate-800 text-xs">{inv.id}</span>
                              <span className="text-[9px] text-slate-400 font-bold">{inv.date}</span>
                            </div>
                            
                            <div>
                              <p className="text-xs font-bold text-slate-900 truncate">{inv.customer_name}</p>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                {inv.items?.[0]?.product_name || 'خدمات استشارية'}
                              </p>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t text-xs">
                              <span className="font-mono font-black text-indigo-600">{fmtClean(inv.total_amount)} {baseCurrency}</span>
                              <div className="flex items-center gap-1">
                                {col === 'draft' && (
                                  <button
                                    onClick={() => onEditInvoiceClick(inv)}
                                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[9px] rounded-lg"
                                  >
                                    تعديل
                                  </button>
                                )}
                                {col !== 'paid' && col !== 'draft' && (
                                  <button
                                    onClick={() => markInvoiceAsPaid(inv)}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[9px] rounded-lg whitespace-nowrap"
                                  >
                                    تسجيل سداد
                                  </button>
                                )}
                                {col === 'overdue' && (
                                  <button
                                    onClick={() => sendInvoiceReminder(inv.id)}
                                    className={`p-1 rounded-lg ${inv.reminder_sent ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100'}`}
                                    title="إرسال تذكير بالبريد"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setDeleteTarget({ id: inv.id, type: 'invoice' })}
                                  className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                  title="حذف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* PLAIN LIST VIEW */
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-500 font-bold">
                    <th className="p-3 pr-4">رقم الفاتورة</th>
                    <th className="p-3">اسم العميل</th>
                    <th className="p-3">تاريخ الإصدار</th>
                    <th className="p-3">تاريخ الاستحقاق</th>
                    <th className="p-3 text-left">المبلغ الإجمالي</th>
                    <th className="p-3 text-center">الحالة</th>
                    <th className="p-3 text-center">خيارات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 pr-4 font-mono font-bold text-slate-900">{inv.id}</td>
                      <td className="p-3 font-bold text-slate-800">{inv.customer_name}</td>
                      <td className="p-3 font-mono text-slate-500">{inv.date}</td>
                      <td className="p-3 font-mono text-slate-500">{inv.due_date}</td>
                      <td className="p-3 text-left font-mono font-black text-slate-900">{fmt(inv.total_amount)} {baseCurrency}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                          inv.status === 'sent' ? 'bg-indigo-50 text-indigo-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => onEditInvoiceClick(inv)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {inv.status !== 'paid' && (
                            <button onClick={() => markInvoiceAsPaid(inv)} className="p-1 hover:bg-emerald-50 text-emerald-600 rounded" title="تسجيل سداد">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => setDeleteTarget({ id: inv.id, type: 'invoice' })} className="p-1 hover:bg-rose-50 text-rose-600 rounded">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ==================================
          SUBTAB 2: SUPPLIER BILLS
          ================================== */}
      {activeSubTab === 'bills' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-800 font-sans">فواتير النفقات والمشتريات (Supplier Bills)</h3>
              <p className="text-[10px] text-slate-400 mt-1">تتبع التزامات الموردين والمصاريف التشغيلية ومطابقتها مع صندوق النقدية</p>
            </div>
            <button
              onClick={onAddBillClick}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              تسجيل فاتورة شراء جديدة
            </button>
          </div>

          <div className="relative w-full bg-white p-4 rounded-2xl border border-slate-100">
            <Search className="absolute right-7.5 top-7 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم المورد أو الوصف..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/10 outline-none text-right"
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-slate-500 font-bold">
                  <th className="p-3 pr-4">رقم السند</th>
                  <th className="p-3">اسم المورد / الجهة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">الوصف والمستند المربوط</th>
                  <th className="p-3 text-left">المبلغ</th>
                  <th className="p-3 text-center">حساب المصروف الرئيسي</th>
                  <th className="p-3 text-center">الحالة</th>
                  <th className="p-3 text-center">خيارات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3 pr-4 font-mono font-bold text-slate-900">{b.id}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{b.supplier_name}</p>
                      {b.is_copq && (
                        <span className="inline-block bg-rose-50 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-rose-100 mt-1">
                          COPQ / عيوب جودة
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-500">{b.date}</td>
                    <td className="p-3 text-slate-600 max-w-[220px] truncate">{b.description}</td>
                    <td className="p-3 text-left font-mono font-black text-slate-900">{fmt(b.total_amount)} {baseCurrency}</td>
                    <td className="p-3 text-center font-mono text-slate-500">
                      {coa.find(c => c.id === b.account_id)?.name_ar || b.account_id}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                        b.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {b.status === 'paid' ? 'Paid / مسدّدة' : 'Unpaid / مستحق'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {b.status !== 'paid' && (
                          <button
                            onClick={() => payBill(b)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg"
                          >
                            صرف نقدي
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget({ id: b.id, type: 'bill' })}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================
          SUBTAB 3: DOUBLE ENTRY JOURNAL
          ================================== */}
      {activeSubTab === 'journal' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-800 font-sans">دفتر اليومية العامة المزدوجة (General Ledger Journal)</h3>
              <p className="text-[10px] text-slate-400 mt-1">تتبع القيود المحاسبية الآلية واليدوية والتحقق من تطابق الطرفين المدين والدائن</p>
            </div>
            <button
              onClick={onAddJournalClick}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              قيد محاسبي يدوي جديد (JE)
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center text-xs font-bold text-slate-600">
              <span>جميع القيود المسجلة بالترتيب الزمني المعكوس</span>
              <span className="font-mono text-emerald-600 font-black">GAAP Certified Ledger System</span>
            </div>

            <div className="divide-y divide-slate-100">
              {journal.map(je => {
                const totalDebit = je.lines.reduce((sum, l) => sum + l.debit, 0);
                const totalCredit = je.lines.reduce((sum, l) => sum + l.credit, 0);
                return (
                  <div key={je.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 text-xs">{je.id}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-1.5 py-0.5 rounded">Ref: {je.reference}</span>
                          {je.is_system && (
                            <span className="text-[8px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-black px-1.5 py-0.5 rounded uppercase">Auto System</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-bold">{je.description}</p>
                      </div>
                      <div className="text-left font-mono text-slate-400 text-[10px]">
                        <span>تاريخ السند: {je.date}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                      <table className="w-full text-right text-[11px]">
                        <thead>
                          <tr className="text-slate-400 font-bold border-b">
                            <th className="pb-1 pr-2">الحساب الدفتري / GL ACCOUNT</th>
                            <th className="pb-1 text-left">مدين (Debit)</th>
                            <th className="pb-1 text-left">دائن (Credit)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50 font-mono font-medium">
                          {je.lines.map((line, idx) => (
                            <tr key={idx} className="text-slate-700">
                              <td className="py-1.5 pr-2">
                                <span className="font-bold text-slate-900">{line.account_id}</span> - {coa.find(c => c.id === line.account_id)?.name_ar || 'حساب غير معروف'}
                              </td>
                              <td className="py-1.5 text-left text-indigo-700 font-bold">
                                {line.debit > 0 ? `${fmt(line.debit)} ${baseCurrency}` : '-'}
                              </td>
                              <td className="py-1.5 text-left text-slate-900 font-bold">
                                {line.credit > 0 ? `${fmt(line.credit)} ${baseCurrency}` : '-'}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-black bg-white border-t">
                            <td className="py-1.5 pr-2">الإجمالي (Balanced Totals)</td>
                            <td className="py-1.5 text-left text-indigo-700">{fmt(totalDebit)} {baseCurrency}</td>
                            <td className="py-1.5 text-left text-slate-900">{fmt(totalCredit)} {baseCurrency}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================
          SUBTAB 4: BANK RECONCILIATION
          ================================== */}
      {activeSubTab === 'reconciliation' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-slate-400 text-[10px] uppercase font-black block">Matching Rate / دقة المطابقة</span>
              <p className="text-2xl font-black text-indigo-600 mt-1 font-mono">{matchingRate}%</p>
              <p className="text-[9px] text-slate-400 mt-1">تطابق تام بين كشوف الحساب المصرفي ودفتر الأستاذ</p>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <span className="text-slate-400 text-[10px] uppercase font-black block">Unreconciled Bank Clearance</span>
              <p className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {fmtClean(bankStatements.filter(s => !s.reconciled).reduce((sum, s) => sum + Math.abs(s.amount), 0))} {baseCurrency}
              </p>
              <p className="text-[9px] text-slate-400 mt-1">المعاملات العالقة التي تتطلب المطابقة العاجلة</p>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs flex justify-between items-center">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-black block">Central Bank Nodes</span>
                <p className="text-xs font-black text-emerald-400 mt-1.5">CONNECTED / متصل ومؤمن</p>
              </div>
              <button
                onClick={onAddStatementClick}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black rounded-lg transition-all"
              >
                + إدخال حركة مصرفية
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-6 rounded-2xl border border-slate-100">
            {/* UNMATCHED STATEMENTS ON THE RIGHT */}
            <div className="lg:col-span-6 space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">الخطوة 1: كشف الحساب المصرفي المستورد</h4>
              
              <div className="space-y-3.5">
                {bankStatements.map(statement => (
                  <div
                    key={statement.id}
                    onClick={() => !statement.reconciled && setSelectedStatement(statement)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      statement.reconciled ? 'bg-emerald-50/30 border-emerald-100 opacity-75 cursor-default' :
                      selectedStatement?.id === statement.id ? 'bg-indigo-50/50 border-indigo-400 ring-2 ring-indigo-500/10' :
                      'bg-slate-50 border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{statement.description}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">{statement.date} | ID: {statement.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold font-mono ${statement.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {statement.amount > 0 ? '+' : ''} {fmtClean(statement.amount)}
                      </span>
                      {statement.reconciled ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBankStatements(prev => prev.map(s => s.id === statement.id ? { ...s, reconciled: false, matched_journal_id: undefined } : s));
                            triggerSuccess("تم إلغاء قفل مطابقة السند بنجاح.");
                          }}
                          className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 rounded text-[9px] font-bold"
                        >
                          إلغاء المطابقة
                        </button>
                      ) : (
                        <span className="text-[8px] bg-amber-100 text-amber-700 font-black px-1.5 py-0.5 rounded">Match Now</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MATCH WORKSPACE ON THE LEFT */}
            <div className="lg:col-span-6 bg-slate-50 p-5 rounded-xl border border-slate-200 border-dashed flex flex-col justify-between gap-5">
              <div>
                <h4 className="text-xs font-black uppercase text-indigo-600 tracking-wider">الخطوة 2: محاذاة كشف البنك مع قيد اليومية العام</h4>
                <p className="text-[10px] text-slate-400 mt-1">حدد حركة مصرفية من اليمين، ثم اختر القيد المحاسبي المناسب لمطابقة الحسابين معاً عيناً وأثراً</p>
              </div>

              {selectedStatement ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-white rounded-xl border">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase">حركة البنك المختارة</span>
                    <p className="text-xs font-black text-slate-800 mt-1">{selectedStatement.description}</p>
                    <p className="text-xs font-mono font-bold text-indigo-600 mt-1">{fmt(selectedStatement.amount)} {baseCurrency}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 block">اختر قيد اليومية المقابل للمطابقة (Select JE Match):</label>
                    <select
                      value={matchedJeId}
                      onChange={e => setMatchedJeId(e.target.value)}
                      className="w-full p-2.5 bg-white border rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    >
                      <option value="">-- اختر قيد يومية متوازن --</option>
                      {journal.filter(j => !bankStatements.some(s => s.matched_journal_id === j.id)).map(j => {
                        const jeAmount = j.lines.reduce((sum, l) => sum + l.debit, 0);
                        return (
                          <option key={j.id} value={j.id}>
                            {j.id} - {j.description.substring(0, 40)}... ({jeAmount.toLocaleString()} {baseCurrency})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      if (!matchedJeId) return;
                      matchStatementToJournal(selectedStatement.id, matchedJeId);
                      setSelectedStatement(null);
                      setMatchedJeId('');
                    }}
                    disabled={!matchedJeId}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all"
                  >
                    اعتماد مطابقة السند وتثبيته المالي
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-xs font-bold">بانتظار تحديد حركة كشف حساب بنكي من اليمين لبدء المطابقة...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================
          SUBTAB 5: FINANCIAL REPORTS
          ================================== */}
      {activeSubTab === 'reports' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800">قائمة الدخل والميزانية العمومية GAAP Certified Statements</h3>
              <p className="text-[10px] text-slate-400 mt-1">توليد القوائم الختامية للربع الحالي من السنة المالية</p>
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value)}
                className="p-2.5 bg-slate-50 border rounded-xl text-xs font-bold text-slate-700 outline-none"
              >
                <option value="2026-Q2">الربع الثاني Q2 2026</option>
                <option value="2026-Q1">الربع الأول Q1 2026</option>
              </select>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة التقارير
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* A. INCOME STATEMENT */}
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-black text-slate-800 border-b pb-3">قائمة الدخل / Profit & Loss Statement (P&L)</h4>
                <p className="text-[10px] text-slate-400 mt-1">ملخص الإيرادات المحققة والنفقات التشغيلية وصافي الأرباح للشركة</p>
              </div>

              <div className="space-y-3.5 text-xs">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">الإيرادات والتدفقات (Revenues)</span>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-slate-600 font-semibold">مبيعات تراخيص البرمجيات (40100)</span>
                  <span className="font-mono font-bold">{fmt(convertFromSar(getAccountBalance('40100')))} {baseCurrency}</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-slate-600 font-semibold">إيرادات الاستشارات والتهيئة اليدوية (40200)</span>
                  <span className="font-mono font-bold">{fmt(convertFromSar(getAccountBalance('40200')))} {baseCurrency}</span>
                </div>

                <div className="flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-emerald-900 font-black">
                  <span>إجمالي إيرادات العمليات (A)</span>
                  <span className="font-mono">{fmt(convertFromSar(totalRevenues))} {baseCurrency}</span>
                </div>

                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider pt-4">المصروفات والتكاليف (Operating Costs)</span>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-slate-600 font-semibold">الرواتب والأجور للعاملين (50100)</span>
                  <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('50100')))} {baseCurrency}</span>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-slate-600 font-semibold">مصاريف إيجار الفروع والمقرات (50200)</span>
                  <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('50200')))} {baseCurrency}</span>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-slate-600 font-semibold">تكاليف الحملات التسويقية والترويج (50300)</span>
                  <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('50300')))} {baseCurrency}</span>
                </div>

                <div className="flex justify-between items-center border-b pb-2 text-rose-600 font-semibold">
                  <span>مصروف خسائر عيوب الجودة COPQ (50400)</span>
                  <span className="font-mono font-bold">{fmt(convertFromSar(getAccountBalance('50400')))} {baseCurrency}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg border text-slate-900 font-black">
                  <span>إجمالي تكاليف التشغيل (B)</span>
                  <span className="font-mono">{fmt(convertFromSar(totalExpenses))} {baseCurrency}</span>
                </div>

                <div className={`flex justify-between items-center p-3 rounded-xl border font-black mt-6 ${
                  netProfit >= 0 ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-rose-600 text-white border-rose-500 shadow-sm'
                }`}>
                  <span>صافي الأرباح الربعية (Net Income A - B)</span>
                  <span className="font-mono text-sm font-black">{fmt(convertFromSar(netProfit))} {baseCurrency}</span>
                </div>
              </div>
            </div>

            {/* B. BALANCE SHEET */}
            <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs space-y-6">
              <div>
                <h4 className="text-sm font-black text-slate-800 border-b pb-3">الميزانية العمومية الختامية / Balance Sheet</h4>
                <p className="text-[10px] text-slate-400 mt-1">توازن الأصول المتاحة مع المطلوبات وحقوق الملكية للمساهمين</p>
              </div>

              <div className="space-y-4 text-xs">
                
                {/* ASSETS */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2">الأصول المتداولة (Assets)</span>
                  <div className="space-y-2 font-semibold">
                    <div className="flex justify-between items-center border-b pb-1.5 text-slate-600">
                      <span>الخزينة النقدية الرئيسية (10100)</span>
                      <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('10100')))} {baseCurrency}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 text-slate-600">
                      <span>حسابات جارية بالبنوك (10200)</span>
                      <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('10200')))} {baseCurrency}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 text-slate-600">
                      <span>حساب العملاء مدينون (10300)</span>
                      <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('10300')))} {baseCurrency}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 text-slate-600">
                      <span>شيكات برسم التحصيل (10400)</span>
                      <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('10400')))} {baseCurrency}</span>
                    </div>
                    <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-lg text-indigo-900 font-black">
                      <span>إجمالي الأصول الحالية</span>
                      <span className="font-mono">
                        {fmt(convertFromSar(getAccountBalance('10100') + getAccountBalance('10200') + getAccountBalance('10300') + getAccountBalance('10400')))} {baseCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* LIABILITIES */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2">الخصوم والمطلوبات (Liabilities)</span>
                  <div className="space-y-2 font-semibold">
                    <div className="flex justify-between items-center border-b pb-1.5 text-slate-600">
                      <span>مستحقات الموردين والجهات (20100)</span>
                      <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('20100')))} {baseCurrency}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 text-slate-600">
                      <span>ضريبة المبيعات والـ VAT المستحقة (20200)</span>
                      <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('20200')))} {baseCurrency}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 text-slate-600">
                      <span>مستحقات عيوب الجودة والـ NCR (20300)</span>
                      <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('20300')))} {baseCurrency}</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-100 p-2 rounded-lg text-slate-900 font-black">
                      <span>إجمالي الخصوم والالتزامات</span>
                      <span className="font-mono">
                        {fmt(convertFromSar(getAccountBalance('20100') + getAccountBalance('20200') + getAccountBalance('20300')))} {baseCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* EQUITIES */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mb-2">حقوق الملكية (Equities)</span>
                  <div className="space-y-2 font-semibold">
                    <div className="flex justify-between items-center border-b pb-1.5 text-slate-600">
                      <span>رأس المال المكتتب والمدفوع (30100)</span>
                      <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('30100')))} {baseCurrency}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 text-slate-600">
                      <span>الأرباح المحتجزة / المرحّلة (30200)</span>
                      <span className="font-mono font-bold text-slate-800">{fmt(convertFromSar(getAccountBalance('30200')))} {baseCurrency}</span>
                    </div>
                    <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-lg text-indigo-900 font-black">
                      <span>حقوق الملكية والمطلوبات المتوازنة</span>
                      <span className="font-mono">
                        {fmt(convertFromSar(getAccountBalance('20100') + getAccountBalance('20200') + getAccountBalance('20300') + getAccountBalance('30100') + getAccountBalance('30200')))} {baseCurrency}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
