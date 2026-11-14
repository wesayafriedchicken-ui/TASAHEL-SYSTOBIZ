import { CoAAccount, BankOrWallet, JournalEntry, Invoice, Bill, BankStatement, EmployeeSalary } from './AccountingTypes';

export const DEFAULT_COA: CoAAccount[] = [
  { id: '10100', name_en: 'Petty Cash Safe', name_ar: 'الخزنة النقدية (كاش فرع القاهرة)', type: 'assets', is_active: true },
  { id: '10200', name_en: 'Cash at Bank (NBE)', name_ar: 'حساب البنك الأهلي المصري', type: 'assets', is_active: true },
  { id: '10300', name_en: 'Accounts Receivable (AR)', name_ar: 'حساب العملاء (مدينون)', type: 'assets', is_active: true },
  { id: '10400', name_en: 'Post-dated Cheques Receivable', name_ar: 'حساب أوراق القبض (شيكات)', type: 'assets', is_active: true },
  { id: '20100', name_en: 'Accounts Payable (AP)', name_ar: 'حساب الموردين (دائنون)', type: 'liabilities', is_active: true },
  { id: '20200', name_en: 'VAT Output Tax Payable', name_ar: 'ضريبة القيمة المضافة مستحقة السداد', type: 'liabilities', is_active: true },
  { id: '20300', name_en: 'Accrued Quality Costs Payables', name_ar: 'مستحقات تكاليف الجودة والـ NCR', type: 'liabilities', is_active: true },
  { id: '30100', name_en: 'Share Capital', name_ar: 'رأس المال المدفوع', type: 'equity', is_active: true },
  { id: '30200', name_en: 'Retained Earnings', name_ar: 'الأرباح المبقاة / المرحّلة', type: 'equity', is_active: true },
  { id: '40100', name_en: 'Product License Sales', name_ar: 'إيرادات بيع تراخيص النظام والخدمات', type: 'revenue', is_active: true },
  { id: '40200', name_en: 'Consulting & Setup Revenues', name_ar: 'إيرادات الاستشارات وتأسيس الفروع', type: 'revenue', is_active: true },
  { id: '50100', name_en: 'Salaries & Outgoings Expense', name_ar: 'مصروفات الرواتب والأجور الأساسية', type: 'expenses', is_active: true },
  { id: '50200', name_en: 'Office Rent Expense', name_ar: 'مصروف إيجار المقرات والفروع', type: 'expenses', is_active: true },
  { id: '50300', name_en: 'Marketing & Ad Campaigns Outlays', name_ar: 'مصروف الحملات الإعلانية والتسويق', type: 'expenses', is_active: true },
  { id: '50400', name_en: 'Quality Defects Cost (COPQ)', name_ar: 'مصروف خسائر عيوب الجودة (NCR)', type: 'expenses', is_active: true },
  { id: '50500', name_en: 'Direct Operational Expenses', name_ar: 'المصروفات التشغيلية المباشرة (Operations Hub)', type: 'expenses', is_active: true },
];

export const DEFAULT_BANKS_WALLETS: BankOrWallet[] = [
  { id: '1', name_en: 'Operational Cash Vault', name_ar: 'خزنة كاش (فرع القاهرة)', type: 'cash_box', currency: 'EGP', balance: 45000 },
  { id: '2', name_en: 'NBE Corporate Account', name_ar: 'حساب البنك الأهلي المصري', type: 'bank', currency: 'EGP', account_number: 'NBE-1020304050', iban: 'EG900003000010203040506071', bank_name: 'البنك الأهلي المصري', balance: 207800 },
  { id: '3', name_en: 'Vodafone Cash Business Wallet', name_ar: 'محفظة فودافون كاش التجارية', type: 'cash_box', currency: 'EGP', balance: 12000 },
  { id: '4', name_en: 'Cheque Vault Account', name_ar: 'خزنة الشيكات الآجلة', type: 'cash_box', currency: 'EGP', balance: 35000 }
];

export const DEFAULT_JOURNAL: JournalEntry[] = [
  {
    id: 'JE-2026-000',
    date: '2026-01-01',
    reference: 'OPB-2026',
    description: 'Opening Balances Seeding (GAAP Compliance Verification)',
    lines: [
      { account_id: '10100', debit: 45000, credit: 0 },
      { account_id: '10200', debit: 207800, credit: 0 },
      { account_id: '10300', debit: 35200, credit: 0 },
      { account_id: '10400', debit: 35000, credit: 0 },
      { account_id: '20100', debit: 0, credit: 15000 },
      { account_id: '30100', debit: 0, credit: 308000 }
    ],
    is_system: true
  },
  {
    id: 'JE-2026-001',
    date: '2026-02-10',
    reference: 'INV-2026-001',
    description: 'Accrued AR / License Revenue - مؤسسة الشايع التجارية',
    lines: [
      { account_id: '10300', debit: 51300, credit: 0 },
      { account_id: '40100', debit: 0, credit: 43000 },
      { account_id: '20200', debit: 0, credit: 8300 }
    ],
    is_system: true
  },
  {
    id: 'JE-2026-002',
    date: '2026-02-12',
    reference: 'INV-2026-002',
    description: 'Accrued AR / Consulting Revenue - أ. عبد الرحمن المطيري',
    lines: [
      { account_id: '10300', debit: 22800, credit: 0 },
      { account_id: '40200', debit: 0, credit: 22000 },
      { account_id: '20200', debit: 0, credit: 800 }
    ],
    is_system: true
  },
  {
    id: 'JE-2026-003',
    date: '2026-02-15',
    reference: 'BILL-2026-001',
    description: 'Accrued rent expense - Branch Office Rent',
    lines: [
      { account_id: '50200', debit: 10000, credit: 0 },
      { account_id: '20100', debit: 0, credit: 10000 }
    ],
    is_system: true
  },
  {
    id: 'JE-2026-004',
    date: '2026-02-16',
    reference: 'BILL-2026-002',
    description: 'Accrued marketing expense - Express Printing Store',
    lines: [
      { account_id: '50300', debit: 8000, credit: 0 },
      { account_id: '20100', debit: 0, credit: 8000 }
    ],
    is_system: true
  }
];

export const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-001',
    customer_name: 'مؤسسة الشايع التجارية',
    customer_id: 'c1',
    date: '2026-02-10',
    due_date: '2026-03-10',
    items: [
      { product_id: 'p1', product_name: 'ERP SaaS Enterprise Deployment (15 Seats)', quantity: 1, price: 43000, vat_rate: 15, discount_rate: 0 }
    ],
    subtotal: 43000,
    vat_amount: 8300,
    discount_amount: 0,
    total_amount: 51300,
    status: 'paid',
    reminder_sent: false,
    payment_method: 'تحويل بنكي'
  },
  {
    id: 'INV-2026-002',
    customer_name: 'أ. عبد الرحمن المطيري',
    customer_id: 'c2',
    date: '2026-02-12',
    due_date: '2026-03-12',
    items: [
      { product_id: 'p2', product_name: 'Business Strategy Consulting & Setup Service', quantity: 1, price: 22000, vat_rate: 15, discount_rate: 0 }
    ],
    subtotal: 22000,
    vat_amount: 800,
    discount_amount: 0,
    total_amount: 22800,
    status: 'paid',
    reminder_sent: false,
    payment_method: 'فيزا / كارت'
  },
  {
    id: 'INV-2026-003',
    customer_name: 'شركة النجوم للتجارة',
    customer_id: 'c3',
    date: '2026-02-20',
    due_date: '2026-03-20',
    items: [
      { product_id: 'p3', product_name: 'SaaS Integration Consult H1 2026', quantity: 1, price: 34695, vat_rate: 15, discount_rate: 0 }
    ],
    subtotal: 34695,
    vat_amount: 5205,
    discount_amount: 0,
    total_amount: 39900,
    status: 'draft',
    reminder_sent: false,
    payment_method: 'كاش'
  }
];

export const DEFAULT_BILLS: Bill[] = [
  {
    id: 'BILL-2026-001',
    supplier_name: 'United Real Estate Dev Co.',
    account_id: '50200',
    date: '2026-02-15',
    due_date: '2026-03-15',
    description: 'Cairo HQ Rent H1 2026',
    amount: 10000,
    vat_rate: 0,
    vat_amount: 0,
    total_amount: 10000,
    status: 'unpaid'
  },
  {
    id: 'BILL-2026-002',
    supplier_name: 'Express Digital Marketing',
    account_id: '50300',
    date: '2026-02-16',
    due_date: '2026-03-16',
    description: 'Digital Ads Placement Fee',
    amount: 8000,
    vat_rate: 0,
    vat_amount: 0,
    total_amount: 8000,
    status: 'paid'
  }
];

export const DEFAULT_BANK_STATEMENTS: BankStatement[] = [
  { id: 'TXN-001', date: '2026-02-11', description: 'Wire deposit from smart Al-Shaya - CRM contract INV-001', amount: 51300, reconciled: false },
  { id: 'TXN-002', date: '2026-02-13', description: 'POS Card Settlement from Al-Mutairi - INV-002', amount: 22800, reconciled: false },
  { id: 'TXN-003', date: '2026-02-18', description: 'Monthly branch utilities clearance', amount: -2450, reconciled: false }
];

export const DEFAULT_EMPLOYEES: EmployeeSalary[] = [
  { id: 'EMP-001', name_en: 'Youssef Mansour', name_ar: 'يوسف منصور', role: 'Sales Account Manager', base_salary: 25000, commission_rate: 0.10, paid_status: 'unpaid' },
  { id: 'EMP-002', name_en: 'Sara El-Shorbagy', name_ar: 'سارة الشوربجي', role: 'Senior Consultant', base_salary: 35000, commission_rate: 0.05, paid_status: 'unpaid' },
  { id: 'EMP-003', name_en: 'Ahmed Al-Badri', name_ar: 'أحمد البدري', role: 'Solutions Engineer', base_salary: 30000, commission_rate: 0.00, paid_status: 'unpaid' },
  { id: 'EMP-004', name_en: 'Mai Abdel-Hadi', name_ar: 'مي عبد الهادي', role: 'HQ Accountant', base_salary: 30000, commission_rate: 0.00, paid_status: 'unpaid' }
];
