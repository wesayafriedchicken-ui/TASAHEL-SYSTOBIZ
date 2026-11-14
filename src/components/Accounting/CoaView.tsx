import React, { useState } from 'react';
import { Plus, ChevronRight, ChevronDown, Trash2, Layers, Search } from 'lucide-react';
import { CoAAccount } from './AccountingTypes';

interface CoaViewProps {
  baseCurrency: string;
  coa: CoAAccount[];
  getAccountBalance: (accountId: string) => number;
  onAddCoaClick: () => void;
  setDeleteTarget: (target: { id: string; type: 'invoice' | 'bill' | 'coa' | 'journal' | 'statement' } | null) => void;
}

export const CoaView: React.FC<CoaViewProps> = ({
  baseCurrency,
  coa,
  getAccountBalance,
  onAddCoaClick,
  setDeleteTarget
}) => {

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses'>('all');

  const categories: { id: CoAAccount['type']; label: string; label_en: string }[] = [
    { id: 'assets', label: 'الأصول (Assets - 10000)', label_en: 'Assets' },
    { id: 'liabilities', label: 'الخصوم والمطلوبات (Liabilities - 20000)', label_en: 'Liabilities' },
    { id: 'equity', label: 'حقوق الملكية (Equity - 30000)', label_en: 'Equity' },
    { id: 'revenue', label: 'الإيرادات التشغيلية (Revenue - 40000)', label_en: 'Revenue' },
    { id: 'expenses', label: 'المصروفات والتكاليف (Expenses - 50000)', label_en: 'Expenses' },
  ];

  const fmt = (num: number) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const filteredCategories = categories.filter(cat => {
    if (selectedCategory !== 'all' && cat.id !== selectedCategory) {
      return false;
    }
    return true;
  });

  const getFilteredAccounts = (catId: string) => {
    return coa.filter(acc => {
      if (acc.type !== catId) return false;
      if (!searchTerm) return true;
      const term = (searchTerm || '').toLowerCase();
      return (
        (acc.id || '').toString().toLowerCase().includes(term) ||
        (acc.name_ar || '').toLowerCase().includes(term) ||
        (acc.name_en || '').toLowerCase().includes(term)
      );
    });
  };

  const hasAnyMatchingAccounts = filteredCategories.some(cat => getFilteredAccounts(cat.id).length > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-right" dir="rtl">
      
      {/* COA HEADER (Matched to uploaded image styling) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs" dir="ltr">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-xs">
            <Layers className="w-5.5 h-5.5 text-indigo-400" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-800 shrink-0" />
              Chart of Accounts (CoA)
            </h1>
            <p className="text-[10px] text-slate-400 mt-1">Chart of accounts tree for categorizing revenues and assets</p>
          </div>
        </div>
        <button
          onClick={onAddCoaClick}
          className="px-4 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap self-end md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Account to Directory
        </button>
      </div>

      {/* SEARCH & FILTERS ROW (Matched to uploaded image styling) */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between w-full bg-transparent" dir="ltr">
        {/* Search bar */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Search by account name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-150 text-xs font-bold outline-none shadow-xs focus:ring-2 focus:ring-indigo-500/10 focus:border-[#4F46E5] transition-all text-left"
          />
          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 w-full lg:w-auto overflow-x-auto py-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'assets', label: 'Assets' },
            { id: 'liabilities', label: 'Liabilities' },
            { id: 'revenue', label: 'Revenues' },
            { id: 'expenses', label: 'Expenses' }
          ].map((pill) => {
            const isActive = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setSelectedCategory(pill.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                  isActive
                    ? 'bg-[#4F46E5] text-white font-black'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-150/50'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* COA TREE DIRECTORY */}
      <div className="grid grid-cols-1 gap-5">
        {!hasAnyMatchingAccounts ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-xs">
            <p className="text-xs text-slate-400 font-bold">لم يتم العثور على أي حسابات محاسبية تطابق بحثك الحالي.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const catAccounts = getFilteredAccounts(cat.id);
            const catTotalBalance = catAccounts.reduce((sum, acc) => sum + getAccountBalance(acc.id), 0);

            // If we are searching or filtering and this category is empty, we can choose to hide or show empty
            if (searchTerm && catAccounts.length === 0) return null;

            return (
              <div key={cat.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-black text-slate-800">{cat.label}</span>
                  </div>
                  <div className="text-left font-mono font-black text-xs text-slate-900">
                    <span>إجمالي الرصيد: </span>
                    <span className={cat.id === 'expenses' ? 'text-rose-600' : 'text-indigo-700'}>
                      {fmt(catTotalBalance)} {baseCurrency}
                    </span>
                  </div>
                </div>

                <div className="p-4 divide-y divide-slate-50">
                  {catAccounts.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic text-center py-4">لا توجد حسابات مطابقة تحت هذا القسم الرئيسي.</p>
                  ) : (
                    catAccounts.map((account) => {
                      const balance = getAccountBalance(account.id);
                      return (
                        <div key={account.id} className="py-3 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-all">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-xs text-slate-400">[{account.id}]</span>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{account.name_ar || account.name_en}</p>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{account.name_en}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <p className="font-mono font-bold text-xs text-slate-900">
                              {fmt(balance)} <span className="text-[10px] text-slate-400">{baseCurrency}</span>
                            </p>
                            <button
                              onClick={() => setDeleteTarget({ id: account.id, type: 'coa' })}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded"
                              title="حذف الحساب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
