import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SlidersHorizontal, ChevronDown, ChevronRight, Check, Shield, 
  Search, Eye, Lock, Edit2, Layers, FolderTree, ArrowUpRight,
  Sparkles, CheckCircle2, XCircle, Save, RefreshCw, ExternalLink,
  Tag, Compass, Monitor, FileText
} from 'lucide-react';
import { useRBAC } from './RBACContext';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export interface HRTreeSubItem {
  id: string;
  titleEn: string;
  routePath: string;
  type: 'sub_page' | 'tab' | 'screen' | 'section' | 'action' | 'widget';
  description: string;
  aliases?: string[];
}

export interface HRTreeDomainGroup {
  groupId: string;
  titleEn: string;
  routePath: string;
  description: string;
  parentTab: string;
  aliases?: string[];
  subItems: HRTreeSubItem[];
}

export const RBACModuleTreePage: React.FC = () => {
  const { 
    roleId, 
    moduleId, 
    canonModule, 
    role, 
    moduleMetadata, 
    matrixSearch, 
    permissions,
    hasChanges,
    saving,
    savePermissions,
    isTabVisible, 
    getTabLevel, 
    getTabDataScope, 
    toggleTabVisibility,
    toggleTabVisibilityWithCascade, 
    updateTabLevel, 
    updateTabDataScope 
  } = useRBAC();

  const navigate = useNavigate();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [localSearch, setLocalSearch] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Full HR Module Tree Structure mapping all actual routes and sub-tabs
  const hrDomainGroups: HRTreeDomainGroup[] = useMemo(() => [
    // 1. /hr (HR System Core & Workspace Shell)
    {
      groupId: 'hr_root',
      titleEn: 'HR Workspace Shell & Navigation',
      routePath: '/hr',
      parentTab: 'HR Root',
      aliases: ['/hr', 'hr', 'HR Master', 'HR Workspace Shell', '/hr/hub', 'HR Hub', 'hr_root'],
      description: 'Module root layout, global top bar, quick department switcher, search console, and workspace preferences',
      subItems: [
        {
          id: 'hr_master_shell',
          titleEn: 'Master Navigation & Workspace Shell (Hub)',
          routePath: '/hr',
          type: 'sub_page',
          description: 'Global module navigation bar, workspace launchpad hub, and department switcher',
          aliases: ['/hr', '/hr/hub', 'hr_shell', 'workspace_shell', 'HR Hub', 'HR Root']
        },
        {
          id: 'hr_custom_layout',
          titleEn: 'Module Schema & Custom Layout Settings',
          routePath: '/hr/settings',
          type: 'tab',
          description: 'Custom fields schema manager, dynamic tab configuration, and layout presets',
          aliases: ['/hr/settings', 'hr_settings', 'layout_settings', 'Custom Layout']
        },
        {
          id: 'hr_integration_bridges',
          titleEn: 'Email Notifications & Integration Bridges',
          routePath: '/hr/integrations',
          type: 'tab',
          description: 'Automated SMTP email notifications, Slack/Teams webhooks, and biometric device bridges',
          aliases: ['/hr/integrations', 'hr_integrations', 'integration_bridges', 'Integrations']
        },
        {
          id: 'hr_security_launcher',
          titleEn: 'Quick Action Shortcuts & Security Overrides',
          routePath: '/hr/actions',
          type: 'tab',
          description: 'Quick-action launch modals, button-level security controls, and sensitive action authorizations',
          aliases: ['/hr/actions', 'quick_actions', 'action_controls', 'Quick Actions']
        }
      ]
    },

    // 2. /hr/dashboard (HR Control Center Dashboard)
    {
      groupId: 'dashboard',
      titleEn: 'HR Control Center Dashboard',
      routePath: '/hr/dashboard',
      parentTab: 'Dashboard',
      aliases: ['/hr/dashboard', 'dashboard', 'Dashboard Overview', 'HR Dashboard', 'hr_dashboard'],
      description: 'Executive overview, live workforce telemetry, headcount turnover metrics, and departmental KPIs',
      subItems: [
        {
          id: 'dashboard_kpi_metrics',
          titleEn: 'Executive Summary Metrics & KPIs',
          routePath: '/hr/dashboard',
          type: 'sub_page',
          description: 'Total active headcount, monthly payroll expenditure, and daily attendance rate scorecards',
          aliases: ['/hr/dashboard', '/hr/dashboard/metrics', 'Executive Summary Metrics', 'Quick HR KPIs & Metrics', 'KPI Metrics']
        },
        {
          id: 'dashboard_headcount_trends',
          titleEn: 'Headcount Distribution & Department Graphs',
          routePath: '/hr/dashboard',
          type: 'tab',
          description: 'Interactive workforce breakdown by department, grade distribution, and tenure analytics',
          aliases: ['/hr/dashboard/trends', 'Headcount Trends', 'headcount_distribution']
        },
        {
          id: 'dashboard_turnover_analytics',
          titleEn: 'Turnover Rates & Leave Analytics',
          routePath: '/hr/dashboard',
          type: 'tab',
          description: 'Workforce attrition trends, seasonal leave spikes, and retention analytics',
          aliases: ['/hr/dashboard/analytics', 'Turnover Analytics', 'leave_analytics']
        },
        {
          id: 'dashboard_system_logs',
          titleEn: 'Biometric Telemetry & Audit Logs',
          routePath: '/hr/dashboard',
          type: 'tab',
          description: 'Real-time biometric device sync status, punch logs telemetry, and security audit trails',
          aliases: ['/hr/dashboard/logs', 'Biometric Telemetry', 'biometric_telemetry', 'Audit Logs']
        }
      ]
    },

    // 3. /hr/directory (Employee Directory & Comprehensive Profiles)
    {
      groupId: 'directory',
      titleEn: 'Employee Directory & Comprehensive Profiles',
      routePath: '/hr/directory',
      parentTab: 'Employee Directory',
      aliases: ['/hr/directory', 'directory', 'Directory', 'Employees', 'hr_directory'],
      description: 'Master employee listings, profile files, personal records, and granular data tabs',
      subItems: [
        {
          id: 'directory_list',
          titleEn: 'Master Employee Roster & Filter Matrix',
          routePath: '/hr/directory',
          type: 'sub_page',
          description: 'Comprehensive staff directory with multi-column filtering, department search, and Excel export',
          aliases: ['/hr/directory', 'directory_roster', 'Employee Directory List', 'directory']
        },
        {
          id: 'directory_add_employee',
          titleEn: 'Add New Employee Onboarding Wizard',
          routePath: '/hr/directory/new',
          type: 'sub_page',
          description: 'New hire onboarding modal, system ID assignment, contract details, and default access rights',
          aliases: ['/hr/directory/new', 'add_employee', 'Add Employee', 'directory_new']
        },
        {
          id: 'profile_personal',
          titleEn: 'Profile Tab: Personal Details (Default redirect)',
          routePath: '/hr/directory/:id/personal',
          type: 'tab',
          description: 'National ID, passport, birth date, gender, marital status, personal phone, and addresses (Default redirect)',
          aliases: ['/hr/directory/:id/personal', '/hr/directory/:id', '/hr/directory/:id#personal', 'Personal Details', 'Personal', 'personal']
        },
        {
          id: 'profile_job',
          titleEn: 'Profile Tab: Job & Employment Details',
          routePath: '/hr/directory/:id/job',
          type: 'tab',
          description: 'Designation, department, direct reporting manager, contract type, joining date, and grade',
          aliases: ['/hr/directory/:id/job', '/hr/directory/:id#job', 'Employment & Contract', 'Job', 'job', 'Job Details']
        },
        {
          id: 'profile_time_off',
          titleEn: 'Profile Tab: Time-Off Balances & Leaves',
          routePath: '/hr/directory/:id/time-off',
          type: 'tab',
          description: 'Annual vacation days balance, sick leave allowances, leave history ledger, and requests',
          aliases: ['/hr/directory/:id/time-off', '/hr/directory/:id/time_off', '/hr/directory/:id#time_off', 'Time-Off Balances', 'Time Off', 'time_off', 'time-off']
        },
        {
          id: 'profile_emergency',
          titleEn: 'Profile Tab: Emergency Contacts',
          routePath: '/hr/directory/:id/emergency',
          type: 'tab',
          description: 'Primary and secondary emergency contacts, relationships, contact numbers, and home addresses',
          aliases: ['/hr/directory/:id/emergency', '/hr/directory/:id#emergency', 'Emergency Contacts', 'Emergency', 'emergency']
        },
        {
          id: 'profile_recognition',
          titleEn: 'Profile Tab: Recognition & Awards',
          routePath: '/hr/directory/:id/recognition',
          type: 'tab',
          description: 'Honors, employee of the month accolades, spot bonuses, and corporate recognition logs',
          aliases: ['/hr/directory/:id/recognition', '/hr/directory/:id#recognition', 'Recognition & Awards', 'Recognition', 'recognition']
        },
        {
          id: 'profile_performance',
          titleEn: 'Profile Tab: Performance Records',
          routePath: '/hr/directory/:id/performance',
          type: 'tab',
          description: 'Appraisal evaluation scores, review history, manager feedback notes, and improvement plans',
          aliases: ['/hr/directory/:id/performance', '/hr/directory/:id#performance', 'Performance Records', 'Performance', 'performance']
        },
        {
          id: 'profile_training',
          titleEn: 'Profile Tab: Training & Certifications',
          routePath: '/hr/directory/:id/training',
          type: 'tab',
          description: 'Assigned LMS courses, professional certificates, completion dates, and credential uploads',
          aliases: ['/hr/directory/:id/training', '/hr/directory/:id#training', 'Training & Certifications', 'Training', 'training']
        },
        {
          id: 'profile_documents',
          titleEn: 'Profile Tab: Documents & Digital Attachments',
          routePath: '/hr/directory/:id/documents',
          type: 'tab',
          description: 'Signed contracts, scanned national IDs, resumes, academic certificates, and digital files',
          aliases: ['/hr/directory/:id/documents', '/hr/directory/:id#documents', 'Documents & Digital Attachments', 'Documents', 'documents']
        },
        {
          id: 'profile_login_info',
          titleEn: 'Profile Tab: System Logins & Credentials',
          routePath: '/hr/directory/:id/login-info',
          type: 'tab',
          description: 'Corporate email credentials, ERP system logins, biometric badge IDs, and password reset',
          aliases: ['/hr/directory/:id/login-info', '/hr/directory/:id/login_info', '/hr/directory/:id#login_info', 'System Logins & Credentials', 'Login info', 'login_info', 'login-info']
        },
        {
          id: 'profile_notes',
          titleEn: 'Profile Tab: Profile Notes & Activity Timeline',
          routePath: '/hr/directory/:id/notes',
          type: 'tab',
          description: 'Confidential HR administrative notes, status changes, and chronological audit timeline',
          aliases: ['/hr/directory/:id/notes', '/hr/directory/:id#notes', 'Notes & Timeline', 'Notes', 'notes']
        },
        {
          id: 'profile_assets',
          titleEn: 'Profile Tab: More: Assets & Equipment Custody',
          routePath: '/hr/directory/:id/assets',
          type: 'tab',
          description: 'Assigned company hardware, laptops, SIM cards, building access badges, and vehicle custody',
          aliases: ['/hr/directory/:id/assets', '/hr/directory/:id#assets', 'Assets Custody', 'Assets', 'assets']
        },
        {
          id: 'profile_benefits',
          titleEn: 'Profile Tab: More: Benefits & Insurance',
          routePath: '/hr/directory/:id/benefits',
          type: 'tab',
          description: 'Health insurance policies, family dependents coverage, social security, and corporate perks',
          aliases: ['/hr/directory/:id/benefits', '/hr/directory/:id#benefits', 'Insurance & Benefits', 'Benefits', 'benefits']
        },
        {
          id: 'profile_onboarding',
          titleEn: 'Profile Tab: More: Onboarding Checklist',
          routePath: '/hr/directory/:id/onboarding',
          type: 'tab',
          description: 'New employee onboarding orientation checklist, IT provisioning, and induction tasks',
          aliases: ['/hr/directory/:id/onboarding', '/hr/directory/:id#onboarding', 'Onboarding Tasks', 'Onboarding', 'onboarding']
        },
        {
          id: 'profile_offboarding',
          titleEn: 'Profile Tab: More: Offboarding & Clearances',
          routePath: '/hr/directory/:id/offboarding',
          type: 'tab',
          description: 'Offboarding task checklist, asset handovers, security revocation, and final settlements',
          aliases: ['/hr/directory/:id/offboarding', '/hr/directory/:id#offboarding', 'Offboarding Tasks', 'Offboarding', 'offboarding']
        }
      ]
    },

    // 4. /hr/departments (Departments & Organizational Structure)
    {
      groupId: 'departments',
      titleEn: 'Departments & Organizational Structure',
      routePath: '/hr/departments',
      parentTab: 'Departments & Structure',
      aliases: ['/hr/departments', 'departments', 'Departments'],
      description: 'Business units, departmental hierarchies, functional teams, job titles, and job descriptions',
      subItems: [
        {
          id: 'departments_list',
          titleEn: 'Departments Directory & Hierarchy Overview',
          routePath: '/hr/departments',
          type: 'sub_page',
          description: 'Full departmental hierarchy, branch allocations, department heads, and staffing statistics',
          aliases: ['/hr/departments', 'Department Directory', 'departments_roster']
        },
        {
          id: 'departments_add',
          titleEn: 'Add Department Wizard',
          routePath: '/hr/departments/new',
          type: 'sub_page',
          description: 'Create new organizational branch, define budget code, and assign department head',
          aliases: ['/hr/departments/new', 'add_department']
        },
        {
          id: 'departments_details',
          titleEn: 'Department Details & Organogram View',
          routePath: '/hr/departments/:id',
          type: 'sub_page',
          description: 'Individual department view, budget utilization, manager profile, and active teams',
          aliases: ['/hr/departments/:id', 'department_details']
        },
        {
          id: 'teams_list',
          titleEn: 'Teams & Working Squads List',
          routePath: '/hr/departments/teams',
          type: 'sub_page',
          description: 'Cross-functional team roster, team supervisors, and team-level operational metrics',
          aliases: ['/hr/departments/teams', 'teams_roster']
        },
        {
          id: 'teams_add',
          titleEn: 'Add Functional Team Form',
          routePath: '/hr/departments/teams/new',
          type: 'sub_page',
          description: 'Create new squad, bind to department, and designate operational supervisor',
          aliases: ['/hr/departments/teams/new', 'add_team']
        },
        {
          id: 'teams_details',
          titleEn: 'Team Member Roster & Performance Details',
          routePath: '/hr/departments/teams/:id',
          type: 'sub_page',
          description: 'Team roster, project deliverables, assigned employees, and shift allocations',
          aliases: ['/hr/departments/teams/:id', 'team_details']
        },
        {
          id: 'job_titles_list',
          titleEn: 'Job Titles Directory & Seniority Grades',
          routePath: '/hr/departments/titles',
          type: 'sub_page',
          description: 'Standard job title taxonomy, salary scale grade bands, and career ladders',
          aliases: ['/hr/departments/titles', 'job_titles']
        },
        {
          id: 'job_titles_add',
          titleEn: 'Add Job Title & Salary Scale Setup',
          routePath: '/hr/departments/titles/new',
          type: 'sub_page',
          description: 'Register standard job designation, seniority tier, and qualification prerequisites',
          aliases: ['/hr/departments/titles/new', 'add_job_title']
        },
        {
          id: 'job_titles_details',
          titleEn: 'Job Title Details & Staff Mapping',
          routePath: '/hr/departments/titles/:id',
          type: 'sub_page',
          description: 'Staff members currently holding title, historical salary averages, and requirements',
          aliases: ['/hr/departments/titles/:id', 'job_title_details']
        },
        {
          id: 'job_descriptions_list',
          titleEn: 'Job Descriptions Library & Competencies',
          routePath: '/hr/departments/descriptions',
          type: 'sub_page',
          description: 'Standardized job specifications, key performance objectives, and core deliverables',
          aliases: ['/hr/departments/descriptions', 'job_descriptions']
        },
        {
          id: 'job_descriptions_add',
          titleEn: 'Create Job Description Specification',
          routePath: '/hr/departments/descriptions/new',
          type: 'sub_page',
          description: 'Compose rich job description, required competencies, duties, and reporting lines',
          aliases: ['/hr/departments/descriptions/new', 'add_job_description']
        },
        {
          id: 'job_descriptions_details',
          titleEn: 'Job Description Details & Version History',
          routePath: '/hr/departments/descriptions/:id',
          type: 'sub_page',
          description: 'Detailed specification view, revision history, and linked job requisitions',
          aliases: ['/hr/departments/descriptions/:id', 'job_description_details']
        }
      ]
    },

    // 5. /hr/recruitment (Hiring & Talent Acquisition)
    {
      groupId: 'recruitment',
      titleEn: 'Hiring & Talent Acquisition',
      routePath: '/hr/recruitment',
      parentTab: 'Hiring',
      aliases: ['/hr/recruitment', 'recruitment', 'Hiring', 'Recruitment & Jobs'],
      description: 'Job requisitions, applicant tracking pipeline, candidate stages, and interview scorecards',
      subItems: [
        {
          id: 'recruitment_jobs_list',
          titleEn: 'Job Openings & Published Vacancies',
          routePath: '/hr/recruitment/jobs',
          type: 'sub_page',
          description: 'Active hiring openings, public career postings, candidate counts, and status',
          aliases: ['/hr/recruitment/jobs', 'Job Openings', 'job_openings']
        },
        {
          id: 'recruitment_jobs_request',
          titleEn: 'Request Job Opening Requisition',
          routePath: '/hr/recruitment/jobs/request',
          type: 'sub_page',
          description: 'Submit hiring requisition, justify headcount, and route for executive budget approval',
          aliases: ['/hr/recruitment/jobs/request', 'request_job_opening']
        },
        {
          id: 'recruitment_jobs_details',
          titleEn: 'Job Opening Details & Applicants',
          routePath: '/hr/recruitment/jobs/:id',
          type: 'sub_page',
          description: 'Specific opening details, applicant sourcing metrics, interviewers panel, and offers',
          aliases: ['/hr/recruitment/jobs/:id', 'job_details']
        },
        {
          id: 'recruitment_candidates_pipeline',
          titleEn: 'Candidates Kanban Pipeline Stages',
          routePath: '/hr/recruitment/candidates',
          type: 'sub_page',
          description: 'Visual candidate funnel: Applied, Screened, Interview, Offered, and Hired',
          aliases: ['/hr/recruitment/candidates', 'Candidates Pipeline', 'candidates_pipeline']
        },
        {
          id: 'recruitment_candidates_register',
          titleEn: 'Register New Candidate & Resume Parse',
          routePath: '/hr/recruitment/candidates/register',
          type: 'sub_page',
          description: 'Candidate intake form, CV upload, contact info, experience, and referral tracking',
          aliases: ['/hr/recruitment/candidates/register', 'register_candidate']
        },
        {
          id: 'recruitment_candidates_details',
          titleEn: 'Candidate Dossier & Background Checks',
          routePath: '/hr/recruitment/candidates/:id',
          type: 'sub_page',
          description: 'Candidate evaluation notes, interview logs, CV preview, and salary expectations',
          aliases: ['/hr/recruitment/candidates/:id', 'candidate_profile']
        },
        {
          id: 'recruitment_interviews',
          titleEn: 'Interviews Schedule & Evaluation Scorecards',
          routePath: '/hr/recruitment/interviews',
          type: 'sub_page',
          description: 'Interview calendar, panel evaluations, scoring rubrics, and hiring recommendations',
          aliases: ['/hr/recruitment/interviews', 'Interviews & Scorecards', 'interviews_scorecards']
        }
      ]
    },

    // 6. /hr/payroll (Payroll, Salaries & Compensation)
    {
      groupId: 'payroll',
      titleEn: 'Payroll, Salaries & Compensation',
      routePath: '/hr/payroll',
      parentTab: 'Payroll & Salaries',
      aliases: ['/hr/payroll', 'payroll', 'Payroll'],
      description: 'Monthly payroll runs, pay slips, allowances, deductions, and tax/insurance calculations',
      subItems: [
        {
          id: 'payroll_board_runs',
          titleEn: 'Monthly Payroll Runs & Salary Slips',
          routePath: '/hr/payroll',
          type: 'sub_page',
          description: 'Monthly salary calculation board, bank disbursement status, and pay slip printing',
          aliases: ['/hr/payroll', 'Salary Slips & Runs', 'payroll_runs']
        },
        {
          id: 'payroll_policy_config',
          titleEn: 'Payroll Calculation Policy & Rules',
          routePath: '/hr/payroll/Policy-Setup',
          type: 'sub_page',
          description: 'Overtime multipliers, late deduction formulas, tax exemption rules, and insurance limits',
          aliases: ['/hr/payroll/Policy-Setup', '/hr/payroll/policy-setup', '/hr/payroll/policy', 'payroll_policy', 'Payroll Policy Config']
        },
        {
          id: 'payroll_edit_record',
          titleEn: 'Edit Employee Pay Breakdown & Vouchers',
          routePath: '/hr/payroll/edit/:id',
          type: 'sub_page',
          description: 'Detailed salary slip editor, manual gross adjustments, allowances, and print preview',
          aliases: ['/hr/payroll/edit/:id', 'edit_payroll_record']
        },
        {
          id: 'payroll_benefits_allowances',
          titleEn: 'Benefits, Allowances & Spot Bonuses',
          routePath: '/hr/payroll#allowances',
          type: 'tab',
          description: 'Fixed allowances (Housing, Transport), spot bonuses, and performance incentives',
          aliases: ['Benefits & Allowances', 'allowances_bonuses', '/hr/payroll/allowances']
        },
        {
          id: 'payroll_deductions_penalties',
          titleEn: 'Deductions, Penalties & Salary Advances',
          routePath: '/hr/payroll#deductions',
          type: 'tab',
          description: 'Unexcused absence deductions, salary loan installments, and disciplinary fines',
          aliases: ['Deductions & Salary Advances', 'deductions_penalties', '/hr/payroll/deductions']
        },
        {
          id: 'payroll_tax_insurance',
          titleEn: 'Income Tax & Social Insurance Calculations',
          routePath: '/hr/payroll#tax',
          type: 'tab',
          description: 'Statutory income tax withholding brackets, medical fund, and social security calculations',
          aliases: ['Tax & Insurance Formulas', 'tax_insurance', '/hr/payroll/tax']
        }
      ]
    },

    // 7. /hr/attendance (Attendance, Shifts & Leaves)
    {
      groupId: 'attendance',
      titleEn: 'Attendance, Shifts & Leaves',
      routePath: '/hr/attendance',
      parentTab: 'Attendance',
      aliases: ['/hr/attendance', 'attendance', 'Attendance & Clock In', 'hr_attendance'],
      description: 'Biometric daily clock-ins, shift schedules, break monitoring, and leave management',
      subItems: [
        {
          id: 'attendance_hub',
          titleEn: 'Attendance Hub & Clock In Terminal',
          routePath: '/hr/attendance',
          type: 'sub_page',
          description: 'Main attendance overview, quick check-in terminal, and status summaries',
          aliases: ['/hr/attendance', 'attendance_hub', 'attendance']
        },
        {
          id: 'attendance_daily_logs',
          titleEn: 'Daily Attendance Logs & Clock Punches',
          routePath: '/hr/attendance/daily',
          type: 'sub_page',
          description: 'Biometric machine punch logs, clock-in/out timestamps, tardiness, and overtime hours',
          aliases: ['/hr/attendance/daily', '/hr/attendance/daily-logs', 'Daily Attendance Logs', 'daily_logs']
        },
        {
          id: 'attendance_shift_schedules',
          titleEn: 'Shift Schedules & Rosters Overview',
          routePath: '/hr/attendance/shifts',
          type: 'sub_page',
          description: 'Weekly shift planning, rotating shift assignments, weekend rotas, and shift patterns',
          aliases: ['/hr/attendance/shifts', 'Shift Schedules & Rotations', 'shift_schedules']
        },
        {
          id: 'attendance_shift_configure',
          titleEn: 'Shift Configuration & Timings Setup',
          routePath: '/hr/attendance/shifts/Configure',
          type: 'sub_page',
          description: 'Configure shift working hours, overtime rules, late allowances, and grace periods',
          aliases: ['/hr/attendance/shifts/Configure', '/hr/attendance/shifts/configure', 'shift_configure', 'Shift Configuration']
        },
        {
          id: 'attendance_shift_rotation_matrix',
          titleEn: 'Shift Rotation Matrix & Patterns',
          routePath: '/hr/attendance/shifts/Rotation-Matrix',
          type: 'sub_page',
          description: 'Rotating shift pattern matrix, day/night cycles, and automatic team transitions',
          aliases: ['/hr/attendance/shifts/Rotation-Matrix', '/hr/attendance/shifts/rotation-matrix', 'rotation_matrix', 'Rotation Matrix']
        },
        {
          id: 'attendance_shift_holidays',
          titleEn: 'Company Holidays & Public Observances',
          routePath: '/hr/attendance/shifts/Holidays',
          type: 'sub_page',
          description: 'Annual company calendar, statutory national holidays, and corporate shut-down dates',
          aliases: ['/hr/attendance/shifts/Holidays', '/hr/attendance/shifts/holidays', 'company_holidays', 'Holidays']
        },
        {
          id: 'attendance_breaks_tracking',
          titleEn: 'Break Shifts & Time Tracking',
          routePath: '/hr/attendance/breaks',
          type: 'sub_page',
          description: 'Rest and lunch break monitoring, punch durations, and grace period compliance',
          aliases: ['/hr/attendance/breaks', 'Breaks & Time Tracking', 'breaks_tracking']
        },
        {
          id: 'attendance_leave_management',
          titleEn: 'Leave Requests, Approvals & Accrual Balances',
          routePath: '/hr/attendance/leaves',
          type: 'sub_page',
          description: 'Employee time-off requests, manager approvals, medical leaves, and annual balances',
          aliases: ['/hr/attendance/leaves', 'Leave Requests & Balances', 'leave_management']
        },
        {
          id: 'attendance_shift_swaps',
          titleEn: 'Shift Swaps & Colleague Cover Requests',
          routePath: '/hr/attendance/swaps',
          type: 'sub_page',
          description: 'Staff shift exchange requests, peer agreements, and manager approval workflows',
          aliases: ['/hr/attendance/swaps', 'Shift Swaps & Overtime', 'shift_swaps']
        },
        {
          id: 'attendance_reports_analytics',
          titleEn: 'Attendance Reports & Audit Analytics',
          routePath: '/hr/attendance/reports',
          type: 'sub_page',
          description: 'Aggregated attendance reports, monthly work hours, absenteeism rates, and payroll export',
          aliases: ['/hr/attendance/reports', 'attendance_reports', 'attendance_analytics']
        }
      ]
    },

    // 8. /hr/performance (Performance, Appraisals & OKRs)
    {
      groupId: 'performance',
      titleEn: 'Performance, OKRs & Appraisals',
      routePath: '/hr/performance',
      parentTab: 'Performance & OKRs',
      aliases: ['/hr/performance', 'performance', 'Performance'],
      description: 'Appraisal cycles, KPI objectives tracking, 360 reviews, and competency evaluations',
      subItems: [
        {
          id: 'performance_core_hub',
          titleEn: 'Performance Hub & Review Cycles',
          routePath: '/hr/performance',
          type: 'sub_page',
          description: 'Active appraisal rounds, self-evaluations, manager reviews, and status tracking',
          aliases: ['/hr/performance', 'Appraisals & Reviews', 'performance_hub']
        },
        {
          id: 'performance_new_appraisal',
          titleEn: 'Create New Performance Appraisal Form',
          routePath: '/hr/performance/new',
          type: 'sub_page',
          description: 'Initiate review cycle, configure evaluation period, and select participants cohort',
          aliases: ['/hr/performance/new', 'new_appraisal']
        },
        {
          id: 'performance_engine_models',
          titleEn: 'Appraisal Engine, Rubrics & Scoring Models',
          routePath: '/hr/performance/engine',
          type: 'sub_page',
          description: 'Scoring weights, 360 review models, competency matrices, and OKR rating engines',
          aliases: ['/hr/performance/engine', 'appraisal_engine']
        },
        {
          id: 'performance_analysis_hub',
          titleEn: 'Performance Analysis Hub & 9-Box Matrix',
          routePath: '/hr/performance/analysis',
          type: 'sub_page',
          description: 'Company-wide talent matrix, bell-curve distribution, and top-performer rankings',
          aliases: ['/hr/performance/analysis', 'performance_analysis']
        },
        {
          id: 'performance_analysis_details',
          titleEn: 'Individual Appraisal Analysis & Scorecard',
          routePath: '/hr/performance/analysis/:id',
          type: 'sub_page',
          description: 'Detailed appraisal feedback, competency scores, developmental goals, and recommendations',
          aliases: ['/hr/performance/analysis/:id', 'analysis_details']
        },
        {
          id: 'performance_okrs_goals',
          titleEn: 'Quarterly OKRs & Objective Goal Tracking',
          routePath: '/hr/performance#kpis',
          type: 'tab',
          description: 'Company key objectives, departmental targets, progress percentages, and milestone dates',
          aliases: ['KPIs & Objective Tracking', 'okrs_goals', '/hr/performance/kpis']
        }
      ]
    },

    // 9. /hr/orgchart (Visual Organization Chart)
    {
      groupId: 'orgchart',
      titleEn: 'Visual Organization Chart',
      routePath: '/hr/orgchart',
      parentTab: 'Org Chart',
      aliases: ['/hr/orgchart', 'orgchart', 'Org Chart View'],
      description: 'Interactive company reporting hierarchy, managerial chains, and department trees',
      subItems: [
        {
          id: 'orgchart_tree_view',
          titleEn: 'Hierarchical Tree View',
          routePath: '/hr/orgchart#tree',
          type: 'sub_page',
          description: 'Zoomable graphical organogram, manager reporting lines, and department levels',
          aliases: ['Hierarchical Tree View', 'orgchart_tree', '/hr/orgchart/tree']
        },
        {
          id: 'orgchart_matrix_view',
          titleEn: 'Department Matrix & Squad Grouping View',
          routePath: '/hr/orgchart#matrix',
          type: 'tab',
          description: 'Cluster view of business units, cross-departmental teams, and shared services',
          aliases: ['Department Matrix View', 'orgchart_matrix', '/hr/orgchart/matrix']
        },
        {
          id: 'orgchart_reporting_chains',
          titleEn: 'Managerial Reporting Lines & Chains',
          routePath: '/hr/orgchart#chains',
          type: 'tab',
          description: 'Reporting chains, department heads, line managers, and organizational re-structuring',
          aliases: ['Reporting Chains', 'orgchart_chains', '/hr/orgchart/chains']
        }
      ]
    },

    // 10. /hr/complaints (Complaints, Grievances & Disciplinary)
    {
      groupId: 'complaints',
      titleEn: 'Complaints, Grievances & Disciplinary',
      routePath: '/hr/complaints',
      parentTab: 'Complaints & Grievances',
      aliases: ['/hr/complaints', 'complaints', 'Complaints'],
      description: 'Staff grievance reporting, confidential workplace investigations, and disciplinary sanctions',
      subItems: [
        {
          id: 'complaints_directory',
          titleEn: 'Complaints & Grievances Directory',
          routePath: '/hr/complaints',
          type: 'sub_page',
          description: 'Confidential incident logging, grievance case files, priority ratings, and ticket statuses',
          aliases: ['/hr/complaints', 'Complaints & Grievances', 'complaints_roster']
        },
        {
          id: 'complaints_investigation_details',
          titleEn: 'Confidential Complaint Case Details',
          routePath: '/hr/complaints/:id',
          type: 'sub_page',
          description: 'Investigator dossier, witness statements, evidence attachments, and confidential findings',
          aliases: ['/hr/complaints/:id', 'complaint_investigation']
        },
        {
          id: 'complaints_disciplinary_sanctions',
          titleEn: 'Disciplinary Actions, Warnings & Penalties',
          routePath: '/hr/complaints#disciplinary',
          type: 'tab',
          description: 'Warning letters, disciplinary hearing outcomes, salary penalty records, and PIP plans',
          aliases: ['Disciplinary Actions', 'disciplinary_sanctions', '/hr/complaints/disciplinary']
        },
        {
          id: 'complaints_resolutions_appeals',
          titleEn: 'Resolutions, Mediations & Appeals',
          routePath: '/hr/complaints#resolutions',
          type: 'tab',
          description: 'Mediation agreements, closed cases, formal appeal hearings, and final sign-offs',
          aliases: ['Resolutions & Appeals', 'resolutions_appeals', '/hr/complaints/resolutions']
        }
      ]
    },

    // 11. /hr/archived (Archived Staff & Historical Records)
    {
      groupId: 'archived',
      titleEn: 'Archived Staff & Historical Records',
      routePath: '/hr/archived',
      parentTab: 'Archived Staff',
      aliases: ['/hr/archived', 'archived', 'Archived Employees'],
      description: 'Offboarded personnel directory, separation records, exit interviews, and re-hire status',
      subItems: [
        {
          id: 'archived_staff_roster',
          titleEn: 'Past Employees Historical Directory',
          routePath: '/hr/archived#staff',
          type: 'sub_page',
          description: 'Searchable archive of terminated or resigned employees, service dates, and past roles',
          aliases: ['/hr/archived#staff', 'Past Employees Archive', 'archived_roster']
        },
        {
          id: 'archived_exit_interviews',
          titleEn: 'Exit Interviews & Departure Surveys',
          routePath: '/hr/archived#exit_interviews',
          type: 'tab',
          description: 'Exit interview survey responses, reason for leaving, satisfaction ratings, and feedback',
          aliases: ['Exit Interviews & Offboarding Logs', 'exit_interviews', '/hr/archived/exit_interviews']
        },
        {
          id: 'archived_rehire_records',
          titleEn: 'Re-Hire Eligibility & Verification',
          routePath: '/hr/archived#rehire_status',
          type: 'tab',
          description: 'Re-employment clearance flags, past performance records, and employer reference notes',
          aliases: ['Re-hire Eligibility Records', 'rehire_status', '/hr/archived/rehire_status']
        }
      ]
    }
  ], []);

  // Knowledge Base Module Navigation & Screen Tree mapping exact routes and sub-tabs
  const kbDomainGroups: HRTreeDomainGroup[] = useMemo(() => [
    // 1. /kb - Knowledge Base Shell & Workspace Hub
    {
      groupId: 'kb_root',
      titleEn: 'Knowledge Base Shell & Workspace Hub',
      routePath: '/kb',
      parentTab: 'Articles Explorer',
      aliases: ['/kb', 'kb', 'Knowledge Base', 'KB Root', 'kb_root'],
      description: 'Module root layout, workspace header, department switcher, live metrics counter, and quick navigation bar',
      subItems: [
        {
          id: 'kb_master_shell',
          titleEn: 'Master Navigation & Workspace Shell',
          routePath: '/kb',
          type: 'sub_page',
          description: 'Global knowledge base header, quick department switcher, and layout shell',
          aliases: ['/kb', 'kb_shell', 'workspace_shell']
        },
        {
          id: 'kb_dept_scope_switcher',
          titleEn: 'Department Scope & Category Quick Switcher',
          routePath: '/kb',
          type: 'tab',
          description: 'Departmental categorization bar and category navigation chips',
          aliases: ['kb_dept_filter', 'dept_scope']
        },
        {
          id: 'kb_summary_metrics_bar',
          titleEn: 'Knowledge Metrics & Readership Counters',
          routePath: '/kb',
          type: 'tab',
          description: 'Total articles count, popular topics, and engagement stats bar',
          aliases: ['kb_stats_bar', 'kb_metrics']
        }
      ]
    },
    // 2. /kb/articles - Articles Explorer & Directory
    {
      groupId: 'kb_articles_explorer',
      titleEn: 'Articles Explorer & Directory',
      routePath: '/kb/articles',
      parentTab: 'Articles Explorer',
      aliases: ['/kb/articles', 'kb_articles', 'Articles Explorer', 'Articles Directory'],
      description: 'Comprehensive articles explorer supporting Grid, Table, and Kanban view modes, multi-faceted filtering, and global search',
      subItems: [
        {
          id: 'kb_articles_table_grid',
          titleEn: 'Multi-View Directory (Table, Grid, Kanban)',
          routePath: '/kb/articles',
          type: 'sub_page',
          description: 'Switch between tabular list, card grid, and kanban board view modes',
          aliases: ['kb_view_modes', 'articles_grid']
        },
        {
          id: 'kb_articles_search_console',
          titleEn: 'Real-time Full-Text Search Console',
          routePath: '/kb/articles',
          type: 'tab',
          description: 'Instant title, body content, and tag search query filtering',
          aliases: ['articles_search', 'kb_search']
        },
        {
          id: 'kb_articles_filter_bar',
          titleEn: 'Taxonomy, Status & Department Filter Bar',
          routePath: '/kb/articles',
          type: 'tab',
          description: 'Dropdown filters for Categories, Status (Draft/Review/Published), Tags, and Department access',
          aliases: ['articles_filters', 'kb_filters']
        },
        {
          id: 'kb_articles_export_utility',
          titleEn: 'Articles Data Export Engine',
          routePath: '/kb/articles',
          type: 'tab',
          description: 'Export filtered articles directory and readership statistics to CSV / Excel',
          aliases: ['articles_export', 'kb_export']
        }
      ]
    },
    // 3. /kb/categories/:categoryId - Dedicated Category Viewer
    {
      groupId: 'kb_category_hub',
      titleEn: 'Category Explorer & Taxonomy Feed',
      routePath: '/kb/categories/:categoryId',
      parentTab: 'Category Hub',
      aliases: ['/kb/categories', 'Category Hub', 'kb_category_view', 'category_feed'],
      description: 'Dedicated category hub with localized breadcrumbs, department affiliation, tag cloud, and filtered article lists',
      subItems: [
        {
          id: 'kb_category_feed_page',
          titleEn: 'Dedicated Category Article Feed',
          routePath: '/kb/categories/:categoryId',
          type: 'sub_page',
          description: 'Focused view displaying all published knowledge assets within a specific category',
          aliases: ['category_feed', 'category_articles']
        },
        {
          id: 'kb_category_tag_filters',
          titleEn: 'Category Tag Aggregator & Quick Pills',
          routePath: '/kb/categories/:categoryId',
          type: 'tab',
          description: 'Interactive tag filter chips extracted from articles in the active category',
          aliases: ['category_tags']
        },
        {
          id: 'kb_category_stats_summary',
          titleEn: 'Category Readership & Engagement Metrics',
          routePath: '/kb/categories/:categoryId',
          type: 'tab',
          description: 'Aggregated view count, helpfulness score, and author list for the category',
          aliases: ['category_metrics']
        }
      ]
    },
    // 4. /kb/article/:articleId - Article Reader View
    {
      groupId: 'kb_article_reader',
      titleEn: 'Article Reader View & Interaction Studio',
      routePath: '/kb/article/:articleId',
      parentTab: 'Article Reader',
      aliases: ['/kb/article', 'Article Reader', 'kb_reader', 'reader_view'],
      description: 'Dedicated stand-alone reading experience with formatted Markdown, code blocks, feedback scoring, and linked SOPs',
      subItems: [
        {
          id: 'kb_reader_full_view',
          titleEn: 'Full Markdown Article Reader',
          routePath: '/kb/article/:articleId',
          type: 'sub_page',
          description: 'High-contrast typography reader rendering markdown, headings, blockquotes, and tables',
          aliases: ['article_reader_body']
        },
        {
          id: 'kb_reader_feedback_scoring',
          titleEn: 'Helpfulness Feedback Rating (Helpful / Not Helpful)',
          routePath: '/kb/article/:articleId',
          type: 'tab',
          description: 'Interactive reader feedback buttons to score article utility with instant counters',
          aliases: ['reader_feedback', 'helpful_rating']
        },
        {
          id: 'kb_reader_sop_bridge',
          titleEn: 'Interactive SOP Procedure Bridge',
          routePath: '/kb/article/:articleId',
          type: 'tab',
          description: 'Direct badge link to interconnected Standard Operating Procedures (SOPs)',
          aliases: ['reader_sop_link', 'sop_bridge']
        },
        {
          id: 'kb_reader_print_export',
          titleEn: 'Print & PDF Export Engine',
          routePath: '/kb/article/:articleId',
          type: 'tab',
          description: 'Browser print formatting and PDF export utility for offline distribution',
          aliases: ['reader_print', 'pdf_export']
        },
        {
          id: 'kb_reader_related_recommendations',
          titleEn: 'Related Articles & Recommendations Sidebar',
          routePath: '/kb/article/:articleId',
          type: 'tab',
          description: 'Sidebar displaying contextually related articles from the same taxonomy',
          aliases: ['reader_related', 'related_articles']
        }
      ]
    },
    // 5. /kb/create & /kb/edit/:articleId - Article Authoring Studio & Rich Editor
    {
      groupId: 'kb_article_authoring',
      titleEn: 'Article Authoring Studio & Rich Editor',
      routePath: '/kb/create & /kb/edit/:articleId',
      parentTab: 'Article Authoring & Editing',
      aliases: ['/kb/create', '/kb/edit', 'Article Authoring & Editing', 'kb_editor', 'authoring_studio'],
      description: 'Creation and revision studio equipped with rich-text formatting, AI content generation, status approvals, and department scoping',
      subItems: [
        {
          id: 'kb_editor_create_screen',
          titleEn: 'Create Article Screen',
          routePath: '/kb/create',
          type: 'sub_page',
          description: 'New knowledge article authoring form and metadata initial configuration',
          aliases: ['create_article_page', '/kb/create']
        },
        {
          id: 'kb_editor_edit_screen',
          titleEn: 'Edit Article Screen',
          routePath: '/kb/edit/:articleId',
          type: 'sub_page',
          description: 'Existing article modification screen with revision preservation',
          aliases: ['edit_article_page', '/kb/edit']
        },
        {
          id: 'kb_editor_ai_assistant',
          titleEn: 'AI Content Generation & Enhancement Assistant',
          routePath: '/kb/create',
          type: 'tab',
          description: 'One-click AI generation, grammar fixing, tone enhancement, and text expansion',
          aliases: ['kb_ai_assistant', 'ai_editor']
        },
        {
          id: 'kb_editor_workflow_status',
          titleEn: 'Publishing Workflow & Status Control',
          routePath: '/kb/create',
          type: 'tab',
          description: 'Set article state to Draft, Submit for Review, or Publish directly',
          aliases: ['status_control', 'kb_workflow']
        },
        {
          id: 'kb_editor_dept_visibility',
          titleEn: 'Department-Level Visibility Restrictions',
          routePath: '/kb/create',
          type: 'tab',
          description: 'Multi-select department picker to restrict article access to designated teams',
          aliases: ['dept_visibility', 'visibility_restrictions']
        },
        {
          id: 'kb_editor_sop_linking',
          titleEn: 'SOP Association & External URL Attachment',
          routePath: '/kb/create',
          type: 'tab',
          description: 'Bind article to SOPs, external Google Drive/Confluence URLs, or product IDs',
          aliases: ['sop_linking', 'external_url_link']
        }
      ]
    },
    // 6. /kb/manage - Knowledge Base Taxonomy & Governance
    {
      groupId: 'kb_management_governance',
      titleEn: 'Knowledge Taxonomy & Category Governance',
      routePath: '/kb/manage',
      parentTab: 'KB Management & Settings',
      aliases: ['/kb/manage', 'KB Management & Settings', 'kb_manage', 'taxonomy_governance'],
      description: 'Central administrative console for creating categories, assigning departmental scopes, and managing knowledge permissions',
      subItems: [
        {
          id: 'kb_manage_console_screen',
          titleEn: 'KB Management Administrative Console',
          routePath: '/kb/manage',
          type: 'sub_page',
          description: 'Unified management interface for categories, departments, and system status',
          aliases: ['manage_console', '/kb/manage']
        },
        {
          id: 'kb_manage_category_crud',
          titleEn: 'Category Creation, Editing & Deletion',
          routePath: '/kb/manage',
          type: 'tab',
          description: 'Add new categories, edit naming and descriptions, and safely delete empty categories',
          aliases: ['category_crud', 'category_management']
        },
        {
          id: 'kb_manage_dept_binding',
          titleEn: 'Departmental Taxonomy Assignment',
          routePath: '/kb/manage',
          type: 'tab',
          description: 'Link knowledge categories to specific operational departments',
          aliases: ['taxonomy_binding', 'dept_assignment']
        },
        {
          id: 'kb_manage_security_rules',
          titleEn: 'Module Access & Security Permissions',
          routePath: '/kb/manage',
          type: 'tab',
          description: 'Quick links and shortcuts to RBAC roles, authoring permissions, and review approvals',
          aliases: ['kb_security_rules', 'manage_permissions']
        }
      ]
    }
  ], []);

  // Quality Assurance (QA) Module Navigation & Screen Tree mapping exact routes and sub-tabs
  const qaDomainGroups: HRTreeDomainGroup[] = useMemo(() => [
    // 1. /qa - Quality Management Shell & Navigation Hub
    {
      groupId: 'qa_root',
      titleEn: 'Quality Management Shell & Navigation Hub',
      routePath: '/qa',
      parentTab: 'Quality Dashboard',
      aliases: ['/qa', 'qa', 'Quality Assurance', 'QA Root', 'qa_root'],
      description: 'QMS top banner, ISO 9001 standard context, global integration launcher, and primary module switcher',
      subItems: [
        {
          id: 'qa_master_shell',
          titleEn: 'Master Header & Workspace Layout',
          routePath: '/qa',
          type: 'sub_page',
          description: 'Global header with ISO 9001 quality framework banner and outlet view',
          aliases: ['/qa', 'qa_shell', 'workspace_shell']
        },
        {
          id: 'qa_subnav_switcher',
          titleEn: 'Primary Quality Navigation Switcher',
          routePath: '/qa',
          type: 'tab',
          description: 'Top-level navigation tabs between Dashboard, Transactions Audit, Internal Audit, and History',
          aliases: ['qa_tabs_bar', 'qa_nav_switcher']
        },
        {
          id: 'qa_quick_settings_modal',
          titleEn: 'Integration Quick Modal Trigger',
          routePath: '/qa',
          type: 'tab',
          description: 'Top-right quick button launching Google Sheets and pipeline integration wizard modal',
          aliases: ['qa_modal_trigger', 'integration_wizard_btn']
        }
      ]
    },
    // 2. /qa/dashboard - Quality Dashboard & Performance Analytics
    {
      groupId: 'qa_dashboard_hub',
      titleEn: 'Quality Dashboard & Performance Analytics',
      routePath: '/qa/dashboard',
      parentTab: 'Quality Dashboard',
      aliases: ['/qa/dashboard', 'qa_dashboard', 'Quality Dashboard', 'Overview'],
      description: 'Real-time QMS intelligence, executive scorecards, failure Pareto charts, and individual employee tracking',
      subItems: [
        {
          id: 'qa_dashboard_overview',
          titleEn: 'Quality Overview & KPI Widgets',
          routePath: '/qa/dashboard/overview',
          type: 'sub_page',
          description: 'High-level KPIs: Average Quality Score %, Pass Rate %, Open NCRs count, SLA compliance, and trend graphs',
          aliases: ['/qa/dashboard/overview', 'qa_overview', '/qa/dashboard']
        },
        {
          id: 'qa_employee_tracking',
          titleEn: 'Employee Quality Tracking & Scorecards',
          routePath: '/qa/dashboard/employee-tracking',
          type: 'sub_page',
          description: 'Agent-level audit scorecards, rankings, defect recurrence indicators, and coaching alerts',
          aliases: ['/qa/dashboard/employee-tracking', '/qa/dashboard/employees', 'employee_quality', 'qa_agent_cards']
        },
        {
          id: 'qa_dashboard_date_filter',
          titleEn: 'Timeframe & Department Scope Bar',
          routePath: '/qa/dashboard',
          type: 'tab',
          description: 'Filter metrics across 7-day, 30-day, quarterly periods, operational shifts, and departments',
          aliases: ['qa_date_filter', 'dashboard_filters']
        },
        {
          id: 'qa_dashboard_export',
          titleEn: 'Executive Quality Report Export',
          routePath: '/qa/dashboard',
          type: 'tab',
          description: 'Download executive QMS performance summaries in Excel and PDF formats',
          aliases: ['dashboard_export', 'qa_report_export']
        }
      ]
    },
    // 3. /qa/transactions-audit - Transactions Audit & Incidents Hub
    {
      groupId: 'qa_transactions_audit_hub',
      titleEn: 'Transactions Audit & Incident Investigation Hub',
      routePath: '/qa/transactions-audit',
      parentTab: 'Transactions Audit',
      aliases: ['/qa/transactions-audit', 'qa_transactions', 'Transactions Audit', 'transactions_audit'],
      description: 'Audit queues across operational defects: Customer complaints, processing delays, refunds, cancellations, and NPS',
      subItems: [
        {
          id: 'qa_trans_launchpad',
          titleEn: 'Transactions Audit Launchpad Hub (7 Action Cards)',
          routePath: '/qa/transactions-audit',
          type: 'sub_page',
          description: 'Interactive 7-card Bento launchpad hub routing to Complaints, Delays, Refunds, Cancellations, NPS, Action Plans, and Checklists',
          aliases: ['/qa/transactions-audit', 'transactions_audit_hub', 'Launchpad Hub', 'Launchpad', 'transactions-audit', 'Transactions Audit']
        },
        {
          id: 'qa_trans_complaints',
          titleEn: 'Customer Complaints Audit Queue',
          routePath: '/qa/transactions-audit/complaints',
          type: 'sub_page',
          description: 'Customer grievances audit log, RCA categorization, sentiment analysis, and resolution sign-offs',
          aliases: ['/qa/transactions-audit/complaints', 'complaints_audit', 'Complaints', 'complaints', 'Customer Complaints', 'qa complaints']
        },
        {
          id: 'qa_trans_delays',
          titleEn: 'Order & Dispatch Delays Audit Queue',
          routePath: '/qa/transactions-audit/delays',
          type: 'sub_page',
          description: 'Operational SLA breach investigation, order processing delays, and fulfillment bottleneck audits',
          aliases: ['/qa/transactions-audit/delays', 'delays_audit', 'Delays', 'delays', 'Operational Delays', 'qa delays']
        },
        {
          id: 'qa_trans_refunds',
          titleEn: 'Refunds & Chargebacks Financial Audit',
          routePath: '/qa/transactions-audit/refunds',
          type: 'sub_page',
          description: 'Financial claim validity checks, return policy compliance verification, and refund fraud prevention',
          aliases: ['/qa/transactions-audit/refunds', 'refunds_audit', 'Refunds', 'refunds', 'Refunds & Claims', 'qa refunds']
        },
        {
          id: 'qa_trans_cancellations',
          titleEn: 'Cancellations & Churn Audit Queue',
          routePath: '/qa/transactions-audit/cancellations',
          type: 'sub_page',
          description: 'Premature cancellation analysis, order drop-off root causes, and churn prevention recommendations',
          aliases: ['/qa/transactions-audit/cancellations', 'cancellations_audit', 'Cancellations', 'cancellations', 'Booking Cancellations', 'qa cancellations']
        },
        {
          id: 'qa_trans_nps',
          titleEn: 'NPS & Customer Satisfaction Feedback Audit',
          routePath: '/qa/transactions-audit/nps',
          type: 'sub_page',
          description: 'Detractor survey audit, promoter feedback analysis, and CSAT service scorecards',
          aliases: ['/qa/transactions-audit/nps', 'nps_audit', 'NPS', 'nps', 'NPS & Sentiment', 'qa nps']
        },
        {
          id: 'qa_trans_action_plans',
          titleEn: 'Corrective Action Plans & Stepper',
          routePath: '/qa/transactions-audit/action-plans',
          type: 'sub_page',
          description: 'Remediation roadmaps, assignee responsibilities, milestone verification dates, and action plan builder',
          aliases: ['/qa/transactions-audit/action-plans', 'action_plans', 'Action Plans', 'action-plans', 'Action Plans (CAPA)', 'qa action plans', '/qa/transactions-audit/action-plans/new']
        },
        {
          id: 'qa_trans_checklists',
          titleEn: 'Transaction Checklists & Rubrics',
          routePath: '/qa/transactions-audit/checklists',
          type: 'sub_page',
          description: 'Transaction audit checklists, compliance checkpoints, penalty scoring rubrics, and evaluation criteria',
          aliases: ['/qa/transactions-audit/checklists', 'transaction_checklists', 'Audit Checklists', 'checklists', 'qa checklists']
        },
        {
          id: 'qa_trans_stepper',
          titleEn: 'Dedicated Incident Audit Stepper Studio',
          routePath: '/qa/transactions-audit/:type/new',
          type: 'sub_page',
          description: 'Multi-stage walkthrough: Incident Data Ingestion, Checklist Verification, Finding Logging, RCA, and Digital Sign-off',
          aliases: ['incident_stepper', 'transaction_stepper', '/qa/transactions-audit/audit/:id', '/qa/transactions-audit/:type/:transactionId', 'Audit Stepper']
        }
      ]
    },
    // 4. /qa/internal-audit - Internal Audit, Templates, NCR & CAPA
    {
      groupId: 'qa_internal_audit_hub',
      titleEn: 'Internal Audit, NCR Incident Log & CAPA Hub',
      routePath: '/qa/internal-audit',
      parentTab: 'Internal Audit',
      aliases: ['/qa/internal-audit', 'qa_internal', 'Internal Audit', 'internal_audit'],
      description: 'Structured ISO-9001 internal compliance audits, customizable checklist templates, Non-Conformance Reports (NCR), and formal CAPA cycles',
      subItems: [
        {
          id: 'qa_internal_templates',
          titleEn: 'Checklist Templates Builder & Library',
          routePath: '/qa/internal-audit/templates',
          type: 'sub_page',
          description: 'Design, version, and manage department-specific inspection templates and question criteria',
          aliases: ['/qa/internal-audit/templates', '/qa/internal-audit/checklists', 'internal_templates']
        },
        {
          id: 'qa_internal_perform',
          titleEn: 'Live Audit Execution Console',
          routePath: '/qa/internal-audit/perform',
          type: 'sub_page',
          description: 'Conduct planned or unannounced operational audits, grade compliance, and record photographic evidence',
          aliases: ['/qa/internal-audit/perform', 'perform_audits']
        },
        {
          id: 'qa_internal_ncr_log',
          titleEn: 'Non-Conformance Reports (NCR) Incident Log',
          routePath: '/qa/internal-audit/ncr-logs',
          type: 'sub_page',
          description: 'Formal register of ISO non-conformances, severity classification, immediate containment, and disposition',
          aliases: ['/qa/internal-audit/ncr-logs', '/qa/internal-audit/ncr-log', 'ncr_logs']
        },
        {
          id: 'qa_internal_capa',
          titleEn: 'CAPA (Corrective & Preventive Action) Studio',
          routePath: '/qa/internal-audit/capa',
          type: 'sub_page',
          description: 'Closed-loop 8D corrective & preventive action plans, root cause verification, and effectiveness closure',
          aliases: ['/qa/internal-audit/capa', '/qa/internal-audit/capa-actions', 'capa_plans']
        },
        {
          id: 'qa_internal_export_bundle',
          titleEn: 'ISO Compliance Audit Dossier Export',
          routePath: '/qa/internal-audit',
          type: 'tab',
          description: 'Export comprehensive audit evidence and NCR tracking packages for ISO-9001 surveillance audits',
          aliases: ['internal_audit_export', 'iso_export']
        }
      ]
    },
    // 5. /qa/audit-history - Historical Audit Trail & Certified Logs
    {
      groupId: 'qa_audit_history_hub',
      titleEn: 'Historical Audit Trail & Certified Records',
      routePath: '/qa/audit-history',
      parentTab: 'Audit History',
      aliases: ['/qa/audit-history', 'Audit History', 'qa_history', 'audit_history'],
      description: 'Master immutable registry of all audited transactions, checklist assessments, inspector sign-offs, and dispute histories',
      subItems: [
        {
          id: 'qa_history_master_archive',
          titleEn: 'Master Audit Archive & Search Grid',
          routePath: '/qa/audit-history',
          type: 'sub_page',
          description: 'Searchable historical archive with multi-column filtering by inspector, score, outcome, and department',
          aliases: ['/qa/audit-history', 'history_archive']
        },
        {
          id: 'qa_history_certificate_view',
          titleEn: 'Audit Certificate & Detailed Score breakdown',
          routePath: '/qa/audit-history',
          type: 'tab',
          description: 'Open certified inspection record showing per-question responses, deductions, and auditor stamp',
          aliases: ['audit_certificate', 'score_breakdown']
        },
        {
          id: 'qa_history_export_print',
          titleEn: 'Print Findings & Export Archive',
          routePath: '/qa/audit-history',
          type: 'tab',
          description: 'Print formatted compliance certificate and export complete audit trail history to Excel/CSV',
          aliases: ['history_print', 'history_export']
        },
        {
          id: 'qa_history_dispute_trail',
          titleEn: 'Audit Dispute & Re-evaluation Log',
          routePath: '/qa/audit-history',
          type: 'tab',
          description: 'Track score appeals, supervisor re-evaluations, and score adjustment histories',
          aliases: ['audit_disputes', 'reevaluation_log']
        }
      ]
    },
    // 6. /qa/settings - QA Settings & Integration Engine
    {
      groupId: 'qa_settings_hub',
      titleEn: 'QA Settings, Data Pipelines & Ingestion',
      routePath: '/qa/settings',
      parentTab: 'QA Settings & Integrations',
      aliases: ['/qa/settings', 'QASettingsPage', 'QA Settings', 'qa_settings'],
      description: 'Automated data ingestion pipelines, Google Sheets live synchronization, random sampling frequency, and defect webhook alerts',
      subItems: [
        {
          id: 'qa_settings_pipeline_console',
          titleEn: 'Data Pipelines & Ingestion Console',
          routePath: '/qa/settings',
          type: 'sub_page',
          description: 'Settings landing view detailing active data integrations, connected sheets, and sync frequency',
          aliases: ['/qa/settings', 'qa_settings_console']
        },
        {
          id: 'qa_settings_sheets_sync',
          titleEn: 'Google Sheets Live Sync Configuration',
          routePath: '/qa/settings',
          type: 'tab',
          description: 'Setup and test spreadsheet integrations for Complaints, Delays, Refunds, and NPS data',
          aliases: ['sheets_sync', 'google_sheets_config']
        },
        {
          id: 'qa_settings_sampling_rules',
          titleEn: 'Automated Sampling Rate & Quotas',
          routePath: '/qa/settings',
          type: 'tab',
          description: 'Define random sampling percentages per department, shift, or order volume',
          aliases: ['sampling_rules', 'auto_sampling']
        },
        {
          id: 'qa_settings_alerts_webhooks',
          titleEn: 'Defect Webhooks & SLA Alert Triggers',
          routePath: '/qa/settings',
          type: 'tab',
          description: 'Configure automated notification webhooks for critical defects and repeated NCR occurrences',
          aliases: ['defect_alerts', 'qa_webhooks']
        },
        {
          id: 'qa_settings_security_signers',
          titleEn: 'QA Certified Signers & Security Roles',
          routePath: '/qa/settings',
          type: 'tab',
          description: 'Manage certified auditor signature requirements and RBAC permission delegations',
          aliases: ['qa_signers', 'qa_security']
        }
      ]
    }
  ], []);

  // -------------------------------------------------------------
  // Products & Services (Catalog) Domain Groups (Screen Tree)
  // -------------------------------------------------------------
  const productsDomainGroups: HRTreeDomainGroup[] = useMemo(() => [
    {
      groupId: 'products_dashboard_group',
      parentTab: 'Dashboard',
      titleEn: 'Catalog Dashboard & Operational Telemetry',
      routePath: '/catalog/dashboard',
      description: 'Executive catalog metrics, inventory valuation, active SKU breakdowns, low-stock warnings, and top margin ranking.',
      aliases: ['/catalog', 'Catalog Overview', 'catalog_dashboard', 'Executive KPI Telemetry'],
      subItems: [
        {
          id: 'catalog_dashboard_kpis',
          titleEn: 'Executive KPI Cards & Metrics',
          routePath: '/catalog/dashboard',
          type: 'screen',
          description: 'Total SKUs, physical products count, service solutions, stock valuation, and average catalog margin metrics',
          aliases: ['catalog_kpis', 'stock_valuation_kpis']
        },
        {
          id: 'catalog_low_stock_banner',
          titleEn: 'Low Stock Critical Warning Banner',
          routePath: '/catalog/dashboard',
          type: 'section',
          description: 'Active alert banner highlighting inventory items below minimum safety stock threshold',
          aliases: ['low_stock_banner', 'stock_depletion_alerts']
        },
        {
          id: 'catalog_top_margins_widget',
          titleEn: 'Top Margins Performance Leaderboard',
          routePath: '/catalog/dashboard',
          type: 'section',
          description: 'Ranked list of highest margin products and service offerings across the entire catalog',
          aliases: ['top_margins_widget', 'margin_leaderboard']
        },
        {
          id: 'catalog_operations_hub_quickjump',
          titleEn: 'Operations Hub Work Order Integration',
          routePath: '/catalog/dashboard',
          type: 'action',
          description: 'Quick jump link to Operations Hub pipeline to inspect active manufacturing and delivery work orders',
          aliases: ['operations_hub_jump', 'work_order_link']
        },
        {
          id: 'catalog_csv_bulk_tools',
          titleEn: 'Catalog CSV Export & Bulk Import Hub',
          routePath: '/catalog',
          type: 'action',
          description: 'Toolbar utilities for exporting catalog inventory to CSV and bulk importing external spreadsheets',
          aliases: ['catalog_csv_export', 'catalog_csv_import', 'catalog_seed_engine']
        }
      ]
    },
    {
      groupId: 'products_items_directory_group',
      parentTab: 'Items Directory',
      titleEn: 'Items Directory & Master Catalog Roster',
      routePath: '/catalog/items',
      description: 'Interactive products and services catalog roster, multi-criteria filtering, board card vs data table views, and deletion safeguards.',
      aliases: ['Items Directory & Specifications', 'catalog_items', 'Products Master Roster', 'Products & Services'],
      subItems: [
        {
          id: 'catalog_items_search_filter',
          titleEn: 'Search Console & Type Filters',
          routePath: '/catalog/items',
          type: 'section',
          description: 'Keyword search and multi-filtering by physical products vs service solutions and low stock status',
          aliases: ['items_filter_console', 'type_selector_filter']
        },
        {
          id: 'catalog_items_view_toggle',
          titleEn: 'Board Cards vs Table Data Grid Switcher',
          routePath: '/catalog/items',
          type: 'action',
          description: 'Toggle display mode between visual rich card tiles and dense tabular pricing data table',
          aliases: ['view_mode_toggle', 'catalog_table_view', 'catalog_cards_view']
        },
        {
          id: 'catalog_items_master_grid',
          titleEn: 'Master Products & Services Roster',
          routePath: '/catalog/items',
          type: 'screen',
          description: 'Interactive items catalog display showing SKU, category, selling price, direct cost, markup %, and stock',
          aliases: ['items_master_grid', 'catalog_roster']
        },
        {
          id: 'catalog_item_deletion_safeguard',
          titleEn: 'Item Delete & Archive Action',
          routePath: '/catalog/items',
          type: 'action',
          description: 'Permission to delete or deprecate products and service specifications from the master catalog',
          aliases: ['delete_catalog_item', 'archive_catalog_item']
        }
      ]
    },
    {
      groupId: 'products_item_form_group',
      parentTab: 'Items Directory',
      titleEn: 'Product & Service Specification Studio (Item Form)',
      routePath: '/catalog/items/new',
      description: 'Creation and editing studio for products and services with financial pricing, direct costs, variable flags, stock thresholds, and SOP links.',
      aliases: ['Create Product / Service', 'Item Form', 'catalog_item_form', '/catalog/items/:id/edit'],
      subItems: [
        {
          id: 'catalog_form_classification_tab',
          titleEn: 'Product vs Service Classification & Basic Identity',
          routePath: '/catalog/items/new',
          type: 'tab',
          description: 'Toggle classification type (Physical Product vs Service Solution), name, SKU code, category, and scope description',
          aliases: ['item_type_toggle', 'item_identity_form']
        },
        {
          id: 'catalog_form_pricing_vat',
          titleEn: 'Financials, Direct Costs & VAT Tax Setup',
          routePath: '/catalog/items/new',
          type: 'tab',
          description: 'Configure standard selling price, currency selection, production/delivery cost, and tax VAT rate',
          aliases: ['pricing_vat_inputs', 'item_unit_economics_form']
        },
        {
          id: 'catalog_form_variable_toggles',
          titleEn: 'Variable Price & Variable Cost Permitted Toggles',
          routePath: '/catalog/items/new',
          type: 'section',
          description: 'Special enterprise flags allowing operational cost variance and flexible quotation pricing in deals',
          aliases: ['variable_pricing_flag', 'variable_cost_flag']
        },
        {
          id: 'catalog_form_stock_service_specs',
          titleEn: 'Inventory Stock Tracking & Service Duration Specs',
          routePath: '/catalog/items/new',
          type: 'tab',
          description: 'Manage physical stock on hand and safety thresholds for products, or standard delivery hours for services',
          aliases: ['stock_tracking_form', 'service_duration_form']
        },
        {
          id: 'catalog_form_sop_process_link',
          titleEn: 'SOP Policy & Process Architecture Workflow Linkages',
          routePath: '/catalog/items/new',
          type: 'section',
          description: 'Connect product or service to ISO-standard operating procedures (SOPs) and visual process mapping blueprints',
          aliases: ['link_sop_workflow', 'link_process_mapping']
        }
      ]
    },
    {
      groupId: 'products_item_profile_group',
      parentTab: 'Items Directory',
      titleEn: 'Item Profile Dossier & Unit Economics',
      routePath: '/catalog/items/:id',
      description: 'Dedicated item profile showing comprehensive specifications, financial spread dossier, stock telemetry, and operational governance.',
      aliases: ['Item Profile', 'Item Dossier', 'catalog_item_profile', 'Product Detail View'],
      subItems: [
        {
          id: 'catalog_profile_header',
          titleEn: 'Item Profile Header & Classification Badges',
          routePath: '/catalog/items/:id',
          type: 'screen',
          description: 'Product header display with SKU badge, category pill, edit shortcuts, and live status indicator',
          aliases: ['item_profile_header', 'item_status_badge']
        },
        {
          id: 'catalog_profile_unit_economics',
          titleEn: 'Unit Economics, Pricing & Net Margin Dossier',
          routePath: '/catalog/items/:id',
          type: 'section',
          description: 'Detailed financial cards showing selling price, direct cost, unit margin spread, and markup percentage',
          aliases: ['unit_economics_card', 'net_margin_dossier']
        },
        {
          id: 'catalog_profile_stock_telemetry',
          titleEn: 'Inventory Stock Levels & Safety Reorder Warnings',
          routePath: '/catalog/items/:id',
          type: 'section',
          description: 'Real-time telemetry of units on hand, depleted stock warnings, and reorder threshold comparisons',
          aliases: ['stock_telemetry_card', 'low_stock_dossier']
        },
        {
          id: 'catalog_profile_sop_governance',
          titleEn: 'Operational Governance & Linked SOP Blueprint',
          routePath: '/catalog/items/:id',
          type: 'section',
          description: 'Governance dossier displaying attached SOP procedures, ISO compliance guidelines, and process links',
          aliases: ['sop_governance_dossier', 'process_blueprint_viewer']
        }
      ]
    },
    {
      groupId: 'products_price_lists_group',
      parentTab: 'Prices & Promo Codes',
      titleEn: 'Multi-Tier Price Lists & Wholesale Profiles',
      routePath: '/catalog/pricing/price-lists',
      description: 'Wholesale, distributor, and VIP price lists, custom item price overrides matrix, and tier qualification management.',
      aliases: ['Price Lists', 'Multi-Tier Price Lists & Promo Codes', 'catalog_price_lists', 'Pricing Tier Management'],
      subItems: [
        {
          id: 'catalog_price_list_switcher',
          titleEn: 'Price List Profiles Switcher',
          routePath: '/catalog/pricing/price-lists',
          type: 'screen',
          description: 'Tabbed selector to switch between wholesale, distributor, VIP corporate, and custom tier profiles',
          aliases: ['price_tier_switcher', 'pricing_profiles_list']
        },
        {
          id: 'catalog_price_list_modal',
          titleEn: 'Create & Edit Price List Profile Modal',
          routePath: '/catalog/pricing/price-lists',
          type: 'action',
          description: 'Author new pricing profiles or adjust tier qualification names and active state',
          aliases: ['new_price_list_modal', 'edit_price_list_modal']
        },
        {
          id: 'catalog_price_overrides_table',
          titleEn: 'Item Price Overrides & Discount Matrix',
          routePath: '/catalog/pricing/price-lists',
          type: 'screen',
          description: 'Matrix of custom overridden unit selling prices and calculate percentage delta vs base catalog price',
          aliases: ['price_overrides_table', 'custom_tier_pricing']
        },
        {
          id: 'catalog_price_list_delete',
          titleEn: 'Delete Price List Tier Profile',
          routePath: '/catalog/pricing/price-lists',
          type: 'action',
          description: 'Safeguard permission to delete a price list profile and clear all custom override rates',
          aliases: ['delete_price_list', 'remove_pricing_tier']
        }
      ]
    },
    {
      groupId: 'products_promo_codes_group',
      parentTab: 'Prices & Promo Codes',
      titleEn: 'Discount Coupons & Promotional Vouchers',
      routePath: '/catalog/pricing/promo-codes',
      description: 'Promotional marketing vouchers, percentage vs fixed discounts, expiration control, and one-click code sharing.',
      aliases: ['Promo Codes', 'Discount Coupons & Vouchers', 'catalog_promo_codes', 'Promotional Vouchers'],
      subItems: [
        {
          id: 'catalog_promo_codes_grid',
          titleEn: 'Promotional Discount Coupons Grid',
          routePath: '/catalog/pricing/promo-codes',
          type: 'screen',
          description: 'Visual card grid displaying active coupons, discount rates, expiration timestamps, and status badges',
          aliases: ['promo_vouchers_grid', 'active_coupons_list']
        },
        {
          id: 'catalog_promo_code_modal',
          titleEn: 'Coupon Generator & Campaign Modal',
          routePath: '/catalog/pricing/promo-codes',
          type: 'action',
          description: 'Issue new promotional voucher codes with percentage discounts or fixed cash deduction values',
          aliases: ['create_coupon_modal', 'promo_generator_modal']
        },
        {
          id: 'catalog_promo_quick_copy',
          titleEn: 'Copy Coupon Code & Share Action',
          routePath: '/catalog/pricing/promo-codes',
          type: 'action',
          description: 'One-click copy coupon voucher code to clipboard for distribution in sales quotes and chat',
          aliases: ['copy_promo_clipboard', 'share_promo_code']
        },
        {
          id: 'catalog_promo_code_delete',
          titleEn: 'Revoke & Delete Promotional Voucher',
          routePath: '/catalog/pricing/promo-codes',
          type: 'action',
          description: 'Revoke active coupon code and purge from discount validation engine',
          aliases: ['delete_coupon_action', 'revoke_promo_voucher']
        }
      ]
    },
    {
      groupId: 'products_profitability_analytics_group',
      parentTab: 'Profitability Analytics',
      titleEn: 'Profitability Intelligence & Margin Audits',
      routePath: '/catalog/analytics',
      description: 'Gross margin distribution, weighted markup analytics, margin classification tiers, and negative-margin investigation sheet.',
      aliases: ['Profitability Analytics & Margin Audits', 'Profitability Analytics', 'catalog_analytics', 'Margin Audits'],
      subItems: [
        {
          id: 'catalog_margin_kpis',
          titleEn: 'Profitability Intelligence & Weighted Markup KPIs',
          routePath: '/catalog/analytics',
          type: 'screen',
          description: 'Executive metrics for average weighted markup, high margin volume, and loss-making counts',
          aliases: ['margin_kpis_summary', 'profitability_overview']
        },
        {
          id: 'catalog_margin_tier_filters',
          titleEn: 'Margin Classification Tier Filter Buttons',
          routePath: '/catalog/analytics',
          type: 'section',
          description: 'Filter items by High Margin (>50%), Healthy (20-50%), Thin Margin (<20%), or Negative Loss Margins',
          aliases: ['margin_tier_buttons', 'filter_margin_health']
        },
        {
          id: 'catalog_margin_audit_table',
          titleEn: 'Direct Unit Margin Audit Sheet & Analytics Table',
          routePath: '/catalog/analytics',
          type: 'screen',
          description: 'Comprehensive spreadsheet-style audit view of price, cost, net spread, and markup calculations per SKU',
          aliases: ['margin_audit_table', 'unit_economics_audit_sheet']
        },
        {
          id: 'catalog_negative_margin_investigation',
          titleEn: 'Negative Margin Loss Investigation & Safeguards',
          routePath: '/catalog/analytics',
          type: 'section',
          description: 'Specialized warning indicators on items selling below cost to prevent margin leakage',
          aliases: ['loss_investigation_panel', 'negative_margin_alert']
        }
      ]
    },
    {
      groupId: 'products_cross_integrations_group',
      parentTab: 'Cross-Module Integrations',
      titleEn: 'Workflow Integrations & CRM Quotation Simulator',
      routePath: '/catalog/integrations',
      description: 'Interactive sales deal and quote generator, CRM customer binding, pricing tier overrides, promo discounts, and General Ledger posting.',
      aliases: ['Cross-Module Integrations & Sales Simulator', 'Cross-Module Integrations', 'catalog_integrations', 'Quote Simulator'],
      subItems: [
        {
          id: 'catalog_deal_simulator_header',
          titleEn: 'Live Quote & Deal Simulator Console',
          routePath: '/catalog/integrations',
          type: 'screen',
          description: 'Interactive quotation drafting console binding CRM client accounts, pricing tiers, and promo vouchers',
          aliases: ['quote_simulator_console', 'deal_builder_header']
        },
        {
          id: 'catalog_quote_line_items',
          titleEn: 'Dynamic Line Items Builder & Quantity Recalculator',
          routePath: '/catalog/integrations',
          type: 'section',
          description: 'Add catalog items, customize order quantities, apply tier pricing overrides, and compute line subtotals',
          aliases: ['quote_line_items_builder', 'quote_item_selector']
        },
        {
          id: 'catalog_quote_financial_summary',
          titleEn: 'Commercial Quotation Financial Summary & VAT Totals',
          routePath: '/catalog/integrations',
          type: 'section',
          description: 'Live recalculation card showing gross subtotal, coupon deduction, tax VAT, and final grand total',
          aliases: ['quote_totals_card', 'vat_grand_total_summary']
        },
        {
          id: 'catalog_post_to_ledger_action',
          titleEn: 'Post Invoice to General Ledger Action',
          routePath: '/catalog/integrations',
          type: 'action',
          description: 'Synchronize finalized sales quote with Accounting Hub, generating formal reference invoice ID',
          aliases: ['post_to_ledger', 'accounting_sync_button']
        },
        {
          id: 'catalog_posted_invoices_history',
          titleEn: 'Synchronized Invoice History & Audit Log',
          routePath: '/catalog/integrations',
          type: 'screen',
          description: 'Audit log table displaying all posted invoice records with timestamp, customer, and transaction totals',
          aliases: ['posted_invoices_table', 'ledger_sync_history']
        }
      ]
    }
  ], []);

  // Home / Workspace Module Navigation & Screen Tree mapping exact dashboard sections and action controls
  const homeDomainGroups: HRTreeDomainGroup[] = useMemo(() => [
    // 1. /home - Workspace Overview & Quick Actions
    {
      groupId: 'home_overview',
      titleEn: 'Workspace Overview & Quick Actions',
      routePath: '/home',
      parentTab: 'Overview & Quick Actions',
      aliases: ['/home', 'home_overview', 'Overview', 'Workspace Overview', 'home'],
      description: 'Main greeting header, quick action menu, onboarding tour progress, and layout customization controls',
      subItems: [
        {
          id: 'new_button',
          titleEn: 'New... Quick Action Menu (+ New...)',
          routePath: '/home',
          type: 'action',
          description: 'Top-bar launch button for requesting time off, giving recognition, filing complaints, or shift swaps',
          aliases: ['/home#new', 'new_button', 'New...', 'quick_new_action', 'New Button']
        },
        {
          id: 'edit_layout',
          titleEn: 'Edit Layout Customizer (Edit Layout)',
          routePath: '/home',
          type: 'action',
          description: 'Top-bar customization modal allowing users to reorder, hide, and customize home dashboard card layout',
          aliases: ['/home#layout', 'edit_layout', 'Edit Layout', 'layout_customizer', 'Customize Layout']
        },
        {
          id: 'continue_tour',
          titleEn: 'Continue your tour of Systo Biz',
          routePath: '/home',
          type: 'widget',
          description: 'Guided onboarding walkthrough card showing progress bar, active module steps, and interactive orientation',
          aliases: ['/home#tour', 'continue_tour', 'Continue your tour of Systo Biz', 'Onboarding Tour', 'guided_tour']
        },
        {
          id: 'welcome_to_systo_biz',
          titleEn: 'Welcome to Systo Biz',
          routePath: '/home',
          type: 'widget',
          description: 'New hire welcome guide card, company values, workspace introduction, and employee handbook shortcuts',
          aliases: ['/home#welcome', 'welcome_to_systo_biz', 'Welcome to Systo Biz', 'Welcome Card', 'welcome_banner']
        }
      ]
    },

    // 2. /home - Personal Employee Workplace
    {
      groupId: 'home_personal',
      titleEn: 'Personal Employee Workplace',
      routePath: '/home',
      parentTab: 'My Workplace',
      aliases: ['/home', 'home_personal', 'Personal Workplace', 'My Stuff'],
      description: 'Individual employee self-service widgets, personal time-off balances, awards, and work items',
      subItems: [
        {
          id: 'my_stuff',
          titleEn: 'My Stuff (Files, Courses & Work Items)',
          routePath: '/home',
          type: 'widget',
          description: 'Personal repository card displaying employee documents, enrolled training courses, and tasks',
          aliases: ['/home#stuff', 'my_stuff', 'My Stuff', 'Personal Stuff', 'my_items']
        },
        {
          id: 'time_off',
          titleEn: 'Time Off (Leave & Balances Quota)',
          routePath: '/home',
          type: 'widget',
          description: 'Personal paid time off balance, upcoming holidays, sick leaves quota, and quick request trigger',
          aliases: ['/home#time-off', 'time_off', 'Time Off', 'Leaves', 'leave_summary', 'My Time Off']
        },
        {
          id: 'recognition_kudos',
          titleEn: 'Recognition & Kudos Wall',
          routePath: '/home',
          type: 'widget',
          description: 'Company-wide appreciation feed, peer praise badges, kudos awards, and employee achievement points',
          aliases: ['/home#recognition', 'recognition_kudos', 'Recognition & Kudos', 'Recognition', 'kudos', 'Recognitions']
        }
      ]
    },

    // 3. /home - Team & Workforce Telemetry
    {
      groupId: 'home_team',
      titleEn: 'Team & Workforce Telemetry',
      routePath: '/home',
      parentTab: 'Team & Hierarchy',
      aliases: ['/home', 'home_team', 'Team Telemetry', 'Direct Reports'],
      description: 'Supervisory direct reports, live presence, birthdays, work anniversaries, and headcount distribution',
      subItems: [
        {
          id: 'my_direct_reports',
          titleEn: 'My Direct Reports & Team',
          routePath: '/home',
          type: 'widget',
          description: 'Subordinate team member cards, department headcount tabs, reporting lines, and turnover rates',
          aliases: ['/home#reports', 'my_direct_reports', 'My Direct Reports & Team', 'Direct Reports', 'My Team', 'direct_reports']
        },
        {
          id: 'whos_out',
          titleEn: "Who's Out (Out of Office Today)",
          routePath: '/home',
          type: 'widget',
          description: 'Live attendance card displaying colleagues currently out of office, on approved leave, or business travel',
          aliases: ['/home#out', 'whos_out', "Who's Out", 'Out of Office', 'who_is_out', 'Today Leaves']
        },
        {
          id: 'celebrations',
          titleEn: 'Celebrations (Birthdays & Anniversaries)',
          routePath: '/home',
          type: 'widget',
          description: 'Upcoming employee birthdays, corporate work anniversaries, and milestone celebration widget',
          aliases: ['/home#celebrations', 'celebrations', 'Celebrations', 'Birthdays', 'Anniversaries', 'Work Anniversaries']
        },
        {
          id: 'employee_distribution',
          titleEn: 'Employee Distribution (Headcount Breakdown)',
          routePath: '/home',
          type: 'widget',
          description: 'Interactive departmental distribution breakdown displaying active workforce percentages across business units',
          aliases: ['/home#distribution', 'employee_distribution', 'Employee Distribution', 'Headcount Distribution', 'Department Distribution']
        }
      ]
    },

    // 4. /home - Company Bulletins & Management Queue
    {
      groupId: 'home_management',
      titleEn: 'Company Bulletins & Management Queue',
      routePath: '/home',
      parentTab: 'Company Bulletins & Approvals',
      aliases: ['/home', 'home_management', 'Company Bulletins', 'Management Queue'],
      description: 'Executive announcements, pending leave approval queues, real-time consumption telemetry, and links',
      subItems: [
        {
          id: 'whats_happening',
          titleEn: "What's happening at Systo Biz (Announcements)",
          routePath: '/home',
          type: 'widget',
          description: 'Official corporate announcement feed, executive notices, policy updates, and company bulletins',
          aliases: ['/home#announcements', 'whats_happening', "What's happening at Systo Biz", 'Announcements', 'Company News', 'announcements']
        },
        {
          id: 'pending_time_off',
          titleEn: 'Pending Time Off Requests (Manager Approval Queue)',
          routePath: '/home',
          type: 'widget',
          description: 'Confidential manager queue displaying pending subordinate leave requests with direct one-click approve/reject',
          aliases: ['/home#pending-leaves', 'pending_time_off', 'Pending Time Off Requests', 'Pending Leaves', 'pending_leaves', 'Pending Time Off']
        },
        {
          id: 'time_off_used',
          titleEn: 'Time Off Used (Real-time Leave Telemetry)',
          routePath: '/home',
          type: 'widget',
          description: 'Real-time telemetry donut chart tracking total company or departmental leave consumption vs allowances',
          aliases: ['/home#used-leaves', 'time_off_used', 'Time Off Used (Real-time)', 'Time Off Used', 'leave_balance_chart']
        },
        {
          id: 'company_links',
          titleEn: 'Company Links (Official Portals)',
          routePath: '/home',
          type: 'widget',
          description: 'Curated corporate bookmarks, external cloud tools, partner links, and operational shortcut directory',
          aliases: ['/home#links', 'company_links', 'Company Links', 'Corporate Links', 'Quick Links']
        },
        {
          id: 'invite_your_team',
          titleEn: 'Invite Your Team (Registration Modal & Card)',
          routePath: '/home',
          type: 'widget',
          description: 'Team growth card allowing administrators to dispatch onboarding email invites and registration links',
          aliases: ['/home#invite', 'invite_your_team', 'Invite Your Team', 'Invite Team', 'invite_modal']
        }
      ]
    }
  ], []);

  const isHomeModule = useMemo(() => {
    const low = (moduleId || '').toLowerCase();
    const canonLow = (canonModule || '').toLowerCase();
    return low === 'home' || canonLow === 'home' || low.includes('home') || low.includes('workspace');
  }, [moduleId, canonModule]);

  const isProductsModule = useMemo(() => {
    let decoded = moduleId || '';
    try {
      decoded = decodeURIComponent(moduleId || '');
    } catch (e) {
      decoded = moduleId || '';
    }
    const low = decoded.toLowerCase();
    const canonLow = (canonModule || '').toLowerCase();
    return (
      low.includes('product') ||
      low.includes('catalog') ||
      canonLow.includes('product') ||
      canonLow.includes('catalog') ||
      moduleId === 'Products%2FServices' ||
      moduleId === 'Products/Services'
    );
  }, [moduleId, canonModule]);

  const isKnowledgeBaseModule = useMemo(() => {
    const low = (moduleId || '').toLowerCase();
    const canonLow = (canonModule || '').toLowerCase();
    return low.includes('knowledge') || low === 'kb' || canonLow.includes('knowledge') || canonLow === 'kb';
  }, [moduleId, canonModule]);

  const isQAModule = useMemo(() => {
    const low = (moduleId || '').toLowerCase();
    const canonLow = (canonModule || '').toLowerCase();
    return low === 'qa' || low.includes('quality') || canonLow === 'qa' || canonLow.includes('quality');
  }, [moduleId, canonModule]);

  const activeDomainGroups = useMemo(() => {
    if (isHomeModule) return homeDomainGroups;
    if (isProductsModule) return productsDomainGroups;
    if (isKnowledgeBaseModule) return kbDomainGroups;
    if (isQAModule) return qaDomainGroups;
    return hrDomainGroups;
  }, [isHomeModule, isProductsModule, isKnowledgeBaseModule, isQAModule, homeDomainGroups, productsDomainGroups, kbDomainGroups, qaDomainGroups, hrDomainGroups]);

  const toggleGroupCollapse = (gId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [gId]: !prev[gId] }));
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    activeDomainGroups.forEach(g => { next[g.groupId] = true; });
    setCollapsedGroups(next);
  };

  const expandAll = () => {
    setCollapsedGroups({});
  };

  const searchKeyword = (matrixSearch || localSearch || '').toLowerCase().trim();

  const filteredGroups = useMemo(() => {
    if (!searchKeyword) return activeDomainGroups;

    return activeDomainGroups
      .map(group => {
        const matchesParent = group.parentTab.toLowerCase().includes(searchKeyword) || 
                              group.titleEn.toLowerCase().includes(searchKeyword) ||
                              group.routePath.toLowerCase().includes(searchKeyword) ||
                              group.description.toLowerCase().includes(searchKeyword);

        const matchedSubItems = group.subItems.filter(st => 
          st.titleEn.toLowerCase().includes(searchKeyword) ||
          st.routePath.toLowerCase().includes(searchKeyword) ||
          st.id.toLowerCase().includes(searchKeyword) ||
          st.description.toLowerCase().includes(searchKeyword)
        );

        if (matchesParent) return group;
        if (matchedSubItems.length > 0) {
          return {
            ...group,
            subItems: matchedSubItems
          };
        }
        return null;
      })
      .filter(Boolean) as HRTreeDomainGroup[];
  }, [activeDomainGroups, searchKeyword]);

  const goToAdvancedRules = (tabName: string) => {
    const encodedMod = encodeURIComponent(decodeURIComponent(moduleId));
    const encodedTab = encodeURIComponent(tabName);
    navigate(`/admin/rbac/${roleId}/module/${encodedMod}/advanced-rules/${encodedTab}`);
  };

  // Bulk enable / disable all pages and sub-tabs
  const handleBulkEnableAll = (enable: boolean) => {
    if (role?.name === 'Admin') return;
    activeDomainGroups.forEach(g => {
      const allSubKeys = g.subItems.flatMap(s => [s.id, s.titleEn, s.routePath, ...(s.aliases || [])]);
      toggleTabVisibilityWithCascade(g.parentTab, enable, allSubKeys);
      if (g.aliases) {
        g.aliases.forEach(a => toggleTabVisibility(a, enable));
      }
      g.subItems.forEach(st => {
        toggleTabVisibility(st.id, enable);
        toggleTabVisibility(st.titleEn, enable);
        toggleTabVisibility(st.routePath, enable);
        if (st.aliases) {
          st.aliases.forEach(a => toggleTabVisibility(a, enable));
        }
      });
    });
  };

  // Group level toggle
  const handleGroupToggle = (group: HRTreeDomainGroup, checked: boolean) => {
    const allSubKeys = group.subItems.flatMap(s => [s.id, s.titleEn, s.routePath, ...(s.aliases || [])]);
    toggleTabVisibilityWithCascade(group.parentTab, checked, allSubKeys);
    if (group.aliases) {
      group.aliases.forEach(a => toggleTabVisibility(a, checked));
    }
  };

  // Sub-item toggle (updates ID, title, and routePath)
  const handleSubItemToggle = (subItem: HRTreeSubItem, checked: boolean) => {
    toggleTabVisibility(subItem.id, checked);
    toggleTabVisibility(subItem.titleEn, checked);
    toggleTabVisibility(subItem.routePath, checked);
    if (subItem.aliases) {
      subItem.aliases.forEach(a => toggleTabVisibility(a, checked));
    }
  };

  // Sub-item level update
  const handleSubItemLevel = (subItem: HRTreeSubItem, level: number) => {
    updateTabLevel(subItem.id, level);
    updateTabLevel(subItem.titleEn, level);
    updateTabLevel(subItem.routePath, level);
    if (subItem.aliases) {
      subItem.aliases.forEach(a => updateTabLevel(a, level));
    }
  };

  // Sub-item scope update
  const handleSubItemScope = (subItem: HRTreeSubItem, scope: string) => {
    updateTabDataScope(subItem.id, scope);
    updateTabDataScope(subItem.titleEn, scope);
    updateTabDataScope(subItem.routePath, scope);
    if (subItem.aliases) {
      subItem.aliases.forEach(a => updateTabDataScope(a, scope));
    }
  };

  // Direct Save Handler
  const handleSaveTree = async () => {
    if (role?.name === 'Admin') return;
    const success = await savePermissions();
    if (success) {
      setSaveSuccessMsg(`All ${isHomeModule ? 'Home / Workspace' : isProductsModule ? 'Products & Services' : isKnowledgeBaseModule ? 'Knowledge Base' : isQAModule ? 'Quality Assurance (QA)' : 'HR'} module screen permissions successfully persisted to the database!`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <FolderTree className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {isHomeModule ? 'Home / Workspace Screen & Navigation Tree' :
               isProductsModule ? 'Products & Services Screen & Navigation Tree' :
               isKnowledgeBaseModule ? 'Knowledge Base Screen & Navigation Tree' :
               isQAModule ? 'Quality Assurance (QA) Screen & Navigation Tree' :
               'HR Module Screen & Navigation Tree'}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
              {activeDomainGroups.length} Core Routes & Sub-tabs Active
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Toggle visibility, default permissions (Level), and data scopes for all primary pages, sub-pages, and tabs in <strong className="text-slate-800">{moduleMetadata?.nameEn || moduleId}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search routes, screens & tabs..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none w-52"
            />
          </div>

          <button
            type="button"
            onClick={expandAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Collapse All
          </button>

          {role?.name !== 'Admin' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => handleBulkEnableAll(true)}
                className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                title="Enable all screens for this role"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enable All</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkEnableAll(false)}
                className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                title="Disable all screens for this role"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Disable All</span>
              </button>

              {/* Direct Save Button inside toolbar */}
              <button
                type="button"
                onClick={handleSaveTree}
                disabled={saving || role?.name === 'Admin'}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer ml-1",
                  hasChanges
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 hover:scale-105 active:scale-95"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                )}
                title="Save current module permissions to database"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saving ? 'Saving...' : 'Save Permissions'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Persistence feedback alert */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Domain Groups Hierarchical Accordion */}
      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500 font-semibold shadow-xs">
            No screens or tabs match your search query: "{searchKeyword}"
          </div>
        ) : (
          filteredGroups.map(group => {
            const isCollapsed = !!collapsedGroups[group.groupId];
            const parentIsVisible = isTabVisible(group.parentTab);
            const parentLevel = getTabLevel(group.parentTab);
            const parentScope = getTabDataScope(group.parentTab);

            return (
              <div key={group.groupId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {/* PARENT TAB / ROUTE HEADER ROW */}
                <div className={cn(
                  "p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors",
                  !parentIsVisible && "bg-slate-100/60 opacity-60"
                )}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleGroupCollapse(group.groupId)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
                      title={isCollapsed ? "Expand sub-pages and tabs" : "Collapse"}
                    >
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Parent Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer scale-90 shrink-0">
                      <input
                        type="checkbox"
                        checked={parentIsVisible}
                        disabled={role?.name === 'Admin'}
                        onChange={(e) => handleGroupToggle(group, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900">{group.titleEn}</h4>
                        
                        {/* Route badge */}
                        <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-[10px] font-mono font-bold">
                          {group.routePath}
                        </span>

                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black">
                          {group.subItems.length} Sub-screens & Tabs
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Permission Level Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Level:</span>
                      <select
                        value={parentLevel}
                        disabled={role?.name === 'Admin' || !parentIsVisible}
                        onChange={(e) => {
                          const lvl = parseInt(e.target.value);
                          updateTabLevel(group.parentTab, lvl);
                          if (group.aliases) group.aliases.forEach(a => updateTabLevel(a, lvl));
                        }}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="0">Default (Inherit)</option>
                        <option value="1">Editable (Full Access)</option>
                        <option value="2">Read-Only (View Only)</option>
                        <option value="3">Hidden (Blocked)</option>
                      </select>
                    </div>

                    {/* Data Scope Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Scope:</span>
                      <select
                        value={parentScope}
                        disabled={role?.name === 'Admin' || !parentIsVisible}
                        onChange={(e) => {
                          const scp = e.target.value;
                          updateTabDataScope(group.parentTab, scp);
                          if (group.aliases) group.aliases.forEach(a => updateTabDataScope(a, scp));
                        }}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-800 cursor-pointer focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="own">Own Only (Personal)</option>
                        <option value="team">Team Only</option>
                        <option value="department">Department Only</option>
                        <option value="global">Global (Entire Company)</option>
                      </select>
                    </div>

                    {/* Advanced Rules Button */}
                    <button
                      type="button"
                      onClick={() => goToAdvancedRules(group.parentTab)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                      title="Configure field-level security and custom operational actions for this screen"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Advanced Rules</span>
                    </button>
                  </div>
                </div>

                {/* SUB-PAGES AND SUB-TABS INDENTED TREE ROWS */}
                {!isCollapsed && group.subItems.length > 0 && (
                  <div className="divide-y divide-slate-100 bg-white">
                    {group.subItems.map(subItem => {
                      const subIsVisible = isTabVisible(subItem.id) && isTabVisible(subItem.titleEn);
                      const subLevel = getTabLevel(subItem.id) || getTabLevel(subItem.titleEn);
                      const subScope = getTabDataScope(subItem.id) || getTabDataScope(subItem.titleEn);

                      return (
                        <div 
                          key={subItem.id}
                          className={cn(
                            "p-3.5 pl-8 md:pl-12 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80",
                            !subIsVisible && "bg-slate-50/50 opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono text-xs font-bold shrink-0">└─</span>
                            
                            {/* Sub-item Toggle */}
                            <label className="relative inline-flex items-center cursor-pointer scale-75 shrink-0">
                              <input
                                type="checkbox"
                                checked={subIsVisible}
                                disabled={role?.name === 'Admin'}
                                onChange={(e) => handleSubItemToggle(subItem, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                            </label>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-800">{subItem.titleEn}</span>
                                
                                {/* Route Tag */}
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9.5px] font-semibold border border-slate-200">
                                  {subItem.routePath}
                                </span>

                                {/* Type Tag */}
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                                  subItem.type === 'sub_page' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                  subItem.type === 'screen' ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                                  subItem.type === 'section' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                  subItem.type === 'action' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                  "bg-purple-50 text-purple-700 border border-purple-200"
                                )}>
                                  {subItem.type === 'sub_page' ? 'Sub-page' :
                                   subItem.type === 'screen' ? 'Screen' :
                                   subItem.type === 'section' ? 'Section' :
                                   subItem.type === 'action' ? 'Action' : 'Tab Component'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                                {subItem.description}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 flex-wrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[9.5px] text-slate-400 font-bold uppercase">Level:</span>
                              <select
                                value={subLevel}
                                disabled={role?.name === 'Admin' || !subIsVisible}
                                onChange={(e) => handleSubItemLevel(subItem, parseInt(e.target.value))}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none text-slate-700 cursor-pointer"
                              >
                                <option value="0">Default</option>
                                <option value="1">Editable</option>
                                <option value="2">Read-Only</option>
                                <option value="3">Hidden</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-[9.5px] text-slate-400 font-bold uppercase">Scope:</span>
                              <select
                                value={subScope}
                                disabled={role?.name === 'Admin' || !subIsVisible}
                                onChange={(e) => handleSubItemScope(subItem, e.target.value)}
                                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none text-slate-700 cursor-pointer"
                              >
                                <option value="own">Own</option>
                                <option value="team">Team</option>
                                <option value="department">Department</option>
                                <option value="global">Global</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => goToAdvancedRules(group.parentTab)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Go to screen rules & field security"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RBACModuleTreePage;
