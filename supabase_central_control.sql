-- Centralized Management Schema
-- 1. Audit Logs (Unified tracking for all modules)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
    module TEXT NOT NULL, -- 'CRM', 'SOP', 'RACI', etc.
    record_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modules Status (Already exists, but adding links to roles if needed)
-- Assuming admin_modules Table: [id, name, is_active, order_index]

-- 3. RBAC Enhancements
-- Ensuring roles can be linked to specific actions
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES admin_roles(id);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES admin_departments(id);

-- 4. Cross-Module Foreign Keys
ALTER TABLE sops ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES admin_departments(id);
ALTER TABLE sops ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES admin_users(id);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES admin_users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES admin_departments(id);

-- 5. Accounting Module Tables (Unified Schema with May 2026 Supabase Update Grants)
CREATE TABLE IF NOT EXISTS public.acct_coa (
    id TEXT NOT NULL,
    company_id INTEGER,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    parent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (company_id, id)
);

CREATE TABLE IF NOT EXISTS public.acct_banks_wallets (
    id TEXT NOT NULL,
    company_id INTEGER,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    type TEXT NOT NULL,
    currency TEXT DEFAULT 'SAR',
    account_number TEXT,
    iban TEXT,
    bank_name TEXT,
    balance REAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (company_id, id)
);

CREATE TABLE IF NOT EXISTS public.acct_journal_entries (
    id TEXT NOT NULL,
    company_id INTEGER,
    date DATE NOT NULL,
    reference TEXT,
    description TEXT,
    lines JSONB DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (company_id, id)
);

CREATE TABLE IF NOT EXISTS public.acct_invoices (
    id TEXT NOT NULL,
    company_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_id TEXT,
    deal_id TEXT,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    items JSONB DEFAULT '[]',
    subtotal REAL DEFAULT 0,
    vat_amount REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    reminder_sent BOOLEAN DEFAULT FALSE,
    currency TEXT DEFAULT 'SAR',
    exchange_rate REAL DEFAULT 1,
    vat_number TEXT,
    po_number TEXT,
    payment_terms TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (company_id, id)
);

CREATE TABLE IF NOT EXISTS public.acct_bills (
    id TEXT NOT NULL,
    company_id INTEGER,
    supplier_name TEXT NOT NULL,
    account_id TEXT NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    description TEXT,
    amount REAL DEFAULT 0,
    vat_rate REAL DEFAULT 15,
    vat_amount REAL DEFAULT 0,
    total_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'unpaid',
    is_copq BOOLEAN DEFAULT FALSE,
    ncr_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (company_id, id)
);

CREATE TABLE IF NOT EXISTS public.acct_bank_statements (
    id TEXT NOT NULL,
    company_id INTEGER,
    date DATE NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    reconciled BOOLEAN DEFAULT FALSE,
    matched_journal_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (company_id, id)
);

CREATE TABLE IF NOT EXISTS public.acct_report_notes (
    company_id INTEGER,
    period TEXT NOT NULL,
    notes JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (company_id, period)
);

-- EXPLICIT GRANTS (CRITICAL: Do this before RLS policies to prevent Error 42501 as of May 2026 update)
GRANT ALL ON TABLE public.acct_coa TO postgres;
GRANT ALL ON TABLE public.acct_coa TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_coa TO authenticated;

GRANT ALL ON TABLE public.acct_banks_wallets TO postgres;
GRANT ALL ON TABLE public.acct_banks_wallets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_banks_wallets TO authenticated;

GRANT ALL ON TABLE public.acct_journal_entries TO postgres;
GRANT ALL ON TABLE public.acct_journal_entries TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_journal_entries TO authenticated;

GRANT ALL ON TABLE public.acct_invoices TO postgres;
GRANT ALL ON TABLE public.acct_invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_invoices TO authenticated;

GRANT ALL ON TABLE public.acct_bills TO postgres;
GRANT ALL ON TABLE public.acct_bills TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_bills TO authenticated;

GRANT ALL ON TABLE public.acct_bank_statements TO postgres;
GRANT ALL ON TABLE public.acct_bank_statements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_bank_statements TO authenticated;

GRANT ALL ON TABLE public.acct_report_notes TO postgres;
GRANT ALL ON TABLE public.acct_report_notes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_report_notes TO authenticated;

