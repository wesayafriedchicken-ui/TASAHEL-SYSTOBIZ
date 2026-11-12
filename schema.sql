-- ================================================================================
-- UNIFIED DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- THE BUSINESS CORE ARCHITECTURE
-- Standardized Table Structures, Primary Keys, Foreign Keys, Unique Constraints, Grants & RLS
-- ================================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================================
-- SECTION 1: CORE BASELINE & MULTI-TENANCY
-- ================================================================================

-- 1. Companies Table (Multi-tenancy anchor)
CREATE TABLE IF NOT EXISTS public.companies (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    subdomain TEXT UNIQUE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.companies TO postgres;
GRANT ALL ON TABLE public.companies TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.companies TO authenticated;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_company_name_unique UNIQUE(company_id, name)
);

GRANT ALL ON TABLE public.roles TO postgres;
GRANT ALL ON TABLE public.roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.roles TO authenticated;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    department_head_id INTEGER,
    is_executive BOOLEAN DEFAULT false,
    teams JSONB DEFAULT '[]'::jsonb,
    job_titles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT departments_company_name_unique UNIQUE(company_id, name)
);

GRANT ALL ON TABLE public.departments TO postgres;
GRANT ALL ON TABLE public.departments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.departments TO authenticated;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- 4. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username VARCHAR(255),
    password TEXT NOT NULL,
    role_id INTEGER REFERENCES public.roles(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    team_name TEXT,
    job_title TEXT,
    reporting_to INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    is_super_admin BOOLEAN DEFAULT FALSE,
    has_portal_access BOOLEAN DEFAULT TRUE,
    training_points INTEGER DEFAULT 0,
    avatar_url TEXT,
    permissions JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.users TO postgres;
GRANT ALL ON TABLE public.users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Foreign key link for department head after users table exists
ALTER TABLE public.departments 
ADD CONSTRAINT fk_departments_head 
FOREIGN KEY (department_head_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 5. System Modules Table
CREATE TABLE IF NOT EXISTS public.system_modules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.system_modules TO postgres;
GRANT ALL ON TABLE public.system_modules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.system_modules TO authenticated;
ALTER TABLE public.system_modules ENABLE ROW LEVEL SECURITY;

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.audit_logs TO postgres;
GRANT ALL ON TABLE public.audit_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO authenticated;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.notifications TO postgres;
GRANT ALL ON TABLE public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications TO authenticated;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- SECTION 2: HR & EMPLOYEE MANAGEMENT MODULE
-- ================================================================================

-- 8. HR Employees Table
CREATE TABLE IF NOT EXISTS public.hr_employees (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id TEXT,
    id_number TEXT,
    phone TEXT,
    salary_base REAL DEFAULT 0,
    allowances REAL DEFAULT 0,
    contract_type TEXT DEFAULT 'Full-time',
    contract_start_date DATE,
    contract_end_date DATE,
    vacation_balance REAL DEFAULT 21,
    sick_leave_balance REAL DEFAULT 7,
    bereavement_used REAL DEFAULT 0,
    documents JSONB DEFAULT '[]'::jsonb,
    penalty_history JSONB DEFAULT '[]'::jsonb,
    job_informations JSONB DEFAULT '[]'::jsonb,
    compensations JSONB DEFAULT '[]'::jsonb,
    bonuses_list JSONB DEFAULT '[]'::jsonb,
    commissions_list JSONB DEFAULT '[]'::jsonb,
    equities_list JSONB DEFAULT '[]'::jsonb,
    shift_allowances_list JSONB DEFAULT '[]'::jsonb,
    potential_bonus JSONB DEFAULT '{}'::jsonb,
    employment_statuses JSONB DEFAULT '[]'::jsonb,
    attendance_method TEXT DEFAULT 'Login System',
    assigned_shift_id INTEGER,
    reporting_to INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    job_title TEXT,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    gender TEXT,
    nationality TEXT,
    marital_status TEXT,
    date_of_birth DATE,
    address TEXT,
    work_location TEXT,
    job_grade TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    assets_list JSONB DEFAULT '[]'::jsonb,
    benefits_info JSONB DEFAULT '{}'::jsonb,
    onboarding_tasks JSONB DEFAULT '[]'::jsonb,
    offboarding_tasks JSONB DEFAULT '[]'::jsonb,
    system_logins JSONB DEFAULT '[]'::jsonb,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    preferred_name TEXT,
    personal_email TEXT,
    work_email TEXT,
    mobile_phone TEXT,
    home_phone TEXT,
    street_1 TEXT,
    street_2 TEXT,
    city TEXT,
    county TEXT,
    country TEXT,
    postcode TEXT,
    national_id TEXT,
    passport_number TEXT,
    shirt_size TEXT,
    bank_name TEXT,
    account_number TEXT,
    iban TEXT,
    swift_code TEXT,
    bank_details_copy TEXT,
    emergency_contact_relation TEXT,
    emergency_contact_address TEXT,
    team_name TEXT,
    manager_name TEXT,
    potential_bonus_percent REAL DEFAULT 0,
    potential_bonus_amount REAL DEFAULT 0,
    kpi_amount REAL DEFAULT 0,
    kpi_frequency TEXT,
    kpi_payout_mechanism TEXT,
    kpi_payout_date DATE,
    trainings_list JSONB DEFAULT '[]'::jsonb,
    notes_list JSONB DEFAULT '[]'::jsonb,
    email TEXT,
    department TEXT,
    position TEXT,
    status TEXT DEFAULT 'Active',
    personal_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employees TO postgres;
GRANT ALL ON TABLE public.hr_employees TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employees TO authenticated;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;

-- 8.1. HR Employee Job History Table
CREATE TABLE IF NOT EXISTS public.hr_employee_job_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_title TEXT NOT NULL,
    department_name TEXT,
    team_name TEXT,
    reporting_to TEXT,
    location TEXT,
    effective_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_job_history TO postgres;
GRANT ALL ON TABLE public.hr_employee_job_history TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_job_history TO authenticated;
ALTER TABLE public.hr_employee_job_history ENABLE ROW LEVEL SECURITY;

-- 8.2. HR Employee Compensations Table
CREATE TABLE IF NOT EXISTS public.hr_employee_compensations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pay_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
    pay_frequency TEXT DEFAULT 'Monthly',
    currency TEXT DEFAULT 'EGP',
    effective_date DATE,
    change_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_compensations TO postgres;
GRANT ALL ON TABLE public.hr_employee_compensations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_compensations TO authenticated;
ALTER TABLE public.hr_employee_compensations ENABLE ROW LEVEL SECURITY;

-- 8.3. HR Employee Bonuses Table
CREATE TABLE IF NOT EXISTS public.hr_employee_bonuses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    bonus_type TEXT,
    amount NUMERIC(12, 2) DEFAULT 0,
    percent NUMERIC(5, 2) DEFAULT 0,
    frequency TEXT,
    payout_date DATE,
    status TEXT DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_bonuses TO postgres;
GRANT ALL ON TABLE public.hr_employee_bonuses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_bonuses TO authenticated;
ALTER TABLE public.hr_employee_bonuses ENABLE ROW LEVEL SECURITY;

-- 8.4. HR Employee Commissions Table
CREATE TABLE IF NOT EXISTS public.hr_employee_commissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    commission_rate NUMERIC(5, 2) DEFAULT 0,
    target_amount NUMERIC(12, 2) DEFAULT 0,
    payout_frequency TEXT,
    status TEXT DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_commissions TO postgres;
GRANT ALL ON TABLE public.hr_employee_commissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_commissions TO authenticated;
ALTER TABLE public.hr_employee_commissions ENABLE ROW LEVEL SECURITY;

-- 8.5. HR Employee Equities Table
CREATE TABLE IF NOT EXISTS public.hr_employee_equities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    equity_type TEXT NOT NULL,
    total_units NUMERIC(12, 2) DEFAULT 0,
    vesting_schedule TEXT,
    grant_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_equities TO postgres;
GRANT ALL ON TABLE public.hr_employee_equities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_equities TO authenticated;
ALTER TABLE public.hr_employee_equities ENABLE ROW LEVEL SECURITY;

-- 8.6. HR Employee Shift Allowances Table
CREATE TABLE IF NOT EXISTS public.hr_employee_shift_allowances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    allowance_type TEXT NOT NULL,
    rate NUMERIC(12, 2) DEFAULT 0,
    frequency TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_shift_allowances TO postgres;
GRANT ALL ON TABLE public.hr_employee_shift_allowances TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_shift_allowances TO authenticated;
ALTER TABLE public.hr_employee_shift_allowances ENABLE ROW LEVEL SECURITY;

-- 8.7. HR Employee Employment Statuses History Table
CREATE TABLE IF NOT EXISTS public.hr_employee_employment_statuses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    effective_date DATE,
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_employment_statuses TO postgres;
GRANT ALL ON TABLE public.hr_employee_employment_statuses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_employment_statuses TO authenticated;
ALTER TABLE public.hr_employee_employment_statuses ENABLE ROW LEVEL SECURITY;

-- 8.8. HR Employee Penalties Table
CREATE TABLE IF NOT EXISTS public.hr_employee_penalties (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    penalty_type TEXT NOT NULL,
    reason TEXT,
    amount NUMERIC(12, 2) DEFAULT 0,
    date_issued DATE,
    status TEXT DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_penalties TO postgres;
GRANT ALL ON TABLE public.hr_employee_penalties TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_penalties TO authenticated;
ALTER TABLE public.hr_employee_penalties ENABLE ROW LEVEL SECURITY;

-- 8.9. HR Employee Assets Table
CREATE TABLE IF NOT EXISTS public.hr_employee_assets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT,
    description TEXT,
    serial_number TEXT,
    date_loaned DATE,
    date_returned DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_assets TO postgres;
GRANT ALL ON TABLE public.hr_employee_assets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_assets TO authenticated;
ALTER TABLE public.hr_employee_assets ENABLE ROW LEVEL SECURITY;

-- 8.10. HR Employee Dependents Table
CREATE TABLE IF NOT EXISTS public.hr_employee_dependents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relationship TEXT,
    dob DATE,
    gender TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_dependents TO postgres;
GRANT ALL ON TABLE public.hr_employee_dependents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_dependents TO authenticated;
ALTER TABLE public.hr_employee_dependents ENABLE ROW LEVEL SECURITY;

-- 8.11. HR Employee Benefit History Table
CREATE TABLE IF NOT EXISTS public.hr_employee_benefit_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    benefit_name TEXT NOT NULL,
    change_type TEXT,
    effective_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_benefit_history TO postgres;
GRANT ALL ON TABLE public.hr_employee_benefit_history TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_benefit_history TO authenticated;
ALTER TABLE public.hr_employee_benefit_history ENABLE ROW LEVEL SECURITY;

-- 8.12. HR Employee Onboarding Tasks Table
CREATE TABLE IF NOT EXISTS public.hr_employee_onboarding_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT,
    title TEXT NOT NULL,
    assignee TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_by TEXT,
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_onboarding_tasks TO postgres;
GRANT ALL ON TABLE public.hr_employee_onboarding_tasks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_onboarding_tasks TO authenticated;
ALTER TABLE public.hr_employee_onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- 8.13. HR Employee Offboarding Tasks Table
CREATE TABLE IF NOT EXISTS public.hr_employee_offboarding_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT,
    title TEXT NOT NULL,
    assignee TEXT,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_by TEXT,
    completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_offboarding_tasks TO postgres;
GRANT ALL ON TABLE public.hr_employee_offboarding_tasks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_offboarding_tasks TO authenticated;
ALTER TABLE public.hr_employee_offboarding_tasks ENABLE ROW LEVEL SECURITY;

-- 8.14. HR Employee Trainings Table
CREATE TABLE IF NOT EXISTS public.hr_employee_trainings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_name TEXT NOT NULL,
    provider TEXT,
    completion_date DATE,
    certificate_url TEXT,
    expiry_date DATE,
    score NUMERIC(5, 2),
    status TEXT DEFAULT 'Completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_trainings TO postgres;
GRANT ALL ON TABLE public.hr_employee_trainings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_trainings TO authenticated;
ALTER TABLE public.hr_employee_trainings ENABLE ROW LEVEL SECURITY;

-- 8.15. HR Employee Documents Table
CREATE TABLE IF NOT EXISTS public.hr_employee_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_url TEXT,
    expiry_date DATE,
    status TEXT DEFAULT 'Active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_documents TO postgres;
GRANT ALL ON TABLE public.hr_employee_documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_documents TO authenticated;
ALTER TABLE public.hr_employee_documents ENABLE ROW LEVEL SECURITY;

-- 8.16. HR Employee System Logins Table
CREATE TABLE IF NOT EXISTS public.hr_employee_system_logins (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    system_name TEXT NOT NULL,
    username TEXT,
    role TEXT,
    access_level TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_system_logins TO postgres;
GRANT ALL ON TABLE public.hr_employee_system_logins TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_system_logins TO authenticated;
ALTER TABLE public.hr_employee_system_logins ENABLE ROW LEVEL SECURITY;

-- 8.17. HR Employee Notes Table
CREATE TABLE IF NOT EXISTS public.hr_employee_notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    author_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    author_name TEXT,
    title TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_employee_notes TO postgres;
GRANT ALL ON TABLE public.hr_employee_notes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_employee_notes TO authenticated;
ALTER TABLE public.hr_employee_notes ENABLE ROW LEVEL SECURITY;

-- 9. HR Shifts Table
CREATE TABLE IF NOT EXISTS public.hr_shifts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Fixed',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_mins INTEGER DEFAULT 15,
    required_hours NUMERIC(10,2) DEFAULT 8.00,
    color TEXT DEFAULT '#3b82f6',
    attendance_method TEXT DEFAULT 'Login System',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_shifts TO postgres;
GRANT ALL ON TABLE public.hr_shifts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_shifts TO authenticated;
ALTER TABLE public.hr_shifts ENABLE ROW LEVEL SECURITY;

-- 10. HR Shift Assignments Table
CREATE TABLE IF NOT EXISTS public.hr_shift_assignments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    shift_id INTEGER REFERENCES public.hr_shifts(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 0-6 (Sunday to Saturday)
    start_date TEXT,
    end_date TEXT,
    recurrence TEXT DEFAULT 'weekly',
    notification_sent BOOLEAN DEFAULT false,
    employee_visibility TEXT DEFAULT 'published_all',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.hr_shift_assignments ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE public.hr_shift_assignments ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE public.hr_shift_assignments ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'weekly';
ALTER TABLE public.hr_shift_assignments ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;
ALTER TABLE public.hr_shift_assignments ADD COLUMN IF NOT EXISTS employee_visibility TEXT DEFAULT 'published_all';
ALTER TABLE public.hr_shift_assignments ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

GRANT ALL ON TABLE public.hr_shift_assignments TO postgres;
GRANT ALL ON TABLE public.hr_shift_assignments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_shift_assignments TO authenticated;
ALTER TABLE public.hr_shift_assignments ENABLE ROW LEVEL SECURITY;

-- 11. HR Shift Swaps Table
CREATE TABLE IF NOT EXISTS public.hr_shift_swaps (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    requester_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    counterpart_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    swap_date DATE NOT NULL,
    requester_shift_id INTEGER REFERENCES public.hr_shifts(id) ON DELETE SET NULL,
    counterpart_shift_id INTEGER REFERENCES public.hr_shifts(id) ON DELETE SET NULL,
    reason TEXT,
    manager_status TEXT DEFAULT 'Pending',
    manager_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    manager_comment TEXT,
    manager_action_at TIMESTAMP WITH TIME ZONE,
    attendance_status TEXT DEFAULT 'Pending',
    attendance_admin_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    attendance_comment TEXT,
    attendance_action_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Pending Manager',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_shift_swaps TO postgres;
GRANT ALL ON TABLE public.hr_shift_swaps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_shift_swaps TO authenticated;
ALTER TABLE public.hr_shift_swaps ENABLE ROW LEVEL SECURITY;

-- 12. HR Attendance Table
CREATE TABLE IF NOT EXISTS public.hr_attendance (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    employee_id TEXT,
    date DATE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Present',
    shift_name TEXT,
    late_minutes INTEGER DEFAULT 0,
    worked_hours NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_attendance_user_date_unique UNIQUE (user_id, date)
);

ALTER TABLE public.hr_attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

GRANT ALL ON TABLE public.hr_attendance TO postgres;
GRANT ALL ON TABLE public.hr_attendance TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_attendance TO authenticated;
ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;

-- 13. HR Leave Requests Table
CREATE TABLE IF NOT EXISTS public.hr_leave_requests (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    employee_id INTEGER,
    type TEXT NOT NULL,
    leave_type TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'Pending',
    reason TEXT,
    approver_id INTEGER REFERENCES public.users(id),
    comments TEXT,
    attachment_url TEXT,
    attachment_name TEXT,
    manager_status TEXT DEFAULT 'Pending',
    manager_id INTEGER REFERENCES public.users(id),
    manager_comment TEXT,
    manager_action_at TIMESTAMP WITH TIME ZONE,
    attendance_status TEXT DEFAULT 'Pending',
    attendance_admin_id INTEGER REFERENCES public.users(id),
    attendance_comment TEXT,
    attendance_action_at TIMESTAMP WITH TIME ZONE,
    with_deduction BOOLEAN DEFAULT false,
    deduction_type TEXT DEFAULT 'none',
    deduction_days NUMERIC(4,1) DEFAULT 0,
    approved_period_scope TEXT DEFAULT 'full',
    approved_start_date DATE,
    approved_end_date DATE,
    approved_days NUMERIC(4,1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_leave_requests TO postgres;
GRANT ALL ON TABLE public.hr_leave_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_leave_requests TO authenticated;
ALTER TABLE public.hr_leave_requests ENABLE ROW LEVEL SECURITY;

-- 14. HR Payroll Table
CREATE TABLE IF NOT EXISTS public.hr_payroll (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    base_salary REAL NOT NULL,
    allowances REAL DEFAULT 0,
    deductions REAL DEFAULT 0,
    bonuses REAL DEFAULT 0,
    commissions REAL DEFAULT 0,
    total_gross NUMERIC DEFAULT 0,
    total_deductions NUMERIC DEFAULT 0,
    total_net REAL NOT NULL,
    breakdown JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_payroll_user_month_year_unique UNIQUE(user_id, month, year)
);

GRANT ALL ON TABLE public.hr_payroll TO postgres;
GRANT ALL ON TABLE public.hr_payroll TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_payroll TO authenticated;
ALTER TABLE public.hr_payroll ENABLE ROW LEVEL SECURITY;

-- 15. HR Performance Reviews Table
CREATE TABLE IF NOT EXISTS public.hr_performance_reviews (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    period TEXT NOT NULL,
    score REAL DEFAULT 0,
    productivity_rate REAL DEFAULT 0,
    strengths TEXT,
    areas_for_improvement TEXT,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_performance_reviews TO postgres;
GRANT ALL ON TABLE public.hr_performance_reviews TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_performance_reviews TO authenticated;
ALTER TABLE public.hr_performance_reviews ENABLE ROW LEVEL SECURITY;

-- 15b. HR Performance Frameworks Table
CREATE TABLE IF NOT EXISTS public.hr_performance_frameworks (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    default_weights JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_performance_frameworks_code_unique UNIQUE(company_id, code)
);

GRANT ALL ON TABLE public.hr_performance_frameworks TO postgres;
GRANT ALL ON TABLE public.hr_performance_frameworks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_performance_frameworks TO authenticated;
ALTER TABLE public.hr_performance_frameworks ENABLE ROW LEVEL SECURITY;

-- 15c. HR Performance Settings & Evaluation Rules Table
CREATE TABLE IF NOT EXISTS public.hr_performance_settings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE CASCADE,
    team_name TEXT,
    job_title TEXT,
    framework_code TEXT NOT NULL DEFAULT 'hybrid',
    evaluation_weights JSONB DEFAULT '{"manager": 40, "peers": 20, "subordinates": 10, "self": 10, "okrs": 20}'::jsonb,
    cycle_frequency TEXT NOT NULL DEFAULT 'Quarterly',
    enable_self_appraisal BOOLEAN DEFAULT TRUE,
    approval_workflow JSONB DEFAULT '["Direct Manager", "Department Head", "HR"]'::jsonb,
    competencies JSONB DEFAULT '["Leadership & Initiative", "Communication & Impact", "Teamwork & Collaboration", "Problem Solving & Innovation"]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_performance_settings TO postgres;
GRANT ALL ON TABLE public.hr_performance_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_performance_settings TO authenticated;
ALTER TABLE public.hr_performance_settings ENABLE ROW LEVEL SECURITY;


-- 15d. HR Performance Evaluations Table
CREATE TABLE IF NOT EXISTS public.hr_performance_evaluations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    employee_id INTEGER,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    evaluation_period TEXT,
    overall_rating NUMERIC,
    status TEXT DEFAULT 'Completed',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_performance_evaluations TO postgres;
GRANT ALL ON TABLE public.hr_performance_evaluations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_performance_evaluations TO authenticated;
ALTER TABLE public.hr_performance_evaluations ENABLE ROW LEVEL SECURITY;

-- 15e. HR Organizational Structure Settings
CREATE TABLE IF NOT EXISTS public.hr_org_structure_settings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER UNIQUE DEFAULT 1,
    industry_preset TEXT DEFAULT 'corporate',
    job_grades JSONB DEFAULT '[]'::jsonb,
    department_settings JSONB DEFAULT '{}'::jsonb,
    jd_templates JSONB DEFAULT '[]'::jsonb,
    custom_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_org_structure_settings TO postgres;
GRANT ALL ON TABLE public.hr_org_structure_settings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_org_structure_settings TO authenticated;
ALTER TABLE public.hr_org_structure_settings ENABLE ROW LEVEL SECURITY;

-- 15f. HR Action Controls Table
CREATE TABLE IF NOT EXISTS public.hr_action_controls (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    action_key TEXT NOT NULL,
    tab_id TEXT NOT NULL,
    section_name TEXT NOT NULL,
    label_en TEXT NOT NULL,
    label_ar TEXT,
    state TEXT NOT NULL DEFAULT 'active',
    permission_scope TEXT NOT NULL DEFAULT 'everyone',
    tooltip_text TEXT DEFAULT 'You are not authorized to perform this action',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_action_controls_unique_key UNIQUE (company_id, action_key)
);

GRANT ALL ON TABLE public.hr_action_controls TO postgres;
GRANT ALL ON TABLE public.hr_action_controls TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_action_controls TO authenticated;
ALTER TABLE public.hr_action_controls ENABLE ROW LEVEL SECURITY;

-- 15g. Company Schema Customizations Table
CREATE TABLE IF NOT EXISTS public.company_schema_customizations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER DEFAULT 1,
    module_name TEXT NOT NULL DEFAULT 'hr',
    page_key TEXT NOT NULL,
    schema_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_schema_customizations_unique UNIQUE (company_id, module_name, page_key)
);

GRANT ALL ON TABLE public.company_schema_customizations TO postgres;
GRANT ALL ON TABLE public.company_schema_customizations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_schema_customizations TO authenticated;
ALTER TABLE public.company_schema_customizations ENABLE ROW LEVEL SECURITY;

-- 16. HR Complaints Table
CREATE TABLE IF NOT EXISTS public.hr_complaints (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    admin_notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_complaints TO postgres;
GRANT ALL ON TABLE public.hr_complaints TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_complaints TO authenticated;
ALTER TABLE public.hr_complaints ENABLE ROW LEVEL SECURITY;

-- 17. HR Payroll Config Table
CREATE TABLE IF NOT EXISTS public.hr_payroll_config (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
    start_day INTEGER DEFAULT 1,
    late_deduction_per_hour REAL DEFAULT 0,
    absence_penalty_multiplier REAL DEFAULT 1.0,
    early_departure_deduction REAL DEFAULT 0,
    disciplinary_rules JSONB DEFAULT '[]'::jsonb,
    insurance_benefits JSONB DEFAULT '{}'::jsonb,
    tax_brackets JSONB DEFAULT '[]'::jsonb,
    tardy_deduction_rules JSONB DEFAULT '{}'::jsonb,
    leave_policy_defaults JSONB DEFAULT '{}'::jsonb,
    custom_rules JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_payroll_config TO postgres;
GRANT ALL ON TABLE public.hr_payroll_config TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_payroll_config TO authenticated;
ALTER TABLE public.hr_payroll_config ENABLE ROW LEVEL SECURITY;

-- 18. HR Custom Fields Engine
CREATE TABLE IF NOT EXISTS public.hr_custom_fields (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_label_ar TEXT NOT NULL,
    field_label_en TEXT NOT NULL,
    field_type TEXT NOT NULL,
    is_required BOOLEAN DEFAULT false,
    options TEXT,
    relation_target_table TEXT,
    relation_display_column TEXT,
    order_index INTEGER DEFAULT 0,
    allow_search BOOLEAN DEFAULT false,
    add_to_filter BOOLEAN DEFAULT false,
    hidden BOOLEAN DEFAULT false,
    bold BOOLEAN DEFAULT false,
    allow_in_quick_entry BOOLEAN DEFAULT false,
    translatable BOOLEAN DEFAULT false,
    print_hide BOOLEAN DEFAULT false,
    report_hide BOOLEAN DEFAULT false,
    in_list_view BOOLEAN DEFAULT false,
    in_list_filter BOOLEAN DEFAULT false,
    in_preview BOOLEAN DEFAULT false,
    sticky BOOLEAN DEFAULT false,
    in_filter BOOLEAN DEFAULT false,
    in_global_search BOOLEAN DEFAULT false,
    read_only BOOLEAN DEFAULT false,
    allow_on_submit BOOLEAN DEFAULT false,
    perm_level INTEGER DEFAULT 0,
    ignore_xss_filter BOOLEAN DEFAULT false,
    own_only BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_custom_fields TO postgres;
GRANT ALL ON TABLE public.hr_custom_fields TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_custom_fields TO authenticated;
ALTER TABLE public.hr_custom_fields ENABLE ROW LEVEL SECURITY;

-- 19. HR Custom Field Values Table
CREATE TABLE IF NOT EXISTS public.hr_custom_field_values (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    field_id INTEGER REFERENCES public.hr_custom_fields(id) ON DELETE CASCADE,
    entity_id INTEGER NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_custom_field_values_unique_entity_field UNIQUE (field_id, entity_id)
);

GRANT ALL ON TABLE public.hr_custom_field_values TO postgres;
GRANT ALL ON TABLE public.hr_custom_field_values TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_custom_field_values TO authenticated;
ALTER TABLE public.hr_custom_field_values ENABLE ROW LEVEL SECURITY;

-- 20. HR Pipelines / Custom Statuses Engine
CREATE TABLE IF NOT EXISTS public.hr_pipelines (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    order_index INTEGER DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    has_popup BOOLEAN DEFAULT false,
    popup_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_pipelines TO postgres;
GRANT ALL ON TABLE public.hr_pipelines TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_pipelines TO authenticated;
ALTER TABLE public.hr_pipelines ENABLE ROW LEVEL SECURITY;

-- 20.1. HR Announcements Table
CREATE TABLE IF NOT EXISTS public.hr_announcements (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE DEFAULT 1,
    author_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Announcement',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_announcements TO postgres;
GRANT ALL ON TABLE public.hr_announcements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_announcements TO authenticated;
ALTER TABLE public.hr_announcements ENABLE ROW LEVEL SECURITY;

-- 20.2. HR Recognitions Table
CREATE TABLE IF NOT EXISTS public.hr_recognitions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE DEFAULT 1,
    sender_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    recipient_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    points INTEGER DEFAULT 25,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_recognitions TO postgres;
GRANT ALL ON TABLE public.hr_recognitions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_recognitions TO authenticated;
ALTER TABLE public.hr_recognitions ENABLE ROW LEVEL SECURITY;

-- 20.3. Job Descriptions Table
CREATE TABLE IF NOT EXISTS public.job_descriptions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE DEFAULT 1,
    title TEXT NOT NULL,
    department TEXT,
    team TEXT,
    grade TEXT,
    salary_band TEXT,
    reports_to TEXT,
    employment_type TEXT,
    location TEXT,
    status TEXT DEFAULT 'Active',
    objective TEXT,
    responsibilities TEXT,
    education TEXT,
    technical_skills TEXT,
    soft_skills TEXT,
    certifications TEXT,
    kpis TEXT,
    raci_role TEXT,
    jd_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.job_descriptions TO postgres;
GRANT ALL ON TABLE public.job_descriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_descriptions TO authenticated;
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;

-- 20.4. Work Teams Table
CREATE TABLE IF NOT EXISTS public.work_teams (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE DEFAULT 1,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    department TEXT,
    name TEXT NOT NULL,
    lead TEXT,
    members_count INTEGER DEFAULT 0,
    description TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.work_teams TO postgres;
GRANT ALL ON TABLE public.work_teams TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.work_teams TO authenticated;
ALTER TABLE public.work_teams ENABLE ROW LEVEL SECURITY;

-- 20.5. Job Titles Table
CREATE TABLE IF NOT EXISTS public.job_titles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE DEFAULT 1,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    department TEXT,
    title TEXT NOT NULL,
    grade TEXT,
    salary_band TEXT,
    open_positions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.job_titles TO postgres;
GRANT ALL ON TABLE public.job_titles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.job_titles TO authenticated;
ALTER TABLE public.job_titles ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- SECTION 3: PROCESS, SOP, TASK & WORKFLOW MANAGEMENT
-- ================================================================================

-- 21. Standard Operating Procedures (SOPs) Table
CREATE TABLE IF NOT EXISTS public.sops (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    process_type TEXT,
    owner_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    approver_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    objective TEXT,
    scope TEXT,
    roles_responsibilities TEXT,
    required_documentation TEXT,
    reporting_line TEXT,
    tools_channels_used TEXT,
    kpis TEXT,
    flowchart_data TEXT,
    tags TEXT,
    parent_id INTEGER REFERENCES public.sops(id) ON DELETE SET NULL,
    review_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Draft',
    version_number TEXT DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.sops TO postgres;
GRANT ALL ON TABLE public.sops TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sops TO authenticated;
ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;

-- 22. SOP Steps Table
CREATE TABLE IF NOT EXISTS public.sop_steps (
    id SERIAL PRIMARY KEY,
    sop_id INTEGER REFERENCES public.sops(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_description TEXT NOT NULL,
    expected_result TEXT,
    attachment_url TEXT,
    required_course_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.sop_steps TO postgres;
GRANT ALL ON TABLE public.sop_steps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sop_steps TO authenticated;
ALTER TABLE public.sop_steps ENABLE ROW LEVEL SECURITY;

-- 23. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_to INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    sop_step_id INTEGER REFERENCES public.sop_steps(id) ON DELETE SET NULL,
    deal_id INTEGER,
    module_id TEXT,
    related_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.tasks TO postgres;
GRANT ALL ON TABLE public.tasks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO authenticated;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 24. Task Checklists Table
CREATE TABLE IF NOT EXISTS public.task_checklists (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.task_checklists TO postgres;
GRANT ALL ON TABLE public.task_checklists TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.task_checklists TO authenticated;
ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;


-- 24.1. Task Comments Table
CREATE TABLE IF NOT EXISTS public.task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    user_name TEXT,
    comment TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.task_comments TO postgres;
GRANT ALL ON TABLE public.task_comments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.task_comments TO authenticated;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- 25. Process Maps Table
CREATE TABLE IF NOT EXISTS public.process_maps (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    sop_id INTEGER REFERENCES public.sops(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.process_maps TO postgres;
GRANT ALL ON TABLE public.process_maps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.process_maps TO authenticated;
ALTER TABLE public.process_maps ENABLE ROW LEVEL SECURITY;

-- 26. Process Nodes Table
CREATE TABLE IF NOT EXISTS public.process_nodes (
    id SERIAL PRIMARY KEY,
    map_id INTEGER REFERENCES public.process_maps(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    position_x REAL NOT NULL,
    position_y REAL NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.process_nodes TO postgres;
GRANT ALL ON TABLE public.process_nodes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.process_nodes TO authenticated;
ALTER TABLE public.process_nodes ENABLE ROW LEVEL SECURITY;

-- 27. Process Edges Table
CREATE TABLE IF NOT EXISTS public.process_edges (
    id SERIAL PRIMARY KEY,
    map_id INTEGER REFERENCES public.process_maps(id) ON DELETE CASCADE,
    source_node INTEGER REFERENCES public.process_nodes(id) ON DELETE CASCADE,
    target_node INTEGER REFERENCES public.process_nodes(id) ON DELETE CASCADE,
    source_handle TEXT,
    target_handle TEXT,
    label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.process_edges TO postgres;
GRANT ALL ON TABLE public.process_edges TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.process_edges TO authenticated;
ALTER TABLE public.process_edges ENABLE ROW LEVEL SECURITY;

-- 28. RACI Assignments Table
CREATE TABLE IF NOT EXISTS public.raci_assignments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    sop_id INTEGER REFERENCES public.sops(id) ON DELETE CASCADE,
    sop_step_id INTEGER REFERENCES public.sop_steps(id) ON DELETE CASCADE,
    role_type TEXT NOT NULL,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT one_accountable_per_entity CHECK (role_type != 'A' OR (sop_id IS NOT NULL OR sop_step_id IS NOT NULL))
);

GRANT ALL ON TABLE public.raci_assignments TO postgres;
GRANT ALL ON TABLE public.raci_assignments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.raci_assignments TO authenticated;
ALTER TABLE public.raci_assignments ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- SECTION 4: PRODUCTS, SERVICES, ORDERS & CRM
-- ================================================================================


-- 28.1. RACI Clarity Survey Table
CREATE TABLE IF NOT EXISTS public.raci_clarity_survey (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    user_name TEXT,
    score INTEGER NOT NULL,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.raci_clarity_survey TO postgres;
GRANT ALL ON TABLE public.raci_clarity_survey TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.raci_clarity_survey TO authenticated;
ALTER TABLE public.raci_clarity_survey ENABLE ROW LEVEL SECURITY;

-- 29. CRM Stages Table
CREATE TABLE IF NOT EXISTS public.crm_stages (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    color TEXT DEFAULT '#10b981',
    is_won BOOLEAN DEFAULT FALSE
);

GRANT ALL ON TABLE public.crm_stages TO postgres;
GRANT ALL ON TABLE public.crm_stages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_stages TO authenticated;
ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;

-- 30. CRM Customers Table
CREATE TABLE IF NOT EXISTS public.crm_customers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    source TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT crm_customers_email_unique UNIQUE(company_id, email),
    CONSTRAINT crm_customers_phone_unique UNIQUE(company_id, phone)
);

GRANT ALL ON TABLE public.crm_customers TO postgres;
GRANT ALL ON TABLE public.crm_customers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_customers TO authenticated;
ALTER TABLE public.crm_customers ENABLE ROW LEVEL SECURITY;

-- 31. CRM Leads Table
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    status TEXT DEFAULT 'new',
    phone TEXT,
    whatsapp TEXT,
    value REAL DEFAULT 0,
    items JSONB DEFAULT '[]'::jsonb,
    assigned_to INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT crm_leads_company_email_unique UNIQUE(company_id, email)
);

GRANT ALL ON TABLE public.crm_leads TO postgres;
GRANT ALL ON TABLE public.crm_leads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_leads TO authenticated;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- 32. CRM Deals Table
CREATE TABLE IF NOT EXISTS public.crm_deals (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES public.crm_customers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    value REAL DEFAULT 0,
    stage_id INTEGER REFERENCES public.crm_stages(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    service_type TEXT,
    product TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    history_logs JSONB DEFAULT '[]'::jsonb,
    reminders JSONB DEFAULT '[]'::jsonb,
    sop_id INTEGER REFERENCES public.sops(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.crm_deals TO postgres;
GRANT ALL ON TABLE public.crm_deals TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_deals TO authenticated;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;

-- Link task deal_id to crm_deals
ALTER TABLE public.tasks 
ADD CONSTRAINT fk_tasks_deal 
FOREIGN KEY (deal_id) REFERENCES public.crm_deals(id) ON DELETE SET NULL;

-- 33. CRM Interactions Table
CREATE TABLE IF NOT EXISTS public.crm_interactions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES public.crm_customers(id) ON DELETE CASCADE,
    deal_id INTEGER REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    content TEXT,
    sender_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    external_id TEXT,
    sentiment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.crm_interactions TO postgres;
GRANT ALL ON TABLE public.crm_interactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_interactions TO authenticated;
ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

-- 34. CRM Attachments Table
CREATE TABLE IF NOT EXISTS public.crm_attachments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES public.crm_customers(id) ON DELETE CASCADE,
    deal_id INTEGER REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    folder TEXT DEFAULT 'Employee Uploads',
    size TEXT,
    file_type TEXT,
    uploaded_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.crm_attachments TO postgres;
GRANT ALL ON TABLE public.crm_attachments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_attachments TO authenticated;
ALTER TABLE public.crm_attachments ENABLE ROW LEVEL SECURITY;

-- 35. CRM Assignment Rules Table
CREATE TABLE IF NOT EXISTS public.crm_assignment_rules (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    service_type TEXT,
    product TEXT,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE
);

GRANT ALL ON TABLE public.crm_assignment_rules TO postgres;
GRANT ALL ON TABLE public.crm_assignment_rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.crm_assignment_rules TO authenticated;
ALTER TABLE public.crm_assignment_rules ENABLE ROW LEVEL SECURITY;

-- 36. Products & Services Catalog Table
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    price REAL DEFAULT 0,
    cost REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    currency TEXT DEFAULT 'EGP',
    category TEXT,
    type TEXT DEFAULT 'product',
    status TEXT DEFAULT 'active',
    stock_qty INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    service_duration_hours REAL DEFAULT 0,
    sop_id INTEGER REFERENCES public.sops(id) ON DELETE SET NULL,
    process_mapping_id INTEGER REFERENCES public.process_maps(id) ON DELETE SET NULL,
    is_cost_variable BOOLEAN DEFAULT FALSE,
    is_price_variable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_company_name_unique UNIQUE(company_id, name)
);

GRANT ALL ON TABLE public.products TO postgres;
GRANT ALL ON TABLE public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 37. Price Lists Table
CREATE TABLE IF NOT EXISTS public.price_lists (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.price_lists TO postgres;
GRANT ALL ON TABLE public.price_lists TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.price_lists TO authenticated;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;

-- 38. Price List Items Table
CREATE TABLE IF NOT EXISTS public.price_list_items (
    id SERIAL PRIMARY KEY,
    price_list_id INTEGER REFERENCES public.price_lists(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    override_price REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT price_list_items_unique UNIQUE(price_list_id, product_id)
);

GRANT ALL ON TABLE public.price_list_items TO postgres;
GRANT ALL ON TABLE public.price_list_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.price_list_items TO authenticated;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;

-- 39. Promo Codes Table
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT DEFAULT 'percentage',
    discount_value REAL NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.promo_codes TO postgres;
GRANT ALL ON TABLE public.promo_codes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.promo_codes TO authenticated;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- 40. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    lead_id INTEGER REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    total_amount REAL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.orders TO postgres;
GRANT ALL ON TABLE public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO authenticated;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 41. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL,
    total_price REAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.order_items TO postgres;
GRANT ALL ON TABLE public.order_items TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_items TO authenticated;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 42. Work Orders Table
CREATE TABLE IF NOT EXISTS public.work_orders (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    deal_id INTEGER REFERENCES public.crm_deals(id) ON DELETE SET NULL,
    customer_name TEXT,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    execution_agent_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    delivery_agent_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    items JSONB DEFAULT '[]'::jsonb,
    actual_cost_total REAL DEFAULT 0.0,
    sale_value REAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.work_orders TO postgres;
GRANT ALL ON TABLE public.work_orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.work_orders TO authenticated;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- SECTION 5: ACCOUNTING & FINANCIAL MANAGEMENT MODULE
-- ================================================================================


-- 42.1. Operations Stages Table
CREATE TABLE IF NOT EXISTS public.operation_stages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    order_index INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE
);

GRANT ALL ON TABLE public.operation_stages TO postgres;
GRANT ALL ON TABLE public.operation_stages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.operation_stages TO authenticated;
ALTER TABLE public.operation_stages ENABLE ROW LEVEL SECURITY;

-- 42.2. Work Order QA Tickets Table
CREATE TABLE IF NOT EXISTS public.work_order_qa_tickets (
    id SERIAL PRIMARY KEY,
    work_order_id INTEGER REFERENCES public.work_orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'Open',
    severity TEXT DEFAULT 'medium',
    reported_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.work_order_qa_tickets TO postgres;
GRANT ALL ON TABLE public.work_order_qa_tickets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.work_order_qa_tickets TO authenticated;
ALTER TABLE public.work_order_qa_tickets ENABLE ROW LEVEL SECURITY;

-- 43. Chart of Accounts (COA) Table
CREATE TABLE IF NOT EXISTS public.acct_coa (
    id TEXT NOT NULL,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    parent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id)
);

GRANT ALL ON TABLE public.acct_coa TO postgres;
GRANT ALL ON TABLE public.acct_coa TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_coa TO authenticated;
ALTER TABLE public.acct_coa ENABLE ROW LEVEL SECURITY;

-- 44. Banks & Wallets Table
CREATE TABLE IF NOT EXISTS public.acct_banks_wallets (
    id TEXT NOT NULL,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    type TEXT NOT NULL,
    currency TEXT DEFAULT 'SAR',
    account_number TEXT,
    iban TEXT,
    bank_name TEXT,
    balance REAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id)
);

GRANT ALL ON TABLE public.acct_banks_wallets TO postgres;
GRANT ALL ON TABLE public.acct_banks_wallets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_banks_wallets TO authenticated;
ALTER TABLE public.acct_banks_wallets ENABLE ROW LEVEL SECURITY;

-- 45. Journal Entries Table
CREATE TABLE IF NOT EXISTS public.acct_journal_entries (
    id TEXT NOT NULL,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    reference TEXT,
    description TEXT,
    lines JSONB DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id)
);

GRANT ALL ON TABLE public.acct_journal_entries TO postgres;
GRANT ALL ON TABLE public.acct_journal_entries TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_journal_entries TO authenticated;
ALTER TABLE public.acct_journal_entries ENABLE ROW LEVEL SECURITY;

-- 46. Invoices Table
CREATE TABLE IF NOT EXISTS public.acct_invoices (
    id TEXT NOT NULL,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_id TEXT,
    deal_id TEXT,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id)
);

GRANT ALL ON TABLE public.acct_invoices TO postgres;
GRANT ALL ON TABLE public.acct_invoices TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_invoices TO authenticated;
ALTER TABLE public.acct_invoices ENABLE ROW LEVEL SECURITY;

-- 47. Bills Table
CREATE TABLE IF NOT EXISTS public.acct_bills (
    id TEXT NOT NULL,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id)
);

GRANT ALL ON TABLE public.acct_bills TO postgres;
GRANT ALL ON TABLE public.acct_bills TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_bills TO authenticated;
ALTER TABLE public.acct_bills ENABLE ROW LEVEL SECURITY;

-- 48. Bank Statements Table
CREATE TABLE IF NOT EXISTS public.acct_bank_statements (
    id TEXT NOT NULL,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    description TEXT,
    amount REAL NOT NULL,
    reconciled BOOLEAN DEFAULT FALSE,
    matched_journal_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id)
);

GRANT ALL ON TABLE public.acct_bank_statements TO postgres;
GRANT ALL ON TABLE public.acct_bank_statements TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_bank_statements TO authenticated;
ALTER TABLE public.acct_bank_statements ENABLE ROW LEVEL SECURITY;

-- 49. Financial Report Notes Table
CREATE TABLE IF NOT EXISTS public.acct_report_notes (
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    period TEXT NOT NULL,
    notes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, period)
);

GRANT ALL ON TABLE public.acct_report_notes TO postgres;
GRANT ALL ON TABLE public.acct_report_notes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.acct_report_notes TO authenticated;
ALTER TABLE public.acct_report_notes ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- SECTION 6: RISK REGISTER, QUALITY ASSURANCE (QA) & KAIZEN IMPROVEMENT
-- ================================================================================

-- 50. Key Performance Indicators (KPIs) Table
CREATE TABLE IF NOT EXISTS public.kpis (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_value REAL NOT NULL,
    actual_value REAL DEFAULT 0,
    source TEXT,
    frequency TEXT,
    owner_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.kpis TO postgres;
GRANT ALL ON TABLE public.kpis TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.kpis TO authenticated;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;

-- 51. KPI History Table
CREATE TABLE IF NOT EXISTS public.kpi_history (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    kpi_id INTEGER REFERENCES public.kpis(id) ON DELETE CASCADE,
    value REAL NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.kpi_history TO postgres;
GRANT ALL ON TABLE public.kpi_history TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.kpi_history TO authenticated;
ALTER TABLE public.kpi_history ENABLE ROW LEVEL SECURITY;

-- 52. Risks Register Table
CREATE TABLE IF NOT EXISTS public.risks (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    probability INTEGER DEFAULT 1,
    impact INTEGER DEFAULT 1,
    risk_score INTEGER GENERATED ALWAYS AS (probability * impact) STORED,
    mitigation_plan TEXT,
    contingency_plan TEXT,
    owner_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    sop_id INTEGER REFERENCES public.sops(id) ON DELETE SET NULL,
    kpi_id INTEGER REFERENCES public.kpis(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.risks TO postgres;
GRANT ALL ON TABLE public.risks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.risks TO authenticated;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- 53. Risk Log Table
CREATE TABLE IF NOT EXISTS public.risk_log (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    probability TEXT,
    impact TEXT,
    mitigation_plan TEXT,
    owner_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.risk_log TO postgres;
GRANT ALL ON TABLE public.risk_log TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.risk_log TO authenticated;
ALTER TABLE public.risk_log ENABLE ROW LEVEL SECURITY;

-- 54. QA Forms Table
CREATE TABLE IF NOT EXISTS public.qa_forms (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_forms TO postgres;
GRANT ALL ON TABLE public.qa_forms TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_forms TO authenticated;
ALTER TABLE public.qa_forms ENABLE ROW LEVEL SECURITY;

-- 55. QA Evaluations Table
CREATE TABLE IF NOT EXISTS public.qa_evaluations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    form_id INTEGER REFERENCES public.qa_forms(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    employee_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    process_name TEXT,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    interaction_id INTEGER REFERENCES public.crm_interactions(id) ON DELETE SET NULL,
    scores JSONB DEFAULT '{}'::jsonb,
    total_score REAL,
    comments TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_evaluations TO postgres;
GRANT ALL ON TABLE public.qa_evaluations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_evaluations TO authenticated;
ALTER TABLE public.qa_evaluations ENABLE ROW LEVEL SECURITY;

-- 56. QA Non-Conformance Reports (NCR) Table
CREATE TABLE IF NOT EXISTS public.qa_ncr (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    evaluation_id INTEGER REFERENCES public.qa_evaluations(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    reported_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open',
    risk_id INTEGER REFERENCES public.risk_log(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_ncr TO postgres;
GRANT ALL ON TABLE public.qa_ncr TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_ncr TO authenticated;
ALTER TABLE public.qa_ncr ENABLE ROW LEVEL SECURITY;

-- 57. QA Corrective and Preventive Actions (CAPA) Table
CREATE TABLE IF NOT EXISTS public.qa_capa (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    ncr_id INTEGER REFERENCES public.qa_ncr(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    root_cause TEXT NOT NULL,
    action_plan TEXT NOT NULL,
    assigned_to INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_capa TO postgres;
GRANT ALL ON TABLE public.qa_capa TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_capa TO authenticated;
ALTER TABLE public.qa_capa ENABLE ROW LEVEL SECURITY;

-- 57.1. QA Transaction Audits Table
CREATE TABLE IF NOT EXISTS public.qa_transaction_audits (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'complaint', 'delay', 'refund', 'cancellation'
    transaction_id TEXT NOT NULL,
    agent_name TEXT,
    customer_name TEXT,
    order_amount NUMERIC DEFAULT 0,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sla_status TEXT DEFAULT 'Met SLA',
    auditor_name TEXT,
    qa_status TEXT DEFAULT 'Pass',
    department TEXT DEFAULT 'Operations',
    root_cause TEXT,
    sub_reason TEXT,
    error_classification TEXT,
    switches JSONB DEFAULT '{}'::jsonb,
    refund_amount NUMERIC DEFAULT 0,
    corrective_action TEXT,
    manager_approval TEXT DEFAULT 'Pending',
    assigned_manager TEXT,
    current_step INTEGER DEFAULT 1,
    workflow_status TEXT DEFAULT 'Under Review',
    action_plan_required BOOLEAN DEFAULT FALSE,
    action_plan_type TEXT DEFAULT 'Training Action',
    customer_phone TEXT,
    owner TEXT,
    request_type TEXT,
    request_sub_type TEXT,
    request_date TIMESTAMP,
    operations_status TEXT,
    operation_owner TEXT,
    survey_date TIMESTAMP,
    refund_reason TEXT,
    refund_sub_reason TEXT,
    lose_on_employee BOOLEAN DEFAULT FALSE,
    lose_employee_id TEXT,
    lose_employee_name TEXT,
    lose_status TEXT DEFAULT 'Accepted',
    lose_amount NUMERIC DEFAULT 0,
    action_required TEXT,
    qa_reference_number TEXT,
    handled_by TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_transaction_audits TO postgres;
GRANT ALL ON TABLE public.qa_transaction_audits TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_transaction_audits TO authenticated;
ALTER TABLE public.qa_transaction_audits ENABLE ROW LEVEL SECURITY;

-- 57.2. QA Root Cause Presets (Audit Checklists)
CREATE TABLE IF NOT EXISTS public.qa_root_cause_presets (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL, -- 'complaint', 'delay', 'refund', 'cancellation'
    department TEXT NOT NULL,
    root_cause_name TEXT NOT NULL,
    sub_reasons JSONB DEFAULT '[]'::jsonb,
    weight NUMERIC DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_root_cause_presets TO postgres;
GRANT ALL ON TABLE public.qa_root_cause_presets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_root_cause_presets TO authenticated;
ALTER TABLE public.qa_root_cause_presets ENABLE ROW LEVEL SECURITY;

-- 57.3. QA NPS & CSAT Feedbacks Table
CREATE TABLE IF NOT EXISTS public.qa_nps_feedbacks (
    id SERIAL PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    category TEXT,
    feedback_text TEXT,
    delay_linked BOOLEAN DEFAULT FALSE,
    root_cause TEXT,
    corrective_action TEXT,
    qa_reference_number TEXT,
    auditor_name TEXT DEFAULT 'Sarah Jenkins',
    status TEXT DEFAULT 'Reviewed',
    qa_reference_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_nps_feedbacks TO postgres;
GRANT ALL ON TABLE public.qa_nps_feedbacks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_nps_feedbacks TO authenticated;
ALTER TABLE public.qa_nps_feedbacks ENABLE ROW LEVEL SECURITY;

-- 57.4. QA Action Plans (Incident Audit & QA Stepper)
CREATE TABLE IF NOT EXISTS public.qa_action_plans (
    id SERIAL PRIMARY KEY,
    plan_code TEXT NOT NULL,
    title TEXT NOT NULL,
    incident_type TEXT NOT NULL, -- 'complaint', 'delay', 'refund', 'cancellation', 'nps'
    transaction_id TEXT,
    audit_id INTEGER REFERENCES public.qa_transaction_audits(id) ON DELETE SET NULL,
    checklist_id INTEGER REFERENCES public.qa_root_cause_presets(id) ON DELETE SET NULL,
    customer_name TEXT,
    agent_name TEXT,
    department TEXT DEFAULT 'Operations',
    severity TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    status TEXT DEFAULT 'Open', -- 'Draft', 'Root Cause Analysis', 'In Progress', 'Verification', 'Closed'
    current_step INTEGER DEFAULT 1, -- 1: Detection, 2: Root Cause, 3: Action Rules, 4: Action Details & Tasks, 5: Verification & Closure
    action_plan_type TEXT DEFAULT 'Quality Action',
    root_cause_category TEXT,
    root_cause_name TEXT,
    root_cause_analysis TEXT,
    five_whys JSONB DEFAULT '[]'::jsonb,
    action_rules JSONB DEFAULT '[]'::jsonb,
    action_details JSONB DEFAULT '[]'::jsonb,
    verification_notes TEXT,
    verified_by TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    effectiveness_score INTEGER DEFAULT 100,
    assigned_to TEXT,
    target_completion_date DATE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_action_plans TO postgres;
GRANT ALL ON TABLE public.qa_action_plans TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_action_plans TO authenticated;
ALTER TABLE public.qa_action_plans ENABLE ROW LEVEL SECURITY;

-- 57.5. QA Action Rules Engine Table
CREATE TABLE IF NOT EXISTS public.qa_action_rules (
    id SERIAL PRIMARY KEY,
    rule_name TEXT NOT NULL,
    incident_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'complaint', 'delay', 'refund', 'cancellation', 'nps'
    trigger_condition TEXT NOT NULL,
    severity_level TEXT DEFAULT 'Medium',
    assigned_department TEXT,
    assigned_role TEXT,
    sla_hours INTEGER DEFAULT 24,
    default_root_cause TEXT,
    auto_actions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_action_rules TO postgres;
GRANT ALL ON TABLE public.qa_action_rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_action_rules TO authenticated;
ALTER TABLE public.qa_action_rules ENABLE ROW LEVEL SECURITY;


-- 57.6. QA Field Options Table (Configurable Dropdown Values)
CREATE TABLE IF NOT EXISTS public.qa_field_options (
    id SERIAL PRIMARY KEY,
    field_key TEXT NOT NULL,
    option_value TEXT NOT NULL,
    option_label TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT qa_field_options_unique UNIQUE(field_key, option_value)
);

GRANT ALL ON TABLE public.qa_field_options TO postgres;
GRANT ALL ON TABLE public.qa_field_options TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_field_options TO authenticated;
ALTER TABLE public.qa_field_options ENABLE ROW LEVEL SECURITY;

-- 57.7. QA Action Options Table
CREATE TABLE IF NOT EXISTS public.qa_action_options (
    id SERIAL PRIMARY KEY,
    action_name TEXT NOT NULL UNIQUE,
    category TEXT DEFAULT 'General',
    description TEXT,
    auto_plan_type TEXT DEFAULT 'Quality Action',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_action_options TO postgres;
GRANT ALL ON TABLE public.qa_action_options TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_action_options TO authenticated;
ALTER TABLE public.qa_action_options ENABLE ROW LEVEL SECURITY;

-- 57.8. QA Employee Recommendations Table
CREATE TABLE IF NOT EXISTS public.qa_employee_recommendations (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER,
    employee_name TEXT,
    department TEXT,
    author_name TEXT,
    title TEXT,
    content TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.qa_employee_recommendations TO postgres;
GRANT ALL ON TABLE public.qa_employee_recommendations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_employee_recommendations TO authenticated;
ALTER TABLE public.qa_employee_recommendations ENABLE ROW LEVEL SECURITY;

-- 58. Kaizen Suggestions Table
CREATE TABLE IF NOT EXISTS public.kaizen_suggestions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    problem_description TEXT,
    proposed_solution TEXT,
    expected_benefit TEXT,
    submitted_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    sop_id INTEGER REFERENCES public.sops(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'New',
    priority TEXT DEFAULT 'Medium',
    score INTEGER DEFAULT 0,
    impact_time_saving REAL,
    impact_cost_saving REAL,
    kpi_id INTEGER,
    improvement_type TEXT DEFAULT 'Time Reduction',
    impact_rating INTEGER DEFAULT 3,
    effort_rating INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.kaizen_suggestions TO postgres;
GRANT ALL ON TABLE public.kaizen_suggestions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.kaizen_suggestions TO authenticated;
ALTER TABLE public.kaizen_suggestions ENABLE ROW LEVEL SECURITY;

-- 59. Kaizen PDCA Cycles Table
CREATE TABLE IF NOT EXISTS public.kaizen_pdca (
    id SERIAL PRIMARY KEY,
    suggestion_id INTEGER REFERENCES public.kaizen_suggestions(id) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Pending',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.kaizen_pdca TO postgres;
GRANT ALL ON TABLE public.kaizen_pdca TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.kaizen_pdca TO authenticated;
ALTER TABLE public.kaizen_pdca ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- SECTION 7: TRAINING HUB & LMS MODULE
-- ================================================================================

-- 60. Training Courses Table
CREATE TABLE IF NOT EXISTS public.training_courses (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    sop_id INTEGER REFERENCES public.sops(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    objectives TEXT,
    material_url TEXT,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    passing_score INTEGER DEFAULT 80,
    points_reward INTEGER DEFAULT 10,
    status TEXT DEFAULT 'Draft',
    category TEXT DEFAULT 'Upcoming Training',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.training_courses TO postgres;
GRANT ALL ON TABLE public.training_courses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.training_courses TO authenticated;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

-- Link sop step required course to training courses
ALTER TABLE public.sop_steps 
ADD CONSTRAINT fk_sop_steps_course 
FOREIGN KEY (required_course_id) REFERENCES public.training_courses(id) ON DELETE SET NULL;

-- 61. Course Enrollments Table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES public.training_courses(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Scheduled',
    score INTEGER,
    progress INTEGER DEFAULT 0,
    cost INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT course_enrollments_course_user_unique UNIQUE(course_id, user_id)
);

GRANT ALL ON TABLE public.course_enrollments TO postgres;
GRANT ALL ON TABLE public.course_enrollments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.course_enrollments TO authenticated;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- 62. Training Modules Table
CREATE TABLE IF NOT EXISTS public.training_modules (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES public.training_courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sop_step_id INTEGER REFERENCES public.sop_steps(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0
);

GRANT ALL ON TABLE public.training_modules TO postgres;
GRANT ALL ON TABLE public.training_modules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.training_modules TO authenticated;
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;

-- 63. Training Lessons Table
CREATE TABLE IF NOT EXISTS public.training_lessons (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES public.training_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_type TEXT DEFAULT 'video',
    content_url TEXT,
    content_body TEXT,
    order_index INTEGER DEFAULT 0
);

GRANT ALL ON TABLE public.training_lessons TO postgres;
GRANT ALL ON TABLE public.training_lessons TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.training_lessons TO authenticated;
ALTER TABLE public.training_lessons ENABLE ROW LEVEL SECURITY;

-- 64. Training Lesson Progress Table
CREATE TABLE IF NOT EXISTS public.training_lesson_progress (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER REFERENCES public.course_enrollments(id) ON DELETE CASCADE,
    lesson_id INTEGER REFERENCES public.training_lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT training_lesson_progress_unique UNIQUE(enrollment_id, lesson_id)
);

GRANT ALL ON TABLE public.training_lesson_progress TO postgres;
GRANT ALL ON TABLE public.training_lesson_progress TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.training_lesson_progress TO authenticated;
ALTER TABLE public.training_lesson_progress ENABLE ROW LEVEL SECURITY;

-- 65. Training Quizzes Table
CREATE TABLE IF NOT EXISTS public.training_quizzes (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES public.training_courses(id) ON DELETE CASCADE,
    module_id INTEGER REFERENCES public.training_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    passing_score INTEGER DEFAULT 80,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.training_quizzes TO postgres;
GRANT ALL ON TABLE public.training_quizzes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.training_quizzes TO authenticated;
ALTER TABLE public.training_quizzes ENABLE ROW LEVEL SECURITY;

-- 66. Training Questions Table
CREATE TABLE IF NOT EXISTS public.training_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice',
    correct_answer TEXT,
    options JSONB DEFAULT '[]'::jsonb,
    mask_value BOOLEAN DEFAULT false,
    explanation TEXT
);

GRANT ALL ON TABLE public.training_questions TO postgres;
GRANT ALL ON TABLE public.training_questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.training_questions TO authenticated;
ALTER TABLE public.training_questions ENABLE ROW LEVEL SECURITY;

-- 67. Training Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.training_quiz_attempts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    quiz_id INTEGER REFERENCES public.training_quizzes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    score INTEGER,
    passed BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.training_quiz_attempts TO postgres;
GRANT ALL ON TABLE public.training_quiz_attempts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.training_quiz_attempts TO authenticated;
ALTER TABLE public.training_quiz_attempts ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- SECTION 8: COMMUNICATION, CHAT & MEETINGS
-- ================================================================================

-- 68. Chat Rooms Table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT,
    type TEXT NOT NULL,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    context_type TEXT,
    context_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.chat_rooms TO postgres;
GRANT ALL ON TABLE public.chat_rooms TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_rooms TO authenticated;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- 69. User Presence Table
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id INTEGER PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.user_presence TO postgres;
GRANT ALL ON TABLE public.user_presence TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_presence TO authenticated;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- 70. Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    mentions JSONB DEFAULT '[]'::jsonb,
    is_system_message BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.chat_messages TO postgres;
GRANT ALL ON TABLE public.chat_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO authenticated;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 71. Chat Message Reactions Table
CREATE TABLE IF NOT EXISTS public.chat_message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_reactions_msg_user_emoji_unique UNIQUE(message_id, user_id, emoji)
);

GRANT ALL ON TABLE public.chat_message_reactions TO postgres;
GRANT ALL ON TABLE public.chat_message_reactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_message_reactions TO authenticated;
ALTER TABLE public.chat_message_reactions ENABLE ROW LEVEL SECURITY;

-- 72. Internal Messages Table
CREATE TABLE IF NOT EXISTS public.internal_messages (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    subject TEXT,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.internal_messages TO postgres;
GRANT ALL ON TABLE public.internal_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.internal_messages TO authenticated;
ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

-- 73. Company Meetings Table
CREATE TABLE IF NOT EXISTS public.company_meetings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    meeting_time TIMESTAMP WITH TIME ZONE NOT NULL,
    type TEXT NOT NULL DEFAULT 'online',
    meeting_link TEXT,
    location TEXT,
    ai_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.company_meetings TO postgres;
GRANT ALL ON TABLE public.company_meetings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_meetings TO authenticated;
ALTER TABLE public.company_meetings ENABLE ROW LEVEL SECURITY;

-- 74. Meeting Attendees Table
CREATE TABLE IF NOT EXISTS public.meeting_attendees (
    meeting_id INTEGER REFERENCES public.company_meetings(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    PRIMARY KEY (meeting_id, user_id)
);

GRANT ALL ON TABLE public.meeting_attendees TO postgres;
GRANT ALL ON TABLE public.meeting_attendees TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meeting_attendees TO authenticated;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- SECTION 9: KNOWLEDGE BASE MODULE
-- ================================================================================

-- 75. Knowledge Base Article Categories Table
CREATE TABLE IF NOT EXISTS public.article_categories (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    parent_id INTEGER REFERENCES public.article_categories(id) ON DELETE SET NULL,
    CONSTRAINT article_categories_company_name_unique UNIQUE(company_id, name)
);

GRANT ALL ON TABLE public.article_categories TO postgres;
GRANT ALL ON TABLE public.article_categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.article_categories TO authenticated;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

-- 76. Knowledge Articles Table
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    category_id INTEGER REFERENCES public.article_categories(id) ON DELETE SET NULL,
    author_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    approver_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Draft',
    content_type TEXT DEFAULT 'Article',
    external_url TEXT,
    tags TEXT,
    attachments TEXT,
    related_sop_id INTEGER REFERENCES public.sops(id) ON DELETE SET NULL,
    visible_departments TEXT DEFAULT '[]',
    product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.knowledge_articles TO postgres;
GRANT ALL ON TABLE public.knowledge_articles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.knowledge_articles TO authenticated;
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- 77. Knowledge Article Revisions Table
CREATE TABLE IF NOT EXISTS public.knowledge_article_revisions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES public.knowledge_articles(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content TEXT,
    change_summary TEXT,
    updated_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.knowledge_article_revisions TO postgres;
GRANT ALL ON TABLE public.knowledge_article_revisions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.knowledge_article_revisions TO authenticated;
ALTER TABLE public.knowledge_article_revisions ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- SECTION 10: RECRUITMENT ENGINE MODULE
-- ================================================================================

-- 78. HR Job Openings Table
CREATE TABLE IF NOT EXISTS public.hr_job_openings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    department_id INTEGER REFERENCES public.departments(id) ON DELETE SET NULL,
    headcount_needed INTEGER DEFAULT 1,
    status TEXT DEFAULT 'Active',
    salary_range TEXT,
    experience_requirements TEXT,
    description TEXT,
    requirements TEXT,
    budget_status TEXT DEFAULT 'Pending Approval',
    description_blocks TEXT DEFAULT '[]',
    location TEXT DEFAULT 'Marseille, Provence',
    employment_type TEXT DEFAULT 'Full-Time',
    hiring_lead TEXT DEFAULT 'Debra Tuescher',
    days_open INTEGER DEFAULT 7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_job_openings TO postgres;
GRANT ALL ON TABLE public.hr_job_openings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_job_openings TO authenticated;
ALTER TABLE public.hr_job_openings ENABLE ROW LEVEL SECURITY;

-- 79. HR Candidates Table
CREATE TABLE IF NOT EXISTS public.hr_candidates (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    job_opening_id INTEGER REFERENCES public.hr_job_openings(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    linkedin_url TEXT,
    cv_url TEXT,
    stage TEXT DEFAULT 'Applied',
    score NUMERIC DEFAULT 0,
    notes TEXT,
    phone TEXT DEFAULT '+33 4 567 4321',
    location TEXT DEFAULT 'Marseille, Provence',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_candidates TO postgres;
GRANT ALL ON TABLE public.hr_candidates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_candidates TO authenticated;
ALTER TABLE public.hr_candidates ENABLE ROW LEVEL SECURITY;

-- 80. HR Interviews Table
CREATE TABLE IF NOT EXISTS public.hr_interviews (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES public.hr_candidates(id) ON DELETE CASCADE,
    title TEXT,
    interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
    interviewer_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    meeting_link TEXT,
    notes TEXT,
    technical_score INTEGER,
    technical_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_interviews TO postgres;
GRANT ALL ON TABLE public.hr_interviews TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_interviews TO authenticated;
ALTER TABLE public.hr_interviews ENABLE ROW LEVEL SECURITY;

-- 81. HR Candidate Comments Table
CREATE TABLE IF NOT EXISTS public.hr_candidate_comments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES public.hr_candidates(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_candidate_comments TO postgres;
GRANT ALL ON TABLE public.hr_candidate_comments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_candidate_comments TO authenticated;
ALTER TABLE public.hr_candidate_comments ENABLE ROW LEVEL SECURITY;

-- 82. HR Candidate Audit Logs Table
CREATE TABLE IF NOT EXISTS public.hr_candidate_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES public.hr_candidates(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_candidate_logs TO postgres;
GRANT ALL ON TABLE public.hr_candidate_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_candidate_logs TO authenticated;
ALTER TABLE public.hr_candidate_logs ENABLE ROW LEVEL SECURITY;

-- 83. HR Candidate Emails Table
CREATE TABLE IF NOT EXISTS public.hr_candidate_emails (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    candidate_id INTEGER REFERENCES public.hr_candidates(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    status TEXT DEFAULT 'Sent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_candidate_emails TO postgres;
GRANT ALL ON TABLE public.hr_candidate_emails TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_candidate_emails TO authenticated;
ALTER TABLE public.hr_candidate_emails ENABLE ROW LEVEL SECURITY;

-- 84. HR Email Templates Table
CREATE TABLE IF NOT EXISTS public.hr_email_templates (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_email_templates TO postgres;
GRANT ALL ON TABLE public.hr_email_templates TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_email_templates TO authenticated;
ALTER TABLE public.hr_email_templates ENABLE ROW LEVEL SECURITY;

-- 85. HR Email Config Table
CREATE TABLE IF NOT EXISTS public.hr_email_config (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_user TEXT,
    smtp_pass TEXT,
    sender_name TEXT,
    sender_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.hr_email_config TO postgres;
GRANT ALL ON TABLE public.hr_email_config TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hr_email_config TO authenticated;
ALTER TABLE public.hr_email_config ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- SECTION 11: AUTOMATION, INTEGRATIONS, GLOBAL STATUSES & AI AGENTS
-- ================================================================================

-- 86. Automation Rules Table
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    conditions JSONB DEFAULT '[]'::jsonb,
    actions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.automation_rules TO postgres;
GRANT ALL ON TABLE public.automation_rules TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.automation_rules TO authenticated;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

-- 87. Automation Logs Table
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    rule_id INTEGER REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    trigger_data JSONB,
    execution_status TEXT,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.automation_logs TO postgres;
GRANT ALL ON TABLE public.automation_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.automation_logs TO authenticated;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- 88. Integrations Table
CREATE TABLE IF NOT EXISTS public.integrations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'disconnected',
    config JSONB DEFAULT '{}'::jsonb,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT integrations_company_name_unique UNIQUE(company_id, name)
);

GRANT ALL ON TABLE public.integrations TO postgres;
GRANT ALL ON TABLE public.integrations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.integrations TO authenticated;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- 89. Integration Webhooks Table
CREATE TABLE IF NOT EXISTS public.integration_webhooks (
    id SERIAL PRIMARY KEY,
    integration_id INTEGER REFERENCES public.integrations(id) ON DELETE CASCADE,
    hook_url TEXT NOT NULL,
    event_type TEXT NOT NULL,
    secret_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.integration_webhooks TO postgres;
GRANT ALL ON TABLE public.integration_webhooks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.integration_webhooks TO authenticated;
ALTER TABLE public.integration_webhooks ENABLE ROW LEVEL SECURITY;

-- 90. Integration Audit Logs Table
CREATE TABLE IF NOT EXISTS public.integration_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    integration_id INTEGER REFERENCES public.integrations(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    details TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.integration_logs TO postgres;
GRANT ALL ON TABLE public.integration_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.integration_logs TO authenticated;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- 91. Global Statuses Engine
CREATE TABLE IF NOT EXISTS public.global_statuses (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    module_id TEXT NOT NULL DEFAULT 'crm',
    status_key TEXT NOT NULL,
    value TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL,
    color TEXT DEFAULT '#64748b',
    is_default BOOLEAN DEFAULT FALSE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT global_statuses_module_key_unique UNIQUE(module_id, status_key)
);

GRANT ALL ON TABLE public.global_statuses TO postgres;
GRANT ALL ON TABLE public.global_statuses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.global_statuses TO authenticated;
ALTER TABLE public.global_statuses ENABLE ROW LEVEL SECURITY;

-- 92. Company AI Agents Table
CREATE TABLE IF NOT EXISTS public.company_ai_agents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    agent_role TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    system_prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE public.company_ai_agents TO postgres;
GRANT ALL ON TABLE public.company_ai_agents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_ai_agents TO authenticated;
ALTER TABLE public.company_ai_agents ENABLE ROW LEVEL SECURITY;


-- ================================================================================
-- MARKETING CAMPAIGNS & CONTENT MANAGEMENT MODULE
-- ================================================================================

-- 93. Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    goal TEXT,
    platform TEXT NOT NULL,
    budget NUMERIC DEFAULT 0,
    spend NUMERIC DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    sales_value NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Planning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.marketing_campaigns TO postgres;
GRANT ALL ON TABLE public.marketing_campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.marketing_campaigns TO authenticated;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- 94. Marketing Content Table
CREATE TABLE IF NOT EXISTS public.marketing_content (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    platform TEXT NOT NULL,
    content_text TEXT,
    publish_date DATE,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.marketing_content TO postgres;
GRANT ALL ON TABLE public.marketing_content TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.marketing_content TO authenticated;
ALTER TABLE public.marketing_content ENABLE ROW LEVEL SECURITY;

-- 95. Marketing Attachments Table
CREATE TABLE IF NOT EXISTS public.marketing_attachments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    content_id INTEGER REFERENCES public.marketing_content(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

GRANT ALL ON TABLE public.marketing_attachments TO postgres;
GRANT ALL ON TABLE public.marketing_attachments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.marketing_attachments TO authenticated;
ALTER TABLE public.marketing_attachments ENABLE ROW LEVEL SECURITY;

-- ================================================================================
-- AI BUSINESS & BOARDROOM ADVISOR MODULE
-- ================================================================================

-- 96. AI Business Strategy Sessions Table
CREATE TABLE IF NOT EXISTS public.ai_business_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    seed_input TEXT NOT NULL,
    answers JSONB DEFAULT '[]'::jsonb,
    is_satisfied BOOLEAN DEFAULT FALSE,
    scope_document TEXT,
    agent_analysis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE public.ai_business_sessions TO postgres;
GRANT ALL ON TABLE public.ai_business_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_business_sessions TO authenticated;
ALTER TABLE public.ai_business_sessions ENABLE ROW LEVEL SECURITY;

-- 97. AI Boardroom Strategic Meetings Table
CREATE TABLE IF NOT EXISTS public.ai_boardroom_meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    meeting_goal TEXT NOT NULL,
    apply_directives BOOLEAN DEFAULT TRUE,
    transcript JSONB DEFAULT '[]'::jsonb,
    db_actions_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE public.ai_boardroom_meetings TO postgres;
GRANT ALL ON TABLE public.ai_boardroom_meetings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_boardroom_meetings TO authenticated;
ALTER TABLE public.ai_boardroom_meetings ENABLE ROW LEVEL SECURITY;

-- ================================================================================
-- ESSENTIAL SEED & INITIAL DATA (Safe Idempotent Inserts: ON CONFLICT DO NOTHING)
-- ================================================================================

-- 1. Initial Company Anchor
INSERT INTO public.companies (id, name, subdomain) 
VALUES (1, 'Main Office', 'main') 
ON CONFLICT (id) DO NOTHING;

-- 2. Core System Roles
INSERT INTO public.roles (id, name, permissions) VALUES 
(1, 'Admin', '["all"]'::jsonb),
(2, 'Manager', '["read:all", "write:all", "delete:own"]'::jsonb),
(3, 'Employee', '["read:own", "write:own"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 3. Core System Departments
INSERT INTO public.departments (id, company_id, name, description, is_executive, teams, job_titles) VALUES 
(1, 1, 'Executive Leadership', 'Corporate governance and executive board', true, '["Executive Board"]'::jsonb, '["Chief Executive Officer (CEO)"]'::jsonb),
(2, 1, 'Operations', 'General business and service operations', false, '["Dispatch & Delivery", "Service Fulfillment"]'::jsonb, '["Operations Lead", "Operations Officer"]'::jsonb),
(3, 1, 'Quality Assurance', 'Audits, incident investigation, NPS and compliance', false, '["QA Audit Team", "Quality Control"]'::jsonb, '["QA Manager", "Quality Specialist"]'::jsonb),
(4, 1, 'Customer Support', 'Customer care, inquiries and ticketing', false, '["Support Agents", "Helpdesk"]'::jsonb, '["Support Lead", "Customer Service Agent"]'::jsonb),
(5, 1, 'Sales & CRM', 'Inbound leads, client relations and revenue', false, '["Direct Sales", "Account Executives"]'::jsonb, '["Sales Director", "Account Manager"]'::jsonb),
(6, 1, 'Human Resources', 'Talent, recruitment, payroll and personnel', false, '["People Operations", "Recruitment"]'::jsonb, '["HR Director", "HR Specialist"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Reset sequences to prevent duplicate key errors on future inserts
SELECT setval('companies_id_seq', COALESCE((SELECT MAX(id) FROM public.companies), 1));
SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM public.roles), 3));
SELECT setval('departments_id_seq', COALESCE((SELECT MAX(id) FROM public.departments), 6));

-- 4. Initial System Administrator User (Password: core123)
INSERT INTO public.users (id, company_id, name, email, password, role_id, department_id, job_title, is_super_admin, status)
VALUES (1, 1, 'System Administrator', 'admin@gmail.com', '$2a$10$8.tXG.S6W8/S/6Fm6V6V6u.6V6V6V6V6V6V6V6V6V6V6V6V6', 1, 1, 'Chief Executive Officer', true, 'active')
ON CONFLICT (id) DO NOTHING;
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM public.users), 1));

-- 5. Core System Modules
INSERT INTO public.system_modules (id, name, is_active, order_index) VALUES 
('dashboard', 'Dashboard', true, 1),
('operations_hub', 'Operations Hub', true, 2),
('crm', 'CRM & Sales', true, 3),
('qa', 'Quality Assurance', true, 4),
('hr', 'Human Resources', true, 5),
('tasks', 'Task Manager', true, 6),
('sops', 'Standard Operating Procedures', true, 7),
('process_mapping', 'Process Mapping', true, 8),
('raci', 'RACI Matrix', true, 9),
('kpis', 'KPIs & Goals', true, 10),
('kb', 'Knowledge Base', true, 11),
('risk', 'Risk Management', true, 12),
('kaizen', 'Kaizen & Continuous Improvement', true, 13),
('accounting', 'Finance & Accounting', true, 14),
('marketing', 'Marketing Hub', true, 15),
('ai_business', 'AI Strategic Advisor', true, 16),
('training', 'Learning & Training', true, 17),
('chat', 'Team Communications', true, 18),
('meetings', 'Company Meetings', true, 19),
('automation', 'Automation Rules', true, 20)
ON CONFLICT (id) DO NOTHING;

-- 6. Default Operations Stages
INSERT INTO public.operation_stages (id, name, color, order_index, is_completed) VALUES
(1, 'Intake & Verification', '#3b82f6', 1, false),
(2, 'Processing & Preparation', '#6366f1', 2, false),
(3, 'Quality Inspection', '#f59e0b', 3, false),
(4, 'Dispatch & Delivery', '#10b981', 4, false),
(5, 'Completed', '#059669', 5, true)
ON CONFLICT (id) DO NOTHING;
SELECT setval('operation_stages_id_seq', COALESCE((SELECT MAX(id) FROM public.operation_stages), 5));

-- 7. Default QA Field Options
INSERT INTO public.qa_field_options (field_key, option_value, option_label, is_default) VALUES
('qa_status', 'Pass', 'Pass', true),
('qa_status', 'Fail', 'Fail', false),
('qa_status', 'Conditional Pass', 'Conditional Pass', false),
('qa_status', 'Escalated', 'Escalated', false),
('qa_status', 'Under Review', 'Under Review', false),
('manager_approval', 'Pending', 'Pending', true),
('manager_approval', 'Approved', 'Approved', false),
('manager_approval', 'Rejected', 'Rejected', false),
('operations_status', 'Pending Investigation', 'Pending Investigation', true),
('operations_status', 'In Progress', 'In Progress', false),
('operations_status', 'Action Taken', 'Action Taken', false),
('operations_status', 'Resolved', 'Resolved', false),
('sla_status', 'Met SLA', 'Met SLA', true),
('sla_status', 'Breached SLA', 'Breached SLA', false),
('sla_status', 'At Risk', 'At Risk', false),
('department', 'Operations', 'Operations', true),
('department', 'Customer Support', 'Customer Support', false),
('department', 'Sales & CRM', 'Sales & CRM', false),
('department', 'Quality Assurance', 'Quality Assurance', false),
('department', 'Logistics', 'Logistics', false)
ON CONFLICT (field_key, option_value) DO NOTHING;

-- 8. Default QA Action Options
INSERT INTO public.qa_action_options (action_name, category, description, auto_plan_type, is_active) VALUES
('Training Action', 'Quality Training', 'Schedule coaching or training session for employee', 'Training Action', true),
('Re-inspection Required', 'Audit & Inspection', 'Mandatory secondary quality review before sign-off', 'Quality Action', true),
('Process Revision', 'Process & SOP', 'Update standard operating procedure to prevent recurrence', 'Kaizen Improvement', true),
('Manager Escalation', 'Management Review', 'Direct intervention by department head or supervisor', 'Management Review', true)
ON CONFLICT (action_name) DO NOTHING;

-- 9. Default Global Statuses
INSERT INTO public.global_statuses (module_id, status_key, value, label, color, is_default, order_index) VALUES
('crm', 'lead_new', 'new', 'New Lead', '#3b82f6', true, 1),
('crm', 'lead_contacted', 'contacted', 'Contacted', '#6366f1', false, 2),
('crm', 'lead_qualified', 'qualified', 'Qualified', '#10b981', false, 3),
('crm', 'lead_lost', 'lost', 'Lost', '#ef4444', false, 4),
('tasks', 'task_todo', 'todo', 'To Do', '#64748b', true, 1),
('tasks', 'task_in_progress', 'in_progress', 'In Progress', '#f59e0b', false, 2),
('tasks', 'task_done', 'done', 'Completed', '#10b981', false, 3)
ON CONFLICT (module_id, status_key) DO NOTHING;

-- 10. Default HR Payroll Config
INSERT INTO public.hr_payroll_config (company_id, start_day, late_deduction_per_hour, absence_penalty_multiplier, early_departure_deduction)
VALUES (1, 1, 15, 1.0, 10)
ON CONFLICT (company_id) DO NOTHING;

-- ================================================================================
-- END OF SCHEMA DEFINITION
-- ================================================================================
