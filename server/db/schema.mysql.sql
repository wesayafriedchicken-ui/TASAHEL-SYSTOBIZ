SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================================
-- UNIFIED DATABASE SCHEMA (MYSQL 8.0+ / MARIADB 10.5+)
-- THE BUSINESS CORE ARCHITECTURE
-- Full MySQL-Compatible Schema for Systo Biz (Tables, Constraints, Indexes & Seed Data)
-- ================================================================================

-- Enable Required Extensions

-- ================================================================================
-- SECTION 1: CORE BASELINE & MULTI-TENANCY
-- ================================================================================

-- 1. Companies Table (Multi-tenancy anchor)
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) UNIQUE NOT NULL,
    subdomain VARCHAR(191) UNIQUE,
    corporate_domain VARCHAR(255),
    corporate_domains JSON NULL,
    logo_url TEXT,
    settings JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- 1b. Company Geofence Locations (Mobile Biometric Attendance Perimeter)
CREATE TABLE IF NOT EXISTS company_geofence_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) DEFAULT 'HQ-01',
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    allowed_radius_meters INT NOT NULL DEFAULT 100,
    is_active TINYINT(1) DEFAULT true,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);




-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name VARCHAR(191) NOT NULL,
    description VARCHAR(255) DEFAULT '',
    permissions JSON NULL,
    mobile_permissions JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT roles_company_name_unique UNIQUE(company_id, name),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 3. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name VARCHAR(191) NOT NULL,
    description TEXT,
    department_head_id INT,
    is_executive TINYINT(1) DEFAULT false,
    teams JSON NULL,
    job_titles JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT departments_company_name_unique UNIQUE(company_id, name),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 4. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    employee_id TEXT,
    name TEXT NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL,
    username VARCHAR(255),
    password TEXT NOT NULL,
    role_id INT,
    department_id INT,
    team_name TEXT,
    job_title TEXT,
    reporting_to INT,
    status VARCHAR(255) DEFAULT 'active',
    is_super_admin TINYINT(1) DEFAULT FALSE,
    has_portal_access TINYINT(1) DEFAULT TRUE,
    auth_method VARCHAR(64) DEFAULT 'standard',
    extension_number VARCHAR(64),
    training_points INT DEFAULT 0,
    avatar_url TEXT,
    permissions JSON DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (reporting_to) REFERENCES users(id) ON DELETE SET NULL
);


-- Foreign key link for department head after users table exists

-- 5. System Modules Table
CREATE TABLE IF NOT EXISTS system_modules (
    id VARCHAR(191) PRIMARY KEY,
    name TEXT NOT NULL,
    is_active TINYINT(1) DEFAULT TRUE,
    order_index INT DEFAULT 0,
    metadata JSON NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    user_id INT,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    user_id INT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(255) DEFAULT 'info',
    link TEXT,
    is_read TINYINT(1) DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);



-- ================================================================================
-- SECTION 2: HR & EMPLOYEE MANAGEMENT MODULE
-- ================================================================================

-- 8. HR Employees Table
CREATE TABLE IF NOT EXISTS hr_employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    company_id INT,
    employee_id TEXT,
    id_number TEXT,
    phone TEXT,
    salary_base DOUBLE DEFAULT 0,
    allowances DOUBLE DEFAULT 0,
    contract_type VARCHAR(255) DEFAULT 'Full-time',
    contract_start_date DATE,
    contract_end_date DATE,
    vacation_balance DOUBLE DEFAULT 21,
    sick_leave_balance DOUBLE DEFAULT 7,
    bereavement_used DOUBLE DEFAULT 0,
    documents JSON NULL,
    penalty_history JSON NULL,
    job_informations JSON NULL,
    compensations JSON NULL,
    bonuses_list JSON NULL,
    commissions_list JSON NULL,
    equities_list JSON NULL,
    shift_allowances_list JSON NULL,
    potential_bonus JSON NULL,
    employment_statuses JSON NULL,
    attendance_method VARCHAR(255) DEFAULT 'Login System',
    assigned_shift_id INT,
    reporting_to INT,
    job_title TEXT,
    department_id INT,
    gender TEXT,
    nationality TEXT,
    marital_status TEXT,
    date_of_birth DATE,
    address TEXT,
    work_location TEXT,
    job_grade TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    assets_list JSON NULL,
    benefits_info JSON NULL,
    onboarding_tasks JSON NULL,
    offboarding_tasks JSON NULL,
    system_logins JSON NULL,
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
    potential_bonus_percent DOUBLE DEFAULT 0,
    potential_bonus_amount DOUBLE DEFAULT 0,
    kpi_amount DOUBLE DEFAULT 0,
    kpi_frequency TEXT,
    kpi_payout_mechanism TEXT,
    kpi_payout_date DATE,
    trainings_list JSON NULL,
    notes_list JSON NULL,
    email VARCHAR(191),
    department TEXT,
    position TEXT,
    status VARCHAR(255) DEFAULT 'Active',
    personal_info JSON NULL,
    extension_number VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (reporting_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);


-- 8.1. HR Employee Job History Table
CREATE TABLE IF NOT EXISTS hr_employee_job_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    job_title TEXT NOT NULL,
    department_name TEXT,
    team_name TEXT,
    reporting_to TEXT,
    location TEXT,
    effective_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.2. HR Employee Compensations Table
CREATE TABLE IF NOT EXISTS hr_employee_compensations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pay_rate DECIMAL(12, 2) NOT NULL DEFAULT 0,
    pay_frequency VARCHAR(255) DEFAULT 'Monthly',
    currency VARCHAR(255) DEFAULT 'EGP',
    effective_date DATE,
    change_reason TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.3. HR Employee Bonuses Table
CREATE TABLE IF NOT EXISTS hr_employee_bonuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title TEXT NOT NULL,
    bonus_type TEXT,
    amount DECIMAL(12, 2) DEFAULT 0,
    percent DECIMAL(5, 2) DEFAULT 0,
    frequency TEXT,
    payout_date DATE,
    status VARCHAR(255) DEFAULT 'Pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.4. HR Employee Commissions Table
CREATE TABLE IF NOT EXISTS hr_employee_commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title TEXT NOT NULL,
    commission_rate DECIMAL(5, 2) DEFAULT 0,
    target_amount DECIMAL(12, 2) DEFAULT 0,
    payout_frequency TEXT,
    status VARCHAR(255) DEFAULT 'Active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.5. HR Employee Equities Table
CREATE TABLE IF NOT EXISTS hr_employee_equities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    equity_type TEXT NOT NULL,
    total_units DECIMAL(12, 2) DEFAULT 0,
    vesting_schedule TEXT,
    grant_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.6. HR Employee Shift Allowances Table
CREATE TABLE IF NOT EXISTS hr_employee_shift_allowances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    allowance_type TEXT NOT NULL,
    rate DECIMAL(12, 2) DEFAULT 0,
    frequency TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.7. HR Employee Employment Statuses History Table
CREATE TABLE IF NOT EXISTS hr_employee_employment_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status VARCHAR(191) NOT NULL,
    effective_date DATE,
    reason TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.8. HR Employee Penalties Table
CREATE TABLE IF NOT EXISTS hr_employee_penalties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    penalty_type TEXT NOT NULL,
    reason TEXT,
    amount DECIMAL(12, 2) DEFAULT 0,
    date_issued DATE,
    status VARCHAR(255) DEFAULT 'Active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.9. HR Employee Assets Table
CREATE TABLE IF NOT EXISTS hr_employee_assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category TEXT,
    description TEXT,
    serial_number TEXT,
    date_loaned DATE,
    date_returned DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.10. HR Employee Dependents Table
CREATE TABLE IF NOT EXISTS hr_employee_dependents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT,
    relationship TEXT,
    dob DATE,
    date_of_birth DATE,
    gender TEXT,
    national_id TEXT,
    phone TEXT,
    address TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.11. HR Employee Benefit History Table
CREATE TABLE IF NOT EXISTS hr_employee_benefit_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    benefit_name TEXT NOT NULL,
    change_type TEXT,
    effective_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.12. HR Employee Onboarding Tasks Table
CREATE TABLE IF NOT EXISTS hr_employee_onboarding_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category TEXT,
    title TEXT NOT NULL,
    assignee TEXT,
    due_date DATE,
    completed TINYINT(1) DEFAULT false,
    completed_by TEXT,
    completed_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.13. HR Employee Offboarding Tasks Table
CREATE TABLE IF NOT EXISTS hr_employee_offboarding_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category TEXT,
    title TEXT NOT NULL,
    assignee TEXT,
    due_date DATE,
    completed TINYINT(1) DEFAULT false,
    completed_by TEXT,
    completed_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.14. HR Employee Trainings Table
CREATE TABLE IF NOT EXISTS hr_employee_trainings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_name TEXT NOT NULL,
    provider TEXT,
    completion_date DATE,
    certificate_url TEXT,
    expiry_date DATE,
    score DECIMAL(5, 2),
    status VARCHAR(255) DEFAULT 'Completed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.15. HR Employee Documents Table
CREATE TABLE IF NOT EXISTS hr_employee_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_url TEXT,
    expiry_date DATE,
    status VARCHAR(255) DEFAULT 'Active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.16. HR Employee System Logins Table
CREATE TABLE IF NOT EXISTS hr_employee_system_logins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    system_name TEXT NOT NULL,
    username TEXT,
    role TEXT,
    access_level TEXT,
    status VARCHAR(255) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 8.17. HR Employee Notes Table
CREATE TABLE IF NOT EXISTS hr_employee_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    author_id INT,
    author_name TEXT,
    title TEXT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 9. HR Shifts Table
CREATE TABLE IF NOT EXISTS hr_shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name TEXT NOT NULL,
    type VARCHAR(255) DEFAULT 'Fixed',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_mins INT DEFAULT 15,
    required_hours DECIMAL(10,2) DEFAULT 8.00,
    color VARCHAR(255) DEFAULT '#3b82f6',
    attendance_method VARCHAR(255) DEFAULT 'Login System',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 10. HR Shift Assignments Table
CREATE TABLE IF NOT EXISTS hr_shift_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    user_id INT,
    shift_id INT,
    day_of_week INT NOT NULL, -- 0-6 (Sunday to Saturday)
    start_date TEXT,
    end_date TEXT,
    recurrence VARCHAR(255) DEFAULT 'weekly',
    notification_sent TINYINT(1) DEFAULT false,
    employee_visibility VARCHAR(255) DEFAULT 'published_all',
    is_published TINYINT(1) DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES hr_shifts(id) ON DELETE CASCADE
);

ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS start_date TEXT;
ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS end_date TEXT;
ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS recurrence VARCHAR(255) DEFAULT 'weekly';
ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS notification_sent TINYINT(1) DEFAULT false;
ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS employee_visibility VARCHAR(255) DEFAULT 'published_all';
ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS is_published TINYINT(1) DEFAULT true;


-- 11. HR Shift Swaps Table
CREATE TABLE IF NOT EXISTS hr_shift_swaps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    requester_id INT,
    counterpart_id INT,
    swap_date DATE NOT NULL,
    requester_shift_id INT,
    counterpart_shift_id INT,
    reason TEXT,
    manager_status VARCHAR(255) DEFAULT 'Pending',
    manager_id INT,
    manager_comment TEXT,
    manager_action_at DATETIME,
    attendance_status VARCHAR(255) DEFAULT 'Pending',
    attendance_admin_id INT,
    attendance_comment TEXT,
    attendance_action_at DATETIME,
    status VARCHAR(255) DEFAULT 'Pending Manager',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (counterpart_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_shift_id) REFERENCES hr_shifts(id) ON DELETE SET NULL,
    FOREIGN KEY (counterpart_shift_id) REFERENCES hr_shifts(id) ON DELETE SET NULL,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (attendance_admin_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 12. HR Attendance Table
CREATE TABLE IF NOT EXISTS hr_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    user_id INT,
    employee_id TEXT,
    date DATE NOT NULL,
    clock_in DATETIME,
    clock_out DATETIME,
    status VARCHAR(255) DEFAULT 'Present',
    shift_name TEXT,
    late_minutes INT DEFAULT 0,
    worked_hours DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_attendance_user_date_unique UNIQUE (user_id, date),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE hr_attendance ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;


-- 13. HR Leave Requests Table
CREATE TABLE IF NOT EXISTS hr_leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    user_id INT,
    employee_id INT,
    type VARCHAR(191) NOT NULL,
    leave_type TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(255) DEFAULT 'Pending',
    reason TEXT,
    approver_id INT,
    comments TEXT,
    attachment_url TEXT,
    attachment_name TEXT,
    manager_status VARCHAR(255) DEFAULT 'Pending',
    manager_id INT,
    manager_comment TEXT,
    manager_action_at DATETIME,
    attendance_status VARCHAR(255) DEFAULT 'Pending',
    attendance_admin_id INT,
    attendance_comment TEXT,
    attendance_action_at DATETIME,
    with_deduction TINYINT(1) DEFAULT false,
    deduction_type VARCHAR(255) DEFAULT 'none',
    deduction_days DECIMAL(4,1) DEFAULT 0,
    approved_period_scope VARCHAR(255) DEFAULT 'full',
    approved_start_date DATE,
    approved_end_date DATE,
    approved_days DECIMAL(4,1),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES users(id),
    FOREIGN KEY (manager_id) REFERENCES users(id),
    FOREIGN KEY (attendance_admin_id) REFERENCES users(id)
);


-- 14. HR Payroll Table
CREATE TABLE IF NOT EXISTS hr_payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    user_id INT,
    month INT NOT NULL,
    year INT NOT NULL,
    base_salary DOUBLE NOT NULL,
    allowances DOUBLE DEFAULT 0,
    deductions DOUBLE DEFAULT 0,
    bonuses DOUBLE DEFAULT 0,
    commissions DOUBLE DEFAULT 0,
    total_gross DECIMAL(14,2) DEFAULT 0,
    total_deductions DECIMAL(14,2) DEFAULT 0,
    total_net DOUBLE NOT NULL,
    breakdown JSON NULL,
    status VARCHAR(255) DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_payroll_user_month_year_unique UNIQUE(user_id, month, year),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 15. HR Performance Reviews Table
CREATE TABLE IF NOT EXISTS hr_performance_reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    user_id INT,
    reviewer_id INT,
    period TEXT NOT NULL,
    score DOUBLE DEFAULT 0,
    productivity_rate DOUBLE DEFAULT 0,
    strengths TEXT,
    areas_for_improvement TEXT,
    status VARCHAR(255) DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 15b. HR Performance Frameworks Table
CREATE TABLE IF NOT EXISTS hr_performance_frameworks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    code VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active TINYINT(1) DEFAULT TRUE,
    default_weights JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_performance_frameworks_code_unique UNIQUE(company_id, code),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 15c. HR Performance Settings & Evaluation Rules Table
CREATE TABLE IF NOT EXISTS hr_performance_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    department_id INT,
    team_name TEXT,
    job_title TEXT,
    framework_code VARCHAR(255) NOT NULL DEFAULT 'hybrid',
    evaluation_weights JSON NULL,
    cycle_frequency VARCHAR(255) NOT NULL DEFAULT 'Quarterly',
    enable_self_appraisal TINYINT(1) DEFAULT TRUE,
    approval_workflow JSON NULL,
    competencies JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);



-- 15d. HR Performance Evaluations Table
CREATE TABLE IF NOT EXISTS hr_performance_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    employee_id INT,
    user_id INT,
    evaluation_period TEXT,
    overall_rating DECIMAL(14,2),
    status VARCHAR(255) DEFAULT 'Completed',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 15e. HR Organizational Structure Settings
CREATE TABLE IF NOT EXISTS hr_org_structure_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT UNIQUE DEFAULT 1,
    industry_preset VARCHAR(255) DEFAULT 'corporate',
    job_grades JSON NULL,
    department_settings JSON NULL,
    jd_templates JSON NULL,
    custom_settings JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- 15f. HR Action Controls Table
CREATE TABLE IF NOT EXISTS hr_action_controls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT DEFAULT 1,
    action_key VARCHAR(191) NOT NULL,
    tab_id TEXT NOT NULL,
    section_name TEXT NOT NULL,
    label_en TEXT NOT NULL,
    label_ar TEXT,
    state VARCHAR(255) NOT NULL DEFAULT 'active',
    permission_scope VARCHAR(255) NOT NULL DEFAULT 'everyone',
    tooltip_text VARCHAR(255) DEFAULT 'You are not authorized to perform this action',
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_action_controls_unique_key UNIQUE (company_id, action_key)
);


-- 15g. Company Schema Customizations Table
CREATE TABLE IF NOT EXISTS company_schema_customizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT DEFAULT 1,
    module_name VARCHAR(255) NOT NULL DEFAULT 'hr',
    page_key VARCHAR(191) NOT NULL,
    schema_config JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT company_schema_customizations_unique UNIQUE (company_id, module_name, page_key)
);


-- 16. HR Complaints Table
CREATE TABLE IF NOT EXISTS hr_complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    user_id INT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(255) DEFAULT 'Pending',
    admin_notes VARCHAR(255) DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 17. HR Payroll Config Table
CREATE TABLE IF NOT EXISTS hr_payroll_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT UNIQUE,
    start_day INT DEFAULT 1,
    late_deduction_per_hour DOUBLE DEFAULT 0,
    absence_penalty_multiplier DOUBLE DEFAULT 1.0,
    early_departure_deduction DOUBLE DEFAULT 0,
    disciplinary_rules JSON NULL,
    insurance_benefits JSON NULL,
    tax_brackets JSON NULL,
    tardy_deduction_rules JSON NULL,
    leave_policy_defaults JSON NULL,
    custom_rules JSON NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 18. HR Custom Fields Engine
CREATE TABLE IF NOT EXISTS hr_custom_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    entity_type TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_label_ar TEXT NOT NULL,
    field_label_en TEXT NOT NULL,
    field_type TEXT NOT NULL,
    is_required TINYINT(1) DEFAULT false,
    options TEXT,
    default_value TEXT,
    relation_target_table TEXT,
    relation_display_column TEXT,
    order_index INT DEFAULT 0,
    allow_search TINYINT(1) DEFAULT false,
    add_to_filter TINYINT(1) DEFAULT false,
    hidden TINYINT(1) DEFAULT false,
    bold TINYINT(1) DEFAULT false,
    allow_in_quick_entry TINYINT(1) DEFAULT false,
    translatable TINYINT(1) DEFAULT false,
    print_hide TINYINT(1) DEFAULT false,
    report_hide TINYINT(1) DEFAULT false,
    in_list_view TINYINT(1) DEFAULT false,
    in_list_filter TINYINT(1) DEFAULT false,
    in_preview TINYINT(1) DEFAULT false,
    sticky TINYINT(1) DEFAULT false,
    in_filter TINYINT(1) DEFAULT false,
    in_global_search TINYINT(1) DEFAULT false,
    read_only TINYINT(1) DEFAULT false,
    allow_on_submit TINYINT(1) DEFAULT false,
    perm_level INT DEFAULT 0,
    ignore_xss_filter TINYINT(1) DEFAULT false,
    own_only TINYINT(1) DEFAULT false,
    mask_value TINYINT(1) DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS default_value TEXT;
ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS mask_value TINYINT(1) DEFAULT false;


-- 19. HR Custom Field Values Table
CREATE TABLE IF NOT EXISTS hr_custom_field_values (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    field_id INT,
    entity_id INT NOT NULL,
    value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hr_custom_field_values_unique_entity_field UNIQUE (field_id, entity_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES hr_custom_fields(id) ON DELETE CASCADE
);


-- 20. HR Pipelines / Custom Statuses Engine
CREATE TABLE IF NOT EXISTS hr_pipelines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    module_key TEXT NOT NULL,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    color VARCHAR(255) DEFAULT '#3b82f6',
    order_index INT DEFAULT 0,
    is_default TINYINT(1) DEFAULT false,
    has_popup TINYINT(1) DEFAULT false,
    popup_config JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 20.1. HR Announcements Table
CREATE TABLE IF NOT EXISTS hr_announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT DEFAULT 1,
    author_id INT,
    author_name TEXT NOT NULL,
    title TEXT NOT NULL,
    category VARCHAR(255) DEFAULT 'Announcement',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 20.2. HR Recognitions Table
CREATE TABLE IF NOT EXISTS hr_recognitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT DEFAULT 1,
    sender_id INT,
    sender_name TEXT NOT NULL,
    recipient_id INT,
    recipient_name TEXT NOT NULL,
    points INT DEFAULT 25,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 20.3. Job Descriptions Table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT DEFAULT 1,
    title TEXT NOT NULL,
    department TEXT,
    team TEXT,
    grade TEXT,
    salary_band TEXT,
    reports_to TEXT,
    employment_type TEXT,
    location TEXT,
    status VARCHAR(255) DEFAULT 'Active',
    objective TEXT,
    responsibilities TEXT,
    education TEXT,
    technical_skills TEXT,
    soft_skills TEXT,
    certifications TEXT,
    kpis TEXT,
    raci_role TEXT,
    jd_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 20.4. Work Teams Table
CREATE TABLE IF NOT EXISTS work_teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT DEFAULT 1,
    department_id INT,
    department TEXT,
    name TEXT NOT NULL,
    `lead` TEXT,
    members_count INT DEFAULT 0,
    description TEXT,
    status VARCHAR(255) DEFAULT 'Active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);


-- 20.5. Job Titles Table
CREATE TABLE IF NOT EXISTS job_titles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT DEFAULT 1,
    department_id INT,
    department TEXT,
    title TEXT NOT NULL,
    grade TEXT,
    salary_band TEXT,
    open_positions INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);



-- ================================================================================
-- SECTION 3: PROCESS, SOP, TASK & WORKFLOW MANAGEMENT
-- ================================================================================

-- 21. Standard Operating Procedures (SOPs) Table
CREATE TABLE IF NOT EXISTS sops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    title TEXT NOT NULL,
    department_id INT,
    process_type TEXT,
    owner_id INT,
    approver_id INT,
    objective TEXT,
    scope TEXT,
    roles_responsibilities TEXT,
    required_documentation TEXT,
    reporting_line TEXT,
    tools_channels_used TEXT,
    kpis TEXT,
    flowchart_data TEXT,
    tags TEXT,
    parent_id INT,
    review_date DATETIME,
    status VARCHAR(255) DEFAULT 'Draft',
    version_number VARCHAR(255) DEFAULT '1.0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES sops(id) ON DELETE SET NULL
);


-- 22. SOP Steps Table
CREATE TABLE IF NOT EXISTS sop_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sop_id INT,
    step_number INT NOT NULL,
    step_description TEXT NOT NULL,
    expected_result TEXT,
    attachment_url TEXT,
    required_course_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE CASCADE
);


-- 23. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(255) DEFAULT 'pending',
    priority VARCHAR(255) DEFAULT 'medium',
    due_date DATETIME,
    assigned_to INT,
    sop_step_id INT,
    deal_id INT,
    module_id VARCHAR(191),
    related_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (sop_step_id) REFERENCES sop_steps(id) ON DELETE SET NULL
);


-- 24. Task Checklists Table
CREATE TABLE IF NOT EXISTS task_checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT,
    title TEXT NOT NULL,
    is_completed TINYINT(1) DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);



-- 24.1. Task Comments Table
CREATE TABLE IF NOT EXISTS task_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT,
    user_id INT,
    user_name TEXT,
    comment TEXT NOT NULL,
    attachment_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 25. Process Maps Table
CREATE TABLE IF NOT EXISTS process_maps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    title TEXT NOT NULL,
    description TEXT,
    sop_id INT,
    status VARCHAR(255) DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE CASCADE
);


-- 26. Process Nodes Table
CREATE TABLE IF NOT EXISTS process_nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    map_id INT,
    type VARCHAR(191) NOT NULL,
    label TEXT NOT NULL,
    position_x DOUBLE NOT NULL,
    position_y DOUBLE NOT NULL,
    data JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (map_id) REFERENCES process_maps(id) ON DELETE CASCADE
);


-- 27. Process Edges Table
CREATE TABLE IF NOT EXISTS process_edges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    map_id INT,
    source_node INT,
    target_node INT,
    source_handle TEXT,
    target_handle TEXT,
    label TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (map_id) REFERENCES process_maps(id) ON DELETE CASCADE,
    FOREIGN KEY (source_node) REFERENCES process_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_node) REFERENCES process_nodes(id) ON DELETE CASCADE
);


-- 28. RACI Assignments Table
CREATE TABLE IF NOT EXISTS raci_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    sop_id INT,
    sop_step_id INT,
    role_type TEXT NOT NULL,
    user_id INT,
    role_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT one_accountable_per_entity CHECK (role_type != 'A' OR (sop_id IS NOT NULL OR sop_step_id IS NOT NULL)),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE CASCADE,
    FOREIGN KEY (sop_step_id) REFERENCES sop_steps(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);



-- ================================================================================
-- SECTION 4: PRODUCTS, SERVICES, ORDERS & CRM
-- ================================================================================


-- 28.1. RACI Clarity Survey Table
CREATE TABLE IF NOT EXISTS raci_clarity_survey (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    user_name TEXT,
    score INT NOT NULL,
    feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 29. CRM Stages Table
CREATE TABLE IF NOT EXISTS crm_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name TEXT NOT NULL,
    order_index INT NOT NULL,
    color VARCHAR(255) DEFAULT '#10b981',
    is_won TINYINT(1) DEFAULT FALSE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 30. CRM Customers Table
CREATE TABLE IF NOT EXISTS crm_customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name TEXT NOT NULL,
    email VARCHAR(191),
    phone VARCHAR(191),
    company TEXT,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT crm_customers_email_unique UNIQUE(company_id, email),
    CONSTRAINT crm_customers_phone_unique UNIQUE(company_id, phone),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 31. CRM Leads Table
CREATE TABLE IF NOT EXISTS crm_leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name TEXT NOT NULL,
    email VARCHAR(191),
    status VARCHAR(255) DEFAULT 'new',
    phone TEXT,
    whatsapp TEXT,
    value DOUBLE DEFAULT 0,
    items JSON NULL,
    assigned_to INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT crm_leads_company_email_unique UNIQUE(company_id, email),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);


-- 32. CRM Deals Table
CREATE TABLE IF NOT EXISTS crm_deals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    customer_id INT,
    title TEXT NOT NULL,
    description TEXT,
    value DOUBLE DEFAULT 0,
    stage_id INT,
    assigned_to INT,
    service_type TEXT,
    product TEXT,
    items JSON NULL,
    history_logs JSON NULL,
    reminders JSON NULL,
    sop_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES crm_customers(id) ON DELETE CASCADE,
    FOREIGN KEY (stage_id) REFERENCES crm_stages(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE SET NULL
);


-- Link task deal_id to crm_deals
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_deal 
FOREIGN KEY (deal_id) REFERENCES crm_deals(id) ON DELETE SET NULL;

-- 33. CRM Interactions Table
CREATE TABLE IF NOT EXISTS crm_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    customer_id INT,
    deal_id INT,
    type VARCHAR(191) NOT NULL,
    content TEXT,
    sender_id INT,
    external_id TEXT,
    sentiment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES crm_customers(id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES crm_deals(id) ON DELETE SET NULL,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 34. CRM Attachments Table
CREATE TABLE IF NOT EXISTS crm_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    customer_id INT,
    deal_id INT,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    folder VARCHAR(255) DEFAULT 'Employee Uploads',
    size TEXT,
    file_type TEXT,
    uploaded_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES crm_customers(id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES crm_deals(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);


-- 35. CRM Assignment Rules Table
CREATE TABLE IF NOT EXISTS crm_assignment_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    department_id INT,
    service_type TEXT,
    product TEXT,
    user_id INT,
    is_active TINYINT(1) DEFAULT TRUE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 36. Products & Services Catalog Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name VARCHAR(191) NOT NULL,
    description TEXT,
    sku TEXT,
    price DOUBLE DEFAULT 0,
    cost DOUBLE DEFAULT 0,
    tax DOUBLE DEFAULT 0,
    currency VARCHAR(255) DEFAULT 'EGP',
    category TEXT,
    type VARCHAR(255) DEFAULT 'product',
    status VARCHAR(255) DEFAULT 'active',
    stock_qty INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    service_duration_hours DOUBLE DEFAULT 0,
    sop_id INT,
    process_mapping_id INT,
    is_cost_variable TINYINT(1) DEFAULT FALSE,
    is_price_variable TINYINT(1) DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    has_variants TINYINT(1) DEFAULT FALSE,
    variants JSON NULL,
    is_cost_variable TINYINT(1) DEFAULT FALSE,
    is_price_variable TINYINT(1) DEFAULT FALSE,
    CONSTRAINT products_company_name_unique UNIQUE(company_id, name),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE SET NULL,
    FOREIGN KEY (process_mapping_id) REFERENCES process_maps(id) ON DELETE SET NULL
);


-- 37. Price Lists Table
CREATE TABLE IF NOT EXISTS price_lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name TEXT NOT NULL,
    description TEXT,
    is_active TINYINT(1) DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 38. Price List Items Table
CREATE TABLE IF NOT EXISTS price_list_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    price_list_id INT,
    product_id INT,
    override_price DOUBLE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT price_list_items_unique UNIQUE(price_list_id, product_id),
    FOREIGN KEY (price_list_id) REFERENCES price_lists(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);


-- 39. Promo Codes Table
CREATE TABLE IF NOT EXISTS promo_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    code VARCHAR(191) NOT NULL UNIQUE,
    discount_type VARCHAR(255) DEFAULT 'percentage',
    discount_value DOUBLE NOT NULL,
    expiry_date DATETIME,
    is_active TINYINT(1) DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 40. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    lead_id INT,
    total_amount DOUBLE,
    status VARCHAR(255) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES crm_leads(id) ON DELETE SET NULL
);


-- 41. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    unit_price DOUBLE,
    total_price DOUBLE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);


-- 42. Work Orders Table
CREATE TABLE IF NOT EXISTS work_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    deal_id INT,
    customer_name TEXT,
    title TEXT NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'Pending',
    execution_agent_id INT,
    delivery_agent_id INT,
    items JSON NULL,
    actual_cost_total DOUBLE DEFAULT 0.0,
    sale_value DOUBLE DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES crm_deals(id) ON DELETE SET NULL,
    FOREIGN KEY (execution_agent_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (delivery_agent_id) REFERENCES users(id) ON DELETE SET NULL
);



-- ================================================================================
-- SECTION 5: ACCOUNTING & FINANCIAL MANAGEMENT MODULE
-- ================================================================================


-- 42.1. Operations Stages Table
CREATE TABLE IF NOT EXISTS operation_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name TEXT NOT NULL,
    color VARCHAR(255) DEFAULT '#3b82f6',
    order_index INT DEFAULT 0,
    is_completed TINYINT(1) DEFAULT FALSE
);


-- 42.2. Work Order QA Tickets Table
CREATE TABLE IF NOT EXISTS work_order_qa_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    work_order_id INT,
    title TEXT NOT NULL,
    description TEXT,
    status VARCHAR(255) NOT NULL DEFAULT 'Open',
    severity VARCHAR(255) DEFAULT 'medium',
    reported_by INT,
    assigned_to INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);


-- 43. Chart of Accounts (COA) Table
CREATE TABLE IF NOT EXISTS acct_coa (
    id VARCHAR(191) NOT NULL,
    company_id INT,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    type VARCHAR(191) NOT NULL,
    is_active TINYINT(1) DEFAULT TRUE,
    parent_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 44. Banks & Wallets Table
CREATE TABLE IF NOT EXISTS acct_banks_wallets (
    id VARCHAR(191) NOT NULL,
    company_id INT,
    name_en TEXT NOT NULL,
    name_ar TEXT,
    type VARCHAR(191) NOT NULL,
    currency VARCHAR(255) DEFAULT 'SAR',
    account_number TEXT,
    iban TEXT,
    bank_name TEXT,
    balance DOUBLE DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 45. Journal Entries Table
CREATE TABLE IF NOT EXISTS acct_journal_entries (
    id VARCHAR(191) NOT NULL,
    company_id INT,
    date DATE NOT NULL,
    reference TEXT,
    description TEXT,
    `lines` JSON NULL,
    is_system TINYINT(1) DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 46. Invoices Table
CREATE TABLE IF NOT EXISTS acct_invoices (
    id VARCHAR(191) NOT NULL,
    company_id INT,
    customer_name TEXT NOT NULL,
    customer_id TEXT,
    deal_id TEXT,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    items JSON NULL,
    subtotal DOUBLE DEFAULT 0,
    vat_amount DOUBLE DEFAULT 0,
    discount_amount DOUBLE DEFAULT 0,
    total_amount DOUBLE DEFAULT 0,
    status VARCHAR(255) DEFAULT 'draft',
    reminder_sent TINYINT(1) DEFAULT FALSE,
    currency VARCHAR(255) DEFAULT 'SAR',
    exchange_rate DOUBLE DEFAULT 1,
    vat_number TEXT,
    po_number TEXT,
    payment_terms TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 47. Bills Table
CREATE TABLE IF NOT EXISTS acct_bills (
    id VARCHAR(191) NOT NULL,
    company_id INT,
    supplier_name TEXT NOT NULL,
    account_id TEXT NOT NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    description TEXT,
    amount DOUBLE DEFAULT 0,
    vat_rate DOUBLE DEFAULT 15,
    vat_amount DOUBLE DEFAULT 0,
    total_amount DOUBLE DEFAULT 0,
    status VARCHAR(255) DEFAULT 'unpaid',
    is_copq TINYINT(1) DEFAULT FALSE,
    ncr_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 48. Bank Statements Table
CREATE TABLE IF NOT EXISTS acct_bank_statements (
    id VARCHAR(191) NOT NULL,
    company_id INT,
    date DATE NOT NULL,
    description TEXT,
    amount DOUBLE NOT NULL,
    reconciled TINYINT(1) DEFAULT FALSE,
    matched_journal_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 49. Financial Report Notes Table
CREATE TABLE IF NOT EXISTS acct_report_notes (
    company_id INT,
    period VARCHAR(191) NOT NULL,
    notes JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (company_id, period),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);



-- ================================================================================
-- SECTION 6: RISK REGISTER, QUALITY ASSURANCE (QA) & KAIZEN IMPROVEMENT
-- ================================================================================

-- 50. Key Performance Indicators (KPIs) Table
CREATE TABLE IF NOT EXISTS kpis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name TEXT NOT NULL,
    target_value DOUBLE NOT NULL,
    actual_value DOUBLE DEFAULT 0,
    source TEXT,
    frequency TEXT,
    owner_id INT,
    department_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);


-- 51. KPI History Table
CREATE TABLE IF NOT EXISTS kpi_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    kpi_id INT,
    value DOUBLE NOT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE
);


-- 52. Risks Register Table
CREATE TABLE IF NOT EXISTS risks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    department_id INT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    probability INT DEFAULT 1,
    impact INT DEFAULT 1,
    risk_score INT GENERATED ALWAYS AS (probability * impact) STORED,
    mitigation_plan TEXT,
    contingency_plan TEXT,
    owner_id INT,
    sop_id INT,
    kpi_id INT,
    status VARCHAR(255) DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE SET NULL,
    FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE SET NULL
);


-- 53. Risk Log Table
CREATE TABLE IF NOT EXISTS risk_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    description TEXT NOT NULL,
    probability TEXT,
    impact TEXT,
    mitigation_plan TEXT,
    owner_id INT,
    status VARCHAR(255) DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 54. QA Forms Table
CREATE TABLE IF NOT EXISTS qa_forms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    title TEXT NOT NULL,
    department_id INT,
    items JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);


-- 55. QA Evaluations Table
CREATE TABLE IF NOT EXISTS qa_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    form_id INT,
    reviewer_id INT,
    employee_id INT,
    process_name TEXT,
    department_id INT,
    interaction_id INT,
    scores JSON NULL,
    total_score DOUBLE,
    comments TEXT,
    status VARCHAR(255) DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (form_id) REFERENCES qa_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (interaction_id) REFERENCES crm_interactions(id) ON DELETE SET NULL
);


-- 56. QA Non-Conformance Reports (NCR) Table
CREATE TABLE IF NOT EXISTS qa_ncr (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    evaluation_id INT,
    description TEXT NOT NULL,
    severity VARCHAR(255) DEFAULT 'medium',
    reported_by INT,
    assigned_to INT,
    status VARCHAR(255) DEFAULT 'open',
    risk_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluation_id) REFERENCES qa_evaluations(id) ON DELETE SET NULL,
    FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (risk_id) REFERENCES risk_log(id) ON DELETE SET NULL
);


-- 57. QA Corrective and Preventive Actions (CAPA) Table
CREATE TABLE IF NOT EXISTS qa_capa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    ncr_id INT,
    title TEXT NOT NULL,
    department_id INT,
    root_cause TEXT NOT NULL,
    action_plan TEXT NOT NULL,
    assigned_to INT,
    status VARCHAR(255) DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (ncr_id) REFERENCES qa_ncr(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);


-- 57.1. QA Transaction Audits Table
CREATE TABLE IF NOT EXISTS qa_transaction_audits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(191) NOT NULL, -- 'complaint', 'delay', 'refund', 'cancellation'
    transaction_id VARCHAR(191) NOT NULL,
    agent_name TEXT,
    customer_name TEXT,
    order_amount DECIMAL(14,2) DEFAULT 0,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    sla_status VARCHAR(255) DEFAULT 'Met SLA',
    auditor_name TEXT,
    qa_status VARCHAR(255) DEFAULT 'Pass',
    department VARCHAR(255) DEFAULT 'Operations',
    root_cause TEXT,
    sub_reason TEXT,
    error_classification TEXT,
    switches JSON NULL,
    refund_amount DECIMAL(14,2) DEFAULT 0,
    corrective_action TEXT,
    manager_approval VARCHAR(255) DEFAULT 'Pending',
    assigned_manager TEXT,
    current_step INT DEFAULT 1,
    workflow_status VARCHAR(255) DEFAULT 'Under Review',
    action_plan_required TINYINT(1) DEFAULT FALSE,
    action_plan_type VARCHAR(255) DEFAULT 'Training Action',
    customer_phone TEXT,
    owner TEXT,
    request_type TEXT,
    request_sub_type TEXT,
    request_date DATETIME,
    operations_status TEXT,
    operation_owner TEXT,
    survey_date DATETIME,
    refund_reason TEXT,
    refund_sub_reason TEXT,
    lose_on_employee TINYINT(1) DEFAULT FALSE,
    lose_employee_id TEXT,
    lose_employee_name TEXT,
    lose_status VARCHAR(255) DEFAULT 'Accepted',
    lose_amount DECIMAL(14,2) DEFAULT 0,
    action_required TEXT,
    qa_reference_number VARCHAR(191),
    handled_by TEXT,
    agent_id TEXT,
    auditor_id TEXT,
    reviewer_id TEXT,
    owner_id TEXT,
    details JSON NULL,
    comment TEXT,
    status_on_system VARCHAR(255),
    system_remarks TEXT,
    rating DOUBLE,
    category VARCHAR(255),
    bucket_1_category VARCHAR(255),
    bucket_2_area VARCHAR(255),
    bucket_3_root_cause VARCHAR(255),
    other_reason TEXT,
    manager_notes TEXT,
    complaint_reason TEXT,
    cancellation_reason TEXT,
    delay_reason TEXT,
    channel VARCHAR(255),
    priority VARCHAR(64),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE VIEW qa_transactions_audit AS SELECT * FROM qa_transaction_audits;


-- 57.2. QA Root Cause Presets (Audit Checklists)
CREATE TABLE IF NOT EXISTS qa_root_cause_presets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(191) NOT NULL, -- 'complaint', 'delay', 'refund', 'cancellation'
    department TEXT NOT NULL,
    root_cause_name TEXT NOT NULL,
    sub_reasons JSON NULL,
    weight DECIMAL(14,2) DEFAULT 100,
    is_active TINYINT(1) DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- 57.3. QA NPS & CSAT Feedbacks Table
CREATE TABLE IF NOT EXISTS qa_nps_feedbacks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(191) NOT NULL,
    customer_name TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    rating INT NOT NULL,
    category TEXT,
    feedback_text TEXT,
    comment TEXT,
    delay_linked TINYINT(1) DEFAULT FALSE,
    root_cause TEXT,
    corrective_action TEXT,
    qa_reference_number VARCHAR(191),
    auditor_name VARCHAR(255) DEFAULT 'Sarah Jenkins',
    status VARCHAR(255) DEFAULT 'Reviewed',
    agent_id TEXT,
    owner TEXT,
    operations_owner TEXT,
    owner_id TEXT,
    details JSON NULL,
    survey_date DATETIME,
    date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- 57.4. QA Action Plans (Incident Audit & QA Stepper)
CREATE TABLE IF NOT EXISTS qa_action_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_code TEXT NOT NULL,
    title TEXT NOT NULL,
    incident_type TEXT NOT NULL, -- 'complaint', 'delay', 'refund', 'cancellation', 'nps'
    transaction_id VARCHAR(191),
    audit_id INT,
    checklist_id INT,
    customer_name TEXT,
    agent_name TEXT,
    department VARCHAR(255) DEFAULT 'Operations',
    severity VARCHAR(255) DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
    status VARCHAR(255) DEFAULT 'Open', -- 'Draft', 'Root Cause Analysis', 'In Progress', 'Verification', 'Closed'
    current_step INT DEFAULT 1, -- 1: Detection, 2: Root Cause, 3: Action Rules, 4: Action Details & Tasks, 5: Verification & Closure
    action_plan_type VARCHAR(255) DEFAULT 'Quality Action',
    agent_id TEXT,
    owner_id TEXT,
    reviewer_id TEXT,
    root_cause_category TEXT,
    root_cause_name TEXT,
    root_cause_analysis TEXT,
    five_whys JSON NULL,
    action_rules JSON NULL,
    action_details JSON NULL,
    verification_notes TEXT,
    verified_by TEXT,
    verified_at DATETIME,
    effectiveness_score INT DEFAULT 100,
    assigned_to TEXT,
    target_completion_date DATE,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (audit_id) REFERENCES qa_transaction_audits(id) ON DELETE SET NULL,
    FOREIGN KEY (checklist_id) REFERENCES qa_root_cause_presets(id) ON DELETE SET NULL
);


-- 57.5. QA Action Rules Engine Table
CREATE TABLE IF NOT EXISTS qa_action_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name TEXT NOT NULL,
    incident_type VARCHAR(255) NOT NULL DEFAULT 'all', -- 'all', 'complaint', 'delay', 'refund', 'cancellation', 'nps'
    trigger_condition TEXT NOT NULL,
    severity_level VARCHAR(255) DEFAULT 'Medium',
    assigned_department TEXT,
    assigned_role TEXT,
    sla_hours INT DEFAULT 24,
    default_root_cause TEXT,
    auto_actions JSON NULL,
    is_active TINYINT(1) DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);



-- 57.6. QA Field Options Table (Configurable Dropdown Values)
CREATE TABLE IF NOT EXISTS qa_field_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    field_key VARCHAR(191) NOT NULL,
    option_value VARCHAR(191) NOT NULL,
    option_label TEXT NOT NULL,
    is_default TINYINT(1) DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT qa_field_options_unique UNIQUE(field_key, option_value)
);


-- 57.7. QA Action Options Table
CREATE TABLE IF NOT EXISTS qa_action_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_name VARCHAR(191) NOT NULL UNIQUE,
    category VARCHAR(255) DEFAULT 'General',
    description TEXT,
    auto_plan_type VARCHAR(255) DEFAULT 'Quality Action',
    is_active TINYINT(1) DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- 57.8. QA Employee Recommendations Table
CREATE TABLE IF NOT EXISTS qa_employee_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    employee_name TEXT,
    department TEXT,
    author_name TEXT,
    title TEXT,
    content TEXT NOT NULL,
    priority VARCHAR(255) DEFAULT 'Medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- 58. Kaizen Suggestions Table
CREATE TABLE IF NOT EXISTS kaizen_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    title TEXT NOT NULL,
    problem_description TEXT,
    proposed_solution TEXT,
    expected_benefit TEXT,
    submitted_by INT,
    department_id INT,
    sop_id INT,
    status VARCHAR(255) DEFAULT 'New',
    priority VARCHAR(255) DEFAULT 'Medium',
    score INT DEFAULT 0,
    impact_time_saving DOUBLE,
    impact_cost_saving DOUBLE,
    kpi_id INT,
    improvement_type VARCHAR(255) DEFAULT 'Time Reduction',
    impact_rating INT DEFAULT 3,
    effort_rating INT DEFAULT 3,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE SET NULL
);


-- 59. Kaizen PDCA Cycles Table
CREATE TABLE IF NOT EXISTS kaizen_pdca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    suggestion_id INT,
    phase TEXT NOT NULL,
    description TEXT,
    status VARCHAR(255) DEFAULT 'Pending',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (suggestion_id) REFERENCES kaizen_suggestions(id) ON DELETE CASCADE
);



-- ================================================================================
-- SECTION 7: TRAINING HUB & LMS MODULE
-- ================================================================================

-- 60. Training Courses Table
CREATE TABLE IF NOT EXISTS training_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    sop_id INT,
    title TEXT NOT NULL,
    description TEXT,
    objectives TEXT,
    material_url TEXT,
    department_id INT,
    passing_score INT DEFAULT 80,
    points_reward INT DEFAULT 10,
    status VARCHAR(255) DEFAULT 'Draft',
    category VARCHAR(255) DEFAULT 'Upcoming Training',
    start_date DATETIME,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (sop_id) REFERENCES sops(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);


-- Link sop step required course to training courses
ALTER TABLE sop_steps 
ADD CONSTRAINT fk_sop_steps_course 
FOREIGN KEY (required_course_id) REFERENCES training_courses(id) ON DELETE SET NULL;

-- 61. Course Enrollments Table
CREATE TABLE IF NOT EXISTS course_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    course_id INT,
    user_id INT,
    status VARCHAR(255) DEFAULT 'Scheduled',
    score INT,
    progress INT DEFAULT 0,
    cost INT DEFAULT 0,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT course_enrollments_course_user_unique UNIQUE(course_id, user_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 62. Training Modules Table
CREATE TABLE IF NOT EXISTS training_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    course_id INT,
    title TEXT NOT NULL,
    sop_step_id INT,
    order_index INT DEFAULT 0,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (sop_step_id) REFERENCES sop_steps(id) ON DELETE SET NULL
);


-- 63. Training Lessons Table
CREATE TABLE IF NOT EXISTS training_lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT,
    title TEXT NOT NULL,
    content_type VARCHAR(255) DEFAULT 'video',
    content_url TEXT,
    content_body TEXT,
    order_index INT DEFAULT 0,
    FOREIGN KEY (module_id) REFERENCES training_modules(id) ON DELETE CASCADE
);


-- 64. Training Lesson Progress Table
CREATE TABLE IF NOT EXISTS training_lesson_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    enrollment_id INT,
    lesson_id INT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT training_lesson_progress_unique UNIQUE(enrollment_id, lesson_id),
    FOREIGN KEY (enrollment_id) REFERENCES course_enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES training_lessons(id) ON DELETE CASCADE
);


-- 65. Training Quizzes Table
CREATE TABLE IF NOT EXISTS training_quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    course_id INT,
    module_id INT,
    title TEXT NOT NULL,
    description TEXT,
    department_id INT,
    passing_score INT DEFAULT 80,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES training_modules(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);


-- 66. Training Questions Table
CREATE TABLE IF NOT EXISTS training_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT,
    question_text TEXT NOT NULL,
    question_type VARCHAR(255) DEFAULT 'multiple_choice',
    correct_answer TEXT,
    options JSON NULL,
    mask_value TINYINT(1) DEFAULT false,
    explanation TEXT,
    FOREIGN KEY (quiz_id) REFERENCES training_quizzes(id) ON DELETE CASCADE
);


-- 67. Training Quiz Attempts Table
CREATE TABLE IF NOT EXISTS training_quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    quiz_id INT,
    user_id INT,
    score INT,
    passed TINYINT(1),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES training_quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



-- ================================================================================
-- SECTION 8: COMMUNICATION, CHAT & MEETINGS
-- ================================================================================

-- 68. Chat Rooms Table
CREATE TABLE IF NOT EXISTS chat_rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name TEXT,
    type VARCHAR(191) NOT NULL,
    department_id INT,
    context_type TEXT,
    context_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);


-- 69. User Presence Table
CREATE TABLE IF NOT EXISTS user_presence (
    user_id INT PRIMARY KEY,
    company_id INT,
    status VARCHAR(255) DEFAULT 'offline',
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 70. Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    room_id INT,
    sender_id INT,
    content TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_type TEXT,
    mentions JSON NULL,
    is_system_message TINYINT(1) DEFAULT FALSE,
    is_announcement TINYINT(1) DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 71. Chat Message Reactions Table
CREATE TABLE IF NOT EXISTS chat_message_reactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT,
    user_id INT,
    emoji VARCHAR(191) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_reactions_msg_user_emoji_unique UNIQUE(message_id, user_id, emoji),
    FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 72. Internal Messages Table
CREATE TABLE IF NOT EXISTS internal_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    sender_id INT,
    receiver_id INT,
    subject TEXT,
    content TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 73. Company Meetings Table
CREATE TABLE IF NOT EXISTS company_meetings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    title TEXT NOT NULL,
    description TEXT,
    meeting_time DATETIME NOT NULL,
    type VARCHAR(255) NOT NULL DEFAULT 'online',
    meeting_link TEXT,
    location TEXT,
    ai_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 74. Meeting Attendees Table
CREATE TABLE IF NOT EXISTS meeting_attendees (
    meeting_id INT,
    user_id INT,
    PRIMARY KEY (meeting_id, user_id),
    FOREIGN KEY (meeting_id) REFERENCES company_meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);



-- ================================================================================
-- SECTION 9: KNOWLEDGE BASE MODULE
-- ================================================================================

-- 75. Knowledge Base Article Categories Table
CREATE TABLE IF NOT EXISTS article_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name VARCHAR(191) NOT NULL,
    description TEXT,
    department_id INT,
    parent_id INT,
    CONSTRAINT article_categories_company_name_unique UNIQUE(company_id, name),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_id) REFERENCES article_categories(id) ON DELETE SET NULL
);


-- 76. Knowledge Articles Table
CREATE TABLE IF NOT EXISTS knowledge_articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    title TEXT NOT NULL,
    content TEXT,
    category_id INT,
    author_id INT,
    approver_id INT,
    status VARCHAR(255) DEFAULT 'Draft',
    content_type VARCHAR(255) DEFAULT 'Article',
    external_url TEXT,
    tags TEXT,
    attachments TEXT,
    related_sop_id INT,
    visible_departments VARCHAR(255) DEFAULT '[]',
    product_id INT,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES article_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (related_sop_id) REFERENCES sops(id) ON DELETE SET NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);


-- 77. Knowledge Article Revisions Table
CREATE TABLE IF NOT EXISTS knowledge_article_revisions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    article_id INT,
    version_number INT NOT NULL,
    content TEXT,
    change_summary TEXT,
    updated_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES knowledge_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);



-- ================================================================================
-- SECTION 10: RECRUITMENT ENGINE MODULE
-- ================================================================================

-- 78. HR Job Openings Table
CREATE TABLE IF NOT EXISTS hr_job_openings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    title TEXT NOT NULL,
    department_id INT,
    headcount_needed INT DEFAULT 1,
    status VARCHAR(255) DEFAULT 'Active',
    salary_range TEXT,
    experience_requirements TEXT,
    description TEXT,
    requirements TEXT,
    budget_status VARCHAR(255) DEFAULT 'Pending Approval',
    description_blocks VARCHAR(255) DEFAULT '[]',
    location VARCHAR(255) DEFAULT 'Marseille, Provence',
    employment_type VARCHAR(255) DEFAULT 'Full-Time',
    hiring_lead VARCHAR(255) DEFAULT 'Debra Tuescher',
    days_open INT DEFAULT 7,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);


-- 79. HR Candidates Table
CREATE TABLE IF NOT EXISTS hr_candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    job_opening_id INT,
    name TEXT NOT NULL,
    email VARCHAR(191) UNIQUE,
    linkedin_url TEXT,
    cv_url TEXT,
    stage VARCHAR(255) DEFAULT 'Applied',
    score DECIMAL(14,2) DEFAULT 0,
    notes TEXT,
    phone VARCHAR(255) DEFAULT '+33 4 567 4321',
    location VARCHAR(255) DEFAULT 'Marseille, Provence',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (job_opening_id) REFERENCES hr_job_openings(id) ON DELETE CASCADE
);


-- 80. HR Interviews Table
CREATE TABLE IF NOT EXISTS hr_interviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    candidate_id INT,
    title TEXT,
    interview_date DATETIME NOT NULL,
    interviewer_id INT,
    meeting_link TEXT,
    notes TEXT,
    technical_score INT,
    technical_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES hr_candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (interviewer_id) REFERENCES users(id) ON DELETE SET NULL
);


-- 81. HR Candidate Comments Table
CREATE TABLE IF NOT EXISTS hr_candidate_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    candidate_id INT,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES hr_candidates(id) ON DELETE CASCADE
);


-- 82. HR Candidate Audit Logs Table
CREATE TABLE IF NOT EXISTS hr_candidate_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    candidate_id INT,
    action_type TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES hr_candidates(id) ON DELETE CASCADE
);


-- 83. HR Candidate Emails Table
CREATE TABLE IF NOT EXISTS hr_candidate_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    candidate_id INT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    status VARCHAR(255) DEFAULT 'Sent',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES hr_candidates(id) ON DELETE CASCADE
);


-- 84. HR Email Templates Table
CREATE TABLE IF NOT EXISTS hr_email_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 85. HR Email Config Table
CREATE TABLE IF NOT EXISTS hr_email_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    smtp_host TEXT,
    smtp_port INT,
    smtp_user TEXT,
    smtp_pass TEXT,
    sender_name TEXT,
    sender_email TEXT,
    is_active TINYINT(1) DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);



-- ================================================================================
-- SECTION 11: AUTOMATION, INTEGRATIONS, GLOBAL STATUSES & AI AGENTS
-- ================================================================================

-- 86. Automation Rules Table
CREATE TABLE IF NOT EXISTS automation_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    conditions JSON NULL,
    actions JSON NULL,
    is_active TINYINT(1) DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 87. Automation Logs Table
CREATE TABLE IF NOT EXISTS automation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    rule_id INT,
    trigger_data JSON,
    execution_status TEXT,
    error_message TEXT,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
);


-- 88. Integrations Table
CREATE TABLE IF NOT EXISTS integrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    name VARCHAR(191) NOT NULL,
    type VARCHAR(191) NOT NULL,
    status VARCHAR(255) DEFAULT 'disconnected',
    config JSON NULL,
    last_sync DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT integrations_company_name_unique UNIQUE(company_id, name),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 89. Integration Webhooks Table
CREATE TABLE IF NOT EXISTS integration_webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    integration_id INT,
    hook_url TEXT NOT NULL,
    event_type TEXT NOT NULL,
    secret_key TEXT,
    is_active TINYINT(1) DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
);


-- 90. Integration Audit Logs Table
CREATE TABLE IF NOT EXISTS integration_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    integration_id INT,
    action TEXT NOT NULL,
    status VARCHAR(191) NOT NULL,
    details TEXT,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE
);


-- 91. Global Statuses Engine
CREATE TABLE IF NOT EXISTS global_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    module_id VARCHAR(255) NOT NULL DEFAULT 'crm',
    status_key VARCHAR(191) NOT NULL,
    value VARCHAR(255) NOT NULL DEFAULT '',
    label TEXT NOT NULL,
    color VARCHAR(255) DEFAULT '#64748b',
    is_default TINYINT(1) DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT global_statuses_module_key_unique UNIQUE(module_id, status_key),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 92. Company AI Agents Table
CREATE TABLE IF NOT EXISTS company_ai_agents (
    id VARCHAR(64) PRIMARY KEY,
    company_id INT,
    agent_role TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    is_active TINYINT(1) DEFAULT TRUE,
    system_prompt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);



-- ================================================================================
-- MARKETING CAMPAIGNS & CONTENT MANAGEMENT MODULE
-- ================================================================================

-- 93. Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    title TEXT NOT NULL,
    goal TEXT,
    platform TEXT NOT NULL,
    budget DECIMAL(14,2) DEFAULT 0,
    spend DECIMAL(14,2) DEFAULT 0,
    leads_generated INT DEFAULT 0,
    sales_value DECIMAL(14,2) DEFAULT 0,
    status VARCHAR(255) DEFAULT 'Planning',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 94. Marketing Content Table
CREATE TABLE IF NOT EXISTS marketing_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    campaign_id INT,
    title TEXT NOT NULL,
    platform TEXT NOT NULL,
    content_text TEXT,
    publish_date DATE,
    status VARCHAR(255) DEFAULT 'Draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE
);


-- 95. Marketing Attachments Table
CREATE TABLE IF NOT EXISTS marketing_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    campaign_id INT,
    content_id INT,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    uploaded_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES marketing_content(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);


-- ================================================================================
-- AI BUSINESS & BOARDROOM ADVISOR MODULE
-- ================================================================================

-- 96. AI Business Strategy Sessions Table
CREATE TABLE IF NOT EXISTS ai_business_sessions (
    id VARCHAR(64) PRIMARY KEY,
    company_id INT,
    seed_input TEXT NOT NULL,
    answers JSON NULL,
    is_satisfied TINYINT(1) DEFAULT FALSE,
    scope_document TEXT,
    agent_analysis TEXT,
    result_data JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);


-- 97. AI Boardroom Strategic Meetings Table
CREATE TABLE IF NOT EXISTS ai_boardroom_meetings (
    id VARCHAR(64) PRIMARY KEY,
    company_id INT,
    meeting_goal TEXT NOT NULL,
    apply_directives TINYINT(1) DEFAULT TRUE,
    transcript JSON NULL,
    db_actions_log JSON NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);



-- ================================================================================
-- ADDITIONAL SYSTEM, AUTH, BIOMETRIC & CHAT TABLES
-- ================================================================================

CREATE TABLE IF NOT EXISTS _systo_schema_meta (
    `key` VARCHAR(191) PRIMARY KEY,
    version INT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_email_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL,
    otp_code VARCHAR(32) NOT NULL,
    attempts INT DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS qa_integration_settings (
    `key` VARCHAR(191) PRIMARY KEY,
    config JSON NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_room_members (
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hr_biometric_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    device_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(191),
    model VARCHAR(255),
    mac_address VARCHAR(191),
    ip_address VARCHAR(191),
    port INT DEFAULT 4370,
    comm_key VARCHAR(64) DEFAULT '0',
    firmware_platform VARCHAR(191),
    fingerprint_algorithm VARCHAR(191),
    manufacturer VARCHAR(191),
    connection_mode VARCHAR(64) DEFAULT 'lan_bridge',
    status VARCHAR(64) DEFAULT 'offline',
    last_seen_at DATETIME,
    last_sync_at DATETIME,
    punches_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hr_biometric_punches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT,
    device_sn VARCHAR(191),
    device_id INT,
    user_pin VARCHAR(191) NOT NULL,
    punch_time DATETIME NOT NULL,
    punch_type INT DEFAULT 0,
    verify_type INT DEFAULT 1,
    matched_user_id INT,
    sync_status VARCHAR(64) DEFAULT 'processed',
    raw_line TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES hr_biometric_devices(id) ON DELETE SET NULL,
    FOREIGN KEY (matched_user_id) REFERENCES users(id) ON DELETE SET NULL
);

INSERT IGNORE INTO _systo_schema_meta (`key`, version) VALUES ('schema_version', 28);

-- ================================================================================
-- ESSENTIAL SEED & INITIAL DATA (Safe Idempotent Inserts: ON CONFLICT DO NOTHING)
-- ================================================================================

-- 1. Initial Company Anchor
INSERT IGNORE INTO companies (id, name, subdomain) VALUES (1, 'Main Office', 'main') 
;

-- 2. Core System Roles
INSERT IGNORE INTO roles (id, name, permissions) VALUES (1, 'Admin', '["all"]'),
(2, 'Manager', '["read:all", "write:all", "delete:own"]'),
(3, 'Employee', '["read:own", "write:own"]')
;

-- 3. Core System Departments
INSERT IGNORE INTO departments (id, company_id, name, description, is_executive, teams, job_titles) VALUES (1, 1, 'Executive Leadership', 'Corporate governance and executive board', true, '["Executive Board"]', '["Chief Executive Officer (CEO)"]'),
(2, 1, 'Operations', 'General business and service operations', false, '["Dispatch & Delivery", "Service Fulfillment"]', '["Operations Lead", "Operations Officer"]'),
(3, 1, 'Quality Assurance', 'Audits, incident investigation, NPS and compliance', false, '["QA Audit Team", "Quality Control"]', '["QA Manager", "Quality Specialist"]'),
(4, 1, 'Customer Support', 'Customer care, inquiries and ticketing', false, '["Support Agents", "Helpdesk"]', '["Support Lead", "Customer Service Agent"]'),
(5, 1, 'Sales & CRM', 'Inbound leads, client relations and revenue', false, '["Direct Sales", "Account Executives"]', '["Sales Director", "Account Manager"]'),
(6, 1, 'Human Resources', 'Talent, recruitment, payroll and personnel', false, '["People Operations", "Recruitment"]', '["HR Director", "HR Specialist"]')
;

-- Reset sequences to prevent duplicate key errors on future inserts

-- 4. Initial System Administrator User (Password: core123)
INSERT IGNORE INTO users (id, company_id, name, email, password, role_id, department_id, job_title, is_super_admin, status) VALUES (1, 1, 'System Administrator', 'admin@gmail.com', '$2a$10$8.tXG.S6W8/S/6Fm6V6V6u.6V6V6V6V6V6V6V6V6V6V6V6V6', 1, 1, 'Chief Executive Officer', true, 'active')
;

-- 5. Core System Modules
INSERT IGNORE INTO system_modules (id, name, is_active, order_index) VALUES ('dashboard', 'Dashboard', true, 1),
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
;

-- 6. Default Operations Stages
INSERT IGNORE INTO operation_stages (id, name, color, order_index, is_completed) VALUES (1, 'Intake & Verification', '#3b82f6', 1, false),
(2, 'Processing & Preparation', '#6366f1', 2, false),
(3, 'Quality Inspection', '#f59e0b', 3, false),
(4, 'Dispatch & Delivery', '#10b981', 4, false),
(5, 'Completed', '#059669', 5, true)
;

-- 7. Default QA Field Options
INSERT IGNORE INTO qa_field_options (field_key, option_value, option_label, is_default) VALUES ('qa_status', 'Pass', 'Pass', true),
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
;

-- 8. Default QA Action Options
INSERT IGNORE INTO qa_action_options (action_name, category, description, auto_plan_type, is_active) VALUES ('Training Action', 'Quality Training', 'Schedule coaching or training session for employee', 'Training Action', true),
('Re-inspection Required', 'Audit & Inspection', 'Mandatory secondary quality review before sign-off', 'Quality Action', true),
('Process Revision', 'Process & SOP', 'Update standard operating procedure to prevent recurrence', 'Kaizen Improvement', true),
('Manager Escalation', 'Management Review', 'Direct intervention by department head or supervisor', 'Management Review', true)
;

-- 9. Default Global Statuses
INSERT IGNORE INTO global_statuses (module_id, status_key, value, label, color, is_default, order_index) VALUES ('crm', 'lead_new', 'new', 'New Lead', '#3b82f6', true, 1),
('crm', 'lead_contacted', 'contacted', 'Contacted', '#6366f1', false, 2),
('crm', 'lead_qualified', 'qualified', 'Qualified', '#10b981', false, 3),
('crm', 'lead_lost', 'lost', 'Lost', '#ef4444', false, 4),
('tasks', 'task_todo', 'todo', 'To Do', '#64748b', true, 1),
('tasks', 'task_in_progress', 'in_progress', 'In Progress', '#f59e0b', false, 2),
('tasks', 'task_done', 'done', 'Completed', '#10b981', false, 3)
;

-- 10. Default HR Payroll Config
INSERT IGNORE INTO hr_payroll_config (company_id, start_day, late_deduction_per_hour, absence_penalty_multiplier, early_departure_deduction) VALUES (1, 1, 15, 1.0, 10)
;

-- 11. Performance Optimization Indexes
-- Frequent lookup indexes on company_id, user_id, status, and join keys
CREATE INDEX idx_tasks_company_id ON tasks(company_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_company_status ON tasks(company_id, status);
CREATE INDEX idx_tasks_company_created ON tasks(company_id, created_at DESC);

CREATE INDEX idx_departments_company_id ON departments(company_id);
CREATE INDEX idx_departments_head ON departments(department_head_id);
CREATE INDEX idx_departments_comp_name ON departments(company_id, name);

CREATE INDEX idx_hr_custom_field_values_company_id ON hr_custom_field_values(company_id);
CREATE INDEX idx_hr_custom_field_values_entity_id ON hr_custom_field_values(entity_id);
CREATE INDEX idx_hr_custom_field_values_field_id ON hr_custom_field_values(field_id);
CREATE INDEX idx_hr_custom_field_values_lookup ON hr_custom_field_values(entity_id, field_id);

CREATE INDEX idx_roles_company_id ON roles(company_id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_qa_root_cause_presets_type_active ON qa_root_cause_presets(type, is_active);
CREATE INDEX idx_notifications_user_company ON notifications(user_id, company_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- ================================================================================
-- END OF SCHEMA DEFINITION
-- ================================================================================

SET FOREIGN_KEY_CHECKS = 1;
