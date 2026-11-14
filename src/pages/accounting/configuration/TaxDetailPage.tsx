import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Check, X, Cloud, Bookmark, Menu, 
  HelpCircle, Trash2, GripVertical, MoreHorizontal,
  CheckCircle2, ArrowLeft, Search, Paperclip, User,
  ChevronDown
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../context/AuthContext';
import { DEFAULT_COA } from '../../../components/Accounting/AccountingSeeds';

// Comprehensive Egyptian Chart of Accounts Seed for Taxes and Operations
export const DEFAULT_ACCOUNT_LIST = [
  ...DEFAULT_COA,
  { id: '202000', name_en: 'VAT Output Tax', name_ar: 'ضريبة القيمة المضافة مخرجات', type: 'liabilities' },
  { id: '202010', name_en: 'VAT Cash Basis Transition', name_ar: 'حساب وسيط ضريبة الأساس النقدي', type: 'liabilities' },
  { id: '202500', name_en: 'Withholding Tax Payable', name_ar: 'ضريبة الخصم من المنبع مستحقة', type: 'liabilities' },
  { id: '210802', name_en: 'Base Tax Received', name_ar: 'أساس الضريبة المستلمة', type: 'liabilities' },
  { id: '500100', name_en: 'Sales Account', name_ar: 'حساب المبيعات العامة', type: 'revenue' },
  { id: '120100', name_en: 'Inventory - Raw Materials', name_ar: 'مخزون خامات', type: 'assets' },
  { id: '131300', name_en: 'Other Prepayments', name_ar: 'مصروفات مدفوعة مقدماً أخرى', type: 'assets' },
  { id: '160103', name_en: 'Bank Suspense', name_ar: 'معلق البنك', type: 'assets' },
  { id: '160700', name_en: 'Funds in Transit', name_ar: 'تحويلات نقدية قيد التحصيل', type: 'assets' },
  { id: '230100', name_en: 'Deferred Income', name_ar: 'إيرادات مؤجلة', type: 'liabilities' },
  { id: '424800', name_en: 'Other Expenses', name_ar: 'مصروفات أخرى متنوعة', type: 'expenses' },
  { id: '430800', name_en: 'Cash Discount Loss', name_ar: 'خصم مسموح به (خسارة)', type: 'expenses' },
  { id: '510400', name_en: 'Cash Discount Gain', name_ar: 'خصم مكتسب (أرباح)', type: 'revenue' },
];

interface AccountDropdownProps {
  value: string;
  onChange: (value: string) => void;
  accounts: any[];
  placeholder?: string;
  isTable?: boolean;
}

const AccountDropdown: React.FC<AccountDropdownProps> = ({
  value,
  onChange,
  accounts,
  placeholder = 'Select account...',
  isTable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove?: boolean }>({
    top: 0,
    left: 0,
    width: 340
  });

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 300;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
    
    const dropdownWidth = Math.max(rect.width, 340);
    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 16) {
      left = window.innerWidth - dropdownWidth - 16;
    }
    if (left < 16) left = 16;

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left,
      width: dropdownWidth,
      placeAbove
    });
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      const handleScrollOrResize = () => {
        updateCoords();
      };
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        if (triggerRef.current && triggerRef.current.contains(target)) {
          return;
        }
        if (dropdownRef.current && dropdownRef.current.contains(target)) {
          return;
        }
        setIsOpen(false);
      };

      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      document.addEventListener('mousedown', handleClickOutside);

      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return accounts;
    const q = searchTerm.toLowerCase();
    return accounts.filter((a: any) => 
      String(a.id).toLowerCase().includes(q) || 
      (a.name_en && a.name_en.toLowerCase().includes(q)) ||
      (a.name_ar && a.name_ar.toLowerCase().includes(q)) ||
      (a.type && a.type.toLowerCase().includes(q))
    );
  }, [accounts, searchTerm]);

  const selectedAccount = useMemo(() => {
    if (!value) return null;
    return accounts.find((a: any) => {
      const formatted = `${a.id} ${a.name_en || a.name || ''}`.trim();
      return formatted === value || String(a.id) === value;
    });
  }, [accounts, value]);

  return (
    <div className="relative w-full" ref={triggerRef}>
      <div
        onClick={() => {
          if (!isOpen) updateCoords();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "w-full flex items-center justify-between gap-1.5 cursor-pointer transition-colors group",
          isTable 
            ? "py-1.5 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] border border-transparent hover:border-slate-200 dark:hover:border-slate-700" 
            : "pb-1 border-b border-slate-300 dark:border-slate-700 hover:border-[#007A78] dark:hover:border-emerald-400 text-xs font-medium"
        )}
      >
        <span className={cn("truncate font-medium", !value && "text-slate-400")}>
          {selectedAccount ? `${selectedAccount.id} ${selectedAccount.name_en || selectedAccount.name}` : (value || placeholder)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={cn("w-3 h-3 text-slate-400 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: coords.placeAbove ? undefined : `${coords.top}px`,
            bottom: coords.placeAbove ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 99999
          }}
          className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 text-xs animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search box */}
          <div className="px-3 pb-2 pt-0.5 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search account code, name..."
                autoFocus
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-slate-100 focus:border-[#007A78] dark:focus:border-emerald-400 focus:ring-1 focus:ring-[#007A78]"
              />
            </div>
          </div>

          {/* Account list */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 p-1">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-md flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="italic font-medium">-- None / Blank Account --</span>
              {!value && <Check className="w-3.5 h-3.5 text-emerald-500" />}
            </button>

            {filteredAccounts.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                No matching accounts found
              </div>
            ) : (
              filteredAccounts.map((acc: any) => {
                const label = `${acc.id} ${acc.name_en || acc.name || ''}`.trim();
                const isSelected = selectedAccount?.id === acc.id || value === label;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      onChange(label);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50/80 dark:hover:bg-emerald-950/60 flex items-center justify-between gap-3 transition-colors cursor-pointer my-0.5",
                      isSelected 
                        ? "bg-emerald-50 dark:bg-emerald-950/70 text-[#007A78] dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800" 
                        : "text-slate-800 dark:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shrink-0">
                        {acc.id}
                      </span>
                      <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                        {acc.name_en || acc.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {acc.type && (
                        <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {acc.type}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export interface TaxDistributionLine {
  id: string;
  based_on: string;
  account: string;
  tax_grids: string;
}

export interface TaxRecord {
  id: string;
  tax_name: string;
  description: string;
  tax_type: 'Sales' | 'Purchases' | 'None';
  tax_scope: string;
  label_on_invoices: string;
  active: boolean;
  tax_computation: 'Percentage' | 'Percentage Tax Included' | 'Fixed' | 'Group of Taxes';
  amount: number;
  eta_code: string;
  fiscal_position: string;
  replaces: string;
  withhold: boolean;
  tax_group: string;
  country: string;
  tax_category_code: string;
  included_in_price: 'Default' | 'Tax Included' | 'Tax Excluded';
  affect_base_subsequent: boolean;
  tax_exigibility: 'Based on Invoice' | 'Based on Payment';
  cash_basis_transition_account?: string;
  legal_notes: string;
  invoice_distribution: TaxDistributionLine[];
  refund_distribution: TaxDistributionLine[];
  chatter_messages?: { id: string; user: string; text: string; date: string }[];
}

export const DEFAULT_TAXES_LIST: TaxRecord[] = [
  {
    id: '0-ex',
    tax_name: '0% EX',
    description: 'Zero-rated exports',
    tax_type: 'Sales',
    tax_scope: '',
    label_on_invoices: '0% Export',
    active: false,
    tax_computation: 'Percentage',
    amount: 0.0,
    eta_code: 'T1 - Value added tax',
    fiscal_position: 'Export',
    replaces: '',
    withhold: false,
    tax_group: 'VAT 0%',
    country: 'Egypt',
    tax_category_code: 'V0',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Invoice',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ]
  },
  {
    id: '14-ex-only-b',
    tax_name: '14% EX ONLY B',
    description: 'Import - Only Base',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: '14% Import - Base',
    active: true,
    tax_computation: 'Percentage Tax Included',
    amount: 0.0,
    eta_code: 'T1 - Value added tax',
    fiscal_position: 'Non-Egypt',
    replaces: '',
    withhold: false,
    tax_group: 'VAT 14%',
    country: 'Egypt',
    tax_category_code: 'V1',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Invoice',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: '100.00 of tax', account: '', tax_grids: '' },
      { id: '2', based_on: 'Base', account: '', tax_grids: '9b' }
    ]
  },
  {
    id: '14-sales',
    tax_name: '14%',
    description: '',
    tax_type: 'Sales',
    tax_scope: '',
    label_on_invoices: '14%',
    active: true,
    tax_computation: 'Percentage',
    amount: 14.0,
    eta_code: 'T1 - Value added tax',
    fiscal_position: 'all',
    replaces: '',
    withhold: false,
    tax_group: 'VAT 14%',
    country: 'Egypt',
    tax_category_code: 'V1',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Invoice',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '500100 Sales Account', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '202000 VAT Output Tax', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '500100 Sales Account', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '202000 VAT Output Tax', tax_grids: '' }
    ]
  },
  {
    id: '14-purchases',
    tax_name: '14%',
    description: '',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: '14%',
    active: true,
    tax_computation: 'Percentage',
    amount: 14.0,
    eta_code: 'T1 - Value added tax',
    fiscal_position: 'all',
    replaces: '',
    withhold: false,
    tax_group: 'VAT 14%',
    country: 'Egypt',
    tax_category_code: 'V1',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Invoice',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '424800 Other Expenses', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '125000 VAT Input Recoverable', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '424800 Other Expenses', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '125000 VAT Input Recoverable', tax_grids: '' }
    ]
  },
  {
    id: '0-sales',
    tax_name: '0%',
    description: '',
    tax_type: 'Sales',
    tax_scope: '',
    label_on_invoices: '0%',
    active: true,
    tax_computation: 'Percentage',
    amount: 0.0,
    eta_code: 'T1 - Value added tax',
    fiscal_position: 'all',
    replaces: '',
    withhold: false,
    tax_group: 'VAT 0%',
    country: 'Egypt',
    tax_category_code: 'V0',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Invoice',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ]
  },
  {
    id: '0-purchases',
    tax_name: '0%',
    description: '',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: '0%',
    active: true,
    tax_computation: 'Percentage',
    amount: 0.0,
    eta_code: 'T1 - Value added tax',
    fiscal_position: 'all',
    replaces: '',
    withhold: false,
    tax_group: 'VAT 0%',
    country: 'Egypt',
    tax_category_code: 'V0',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Invoice',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ]
  },
  {
    id: '14-ex-only',
    tax_name: '14% EX ONLY',
    description: 'Import - Only VAT',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: '14% Import',
    active: true,
    tax_computation: 'Percentage',
    amount: 14.0,
    eta_code: 'T1 - Value added tax',
    fiscal_position: 'Non-Egypt',
    replaces: '',
    withhold: false,
    tax_group: 'VAT 14%',
    country: 'Egypt',
    tax_category_code: 'V1',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Invoice',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '125000 VAT Input Recoverable', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '125000 VAT Input Recoverable', tax_grids: '' }
    ]
  },
  {
    id: '0-ext-sales',
    tax_name: '0% EXT',
    description: '',
    tax_type: 'Sales',
    tax_scope: '',
    label_on_invoices: 'Exempt',
    active: true,
    tax_computation: 'Percentage',
    amount: 0.0,
    eta_code: 'T1 - Value added tax',
    fiscal_position: 'all',
    replaces: '',
    withhold: false,
    tax_group: 'VAT 0%',
    country: 'Egypt',
    tax_category_code: 'E',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Invoice',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ]
  },
  {
    id: '0-ext-purchases',
    tax_name: '0% EXT',
    description: '',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: 'Exempt',
    active: true,
    tax_computation: 'Percentage',
    amount: 0.0,
    eta_code: 'T1 - Value added tax',
    fiscal_position: 'all',
    replaces: '',
    withhold: false,
    tax_group: 'VAT 0%',
    country: 'Egypt',
    tax_category_code: 'E',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Invoice',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
      { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
    ]
  },
  {
    id: '1-wh-c-d',
    tax_name: '1% WH C D',
    description: 'Deducted Withholding on Payment - Contracting and supplying',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: '1% Withholding',
    active: false,
    tax_computation: 'Percentage',
    amount: 1.0,
    eta_code: 'T4 - Withholding tax (WHT)',
    fiscal_position: 'all',
    replaces: '',
    withhold: true,
    tax_group: 'Withholding Tax',
    country: 'Egypt',
    tax_category_code: 'W1',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Payment',
    cash_basis_transition_account: '210802 Base Tax Received',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ]
  },
  {
    id: '1-wh-c-g',
    tax_name: '1% WH C G',
    description: 'Gross Withholding on Payment - Contracting and supplying',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: '1% Withholding',
    active: true,
    tax_computation: 'Percentage',
    amount: 1.0,
    eta_code: 'T4 - Withholding tax (WHT)',
    fiscal_position: 'all',
    replaces: '',
    withhold: true,
    tax_group: 'Withholding Tax',
    country: 'Egypt',
    tax_category_code: 'W1',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Payment',
    cash_basis_transition_account: '210802 Base Tax Received',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ]
  },
  {
    id: '3-wh-s-d',
    tax_name: '3% WH S D',
    description: 'Deducted Withholding on Payment - All types of services',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: '3% Withholding',
    active: false,
    tax_computation: 'Percentage',
    amount: 3.0,
    eta_code: 'T4 - Withholding tax (WHT)',
    fiscal_position: 'all',
    replaces: '',
    withhold: true,
    tax_group: 'Withholding Tax',
    country: 'Egypt',
    tax_category_code: 'W3',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Payment',
    cash_basis_transition_account: '210802 Base Tax Received',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ]
  },
  {
    id: '3-wh-s-g',
    tax_name: '3% WH S G',
    description: 'Gross Withholding on Payment - All types of services',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: '3% Withholding',
    active: true,
    tax_computation: 'Percentage',
    amount: 3.0,
    eta_code: 'T4 - Withholding tax (WHT)',
    fiscal_position: 'all',
    replaces: '',
    withhold: true,
    tax_group: 'Withholding Tax',
    country: 'Egypt',
    tax_category_code: 'W3',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Payment',
    cash_basis_transition_account: '210802 Base Tax Received',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ]
  },
  {
    id: '5-wh-cb-d',
    tax_name: '5% WH CB D',
    description: 'Deducted Withholding on Payment - Commissions',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: '5% Withholding',
    active: false,
    tax_computation: 'Percentage',
    amount: 5.0,
    eta_code: 'T4 - Withholding tax (WHT)',
    fiscal_position: 'all',
    replaces: '',
    withhold: true,
    tax_group: 'Withholding Tax',
    country: 'Egypt',
    tax_category_code: 'W5',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Payment',
    cash_basis_transition_account: '210802 Base Tax Received',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ]
  },
  {
    id: '5-wh-cb-g',
    tax_name: '5% WH CB G',
    description: 'Gross Withholding on Payment - Commissions',
    tax_type: 'Purchases',
    tax_scope: '',
    label_on_invoices: '5% Withholding',
    active: true,
    tax_computation: 'Percentage',
    amount: 5.0,
    eta_code: 'T4 - Withholding tax (WHT)',
    fiscal_position: 'all',
    replaces: '',
    withhold: true,
    tax_group: 'Withholding Tax',
    country: 'Egypt',
    tax_category_code: 'W5',
    included_in_price: 'Default',
    affect_base_subsequent: false,
    tax_exigibility: 'Based on Payment',
    cash_basis_transition_account: '210802 Base Tax Received',
    legal_notes: '',
    invoice_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ],
    refund_distribution: [
      { id: '1', based_on: 'Base', account: '', tax_grids: '' },
      { id: '2', based_on: '100.00 of tax', account: '202500 Withholding Tax Payable', tax_grids: '' }
    ]
  }
];

export const TaxDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const isNew = !id || id === 'new';

  const currentUserName = authUser?.name || 'اسراء حسين';
  const currentUserInitial = currentUserName.charAt(0) || 'E';

  // Load taxes from localStorage or fallback
  const [allTaxes, setAllTaxes] = useState<TaxRecord[]>(() => {
    try {
      const saved = localStorage.getItem('acct_taxes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return DEFAULT_TAXES_LIST;
  });

  const existingTax = useMemo(() => {
    if (isNew) return null;
    return allTaxes.find(t => t.id === id);
  }, [allTaxes, id, isNew]);

  // Load Chart of Accounts
  const [chartOfAccounts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('acct_coa') || localStorage.getItem('acct_chart_of_accounts');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((a: any) => String(a.id)));
        const extras = DEFAULT_ACCOUNT_LIST.filter(a => !existingIds.has(String(a.id)));
        return [...parsed, ...extras];
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_ACCOUNT_LIST;
  });

  // Form Fields State (Matching Image 2, 3, 4)
  const [taxName, setTaxName] = useState('');
  const [taxComputation, setTaxComputation] = useState<'Percentage' | 'Percentage Tax Included' | 'Fixed' | 'Group of Taxes'>('Percentage');
  const [amount, setAmount] = useState<number | string>('0.0000');
  const [description, setDescription] = useState('');
  const [taxType, setTaxType] = useState<'Sales' | 'Purchases' | 'None'>('Sales');
  const [etaCode, setEtaCode] = useState('T1 - Value added tax');
  const [fiscalPosition, setFiscalPosition] = useState('all');
  const [replaces, setReplaces] = useState('');
  const [withhold, setWithhold] = useState(false);

  // Advanced Options Fields State (Matching Image 4)
  const [labelOnInvoices, setLabelOnInvoices] = useState('');
  const [taxScope, setTaxScope] = useState('');
  const [taxGroup, setTaxGroup] = useState('VAT 14%');
  const [country, setCountry] = useState('Egypt');
  const [taxCategoryCode, setTaxCategoryCode] = useState('');
  const [includedInPrice, setIncludedInPrice] = useState<'Default' | 'Tax Included' | 'Tax Excluded'>('Default');
  const [affectBaseSubsequent, setAffectBaseSubsequent] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [taxExigibility, setTaxExigibility] = useState<'Based on Invoice' | 'Based on Payment'>('Based on Invoice');
  const [cashBasisTransitionAccount, setCashBasisTransitionAccount] = useState('');
  const [legalNotes, setLegalNotes] = useState('');

  // Distribution Tables State (Matching Image 2 & 3)
  const [invoiceDistribution, setInvoiceDistribution] = useState<TaxDistributionLine[]>([
    { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
    { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
  ]);
  const [refundDistribution, setRefundDistribution] = useState<TaxDistributionLine[]>([
    { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
    { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
  ]);

  // UI State
  const [activeTab, setActiveTab] = useState<'definition' | 'advanced'>('definition');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'dirty'>('saved');

  // Chatter State
  const [activeChatterAction, setActiveChatterAction] = useState<'none' | 'message' | 'note'>('none');
  const [chatterText, setChatterText] = useState('');
  const [chatterMessages, setChatterMessages] = useState<{ id: string; user: string; text: string; date: string }[]>([]);

  // Initialize data
  useEffect(() => {
    if (existingTax) {
      setTaxName(existingTax.tax_name || '');
      setTaxComputation(existingTax.tax_computation || 'Percentage');
      setAmount(existingTax.amount !== undefined ? Number(existingTax.amount).toFixed(4) : '0.0000');
      setDescription(existingTax.description || '');
      setTaxType(existingTax.tax_type || 'Sales');
      setEtaCode(existingTax.eta_code || 'T1 - Value added tax');
      setFiscalPosition(existingTax.fiscal_position || 'all');
      setReplaces(existingTax.replaces || '');
      setWithhold(Boolean(existingTax.withhold));

      setLabelOnInvoices(existingTax.label_on_invoices || '');
      setTaxScope(existingTax.tax_scope || '');
      setTaxGroup(existingTax.tax_group || 'VAT 14%');
      setCountry(existingTax.country || 'Egypt');
      setTaxCategoryCode(existingTax.tax_category_code || '');
      setIncludedInPrice(existingTax.included_in_price || 'Default');
      setAffectBaseSubsequent(Boolean(existingTax.affect_base_subsequent));
      setIsActive(existingTax.active ?? true);
      setTaxExigibility(existingTax.tax_exigibility || 'Based on Invoice');
      setCashBasisTransitionAccount(
        existingTax.cash_basis_transition_account || 
        (existingTax.tax_exigibility === 'Based on Payment' ? '210802 Base Tax Received' : '')
      );
      setLegalNotes(existingTax.legal_notes || '');

      setInvoiceDistribution(existingTax.invoice_distribution || [
        { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
        { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
      ]);
      setRefundDistribution(existingTax.refund_distribution || [
        { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
        { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
      ]);

      setChatterMessages(existingTax.chatter_messages || [
        {
          id: '1',
          user: currentUserName,
          text: `Creating record ${existingTax.tax_name}...`,
          date: 'Today'
        }
      ]);
      setSaveStatus('saved');
    } else if (isNew) {
      setTaxName('');
      setTaxComputation('Percentage');
      setAmount('0.0000');
      setDescription('');
      setTaxType('Sales');
      setEtaCode('T1 - Value added tax');
      setFiscalPosition('all');
      setReplaces('');
      setWithhold(false);

      setLabelOnInvoices('');
      setTaxScope('');
      setTaxGroup('VAT 14%');
      setCountry('Egypt');
      setTaxCategoryCode('');
      setIncludedInPrice('Default');
      setAffectBaseSubsequent(false);
      setIsActive(true);
      setTaxExigibility('Based on Invoice');
      setCashBasisTransitionAccount('');
      setLegalNotes('');

      setInvoiceDistribution([
        { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
        { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
      ]);
      setRefundDistribution([
        { id: '1', based_on: 'Base', account: '', tax_grids: '9b' },
        { id: '2', based_on: '100.00 of tax', account: '', tax_grids: '' }
      ]);

      setChatterMessages([
        {
          id: '1',
          user: currentUserName,
          text: 'Creating a new record...',
          date: 'Today'
        }
      ]);
      setSaveStatus('dirty');
    }
  }, [existingTax, isNew, currentUserName]);

  // Handle Save
  const handleSave = () => {
    if (!taxName.trim()) {
      setToastMessage('Please enter a Tax Name.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const recordId = isNew ? taxName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `tax-${Date.now()}` : id!;

    const updatedRecord: TaxRecord = {
      id: recordId,
      tax_name: taxName.trim(),
      description: description.trim(),
      tax_type: taxType,
      tax_scope: taxScope,
      label_on_invoices: labelOnInvoices || taxName.trim(),
      active: isActive,
      tax_computation: taxComputation,
      amount: parseFloat(String(amount)) || 0,
      eta_code: etaCode,
      fiscal_position: fiscalPosition,
      replaces: replaces,
      withhold: withhold,
      tax_group: taxGroup,
      country: country,
      tax_category_code: taxCategoryCode,
      included_in_price: includedInPrice,
      affect_base_subsequent: affectBaseSubsequent,
      tax_exigibility: taxExigibility,
      cash_basis_transition_account: taxExigibility === 'Based on Payment' ? cashBasisTransitionAccount : undefined,
      legal_notes: legalNotes,
      invoice_distribution: invoiceDistribution,
      refund_distribution: refundDistribution,
      chatter_messages: chatterMessages
    };

    let updatedList = [...allTaxes];
    const existingIndex = updatedList.findIndex(t => t.id === recordId);

    if (existingIndex >= 0) {
      updatedList[existingIndex] = updatedRecord;
    } else {
      updatedList.push(updatedRecord);
    }

    setAllTaxes(updatedList);
    try {
      localStorage.setItem('acct_taxes', JSON.stringify(updatedList));
      setSaveStatus('saved');
      setToastMessage(`Tax "${taxName}" saved successfully.`);
      setTimeout(() => setToastMessage(null), 3000);

      if (isNew) {
        navigate(`/accounting/configuration/taxes/${encodeURIComponent(recordId)}`, { replace: true });
      }
    } catch (e) {
      setToastMessage('Error saving tax record.');
    }
  };

  // Add line to invoice distribution
  const handleAddInvoiceLine = () => {
    setInvoiceDistribution([
      ...invoiceDistribution,
      { id: String(Date.now()), based_on: '100.00 of tax', account: '', tax_grids: '' }
    ]);
    setSaveStatus('dirty');
  };

  const handleRemoveInvoiceLine = (lineId: string) => {
    setInvoiceDistribution(invoiceDistribution.filter(l => l.id !== lineId));
    setSaveStatus('dirty');
  };

  // Add line to refund distribution
  const handleAddRefundLine = () => {
    setRefundDistribution([
      ...refundDistribution,
      { id: String(Date.now()), based_on: '100.00 of tax', account: '', tax_grids: '' }
    ]);
    setSaveStatus('dirty');
  };

  const handleRemoveRefundLine = (lineId: string) => {
    setRefundDistribution(refundDistribution.filter(l => l.id !== lineId));
    setSaveStatus('dirty');
  };

  // Chatter post
  const handlePostChatter = () => {
    if (!chatterText.trim()) return;
    const newMsg = {
      id: String(Date.now()),
      user: currentUserName,
      text: chatterText.trim(),
      date: 'Today'
    };
    const updated = [newMsg, ...chatterMessages];
    setChatterMessages(updated);
    setChatterText('');
    setActiveChatterAction('none');

    if (!isNew && id) {
      const updatedList = allTaxes.map(t => t.id === id ? { ...t, chatter_messages: updated } : t);
      setAllTaxes(updatedList);
      localStorage.setItem('acct_taxes', JSON.stringify(updatedList));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb] dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header / Action Bar (Matching Image 2, 3, 4) */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 sticky top-12 z-30 shadow-2xs">
        
        {/* Left Side: "New" button + Breadcrumbs + Save / Discard */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/accounting/configuration/taxes/new')}
            className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold text-xs shadow-2xs cursor-pointer transition-colors"
          >
            New
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Link 
              to="/accounting/configuration/taxes"
              className="text-[#007A78] dark:text-emerald-400 hover:underline font-semibold"
            >
              Taxes
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {isNew ? 'New' : taxName || 'Tax'}
            </span>
            <button 
              type="button" 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
              title="More options"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

          {/* Save & Discard */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSave}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#007A78] dark:hover:text-emerald-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Save changes"
            >
              <Cloud className={cn("w-4 h-4", saveStatus === 'saved' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/accounting/configuration/taxes')}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              title="Discard and return to list"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Chatter Buttons (Matching Image 2, 3, 4) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveChatterAction(activeChatterAction === 'message' ? 'none' : 'message')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeChatterAction === 'message'
                ? "bg-[#593b51] text-white ring-2 ring-[#714B67]/40 shadow-xs"
                : "bg-[#714B67] hover:bg-[#5f3f57] text-white shadow-xs"
            )}
          >
            <span>Send message</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChatterAction(activeChatterAction === 'note' ? 'none' : 'note')}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
              activeChatterAction === 'note'
                ? "border-[#714B67] bg-slate-50 dark:bg-slate-800 text-[#714B67] dark:text-purple-300"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            )}
          >
            <span>Log note</span>
          </button>
        </div>

      </div>

      {/* Main Container: Split View (Form on Left ~75%, Chatter on Right ~25%) */}
      <div className="flex-1 w-full max-w-[1700px] mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form Card (Matching Images 2, 3, 4) */}
        <div className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-6 sm:p-8 space-y-6">
          
          {/* Top Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-xs">
            
            {/* Left Column Fields */}
            <div className="space-y-3.5">
              
              {/* Tax Name */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                  Tax Name
                </span>
                <input
                  type="text"
                  value={taxName}
                  onChange={(e) => {
                    setTaxName(e.target.value);
                    setSaveStatus('dirty');
                  }}
                  placeholder="e.g. 14% EX ONLY B"
                  className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-semibold text-slate-900 dark:text-white outline-none focus:border-[#007A78]"
                />
              </div>

              {/* Tax Computation ? */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                  <span>Tax Computation</span>
                  <span title="Method used to calculate the tax amount">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <select
                  value={taxComputation}
                  onChange={(e: any) => {
                    setTaxComputation(e.target.value);
                    setSaveStatus('dirty');
                  }}
                  className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="Percentage">Percentage</option>
                  <option value="Percentage Tax Included">Percentage Tax Included</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Group of Taxes">Group of Taxes</option>
                </select>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                  Amount
                </span>
                <div className="flex items-center gap-1.5 w-full max-w-sm">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setSaveStatus('dirty');
                    }}
                    placeholder="0.0000"
                    className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-mono font-medium text-slate-900 dark:text-white outline-none focus:border-[#007A78]"
                  />
                  <span className="font-bold text-slate-500">%</span>
                </div>
              </div>

              {/* Description */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                  Description
                </span>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setSaveStatus('dirty');
                  }}
                  placeholder="e.g. Import - Only Base"
                  className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-[#007A78]"
                />
              </div>

            </div>

            {/* Right Column Fields */}
            <div className="space-y-3.5">
              
              {/* Tax Type ? */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                  <span>Tax Type</span>
                  <span title="Determines whether this tax applies to customer sales or vendor purchases">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <select
                  value={taxType}
                  onChange={(e: any) => {
                    setTaxType(e.target.value);
                    setSaveStatus('dirty');
                  }}
                  className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="Sales">Sales</option>
                  <option value="Purchases">Purchases</option>
                  <option value="None">None</option>
                </select>
              </div>

              {/* ETA Code (Egypt) - Displayed if Sales or Egypt localization (Matching Image 3) */}
              {taxType === 'Sales' && (
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                    ETA Code (Egypt)
                  </span>
                  <select
                    value={etaCode}
                    onChange={(e) => {
                      setEtaCode(e.target.value);
                      setSaveStatus('dirty');
                    }}
                    className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="T1 - Value added tax">T1 - Value added tax</option>
                    <option value="T2 - Table tax (percentage)">T2 - Table tax (percentage)</option>
                    <option value="T3 - Table tax (fixed)">T3 - Table tax (fixed)</option>
                    <option value="T4 - Withholding tax (WHT)">T4 - Withholding tax (WHT)</option>
                    <option value="T5 - Stamping tax (percentage)">T5 - Stamping tax (percentage)</option>
                    <option value="T6 - Stamping tax (amount)">T6 - Stamping tax (amount)</option>
                  </select>
                </div>
              )}

              {/* Fiscal Position */}
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                  Fiscal Position
                </span>
                <div className="w-full max-w-sm flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                    <span>{fiscalPosition}</span>
                    {fiscalPosition !== 'all' && (
                      <button type="button" onClick={() => setFiscalPosition('all')} className="hover:text-rose-500">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                  <input
                    type="text"
                    placeholder="Type to filter..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                        setFiscalPosition((e.target as HTMLInputElement).value.trim());
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                    className="flex-1 bg-transparent border-b border-slate-200 dark:border-slate-800 pb-0.5 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Replaces ? (Matching Image 2) */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                  <span>Replaces</span>
                  <span title="Tax that this tax replaces in certain conditions">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <input
                  type="text"
                  value={replaces}
                  onChange={(e) => {
                    setReplaces(e.target.value);
                    setSaveStatus('dirty');
                  }}
                  placeholder="Select tax to replace..."
                  className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              {/* Withhold ? (Matching Image 2 & 3) */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-32 shrink-0">
                  <span>Withhold</span>
                  <span title="Enable if this tax represents a withholding tax deduction">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                </div>
                <div className="w-full max-w-sm">
                  <input
                    type="checkbox"
                    checked={withhold}
                    onChange={(e) => {
                      setWithhold(e.target.checked);
                      setSaveStatus('dirty');
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-[#007A78] focus:ring-[#007A78] cursor-pointer"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* Form Tabs: Definition & Advanced Options (Matching Image 2, 3, 4) */}
          <div className="border-b border-slate-200 dark:border-slate-800 pt-2 flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('definition')}
              className={cn(
                "pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
                activeTab === 'definition'
                  ? "border-[#714B67] dark:border-emerald-400 text-[#714B67] dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              Definition
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('advanced')}
              className={cn(
                "pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer",
                activeTab === 'advanced'
                  ? "border-[#714B67] dark:border-emerald-400 text-[#714B67] dark:text-emerald-400"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              Advanced Options
            </button>
          </div>

          {/* TAB 1: DEFINITION (Matching Image 2 & 3) */}
          {activeTab === 'definition' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs pt-1">
              
              {/* Left Distribution Table: DISTRIBUTION FOR INVOICES */}
              <div className="space-y-3">
                <div className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  DISTRIBUTION FOR INVOICES
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 font-semibold">
                        <th className="py-2 px-2 w-8"></th>
                        <th className="py-2 px-3">% Based On</th>
                        <th className="py-2 px-3">Account</th>
                        <th className="py-2 px-3 w-20">Tax Grids</th>
                        <th className="py-2 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {invoiceDistribution.map((line, idx) => (
                        <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-2 text-slate-300">
                            <GripVertical className="w-3.5 h-3.5" />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={line.based_on}
                              onChange={(e) => {
                                const copy = [...invoiceDistribution];
                                copy[idx].based_on = e.target.value;
                                setInvoiceDistribution(copy);
                                setSaveStatus('dirty');
                              }}
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none font-medium"
                            >
                              <option value="Base">Base</option>
                              <option value="100.00 of tax">100.00 of tax</option>
                              <option value="Percentage of tax">Percentage of tax</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 min-w-[200px]">
                            <AccountDropdown
                              value={line.account}
                              onChange={(val) => {
                                const copy = [...invoiceDistribution];
                                copy[idx].account = val;
                                setInvoiceDistribution(copy);
                                setSaveStatus('dirty');
                              }}
                              accounts={chartOfAccounts}
                              placeholder="Select account..."
                              isTable
                            />
                          </td>
                          <td className="py-2 px-3">
                            {line.tax_grids ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-semibold text-[11px]">
                                {line.tax_grids}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={line.tax_grids}
                                onChange={(e) => {
                                  const copy = [...invoiceDistribution];
                                  copy[idx].tax_grids = e.target.value;
                                  setInvoiceDistribution(copy);
                                  setSaveStatus('dirty');
                                }}
                                placeholder="Grid"
                                className="w-12 bg-transparent text-[11px] outline-none"
                              />
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveInvoiceLine(line.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                              title="Delete line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                    <button
                      type="button"
                      onClick={handleAddInvoiceLine}
                      className="text-[#007A78] dark:text-emerald-400 hover:underline font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Add a line</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Distribution Table: DISTRIBUTION FOR REFUNDS */}
              <div className="space-y-3">
                <div className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  DISTRIBUTION FOR REFUNDS
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 font-semibold">
                        <th className="py-2 px-2 w-8"></th>
                        <th className="py-2 px-3">% Based On</th>
                        <th className="py-2 px-3">Account</th>
                        <th className="py-2 px-3 w-20">Tax Grids</th>
                        <th className="py-2 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {refundDistribution.map((line, idx) => (
                        <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2 px-2 text-slate-300">
                            <GripVertical className="w-3.5 h-3.5" />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={line.based_on}
                              onChange={(e) => {
                                const copy = [...refundDistribution];
                                copy[idx].based_on = e.target.value;
                                setRefundDistribution(copy);
                                setSaveStatus('dirty');
                              }}
                              className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none font-medium"
                            >
                              <option value="100.00 of tax">100.00 of tax</option>
                              <option value="Base">Base</option>
                              <option value="Percentage of tax">Percentage of tax</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 min-w-[200px]">
                            <AccountDropdown
                              value={line.account}
                              onChange={(val) => {
                                const copy = [...refundDistribution];
                                copy[idx].account = val;
                                setRefundDistribution(copy);
                                setSaveStatus('dirty');
                              }}
                              accounts={chartOfAccounts}
                              placeholder="Select account..."
                              isTable
                            />
                          </td>
                          <td className="py-2 px-3">
                            {line.tax_grids ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 font-semibold text-[11px]">
                                {line.tax_grids}
                              </span>
                            ) : (
                              <input
                                type="text"
                                value={line.tax_grids}
                                onChange={(e) => {
                                  const copy = [...refundDistribution];
                                  copy[idx].tax_grids = e.target.value;
                                  setRefundDistribution(copy);
                                  setSaveStatus('dirty');
                                }}
                                placeholder="Grid"
                                className="w-12 bg-transparent text-[11px] outline-none"
                              />
                            )}
                          </td>
                          <td className="py-2 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRefundLine(line.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                              title="Delete line"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
                    <button
                      type="button"
                      onClick={handleAddRefundLine}
                      className="text-[#007A78] dark:text-emerald-400 hover:underline font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Add a line</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ADVANCED OPTIONS (Matching Image 4) */}
          {activeTab === 'advanced' && (
            <div className="space-y-6 pt-1 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                
                {/* Left Column Fields */}
                <div className="space-y-3.5">
                  
                  {/* Label on Invoices */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                      Label on Invoices
                    </span>
                    <input
                      type="text"
                      value={labelOnInvoices}
                      onChange={(e) => {
                        setLabelOnInvoices(e.target.value);
                        setSaveStatus('dirty');
                      }}
                      placeholder="e.g. 14%"
                      className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium outline-none focus:border-[#007A78]"
                    />
                  </div>

                  {/* Tax Scope */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                      Tax Scope
                    </span>
                    <select
                      value={taxScope}
                      onChange={(e) => {
                        setTaxScope(e.target.value);
                        setSaveStatus('dirty');
                      }}
                      className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="">None</option>
                      <option value="Services">Services</option>
                      <option value="Goods">Goods</option>
                    </select>
                  </div>

                  {/* Tax Group */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                      Tax Group
                    </span>
                    <select
                      value={taxGroup}
                      onChange={(e) => {
                        setTaxGroup(e.target.value);
                        setSaveStatus('dirty');
                      }}
                      className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="VAT 14%">VAT 14%</option>
                      <option value="VAT 0%">VAT 0%</option>
                      <option value="Withholding Tax">Withholding Tax</option>
                    </select>
                  </div>

                  {/* Country ? */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                      <span>Country</span>
                      <span title="Tax jurisdiction country">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => {
                        setCountry(e.target.value);
                        setSaveStatus('dirty');
                      }}
                      className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium outline-none focus:border-[#007A78]"
                    />
                  </div>

                  {/* Tax Category Code ? */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                      <span>Tax Category Code</span>
                      <span title="Legal category identifier code">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                    <input
                      type="text"
                      value={taxCategoryCode}
                      onChange={(e) => {
                        setTaxCategoryCode(e.target.value);
                        setSaveStatus('dirty');
                      }}
                      placeholder="e.g. V1"
                      className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium outline-none focus:border-[#007A78]"
                    />
                  </div>

                </div>

                {/* Right Column Fields */}
                <div className="space-y-3.5">
                  
                  {/* Included in Price ? */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                      <span>Included in Price</span>
                      <span title="Whether product price includes this tax">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                    <select
                      value={includedInPrice}
                      onChange={(e: any) => {
                        setIncludedInPrice(e.target.value);
                        setSaveStatus('dirty');
                      }}
                      className="w-full max-w-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      <option value="Default">Default</option>
                      <option value="Tax Included">Tax Included</option>
                      <option value="Tax Excluded">Tax Excluded</option>
                    </select>
                  </div>

                  {/* Affect Base of Subsequent Taxes ? */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                      <span>Affect Base of Subsequent Taxes</span>
                      <span title="Include this tax amount in the base computation of subsequent taxes">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                    <div className="w-full max-w-sm">
                      <input
                        type="checkbox"
                        checked={affectBaseSubsequent}
                        onChange={(e) => {
                          setAffectBaseSubsequent(e.target.checked);
                          setSaveStatus('dirty');
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-[#007A78] focus:ring-[#007A78] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Active ? */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                      <span>Active</span>
                      <span title="Toggle active status of this tax">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                    <div className="w-full max-w-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setIsActive(!isActive);
                          setSaveStatus('dirty');
                        }}
                        className={cn(
                          "w-9 h-5 rounded-full transition-colors relative cursor-pointer focus:outline-none",
                          isActive 
                            ? "bg-[#107c41] dark:bg-emerald-500" 
                            : "bg-slate-300 dark:bg-slate-700 border border-slate-400/40"
                        )}
                      >
                        <span 
                          className={cn(
                            "w-4 h-4 rounded-full bg-white shadow-xs absolute top-0.5 transition-transform",
                            isActive ? "right-0.5" : "left-0.5"
                          )} 
                        />
                      </button>
                    </div>
                  </div>

                  {/* Tax Exigibility ? (Radio Options) */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0 pt-1">
                      <span>Tax Exigibility</span>
                      <span title="Point in time when tax is due">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    </div>
                    <div className="w-full max-w-sm space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="taxExigibility"
                          checked={taxExigibility === 'Based on Invoice'}
                          onChange={() => {
                            setTaxExigibility('Based on Invoice');
                            setSaveStatus('dirty');
                          }}
                          className="text-[#007A78] focus:ring-[#007A78]"
                        />
                        <span>Based on Invoice</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="taxExigibility"
                          checked={taxExigibility === 'Based on Payment'}
                          onChange={() => {
                            setTaxExigibility('Based on Payment');
                            if (!cashBasisTransitionAccount) {
                              setCashBasisTransitionAccount('210802 Base Tax Received');
                            }
                            setSaveStatus('dirty');
                          }}
                          className="text-[#007A78] focus:ring-[#007A78]"
                        />
                        <span>Based on Payment</span>
                      </label>
                    </div>
                  </div>

                  {/* Cash Basis Transition Account ? (Matching Image & User Requirement 4) */}
                  {taxExigibility === 'Based on Payment' && (
                    <div className="flex items-center justify-between gap-4 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 w-36 shrink-0">
                        <span>Cash Basis Transition Account</span>
                        <span title="Account used until the tax is collected/paid">
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" />
                        </span>
                      </div>
                      <div className="w-full max-w-sm">
                        <AccountDropdown
                          value={cashBasisTransitionAccount}
                          onChange={(val) => {
                            setCashBasisTransitionAccount(val);
                            setSaveStatus('dirty');
                          }}
                          accounts={chartOfAccounts}
                          placeholder="Select account from CoA..."
                        />
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* LEGAL NOTES Section (Matching Image 4) */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  LEGAL NOTES
                </span>
                <textarea
                  rows={3}
                  value={legalNotes}
                  onChange={(e) => {
                    setLegalNotes(e.target.value);
                    setSaveStatus('dirty');
                  }}
                  placeholder="This note will be mentioned on invoices using this tax."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#007A78] transition-colors"
                />
              </div>

            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate('/accounting/configuration/taxes')}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-[#007A78] hover:bg-[#006664] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isNew ? 'Create Tax' : 'Save Changes'}</span>
            </button>
          </div>

        </div>

        {/* Right Chatter Column (Matching Image 2, 3, 4) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 space-y-4">
          
          {/* Chatter Compose Box */}
          {activeChatterAction !== 'none' && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/80 dark:bg-slate-800/80 space-y-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {activeChatterAction === 'message' ? 'Send a public message...' : 'Log an internal note...'}
              </div>
              <textarea
                rows={3}
                value={chatterText}
                onChange={(e) => setChatterText(e.target.value)}
                placeholder={activeChatterAction === 'message' ? 'Type message...' : 'Write note...'}
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-[#714B67]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveChatterAction('none')}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePostChatter}
                  className="px-3 py-1 bg-[#714B67] hover:bg-[#5f3f57] text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Timeline Feed */}
          <div className="space-y-4 pt-1">
            {chatterMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 text-xs">
                <div className="w-7 h-7 rounded-full bg-[#007A78] dark:bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs">
                  {currentUserInitial}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {msg.user}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {msg.date}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};

export default TaxDetailPage;
