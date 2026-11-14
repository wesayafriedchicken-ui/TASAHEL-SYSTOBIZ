import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, ArrowUpRight, ArrowDownLeft, Trash2, CheckCircle2, RefreshCw, X, ArrowLeftRight } from 'lucide-react';
import { BankOrWallet } from './AccountingTypes';

interface BanksViewProps {
  baseCurrency: string;
  banksAndWallets: BankOrWallet[];
  bankAccountTypes?: { id: string; label_ar: string; label_en: string }[];
  setShowAddBankModal: (show: boolean) => void;
  setBanksAndWallets: React.Dispatch<React.SetStateAction<BankOrWallet[]>>;
  triggerSuccess: (msg: string) => void;
  onPostJournalEntry: (entry: {
    description: string;
    reference: string;
    lines: { account_id: string; debit: number; credit: number }[];
  }) => void;
}

export const BanksView: React.FC<BanksViewProps> = ({
  baseCurrency,
  banksAndWallets,
  bankAccountTypes = [],
  setShowAddBankModal,
  setBanksAndWallets,
  triggerSuccess,
  onPostJournalEntry
}) => {

  const [activeFormTab, setActiveFormTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [txnAmount, setTxnAmount] = useState(0);
  const [txnDesc, setTxnDesc] = useState('');

  // Internal Transfer States
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFromId, setTransferFromId] = useState('');
  const [transferToId, setTransferToId] = useState('');
  const [transferAmount, setTransferAmount] = useState(0);
  const [transferDesc, setTransferDesc] = useState('');

  // Movements Filter
  const [filterMovementType, setFilterMovementType] = useState<'all' | 'deposit' | 'withdraw' | 'transfer'>('all');

  // Custom Modals State for Edit, Reset, and Delete
  const [editingWallet, setEditingWallet] = useState<BankOrWallet | null>(null);
  const [editBalanceInput, setEditBalanceInput] = useState<string>('');
  const [resetTargetWallet, setResetTargetWallet] = useState<BankOrWallet | null>(null);
  const [deleteTargetWallet, setDeleteTargetWallet] = useState<BankOrWallet | null>(null);

  // Ledger Movements State
  const [bankMovements, setBankMovements] = useState<{
    id: string;
    date: string;
    type: 'deposit' | 'withdraw' | 'transfer';
    from_wallet: string;
    to_wallet: string;
    amount: number;
    description: string;
    status: string;
  }[]>(() => {
    const saved = localStorage.getItem('acct_bank_movements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: 'MV-001',
        date: '2026-02-11',
        type: 'deposit',
        from_wallet: '',
        to_wallet: 'البنك الأهلي السعودي - الرياض',
        amount: 51300,
        description: 'توريد دفعة من عقد مبيعات CRM - العميل الشايع',
        status: 'completed'
      },
      {
        id: 'MV-002',
        date: '2026-02-13',
        type: 'deposit',
        from_wallet: '',
        to_wallet: 'حساب بنك الراجحي - جدة',
        amount: 22800,
        description: 'تسوية مبيعات نقاط البيع POS - العميل المطيري',
        status: 'completed'
      },
      {
        id: 'MV-003',
        date: '2026-02-18',
        type: 'withdraw',
        from_wallet: 'الخزينة النقدية الرئيسية',
        to_wallet: '',
        amount: 2450,
        description: 'سداد فواتير الخدمات والكهرباء الفرعية للفرع',
        status: 'completed'
      },
      {
        id: 'MV-004',
        date: '2026-02-20',
        type: 'transfer',
        from_wallet: 'البنك الأهلي السعودي - الرياض',
        to_wallet: 'الخزينة النقدية الرئيسية',
        amount: 15000,
        description: 'تحويل داخلي لتغذية السيولة النقدية بالخزينة الرئيسية',
        status: 'completed'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('acct_bank_movements', JSON.stringify(bankMovements));
  }, [bankMovements]);

  const fmt = (num: number) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const handleDepositWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletId || txnAmount <= 0) return;

    const wallet = banksAndWallets.find(w => w.id === selectedWalletId);
    if (!wallet) return;

    const signedAmount = activeFormTab === 'deposit' ? txnAmount : -txnAmount;
    
    // 1. Update wallet balance
    setBanksAndWallets(prev => prev.map(w => w.id === selectedWalletId ? { ...w, balance: w.balance + signedAmount } : w));

    // 2. Add movement record
    const newMovement = {
      id: `MV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: activeFormTab,
      from_wallet: activeFormTab === 'withdraw' ? (wallet.name_ar || wallet.name_en) : '',
      to_wallet: activeFormTab === 'deposit' ? (wallet.name_ar || wallet.name_en) : '',
      amount: txnAmount,
      description: txnDesc || (activeFormTab === 'deposit' ? 'إيداع نقدي مباشر' : 'سحب نقدي مباشر'),
      status: 'completed'
    };
    setBankMovements(prev => [newMovement, ...prev]);

    // 3. Auto-post balanced journal entries
    const accountId = wallet.type === 'bank' ? '10200' : '10100'; // Cash at Bank vs Petty Cash
    const balancingAccountId = activeFormTab === 'deposit' ? '30100' : '50100'; // Equity vs Expenses

    onPostJournalEntry({
      description: `${activeFormTab === 'deposit' ? 'إيداع نقدي رصيد' : 'سحب نقدي مصروف'} - ${wallet.name_ar || wallet.name_en} - ${txnDesc}`,
      reference: `BNK-TXN-${wallet.id}`,
      lines: [
        {
          account_id: accountId,
          debit: activeFormTab === 'deposit' ? txnAmount : 0,
          credit: activeFormTab === 'deposit' ? 0 : txnAmount
        },
        {
          account_id: balancingAccountId,
          debit: activeFormTab === 'deposit' ? 0 : txnAmount,
          credit: activeFormTab === 'deposit' ? txnAmount : 0
        }
      ]
    });

    setTxnAmount(0);
    setTxnDesc('');
    triggerSuccess(`تمت معالجة الحركة المالية لحساب [${wallet.name_ar}] بنجاح، وتعديل الرصيد وتحديث دفتر اليومية.`);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFromId || !transferToId || transferAmount <= 0) {
      alert('يرجى ملء كافة حقول نموذج التحويل المالي.');
      return;
    }
    if (transferFromId === transferToId) {
      alert('لا يمكن التحويل لنفس الحساب المصرفي.');
      return;
    }

    const fromWallet = banksAndWallets.find(w => w.id === transferFromId);
    const toWallet = banksAndWallets.find(w => w.id === transferToId);
    if (!fromWallet || !toWallet) return;

    if (fromWallet.balance < transferAmount) {
      if (!confirm(`تنبيه: الرصيد الحالي في [${fromWallet.name_ar}] هو (${fmt(fromWallet.balance)} ${fromWallet.currency}) وهو أقل من المبلغ المراد تحويله (${fmt(transferAmount)}). هل تريد الاستمرار وإتمام العملية بالرصيد السالب؟`)) {
        return;
      }
    }

    // 1. Update balances
    setBanksAndWallets(prev => prev.map(w => {
      if (w.id === transferFromId) {
        return { ...w, balance: w.balance - transferAmount };
      }
      if (w.id === transferToId) {
        return { ...w, balance: w.balance + transferAmount };
      }
      return w;
    }));

    // 2. Add movement record
    const newMovement = {
      id: `MV-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'transfer' as const,
      from_wallet: fromWallet.name_ar || fromWallet.name_en,
      to_wallet: toWallet.name_ar || toWallet.name_en,
      amount: transferAmount,
      description: transferDesc || 'تحويل مالي داخلي بين الحسابات',
      status: 'completed'
    };
    setBankMovements(prev => [newMovement, ...prev]);

    // 3. Post balanced journal entry to General Ledger
    const fromAccountId = fromWallet.type === 'bank' ? '10200' : '10100';
    const toAccountId = toWallet.type === 'bank' ? '10200' : '10100';

    onPostJournalEntry({
      description: `تحويل داخلي مالي - من ${fromWallet.name_ar || fromWallet.name_en} إلى ${toWallet.name_ar || toWallet.name_en} - ${transferDesc}`,
      reference: `BNK-TRF-${Date.now()}`,
      lines: [
        {
          account_id: toAccountId, // debit receiving (increases assets)
          debit: transferAmount,
          credit: 0
        },
        {
          account_id: fromAccountId, // credit sending (decreases assets)
          debit: 0,
          credit: transferAmount
        }
      ]
    });

    // Reset & Close
    setTransferFromId('');
    setTransferToId('');
    setTransferAmount(0);
    setTransferDesc('');
    setShowTransferModal(false);
    triggerSuccess(`تم إرسال وقيد عملية التحويل المالي بنجاح من [${fromWallet.name_ar}] إلى [${toWallet.name_ar}] بقيمة ${fmt(transferAmount)} SAR.`);
  };

  const filteredMovements = bankMovements.filter(mv => {
    if (filterMovementType === 'all') return true;
    return mv.type === filterMovementType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-right" dir="rtl">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h3 className="text-sm font-black text-slate-800">إدارة البنوك والخزائن النقدية (Vaults & Banks)</h3>
          <p className="text-[10px] text-slate-400 mt-1">إضافة وإدارة الأرصدة البنكية والمحافظ الرقمية وتسجيل الحركات النقدية المباشرة</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border border-indigo-200/50"
          >
            <RefreshCw className="w-4 h-4" />
            تحويل داخلي
          </button>
          <button
            onClick={() => setShowAddBankModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            إضافة خزنة أو بنك جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* WALLETS CARDS */}
        <div className="lg:col-span-8 space-y-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">الأرصدة الحالية للحسابات البنكية والمحافظ :</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {banksAndWallets.map((wallet) => {
              const typeObj = bankAccountTypes.find(t => t.id === wallet.type);
              const typeLabelAr = typeObj ? typeObj.label_ar : (wallet.type === 'bank' ? 'حساب بنكي' : 'خزنة كاش');
              const typeLabelEn = typeObj ? typeObj.label_en : (wallet.type === 'bank' ? 'BANK' : 'CASH');
              const isBank = wallet.type === 'bank';

              return (
                <div key={wallet.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-xs flex flex-col justify-between gap-6 hover:shadow-sm transition-all relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-9 rounded-xl flex flex-col items-center justify-center font-bold text-[8px] px-1 text-center truncate ${
                        isBank ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                      }`} title={typeLabelAr}>
                        <span className="font-sans font-black uppercase tracking-tight">{typeLabelEn.substring(0, 8)}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">{wallet.name_ar || wallet.name_en}</h4>
                        <p className="text-[9px] text-slate-400 font-sans mt-0.5">{typeLabelAr || wallet.bank_name || 'خزنة كاش فرعية'}</p>
                      </div>
                    </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingWallet(wallet);
                        setEditBalanceInput(wallet.balance.toString());
                      }}
                      className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded text-[9px] font-black transition-colors"
                      title="تعديل الرصيد"
                    >
                      تعديل الرصيد
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResetTargetWallet(wallet);
                      }}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded text-[9px] font-black transition-colors"
                      title="تصفير الرصيد"
                    >
                      تصفير الرصيد
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteTargetWallet(wallet);
                      }}
                      className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="إزالة الحساب"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-2xl font-black text-slate-900 font-mono">
                    {fmt(wallet.balance)} <span className="text-xs">{wallet.currency}</span>
                  </p>
                  <p className="text-[9px] text-slate-400 mt-1.5 font-mono truncate">
                    {wallet.iban ? `IBAN: ${wallet.iban}` : `ID: ${wallet.id}`}
                  </p>
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* QUICK TXN FORM */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs space-y-4">
          <div className="flex border-b pb-2">
            <button
              onClick={() => setActiveFormTab('deposit')}
              className={`flex-1 text-center py-1.5 text-xs font-black border-b-2 transition-all ${
                activeFormTab === 'deposit' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'
              }`}
            >
              تسجيل إيداع رصيد
            </button>
            <button
              onClick={() => setActiveFormTab('withdraw')}
              className={`flex-1 text-center py-1.5 text-xs font-black border-b-2 transition-all ${
                activeFormTab === 'withdraw' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400'
              }`}
            >
              تسجيل سحب مصروف
            </button>
          </div>

          <form onSubmit={handleDepositWithdrawSubmit} className="space-y-4 text-right">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 block">اختر الحساب المستهدف :</label>
              <select
                value={selectedWalletId}
                onChange={e => setSelectedWalletId(e.target.value)}
                required
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none"
              >
                <option value="">-- اختر الحساب المصرفي --</option>
                {banksAndWallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name_ar || w.name_en} ({fmt(w.balance)} {w.currency})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 block">مبلغ الحركة المحققة :</label>
              <input
                type="number"
                min="1"
                required
                value={txnAmount || ''}
                onChange={e => setTxnAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-black outline-none font-mono text-left"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 block">الوصف / البيان :</label>
              <input
                type="text"
                required
                placeholder="مثال: توريد نقدية من الشريك أو مصروفات شاي ومستلزمات مكتب"
                value={txnDesc}
                onChange={e => setTxnDesc(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 text-white font-black text-xs rounded-xl transition-all shadow-xs ${
                activeFormTab === 'deposit'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              اعتماد الحركة وقيدها دفترياً
            </button>
          </form>

        </div>

      </div>

      {/* LEDGER & TRANSACTION HISTORY */}
      <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b">
          <div>
            <h3 className="text-sm font-black text-slate-800 font-sans">سجل الحركات والتحويلات المالية (Transaction Ledger)</h3>
            <p className="text-[10px] text-slate-400 mt-1">عرض ومتابعة كافة الإيداعات، السحوبات، وعمليات التحويل الداخلي بين الخزائن والبنوك</p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'deposit', label: 'الإيداعات' },
              { id: 'withdraw', label: 'السحوبات' },
              { id: 'transfer', label: 'التحويلات الداخلية' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterMovementType(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  filterMovementType === tab.id
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold">
                <th className="pb-3 pt-1 px-2 font-black text-[10px]">تاريخ الحركة</th>
                <th className="pb-3 pt-1 px-2 font-black text-[10px]">العملية / الحسابات المتأثرة</th>
                <th className="pb-3 pt-1 px-2 font-black text-[10px]">نوع الحركة</th>
                <th className="pb-3 pt-1 px-2 text-left font-black text-[10px]">المبلغ</th>
                <th className="pb-3 pt-1 px-2 font-black text-[10px]">البيان والوصف الإيضاحي</th>
                <th className="pb-3 pt-1 px-2 text-center font-black text-[10px]">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">
                    لا يوجد حركات مالية مسجلة مطابقة للفلاتر المحددة حالياً.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mv) => (
                  <tr key={mv.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-2 font-mono text-slate-500 whitespace-nowrap">{mv.date}</td>
                    <td className="py-3 px-2">
                      {mv.type === 'transfer' ? (
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <span className="font-bold">{mv.from_wallet}</span>
                          <ArrowLeftRight className="w-3 h-3 text-slate-400" />
                          <span className="text-indigo-600 font-bold">{mv.to_wallet}</span>
                        </div>
                      ) : mv.type === 'deposit' ? (
                        <span className="text-slate-800 font-bold">إلى: {mv.to_wallet}</span>
                      ) : (
                        <span className="text-slate-800 font-bold">من: {mv.from_wallet}</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {mv.type === 'transfer' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-bold">
                          <RefreshCw className="w-2.5 h-2.5" />
                          تحويل داخلي
                        </span>
                      ) : mv.type === 'deposit' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                          <ArrowDownLeft className="w-2.5 h-2.5" />
                          إيداع رصيد
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-bold">
                          <ArrowUpRight className="w-2.5 h-2.5" />
                          سحب مصروف
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-mono font-black text-left">
                      <span className={
                        mv.type === 'deposit' ? 'text-emerald-600' :
                        mv.type === 'withdraw' ? 'text-rose-600' : 'text-slate-800'
                      }>
                        {mv.type === 'deposit' ? '+' : mv.type === 'withdraw' ? '-' : ''}
                        {fmt(mv.amount)} <span className="text-[10px] font-normal">SAR</span>
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-500 font-normal max-w-xs truncate" title={mv.description}>
                      {mv.description}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        مقيد ومرحل
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INTERNAL TRANSFER MODAL */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[120]" dir="rtl">
          <div className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-md w-full text-right relative">
            <div className="flex justify-between items-center pb-4 border-b">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                <h3 className="text-sm font-black text-slate-850">إجراء عملية تحويل مالي داخلي</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="space-y-4 mt-4 text-xs">
              
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">من حساب (المصدر) :</label>
                <select
                  value={transferFromId}
                  onChange={e => setTransferFromId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                >
                  <option value="">-- اختر الحساب المصدر --</option>
                  {banksAndWallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name_ar || w.name_en} ({fmt(w.balance)} {w.currency})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">إلى حساب (المستهدف) :</label>
                <select
                  value={transferToId}
                  onChange={e => setTransferToId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                >
                  <option value="">-- اختر الحساب المستهدف --</option>
                  {banksAndWallets.map(w => (
                    <option key={w.id} value={w.id}>{w.name_ar || w.name_en} ({fmt(w.balance)} {w.currency})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">مبلغ التحويل المالي :</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferAmount || ''}
                  onChange={e => setTransferAmount(parseFloat(e.target.value) || 0)}
                  placeholder="مثال: 5000"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold text-left"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">الوصف والبيان الإيضاحي :</label>
                <input
                  type="text"
                  required
                  value={transferDesc}
                  onChange={e => setTransferDesc(e.target.value)}
                  placeholder="مثال: تحويل داخلي لتغذية الخزنة النقدية لتغطية مصاريف النثريات"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-colors shadow-xs"
                >
                  تأكيد وتحويل رصيد الحساب وقيده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BALANCE MODAL */}
      {editingWallet && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[120]" dir="rtl">
          <div className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-md w-full text-right relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-850">تعديل رصيد الحساب</h3>
              </div>
              <button onClick={() => setEditingWallet(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4 mt-4 text-xs">
              <p className="text-slate-500">أنت تقوم بتعديل الرصيد الحالي لحساب: <span className="font-bold text-slate-800">[{editingWallet.name_ar || editingWallet.name_en}]</span></p>
              
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">الرصيد الجديد ({editingWallet.currency}) :</label>
                <input
                  type="number"
                  required
                  value={editBalanceInput}
                  onChange={e => setEditBalanceInput(e.target.value)}
                  placeholder="مثال: 150000"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono font-bold text-left outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const newBalance = parseFloat(editBalanceInput);
                    if (!isNaN(newBalance)) {
                      setBanksAndWallets(prev => prev.map(w => w.id === editingWallet.id ? { ...w, balance: newBalance } : w));
                      triggerSuccess(`تم تعديل رصيد [${editingWallet.name_ar || editingWallet.name_en}] بنجاح إلى ${newBalance} ${editingWallet.currency}.`);
                      setEditingWallet(null);
                    } else {
                      alert("الرجاء إدخال قيمة رقمية صحيحة.");
                    }
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-colors shadow-xs"
                >
                  حفظ الرصيد الجديد
                </button>
                <button
                  type="button"
                  onClick={() => setEditingWallet(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESET BALANCE MODAL */}
      {resetTargetWallet && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[120]" dir="rtl">
          <div className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-md w-full text-right relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-black text-slate-850">تصفير رصيد الحساب</h3>
              </div>
              <button onClick={() => setResetTargetWallet(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4 mt-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                هل أنت متأكد من رغبتك في تصفير (مسح) رصيد الحساب: 
                <strong className="text-slate-800 block mt-1">[{resetTargetWallet.name_ar || resetTargetWallet.name_en}]</strong>
                سيتم ضبط الرصيد الحالي ليكون <span className="font-mono font-black text-amber-600 text-sm">0 {resetTargetWallet.currency}</span>.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBanksAndWallets(prev => prev.map(w => w.id === resetTargetWallet.id ? { ...w, balance: 0 } : w));
                    triggerSuccess(`تم تصفير رصيد [${resetTargetWallet.name_ar || resetTargetWallet.name_en}] بنجاح.`);
                    setResetTargetWallet(null);
                  }}
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black text-xs transition-colors shadow-xs"
                >
                  نعم، تصفير الرصيد الآن
                </button>
                <button
                  type="button"
                  onClick={() => setResetTargetWallet(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE WALLET MODAL */}
      {deleteTargetWallet && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[120]" dir="rtl">
          <div className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-md w-full text-right relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-black text-slate-850">إزالة الحساب / الخزنة</h3>
              </div>
              <button onClick={() => setDeleteTargetWallet(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4 mt-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                هل أنت متأكد من رغبتك في إزالة هذا الحساب المصرفي/الخزنة نهائياً من النظام؟
                <strong className="text-slate-800 block mt-1">[{deleteTargetWallet.name_ar || deleteTargetWallet.name_en}]</strong>
                هذا الإجراء سيقوم بإزالة الخيار من قائمة المعاملات والتقارير المالية الجارية.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setBanksAndWallets(prev => prev.filter(w => w.id !== deleteTargetWallet.id));
                    triggerSuccess(`تمت إزالة الحساب [${deleteTargetWallet.name_ar || deleteTargetWallet.name_en}] بنجاح من القوائم.`);
                    setDeleteTargetWallet(null);
                  }}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs transition-colors shadow-xs"
                >
                  نعم، حذف نهائي
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTargetWallet(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
