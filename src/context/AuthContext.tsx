import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { safeSetItem, safeGetItem, safeRemoveItem } from '../utils/safeStorage';

interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role?: string;
  role_name?: string;
  department_id?: number;
  job_title?: string;
  company_id: number;
}

interface AuthContextType {
  user: User | null;
  effectiveUser?: User | null;
  realUser?: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUserPermissions: (permissions: any) => void;
  updateUser: (userData: User) => void;
  checkPermission: (module: string, action: string) => boolean;
  getDataScope: (module: string, tab?: string) => 'global' | 'branch' | 'own' | 'team' | 'custom';
  isIfOwner: (module: string, tab?: string) => boolean;
  getPermLevel: (module: string, tab?: string) => number;
  getFieldPermStatus: (module: string, fieldKey: string, fieldLevel?: number, tabName?: string) => 'editable' | 'readonly' | 'hidden';
  canRead: (module: string, tab?: string) => boolean;
  canWrite: (module: string, tab?: string) => boolean;
  canCreate: (module: string, tab?: string) => boolean;
  canDelete: (module: string, tab?: string) => boolean;
  canSelect: (module: string, tab?: string) => boolean;
  canSubmit: (module: string, tab?: string) => boolean;
  canCancel: (module: string, tab?: string) => boolean;
  canAmend: (module: string, tab?: string) => boolean;
  canReport: (module: string, tab?: string) => boolean;
  canImport: (module: string, tab?: string) => boolean;
  canExport: (module: string, tab?: string) => boolean;
  canPrint: (module: string, tab?: string) => boolean;
  canEmail: (module: string, tab?: string) => boolean;
  canShare: (module: string, tab?: string) => boolean;
  isFieldVisible: (module: string, fieldKey: string, tabName?: string) => boolean;
  refreshUser: () => Promise<void>;
  previewRole: { id: number; name: string; permissions: any } | null;
  setPreviewRole: (role: { id: number; name: string; permissions: any } | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function normalizeModuleName(moduleName: string): string {
  if (!moduleName || typeof moduleName !== 'string') return '';
  const clean = moduleName.trim().toLowerCase();
  
  const map: Record<string, string> = {
    // By ID
    'home': 'Home',
    'dashboard': 'Dashboard',
    'ai-business': 'AI Business',
    'ai-boardroom': 'AI Boardroom',
    'meeting-hub': 'Meeting Hub',
    'marketing': 'Marketing Hub',
    'sops': 'SOPs',
    'process-mapping': 'Process Mapping',
    'kb': 'Knowledge Base',
    'knowledge base': 'Knowledge Base',
    'knowledge_base': 'Knowledge Base',
    'knowledge': 'Knowledge Base',
    'knowledge%20base': 'Knowledge Base',
    'leads': 'Leads',
    'crm': 'CRM',
    'operations-hub': 'Operations Hub',
    'acct': 'Accounting',
    'automation': 'Automation',
    'qa': 'QA',
    'hr': 'HR',
    'training': 'Training',
    'tasks': 'Tasks',
    'kpis': 'KPIs',
    'risk': 'Risk',
    'kaizen': 'Kaizen',
    'business-model': 'Business Model',
    'products': 'Products/Services',
    'products/services': 'Products/Services',
    'products & services': 'Products/Services',
    'products%2fservices': 'Products/Services',
    'products_services': 'Products/Services',
    'catalog': 'Products/Services',
    'catalogs': 'Products/Services',
    'product': 'Products/Services',
    'services': 'Products/Services',
    'raci': 'RACI',
    'comm': 'Communication',
    'integration': 'Integrations',
    'admin': 'Admin',

    // By Name
    'sop management': 'SOPs',
    'crm leads': 'Leads',
    'sales crm': 'CRM',
    'quality assurance': 'QA',
    'hr management': 'HR',
    'training hub': 'Training',
    'performance & kpis': 'KPIs',
    'risk register': 'Risk',
    'kaizen improvement': 'Kaizen',
    'raci matrix': 'RACI',
    'integration hub': 'Integrations',
    'admin panel': 'Admin'
  };

  return map[clean] || moduleName;
}

export function normalizeTabAlias(tabName: string): string {
  if (!tabName || typeof tabName !== 'string') return '';
  let clean = tabName.toLowerCase().trim().replace(/_/g, ' ');
  if (clean.startsWith('tab:')) clean = clean.substring(4).trim();
  clean = clean.replace(/\s+/g, ' ');

  if (clean === 'directory' || clean === 'employee directory' || clean === 'employees' || clean === 'employee profiles & directory') return 'employee directory';
  if (clean === 'departments' || clean === 'departments & structure' || clean === 'structure') return 'departments & structure';
  if (clean === 'recruitment' || clean === 'recruitment & jobs' || clean === 'jobs' || clean === 'hiring') return 'recruitment & jobs';
  if (clean === 'candidates' || clean === 'candidates pipeline' || clean === 'pipeline') return 'candidates pipeline';
  if (clean === 'job openings' || clean === 'job postings' || clean === 'openings') return 'job openings';
  if (clean === 'interviews' || clean === 'scorecards' || clean === 'interviews & scorecards') return 'interviews & scorecards';
  if (clean === 'payroll' || clean === 'payroll & salaries' || clean === 'salaries') return 'payroll & salaries';
  if (clean === 'attendance' || clean === 'attendance & clock in' || clean === 'clock in') return 'attendance & clock in';
  if (clean === 'daily' || clean === 'daily logs' || clean === 'daily_logs') return 'daily logs';
  if (clean === 'shifts' || clean === 'shift schedule' || clean === 'shift_schedule') return 'shift schedule';
  if (clean === 'breaks') return 'breaks';
  if (clean === 'leave' || clean === 'leave management' || clean === 'leaves' || clean === 'time off' || clean === 'time off & leaves') return 'time off & leaves';
  if (clean === 'swaps' || clean === 'shift swaps' || clean === 'swap management') return 'shift swaps';
  if (clean === 'performance' || clean === 'performance & okrs' || clean === 'okrs') return 'performance & okrs';
  if (clean === 'complaints' || clean === 'complaints & grievances' || clean === 'grievances') return 'complaints & grievances';
  if (clean === 'assets' || clean === 'assets management') return 'assets management';
  if (clean === 'benefits' || clean === 'benefits & allowances') return 'benefits & allowances';
  if (clean === 'onboarding' || clean === 'onboarding & offboarding') return 'onboarding & offboarding';
  if (clean === 'org chart' || clean === 'orgchart') return 'org chart';

  // Quality Assurance (QA) Primary & Sub-Tab Normalization
  if (
    clean === 'quality dashboard' || 
    clean === 'quality dashboard & analytics' || 
    clean === 'qa dashboard' || 
    clean === 'overview' || 
    clean === '/qa/dashboard' || 
    clean === '/qa/dashboard/overview' || 
    clean === 'qa_dashboard' || 
    clean === 'qa_dashboard_hub' || 
    clean === 'qa_dashboard_overview' ||
    clean === 'qa_overview' ||
    clean === 'quality overview & kpi widgets'
  ) return 'quality dashboard';

  if (
    clean === 'employee quality' || 
    clean === 'employee quality tracking' || 
    clean === 'employee tracking' || 
    clean === 'employee quality tracking & scorecards' || 
    clean === '/qa/dashboard/employee-tracking' || 
    clean === '/qa/dashboard/employees' || 
    clean === 'qa_employee_tracking' ||
    clean === 'qa_agent_cards'
  ) return 'employee quality tracking';

  if (
    clean === 'transactions audit' || 
    clean === 'transactions & incidents audit' || 
    clean === 'transactions audit & incident investigation hub' ||
    clean === '/qa/transactions-audit' || 
    clean === 'transactions_audit' || 
    clean === 'qa_transactions' ||
    clean === 'qa_transactions_audit_hub'
  ) return 'transactions audit';

  if (
    clean === 'complaints' || 
    clean === 'customer complaints' ||
    clean === 'complaints audit' || 
    clean === 'customer complaints audit queue' ||
    clean === '/qa/transactions-audit/complaints' || 
    clean === 'qa_complaints_queue' ||
    clean === 'qa_trans_complaints' ||
    clean === 'complaints_audit'
  ) return 'complaints';

  if (
    clean === 'delays' || 
    clean === 'operational delays' ||
    clean === 'delays audit' || 
    clean === 'order & dispatch delays audit queue' ||
    clean === '/qa/transactions-audit/delays' || 
    clean === 'qa_delays_queue' ||
    clean === 'qa_trans_delays' ||
    clean === 'delays_audit'
  ) return 'delays';

  if (
    clean === 'refunds' || 
    clean === 'refunds & claims' ||
    clean === 'refunds audit' || 
    clean === 'refunds & chargebacks financial audit' ||
    clean === '/qa/transactions-audit/refunds' || 
    clean === 'qa_refunds_queue' ||
    clean === 'qa_trans_refunds' ||
    clean === 'refunds_audit'
  ) return 'refunds';

  if (
    clean === 'cancellations' || 
    clean === 'booking cancellations' ||
    clean === 'cancellations audit' || 
    clean === 'cancellations & churn audit queue' ||
    clean === '/qa/transactions-audit/cancellations' || 
    clean === 'qa_cancellations_queue' ||
    clean === 'qa_trans_cancellations' ||
    clean === 'cancellations_audit'
  ) return 'cancellations';

  if (
    clean === 'nps' || 
    clean === 'nps & sentiment' ||
    clean === 'nps audit' || 
    clean === 'nps & customer satisfaction feedback audit' ||
    clean === '/qa/transactions-audit/nps' || 
    clean === 'qa_nps_queue' ||
    clean === 'qa_trans_nps' ||
    clean === 'nps_audit'
  ) return 'nps';

  if (
    clean === 'action plans' || 
    clean === 'action-plans' || 
    clean === 'action plans (capa)' ||
    clean === 'corrective action plans & stepper' ||
    clean === '/qa/transactions-audit/action-plans' || 
    clean === '/qa/transactions-audit/action-plans/new' ||
    clean === 'qa_action_plans' ||
    clean === 'qa_trans_action_plans' ||
    clean === 'action_plans'
  ) return 'action plans';

  if (
    clean === 'audit checklists' || 
    clean === 'transaction checklists' || 
    clean === 'checklists' || 
    clean === 'transaction checklists & rubrics' ||
    clean === '/qa/transactions-audit/checklists' || 
    clean === 'qa_rubrics_matrix' ||
    clean === 'qa_trans_checklists'
  ) return 'audit checklists';

  if (
    clean === 'internal audit' || 
    clean === 'internal audit & iso compliance' || 
    clean === 'internal audit, ncr incident log & capa hub' ||
    clean === '/qa/internal-audit' || 
    clean === 'internal_audit' || 
    clean === 'qa_internal' ||
    clean === 'qa_internal_audit_hub'
  ) return 'internal audit';

  if (
    clean === 'checklist templates' || 
    clean === 'audit templates' || 
    clean === 'templates' || 
    clean === 'checklist templates builder & library' ||
    clean === '/qa/internal-audit/templates' || 
    clean === '/qa/internal-audit/checklists' || 
    clean === 'internal_templates' ||
    clean === 'qa_internal_templates' ||
    clean === 'qa_audit_templates'
  ) return 'checklist templates';

  if (
    clean === 'perform audits' || 
    clean === 'perform' || 
    clean === 'live audit execution console' ||
    clean === '/qa/internal-audit/perform' || 
    clean === 'perform_audits' ||
    clean === 'qa_internal_perform' ||
    clean === 'qa_perform_audits'
  ) return 'perform audits';

  if (
    clean === 'ncr incident log' || 
    clean === 'ncr logs' || 
    clean === 'ncr-logs' || 
    clean === 'ncr-log' || 
    clean === 'non-conformance reports (ncr) incident log' ||
    clean === '/qa/internal-audit/ncr-logs' || 
    clean === '/qa/internal-audit/ncr-log' || 
    clean === 'ncr_logs' ||
    clean === 'qa_internal_ncr_log' ||
    clean === 'qa_ncr_incidents'
  ) return 'ncr incident log';

  if (
    clean === 'capa action plans' || 
    clean === 'capa' || 
    clean === 'capa-actions' || 
    clean === 'capa (corrective & preventive action) studio' ||
    clean === '/qa/internal-audit/capa' || 
    clean === '/qa/internal-audit/capa-actions' || 
    clean === 'capa_plans' ||
    clean === 'qa_internal_capa' ||
    clean === 'qa_capa_management'
  ) return 'capa action plans';

  if (
    clean === 'audit history' || 
    clean === 'historical audit trail' || 
    clean === 'historical audit trail & certified records' ||
    clean === 'audit trail & historical log' || 
    clean === '/qa/audit-history' || 
    clean === 'audit_history' || 
    clean === 'qa_history' ||
    clean === 'qa_audit_history_hub' ||
    clean === 'master audit archive & search grid'
  ) return 'audit history';

  if (
    clean === 'qa settings' || 
    clean === 'qa settings & integrations' || 
    clean === 'qa settings & data pipelines' || 
    clean === 'settings & integrations' || 
    clean === '/qa/settings' || 
    clean === 'qa_settings_hub'
  ) return 'qa settings & integrations';

  // Products & Services (Catalog) Primary & Sub-Tab Normalization
  if (
    clean === 'dashboard' ||
    clean === 'catalog dashboard' ||
    clean === '/catalog/dashboard' ||
    clean === 'catalog_dashboard' ||
    clean === 'catalog overview' ||
    clean === 'executive kpi telemetry' ||
    clean === 'catalog_dashboard_kpis' ||
    clean === 'catalog_low_stock_banner' ||
    clean === 'catalog_top_margins_widget' ||
    clean === 'catalog_operations_hub_quickjump' ||
    clean === 'catalog_csv_bulk_tools'
  ) return 'catalog dashboard';

  if (
    clean === 'items directory' ||
    clean === 'products directory' ||
    clean === '/catalog/items' ||
    clean === 'catalog_items' ||
    clean === 'items directory & specifications' ||
    clean === 'products master roster' ||
    clean === 'products & services' ||
    clean === 'items' ||
    clean === 'catalog_items_search_filter' ||
    clean === 'catalog_items_view_toggle' ||
    clean === 'catalog_items_master_grid' ||
    clean === 'catalog_create_new_item' ||
    clean === 'catalog_export_items_csv' ||
    clean === 'catalog_import_items_csv' ||
    clean === 'catalog_seed_mock_items'
  ) return 'items directory';

  if (
    clean === 'prices & promo codes' ||
    clean === 'pricing & promo codes' ||
    clean === 'pricing tables' ||
    clean === 'bundles & deals' ||
    clean === '/catalog/pricing' ||
    clean === 'catalog_pricing' ||
    clean === 'wholesale price lists & coupons' ||
    clean === 'pricing' ||
    clean === 'prices' ||
    clean === 'promo codes' ||
    clean === 'price lists' ||
    clean === '/catalog/pricing/price-lists' ||
    clean === '/catalog/pricing/promo-codes' ||
    clean === 'catalog_pricing_tier_profiles' ||
    clean === 'catalog_promo_codes_manager' ||
    clean === 'catalog_create_price_profile' ||
    clean === 'catalog_create_promo_coupon'
  ) return 'prices & promo codes';

  if (
    clean === 'profitability analytics' ||
    clean === '/catalog/analytics' ||
    clean === 'catalog_analytics' ||
    clean === 'margin audit & contribution analysis' ||
    clean === 'analytics' ||
    clean === 'profitability'
  ) return 'profitability analytics';

  if (
    clean === 'integrations' ||
    clean === 'cross-module integrations' ||
    clean === '/catalog/integrations' ||
    clean === 'catalog_integrations' ||
    clean === 'cross-module live pipelines'
  ) return 'catalog integrations';

  if (
    clean === 'manage fields' ||
    clean === 'categories & catalogs' ||
    clean === 'catalog settings' ||
    clean === '/catalog/setting/manage-fields' ||
    clean === '/catalog/setting' ||
    clean === '/catalog/settings' ||
    clean === 'manage-fields' ||
    clean === 'custom attributes & action permissions'
  ) return 'catalog settings';

  // Knowledge Base Primary & Sub-Tab Normalization
  if (
    clean === 'articles explorer' ||
    clean === '/kb/articles' ||
    clean === '/kb' ||
    clean === 'kb' ||
    clean === 'kb_articles' ||
    clean === 'articles directory' ||
    clean === 'kb root' ||
    clean === 'kb_root' ||
    clean === 'articles' ||
    clean === 'knowledge base shell & workspace hub' ||
    clean === 'kb_articles_search' ||
    clean === 'kb_category_filter' ||
    clean === 'kb_featured_articles' ||
    clean === 'kb_recent_articles'
  ) return 'articles explorer';

  if (
    clean === 'category hub' ||
    clean === '/kb/categories' ||
    clean === 'kb_category_view' ||
    clean === 'category_feed' ||
    clean === 'categories'
  ) return 'category hub';

  if (
    clean === 'article reader & content engine' ||
    clean === '/kb/article' ||
    clean === 'kb_reader' ||
    clean === 'article_reader' ||
    clean === 'article reader' ||
    clean === 'reader'
  ) return 'article reader';

  if (
    clean === 'article authoring & markdown studio' ||
    clean === '/kb/create' ||
    clean === '/kb/edit' ||
    clean === 'create article' ||
    clean === 'kb_create' ||
    clean === 'kb_edit' ||
    clean === 'create'
  ) return 'create article';

  if (
    clean === 'knowledge base management & taxonomies' ||
    clean === '/kb/manage' ||
    clean === 'manage' ||
    clean === 'kb_manage' ||
    clean === 'kb settings' ||
    clean === 'kb_settings' ||
    clean === 'kb_admin' ||
    clean === 'helpfulness statistics'
  ) return 'manage';

  if (
    clean === 'enterprise search & discovery' ||
    clean === '/kb/search' ||
    clean === 'kb_search' ||
    clean === 'search'
  ) return 'kb search';

  // HR Primary & Sub-Tab Normalization
  if (
    clean === 'dashboard' ||
    clean === 'hr dashboard' ||
    clean === '/hr/dashboard' ||
    clean === 'hr_dashboard' ||
    clean === 'dashboard overview' ||
    clean === 'hr control center dashboard' ||
    clean === 'executive summary metrics & kpis' ||
    clean === 'dashboard_kpi_metrics' ||
    clean === 'live workforce activity & presence telemetry' ||
    clean === 'dashboard_workforce_telemetry' ||
    clean === 'headcount turnover & gender distribution' ||
    clean === 'dashboard_turnover_analytics' ||
    clean === 'department headcount distribution' ||
    clean === 'dashboard_dept_breakdown'
  ) return 'hr dashboard';

  if (
    clean === 'directory' ||
    clean === 'employee directory' ||
    clean === '/hr/directory' ||
    clean === 'hr_directory' ||
    clean === 'employees' ||
    clean === 'employee files' ||
    clean === 'employee directory & master records' ||
    clean === 'active & pending employee roster' ||
    clean === 'directory_master_roster' ||
    clean === 'comprehensive employee personal profile dossier' ||
    clean === 'directory_employee_dossier' ||
    clean === 'salary & banking compensation view' ||
    clean === 'directory_compensation_view' ||
    clean === 'employee credentials & system login info' ||
    clean === 'directory_login_credentials' ||
    clean === 'emergency contacts & family dependents' ||
    clean === 'directory_emergency_contacts' ||
    clean === 'disciplinary penalties & formal warnings' ||
    clean === 'directory_disciplinary_penalties'
  ) return 'hr directory';

  if (
    clean === 'departments' ||
    clean === 'departments & structure' ||
    clean === '/hr/departments' ||
    clean === 'hr_departments' ||
    clean === 'department hierarchy & tree overview' ||
    clean === 'departments_org_tree' ||
    clean === 'create & edit department structural units' ||
    clean === 'departments_crud_editor' ||
    clean === 'assign department head & leadership' ||
    clean === 'departments_leadership_assignment' ||
    clean === 'department budget allocations & salary caps' ||
    clean === 'departments_budget_caps'
  ) return 'hr departments';

  if (
    clean === 'recruitment' ||
    clean === 'hiring' ||
    clean === 'recruitment & jobs' ||
    clean === '/hr/recruitment' ||
    clean === 'hr_recruitment' ||
    clean === 'open job requisitions & public vacancies' ||
    clean === 'recruitment_job_openings' ||
    clean === 'talent pipeline kanban board' ||
    clean === 'recruitment_pipeline_kanban' ||
    clean === 'applicant candidate profiles & resumes' ||
    clean === 'recruitment_candidate_profiles' ||
    clean === 'interview scheduling & scorecard evaluations' ||
    clean === 'recruitment_interviews_scoring' ||
    clean === 'offer letters & compensation proposals' ||
    clean === 'recruitment_job_offers'
  ) return 'hr recruitment';

  if (
    clean === 'payroll' ||
    clean === 'payroll & salaries' ||
    clean === '/hr/payroll' ||
    clean === 'hr_payroll' ||
    clean === 'monthly payroll execution & payslips' ||
    clean === 'payroll_monthly_runs' ||
    clean === 'employee compensation & salary profiles' ||
    clean === 'payroll_salary_profiles' ||
    clean === 'benefits, allowances & spot bonuses' ||
    clean === 'payroll_benefits_allowances' ||
    clean === 'deductions, penalties & salary advances' ||
    clean === 'payroll_deductions_penalties' ||
    clean === 'income tax & social insurance calculations' ||
    clean === 'payroll_tax_insurance'
  ) return 'hr payroll';

  if (
    clean === 'attendance' ||
    clean === 'attendance & clock in' ||
    clean === '/hr/attendance' ||
    clean === 'hr_attendance' ||
    clean === 'daily attendance logs & clock punches' ||
    clean === 'attendance_daily_logs' ||
    clean === 'shift schedules, rotations & rosters' ||
    clean === 'attendance_shift_schedules' ||
    clean === 'break shifts & time tracking' ||
    clean === 'attendance_breaks_tracking' ||
    clean === 'leave requests, approvals & accrual balances' ||
    clean === 'attendance_leave_management' ||
    clean === 'shift swaps & colleague cover requests' ||
    clean === 'attendance_shift_swaps'
  ) return 'hr attendance';

  if (
    clean === 'performance' ||
    clean === 'performance & okrs' ||
    clean === '/hr/performance' ||
    clean === 'hr_performance' ||
    clean === 'scheduled performance appraisal cycles' ||
    clean === 'performance_appraisal_cycles' ||
    clean === 'okr & goal achievement tracking' ||
    clean === 'performance_okr_tracking' ||
    clean === 'peer & 360-degree feedback reviews' ||
    clean === 'performance_360_feedback' ||
    clean === 'skill matrix & training course catalog' ||
    clean === 'performance_training_matrix'
  ) return 'hr performance';

  if (
    clean === 'orgchart' ||
    clean === 'org chart' ||
    clean === '/hr/orgchart' ||
    clean === 'hr_orgchart' ||
    clean === 'visual organization hierarchy chart' ||
    clean === 'orgchart_visual_hierarchy' ||
    clean === 'leadership reporting chain & matrix' ||
    clean === 'orgchart_reporting_chain'
  ) return 'hr orgchart';

  if (
    clean === 'complaints' ||
    clean === 'complaints & grievances' ||
    clean === '/hr/complaints' ||
    clean === 'hr_complaints' ||
    clean === 'anonymous grievance intake & case registry' ||
    clean === 'complaints_case_registry' ||
    clean === 'investigation notes & evidence attachments' ||
    clean === 'complaints_investigations' ||
    clean === 'hearing resolutions & mediation settlements' ||
    clean === 'complaints_resolution_settlements'
  ) return 'hr complaints';

  if (
    clean === 'archived' ||
    clean === 'archived staff' ||
    clean === 'archived employees' ||
    clean === '/hr/archived' ||
    clean === 'hr_archived' ||
    clean === 'former employee archives & termination log' ||
    clean === 'archived_former_employees' ||
    clean === 'exit interview feedback & departure surveys' ||
    clean === 'archived_exit_interviews' ||
    clean === 'full & final settlement vouchers' ||
    clean === 'archived_final_settlement' ||
    clean === 're-hire eligibility & legal retention locks' ||
    clean === 'archived_rehire_eligibility'
  ) return 'hr archived';

  return clean;
}

export function findPermKey(perms: any, moduleName: string): string | undefined {
  if (!perms || typeof perms !== 'object' || !moduleName) return undefined;
  const rawTarget = (moduleName || '').toLowerCase().trim();
  const normTarget = normalizeModuleName(moduleName).toLowerCase();

  return Object.keys(perms).find(k => {
    const kRaw = (k || '').toLowerCase().trim();
    const kNorm = normalizeModuleName(k).toLowerCase();
    return kRaw === rawTarget || kRaw === normTarget || kNorm === normTarget || kNorm === rawTarget;
  });
}

export function findTabKey(tabObj: any, tabName: string): string | undefined {
  if (!tabObj || typeof tabObj !== 'object' || !tabName) return undefined;
  const cleanName = tabName.startsWith('tab:') ? tabName.substring(4) : tabName;
  const rawTab = (cleanName || '').toLowerCase().trim();
  const normTab = normalizeTabAlias(cleanName);

  // 1. Try exact match first
  const exactKey = Object.keys(tabObj).find(t => {
    const cleanT = t.startsWith('tab:') ? t.substring(4) : t;
    return cleanT.toLowerCase().trim() === rawTab;
  });
  if (exactKey !== undefined) return exactKey;

  // 2. Try alias normalized match
  let matchingAliasKeys = Object.keys(tabObj).filter(t => {
    const cleanT = t.startsWith('tab:') ? t.substring(4) : t;
    const tNorm = normalizeTabAlias(cleanT);
    return normTab && tNorm === normTab;
  });

  // 3. Try slug/alphanumeric match if no alias matches
  if (matchingAliasKeys.length === 0) {
    const simpleTarget = rawTab.replace(/[^a-z0-9]/g, '');
    matchingAliasKeys = Object.keys(tabObj).filter(t => {
      const cleanT = (t.startsWith('tab:') ? t.substring(4) : t).toLowerCase().trim();
      const simpleT = cleanT.replace(/[^a-z0-9]/g, '');
      return simpleTarget && simpleT === simpleTarget;
    });
  }

  if (matchingAliasKeys.length === 0) return undefined;

  // IMPORTANT: If ANY matching alias key is explicitly disabled (false or level 3 or view: false),
  // return that disabled key so that permissions denial takes immediate effect!
  const disabledKey = matchingAliasKeys.find(k => {
    const val = tabObj[k];
    if (val === false || val === 3 || val === '3') return true;
    if (typeof val === 'object' && val !== null) {
      return val.view === false || val.read === false || val.level === 3 || val.level === '3';
    }
    return false;
  });
  if (disabledKey !== undefined) return disabledKey;

  // Otherwise return active key or first matched alias
  const activeKey = matchingAliasKeys.find(k => {
    const val = tabObj[k];
    if (val === true || (typeof val === 'number' && val !== 3) || (typeof val === 'string' && val !== '3' && val !== 'false')) return true;
    if (typeof val === 'object' && val !== null) {
      return val.view !== false && val.read !== false && val.level !== 3 && val.level !== '3';
    }
    return false;
  });

  return activeKey || matchingAliasKeys[0];
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [previewRole, setPreviewRole] = useState<{ id: number; name: string; permissions: any } | null>(null);
  const [user, setUserRaw] = useState<User | null>(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            console.warn("Found expired token on startup. Clearing authentication.");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('user_id');
            return null;
          }
        }
      } catch (e) {
        console.warn("Found invalid token on startup. Clearing authentication.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        return null;
      }
    }

    return saved ? JSON.parse(saved) : null;
  });

  const setUser = useCallback((valOrFn: React.SetStateAction<User | null>) => {
    setUserRaw(prev => {
      const next = typeof valOrFn === 'function' ? (valOrFn as (p: User | null) => User | null)(prev) : valOrFn;
      if (prev === next) return prev;
      if (prev && next && JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
  }, []);

  const effectiveUser = useMemo(() => {
    if (!previewRole) return user;
    return {
      ...user,
      id: user?.id ?? previewRole.id,
      role_id: previewRole.id,
      role_name: previewRole.name,
      role: previewRole.name,
      permissions: previewRole.permissions,
      is_super_admin: false,
      isPreviewActive: true
    } as User;
  }, [user, previewRole]);

  const isAuthenticated = !!user;

  const login = useCallback((userData: User, token: string) => {
    safeSetItem('token', token);
    safeSetItem('user', JSON.stringify(userData));
    safeSetItem('user_id', userData.id.toString());
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    safeRemoveItem('token');
    safeRemoveItem('user');
    safeRemoveItem('user_id');
    setUser(null);
  }, []);

  const updateUserPermissions = useCallback((permissions: any) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updated = { ...prevUser, permissions };
      safeSetItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateUser = useCallback((userData: User) => {
    safeSetItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const savedUserStr = localStorage.getItem('user');
      let localUser: any = null;
      if (savedUserStr) {
        try {
          localUser = JSON.parse(savedUserStr);

          // Check if localUser is inactive or if business_core_users has set it to inactive
          let isInactive = false;
          if (localUser && localUser.id !== 1) {
            const statusLower = (localUser.status || '').toString().toLowerCase();
            if (statusLower === 'inactive' || statusLower === 'disabled' || statusLower === 'suspended' || statusLower === 'terminated') {
              isInactive = true;
            } else {
              const localUsersStr = localStorage.getItem('business_core_users');
              if (localUsersStr) {
                const localUsers = JSON.parse(localUsersStr);
                const currentU = localUsers.find((u: any) => u.id === localUser.id);
                if (currentU) {
                  const stat = (currentU.status || '').toString().toLowerCase();
                  if (stat === 'inactive' || stat === 'disabled' || stat === 'suspended' || stat === 'terminated') {
                    isInactive = true;
                  }
                }
              }
            }
          }

          if (isInactive) {
            console.warn("User account is inactive. Logging out.");
            logout();
            return;
          }

          setUser(localUser);
        } catch (e) {}
      }

      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || (localUser?.id ? String(localUser.id) : null);

      if (!token && !userId) {
        // No active session/credentials to query from server
        return;
      }

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userId) headers['x-user-id'] = userId;

      let res: Response | null = null;
      try {
        res = await fetch('/api/auth/me', { headers });
      } catch (networkErr) {
        // In case of cold start or transient network glitch, attempt one graceful retry after 1.2s
        try {
          await new Promise(r => setTimeout(r, 1200));
          res = await fetch('/api/auth/me', { headers });
        } catch (retryErr) {
          // Gracefully continue with cached local user profile
          return;
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.user) {
          const statusLower = (data.user.status || '').toString().toLowerCase();
          if (data.user.id !== 1 && (statusLower === 'inactive' || statusLower === 'suspended' || statusLower === 'terminated')) {
            console.warn("Server reported inactive user status. Logging out.");
            logout();
            return;
          }

          const mergedUser = {
            ...data.user,
            permissions: data.user.permissions || localUser?.permissions || {}
          };
          safeSetItem('user', JSON.stringify(mergedUser));
          setUser(mergedUser);
        }
      } else if (res && (res.status === 401 || res.status === 403)) {
        if (localUser?.id !== 1 && !localUser?.is_super_admin) {
          console.warn("Session expired or user inactive on refreshUser. Logging out.");
          logout();
        }
      }
    } catch (err) {
      // Gracefully keep cached local profile
    }
  }, [logout]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
    }
  }, []);

  useEffect(() => {
    const handlePermissionsUpdated = (e?: any) => {
      try {
        const detail = e?.detail;
        if (detail && detail.moduleId && detail.permissions) {
          const rawMod = (detail.canonModule || detail.moduleId || '');
          let decodedMod = rawMod;
          try { decodedMod = decodeURIComponent(rawMod); } catch (e) {}
          const lowMod = decodedMod.toLowerCase().trim();
          const isQA = lowMod === 'qa' || lowMod.includes('quality');
          const isProd = lowMod.includes('product') || lowMod.includes('catalog');
          const isKnowledge = lowMod.includes('knowledge') || lowMod === 'kb';
          const isHR = lowMod === 'hr' || lowMod.includes('human') || lowMod.includes('personnel');
          const canon = isQA ? 'QA' : isProd ? 'Products/Services' : isKnowledge ? 'Knowledge Base' : isHR ? 'HR' : rawMod;

          setPreviewRole(prevRole => {
            if (!prevRole) return prevRole;
            if (detail.roleId && Number(prevRole.id) !== Number(detail.roleId)) return prevRole;
            const updatedPerms = { ...(prevRole.permissions || {}) };
            updatedPerms[canon] = detail.permissions;
            if (isHR) {
              updatedPerms['HR'] = detail.permissions;
              updatedPerms['HR Management'] = detail.permissions;
              updatedPerms['hr'] = detail.permissions;
              updatedPerms['hr_management'] = detail.permissions;
            }
            if (isQA) {
              updatedPerms['QA'] = detail.permissions;
              updatedPerms['Quality Assurance'] = detail.permissions;
              updatedPerms['qa'] = detail.permissions;
            }
            if (isProd) {
              updatedPerms['Products/Services'] = detail.permissions;
              updatedPerms['Products & Services'] = detail.permissions;
              updatedPerms['Products%2FServices'] = detail.permissions;
              updatedPerms['Catalog'] = detail.permissions;
              updatedPerms['catalog'] = detail.permissions;
              updatedPerms['products'] = detail.permissions;
            }
            if (isKnowledge) {
              updatedPerms['Knowledge Base'] = detail.permissions;
              updatedPerms['Knowledge%20Base'] = detail.permissions;
              updatedPerms['kb'] = detail.permissions;
              updatedPerms['knowledge_base'] = detail.permissions;
              updatedPerms['knowledge'] = detail.permissions;
            }
            return { ...prevRole, permissions: updatedPerms };
          });

          setUser(prev => {
            if (!prev) return prev;
            const updatedPerms = { ...((prev as any).permissions || {}) };
            updatedPerms[canon] = detail.permissions;
            if (isHR) {
              updatedPerms['HR'] = detail.permissions;
              updatedPerms['HR Management'] = detail.permissions;
              updatedPerms['hr'] = detail.permissions;
              updatedPerms['hr_management'] = detail.permissions;
            }
            if (isQA) {
              updatedPerms['QA'] = detail.permissions;
              updatedPerms['Quality Assurance'] = detail.permissions;
              updatedPerms['qa'] = detail.permissions;
            }
            if (isProd) {
              updatedPerms['Products/Services'] = detail.permissions;
              updatedPerms['Products & Services'] = detail.permissions;
              updatedPerms['Products%2FServices'] = detail.permissions;
              updatedPerms['Catalog'] = detail.permissions;
              updatedPerms['catalog'] = detail.permissions;
              updatedPerms['products'] = detail.permissions;
            }
            if (isKnowledge) {
              updatedPerms['Knowledge Base'] = detail.permissions;
              updatedPerms['Knowledge%20Base'] = detail.permissions;
              updatedPerms['kb'] = detail.permissions;
              updatedPerms['knowledge_base'] = detail.permissions;
              updatedPerms['knowledge'] = detail.permissions;
            }
            const updatedUser = { ...prev, permissions: updatedPerms };
            safeSetItem('user', JSON.stringify(updatedUser));
            return updatedUser;
          });
        }

        const saved = localStorage.getItem('user');
        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(prev => {
            if (prev && JSON.stringify(prev) === JSON.stringify(parsed)) {
              return prev;
            }
            return parsed;
          });
        }
        refreshUser();
      } catch (err) {}
    };

    window.addEventListener('sys_permissions_updated', handlePermissionsUpdated);
    window.addEventListener('storage', handlePermissionsUpdated);
    return () => {
      window.removeEventListener('sys_permissions_updated', handlePermissionsUpdated);
      window.removeEventListener('storage', handlePermissionsUpdated);
    };
  }, [refreshUser]);

  const checkPermission = useCallback((module: string, action: string): boolean => {
    const effectiveUser = previewRole ? {
      ...user,
      id: previewRole.id,
      role_id: previewRole.id,
      role_name: previewRole.name,
      role: previewRole.name,
      permissions: previewRole.permissions,
      is_super_admin: false
    } : user;

    if (!effectiveUser) return false;

    const normModule = module ? module.toLowerCase().trim() : '';
    const isHomeMod = normModule === 'home' || normModule === 'الصفحة الرئيسية' || normModule === 'الرئيسية';

    // Super Admin check (strictly disabled during preview so admin sees accurate simulation)
    if (!previewRole && (
      effectiveUser.role_id === 1 || 
      (effectiveUser as any).is_super_admin || 
      effectiveUser.role === 'Admin' || 
      effectiveUser.role_name === 'Admin' ||
      effectiveUser.email === 'admin@gmail.com' ||
      effectiveUser.email === 'admin@opex.com' ||
      effectiveUser.email === 'esraaessoo19@gmail.com' ||
      effectiveUser.id === 337
    )) return true;

    const perms = (effectiveUser as any).permissions;
    if (!perms || typeof perms !== 'object') {
      return isHomeMod ? true : action === 'view';
    }

    const permKey = findPermKey(perms, module);
    if (!permKey || !perms[permKey]) {
      // Default to allowed for Home if no restrictions configured yet
      if (isHomeMod) return true;
      return false;
    }

    const modulePerms = perms[permKey];

    // If module view is explicitly false, forbid all actions/tabs in this module
    if (modulePerms.view === false && action !== 'settings' && action !== 'settings_access') {
      return false;
    }

    // If simply checking general view access to Home and module view is not false
    if (isHomeMod && (!action || action === 'view' || action === 'read')) {
      return true;
    }

    // 1. Settings Access Check
    if (action === 'settings' || action === 'settings_access') {
      return modulePerms.settings_access !== false;
    }

    // Extract target tab name if specified in action
    let targetTab = '';
    if (action.startsWith('tab:')) {
      targetTab = action.substring(4);
    } else if (action.startsWith('action:')) {
      const parts = action.split(':');
      if (parts.length >= 3) {
        targetTab = parts[1];
      }
    } else if (action.startsWith('custom:')) {
      const customKey = action.substring(7).toLowerCase();
      if (customKey.includes('candidate') || customKey.includes('applicant') || customKey.includes('pipeline')) {
        targetTab = 'Candidates Pipeline';
      } else if (customKey.includes('job') || customKey.includes('budget') || customKey.includes('posting')) {
        targetTab = 'Job Openings';
      } else if (customKey.includes('interview') || customKey.includes('scorecard')) {
        targetTab = 'Interviews & Scorecards';
      }
    } else if (
      action !== 'read' && 
      action !== 'write' && 
      action !== 'create' && 
      action !== 'delete' && 
      action !== 'select' && 
      action !== 'submit' && 
      action !== 'cancel' && 
      action !== 'amend' && 
      action !== 'report' && 
      action !== 'import' && 
      action !== 'export' && 
      action !== 'print' && 
      action !== 'email' && 
      action !== 'share' && 
      action !== 'view'
    ) {
      targetTab = action;
    }

    // 2. Parent-Child Tab Cascading Check
    if (targetTab) {
      const normTarget = normalizeTabAlias(targetTab);

      const parentTabMap: Record<string, string[]> = {
        'candidates pipeline': ['Hiring', 'Recruitment & Jobs', 'Recruitment'],
        'job openings': ['Hiring', 'Recruitment & Jobs', 'Recruitment'],
        'interviews & scorecards': ['Hiring', 'Recruitment & Jobs', 'Recruitment'],
        'daily logs': ['Attendance', 'Attendance & Clock In'],
        'shift schedule': ['Attendance', 'Attendance & Clock In'],
        'breaks': ['Attendance', 'Attendance & Clock In'],
        'leave management': ['Attendance', 'Attendance & Clock In'],
        'time off & leaves': ['Attendance', 'Attendance & Clock In'],
        'shift swaps': ['Attendance', 'Attendance & Clock In'],
        'swap management': ['Attendance', 'Attendance & Clock In'],
        'employee profiles & directory': ['Employee Directory'],
        'departments & structure': ['Employee Directory', 'Departments'],
        'org chart': ['Employee Directory', 'Org Chart'],
        'benefits & allowances': ['Payroll', 'Payroll & Salaries'],
        'complaints & grievances': ['Performance', 'Performance & OKRs'],
        'onboarding & offboarding': ['Assets Management'],
        'employee quality tracking': ['Quality Dashboard', 'Quality Dashboard & Analytics', 'quality dashboard'],
        'complaints': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'complaints audit': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'delays': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'delays audit': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'refunds': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'refunds audit': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'cancellations': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'cancellations audit': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'nps': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'nps audit': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'action plans': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'audit checklists': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'transaction checklists': ['Transactions Audit', 'Transactions & Incidents Audit', 'transactions audit'],
        'checklist templates': ['Internal Audit', 'Internal Audit & ISO Compliance', 'internal audit'],
        'audit templates': ['Internal Audit', 'Internal Audit & ISO Compliance', 'internal audit'],
        'perform audits': ['Internal Audit', 'Internal Audit & ISO Compliance', 'internal audit'],
        'ncr incident log': ['Internal Audit', 'Internal Audit & ISO Compliance', 'internal audit'],
        'ncr logs': ['Internal Audit', 'Internal Audit & ISO Compliance', 'internal audit'],
        'capa action plans': ['Internal Audit', 'Internal Audit & ISO Compliance', 'internal audit'],
        'promo codes': ['Prices & Promo Codes', 'wholesale price lists & coupons', 'pricing & promo codes'],
        'price lists': ['Prices & Promo Codes', 'wholesale price lists & coupons', 'pricing & promo codes'],
        'category hub': ['Articles Explorer', 'articles explorer', 'articles'],
        'article reader': ['Articles Explorer', 'articles explorer', 'articles']
      };

      if (parentTabMap[normTarget]) {
        const parents = parentTabMap[normTarget];
        let hasDefinedParent = false;
        let isAnyParentActive = false;

        for (const parentName of parents) {
          if (modulePerms.tabs && typeof modulePerms.tabs === 'object') {
            const parentKey = findTabKey(modulePerms.tabs, parentName);
            if (parentKey !== undefined) {
              hasDefinedParent = true;
              if (modulePerms.tabs[parentKey] === true) {
                isAnyParentActive = true;
                break;
              }
            }
          }
          if (modulePerms.tab_actions && typeof modulePerms.tab_actions === 'object') {
            const parentActionKey = findTabKey(modulePerms.tab_actions, parentName);
            if (parentActionKey !== undefined && modulePerms.tab_actions[parentActionKey]) {
              const pAct = modulePerms.tab_actions[parentActionKey];
              if (pAct.view !== false && pAct.read !== false && pAct.level !== 3) {
                hasDefinedParent = true;
                isAnyParentActive = true;
                break;
              }
            }
          }
        }

        if (hasDefinedParent && !isAnyParentActive) {
          return false;
        }
      }

      // Check Target Tab Direct Visibility (modulePerms.tabs)
      if (modulePerms.tabs && typeof modulePerms.tabs === 'object') {
        const foundTabKey = findTabKey(modulePerms.tabs, targetTab);
        if (foundTabKey !== undefined && modulePerms.tabs[foundTabKey] === false) {
          return false;
        }
      }

      // Check Target Tab Direct Action Visibility (modulePerms.tab_actions)
      if (modulePerms.tab_actions && typeof modulePerms.tab_actions === 'object') {
        const foundTabKey = findTabKey(modulePerms.tab_actions, targetTab);
        if (foundTabKey !== undefined) {
          const tabAct = modulePerms.tab_actions[foundTabKey];
          if (tabAct && (tabAct.view === false || tabAct.read === false || tabAct.level === 3)) {
            return false;
          }
        }
      }

      // Check Target Tab Direct Level Visibility (modulePerms.levels)
      if (modulePerms.levels && typeof modulePerms.levels === 'object') {
        const foundLevelKey = findTabKey(modulePerms.levels, targetTab);
        if (foundLevelKey !== undefined && modulePerms.levels[foundLevelKey] === 3) {
          return false;
        }
      }
    }

    // 3. Tab Direct Read/Visibility Check (for action.startsWith('tab:') or action === targetTab)
    if (action.startsWith('tab:') || (targetTab && targetTab === action)) {
      if (modulePerms.levels && typeof modulePerms.levels === 'object') {
        const foundLevelKey = findTabKey(modulePerms.levels, targetTab);
        if (foundLevelKey !== undefined && modulePerms.levels[foundLevelKey] === 3) {
          return false;
        }
      }
      if (modulePerms.tabs && typeof modulePerms.tabs === 'object') {
        const foundKey = findTabKey(modulePerms.tabs, targetTab);
        if (foundKey !== undefined) {
          return !!modulePerms.tabs[foundKey];
        }
      }
      if (modulePerms.tab_actions && typeof modulePerms.tab_actions === 'object') {
        const foundKey = findTabKey(modulePerms.tab_actions, targetTab);
        if (foundKey !== undefined) {
          const tabAct = modulePerms.tab_actions[foundKey];
          if (tabAct && (tabAct.view !== undefined || tabAct.read !== undefined)) {
            return tabAct.view !== false && tabAct.read !== false && tabAct.level !== 3;
          }
        }
      }
      return modulePerms.view !== false;
    }

    // 4. Custom Action Check (ZERO-TRUST DEFAULT-DENY)
    const cleanActionKey = action.startsWith('custom:') ? action.substring(7) : action;
    if (modulePerms.custom_actions && typeof modulePerms.custom_actions === 'object') {
      const cleanNorm = cleanActionKey.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const foundKey = Object.keys(modulePerms.custom_actions).find(a => {
        const aNorm = a.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return aNorm === cleanNorm || aNorm.endsWith(`_${cleanNorm}`) || cleanNorm.endsWith(`_${aNorm}`);
      });
      if (foundKey !== undefined) {
        return !!modulePerms.custom_actions[foundKey];
      }
    }

    // Under Default-Deny, any custom action request not explicitly granted is strictly denied
    if (action.startsWith('custom:')) {
      return false;
    }

    // 5. Action Check with optional tab qualification (action:TabName:actionName)
    let reqTab = '';
    let reqAction = action;
    if (action.startsWith('action:')) {
      const parts = action.split(':');
      if (parts.length >= 3) {
        reqTab = parts[1];
        reqAction = parts[2];
      }
    }

    reqAction = (reqAction || '').toLowerCase().trim();
    if (reqAction === 'edit') reqAction = 'write';
    if (reqAction === 'view') reqAction = 'read';

    // Check see_permissions map for tab-level View Only or No Access overrides
    const checkTabName = targetTab || reqTab;
    if (modulePerms.see_permissions && typeof modulePerms.see_permissions === 'object') {
      if (checkTabName) {
        const seeMap = modulePerms.see_permissions;
        const matchedKey = Object.keys(seeMap).find(k => 
          (k || '').toLowerCase().trim() === (checkTabName || '').toLowerCase().trim() ||
          normalizeTabAlias(k) === normalizeTabAlias(checkTabName)
        );
        if (matchedKey) {
          const seeVal = seeMap[matchedKey];
          if (seeVal === 'no') return false;
          if (seeVal === 'view') {
            const isWriteIntent = reqAction === 'write' || reqAction === 'create' || reqAction === 'delete' || reqAction === 'edit' || action.startsWith('custom:');
            if (isWriteIntent) return false;
          }
        }
      }
    }

    // Check levels map for tab-level / screen-level Level overrides:
    // Level 3: Hidden (forbids read and write)
    // Level 2: Read-Only (forbids write, create, delete, edit, submit, cancel, amend, custom)
    // Level 1: Full / Editable
    if (modulePerms.levels && typeof modulePerms.levels === 'object' && checkTabName) {
      const matchedLevelKey = findTabKey(modulePerms.levels, checkTabName);
      if (matchedLevelKey !== undefined && modulePerms.levels[matchedLevelKey] !== undefined) {
        const lvl = Number(modulePerms.levels[matchedLevelKey]);
        if (lvl === 3) return false;
        if (lvl === 2) {
          const isWriteIntent = reqAction === 'write' || reqAction === 'create' || reqAction === 'delete' || reqAction === 'edit' || reqAction === 'submit' || reqAction === 'cancel' || reqAction === 'amend' || action.startsWith('custom:');
          if (isWriteIntent) return false;
        }
      }
    }

    if (reqTab && modulePerms.tab_actions) {
      const matchedTabKey = findTabKey(modulePerms.tab_actions, reqTab);
      if (matchedTabKey && modulePerms.tab_actions[matchedTabKey]) {
        const tabActs = modulePerms.tab_actions[matchedTabKey];
        if (reqAction === 'read' || reqAction === 'view') {
          if (tabActs.view === true || tabActs.read === true) return true;
          if (tabActs.view === false && tabActs.read === false) return false;
        }
        let val = tabActs[reqAction];
        if (val === undefined && reqAction === 'write') val = tabActs.edit ?? tabActs.write;

        if (val !== undefined) return !!val;
      }
    }

    // Top-level module action check
    let moduleVal = modulePerms[reqAction];
    if (moduleVal === undefined && reqAction === 'read') moduleVal = modulePerms.read ?? modulePerms.view;
    if (moduleVal === undefined && reqAction === 'write') moduleVal = modulePerms.write ?? modulePerms.edit;

    if (moduleVal !== undefined) {
      return !!moduleVal;
    }

    if (reqAction === 'view') return modulePerms.view !== false;
    if (reqAction === 'read') return modulePerms.read !== false && modulePerms.view !== false;

    return false;
  }, [user]);

  const isIfOwner = useCallback((moduleName: string, tabName?: string): boolean => {
    const effectiveUser = previewRole ? {
      ...user,
      id: previewRole.id,
      role_id: previewRole.id,
      role_name: previewRole.name,
      role: previewRole.name,
      permissions: previewRole.permissions,
      is_super_admin: false
    } : user;

    if (!effectiveUser) return false;

    const perms = (effectiveUser as any).permissions;
    if (perms && typeof perms === 'object') {
      const permKey = findPermKey(perms, moduleName);
      if (permKey && perms[permKey]) {
        const modulePerms = perms[permKey];
        if (tabName && modulePerms.tab_actions) {
          const matchedTabKey = findTabKey(modulePerms.tab_actions, tabName);
          if (matchedTabKey && modulePerms.tab_actions[matchedTabKey]) {
            return !!modulePerms.tab_actions[matchedTabKey].if_owner;
          }
        }
      }
    }
    return false;
  }, [user, previewRole]);

  const getDataScope = useCallback((moduleName: string, tabName?: string): 'global' | 'branch' | 'own' | 'team' | 'custom' => {
    if (!effectiveUser) return 'own';

    // Helper to map scope values cleanly
    const normalizeScope = (sc: any): 'global' | 'branch' | 'own' | 'team' | 'custom' | undefined => {
      if (!sc || typeof sc !== 'string') return undefined;
      const lower = sc.toLowerCase().trim();
      if (lower === 'self' || lower === 'own' || lower === 'if_owner' || lower === 'own only' || lower === 'own only (personal)' || lower === 'خاص بي') return 'own';
      if (lower === 'direct_reports' || lower === 'team' || lower === 'team only' || lower === 'فريقي') return 'team';
      if (lower === 'department' || lower === 'branch' || lower === 'department only' || lower === 'same_department' || lower === 'القسم') return 'branch';
      if (lower === 'all' || lower === 'company' || lower === 'global' || lower === 'الكل') return 'global';
      return sc as any;
    };

    // If if_owner is explicitly checked in permissions, scope is strictly 'own'
    if (isIfOwner(moduleName, tabName)) return 'own';

    const perms = (effectiveUser as any).permissions;
    if (perms && typeof perms === 'object') {
      const permKey = findPermKey(perms, moduleName);
      
      if (permKey && perms[permKey]) {
        const modulePerms = perms[permKey];

        // 1. Check tab_actions
        if (tabName && modulePerms.tab_actions) {
          const matchedTabKey = findTabKey(modulePerms.tab_actions, tabName);
          if (matchedTabKey && modulePerms.tab_actions[matchedTabKey]?.data_scope) {
            const sc = normalizeScope(modulePerms.tab_actions[matchedTabKey].data_scope);
            if (sc) return sc;
          }
        }
        // 2. Check data_scopes map
        if (tabName && modulePerms.data_scopes) {
          const matchedTabKey = findTabKey(modulePerms.data_scopes, tabName);
          if (matchedTabKey && modulePerms.data_scopes[matchedTabKey]) {
            const sc = normalizeScope(modulePerms.data_scopes[matchedTabKey]);
            if (sc) return sc;
          }
        }
        // 3. Check module see_scope or data_scopes.see_scope or data_scope
        const moduleScopeRaw = modulePerms.data_scopes?.see_scope || modulePerms.see_scope || modulePerms.data_scope;
        if (moduleScopeRaw) {
          const sc = normalizeScope(moduleScopeRaw);
          if (sc) return sc;
        }
      }
    }
    
    // Default Admin role fallback if no specific scope override is set in permissions
    if (
      !previewRole && (
        effectiveUser.role_id === 1 || 
        (effectiveUser as any).is_super_admin || 
        effectiveUser.role === 'Admin' || 
        effectiveUser.role_name === 'Admin' ||
        effectiveUser.email === 'admin@gmail.com' ||
        effectiveUser.email === 'admin@opex.com' ||
        effectiveUser.email === 'esraaessoo19@gmail.com' ||
        effectiveUser.id === 337
      )
    ) return 'global';

    return 'own';
  }, [effectiveUser, previewRole, isIfOwner]);

  const getPermLevel = useCallback((moduleName: string, tabName?: string): number => {
    if (!effectiveUser) return 0;
    if (!previewRole && (
      effectiveUser.role_id === 1 || 
      (effectiveUser as any).is_super_admin || 
      effectiveUser.role === 'Admin' || 
      effectiveUser.role_name === 'Admin' ||
      effectiveUser.email === 'admin@gmail.com' ||
      effectiveUser.email === 'admin@opex.com' ||
      effectiveUser.email === 'esraaessoo19@gmail.com' ||
      effectiveUser.id === 337
    )) return 1;

    const perms = (effectiveUser as any).permissions;
    if (perms && typeof perms === 'object') {
      const permKey = findPermKey(perms, moduleName);
      if (permKey && perms[permKey]) {
        const modulePerms = perms[permKey];
        if (tabName) {
          if (modulePerms.levels && typeof modulePerms.levels === 'object') {
            const matchedLevelKey = findTabKey(modulePerms.levels, tabName);
            if (matchedLevelKey !== undefined && modulePerms.levels[matchedLevelKey] !== undefined) {
              const num = Number(modulePerms.levels[matchedLevelKey]);
              if (!isNaN(num)) return num;
            }
          }
          if (modulePerms.see_permissions && typeof modulePerms.see_permissions === 'object') {
            const matchedSeeKey = findTabKey(modulePerms.see_permissions, tabName);
            if (matchedSeeKey !== undefined && modulePerms.see_permissions[matchedSeeKey]) {
              const seeVal = modulePerms.see_permissions[matchedSeeKey];
              if (seeVal === 'no') return 3;
              if (seeVal === 'view') return 2;
              if (seeVal === 'full') return 1;
            }
          }
          if (modulePerms.tabs) {
            const matchedTabKey = findTabKey(modulePerms.tabs, tabName);
            if (matchedTabKey && modulePerms.tabs[matchedTabKey] === false) {
              return 3;
            }
          }
          if (modulePerms.tab_actions) {
            const matchedTabKey = findTabKey(modulePerms.tab_actions, tabName);
            if (matchedTabKey) {
              const tabAct = modulePerms.tab_actions[matchedTabKey];
              if (tabAct.view === false || tabAct.read === false) {
                return 3;
              }
              if (tabAct.level !== undefined) {
                const num = Number(tabAct.level);
                if (!isNaN(num)) return num;
              }
            }
          }
        }
        if (modulePerms.view === false) {
          return 3;
        }
        if (modulePerms.level !== undefined) {
          return Number(modulePerms.level) || 0;
        }
      }
    }
    return 0;
  }, [effectiveUser, previewRole]);

  const canRead = useCallback((module: string, tab?: string) => {
    if (tab && getPermLevel(module, tab) === 3) return false;
    return checkPermission(module, tab ? `action:${tab}:read` : 'read');
  }, [checkPermission, getPermLevel]);

  const canWrite = useCallback((module: string, tab?: string) => {
    if (tab) {
      const lvl = getPermLevel(module, tab);
      if (lvl === 2 || lvl === 3) return false;
    }
    return checkPermission(module, tab ? `action:${tab}:write` : 'write');
  }, [checkPermission, getPermLevel]);

  const canCreate = useCallback((module: string, tab?: string) => {
    if (tab) {
      const lvl = getPermLevel(module, tab);
      if (lvl === 2 || lvl === 3) return false;
    }
    return checkPermission(module, tab ? `action:${tab}:create` : 'create');
  }, [checkPermission, getPermLevel]);

  const getFieldPermStatus = useCallback((
    moduleName: string, 
    fieldKey: string, 
    fieldLevel: number = 0, 
    tabName?: string
  ): 'editable' | 'readonly' | 'hidden' => {
    const effectiveUser = previewRole ? {
      ...user,
      id: previewRole.id,
      role_id: previewRole.id,
      role_name: previewRole.name,
      role: previewRole.name,
      permissions: previewRole.permissions,
      is_super_admin: false
    } : user;

    if (!effectiveUser) return 'hidden';

    // Super Admin override (strictly disabled during preview mode)
    if (!previewRole && (
      effectiveUser.role_id === 1 || 
      (effectiveUser as any).is_super_admin || 
      effectiveUser.role === 'Admin' || 
      effectiveUser.role_name === 'Admin' ||
      effectiveUser.email === 'admin@gmail.com' ||
      effectiveUser.email === 'admin@opex.com' ||
      effectiveUser.email === 'esraaessoo19@gmail.com' ||
      effectiveUser.id === 337
    )) return 'editable';

    const userRoleLevel = getPermLevel(moduleName, tabName);

    // Perm Level explicit mapping:
    // Perm Level 3 : Hidden (مخفي)
    // Perm Level 2 : Read-Only (قراءة)
    // Perm Level 1 : Editable (تعديل)
    // Perm Level 0 : Default (تلقائي)
    if (userRoleLevel === 3) return 'hidden';
    if (userRoleLevel === 2) return 'readonly';
    if (userRoleLevel === 1) return 'editable';

    const hasLevel0DocAccess = canRead(moduleName, tabName);
    if (!hasLevel0DocAccess) {
      return 'hidden';
    }

    const tabWritable = tabName ? canWrite(moduleName, tabName) : canWrite(moduleName);

    const perms = (user as any).permissions;
    if (perms && typeof perms === 'object') {
      const permKey = findPermKey(perms, moduleName);
      if (permKey && perms[permKey]) {
        const modulePerms = perms[permKey];

        // Check see_permissions if available (from RBAC screen in Admin Panel)
        if (modulePerms.see_permissions && typeof modulePerms.see_permissions === 'object') {
          const seeMap = modulePerms.see_permissions;
          const fNorm = (fieldKey || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
          const tabNorm = tabName ? (tabName || '').toLowerCase().replace(/[^a-z0-9]/g, '_') : '';

          // 1. Check tab/section level override in seeMap
          const tabSecVal = (tabName ? seeMap[tabName] : undefined) || 
                            (tabNorm ? seeMap[tabNorm] : undefined);
          if (tabSecVal) {
            if (tabSecVal === 'no') return 'hidden';
            if (tabSecVal === 'view') return 'readonly';
          }

          // 2. Direct keys lookup
          const directVal = seeMap[fieldKey] || 
                            seeMap[fNorm] ||
                            (tabNorm ? seeMap[`${tabNorm}_${fNorm}`] : undefined) ||
                            (tabNorm ? seeMap[`${tabNorm}_${fieldKey}`] : undefined);
          if (directVal) {
            if (directVal === 'no') return 'hidden';
            if (directVal === 'view') return 'readonly';
            if (directVal === 'full') return tabWritable ? 'editable' : 'readonly';
          }

          // 3. Fuzzy / Suffix / Section keys lookup
          const matchedKey = Object.keys(seeMap).find(k => {
            const kNorm = (k || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
            return kNorm === fNorm || 
                   (tabNorm && kNorm === `${tabNorm}_${fNorm}`) ||
                   (fNorm && kNorm.endsWith(`_${fNorm}`)) || 
                   (fNorm && kNorm.endsWith(`_${kNorm}`)) ||
                   (k || '').toLowerCase().trim() === (fieldKey || '').toLowerCase().trim();
          });
          if (matchedKey) {
            const v = seeMap[matchedKey];
            if (v === 'no') return 'hidden';
            if (v === 'view') return 'readonly';
            if (v === 'full') return tabWritable ? 'editable' : 'readonly';
          }
        }

        if (modulePerms.field_security && modulePerms.field_security[fieldKey]) {
          const status = modulePerms.field_security[fieldKey];
          if (!tabWritable && status === 'editable') return 'readonly';
          if (fieldLevel > userRoleLevel && status === 'editable') return 'readonly';
          return status;
        }
      }
    }

    if (!tabWritable || fieldLevel > userRoleLevel) {
      return 'readonly';
    }

    return 'editable';
  }, [user, canRead, canWrite, getPermLevel]);

  const canDelete = useCallback((module: string, tab?: string) => {
    if (tab) {
      const lvl = getPermLevel(module, tab);
      if (lvl === 2 || lvl === 3) return false;
    }
    return checkPermission(module, tab ? `action:${tab}:delete` : 'delete');
  }, [checkPermission, getPermLevel]);

  const canSelect = useCallback((module: string, tab?: string) => {
    return checkPermission(module, tab ? `action:${tab}:select` : 'select');
  }, [checkPermission]);

  const canSubmit = useCallback((module: string, tab?: string) => {
    if (tab) {
      const lvl = getPermLevel(module, tab);
      if (lvl === 2 || lvl === 3) return false;
    }
    return checkPermission(module, tab ? `action:${tab}:submit` : 'submit');
  }, [checkPermission, getPermLevel]);

  const canCancel = useCallback((module: string, tab?: string) => {
    if (tab) {
      const lvl = getPermLevel(module, tab);
      if (lvl === 2 || lvl === 3) return false;
    }
    return checkPermission(module, tab ? `action:${tab}:cancel` : 'cancel');
  }, [checkPermission, getPermLevel]);

  const canAmend = useCallback((module: string, tab?: string) => {
    if (tab) {
      const lvl = getPermLevel(module, tab);
      if (lvl === 2 || lvl === 3) return false;
    }
    return checkPermission(module, tab ? `action:${tab}:amend` : 'amend');
  }, [checkPermission, getPermLevel]);

  const canReport = useCallback((module: string, tab?: string) => {
    return checkPermission(module, tab ? `action:${tab}:report` : 'report');
  }, [checkPermission]);

  const canImport = useCallback((module: string, tab?: string) => {
    return checkPermission(module, tab ? `action:${tab}:import` : 'import');
  }, [checkPermission]);

  const canExport = useCallback((module: string, tab?: string) => {
    return checkPermission(module, tab ? `action:${tab}:export` : 'export');
  }, [checkPermission]);

  const canPrint = useCallback((module: string, tab?: string) => {
    return checkPermission(module, tab ? `action:${tab}:print` : 'print');
  }, [checkPermission]);

  const canEmail = useCallback((module: string, tab?: string) => {
    return checkPermission(module, tab ? `action:${tab}:email` : 'email');
  }, [checkPermission]);

  const canShare = useCallback((module: string, tab?: string) => {
    return checkPermission(module, tab ? `action:${tab}:share` : 'share');
  }, [checkPermission]);

  const isFieldVisible = useCallback((moduleName: string, fieldKey: string, tabName?: string): boolean => {
    return getFieldPermStatus(moduleName, fieldKey, 0, tabName) !== 'hidden';
  }, [getFieldPermStatus]);

  const contextValue = useMemo(() => ({
    user: effectiveUser,
    realUser: user,
    isAuthenticated,
    login,
    logout,
    updateUserPermissions,
    updateUser,
    checkPermission,
    getDataScope,
    isIfOwner,
    getPermLevel,
    getFieldPermStatus,
    isFieldVisible,
    canRead,
    canWrite,
    canCreate,
    canDelete,
    canSelect,
    canSubmit,
    canCancel,
    canAmend,
    canReport,
    canImport,
    canExport,
    canPrint,
    canEmail,
    canShare,
    refreshUser,
    previewRole,
    setPreviewRole
  }), [
    effectiveUser, user, isAuthenticated, login, logout, updateUserPermissions, updateUser, checkPermission, getDataScope, isIfOwner,
    getPermLevel, getFieldPermStatus, isFieldVisible,
    canRead, canWrite, canCreate, canDelete, canSelect, canSubmit, canCancel, canAmend,
    canReport, canImport, canExport, canPrint, canEmail, canShare, refreshUser,
    previewRole, setPreviewRole
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
