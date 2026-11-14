export interface CoAAccount {
  id: string; // e.g. "10100"
  name_en: string;
  name_ar?: string;
  type: 'assets' | 'liabilities' | 'equity' | 'revenue' | 'expenses';
  is_active: boolean;
  parent_id?: string;
}

export interface BankOrWallet {
  id: string;
  name_en: string;
  name_ar?: string;
  type: string;
  currency: string;
  account_number?: string;
  iban?: string;
  bank_name?: string;
  balance: number;
}

export interface JournalLine {
  account_id: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  lines: JournalLine[];
  is_system: boolean;
}

export interface InvoiceItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  vat_rate: number; // e.g. 15 for 15%
  discount_rate: number; // e.g. 10 for 10%
}

export interface Invoice {
  id: string; 
  customer_name: string;
  customer_id?: string;
  deal_id?: string;
  date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  vat_amount: number;
  discount_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  reminder_sent?: boolean;
  currency?: string;
  exchange_rate?: number;
  vat_number?: string;
  po_number?: string;
  payment_terms?: string;
  notes?: string;
  payment_method?: string; // Optional field for payment route description
}

export interface Bill {
  id: string; 
  supplier_name: string;
  account_id: string; // expense account
  date: string;
  due_date: string;
  description: string;
  amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  status: 'unpaid' | 'paid';
  is_copq?: boolean; // Cost of Poor Quality
  ncr_id?: number; // connected NCR id
}

export interface BankStatement {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = deposit, negative = withdrawal
  reconciled: boolean;
  matched_journal_id?: string;
}

export interface EmployeeSalary {
  id: string;
  name_en: string;
  name_ar: string;
  role: string;
  base_salary: number;
  commission_rate: number; // percentage of deals, e.g. 0.10
  paid_status: 'unpaid' | 'paid';
  payout_date?: string;
}
