import { 
  Home,
  LayoutDashboard, 
  BookOpen, 
  Database, 
  GitBranch, 
  BarChart3, 
  Users, 
  Zap, 
  ShieldCheck, 
  Network, 
  GraduationCap, 
  MessageSquare, 
  AlertTriangle, 
  TrendingUp,
  Settings,
  LayoutGrid,
  ChevronRight,
  Search,
  Bell,
  User,
  Link2,
  List as ListIcon,
  Share2,
  Waypoints,
  Package,
  Calculator,
  Briefcase,
  Target,
  Sparkles,
  Cpu,
  Workflow,
  Video
} from 'lucide-react';

export const MODULES = [
  { id: 'home', name: 'Home', icon: Home, color: 'text-emerald-500', is_active: true },
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-500', is_active: true },
  { id: 'ai-business', name: 'AI Business', icon: Sparkles, color: 'text-violet-600', is_active: true },
  { id: 'meeting-hub', name: 'Meeting Hub', icon: Video, color: 'text-fuchsia-500', is_active: true },
  { id: 'marketing', name: 'Marketing Hub', icon: Target, color: 'text-pink-600', is_active: true },
  { id: 'sops', name: 'SOP Management', icon: BookOpen, color: 'text-emerald-500', is_active: true },
  { id: 'process-mapping', name: 'Process Mapping', icon: Waypoints, color: 'text-indigo-600', is_active: true },
  { id: 'kb', name: 'Knowledge Base', icon: Database, color: 'text-amber-500', is_active: true },
  { id: 'leads', name: 'CRM Leads', icon: GitBranch, color: 'text-emerald-500', is_active: true },
  { id: 'crm', name: 'Sales CRM', icon: Users, color: 'text-indigo-500', is_active: true },
  { id: 'operations-hub', name: 'Operations Hub', icon: Workflow, color: 'text-teal-600', is_active: true },
  { id: 'acct', name: 'Accounting', icon: Calculator, color: 'text-emerald-600', is_active: true },
  { id: 'automation', name: 'Automation', icon: Zap, color: 'text-yellow-500', is_active: true },
  { id: 'qa', name: 'Quality Assurance', icon: ShieldCheck, color: 'text-cyan-500', is_active: true },
  { id: 'hr', name: 'HR Management', icon: Briefcase, color: 'text-indigo-600', is_active: true },
  { id: 'training', name: 'Training Hub', icon: GraduationCap, color: 'text-violet-500', is_active: true },
  { id: 'tasks', name: 'Tasks', icon: ListIcon, color: 'text-slate-500', is_active: true },
  { id: 'kpis', name: 'Performance & KPIs', icon: BarChart3, color: 'text-rose-500', is_active: true },
  { id: 'risk', name: 'Risk Register', icon: AlertTriangle, color: 'text-red-500', is_active: true },
  { id: 'kaizen', name: 'Kaizen Improvement', icon: TrendingUp, color: 'text-teal-500', is_active: true },
  { id: 'business-model', name: 'Business Model', icon: LayoutGrid, color: 'text-indigo-500', is_active: true },
  { id: 'products', name: 'Products/Services', icon: Package, color: 'text-amber-600', is_active: true },
  { id: 'raci', name: 'RACI Matrix', icon: Network, color: 'text-orange-500', is_active: true },
  { id: 'comm', name: 'Communication', icon: MessageSquare, color: 'text-pink-500', is_active: true },
  { id: 'integration', name: 'Integration Hub', icon: Share2, color: 'text-blue-400', is_active: true },
  { id: 'build', name: 'Build', icon: Cpu, color: 'text-indigo-600', is_active: true },
  { id: 'admin', name: 'Admin Panel', icon: Settings, color: 'text-slate-600', is_active: true },
];

export interface AutomationRule {
  id: number;
  name: string;
  trigger_type: string;
  conditions: any[];
  actions: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: number;
  rule_id: number;
  rule_name?: string;
  trigger_data: any;
  execution_status: 'success' | 'failed';
  error_message?: string;
  executed_at: string;
}

export interface DepartmentTeam {
  id: string | number;
  name: string;
  description?: string;
  team_lead_id?: number | null;
  team_lead_name?: string;
  job_titles?: string[];
}

export interface Department {
  id: number;
  name: string;
  description?: string;
  department_head_id?: number;
  department_head_name?: string;
  teams?: DepartmentTeam[];
  job_titles?: string[];
  is_executive?: boolean;
}

export interface KPI {
  id: number;
  name: string;
  target_value: number;
  actual_value: number;
  source: string;
  frequency: string;
  owner_id: number;
  owner_name?: string;
  department_id: number;
  department_name?: string;
  created_at: string;
  updated_at: string;
}

export interface KPIHistory {
  id: number;
  kpi_id: number;
  value: number;
  recorded_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  password?: string;
  employee_id?: string;
  is_employee?: boolean;
  role_id: number;
  role_name?: string;
  department_id: number;
  department_name?: string;
  team_name?: string;
  job_title?: string;
  reporting_to?: number | null;
  manager_name?: string | null;
  status?: 'active' | 'inactive';
  is_super_admin?: boolean;
  permissions?: Record<string, {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export?: boolean;
  }>;
}

export interface SOPStep {
  id: number;
  sop_id: number;
  step_number: number;
  step_description: string;
  attachment_url?: string;
  required_course_id?: number;
}

export interface SOPVersion {
  id: number;
  sop_id: number;
  version_number: string;
  change_summary: string;
  updated_by_name: string;
  updated_at: string;
}

export interface SOP {
  id: number;
  title: string;
  department_id: number;
  department_name?: string;
  process_type: string;
  version_number: string;
  status: string;
  owner_id: number;
  owner_name?: string;
  approver_id?: number;
  approver_name?: string;
  objective?: string;
  scope?: string;
  roles_responsibilities?: string;
  required_documentation?: string;
  reporting_line?: string;
  tools_channels_used?: string;
  kpis?: string;
  flowchart_data?: string;
  tags?: string;
  parent_id?: number;
  review_date?: string;
  created_at: string;
  updated_at: string;
  steps?: SOPStep[];
  versions?: SOPVersion[];
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  status: string;
  value: number;
  assigned_to?: number;
  phone?: string;
  whatsapp?: string;
  created_at: string;
}

export interface CRMStage {
  id: number;
  name: string;
  order_index: number;
  color: string;
  is_won?: boolean;
}

export interface CRMCustomer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  created_at: string;
  updated_at: string;
  interactions?: CRMInteraction[];
  attachments?: CRMAttachment[];
  deals?: CRMDeal[];
}

export interface CRMDeal {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_company?: string;
  title: string;
  description?: string;
  value: number;
  stage_id: number;
  assigned_to?: number;
  assigned_name?: string;
  service_type?: string;
  product?: string;
  items?: any[];
  sop_id?: number;
  created_at: string;
  updated_at: string;
}

export interface CRMInteraction {
  id: number;
  customer_id: number;
  deal_id?: number;
  type: 'Note' | 'Chat' | 'Call' | 'Email' | 'SMS' | 'WhatsApp' | 'Facebook';
  content: string;
  sender_id?: number;
  user_name?: string;
  external_id?: string;
  sentiment?: string;
  created_at: string;
}

export interface ChecklistItem {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  sop_step_id?: number;
  deal_id?: number;
  risk_id?: number;
  kaizen_id?: number;
  module_id?: string;
  related_id?: number;
  checklist?: ChecklistItem[];
  depends_on_task_id?: number;
  time_spent_seconds?: number;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  category?: string;
  type: 'product' | 'service';
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface CRMAttachment {
  id: number;
  customer_id: number;
  deal_id?: number;
  file_name: string;
  file_url: string;
  file_type?: string;
  uploaded_by?: number;
  created_at: string;
}

export interface CRMAssignmentRule {
  id: number;
  department_id?: number;
  service_type?: string;
  product?: string;
  user_id: number;
  is_active: boolean;
}

export interface ArticleCategory {
  id: number;
  name: string;
  parent_id?: number;
  department_id?: number;
  department_name?: string;
}

export interface KnowledgeArticle {
  id: number;
  title: string;
  content: string;
  category_id: number;
  category_name?: string;
  department_id?: number;
  author_id: number;
  author_name?: string;
  approver_id?: number;
  approver_name?: string;
  tags?: string;
  attachments?: string;
  related_sop_id?: number;
  related_sop_title?: string;
  helpful_count: number;
  not_helpful_count: number;
  view_count: number;
  status: string;
  content_type: 'Article' | 'PDF' | 'Video' | 'Link';
  external_url?: string;
  change_summary?: string;
  updated_by?: number;
  visible_departments?: string;
  product_id?: number;
  product_name?: string;
  created_at: string;
  updated_at: string;
  related_articles?: Partial<KnowledgeArticle>[];
}

export interface GlobalStatus {
  id: number;
  module_id: string;
  status_key: string;
  value: string;
  label: string;
  color: string;
  is_default: boolean;
  order_index?: number;
}

export interface AdminAuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  module: string;
  details: string;
  created_at: string;
}

export interface Integration {
  id: number;
  name: string;
  type: 'google_sheets' | 'facebook_leads' | 'whatsapp' | 'zapier' | 'meta_ads' | 'email' | 'facebook' | 'sms' | 'custom_ai';
  status: 'connected' | 'disconnected' | 'error';
  config: any;
  last_sync: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: number;
  integration_id: number;
  action: string;
  status: 'success' | 'failure';
  details: string | null;
  error_message: string | null;
  created_at: string;
}

export interface ProcessMap {
  id: number;
  title: string;
  description: string | null;
  sop_id: number | null;
  sop_title?: string;
  status: 'Draft' | 'Published';
  created_at: string;
  updated_at: string;
  nodes?: ProcessNode[];
  edges?: ProcessEdge[];
}

export interface ProcessNode {
  id: number;
  map_id: number;
  type: string;
  label: string;
  position_x: number;
  position_y: number;
  data: any;
  created_at?: string;
}

export interface ProcessEdge {
  id: number;
  map_id: number;
  source_node: number;
  target_node: number;
  source_handle?: string | null;
  target_handle?: string | null;
  label: string | null;
  created_at?: string;
}

export interface Employee {
  id: number;
  user_id?: number;
  employee_id?: string;
  role_id?: number | null;
  has_portal_access?: boolean;
  name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
  id_number?: string;
  extension_number?: string | number;
  department_id: number;
  department_name?: string;
  team_name?: string;
  job_title: string;
  reporting_to?: number | string | null;
  manager_name?: string | null;
  salary_base: number;
  allowances: number;
  contract_type: string;
  contract_start_date?: string;
  contract_end_date?: string;
  vacation_balance?: number;
  sick_leave_balance?: number;
  bereavement_used?: number;
  documents?: EmployeeDocument[];
  evaluation_history?: PerformanceReview[];
  penalty_history?: PenaltyRecord[];
  personal_info?: any;
  job_informations?: any[];
  compensations?: any[];
  bonuses_list?: any[];
  commissions_list?: any[];
  equities_list?: any[];
  shift_allowances_list?: any[];
  potential_bonus?: { percent?: number; amount?: string | number };
  kpi_amount?: number;
  kpi_frequency?: string;
  kpi_payout_mechanism?: string;
  kpi_payout_date?: string;
  kpi_settings?: { amount: number; frequency: string; payout_mechanism: string; payout_date?: string };
  employment_statuses?: any[];
  attendance_method?: 'Login System' | 'Fingerprint' | 'Both' | string;
  assigned_shift_id?: number | null;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  date_of_birth?: string;
  address?: string;
  work_location?: string;
  job_grade?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  emergency_contact_address?: string;
  recognitions?: any[];
  recognition_list?: any[];
  assets_list?: any[];
  benefits_info?: any;
  onboarding_tasks?: any[];
  offboarding_tasks?: any[];
  system_logins?: any[];
  break_schedules?: any[];
  status: 'active' | 'on_leave' | 'inactive' | 'terminated' | 'archived' | 'suspended' | string;
  status_date?: string;
  status_change_date?: string;
  termination_date?: string;
  status_reason?: string;
  tenure?: string;
  joined_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmployeeDocument {
  id: number;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
}

export interface PenaltyRecord {
  id: number;
  type: string;
  amount: number;
  reason: string;
  date: string;
}

export interface LeaveRequest {
  id: number;
  user_id: number;
  employee_name?: string;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  reason?: string;
  approver_id?: number;
  approver_name?: string;
  comments?: string;
  attachment_url?: string;
  attachment_name?: string;
  manager_status?: string;
  manager_id?: number;
  manager_name?: string;
  manager_comment?: string;
  manager_action_at?: string;
  attendance_status?: string;
  attendance_admin_id?: number;
  attendance_admin_name?: string;
  attendance_comment?: string;
  attendance_action_at?: string;
  with_deduction?: boolean;
  deduction_type?: string;
  deduction_days?: number;
  approved_period_scope?: 'full' | 'partial';
  approved_start_date?: string;
  approved_end_date?: string;
  approved_days?: number;
  created_at: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: number;
  user_id: number;
  employee_id?: string;
  employee_code?: string;
  employee_name?: string;
  date: string;
  clock_in?: string;
  clock_out?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'On Leave';
  shift_name?: string;
  worked_hours?: number;
}

export interface Shift {
  id: number;
  name: string;
  type?: 'Fixed' | 'Variable' | 'Flexible' | 'Holiday';
  attendance_method?: 'Login System' | 'Fingerprint' | 'Both' | string;
  start_time: string;
  end_time: string;
  grace_period_mins?: number;
  required_hours?: number;
  color: string;
  created_at: string;
}

export interface ShiftAssignment {
  id: number;
  user_id: number;
  employee_name?: string;
  shift_id: number;
  shift_name?: string;
  type?: 'Fixed' | 'Variable' | 'Flexible' | 'Holiday';
  start_time?: string;
  end_time?: string;
  grace_period_mins?: number;
  required_hours?: number;
  color?: string;
  day_of_week: number; // 0-6
  start_date?: string;
  end_date?: string;
  recurrence?: string;
  notification_sent?: boolean;
  employee_visibility?: 'published_all' | 'published_weekly' | 'draft' | string;
  is_published?: boolean;
}

export interface PayrollRecord {
  id: number;
  user_id: number;
  employee_name?: string;
  month: string;
  year: number;
  base_salary: number;
  allowances: number;
  deductions: number;
  bonuses: number;
  commissions: number;
  total_net: number;
  status: 'Draft' | 'Paid';
  created_at?: string;
}

export interface PerformanceReview {
  id: number;
  user_id: number;
  reviewer_id: number;
  period: string;
  score: number;
  productivity_rate: number;
  strengths: string;
  areas_for_improvement: string;
  status: 'Draft' | 'Finalized';
  created_at: string;
}
