// Global Generic HR Module Metadata Registry
// Defines default sections, fields, tables, and actions for each HR page

export interface SchemaFieldItem {
  id: string;
  label: string;
  type: 'field' | 'table';
  dataType?: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'currency' | 'email';
  permLevel?: number; // 0 to 4
  ownOnly?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  isRequired?: boolean;
  maskValue?: boolean;
  allowOnSubmit?: boolean;
  options?: string[];
  isCustom?: boolean;
}

export interface SchemaActionItem {
  id?: number | string;
  action_key: string;
  tab_id: string;
  section_name: string;
  label_en: string;
  label_ar?: string;
  state: 'active' | 'disabled' | 'hidden';
  permission_scope: 'super_admin' | 'direct_manager' | 'self' | 'everyone';
  tooltip_text?: string;
  order_index?: number;
  isCustom?: boolean;
}

export interface SchemaSectionItem {
  name: string;
  description?: string;
  items: SchemaFieldItem[];
  actions?: SchemaActionItem[];
}

export interface SchemaSubTabItem {
  id: string;
  label: string;
  description?: string;
  sections: SchemaSectionItem[];
}

export interface ModuleSchemaConfig {
  pageKey: string;
  displayName: string;
  description: string;
  subTabs: SchemaSubTabItem[];
}

export const HR_MODULE_REGISTRY: Record<string, ModuleSchemaConfig> = {
  // =========================================================================
  // 1. Departments & Structure (/hr/departments)
  // =========================================================================
  departments: {
    pageKey: 'departments',
    displayName: 'Departments & Structure',
    description: 'Manage business departments, work teams, job titles, and job descriptions hierarchy.',
    subTabs: [
      {
        id: 'departments_list',
        label: 'Departments List',
        description: 'Organizational divisions, business units, and department trees',
        sections: [
          {
            name: 'General Information',
            items: [
              { id: 'dept_name', label: 'Department Name', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'dept_code', label: 'Department Code', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'dept_parent', label: 'Parent Department / Division', type: 'field', dataType: 'select', permLevel: 0 },
              { id: 'dept_head', label: 'Department Head / Director', type: 'field', dataType: 'select', permLevel: 1 },
              { id: 'dept_location', label: 'Primary Branch / Location', type: 'field', dataType: 'select', permLevel: 0 },
              { id: 'dept_status', label: 'Operational Status', type: 'field', dataType: 'select', permLevel: 0 },
              { id: 'dept_description', label: 'Department Mission & Objectives', type: 'field', dataType: 'text', permLevel: 0 }
            ],
            actions: [
              { action_key: 'act_dept_add_new', tab_id: 'departments_list', section_name: 'General Information', label_en: 'Add New Department', label_ar: 'إضافة قسم جديد', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_dept_structure_settings', tab_id: 'departments_list', section_name: 'General Information', label_en: 'Structure Settings', label_ar: 'إعدادات الهيكل التنظيمي', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_dept_export_list', tab_id: 'departments_list', section_name: 'General Information', label_en: 'Export Departments', label_ar: 'تصدير قائمة الأقسام', state: 'active', permission_scope: 'everyone' }
            ]
          },
          {
            name: 'Headcount & Budgets',
            items: [
              { id: 'dept_target_headcount', label: 'Target Approved Headcount', type: 'field', dataType: 'number', permLevel: 2 },
              { id: 'dept_current_headcount', label: 'Current Active Headcount', type: 'field', dataType: 'number', readOnly: true, permLevel: 0 },
              { id: 'dept_annual_budget', label: 'Annual Department Budget (EGP)', type: 'field', dataType: 'currency', permLevel: 3, maskValue: true },
              { id: 'dept_cost_center', label: 'Cost Center Code', type: 'field', dataType: 'text', permLevel: 2 },
              { id: 'dept_sub_divisions_table', label: 'Sub-Divisions & Branches Table', type: 'table', permLevel: 1 }
            ],
            actions: [
              { action_key: 'act_dept_bulk_reassign', tab_id: 'departments_list', section_name: 'Headcount & Budgets', label_en: 'Bulk Reassign Employees', label_ar: 'إعادة تعيين موظفين بالجملة', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_dept_budget_audit', tab_id: 'departments_list', section_name: 'Headcount & Budgets', label_en: 'Budget & Cost Audit', label_ar: 'تدقيق الميزانيات والتكاليف', state: 'active', permission_scope: 'super_admin' }
            ]
          }
        ]
      },
      {
        id: 'teams',
        label: 'Teams Builder',
        description: 'Cross-functional teams, squads, and lead assignments',
        sections: [
          {
            name: 'Team Specifications',
            items: [
              { id: 'team_name', label: 'Team Name', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'team_lead', label: 'Team Lead / Scrum Master', type: 'field', dataType: 'select', permLevel: 1 },
              { id: 'team_dept', label: 'Parent Department', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
              { id: 'team_charter', label: 'Team Purpose & Charter', type: 'field', dataType: 'text', permLevel: 0 },
              { id: 'team_members_table', label: 'Assigned Team Members Table', type: 'table', permLevel: 0 }
            ],
            actions: [
              { action_key: 'act_team_add_new', tab_id: 'teams', section_name: 'Team Specifications', label_en: 'Add New Team', label_ar: 'إضافة فريق جديد', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_team_export', tab_id: 'teams', section_name: 'Team Specifications', label_en: 'Export Teams Roster', label_ar: 'تصدير بيانات الفرق', state: 'active', permission_scope: 'everyone' }
            ]
          }
        ]
      },
      {
        id: 'titles',
        label: 'Job Titles',
        description: 'Job titles catalog, grades, and salary bands',
        sections: [
          {
            name: 'Job Title Catalog',
            items: [
              { id: 'title_name', label: 'Job Title', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'title_code', label: 'Title Code / Standard Code', type: 'field', dataType: 'text', permLevel: 0 },
              { id: 'title_grade', label: 'Job Grade (Level 1-10)', type: 'field', dataType: 'select', permLevel: 1 },
              { id: 'title_min_salary', label: 'Minimum Base Salary (EGP)', type: 'field', dataType: 'currency', permLevel: 2 },
              { id: 'title_max_salary', label: 'Maximum Base Salary (EGP)', type: 'field', dataType: 'currency', permLevel: 2 },
              { id: 'title_occupants_table', label: 'Current Employees with this Title', type: 'table', permLevel: 1 }
            ],
            actions: [
              { action_key: 'act_title_add_new', tab_id: 'titles', section_name: 'Job Title Catalog', label_en: 'Add New Job Title', label_ar: 'إضافة مسمى وظيفي', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_title_export', tab_id: 'titles', section_name: 'Job Title Catalog', label_en: 'Export Job Titles Catalog', label_ar: 'تصدير دليل المسميات', state: 'active', permission_scope: 'everyone' }
            ]
          }
        ]
      },
      {
        id: 'descriptions',
        label: 'Job Descriptions',
        description: 'Formal role specifications, duties, and qualifications',
        sections: [
          {
            name: 'Role Specifications',
            items: [
              { id: 'jd_job_title', label: 'Associated Job Title', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
              { id: 'jd_dept', label: 'Department', type: 'field', dataType: 'select', permLevel: 0 },
              { id: 'jd_employment_type', label: 'Employment Type', type: 'field', dataType: 'select', permLevel: 0 },
              { id: 'jd_summary', label: 'Position Executive Summary', type: 'field', dataType: 'text', permLevel: 0 },
              { id: 'jd_responsibilities', label: 'Key Core Responsibilities', type: 'field', dataType: 'text', permLevel: 0 },
              { id: 'jd_qualifications', label: 'Required Qualifications & Experience', type: 'field', dataType: 'text', permLevel: 0 },
              { id: 'jd_revisions_table', label: 'Version Revisions & Approvals Table', type: 'table', permLevel: 2 }
            ],
            actions: [
              { action_key: 'act_jd_add_new', tab_id: 'descriptions', section_name: 'Role Specifications', label_en: 'Add New Job Description', label_ar: 'إضافة توصيف وظيفي', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_jd_export_pdf', tab_id: 'descriptions', section_name: 'Role Specifications', label_en: 'Download PDF Specification', label_ar: 'تحميل ملف التوصيف PDF', state: 'active', permission_scope: 'everyone' },
              { action_key: 'act_jd_duplicate', tab_id: 'descriptions', section_name: 'Role Specifications', label_en: 'Duplicate Template', label_ar: 'نسخ القالب', state: 'active', permission_scope: 'super_admin' }
            ]
          }
        ]
      }
    ]
  },

  // =========================================================================
  // 2. Recruitment & Talent Acquisition (/hr/recruitment)
  // =========================================================================
  recruitment: {
    pageKey: 'recruitment',
    displayName: 'Recruitment & Talent Acquisition',
    description: 'Oversee talent acquisition pipelines, headcount budgeting, candidate dossiers, and technical interviews.',
    subTabs: [
      {
        id: 'jobs',
        label: 'Job Openings',
        description: 'Headcount requisitions, job adverts, and hiring statuses',
        sections: [
          {
            name: 'Requisition Details',
            items: [
              { id: 'job_title', label: 'Job Opening Title', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'job_dept', label: 'Target Department', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
              { id: 'job_hiring_manager', label: 'Hiring Manager', type: 'field', dataType: 'select', permLevel: 1 },
              { id: 'job_headcount', label: 'Target Open Headcount', type: 'field', dataType: 'number', permLevel: 1 },
              { id: 'job_min_salary', label: 'Budgeted Salary Min (EGP)', type: 'field', dataType: 'currency', permLevel: 2 },
              { id: 'job_max_salary', label: 'Budgeted Salary Max (EGP)', type: 'field', dataType: 'currency', permLevel: 2 },
              { id: 'job_target_date', label: 'Target Fill Date', type: 'field', dataType: 'date', permLevel: 1 },
              { id: 'job_status', label: 'Requisition Status', type: 'field', dataType: 'select', permLevel: 0 },
              { id: 'job_budget_log_table', label: 'Headcount Budget Allocation History', type: 'table', permLevel: 2 }
            ],
            actions: [
              { action_key: 'act_job_request_opening', tab_id: 'jobs', section_name: 'Requisition Details', label_en: 'Request Job Opening', label_ar: 'طلب فتح وظيفة', state: 'active', permission_scope: 'everyone' },
              { action_key: 'act_job_publish_portal', tab_id: 'jobs', section_name: 'Requisition Details', label_en: 'Publish to Public Portal', label_ar: 'نشر في بوابة التوظيف', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_job_close_requisition', tab_id: 'jobs', section_name: 'Requisition Details', label_en: 'Close Requisition', label_ar: 'إغلاق الشاغر الوظيفي', state: 'active', permission_scope: 'super_admin' }
            ]
          }
        ]
      },
      {
        id: 'candidates',
        label: 'Candidates Pipeline',
        description: 'Applicant tracking, stage movement, dossiers, and resumes',
        sections: [
          {
            name: 'Candidate Dossier',
            items: [
              { id: 'candidate_name', label: 'Candidate Full Name', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'candidate_email', label: 'Email Address', type: 'field', dataType: 'email', isRequired: true, permLevel: 0 },
              { id: 'candidate_phone', label: 'Mobile Phone', type: 'field', dataType: 'text', permLevel: 0 },
              { id: 'candidate_job', label: 'Applied Job Position', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
              { id: 'candidate_stage', label: 'Pipeline Stage (Sourced, Screened, etc.)', type: 'field', dataType: 'select', permLevel: 1 },
              { id: 'candidate_channel', label: 'Source Channel (LinkedIn, Referral, etc.)', type: 'field', dataType: 'select', permLevel: 0 },
              { id: 'candidate_expected_salary', label: 'Expected Salary (EGP)', type: 'field', dataType: 'currency', permLevel: 2, maskValue: true },
              { id: 'candidate_notice_period', label: 'Notice Period (Days/Months)', type: 'field', dataType: 'text', permLevel: 1 },
              { id: 'candidate_overall_rating', label: 'Screening Score (1-5 Stars)', type: 'field', dataType: 'number', permLevel: 1 },
              { id: 'candidate_resumes_table', label: 'Attached Resumes & Portfolios Table', type: 'table', permLevel: 1 }
            ],
            actions: [
              { action_key: 'act_candidate_register', tab_id: 'candidates', section_name: 'Candidate Dossier', label_en: 'Register Candidate', label_ar: 'تسجيل مرشح جديد', state: 'active', permission_scope: 'everyone' },
              { action_key: 'act_candidate_pull_channel', tab_id: 'candidates', section_name: 'Candidate Dossier', label_en: 'Pull From Sourcing Channels', label_ar: 'سحب السير الذاتية من القنوات', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_candidate_advance_stage', tab_id: 'candidates', section_name: 'Candidate Dossier', label_en: 'Advance to Next Stage', label_ar: 'نقل إلى المرحلة التالية', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_candidate_send_offer', tab_id: 'candidates', section_name: 'Candidate Dossier', label_en: 'Generate Job Offer', label_ar: 'إصدار عرض عمل', state: 'active', permission_scope: 'super_admin' }
            ]
          }
        ]
      },
      {
        id: 'interviews',
        label: 'Interviews & Scorecards',
        description: 'Interview schedules, technical scorecards, and hiring recommendations',
        sections: [
          {
            name: 'Interview Assessment',
            items: [
              { id: 'interview_title', label: 'Assessment Title', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'interview_candidate', label: 'Candidate', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
              { id: 'interview_date', label: 'Scheduled Date & Time', type: 'field', dataType: 'date', isRequired: true, permLevel: 0 },
              { id: 'interview_interviewer', label: 'Assigned Evaluator', type: 'field', dataType: 'select', permLevel: 1 },
              { id: 'interview_meeting_link', label: 'Meeting Link / Room', type: 'field', dataType: 'text', permLevel: 0 },
              { id: 'interview_recommendation', label: 'Hiring Decision (Hire / Strong Hire / Reject)', type: 'field', dataType: 'select', permLevel: 2 },
              { id: 'interview_scorecards_table', label: 'Competency Scoring & Criteria Table', type: 'table', permLevel: 1 }
            ],
            actions: [
              { action_key: 'act_interview_schedule', tab_id: 'interviews', section_name: 'Interview Assessment', label_en: 'Schedule Interview', label_ar: 'جدولة مقابلة', state: 'active', permission_scope: 'everyone' },
              { action_key: 'act_interview_submit_scorecard', tab_id: 'interviews', section_name: 'Interview Assessment', label_en: 'Submit Evaluation Scorecard', label_ar: 'تسليم استمارة التقييم', state: 'active', permission_scope: 'direct_manager' }
            ]
          }
        ]
      }
    ]
  },

  // =========================================================================
  // 3. Payroll Management (/hr/payroll)
  // =========================================================================
  payroll: {
    pageKey: 'payroll',
    displayName: 'Payroll Management',
    description: 'Smart salary calculation engine, Egyptian tax brackets, and social insurance deductions.',
    subTabs: [
      {
        id: 'payroll_overview',
        label: 'Payroll Cycle & Summary',
        description: 'Monthly payroll runs, gross-to-net disbursement, and batch audits',
        sections: [
          {
            name: 'Payroll Cycle Controls',
            items: [
              { id: 'pay_month_year', label: 'Payroll Period (Month & Year)', type: 'field', dataType: 'text', isRequired: true, permLevel: 1 },
              { id: 'pay_cycle_status', label: 'Disbursement Status (Draft, Approved, Paid)', type: 'field', dataType: 'select', permLevel: 2 },
              { id: 'pay_total_gross', label: 'Total Gross Disbursement (EGP)', type: 'field', dataType: 'currency', permLevel: 3, maskValue: true },
              { id: 'pay_total_deductions', label: 'Total Deductions & Taxes (EGP)', type: 'field', dataType: 'currency', permLevel: 3, maskValue: true },
              { id: 'pay_total_net', label: 'Total Net Salary Paid (EGP)', type: 'field', dataType: 'currency', permLevel: 3, maskValue: true },
              { id: 'pay_payment_date', label: 'Disbursement Execution Date', type: 'field', dataType: 'date', permLevel: 2 },
              { id: 'pay_dept_distribution_table', label: 'Department Payroll Cost Distribution Table', type: 'table', permLevel: 2 }
            ],
            actions: [
              { action_key: 'act_payroll_generate_draft', tab_id: 'payroll_overview', section_name: 'Payroll Cycle Controls', label_en: 'Generate Month Draft', label_ar: 'توليد مسودة الشهر', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_payroll_policy_settings', tab_id: 'payroll_overview', section_name: 'Payroll Cycle Controls', label_en: 'Configure Payroll Policies', label_ar: 'إعدادات سياسات الرواتب', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_payroll_export_csv', tab_id: 'payroll_overview', section_name: 'Payroll Cycle Controls', label_en: 'Export Payroll CSV', label_ar: 'تصدير جدول الرواتب CSV', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_payroll_export_sheets', tab_id: 'payroll_overview', section_name: 'Payroll Cycle Controls', label_en: 'Sync to Google Sheets', label_ar: 'المزامنة مع جوجل شيتس', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_payroll_print', tab_id: 'payroll_overview', section_name: 'Payroll Cycle Controls', label_en: 'Print Payslips & Table', label_ar: 'طباعة مسير الرواتب', state: 'active', permission_scope: 'super_admin' }
            ]
          },
          {
            name: 'Taxation & Statutory Deductions',
            items: [
              { id: 'pay_tax_bracket', label: 'Income Tax Law Slab Rule', type: 'field', dataType: 'select', permLevel: 2 },
              { id: 'pay_social_ins_emp', label: 'Employee Social Insurance Rate (11%)', type: 'field', dataType: 'number', permLevel: 2 },
              { id: 'pay_social_ins_empyr', label: 'Employer Social Insurance Rate (18.75%)', type: 'field', dataType: 'number', permLevel: 2 },
              { id: 'pay_martyrs_fund', label: 'Martyrs & Injured Fund Deduction (0.05%)', type: 'field', dataType: 'number', permLevel: 2 },
              { id: 'pay_statutory_logs_table', label: 'Tax & Social Insurance Remittance History', type: 'table', permLevel: 3 }
            ],
            actions: [
              { action_key: 'act_payroll_recalculate_all', tab_id: 'payroll_overview', section_name: 'Taxation & Statutory Deductions', label_en: 'Recalculate Entire Company', label_ar: 'إعادة احتساب رواتب الشركة بالكامل', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_payroll_lock_period', tab_id: 'payroll_overview', section_name: 'Taxation & Statutory Deductions', label_en: 'Lock & Close Pay Period', label_ar: 'إغلاق واعتماد مسير الرواتب', state: 'active', permission_scope: 'super_admin' }
            ]
          }
        ]
      },
      {
        id: 'salary_components',
        label: 'Salary Components & Allowances',
        description: 'Fixed allowances, incentives, commissions, and deduction rules',
        sections: [
          {
            name: 'Allowances & Variable Pay',
            items: [
              { id: 'comp_housing_allowance', label: 'Housing Allowance Formula', type: 'field', dataType: 'text', permLevel: 2 },
              { id: 'comp_trans_allowance', label: 'Transportation Allowance', type: 'field', dataType: 'currency', permLevel: 2 },
              { id: 'comp_mobile_allowance', label: 'Communication / Mobile Stipend', type: 'field', dataType: 'currency', permLevel: 2 },
              { id: 'comp_overtime_multiplier', label: 'Overtime Hourly Multiplier (1.5x / 2.0x)', type: 'field', dataType: 'number', permLevel: 2 },
              { id: 'comp_custom_allowances_table', label: 'Discretionary Bonus & Allowance Table', type: 'table', permLevel: 2 }
            ],
            actions: [
              { action_key: 'act_comp_add_component', tab_id: 'salary_components', section_name: 'Allowances & Variable Pay', label_en: 'Add Salary Component', label_ar: 'إضافة بند راتب جديد', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_comp_export_components', tab_id: 'salary_components', section_name: 'Allowances & Variable Pay', label_en: 'Export Salary Structure', label_ar: 'تصدير هيكل الرواتب', state: 'active', permission_scope: 'super_admin' }
            ]
          }
        ]
      }
    ]
  },

  // =========================================================================
  // 4. Attendance & Time Tracking (/hr/attendance)
  // =========================================================================
  attendance: {
    pageKey: 'attendance',
    displayName: 'Attendance & Time Tracking',
    description: 'Daily logs, shift rotations, break periods, and leave entitlements.',
    subTabs: [
      {
        id: 'daily',
        label: 'Daily Logs',
        description: 'Punch-in records, biometric synchronization, and worked hours',
        sections: [
          {
            name: 'Punches & Timesheet Records',
            items: [
              { id: 'att_date', label: 'Attendance Date', type: 'field', dataType: 'date', isRequired: true, permLevel: 0 },
              { id: 'att_emp_name', label: 'Employee Name', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'att_clock_in', label: 'Clock-In Time', type: 'field', dataType: 'text', permLevel: 0 },
              { id: 'att_clock_out', label: 'Clock-Out Time', type: 'field', dataType: 'text', permLevel: 0 },
              { id: 'att_worked_hrs', label: 'Total Worked Hours', type: 'field', dataType: 'number', permLevel: 0 },
              { id: 'att_late_mins', label: 'Late Arrival Minutes', type: 'field', dataType: 'number', permLevel: 1 },
              { id: 'att_early_mins', label: 'Early Departure Minutes', type: 'field', dataType: 'number', permLevel: 1 },
              { id: 'att_overtime_hrs', label: 'Approved Overtime Hours', type: 'field', dataType: 'number', permLevel: 1 },
              { id: 'att_status', label: 'Attendance Status (Present, Late, Absent, Half-Day)', type: 'field', dataType: 'select', permLevel: 0 },
              { id: 'att_biometric_logs_table', label: 'Biometric Device Raw Audit Logs', type: 'table', permLevel: 2 }
            ],
            actions: [
              { action_key: 'act_att_export_logs', tab_id: 'daily', section_name: 'Punches & Timesheet Records', label_en: 'Export Daily Logs (CSV/Excel)', label_ar: 'تصدير سجل الحضور اليومي', state: 'active', permission_scope: 'everyone' },
              { action_key: 'act_att_manual_entry', tab_id: 'daily', section_name: 'Punches & Timesheet Records', label_en: 'Add Manual Attendance Punch', label_ar: 'إضافة بصمة حضور يدوية', state: 'active', permission_scope: 'direct_manager' },
              { action_key: 'act_att_sync_biometrics', tab_id: 'daily', section_name: 'Punches & Timesheet Records', label_en: 'Sync Biometric Devices', label_ar: 'مزامنة أجهزة البصمة', state: 'active', permission_scope: 'super_admin' }
            ]
          }
        ]
      },
      {
        id: 'shifts',
        label: 'Shift Schedule',
        description: 'Work shifts, schedules, rotations, and grace periods',
        sections: [
          {
            name: 'Shift Definitions',
            items: [
              { id: 'shift_name', label: 'Shift Name / Label', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'shift_start', label: 'Official Shift Start Time', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'shift_end', label: 'Official Shift End Time', type: 'field', dataType: 'text', isRequired: true, permLevel: 0 },
              { id: 'shift_grace', label: 'Grace Period Tolerance (Minutes)', type: 'field', dataType: 'number', permLevel: 1 },
              { id: 'shift_dept', label: 'Target Department / Team Assignment', type: 'field', dataType: 'select', permLevel: 1 },
              { id: 'shift_roster_table', label: 'Employee Shift Rotation Schedule Table', type: 'table', permLevel: 0 }
            ],
            actions: [
              { action_key: 'act_shift_add_new', tab_id: 'shifts', section_name: 'Shift Definitions', label_en: 'Create New Shift', label_ar: 'إنشاء وردية جديدة', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_shift_copy_prev', tab_id: 'shifts', section_name: 'Shift Definitions', label_en: 'Copy Previous Week Schedule', label_ar: 'نسخ جدول الأسبوع الماضي', state: 'active', permission_scope: 'super_admin' }
            ]
          }
        ]
      },
      {
        id: 'leaves',
        label: 'Leave Management',
        description: 'Leave requests, balance accruals, approvals, and attachments',
        sections: [
          {
            name: 'Leave Policies & Requests',
            items: [
              { id: 'leave_emp', label: 'Requesting Employee', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
              { id: 'leave_type', label: 'Leave Type (Annual, Sick, Casual, Pilgrimage)', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
              { id: 'leave_start', label: 'Start Date', type: 'field', dataType: 'date', isRequired: true, permLevel: 0 },
              { id: 'leave_end', label: 'End Date', type: 'field', dataType: 'date', isRequired: true, permLevel: 0 },
              { id: 'leave_days', label: 'Calculated Business Days', type: 'field', dataType: 'number', readOnly: true, permLevel: 0 },
              { id: 'leave_status', label: 'Approval Status (Pending, Approved, Rejected)', type: 'field', dataType: 'select', permLevel: 1 },
              { id: 'leave_reason', label: 'Leave Reason / Justification', type: 'field', dataType: 'text', permLevel: 0 },
              { id: 'leave_balances_table', label: 'Employee Entitlement & Accrual Ledger', type: 'table', permLevel: 0 }
            ],
            actions: [
              { action_key: 'act_leave_request_new', tab_id: 'leaves', section_name: 'Leave Policies & Requests', label_en: 'Submit Leave Request', label_ar: 'تقديم طلب إجازة', state: 'active', permission_scope: 'everyone' },
              { action_key: 'act_leave_adjust_balances', tab_id: 'leaves', section_name: 'Leave Policies & Requests', label_en: 'Adjust Leave Balances', label_ar: 'تعديل أرصدة الإجازات', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_leave_export_ledger', tab_id: 'leaves', section_name: 'Leave Policies & Requests', label_en: 'Export Leave Balances Ledger', label_ar: 'تصدير سجل أرصدة الإجازات', state: 'active', permission_scope: 'everyone' }
            ]
          }
        ]
      }
    ]
  },

  // =========================================================================
  // 5. Employee Complaints & Grievances (/hr/complaints)
  // =========================================================================
  complaints: {
    pageKey: 'complaints',
    displayName: 'Employee Complaints & Grievances',
    description: 'Confidential grievances, dispute investigations, and compliance resolutions.',
    subTabs: [
      {
        id: 'grievances',
        label: 'Grievance Dossiers',
        description: 'Formal complaints, incident reports, and dispute logs',
        sections: [
          {
            name: 'Case Dossier & Investigation',
            items: [
              { id: 'complaint_ticket_no', label: 'Grievance Ticket ID', type: 'field', dataType: 'text', readOnly: true, permLevel: 0 },
              { id: 'complaint_emp_name', label: 'Complainant Employee', type: 'field', dataType: 'text', permLevel: 3, ownOnly: true },
              { id: 'complaint_subject', label: 'Subject / Against Entity', type: 'field', dataType: 'text', permLevel: 2 },
              { id: 'complaint_category', label: 'Grievance Category (Workplace, Harassment, Salary, etc.)', type: 'field', dataType: 'select', isRequired: true, permLevel: 0 },
              { id: 'complaint_severity', label: 'Severity Level (Low, Medium, Critical)', type: 'field', dataType: 'select', isRequired: true, permLevel: 1 },
              { id: 'complaint_date', label: 'Filing Date & Time', type: 'field', dataType: 'date', permLevel: 0 },
              { id: 'complaint_status', label: 'Investigation Status (New, In Review, Resolved, Escalated)', type: 'field', dataType: 'select', isRequired: true, permLevel: 1 },
              { id: 'complaint_investigator', label: 'Assigned Lead HR Investigator', type: 'field', dataType: 'select', permLevel: 2 },
              { id: 'complaint_summary', label: 'Grievance Statement & Particulars', type: 'field', dataType: 'text', isRequired: true, permLevel: 1 },
              { id: 'complaint_resolution', label: 'Official Resolution & Corrective Action', type: 'field', dataType: 'text', permLevel: 2 },
              { id: 'complaint_witness_table', label: 'Witness Statements & Investigation Notes Table', type: 'table', permLevel: 3 }
            ],
            actions: [
              { action_key: 'act_complaint_submit_new', tab_id: 'grievances', section_name: 'Case Dossier & Investigation', label_en: 'Submit New Grievance', label_ar: 'تقديم شكوى جديدة', state: 'active', permission_scope: 'everyone' },
              { action_key: 'act_complaint_assign_investigator', tab_id: 'grievances', section_name: 'Case Dossier & Investigation', label_en: 'Assign Investigator', label_ar: 'تعيين محقق للشكوى', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_complaint_resolve', tab_id: 'grievances', section_name: 'Case Dossier & Investigation', label_en: 'Mark Complaint Resolved', label_ar: 'تسوية وإغلاق الشكوى', state: 'active', permission_scope: 'super_admin' },
              { action_key: 'act_complaint_export_dossier', tab_id: 'grievances', section_name: 'Case Dossier & Investigation', label_en: 'Export Confidential Case Dossier', label_ar: 'تصدير ملف التحقيق السري', state: 'active', permission_scope: 'super_admin' }
            ]
          }
        ]
      }
    ]
  }
};

/**
 * Resolves the target page key based on URL pathname
 */
export function resolveTargetPageFromPath(pathname: string): string {
  const clean = pathname.toLowerCase();
  if (clean.includes('/hr/departments')) return 'departments';
  if (clean.includes('/hr/recruitment') || clean.includes('/hr/hiring')) return 'recruitment';
  if (clean.includes('/hr/payroll')) return 'payroll';
  if (clean.includes('/hr/attendance')) return 'attendance';
  if (clean.includes('/hr/complaints')) return 'complaints';
  return 'departments';
}

/**
 * Deep-clones default module schema from registry
 */
export function getModuleDefaultSchema(targetPage: string): ModuleSchemaConfig {
  const key = targetPage.toLowerCase().trim();
  const found = HR_MODULE_REGISTRY[key] || HR_MODULE_REGISTRY['departments'];
  return JSON.parse(JSON.stringify(found));
}
