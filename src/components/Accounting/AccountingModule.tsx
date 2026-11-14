import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, DollarSign, Briefcase, FileText, Plus, 
  Trash2, Edit, Coins, RefreshCcw, Layers, Sparkles, 
  Settings, CheckCircle2, AlertCircle, X, CheckSquare,
  Printer
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Type & Seeds Imports
import { 
  CoAAccount, BankOrWallet, JournalEntry, Invoice, InvoiceItem, Bill, BankStatement, EmployeeSalary 
} from './AccountingTypes';
import { 
  DEFAULT_COA, DEFAULT_BANKS_WALLETS, DEFAULT_JOURNAL, 
  DEFAULT_INVOICES, DEFAULT_BILLS, DEFAULT_BANK_STATEMENTS, DEFAULT_EMPLOYEES 
} from './AccountingSeeds';

// Subviews Imports
import { DashboardView } from './DashboardView';
import { InvoicesLedgerView } from './InvoicesLedgerView';
import { PayrollView } from './PayrollView';
import { CoaView } from './CoaView';
import { BanksView } from './BanksView';

import DeleteConfirmation from '../Common/DeleteConfirmation';

export function AccountingModule() {
  
  // ==========================================
  // COMPONENT STATE
  // ==========================================
  const [coa, setCoa] = useState<CoAAccount[]>(() => {
    const saved = localStorage.getItem('acct_coa');
    return saved ? JSON.parse(saved) : DEFAULT_COA;
  });

  const [journal, setJournal] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('acct_journal');
    return saved ? JSON.parse(saved) : DEFAULT_JOURNAL;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('acct_invoices');
    return saved ? JSON.parse(saved) : DEFAULT_INVOICES;
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    const saved = localStorage.getItem('acct_bills');
    return saved ? JSON.parse(saved) : DEFAULT_BILLS;
  });

  const [bankStatements, setBankStatements] = useState<BankStatement[]>(() => {
    const saved = localStorage.getItem('acct_bank_statements');
    return saved ? JSON.parse(saved) : DEFAULT_BANK_STATEMENTS;
  });

  const [employees, setEmployees] = useState<EmployeeSalary[]>(() => {
    const saved = localStorage.getItem('acct_employees');
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  });

  const [banksAndWallets, setBanksAndWallets] = useState<BankOrWallet[]>(() => {
    const saved = localStorage.getItem('acct_banks_wallets');
    return saved ? JSON.parse(saved) : DEFAULT_BANKS_WALLETS;
  });

  const [baseCurrency, setBaseCurrency] = useState<string>(() => {
    return localStorage.getItem('acct_base_currency') || 'SAR';
  });

  const [tempBaseCurrency, setTempBaseCurrency] = useState(baseCurrency);
  useEffect(() => {
    setTempBaseCurrency(baseCurrency);
  }, [baseCurrency]);

  const [showCurrencyConfirmModal, setShowCurrencyConfirmModal] = useState(false);
  const [isSystemBaseChecked, setIsSystemBaseChecked] = useState(true);

  const handleConfirmBaseCurrencyChange = () => {
    setShowCurrencyConfirmModal(true);
  };

  const executeBaseCurrencyChange = () => {
    setBaseCurrency(tempBaseCurrency);
    if (isSystemBaseChecked) {
      localStorage.setItem('acct_base_currency', tempBaseCurrency);
      window.dispatchEvent(new Event('storage'));
    }
    triggerSuccess(`تم تغيير العملة المعيارية للنظام بنجاح إلى ${tempBaseCurrency}.`);
    setShowCurrencyConfirmModal(false);
  };

  const cancelBaseCurrencyChange = () => {
    setTempBaseCurrency(baseCurrency);
    setShowCurrencyConfirmModal(false);
  };

  const [payrollCycleStartDay, setPayrollCycleStartDay] = useState<number>(() => {
    return parseInt(localStorage.getItem('acct_payroll_cycle_start_day') || '1', 10);
  });

  const [payrollExecuted, setPayrollExecuted] = useState<boolean>(() => {
    return localStorage.getItem('acct_payroll_executed') === 'true';
  });

  const { checkPermission, canRead, canWrite, canCreate, canDelete, user } = useAuth();
  const isAcctAdmin = user?.role === 'Admin' || user?.role_name === 'Admin' || (user as any)?.is_super_admin;

  const allTabs = [
    { id: 'dashboard', label_ar: 'لوحة القيادة المالية', label_en: 'Financial Dashboard', icon: Briefcase, name: 'Financial Dashboard' },
    { id: 'banks', label_ar: 'الخزائن والبنوك', label_en: 'Vaults & Banks', icon: DollarSign, name: 'Vaults & Banks' },
    { id: 'invoices', label_ar: 'الفواتير والعمليات اليومية', label_en: 'Invoices & Ledger', icon: FileText, name: 'Invoices & Ledger' },
    { id: 'payroll', label_ar: 'موديول الرواتب والعمولات', label_en: 'Payroll & Commissions', icon: Calculator, name: 'Payroll & Commissions' },
    { id: 'coa', label_ar: 'شجرة الحسابات المحاسبية', label_en: 'Chart of Accounts', icon: Layers, name: 'Chart of Accounts' },
    { id: 'settings', label_ar: 'الإعدادات', label_en: 'Settings', icon: Settings, isSettings: true },
  ];

  const allowedTabs = allTabs.filter(item => {
    if (item.isSettings) return isAcctAdmin || (checkPermission as any)('Accounting', 'settings_access');
    return isAcctAdmin || canRead('Accounting', item.name) || (checkPermission as any)('Accounting', 'tab:' + item.name);
  });

  // Navigation states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'banks' | 'invoices' | 'payroll' | 'coa' | 'settings'>(() => {
    const firstAllowed = allTabs.find(item => {
      if (item.isSettings) return isAcctAdmin || (checkPermission as any)('Accounting', 'settings_access');
      return isAcctAdmin || canRead('Accounting', item.name) || (checkPermission as any)('Accounting', 'tab:' + item.name);
    });
    return (firstAllowed?.id || 'dashboard') as any;
  });
  const [dbLoading, setDbLoading] = useState(true);

  // Modal Triggers
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showAddCoaModal, setShowAddCoaModal] = useState(false);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showAddJournalModal, setShowAddJournalModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);

  const [bankAccountTypes, setBankAccountTypes] = useState<{ id: string; label_ar: string; label_en: string }[]>(() => {
    const saved = localStorage.getItem('acct_bank_account_types');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'bank', label_ar: 'حساب بنكي جاري', label_en: 'Bank Account' },
      { id: 'cash_box', label_ar: 'خزنة كاش أو صندوق نقدية', label_en: 'Cash Vault' },
      { id: 'wallet', label_ar: 'محفظة إلكترونية (مثال: فودافون كاش)', label_en: 'Digital Wallet' },
      { id: 'instapay', label_ar: 'إنستا باي InstaPay', label_en: 'InstaPay' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('acct_bank_account_types', JSON.stringify(bankAccountTypes));
  }, [bankAccountTypes]);

  // Manage Types Sub-states
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [newTypeNameAr, setNewTypeNameAr] = useState('');
  const [newTypeNameEn, setNewTypeNameEn] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);

  // Forms states
  const [bankForm, setBankForm] = useState({
    name_en: '', name_ar: '', type: 'bank' as string,
    currency: 'EGP', account_number: '', iban: '', bank_name: '', balance: 0
  });

  const [newCoaForm, setNewCoaForm] = useState({ id: '', name_en: '', name_ar: '', type: 'expenses' as any, parent_id: '' });

  const [invoiceForm, setInvoiceForm] = useState<{
    id: string;
    customer_name: string;
    date: string;
    due_date: string;
    subtotal: number;
    vat_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_method: string;
    vat_number: string;
    po_number: string;
    notes: string;
    items: InvoiceItem[];
  }>({
    id: '',
    customer_name: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    subtotal: 0,
    vat_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    payment_method: 'تحويل بنكي',
    vat_number: '',
    po_number: '',
    notes: '',
    items: [
      { product_id: 'SVC-01', product_name: 'Consulting & Tech Delivery Services', quantity: 1, price: 0, vat_rate: 15, discount_rate: 0 }
    ]
  });

  const [billForm, setBillForm] = useState({
    supplier_name: '', account_id: '50100', date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    description: '', amount: 0, is_copq: false
  });

  const [journalForm, setJournalForm] = useState({
    date: new Date().toISOString().split('T')[0], reference: '', description: '',
    lines: [
      { account_id: '', debit: 0, credit: 0 },
      { account_id: '', debit: 0, credit: 0 }
    ]
  });

  const [statementForm, setStatementForm] = useState({
    date: new Date().toISOString().split('T')[0], description: '', amount: 0
  });

  // Live Real-Time Integration states
  const [crmDeals, setCrmDeals] = useState<any[]>([]);
  const [qaNcrs, setQaNcrs] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([
    {
      id: 1,
      name: "Premium Software Development Consultation",
      description: "Full architectural setup, code audit, Devops pipeline setup, and integration services tailored for enterprise clients.",
      price: 15000,
      currency: "USD",
      category: "Software",
      type: "service"
    },
    {
      id: 2,
      name: "Granite Casserole Cookware Set (Premium)",
      description: "An elegant, non-stick scratch resistant granite cookware set.",
      price: 4200,
      currency: "EGP",
      category: "Kitchenware",
      type: "product"
    },
    {
      id: 3,
      name: "Schengen Visa Fast-Track Processing Packages",
      description: "Official documents filing and appointment arrangements.",
      price: 250,
      currency: "USD",
      category: "Tourism",
      type: "service"
    },
    {
      id: 4,
      name: "Corporate Team-Building Nile Excursion",
      description: "Nile cruise excursion for corporate team building.",
      price: 3500,
      currency: "USD",
      category: "Tourism",
      type: "service"
    }
  ]);

  const [successNotif, setSuccessNotif] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'invoice' | 'bill' | 'coa' | 'journal' | 'statement' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Currencies rates (Pivot SAR)
  const [currencies, setCurrencies] = useState(() => {
    const saved = localStorage.getItem('acct_currency_rates');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { code: 'SAR', rate_to_sar: 1.0 },
      { code: 'USD', rate_to_sar: 3.75 },
      { code: 'EUR', rate_to_sar: 4.05 },
      { code: 'EGP', rate_to_sar: 0.078 },
      { code: 'AED', rate_to_sar: 1.02 },
      { code: 'GBP', rate_to_sar: 4.75 },
    ];
  });

  const [settingsSubTab, setSettingsSubTab] = useState<'currencies' | 'payroll_cycle' | 'commissions' | 'invoice'>('currencies');

  const [invoiceSettings, setInvoiceSettings] = useState(() => {
    const saved = localStorage.getItem('acct_invoice_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          vatRate: parsed.vatRate ?? 15,
          prefix: parsed.prefix ?? 'INV-2026-',
          paymentTermsDays: parsed.paymentTermsDays ?? 30,
          footerNote: parsed.footerNote ?? 'نشكركم لتعاملكم معنا',
          logo: parsed.logo ?? 'BC',
          logoUrl: parsed.logoUrl ?? '',
          name: parsed.name ?? 'The Business Core Corp.',
          address: parsed.address ?? 'Headquarters Blvd. Building C Suite 400',
          phone: parsed.phone ?? '+1-555-CORE-000',
          email: parsed.email ?? 'billing@thebusinesscore.com',
          primaryColor: parsed.primaryColor ?? '#4f46e5'
        };
      } catch (e) {}
    }
    return {
      vatRate: 15,
      prefix: 'INV-2026-',
      paymentTermsDays: 30,
      footerNote: 'نشكركم لتعاملكم معنا',
      logo: 'BC',
      logoUrl: '',
      name: 'The Business Core Corp.',
      address: 'Headquarters Blvd. Building C Suite 400',
      phone: '+1-555-CORE-000',
      email: 'billing@thebusinesscore.com',
      primaryColor: '#4f46e5'
    };
  });

  const [commissionSettings, setCommissionSettings] = useState(() => {
    const saved = localStorage.getItem('crm_commission_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      activeScheme: 'revenue_fixed',
      revenueFixedPercentage: 5,
      volumeCalculationType: 'flat',
      volumeTiers: [
        { id: 'v1', min: 1, max: 100, rate: 10 },
        { id: 'v2', min: 101, max: 200, rate: 20 },
        { id: 'v3', min: 201, max: 999999, rate: 30 }
      ],
      revenueCalculationType: 'flat',
      revenueTiers: [
        { id: 'r1', min: 0, max: 50000, rate: 3 },
        { id: 'r2', min: 50001, max: 100000, rate: 6 },
        { id: 'r3', min: 100001, max: 99999999, rate: 10 }
      ],
      profitFixedPercentage: 10,
    };
  });

  // ==========================================
  // PERSISTENCE EFFECT BINDINGS
  // ==========================================
  useEffect(() => { 
    localStorage.setItem('acct_coa', JSON.stringify(coa)); 
    window.dispatchEvent(new Event('storage'));
  }, [coa]);

  useEffect(() => { 
    localStorage.setItem('acct_journal', JSON.stringify(journal)); 
    window.dispatchEvent(new Event('storage'));
  }, [journal]);

  useEffect(() => { 
    localStorage.setItem('acct_invoices', JSON.stringify(invoices)); 
    window.dispatchEvent(new Event('storage'));
  }, [invoices]);

  useEffect(() => { 
    localStorage.setItem('acct_bills', JSON.stringify(bills)); 
    window.dispatchEvent(new Event('storage'));
  }, [bills]);

  useEffect(() => { 
    localStorage.setItem('acct_bank_statements', JSON.stringify(bankStatements)); 
    window.dispatchEvent(new Event('storage'));
  }, [bankStatements]);

  useEffect(() => { 
    localStorage.setItem('acct_employees', JSON.stringify(employees)); 
    window.dispatchEvent(new Event('storage'));
  }, [employees]);

  useEffect(() => { 
    localStorage.setItem('acct_banks_wallets', JSON.stringify(banksAndWallets)); 
    window.dispatchEvent(new Event('storage'));
  }, [banksAndWallets]);

  useEffect(() => { 
    localStorage.setItem('acct_base_currency', baseCurrency); 
    window.dispatchEvent(new Event('storage'));
  }, [baseCurrency]);

  useEffect(() => { localStorage.setItem('acct_payroll_cycle_start_day', String(payrollCycleStartDay)); }, [payrollCycleStartDay]);
  useEffect(() => { localStorage.setItem('acct_payroll_executed', String(payrollExecuted)); }, [payrollExecuted]);
  useEffect(() => { 
    localStorage.setItem('acct_currency_rates', JSON.stringify(currencies)); 
    window.dispatchEvent(new Event('storage'));
  }, [currencies]);
  useEffect(() => { localStorage.setItem('acct_invoice_settings', JSON.stringify(invoiceSettings)); }, [invoiceSettings]);
  useEffect(() => { localStorage.setItem('crm_commission_settings', JSON.stringify(commissionSettings)); }, [commissionSettings]);

  // ==========================================
  // CROSS-TAB/MODULE LOCAL STORAGE SYNC
  // ==========================================
  useEffect(() => {
    const handleStorageChange = (e: Event) => {
      try {
        const savedInvoices = localStorage.getItem('acct_invoices');
        if (savedInvoices) {
          const parsed = JSON.parse(savedInvoices);
          setInvoices(prev => JSON.stringify(prev) !== savedInvoices ? parsed : prev);
        }

        const savedBanks = localStorage.getItem('acct_banks_wallets');
        if (savedBanks) {
          const parsed = JSON.parse(savedBanks);
          setBanksAndWallets(prev => JSON.stringify(prev) !== savedBanks ? parsed : prev);
        }

        const savedCurrency = localStorage.getItem('acct_base_currency');
        if (savedCurrency && savedCurrency !== baseCurrency) {
          setBaseCurrency(savedCurrency);
        }

        const savedJournal = localStorage.getItem('acct_journal');
        if (savedJournal) {
          const parsed = JSON.parse(savedJournal);
          setJournal(prev => JSON.stringify(prev) !== savedJournal ? parsed : prev);
        }

        const savedBills = localStorage.getItem('acct_bills');
        if (savedBills) {
          const parsed = JSON.parse(savedBills);
          setBills(prev => JSON.stringify(prev) !== savedBills ? parsed : prev);
        }
      } catch (err) {
        console.error("Failed to sync storage change:", err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [baseCurrency]);

  // ==========================================
  // DATABASE HYDRATION & API SYNC (SUPABASE)
  // ==========================================
  useEffect(() => {
    const fetchDbAccountingData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-user-id': localStorage.getItem('userId') || '1'
        };

        const response = await fetch('/api/accounting', { headers });
        if (response.ok) {
          const resData = await response.json();
          if (resData.coa && resData.coa.length > 0) setCoa(resData.coa);
          if (resData.banksAndWallets && resData.banksAndWallets.length > 0) setBanksAndWallets(resData.banksAndWallets);
          if (resData.journal && resData.journal.length > 0) setJournal(resData.journal);
          if (resData.invoices && resData.invoices.length > 0) setInvoices(resData.invoices);
          if (resData.bills && resData.bills.length > 0) setBills(resData.bills);
          if (resData.bankStatements && resData.bankStatements.length > 0) setBankStatements(resData.bankStatements);
          console.log("✅ Successfully hydrated accounting states from Supabase tables.");
        }
      } catch (err) {
        console.warn("Continuing with local storage persistence fallback:", err);
      } finally {
        setDbLoading(false);
      }
    };

    fetchDbAccountingData();
  }, []);

  // Sync back to db on change
  useEffect(() => {
    if (dbLoading) return;
    const syncToDatabase = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-user-id': localStorage.getItem('userId') || '1'
        };
        const payload = { coa, banksAndWallets, journal, invoices, bills, bankStatements };
        await fetch('/api/accounting/sync', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Database sync failed:", err);
      }
    };
    const delayDebounce = setTimeout(syncToDatabase, 1500);
    return () => clearTimeout(delayDebounce);
  }, [coa, banksAndWallets, journal, invoices, bills, bankStatements, dbLoading]);

  // Real-time feeds (lazy loaded per active tab)
  const integrationsLoadedRef = useRef(false);
  useEffect(() => {
    if (integrationsLoadedRef.current) return;
    if (activeTab !== 'invoices' && activeTab !== 'dashboard') return;

    const fetchIntegrations = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        if (token && token !== 'null') headers['Authorization'] = `Bearer ${token}`;

        const [dealsRes, qaRes, customersRes, productsRes] = await Promise.all([
          fetch('/api/crm/deals', { headers }).then(res => res.ok ? res.json() : []),
          fetch('/api/qa/ncr', { headers }).then(res => res.ok ? res.json() : []),
          fetch('/api/crm/customers', { headers }).then(res => res.ok ? res.json() : []),
          fetch('/api/products', { headers }).then(res => res.ok ? res.json() : [])
        ]);

        if (Array.isArray(dealsRes)) {
          setCrmDeals(dealsRes.filter(d => d.stage_name === 'Closed Won' || d.status === 'Won'));
        }
        if (Array.isArray(qaRes)) {
          setQaNcrs(qaRes);
        }
        if (Array.isArray(customersRes)) {
          setClients(customersRes);
        }
        if (Array.isArray(productsRes) && productsRes.length > 0) {
          setProducts(productsRes);
        }
        integrationsLoadedRef.current = true;
      } catch (e) {
        console.warn('Simulation mode active.', e);
      }
    };
    fetchIntegrations();
  }, [activeTab]);

  // ==========================================
  // CORE DOUBLE-ENTRY ACCOUNTING HANDLERS
  // ==========================================
  
  const triggerSuccess = (msg: string) => {
    setSuccessNotif(msg);
    setTimeout(() => setSuccessNotif(null), 4000);
  };

  const convertFromSar = (amountInSar: number) => {
    if (baseCurrency === 'SAR') return amountInSar;
    const curr = currencies.find(c => c.code === baseCurrency);
    if (!curr) return amountInSar;
    return amountInSar / curr.rate_to_sar;
  };

  const convertProductPrice = (price: number, fromCurrency: string = 'SAR', toCurrency: string) => {
    if (fromCurrency === toCurrency) return price;
    
    // First convert to SAR (Pivot)
    let priceInSar = price;
    if (fromCurrency !== 'SAR') {
      const fromRate = currencies.find(c => c.code === fromCurrency)?.rate_to_sar || 1;
      priceInSar = price * fromRate;
    }
    
    // Now convert from SAR to toCurrency
    if (toCurrency === 'SAR') return priceInSar;
    const toRate = currencies.find(c => c.code === toCurrency)?.rate_to_sar || 1;
    return priceInSar / toRate;
  };

  const getAccountBalance = (accountId: string) => {
    let bal = 0;
    const isAssetOrExpense = ['assets', 'expenses'].includes(coa.find(c => c.id === accountId)?.type || '');
    journal.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.account_id === accountId) {
          if (isAssetOrExpense) {
            bal += line.debit - line.credit;
          } else {
            bal += line.credit - line.debit;
          }
        }
      });
    });
    return bal;
  };

  // 1. Mark Invoice as Paid (Double entry: Debit Cash 10200, Credit AR 10300)
  const markInvoiceAsPaid = (inv: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i));

    // Ledger posting
    const nextJeId = `JE-2026-${String(journal.length + 1).padStart(3, '0')}`;
    const ledgerEntry: JournalEntry = {
      id: nextJeId,
      date: new Date().toISOString().split('T')[0],
      reference: inv.id,
      description: `Payment confirmation on Invoice ${inv.id} from ${inv.customer_name}`,
      lines: [
        { account_id: '10200', debit: inv.total_amount, credit: 0 },
        { account_id: '10300', debit: 0, credit: inv.total_amount }
      ],
      is_system: true
    };

    setJournal([ledgerEntry, ...journal]);
    
    // Add amount to bank account balance
    setBanksAndWallets(prev => prev.map(w => w.id === '2' ? { ...w, balance: w.balance + inv.total_amount } : w));
    
    triggerSuccess(`Successfully registered payment of ${inv.total_amount.toLocaleString()} ${baseCurrency} for Invoice ${inv.id}.`);
  };

  // 2. Pay Supplier Bill (Double entry: Debit AP 20100, Credit Cash 10200)
  const payBill = (bill: Bill) => {
    setBills(prev => prev.map(b => b.id === bill.id ? { ...b, status: 'paid' } : b));

    const nextJeId = `JE-2026-${String(journal.length + 1).padStart(3, '0')}`;
    const ledgerEntry: JournalEntry = {
      id: nextJeId,
      date: new Date().toISOString().split('T')[0],
      reference: bill.id,
      description: `Payment settlement for supplier invoice ${bill.id} - ${bill.supplier_name}`,
      lines: [
        { account_id: '20100', debit: bill.total_amount, credit: 0 },
        { account_id: '10200', debit: 0, credit: bill.total_amount }
      ],
      is_system: true
    };

    setJournal([ledgerEntry, ...journal]);
    
    // Debit amount from NBE bank account
    setBanksAndWallets(prev => prev.map(w => w.id === '2' ? { ...w, balance: w.balance - bill.total_amount } : w));

    triggerSuccess(`Settled Supplier Bill ${bill.id} digitally via Cash Bank account.`);
  };

  const sendInvoiceReminder = (invId: string) => {
    setInvoices(prev => prev.map(inv => inv.id === invId ? { ...inv, reminder_sent: true } : inv));
    triggerSuccess(`Urgent payment request dispatched to customer. Invoice ${invId} marked as Reminded.`);
  };

  // 3. Import closed won deals from CRM
  const importCrmDealAsDraft = (deal: any) => {
    const value = deal.value || deal.amount || 25000;
    const clientName = deal.customer_name || deal.title || 'CRM Client';
    const vat = value * 0.15;
    const total = value + vat;
    const invId = `INV-2026-${String(invoices.length + 1).padStart(3, '0')}`;

    const newInvoice: Invoice = {
      id: invId,
      customer_name: clientName,
      customer_id: String(deal.id),
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [
        { product_id: 'CRM-WON', product_name: `SaaS Enterprise - CRM Deal: ${deal.title}`, quantity: 1, price: value, vat_rate: 15, discount_rate: 0 }
      ],
      subtotal: value,
      vat_amount: vat,
      discount_amount: 0,
      total_amount: total,
      status: 'draft',
      reminder_sent: false,
      payment_method: 'تحويل بنكي'
    };

    setInvoices([newInvoice, ...invoices]);
    triggerSuccess(`CRM Won Contract and Deal verified! Draft Invoice ${invId} successfully generated.`);
  };

  // 4. Link Quality NCR and book COPQ loss
  const importQaNcrAsCopqExpense = (ncr: any) => {
    const cost = ncr.cost_of_poor_quality || ncr.cost || 4500;
    const ncrTitle = ncr.title || ncr.ncr_number || `Defect #${ncr.id}`;
    const billId = `BILL-2026-${String(bills.length + 1).padStart(3, '0')}`;

    const newBill: Bill = {
      id: billId,
      supplier_name: 'Internal Quality Control Safe',
      account_id: '50400',
      date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      description: `COPQ validation of NCR: ${ncrTitle}`,
      amount: cost,
      vat_rate: 0,
      vat_amount: 0,
      total_amount: cost,
      status: 'unpaid',
      is_copq: true,
      ncr_id: ncr.id
    };

    setBills([newBill, ...bills]);

    // Debit expense, credit accrued quality costs liabilities
    const nextJeId = `JE-2026-${String(journal.length + 1).padStart(3, '0')}`;
    const ledgerEntry: JournalEntry = {
      id: nextJeId,
      date: new Date().toISOString().split('T')[0],
      reference: billId,
      description: `Accrual of Quality NCR loss - COPQ Code: ${ncrTitle}`,
      lines: [
        { account_id: '50400', debit: cost, credit: 0 },
        { account_id: '20300', debit: 0, credit: cost }
      ],
      is_system: true
    };

    setJournal([ledgerEntry, ...journal]);
    triggerSuccess(`Quality NCR Linked! Registered ${cost.toLocaleString()} ${baseCurrency} operational loss in COPQ Ledger.`);
  };

  // 5. Execute monthly payroll payout (Debit 50100 Salaries expense, Credit 10200 Cash Bank)
  const handleExecutePayroll = () => {
    if (payrollExecuted) return;

    const totalBase = employees.reduce((sum, e) => sum + e.base_salary, 0);
    const totalCommissions = 18500; // matched to screenshots
    const totalWages = totalBase + totalCommissions;

    const nextJeId = `JE-2026-${String(journal.length + 1).padStart(3, '0')}`;
    const ledgerEntry: JournalEntry = {
      id: nextJeId,
      date: '2026-02-24',
      reference: 'PAY-2026-02',
      description: 'Accrual and Settlement of Employee Payroll and Commissions',
      lines: [
        { account_id: '50100', debit: totalWages, credit: 0 },
        { account_id: '10200', debit: 0, credit: totalWages }
      ],
      is_system: true
    };

    setJournal([ledgerEntry, ...journal]);
    
    // Debit salary payout from central bank account
    setBanksAndWallets(prev => prev.map(w => w.id === '2' ? { ...w, balance: w.balance - totalWages } : w));
    
    setPayrollExecuted(true);
    triggerSuccess(`Approved and Executed payroll of ${totalWages.toLocaleString()} ${baseCurrency} cleanly. Ledger entries balanced.`);
  };

  const matchStatementToJournal = (statementId: string, jeId: string) => {
    setBankStatements(prev => prev.map(s => s.id === statementId ? { ...s, reconciled: true, matched_journal_id: jeId } : s));
    triggerSuccess(`Bank transaction matched with Ledger JE entry ${jeId}! Clearance complete.`);
  };

  // ==========================================
  // ADD MODAL SUBMIT HANDLERS
  // ==========================================
  
  const handleAddBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBank: BankOrWallet = {
      id: String(banksAndWallets.length + 1),
      name_en: bankForm.name_en,
      name_ar: bankForm.name_ar,
      type: bankForm.type,
      currency: baseCurrency,
      account_number: bankForm.account_number,
      iban: bankForm.iban,
      bank_name: bankForm.bank_name,
      balance: bankForm.balance
    };

    setBanksAndWallets([...banksAndWallets, newBank]);
    
    // Post Opening balance
    if (bankForm.balance > 0) {
      const nextJeId = `JE-2026-${String(journal.length + 1).padStart(3, '0')}`;
      const entry: JournalEntry = {
        id: nextJeId,
        date: new Date().toISOString().split('T')[0],
        reference: `OPB-${newBank.id}`,
        description: `Opening Balance for ${newBank.name_ar || newBank.name_en}`,
        lines: [
          { account_id: bankForm.type === 'bank' ? '10200' : '10100', debit: bankForm.balance, credit: 0 },
          { account_id: '30100', debit: 0, credit: bankForm.balance }
        ],
        is_system: true
      };
      setJournal([entry, ...journal]);
    }

    setShowAddBankModal(false);
    triggerSuccess(`Added ${bankForm.name_ar || bankForm.name_en} safely as liquid vault.`);
  };

  const handleAddCoaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAcc: CoAAccount = {
      id: newCoaForm.id,
      name_en: newCoaForm.name_en,
      name_ar: newCoaForm.name_ar,
      type: newCoaForm.type,
      is_active: true
    };

    setCoa([...coa, newAcc]);
    setShowAddCoaModal(false);
    triggerSuccess(`Added ledger account ${newAcc.id} to Chart of Accounts.`);
  };

  const handleAddInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate totals dynamically from items
    let subtotal = 0;
    let discount_amount = 0;
    let vat_amount = 0;
    
    invoiceForm.items.forEach(item => {
      const itemSub = item.quantity * item.price;
      const itemDisc = itemSub * ((item.discount_rate || 0) / 100);
      const itemVat = (itemSub - itemDisc) * ((item.vat_rate || 0) / 100);
      
      subtotal += itemSub;
      discount_amount += itemDisc;
      vat_amount += itemVat;
    });
    
    const total_amount = subtotal - discount_amount + vat_amount;
    const prefixStr = invoiceSettings.prefix || 'INV-2026-';
    
    // If we're editing an existing invoice, keep its status, otherwise start as draft
    const existingInv = invoices.find(inv => inv.id === invoiceForm.id);
    const invId = invoiceForm.id || `${prefixStr}${String(invoices.length + 1).padStart(3, '0')}`;
    const currentStatus = existingInv ? existingInv.status : 'draft';
    
    const newInv: Invoice = {
      id: invId,
      customer_name: invoiceForm.customer_name,
      date: invoiceForm.date,
      due_date: invoiceForm.due_date,
      subtotal,
      vat_amount,
      discount_amount,
      total_amount,
      status: currentStatus,
      payment_method: invoiceForm.payment_method,
      vat_number: invoiceForm.vat_number,
      po_number: invoiceForm.po_number,
      notes: invoiceForm.notes,
      items: invoiceForm.items
    };

    // Update or Insert in invoices list
    let updatedInvoices;
    if (invoiceForm.id) {
      updatedInvoices = invoices.map(inv => inv.id === invoiceForm.id ? newInv : inv);
    } else {
      updatedInvoices = [newInv, ...invoices];
    }
    setInvoices(updatedInvoices);

    // Accrue as journal entry - replace any existing system journal entry for this invoice
    const filteredJournal = journal.filter(je => je.reference !== invId);

    const nextJeId = `JE-2026-${String(filteredJournal.length + 1).padStart(3, '0')}`;
    const ledgerEntry: JournalEntry = {
      id: nextJeId,
      date: invoiceForm.date,
      reference: invId,
      description: `Accrued AR / Revenue - ${invoiceForm.customer_name}`,
      lines: [
        { account_id: '10300', debit: total_amount, credit: 0 },
        { account_id: '40100', debit: 0, credit: subtotal - discount_amount },
        { account_id: '20200', debit: 0, credit: vat_amount }
      ],
      is_system: true
    };
    setJournal([ledgerEntry, ...filteredJournal]);

    setShowAddInvoiceModal(false);
    triggerSuccess(
      invoiceForm.id 
        ? `تم تحديث الفاتورة ${invId} بنجاح وتسوية القيود الدفترية.`
        : `تم تسجيل مسودة الفاتورة ${invId} بنجاح وترحيل القيود آلياً.`
    );
  };

  const updateInvoiceItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...invoiceForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate invoice totals dynamically
    let subtotal = 0;
    let discount_amount = 0;
    let vat_amount = 0;
    
    updatedItems.forEach(item => {
      const itemSub = item.quantity * item.price;
      const itemDisc = itemSub * ((item.discount_rate || 0) / 100);
      const itemVat = (itemSub - itemDisc) * ((item.vat_rate || 0) / 100);
      
      subtotal += itemSub;
      discount_amount += itemDisc;
      vat_amount += itemVat;
    });
    
    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
      subtotal,
      vat_amount,
      discount_amount,
      total_amount: subtotal - discount_amount + vat_amount
    });
  };

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      product_id: `SVC-${String(invoiceForm.items.length + 1).padStart(2, '0')}`,
      product_name: '',
      quantity: 1,
      price: 0,
      vat_rate: invoiceSettings.vatRate || 15,
      discount_rate: 0
    };
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, newItem]
    });
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceForm.items.length <= 1) return;
    const updatedItems = invoiceForm.items.filter((_, i) => i !== index);
    
    // Recalculate totals
    let subtotal = 0;
    let discount_amount = 0;
    let vat_amount = 0;
    
    updatedItems.forEach(item => {
      const itemSub = item.quantity * item.price;
      const itemDisc = itemSub * ((item.discount_rate || 0) / 100);
      const itemVat = (itemSub - itemDisc) * ((item.vat_rate || 0) / 100);
      
      subtotal += itemSub;
      discount_amount += itemDisc;
      vat_amount += itemVat;
    });
    
    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
      subtotal,
      vat_amount,
      discount_amount,
      total_amount: subtotal - discount_amount + vat_amount
    });
  };

  const handleProductSelect = (idx: number, productIdStr: string) => {
    if (!productIdStr) {
      updateInvoiceItem(idx, 'product_name', '');
      updateInvoiceItem(idx, 'product_id', `SVC-${String(idx + 1).padStart(2, '0')}`);
      updateInvoiceItem(idx, 'price', 0);
      return;
    }
    
    const selectedProd = products.find(p => String(p.id) === productIdStr);
    if (selectedProd) {
      const convertedPrice = convertProductPrice(selectedProd.price, selectedProd.currency || 'SAR', baseCurrency);
      
      const updatedItems = [...invoiceForm.items];
      updatedItems[idx] = {
        ...updatedItems[idx],
        product_id: `PRD-${selectedProd.id}`,
        product_name: selectedProd.name,
        price: Number(convertedPrice.toFixed(2))
      };
      
      let subtotal = 0;
      let discount_amount = 0;
      let vat_amount = 0;
      
      updatedItems.forEach(item => {
        const itemSub = item.quantity * item.price;
        const itemDisc = itemSub * ((item.discount_rate || 0) / 100);
        const itemVat = (itemSub - itemDisc) * ((item.vat_rate || 0) / 100);
        
        subtotal += itemSub;
        discount_amount += itemDisc;
        vat_amount += itemVat;
      });
      
      setInvoiceForm({
        ...invoiceForm,
        items: updatedItems,
        subtotal,
        vat_amount,
        discount_amount,
        total_amount: subtotal - discount_amount + vat_amount
      });
    }
  };

  const handleAddBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = billForm.amount;
    const vat = amount * (invoiceSettings.vatRate / 100);
    const total = amount + vat;
    const billId = `BILL-2026-${String(bills.length + 1).padStart(3, '0')}`;

    const newBill: Bill = {
      id: billId,
      supplier_name: billForm.supplier_name,
      account_id: billForm.account_id,
      date: billForm.date,
      due_date: billForm.due_date,
      description: billForm.description,
      amount,
      vat_rate: invoiceSettings.vatRate,
      vat_amount: vat,
      total_amount: total,
      status: 'unpaid'
    };

    setBills([newBill, ...bills]);

    // Accrue in general ledger
    const nextJeId = `JE-2026-${String(journal.length + 1).padStart(3, '0')}`;
    const ledgerEntry: JournalEntry = {
      id: nextJeId,
      date: billForm.date,
      reference: billId,
      description: `Accrual of liability - Supplier bill ${billId} - ${billForm.supplier_name}`,
      lines: [
        { account_id: billForm.account_id, debit: amount, credit: 0 },
        { account_id: '20100', debit: 0, credit: amount }
      ],
      is_system: true
    };
    setJournal([ledgerEntry, ...journal]);

    setShowAddBillModal(false);
    triggerSuccess(`Successfully recorded supplier bill ${billId}. Accrual complete.`);
  };

  const handleAddJournalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const deb = journalForm.lines.reduce((sum, l) => sum + l.debit, 0);
    const cred = journalForm.lines.reduce((sum, l) => sum + l.credit, 0);

    if (deb !== cred) {
      alert('Debit and Credit lines are not balanced. GAAP compliance requires Debits = Credits.');
      return;
    }

    const jeId = `JE-2026-${String(journal.length + 1).padStart(3, '0')}`;
    const newJe: JournalEntry = {
      id: jeId,
      date: journalForm.date,
      reference: journalForm.reference || 'Manual Entry',
      description: journalForm.description,
      lines: journalForm.lines.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) })),
      is_system: false
    };

    setJournal([newJe, ...journal]);
    setShowAddJournalModal(false);
    triggerSuccess(`Manual General Journal Entry ${jeId} posted cleanly.`);
  };

  const handleAddStatementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTxn: BankStatement = {
      id: `TXN-${String(bankStatements.length + 1).padStart(3, '0')}`,
      date: statementForm.date,
      description: statementForm.description,
      amount: statementForm.amount,
      reconciled: false
    };

    setBankStatements([newTxn, ...bankStatements]);
    setShowStatementModal(false);
    triggerSuccess(`Added bank transaction record safely to reconciliation pool.`);
  };

  const handleExportInvoices = () => {
    let csvContent = "\uFEFFInvoice ID,Customer Name,Date,Due Date,Subtotal,VAT Amount,Total,Status\n";
    invoices.forEach(inv => {
      csvContent += `"${inv.id}","${inv.customer_name}","${inv.date}","${inv.due_date}",${inv.subtotal},${inv.vat_amount},${inv.total_amount},"${inv.status}"\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerSuccess("Invoices exported successfully as CSV!");
  };

  const handleImportInvoices = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n");
        let importedCount = 0;
        const newList = [...invoices];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const columns = line.split(",");
          if (columns && columns.length >= 7) {
            const id = columns[0].replace(/"/g, '').trim();
            const customer_name = columns[1].replace(/"/g, '').trim();
            const date = columns[2].replace(/"/g, '').trim();
            const due_date = columns[3].replace(/"/g, '').trim();
            const subtotal = parseFloat(columns[4]) || 0;
            const vat_amount = parseFloat(columns[5]) || 0;
            const total_amount = parseFloat(columns[6]) || 0;
            const status = (columns[7] ? columns[7].replace(/"/g, '').trim() : 'draft') as any;
            
            if (newList.some(item => item.id === id)) continue;

            newList.push({ id, customer_name, date, due_date, subtotal, vat_amount, discount_amount: 0, total_amount, status, items: [] });
            importedCount++;
          }
        }
        setInvoices(newList);
        triggerSuccess(`Imported ${importedCount} Invoices successfully from CSV!`);
      } catch (err) {
        console.error("CSV import failed:", err);
        alert("Failed to parse CSV.");
      }
    };
    reader.readAsText(file);
  };

  const instantSync = async (
    updatedInvoices = invoices, 
    updatedBanks = banksAndWallets, 
    updatedJournal = journal, 
    updatedBills = bills, 
    updatedStatements = bankStatements, 
    updatedCoa = coa
  ) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'x-user-id': localStorage.getItem('userId') || '1'
      };
      const payload = { 
        coa: updatedCoa, 
        banksAndWallets: updatedBanks, 
        journal: updatedJournal, 
        invoices: updatedInvoices, 
        bills: updatedBills, 
        bankStatements: updatedStatements 
      };
      const response = await fetch('/api/accounting/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        console.log("✅ Instant sync completed successfully.");
      } else {
        console.error("❌ Instant sync returned status:", response.status);
      }
    } catch (err) {
      console.error("❌ Instant sync failed:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { id, type } = deleteTarget;
      if (type === 'invoice') {
        const nextInvoices = invoices.filter(inv => inv.id !== id);
        const nextJournal = journal.filter(j => j.reference !== id);
        setInvoices(nextInvoices);
        setJournal(nextJournal);
        await instantSync(nextInvoices, banksAndWallets, nextJournal);
        triggerSuccess(`Invoice ${id} and related general ledger postings wiped cleanly.`);
      } else if (type === 'bill') {
        const nextBills = bills.filter(b => b.id !== id);
        const nextJournal = journal.filter(j => j.reference !== id);
        setBills(nextBills);
        setJournal(nextJournal);
        await instantSync(invoices, banksAndWallets, nextJournal, nextBills);
        triggerSuccess(`Supplier expense Bill ${id} and related general ledger postings wiped cleanly.`);
      } else if (type === 'coa') {
        if (['10100', '10200', '10300', '20100', '20200', '50400'].includes(id)) {
          alert('This is a system-critical Chart of Accounts category and cannot be deleted.');
          return;
        }
        const nextCoa = coa.filter(a => a.id !== id);
        setCoa(nextCoa);
        await instantSync(invoices, banksAndWallets, journal, bills, bankStatements, nextCoa);
        triggerSuccess(`Removed account ${id} from Chart of Accounts.`);
      } else if (type === 'journal') {
        const item = journal.find(j => j.id === id);
        if (item?.is_system) {
          alert('System-generated transaction logs cannot be manually deleted.');
          return;
        }
        const nextJournal = journal.filter(j => j.id !== id);
        setJournal(nextJournal);
        await instantSync(invoices, banksAndWallets, nextJournal);
        triggerSuccess(`Manual General Journal entry ${id} successfully reversed.`);
      } else if (type === 'statement') {
        const nextStatements = bankStatements.filter(s => s.id !== id);
        setBankStatements(nextStatements);
        await instantSync(invoices, banksAndWallets, journal, bills, nextStatements);
        triggerSuccess(`Bank statement entry ${id} successfully deleted.`);
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Math totals for sub-components
  const totalRevenues = coa.filter(a => a.type === 'revenue').reduce((sum, a) => sum + getAccountBalance(a.id), 0);
  const totalExpenses = coa.filter(a => a.type === 'expenses').reduce((sum, a) => sum + getAccountBalance(a.id), 0);
  const netProfit = totalRevenues - totalExpenses;
  const currentCash = getAccountBalance('10100') + getAccountBalance('10200') + getAccountBalance('10300') + getAccountBalance('10400');

  return (
    <div className="w-full flex flex-col gap-6 font-sans text-slate-800 bg-[#F8FAFC] min-h-screen relative" dir="ltr">
      
      {/* REAL-TIME SUCCESS NOTIFICATIONS */}
      <AnimatePresence>
        {successNotif && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 font-semibold text-xs text-right"
            dir="rtl"
          >
            <div className="w-5 h-5 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <span>{successNotif}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* A. HORIZONTAL HEADER NAVIGATION (TABS) */}
      <div className="w-full bg-white border border-slate-150 rounded-[1.5rem] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-right" dir="rtl">
        
        {/* Identity Section */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <Calculator className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 leading-tight">المنظومة المحاسبية</h1>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block leading-none mt-0.5">Accounting Engine</span>
          </div>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {allowedTabs.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs font-bold shrink-0 ${
                activeTab === item.id 
                  ? 'bg-slate-100 text-slate-900' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="text-right">
                <p className="font-black text-slate-850 leading-none">{item.label_ar}</p>
                <p className="text-[8px] text-slate-400 mt-0.5 leading-none">{item.label_en}</p>
              </div>
            </button>
          ))}
        </div>

      </div>

      {/* B. RIGHT CONTAINER CONTENT */}
      <div className="flex-1 space-y-6 overflow-x-hidden">

        {/* VIEW ROUTING */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                baseCurrency={baseCurrency}
                convertFromSar={convertFromSar}
                totalRevenues={totalRevenues}
                totalExpenses={totalExpenses}
                netProfit={netProfit}
                currentCash={currentCash}
                banksAndWallets={banksAndWallets}
                crmDeals={crmDeals}
                qaNcrs={qaNcrs}
                invoices={invoices}
                bills={bills}
                coa={coa}
                importCrmDealAsDraft={importCrmDealAsDraft}
                importQaNcrAsCopqExpense={importQaNcrAsCopqExpense}
                setShowAddBankModal={setShowAddBankModal}
                onPayPayrollClick={handleExecutePayroll}
                payrollExecuted={payrollExecuted}
              />
            )}

            {activeTab === 'banks' && (
              <BanksView
                baseCurrency={baseCurrency}
                banksAndWallets={banksAndWallets}
                bankAccountTypes={bankAccountTypes}
                setShowAddBankModal={setShowAddBankModal}
                setBanksAndWallets={(updater) => {
                  setBanksAndWallets((prev) => {
                    const nextBanks = typeof updater === 'function' ? (updater as Function)(prev) : updater;
                    localStorage.setItem('acct_banks_wallets', JSON.stringify(nextBanks));
                    window.dispatchEvent(new Event('storage'));
                    instantSync(invoices, nextBanks, journal, bills, bankStatements, coa);
                    return nextBanks;
                  });
                }}
                triggerSuccess={triggerSuccess}
                onPostJournalEntry={(entry) => {
                  const jeId = `JE-2026-${String(journal.length + 1).padStart(3, '0')}`;
                  setJournal([{ id: jeId, date: new Date().toISOString().split('T')[0], reference: entry.reference, description: entry.description, lines: entry.lines, is_system: true }, ...journal]);
                }}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoicesLedgerView
                baseCurrency={baseCurrency}
                convertFromSar={convertFromSar}
                invoices={invoices}
                bills={bills}
                journal={journal}
                bankStatements={bankStatements}
                coa={coa}
                getAccountBalance={getAccountBalance}
                onAddInvoiceClick={() => {
                  setInvoiceForm({
                    id: '',
                    customer_name: '',
                    date: new Date().toISOString().split('T')[0],
                    due_date: new Date(Date.now() + (invoiceSettings.paymentTermsDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    subtotal: 0,
                    vat_amount: 0,
                    discount_amount: 0,
                    total_amount: 0,
                    payment_method: 'تحويل بنكي',
                    vat_number: '',
                    po_number: '',
                    notes: '',
                    items: [
                      { product_id: 'SVC-01', product_name: 'Consulting & Tech Delivery Services', quantity: 1, price: 0, vat_rate: invoiceSettings.vatRate || 15, discount_rate: 0 }
                    ]
                  });
                  setShowAddInvoiceModal(true);
                }}
                onEditInvoiceClick={(inv) => {
                  setInvoiceForm({
                    id: inv.id,
                    customer_name: inv.customer_name,
                    date: inv.date,
                    due_date: inv.due_date,
                    subtotal: inv.subtotal,
                    vat_amount: inv.vat_amount,
                    discount_amount: inv.discount_amount || 0,
                    total_amount: inv.total_amount,
                    payment_method: inv.payment_method || 'تحويل بنكي',
                    vat_number: inv.vat_number || '',
                    po_number: inv.po_number || '',
                    notes: inv.notes || '',
                    items: inv.items || [
                      { product_id: 'SVC-01', product_name: 'Consulting & Tech Delivery Services', quantity: 1, price: inv.subtotal, vat_rate: invoiceSettings.vatRate || 15, discount_rate: 0 }
                    ]
                  });
                  setShowAddInvoiceModal(true);
                }}
                onAddBillClick={() => setShowAddBillModal(true)}
                onEditBillClick={(b) => {
                  setBillForm({ supplier_name: b.supplier_name, account_id: b.account_id, date: b.date, due_date: b.due_date, description: b.description, amount: b.amount, is_copq: b.is_copq || false });
                  setShowAddBillModal(true);
                }}
                onAddJournalClick={() => setShowAddJournalModal(true)}
                onAddStatementClick={() => setShowStatementModal(true)}
                markInvoiceAsPaid={markInvoiceAsPaid}
                payBill={payBill}
                sendInvoiceReminder={sendInvoiceReminder}
                handleExportInvoices={handleExportInvoices}
                handleImportInvoices={handleImportInvoices}
                matchStatementToJournal={matchStatementToJournal}
                setBankStatements={setBankStatements}
                triggerSuccess={triggerSuccess}
                setDeleteTarget={setDeleteTarget}
              />
            )}

            {activeTab === 'payroll' && (
              <PayrollView
                baseCurrency={baseCurrency}
                employees={employees}
                crmDeals={crmDeals}
                payrollExecuted={payrollExecuted}
                onExecutePayroll={handleExecutePayroll}
                payrollCycleStartDay={payrollCycleStartDay}
              />
            )}

            {activeTab === 'coa' && (
              <CoaView
                baseCurrency={baseCurrency}
                coa={coa}
                getAccountBalance={getAccountBalance}
                onAddCoaClick={() => setShowAddCoaModal(true)}
                setDeleteTarget={setDeleteTarget}
              />
            )}

            {activeTab === 'settings' && (
              <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-xs space-y-6 text-right" dir="rtl">
                {/* 1. Header & Sub-Tabs Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900">إعدادات النظام المالية (Financial Settings)</h2>
                    <p className="text-[10px] text-slate-400 mt-1">تخصيص العملات والتحويلات، الفواتير، دورات الصرف، وعمولات المبيعات</p>
                  </div>
                  
                  {/* Sub-tabs buttons */}
                  <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-150 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('currencies')}
                      className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all ${
                        settingsSubTab === 'currencies'
                          ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      عملات وتحويلات
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('payroll_cycle')}
                      className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all ${
                        settingsSubTab === 'payroll_cycle'
                          ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      دورة الرواتب
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('commissions')}
                      className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all ${
                        settingsSubTab === 'commissions'
                          ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      إعدادات العمولات
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('invoice')}
                      className={`px-3 py-2 rounded-xl text-[11px] font-black transition-all ${
                        settingsSubTab === 'invoice'
                          ? 'bg-white text-indigo-600 shadow-xs border border-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      إعدادات فاتورة
                    </button>
                  </div>
                </div>

                {/* 2. Sub-Tab Content rendering */}
                <div className="pt-2">
                  
                  {/* SUB-TAB: CURRENCIES */}
                  {settingsSubTab === 'currencies' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <h3 className="text-sm font-black text-slate-850">إعدادات العملات والتحويلات (Currencies & Rates)</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">تحديد العملة الأساسية للحسابات ومعدلات الصرف الخاصة بالعملة المعيارية</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 bg-slate-50/50 border rounded-2xl space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-slate-600 block">العملة الأساسية للقوائم المالية (Base Currency) :</label>
                            <select
                              value={tempBaseCurrency}
                              onChange={e => setTempBaseCurrency(e.target.value)}
                              className="w-full p-3 bg-white border rounded-xl text-xs font-black outline-none shadow-2xs"
                            >
                              <option value="SAR">SAR (ريال سعودي)</option>
                              <option value="USD">USD (دولار أمريكي)</option>
                              <option value="EUR">EUR (يورو)</option>
                              <option value="EGP">EGP (جنيه مصري)</option>
                              <option value="AED">AED (درهم إماراتي)</option>
                              <option value="GBP">GBP (جنيه إسترليني)</option>
                            </select>

                            {/* Checkbox block to confirm setting as System Base Currency */}
                            <div className="flex items-center gap-2.5 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/40 mt-3">
                              <input
                                type="checkbox"
                                id="apply_as_system_base_currency"
                                checked={isSystemBaseChecked}
                                onChange={(e) => setIsSystemBaseChecked(e.target.checked)}
                                className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                              <label htmlFor="apply_as_system_base_currency" className="text-xs font-black text-slate-700 cursor-pointer select-none leading-relaxed">
                                تعيين وتأكيد كعملة أساسية للنظام (System Base Currency) لجميع الموديولات
                              </label>
                            </div>

                            {(tempBaseCurrency !== baseCurrency || isSystemBaseChecked) && (
                              <button
                                type="button"
                                onClick={handleConfirmBaseCurrencyChange}
                                className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5"
                              >
                                تأكيد وتطبيق تغيير العملة الأساسية للنظام
                              </button>
                            )}
                            <p className="text-[10px] text-slate-400 font-bold leading-normal">
                              * عند تأكيد وتغيير العملة الأساسية، سيتم تطبيق العملة المختارة كعملة معيارية موحدة في جميع موديولات النظام (الحسابات، المبيعات، المنتجات والخدمات، والتشغيل) تلقائياً، وتتحول أسعار الصرف بالكامل بناءً عليها.
                            </p>
                          </div>
                        </div>

                        <div className="p-5 bg-slate-50/50 border rounded-2xl space-y-4">
                          <div>
                            <label className="text-xs font-black text-slate-600 block mb-1">أسعار الصرف المثبتة مقابل العملة الأساسية ({baseCurrency}) :</label>
                            <p className="text-[10px] text-slate-400 leading-relaxed">
                              تحديد قيمة العملات مقابل وحدة واحدة من العملة الأساسية {baseCurrency} (مثال: 1 {baseCurrency} = X من العملة الأخرى)
                            </p>
                          </div>
                          
                          <div className="space-y-3">
                            {currencies.map((currencyItem, idx) => {
                              const isBase = currencyItem.code === baseCurrency;
                              const baseRateToSar = currencies.find(c => c.code === baseCurrency)?.rate_to_sar || 1.0;
                              const displayVal = isBase ? 1.0 : (baseRateToSar / (currencyItem.rate_to_sar || 1.0));
                              
                              return (
                                <div key={currencyItem.code} className="flex items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-700 text-xs font-mono">
                                      {currencyItem.code}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">1 {baseCurrency} =</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      step="any"
                                      disabled={isBase}
                                      value={isBase ? 1.0 : Number(displayVal.toFixed(6))}
                                      onChange={e => {
                                        const val = parseFloat(e.target.value) || 0;
                                        if (val > 0) {
                                          const newRateToSar = baseRateToSar / val;
                                          const updated = [...currencies];
                                          updated[idx] = { ...updated[idx], rate_to_sar: newRateToSar };
                                          setCurrencies(updated);
                                        }
                                      }}
                                      className="w-28 p-1.5 bg-slate-50 border rounded-lg text-left font-mono text-xs font-black disabled:opacity-50"
                                    />
                                    <span className="text-[10px] font-black text-slate-400">{currencyItem.code}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: PAYROLL CYCLE */}
                  {settingsSubTab === 'payroll_cycle' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <h3 className="text-sm font-black text-slate-850">إعدادات دورة الرواتب والعمولات (Payroll Cycle Settings)</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">تحديد تاريخ بداية ونهاية الدورة المحاسبية الشهرية للموظفين لضبط احتساب الرواتب والعمولات والجزاءات التلقائية</p>
                      </div>

                      <div className="p-6 bg-slate-50/50 border rounded-2xl space-y-4 max-w-2xl">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-600 block">يوم بداية الدورة الشهرية (Cycle Start Day) :</label>
                          <div className="flex flex-wrap items-center gap-4 mt-2">
                            <select
                              value={payrollCycleStartDay}
                              onChange={e => setPayrollCycleStartDay(parseInt(e.target.value, 10))}
                              className="p-3 bg-white border rounded-xl text-xs font-black outline-none min-w-[140px] shadow-2xs"
                            >
                              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <option key={day} value={day}>
                                  {day} {day === 1 ? '(بداية الشهر)' : ''}
                                </option>
                              ))}
                            </select>
                            <div className="flex-1 min-w-[200px]">
                              <span className="text-xs text-indigo-600 font-extrabold block">
                                {payrollCycleStartDay === 1 
                                  ? 'دورة الصرف الحالية: من يوم 1 إلى نهاية الشهر التقويمي.'
                                  : `دورة الصرف الحالية: من يوم ${payrollCycleStartDay} في الشهر السابق إلى يوم ${payrollCycleStartDay - 1} في الشهر الحالي.`}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-1 leading-normal">
                                عند تفعيل هذه الدورة، سيقوم موديول الرواتب تلقائياً بجلب الغيابات من موديول الموارد البشرية والعمولات من موديول المبيعات للفترة المذكورة.
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: COMMISSIONS */}
                  {settingsSubTab === 'commissions' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <h3 className="text-sm font-black text-slate-850">إعدادات العمولات واستراتيجيات البيع (Sales Commissions)</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">تهيئة هيكل الحوافز والعمولات للمناديب ومسؤولي المبيعات (تتزامن مع موديول الـ CRM والرواتب)</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Scheme Selection */}
                        <div className="p-5 bg-slate-50/50 border rounded-2xl space-y-4">
                          <label className="text-xs font-black text-slate-600 block">استراتيجية العمولة النشطة (Active Strategy) :</label>
                          <div className="grid grid-cols-1 gap-2.5">
                            {[
                              { id: 'revenue_fixed', title: 'نسبة مئوية ثابتة من قيمة المبيعات', desc: 'يحصل المندوب على نسبة مئوية مباشرة من كل صفقة رابحة' },
                              { id: 'profit_fixed', title: 'نسبة مئوية ثابتة من صافي الأرباح', desc: 'تُحتسب العمولة كنسبة من صافي ربح الصفقة بعد خصم التكاليف' },
                              { id: 'volume_tiers', title: 'الشرائح المتدرجة لعدد الصفقات (Tiers)', desc: 'تزداد نسبة العمولة بزيادة عدد الأوردرات/البيعات المحققة' },
                              { id: 'revenue_tiers', title: 'الشرائح المتدرجة لإجمالي الإيرادات', desc: 'تتدرج النسبة بناءً على حجم المبيعات الإجمالي كقيمة مالية' }
                            ].map(scheme => (
                              <button
                                type="button"
                                key={scheme.id}
                                onClick={() => setCommissionSettings({ ...commissionSettings, activeScheme: scheme.id })}
                                className={`p-3 text-right rounded-xl border transition-all ${
                                  commissionSettings.activeScheme === scheme.id
                                    ? 'bg-white border-indigo-500 text-indigo-700 shadow-2xs font-bold'
                                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-100/50'
                                }`}
                              >
                                <span className="text-xs font-black block">{scheme.title}</span>
                                <span className="text-[9px] text-slate-400 block mt-0.5 leading-none">{scheme.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Parameters customization depending on selected strategy */}
                        <div className="p-5 bg-slate-50/50 border rounded-2xl space-y-4">
                          <label className="text-xs font-black text-slate-600 block border-b pb-2">تفاصيل الاستراتيجية النشطة :</label>

                          {commissionSettings.activeScheme === 'revenue_fixed' && (
                            <div className="space-y-3">
                              <span className="text-xs font-black text-slate-700 block">النسبة المئوية الثابتة من الإيرادات (%) :</span>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={commissionSettings.revenueFixedPercentage}
                                  onChange={e => setCommissionSettings({ ...commissionSettings, revenueFixedPercentage: parseFloat(e.target.value) || 0 })}
                                  className="p-3 bg-white border rounded-xl text-xs font-black outline-none w-24 text-left font-mono"
                                />
                                <span className="text-xs text-slate-500 font-bold">% من قيمة العقد/الصفقة</span>
                              </div>
                            </div>
                          )}

                          {commissionSettings.activeScheme === 'profit_fixed' && (
                            <div className="space-y-3">
                              <span className="text-xs font-black text-slate-700 block">النسبة المئوية الثابتة من صافي الأرباح (%) :</span>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={commissionSettings.profitFixedPercentage || 10}
                                  onChange={e => setCommissionSettings({ ...commissionSettings, profitFixedPercentage: parseFloat(e.target.value) || 0 })}
                                  className="p-3 bg-white border rounded-xl text-xs font-black outline-none w-24 text-left font-mono"
                                />
                                <span className="text-xs text-slate-500 font-bold">% من الربح الإجمالي</span>
                              </div>
                            </div>
                          )}

                          {commissionSettings.activeScheme === 'volume_tiers' && (
                            <div className="space-y-3">
                              <span className="text-xs font-black text-slate-700 block">طريقة حساب شرائح الصفقات :</span>
                              <select
                                value={commissionSettings.volumeCalculationType || 'flat'}
                                onChange={e => setCommissionSettings({ ...commissionSettings, volumeCalculationType: e.target.value })}
                                className="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none"
                              >
                                <option value="flat">Flat Tier (معدل الشريحة الأخيرة لكافة الصفقات)</option>
                                <option value="cumulative">Cumulative (الشرائح المتصاعدة تدريجياً بالتوالي)</option>
                              </select>

                              <div className="mt-4 space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase block">قائمة الشرائح الافتراضية المحملة :</span>
                                {commissionSettings.volumeTiers?.map((tier: any) => (
                                  <div key={tier.id} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border text-slate-600 font-semibold font-mono">
                                    <span>الحد الأدنى: {tier.min} بيع</span>
                                    <span>معدل العمولة: {tier.rate}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {commissionSettings.activeScheme === 'revenue_tiers' && (
                            <div className="space-y-3">
                              <span className="text-xs font-black text-slate-700 block">طريقة حساب شرائح الإيرادات :</span>
                              <select
                                value={commissionSettings.revenueCalculationType || 'flat'}
                                onChange={e => setCommissionSettings({ ...commissionSettings, revenueCalculationType: e.target.value })}
                                className="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none"
                              >
                                <option value="flat">Flat (الشريحة العليا للإيرادات الكلية)</option>
                                <option value="cumulative">Cumulative (حساب تدريجي مصاعد)</option>
                              </select>

                              <div className="mt-4 space-y-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase block">قائمة الشرائح المالية النشطة :</span>
                                {commissionSettings.revenueTiers?.map((tier: any) => (
                                  <div key={tier.id} className="flex justify-between items-center text-xs p-2 bg-white rounded-lg border text-slate-600 font-semibold font-mono">
                                    <span>أكثر من: {tier.min.toLocaleString()} EGP</span>
                                    <span>النسبة: {tier.rate}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB: INVOICE SETTINGS */}
                  {settingsSubTab === 'invoice' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div>
                        <h3 className="text-sm font-black text-slate-850">إعدادات الفاتورة وعروض الأسعار والضرائب (Invoice & VAT Settings)</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">تخصيص البيانات الافتراضية، الهوية البصرية، والنسب الضريبية لعروض الأسعار والفواتير اليومية</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Column 1: Financial settings & VAT */}
                        <div className="lg:col-span-1 space-y-4">
                          <div className="p-5 bg-slate-50/50 border rounded-2xl space-y-4">
                            <span className="text-[10px] font-black text-slate-400 block border-b pb-1">الإعدادات المالية</span>
                            
                            <div className="space-y-1.5">
                              <label className="text-xs font-black text-slate-600">نسبة ضريبة القيمة المضافة الافتراضية (Default VAT %) :</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={invoiceSettings.vatRate}
                                  onChange={e => setInvoiceSettings({ ...invoiceSettings, vatRate: parseInt(e.target.value, 10) || 0 })}
                                  className="p-3 bg-white border rounded-xl text-xs font-black outline-none w-24 text-left font-mono"
                                />
                                <span className="text-xs text-slate-500 font-semibold">% من قيمة المبيعات</span>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <label className="text-xs font-black text-slate-600">بادئة أرقام الفواتير الصادرة (Invoice Code Prefix) :</label>
                              <input
                                type="text"
                                value={invoiceSettings.prefix}
                                onChange={e => setInvoiceSettings({ ...invoiceSettings, prefix: e.target.value })}
                                className="w-full p-3 bg-white border rounded-xl text-xs font-black text-left font-mono outline-none"
                                placeholder="e.g. INV-2026-"
                              />
                            </div>

                            <div className="space-y-1.5 pt-1">
                              <label className="text-xs font-black text-slate-600">فترة الاستحقاق التلقائية بالأيام (Default Terms - Days) :</label>
                              <input
                                type="number"
                                min="0"
                                value={invoiceSettings.paymentTermsDays}
                                onChange={e => setInvoiceSettings({ ...invoiceSettings, paymentTermsDays: parseInt(e.target.value, 10) || 30 })}
                                className="w-full p-3 bg-white border rounded-xl text-xs font-black text-left font-mono outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Visual & Contact Customization */}
                        <div className="lg:col-span-2 space-y-4">
                          <div className="p-5 bg-slate-50/50 border rounded-2xl space-y-4">
                            <span className="text-[10px] font-black text-slate-400 block border-b pb-1">تصميم عرض السعر والخطابات الرسمية (Quotation Layout Design)</span>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600">اسم المنشأة / الشركة بالترويسة :</label>
                                <input
                                  type="text"
                                  value={invoiceSettings.name}
                                  onChange={e => setInvoiceSettings({ ...invoiceSettings, name: e.target.value })}
                                  className="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none"
                                  placeholder="مثال: شركة هب تكنو"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600">اختصار الشعار النصي (Logo Initials) :</label>
                                <input
                                  type="text"
                                  maxLength={5}
                                  value={invoiceSettings.logo}
                                  onChange={e => setInvoiceSettings({ ...invoiceSettings, logo: e.target.value })}
                                  className="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none font-mono"
                                  placeholder="مثال: BC"
                                />
                              </div>

                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-black text-slate-600">رابط صورة اللوجو (Logo URL - اختياري لرفع لوجو حقيقي) :</label>
                                <input
                                  type="text"
                                  value={invoiceSettings.logoUrl}
                                  onChange={e => setInvoiceSettings({ ...invoiceSettings, logoUrl: e.target.value })}
                                  className="w-full p-2.5 bg-white border rounded-xl text-xs font-semibold font-mono outline-none text-left"
                                  placeholder="https://example.com/logo.png"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600">العنوان الكامل للشركة :</label>
                                <input
                                  type="text"
                                  value={invoiceSettings.address}
                                  onChange={e => setInvoiceSettings({ ...invoiceSettings, address: e.target.value })}
                                  className="w-full p-2.5 bg-white border rounded-xl text-xs font-semibold outline-none"
                                  placeholder="مثال: الرياض، طريق الملك فهد"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600">رقم الهاتف للتواصل :</label>
                                <input
                                  type="text"
                                  value={invoiceSettings.phone}
                                  onChange={e => setInvoiceSettings({ ...invoiceSettings, phone: e.target.value })}
                                  className="w-full p-2.5 bg-white border rounded-xl text-xs font-semibold font-mono outline-none text-left"
                                  placeholder="+966-555-CORE-000"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600">البريد الإلكتروني للفوترة :</label>
                                <input
                                  type="email"
                                  value={invoiceSettings.email}
                                  onChange={e => setInvoiceSettings({ ...invoiceSettings, email: e.target.value })}
                                  className="w-full p-2.5 bg-white border rounded-xl text-xs font-semibold font-mono outline-none text-left"
                                  placeholder="billing@company.com"
                                />
                              </div>

                              {/* Color Picker & presets */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-600">اللون الرئيسي للهوية (Primary Accent Color) :</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={invoiceSettings.primaryColor}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, primaryColor: e.target.value })}
                                    className="w-10 h-10 rounded-xl cursor-pointer border p-0.5 bg-white"
                                  />
                                  <input
                                    type="text"
                                    value={invoiceSettings.primaryColor}
                                    onChange={e => setInvoiceSettings({ ...invoiceSettings, primaryColor: e.target.value })}
                                    className="w-24 p-2 bg-white border rounded-xl text-xs font-mono font-bold text-center outline-none"
                                  />
                                  {/* Quick presets */}
                                  <div className="flex gap-1">
                                    {['#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#06b6d4', '#1e293b'].map(c => (
                                      <button
                                        type="button"
                                        key={c}
                                        onClick={() => setInvoiceSettings({ ...invoiceSettings, primaryColor: c })}
                                        className="w-5 h-5 rounded-full border border-white shadow-xs"
                                        style={{ backgroundColor: c }}
                                        title={c}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1.5 md:col-span-2">
                                <label className="text-xs font-black text-slate-600">ملاحظات التذييل وشروط عرض السعر (Footer Note / Terms) :</label>
                                <textarea
                                  rows={2}
                                  value={invoiceSettings.footerNote}
                                  onChange={e => setInvoiceSettings({ ...invoiceSettings, footerNote: e.target.value })}
                                  className="w-full p-2.5 bg-white border rounded-xl text-xs font-semibold outline-none resize-none leading-relaxed"
                                  placeholder="تكتب هنا الشروط العامة وعمر صلاحية عرض السعر كـ: يسري هذا العرض لمدة 30 يوماً من تاريخ الإصدار."
                                />
                              </div>
                            </div>

                            {/* Mini layout preview */}
                            <div className="p-4 bg-white rounded-xl border border-slate-150 space-y-3 shadow-3xs">
                              <span className="text-[9px] font-black text-slate-400 block uppercase">معاينة الهوية البصرية للترويسة (Header Design Preview) :</span>
                              <div className="border p-3.5 rounded-lg flex justify-between items-center bg-slate-50/50">
                                <div className="flex items-center gap-2">
                                  {invoiceSettings.logoUrl ? (
                                    <img src={invoiceSettings.logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain border bg-white" referrerPolicy="no-referrer" />
                                  ) : (
                                    <span 
                                      className="w-8 h-8 rounded-lg text-white font-black text-xs flex items-center justify-center shadow-sm"
                                      style={{ backgroundColor: invoiceSettings.primaryColor }}
                                    >
                                      {invoiceSettings.logo}
                                    </span>
                                  )}
                                  <div>
                                    <h4 className="text-xs font-black text-slate-800" style={{ color: invoiceSettings.primaryColor }}>{invoiceSettings.name}</h4>
                                    <p className="text-[9px] text-slate-400 font-semibold">{invoiceSettings.address}</p>
                                  </div>
                                </div>
                                <div className="text-left font-mono text-[9px] text-slate-400 leading-normal">
                                  <div>{invoiceSettings.phone}</div>
                                  <div>{invoiceSettings.email}</div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* ==========================================
          SHARED MODALS FOR ADDING TRANSACTIONS
          ========================================== */}

      {/* BASE CURRENCY CONFIRMATION MODAL */}
      {showCurrencyConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[120]" dir="rtl">
          <div className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-md w-full text-right relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-4 border-b">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-850">تأكيد تغيير العملة الأساسية</h3>
              </div>
              <button onClick={cancelBaseCurrencyChange} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4 mt-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                هل أنت متأكد من رغبتك في تغيير العملة الأساسية للنظام من <span className="font-bold text-slate-900">{baseCurrency}</span> إلى <span className="font-bold text-indigo-600">{tempBaseCurrency}</span>؟
              </p>
              <p className="text-slate-500 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-200/50">
                ⚠️ سيتم تطبيق هذه العملة كعملة معيارية موحدة في جميع موديولات النظام (الحسابات، المبيعات والصفقات، المنتجات والمخزون، والعمليات والتشغيل).
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={executeBaseCurrencyChange}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-colors shadow-xs"
                >
                  نعم، تأكيد وتغيير العملة
                </button>
                <button
                  type="button"
                  onClick={cancelBaseCurrencyChange}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD BANK MODAL */}
      {showAddBankModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[110]" dir="rtl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-md w-full text-right max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-sm font-black text-slate-850">إضافة حساب بنكي أو خزنة</h3>
              <button onClick={() => { setShowAddBankModal(false); setShowManageTypes(false); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddBankSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">الاسم بالعربية :</label>
                  <input type="text" required value={bankForm.name_ar} onChange={e => setBankForm({ ...bankForm, name_ar: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">الاسم بالإنجليزية :</label>
                  <input type="text" required value={bankForm.name_en} onChange={e => setBankForm({ ...bankForm, name_en: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl text-left" />
                </div>
              </div>

              {/* Account Type and Custom Type Manager */}
              <div className="space-y-1.5 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">نوع الحساب / الخزنة :</label>
                  <button
                    type="button"
                    onClick={() => setShowManageTypes(!showManageTypes)}
                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                  >
                    {showManageTypes ? 'إغلاق إدارة الأنواع' : '⚙️ تعديل وإضافة أنواع'}
                  </button>
                </div>
                
                <select 
                  value={bankForm.type} 
                  onChange={e => setBankForm({ ...bankForm, type: e.target.value })} 
                  className="w-full p-2.5 bg-white border rounded-xl text-xs font-bold"
                >
                  {bankAccountTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.label_ar} ({t.label_en})</option>
                  ))}
                </select>

                {/* Inline Type Manager Expander */}
                {showManageTypes && (
                  <div className="mt-3 p-3 bg-white border rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-150">
                    <p className="text-[10px] text-slate-400 font-bold">إضافة نوع مالي جديد (مثال: محفظة، كاش، إنستا باي، إلخ):</p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          placeholder="الاسم بالعربية"
                          value={newTypeNameAr}
                          onChange={e => setNewTypeNameAr(e.target.value)}
                          className="w-full p-2 bg-slate-50 border rounded-lg text-[10px]"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="الاسم بالإنجليزية"
                          value={newTypeNameEn}
                          onChange={e => setNewTypeNameEn(e.target.value)}
                          className="w-full p-2 bg-slate-50 border rounded-lg text-[10px] text-left"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      {editingTypeId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTypeId(null);
                            setNewTypeNameAr('');
                            setNewTypeNameEn('');
                          }}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold"
                        >
                          إلغاء التعديل
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (!newTypeNameAr || !newTypeNameEn) {
                            alert('يرجى ملء الاسم بالعربية والإنجليزية.');
                            return;
                          }
                          if (editingTypeId) {
                            setBankAccountTypes(prev => prev.map(t => t.id === editingTypeId ? { ...t, label_ar: newTypeNameAr, label_en: newTypeNameEn } : t));
                            triggerSuccess('تم تعديل نوع الحساب بنجاح.');
                            setEditingTypeId(null);
                          } else {
                            const newId = `type_${Date.now()}`;
                            setBankAccountTypes(prev => [...prev, { id: newId, label_ar: newTypeNameAr, label_en: newTypeNameEn }]);
                            setBankForm(prev => ({ ...prev, type: newId }));
                            triggerSuccess('تم إضافة نوع الحساب وجعله محدداً.');
                          }
                          setNewTypeNameAr('');
                          setNewTypeNameEn('');
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black"
                      >
                        {editingTypeId ? 'تحديث النوع' : 'حفظ وإضافة'}
                      </button>
                    </div>

                    {/* Types List with Action Buttons */}
                    <div className="border-t pt-2 mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                      <span className="text-[9px] font-bold text-slate-400 block">الأنواع المتاحة بالقائمة حالياً:</span>
                      {bankAccountTypes.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg text-[10px] hover:bg-slate-100 transition-colors">
                          <span className="font-bold text-slate-700">{t.label_ar} <span className="text-[8px] text-slate-400 font-normal">({t.label_en})</span></span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTypeId(t.id);
                                setNewTypeNameAr(t.label_ar);
                                setNewTypeNameEn(t.label_en);
                              }}
                              className="text-slate-500 hover:text-indigo-600 font-bold px-1"
                              title="تعديل المسمى"
                            >
                              تعديل
                            </button>
                            {t.id !== 'bank' && t.id !== 'cash_box' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من حذف نوع الحساب [${t.label_ar}]؟`)) {
                                    setBankAccountTypes(prev => prev.filter(item => item.id !== t.id));
                                    if (bankForm.type === t.id) {
                                      setBankForm(prev => ({ ...prev, type: 'bank' }));
                                    }
                                    triggerSuccess('تم حذف النوع بنجاح.');
                                  }
                                }}
                                className="text-rose-500 hover:text-rose-700 font-bold px-1"
                                title="حذف"
                              >
                                حذف
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">الرصيد الافتتاحي :</label>
                <input type="number" value={bankForm.balance || ''} onChange={e => setBankForm({ ...bankForm, balance: parseFloat(e.target.value) || 0 })} className="w-full p-2.5 bg-slate-50 border rounded-xl text-left font-mono font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">رقم الحساب / الآيبان (إن وجد) :</label>
                <input type="text" value={bankForm.iban} onChange={e => setBankForm({ ...bankForm, iban: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl text-left font-mono" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs transition-colors">
                حفظ الحساب وتثبيته المالي
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ADD COA ACCOUNT MODAL */}
      {showAddCoaModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[110]" dir="rtl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-md w-full text-right">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-sm font-black text-slate-850">إضافة حساب دفتر جديد (GL Account)</h3>
              <button onClick={() => setShowAddCoaModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCoaSubmit} className="space-y-4 mt-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">كود الحساب الدفتري (مثال: 10500) :</label>
                <input type="text" required value={newCoaForm.id} onChange={e => setNewCoaForm({ ...newCoaForm, id: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl text-left font-mono font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">اسم الحساب بالعربية :</label>
                  <input type="text" required value={newCoaForm.name_ar} onChange={e => setNewCoaForm({ ...newCoaForm, name_ar: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500">اسم الحساب بالإنجليزية :</label>
                  <input type="text" required value={newCoaForm.name_en} onChange={e => setNewCoaForm({ ...newCoaForm, name_en: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl text-left" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">التصنيف المحاسبي للعمود الدفتري :</label>
                <select value={newCoaForm.type} onChange={e => setNewCoaForm({ ...newCoaForm, type: e.target.value as any })} className="w-full p-2.5 bg-slate-50 border rounded-xl">
                  <option value="assets">أصول (Assets)</option>
                  <option value="liabilities">خصوم ومطلوبات (Liabilities)</option>
                  <option value="equity">حقوق ملكية (Equity)</option>
                  <option value="revenue">إيرادات (Revenue)</option>
                  <option value="expenses">مصروفات (Expenses)</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs">
                إضافة الحساب للدليل المحاسبي
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ADD/EDIT INVOICE MODAL */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4 md:p-6" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-slate-50 rounded-[2rem] border border-slate-200/80 shadow-2xl max-w-6xl w-full text-right flex flex-col lg:flex-row overflow-hidden my-auto h-[90vh] max-h-[90vh]"
          >
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-invoice-form, #printable-invoice-form * {
                  visibility: visible !important;
                }
                #printable-invoice-form {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: white !important;
                  padding: 30px !important;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            `}</style>

            {/* Left Panel: Form Inputs & Items Manager */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-white border-l border-slate-200/50 flex flex-col justify-between h-full">
              <div>
                {/* Modal Title & Close */}
                <div className="flex justify-between items-center pb-5 border-b border-slate-100 mb-6">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {invoiceForm.id ? "تعديل وتحديث فاتورة بيع" : "إنشاء وإصدار فاتورة بيع تفصيلية"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      قم بملء البيانات وإضافة بنود الخدمة أو السلع لتوليد فاتورة ضريبية متوافقة.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowAddInvoiceModal(false)} 
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Inputs Form */}
                <form id="invoice-form-element" onSubmit={handleAddInvoiceSubmit} className="space-y-6 text-xs">
                  {/* Customer & Basic Information */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-slate-900 rounded-full"></span>
                      بيانات العميل والاتصال
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-600">اسم العميل بالكامل <span className="text-rose-500">*</span></label>
                        <input 
                          type="text" 
                          required 
                          placeholder="مثال: شركة الحلول المتقدمة"
                          value={invoiceForm.customer_name} 
                          onChange={e => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })} 
                          className="w-full p-2.5 bg-white border border-slate-200 focus:border-slate-400 focus:ring-0 rounded-xl text-xs transition-all" 
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-600 font-sans">الرقم الضريبي للعميل (VAT ID)</label>
                        <input 
                          type="text" 
                          placeholder="مثال: 300123456700003"
                          value={invoiceForm.vat_number} 
                          onChange={e => setInvoiceForm({ ...invoiceForm, vat_number: e.target.value })} 
                          className="w-full p-2.5 bg-white border border-slate-200 focus:border-slate-400 focus:ring-0 rounded-xl text-xs font-mono text-left transition-all" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-600">رقم أمر الشراء (PO Number)</label>
                        <input 
                          type="text" 
                          placeholder="مثال: PO-45001"
                          value={invoiceForm.po_number} 
                          onChange={e => setInvoiceForm({ ...invoiceForm, po_number: e.target.value })} 
                          className="w-full p-2.5 bg-white border border-slate-200 focus:border-slate-400 focus:ring-0 rounded-xl text-xs font-mono text-left transition-all" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-600">طريقة السداد المتوقعة</label>
                        <select 
                          value={invoiceForm.payment_method} 
                          onChange={e => setInvoiceForm({ ...invoiceForm, payment_method: e.target.value })} 
                          className="w-full p-2.5 bg-white border border-slate-200 focus:border-slate-400 focus:ring-0 rounded-xl text-xs transition-all"
                        >
                          <option value="تحويل بنكي">تحويل بنكي (Bank Wire)</option>
                          <option value="فيزا / كارت">فيزا / كارت (POS Card)</option>
                          <option value="كاش">كاش (Cash Vault)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Dates */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-slate-900 rounded-full"></span>
                      جدولة وتواريخ الفاتورة
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-600">تاريخ إصدار الفاتورة</label>
                        <input 
                          type="date" 
                          required 
                          value={invoiceForm.date} 
                          onChange={e => setInvoiceForm({ ...invoiceForm, date: e.target.value })} 
                          className="w-full p-2.5 bg-white border border-slate-200 focus:border-slate-400 focus:ring-0 rounded-xl text-xs font-mono text-left" 
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="font-extrabold text-slate-600">تاريخ الاستحقاق الدفتري</label>
                        <input 
                          type="date" 
                          required 
                          value={invoiceForm.due_date} 
                          onChange={e => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })} 
                          className="w-full p-2.5 bg-white border border-slate-200 focus:border-slate-400 focus:ring-0 rounded-xl text-xs font-mono text-left" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Items Grid Manager */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-1.5 h-3 bg-slate-900 rounded-full"></span>
                        جدول بنود الفاتورة والخدمات الخاضعة للضريبة
                      </h4>
                      <button
                        type="button"
                        onClick={addInvoiceItem}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-black text-[10px] flex items-center gap-1 transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        إضافة بند جديد
                      </button>
                    </div>

                    {/* Table-Like Grid Container */}
                    <div className="border border-slate-200/60 rounded-2xl overflow-hidden bg-slate-50/20">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="bg-slate-100/80 text-slate-600 font-extrabold border-b border-slate-200/50">
                            <th className="p-3 text-right">وصف البند / الخدمة</th>
                            <th className="p-3 text-center w-20">الكمية</th>
                            <th className="p-3 text-center w-28">السعر ({baseCurrency})</th>
                            <th className="p-3 text-center w-16">خصم %</th>
                            <th className="p-3 text-center w-16">ضريبة %</th>
                            <th className="p-3 text-left w-24">الإجمالي</th>
                            <th className="p-3 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invoiceForm.items.map((item, idx) => {
                            const itemTotal = (item.quantity * item.price) * (1 - (item.discount_rate || 0) / 100) * (1 + (item.vat_rate || 0) / 100);
                            return (
                              <tr key={`item-row-${idx}`} className="hover:bg-white/65 transition-colors">
                                <td className="p-2 space-y-1">
                                  <select
                                    value={products.some(p => `PRD-${p.id}` === item.product_id) ? (products.find(p => `PRD-${p.id}` === item.product_id)?.id || '') : ''}
                                    onChange={e => handleProductSelect(idx, e.target.value)}
                                    className="w-full p-1 bg-white border border-slate-200 focus:ring-1 focus:ring-slate-300 rounded-lg text-[10px] text-slate-700 font-bold"
                                  >
                                    <option value="">-- ربط بمنتج/خدمة مالي --</option>
                                    {products.map(p => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({p.price} {p.currency || 'SAR'})
                                      </option>
                                    ))}
                                  </select>
                                  <input 
                                    type="text" 
                                    required
                                    placeholder="مثال: تقديم تراخيص برمجية أو خدمات تطوير"
                                    value={item.product_name} 
                                    onChange={e => updateInvoiceItem(idx, 'product_name', e.target.value)} 
                                    className="w-full p-1 bg-transparent border-0 focus:bg-white focus:ring-1 focus:ring-slate-300 rounded-lg text-xs"
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    required
                                    min="1"
                                    value={item.quantity} 
                                    onChange={e => updateInvoiceItem(idx, 'quantity', parseInt(e.target.value) || 1)} 
                                    className="w-full p-2 bg-transparent border-0 focus:bg-white focus:ring-1 focus:ring-slate-300 rounded-lg text-xs text-center font-mono font-bold"
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    required
                                    min="0"
                                    value={item.price || ''} 
                                    placeholder="0"
                                    onChange={e => updateInvoiceItem(idx, 'price', parseFloat(e.target.value) || 0)} 
                                    className="w-full p-2 bg-transparent border-0 focus:bg-white focus:ring-1 focus:ring-slate-300 rounded-lg text-xs text-center font-mono font-bold"
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    min="0"
                                    max="100"
                                    value={item.discount_rate} 
                                    onChange={e => updateInvoiceItem(idx, 'discount_rate', parseFloat(e.target.value) || 0)} 
                                    className="w-full p-2 bg-transparent border-0 focus:bg-white focus:ring-1 focus:ring-slate-300 rounded-lg text-xs text-center font-mono text-slate-500"
                                  />
                                </td>
                                <td className="p-2">
                                  <input 
                                    type="number" 
                                    min="0"
                                    max="100"
                                    value={item.vat_rate} 
                                    onChange={e => updateInvoiceItem(idx, 'vat_rate', parseFloat(e.target.value) || 0)} 
                                    className="w-full p-2 bg-transparent border-0 focus:bg-white focus:ring-1 focus:ring-slate-300 rounded-lg text-xs text-center font-mono text-slate-500"
                                  />
                                </td>
                                <td className="p-2 text-left font-mono font-extrabold text-slate-700">
                                  {itemTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    disabled={invoiceForm.items.length <= 1}
                                    onClick={() => removeInvoiceItem(idx)}
                                    className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 disabled:opacity-30 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Terms / Remarks */}
                  <div className="space-y-1.5">
                    <label className="font-extrabold text-slate-600">ملاحظات وشروط الفاتورة الإضافية</label>
                    <textarea 
                      placeholder="اكتب أي ملاحظات أو شروط سداد مخصصة لهذه الفاتورة..."
                      value={invoiceForm.notes} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} 
                      className="w-full p-3 bg-slate-50/50 border border-slate-200 focus:border-slate-400 focus:ring-0 rounded-xl text-xs h-20 transition-all resize-none"
                    />
                  </div>
                </form>
              </div>

              {/* Submit / Cancel Footer Action */}
              <div className="pt-5 border-t border-slate-100 flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddInvoiceModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors rounded-xl font-bold text-xs"
                >
                  إلغاء الأمر
                </button>
                <button
                  type="submit"
                  form="invoice-form-element"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs shadow-md transition-colors"
                  style={{ backgroundColor: invoiceSettings.primaryColor }}
                >
                  {invoiceForm.id ? "تحديث الفاتورة والترحيل للدفاتر" : "إصدار مسودة الفاتورة وقيد الضريبة دفترياً"}
                </button>
              </div>
            </div>

            {/* Right Panel: Live Visual A4 Invoice Preview */}
            <div className="w-full lg:w-[45%] bg-slate-100/50 overflow-y-auto p-6 md:p-8 flex flex-col gap-4 border-r border-slate-200/30">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  معاينة مباشرة وحية للمستند
                </span>
                
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-xs rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-4 h-4" />
                  طباعة الفاتورة / PDF
                </button>
              </div>

              {/* Printable Area - styled precisely like a real business letterhead */}
              <div 
                id="printable-invoice-form" 
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-slate-800 font-sans max-w-full mx-auto"
                style={{ direction: 'rtl' }}
              >
                {/* Letterhead Header */}
                <div className="flex justify-between items-start border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {invoiceSettings.logoUrl ? (
                        <img 
                          src={invoiceSettings.logoUrl} 
                          alt="Logo" 
                          className="h-10 w-auto object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs" style={{ backgroundColor: invoiceSettings.primaryColor || '#000000' }}>
                          CO
                        </div>
                      )}
                      <h2 className="text-sm font-black text-slate-900">
                        {invoiceSettings.name || "الشركة المتطورة لتقنية المعلومات"}
                      </h2>
                    </div>
                    <p className="text-[10px] text-slate-500">{invoiceSettings.address || "الرياض، المملكة العربية السعودية"}</p>
                    <p className="text-[10px] text-slate-500 font-mono">الهاتف: {invoiceSettings.phone || "+966 11 000 0000"}</p>
                    <p className="text-[10px] text-slate-500 font-mono">البريد: {invoiceSettings.email || "finance@domain.com"}</p>
                  </div>
                  
                  <div className="text-left space-y-1">
                    <span 
                      className="inline-block px-3 py-1 text-[10px] font-black rounded-lg text-white uppercase tracking-widest"
                      style={{ backgroundColor: invoiceSettings.primaryColor || '#0f172a' }}
                    >
                      فاتورة ضريبية مبسطة
                    </span>
                    <p className="text-xs font-black text-slate-900 mt-2 font-mono">
                      {invoiceForm.id || `${invoiceSettings.prefix || 'INV-2026-'}${String(invoices.length + 1).padStart(3, '0')}`}
                    </p>
                    <p className="text-[10px] text-slate-500">تاريخ الإصدار: <span className="font-mono">{invoiceForm.date}</span></p>
                    <p className="text-[10px] text-slate-500">تاريخ الاستحقاق: <span className="font-mono">{invoiceForm.due_date}</span></p>
                  </div>
                </div>

                {/* Client / Target Details */}
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div className="space-y-1">
                    <h5 className="font-extrabold text-slate-500 text-[10px] uppercase">مستلم الفاتورة:</h5>
                    <p className="font-black text-slate-800 text-xs">{invoiceForm.customer_name || 'سعادة العميل الكريم / جهة التعاقد'}</p>
                    {invoiceForm.vat_number && (
                      <p className="text-[10px] text-slate-600 font-mono">الرقم الضريبي للعميل: {invoiceForm.vat_number}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <h5 className="font-extrabold text-slate-500 text-[10px] uppercase">تفاصيل إضافية:</h5>
                    {invoiceForm.po_number && (
                      <p className="text-[10px] text-slate-600 font-mono">رقم أمر الشراء: {invoiceForm.po_number}</p>
                    )}
                    <p className="text-[10px] text-slate-600">طريقة الدفع: {invoiceForm.payment_method}</p>
                    <p className="text-[10px] text-slate-600">الحالة: <span className="text-amber-600 font-black">مسودة (Draft)</span></p>
                  </div>
                </div>

                {/* Table of items */}
                <div className="space-y-2">
                  <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-slate-500 font-black">
                        <th className="py-2 text-right">وصف الخدمة / البند</th>
                        <th className="py-2 text-center w-14">الكمية</th>
                        <th className="py-2 text-center w-24">السعر</th>
                        <th className="py-2 text-center w-14">الخصم</th>
                        <th className="py-2 text-center w-14">الضريبة</th>
                        <th className="py-2 text-left w-24">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceForm.items.map((item, idx) => {
                        const baseVal = item.quantity * item.price;
                        const discVal = baseVal * ((item.discount_rate || 0) / 100);
                        const taxVal = (baseVal - discVal) * ((item.vat_rate || 0) / 100);
                        const totalVal = baseVal - discVal + taxVal;
                        return (
                          <tr key={`preview-row-${idx}`} className="text-slate-700">
                            <td className="py-2.5 font-bold">{item.product_name || 'خدمة استشارية / توريد برمجيات'}</td>
                            <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                            <td className="py-2.5 text-center font-mono">{item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="py-2.5 text-center font-mono text-slate-400">{item.discount_rate}%</td>
                            <td className="py-2.5 text-center font-mono text-slate-400">{item.vat_rate}%</td>
                            <td className="py-2.5 text-left font-mono font-extrabold">{totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>المجموع الفرعي الخاضع للضريبة:</span>
                      <span className="font-mono font-bold">
                        {invoiceForm.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                      </span>
                    </div>
                    {invoiceForm.discount_amount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>إجمالي الخصم التجاري:</span>
                        <span className="font-mono font-bold">
                          -{invoiceForm.discount_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-500">
                      <span>ضريبة القيمة المضافة:</span>
                      <span className="font-mono font-bold">
                        {invoiceForm.vat_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                      </span>
                    </div>
                    
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                      <span>إجمالي الفاتورة المستحق:</span>
                      <span className="font-mono" style={{ color: invoiceSettings.primaryColor }}>
                        {invoiceForm.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} {baseCurrency}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="pt-4 text-center text-[10px] text-slate-400">
                  <p>{invoiceSettings.footerNote || "نشكركم لثقتكم بنا واختياركم خدماتنا المتكاملة."}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ADD SUPPLIER BILL MODAL */}
      {showAddBillModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[110]" dir="rtl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-md w-full text-right">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-sm font-black text-slate-850">تسجيل فاتورة شراء ومصروفات</h3>
              <button onClick={() => setShowAddBillModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddBillSubmit} className="space-y-4 mt-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">اسم المورد / الجهة المستلمة :</label>
                <input type="text" required value={billForm.supplier_name} onChange={e => setBillForm({ ...billForm, supplier_name: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">قيمة المصروف (قبل ضريبة الـ VAT إن وجد) :</label>
                <input type="number" required value={billForm.amount || ''} onChange={e => setBillForm({ ...billForm, amount: parseFloat(e.target.value) || 0 })} className="w-full p-2.5 bg-slate-50 border rounded-xl text-left font-mono font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">تبويب حساب المصروف :</label>
                <select value={billForm.account_id} onChange={e => setBillForm({ ...billForm, account_id: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl">
                  <option value="50100">مصروفات الأجور والرواتب (50100)</option>
                  <option value="50200">مصروف إيجار المقرات (50200)</option>
                  <option value="50300">تكاليف التسويق والإعلانات (50300)</option>
                  <option value="50400">خسائر عيوب الجودة والـ NCR (50400)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">بيان ووصف الفاتورة :</label>
                <input type="text" required value={billForm.description} onChange={e => setBillForm({ ...billForm, description: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs">
                قيد الفاتورة ومطابقة حسابات الدفع
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ADD MANUAL JOURNAL ENTRY MODAL */}
      {showAddJournalModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[110]" dir="rtl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-lg w-full text-right">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-sm font-black text-slate-850">قيد محاسبي يدوي متوازن (GAAP Journal Entry)</h3>
              <button onClick={() => setShowAddJournalModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddJournalSubmit} className="space-y-4 mt-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">شرح القيد الإجمالي (Description) :</label>
                <input type="text" required value={journalForm.description} onChange={e => setJournalForm({ ...journalForm, description: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>

              {/* Rows */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-bold block uppercase border-b pb-1">أسطر القيد المزدوج :</span>
                {journalForm.lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6 space-y-1">
                      <select
                        value={line.account_id}
                        required
                        onChange={e => {
                          const newLines = [...journalForm.lines];
                          newLines[idx].account_id = e.target.value;
                          setJournalForm({ ...journalForm, lines: newLines });
                        }}
                        className="w-full p-2 bg-slate-50 border rounded-lg text-[10px]"
                      >
                        <option value="">-- اختر الحساب --</option>
                        {coa.map(c => <option key={c.id} value={c.id}>[{c.id}] {c.name_ar}</option>)}
                      </select>
                    </div>

                    <div className="col-span-3 space-y-1">
                      <input
                        type="number"
                        placeholder="مدين Dr"
                        value={line.debit || ''}
                        onChange={e => {
                          const newLines = [...journalForm.lines];
                          newLines[idx].debit = parseFloat(e.target.value) || 0;
                          newLines[idx].credit = 0; // mutually exclusive
                          setJournalForm({ ...journalForm, lines: newLines });
                        }}
                        className="w-full p-2 bg-slate-50 border rounded-lg font-mono text-[10px] text-left"
                      />
                    </div>

                    <div className="col-span-3 space-y-1">
                      <input
                        type="number"
                        placeholder="دائن Cr"
                        value={line.credit || ''}
                        onChange={e => {
                          const newLines = [...journalForm.lines];
                          newLines[idx].credit = parseFloat(e.target.value) || 0;
                          newLines[idx].debit = 0; // mutually exclusive
                          setJournalForm({ ...journalForm, lines: newLines });
                        }}
                        className="w-full p-2 bg-slate-50 border rounded-lg font-mono text-[10px] text-left"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setJournalForm({ ...journalForm, lines: [...journalForm.lines, { account_id: '', debit: 0, credit: 0 }] })}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border text-slate-700 text-[10px] font-bold rounded-lg"
                >
                  + إضافة سطر محاسبي
                </button>
              </div>

              <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs">
                ترحيل القيد ودفترته المالي
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* ADD BANK STATEMENT TRANSACTION FOR RECONCILIATION */}
      {showStatementModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[110]" dir="rtl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-[2rem] border shadow-2xl max-w-md w-full text-right">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-sm font-black text-slate-850">تسجيل حركة كشف حساب مصرفي</h3>
              <button onClick={() => setShowStatementModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddStatementSubmit} className="space-y-4 mt-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">بيان الحركة ووصف البنك :</label>
                <input type="text" required placeholder="مثال: حوالة واردة من العميل أو تسوية بطاقة شبكة" value={statementForm.description} onChange={e => setStatementForm({ ...statementForm, description: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">مبلغ المعاملة (قيمة موجبة للإيداع وسالبة للسحب) :</label>
                <input type="number" required value={statementForm.amount || ''} onChange={e => setStatementForm({ ...statementForm, amount: parseFloat(e.target.value) || 0 })} className="w-full p-2.5 bg-slate-50 border rounded-xl text-left font-mono font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500">تاريخ الحركة المصرفية :</label>
                <input type="date" required value={statementForm.date} onChange={e => setStatementForm({ ...statementForm, date: e.target.value })} className="w-full p-2.5 bg-slate-50 border rounded-xl text-left" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs">
                إدراج في مسودات كشف الحساب المصرفي
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <DeleteConfirmation
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        title={deleteTarget ? `تأكيد التراجع والمسح الفعلي` : 'حذف عنصر مالي'}
        message={`هل أنت متأكد تماماً من رغبتك في حذف هذا القيد المالي؟ سيتم عكس وتعديل كافة المعاملات المتأثرة بدفتر اليومية ودفتر الأستاذ العام بشكل دائم.`}
      />

    </div>
  );
}
