import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EmployeeSearchSelect, EmployeeOption } from './EmployeeSearchSelect';
import { ActionRequiredMultiSelect } from './ActionRequiredMultiSelect';
import { AuditExecutiveSummary } from './AuditExecutiveSummary';
import { ManageableSelect } from './ManageableSelect';
import { 
  CheckCircle2, 
  Clock, 
  Calendar,
  DollarSign, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  X, 
  Building2, 
  UserCheck, 
  ShieldAlert, 
  CheckSquare, 
  Square,
  Sparkles,
  Monitor,
  User,
  Settings,
  TrendingUp,
  Headphones,
  PhoneCall,
  Send,
  HelpCircle,
  FileText,
  MessageSquare,
  PhoneOff,
  Star,
  AlertTriangle,
  XCircle,
  Phone,
  GraduationCap,
  Users,
  Briefcase,
  Zap,
  UserMinus,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Layers,
  FolderPlus,
  ListPlus,
  Tag,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  ListChecks,
  Percent,
  Sliders
} from 'lucide-react';

export type IncidentType = 'complaint' | 'delay' | 'refund' | 'cancellation' | 'nps';

export interface AuditRecord {
  id?: number;
  type: IncidentType;
  transaction_id: string;
  qa_reference_number?: string;
  handled_by?: string;
  request_type?: string;
  request_date?: string;
  survey_date?: string;
  date?: string;
  customer_phone?: string;
  operations_owner?: string;
  owner?: string;
  owner_id?: string | number | null;
  agent_name: string;
  agent_id?: string | number | null;
  customer_name: string;
  order_amount: number;
  order_date: string;
  created_at?: string;
  updated_at?: string;
  operations_status?: string;
  sla_status: string; // 'Met SLA' | 'Breached' | 'At Risk'
  status_on_system?: 'Yes' | 'No' | string;
  auditor_name: string;
  auditor_id?: string | number | null;
  reviewer_id?: string | number | null;
  request_sub_type?: string;
  qa_status: 'Pass' | 'Fail' | 'Pending' | string;
  department: string;
  root_cause: string;
  sub_reason: string;
  error_classification: string;
  rating?: number;
  category?: string;
  bucket_1_category?: string;
  bucket_2_area?: string;
  bucket_3_root_cause?: string;
  other_reason?: string;
  action_required?: string;
  manager_notes?: string;
  action_plan_required?: boolean;
  action_plan_type?: 'Training Action' | 'HR Action' | 'Quality Action' | string;
  refund_reason?: string;
  refund_sub_reason?: string;
  complaint_reason?: string;
  cancellation_reason?: string;
  lose_on_employee?: boolean;
  lose_employee_id?: string;
  lose_employee_name?: string;
  lose_status?: 'Accepted' | 'Rejected' | string;
  lose_amount?: number;
  switches: {
    over_promise?: boolean;
    system_remark?: boolean;
    b1_error?: boolean;
    b2_error?: boolean;
    document_accuracy?: boolean;
    avoidable_refund?: boolean;
    [key: string]: boolean | undefined;
  };
  system_remarks?: string;
  comment?: string;
  refund_amount: number;
  corrective_action: string;
  assigned_manager: string;
  manager_approval: 'Pending' | 'Approved' | 'Rejected' | string;
  current_step: number;
  workflow_status: string;
  details?: Record<string, any>;
}

interface IncidentWorkflowStepperProps {
  type: IncidentType;
  initialRecord?: Partial<AuditRecord> | null;
  presets?: any[];
  onSave: (record: AuditRecord) => Promise<void>;
  onClose?: () => void;
  isFullPage?: boolean;
}

// Delays Audit Buckets & Root Causes Definition
const DELAY_BUCKET_MAP: Record<string, { label: string; icon: any; options: { code: string; label: string }[] }> = {
  System: {
    label: 'System',
    icon: Monitor,
    options: [
      { code: 'SY01', label: 'Process Gap' },
      { code: 'SY02', label: 'Ticketing Failure' },
      { code: 'SY03', label: 'Integration Error' },
      { code: 'SY04', label: 'Embassy' }
    ]
  },
  Customer: {
    label: 'Customer',
    icon: User,
    options: [
      { code: 'C01', label: 'Missing Docs' },
      { code: 'C02', label: 'Change of Mind' },
      { code: 'C03', label: 'No Response' },
      { code: 'C04', label: 'Customer related' }
    ]
  },
  Supplier: {
    label: 'Supplier',
    icon: Building2,
    options: [
      { code: 'SP01', label: 'External Delay' },
      { code: 'SP02', label: 'Cancellation' },
      { code: 'SP03', label: 'Quality Issue' },
      { code: 'SP04', label: 'Embassy Update' }
    ]
  },
  Operations: {
    label: 'Operations',
    icon: Settings,
    options: [
      { code: 'OP01', label: 'Delay' },
      { code: 'OP02', label: 'Wrong Processing' },
      { code: 'OP03', label: 'Missed Step' },
      { code: 'OP04', label: 'Fulfillment' },
      { code: 'OP05', label: 'Wrong Action' },
      { code: 'OP06', label: 'Late Assign' },
      { code: 'OP07', label: 'Unassign' }
    ]
  },
  Sales: {
    label: 'Sales',
    icon: TrendingUp,
    options: [
      { code: 'S01', label: 'Overpromise' },
      { code: 'S02', label: 'Wrong Service' },
      { code: 'S03', label: 'Missing Expectations' },
      { code: 'S04', label: 'Sales Errors' }
    ]
  },
  'Customer Service': {
    label: 'Customer Service',
    icon: Headphones,
    options: [
      { code: 'CS01', label: 'Agent related' },
      { code: 'CS02', label: 'Handling way' },
      { code: 'CS03', label: 'Wrong Ticket' }
    ]
  },
  Finance: {
    label: 'Finance',
    icon: DollarSign,
    options: [
      { code: 'F01', label: 'Delay' },
      { code: 'F02', label: 'SLA complaint' }
    ]
  },
  'Follow Up': {
    label: 'Follow Up',
    icon: PhoneCall,
    options: [
      { code: 'FU01', label: 'Delay' }
    ]
  }
};

// Refund Audit Buckets & Root Causes Definition
const REFUND_BUCKET_MAP: Record<string, { label: string; icon: any; options: { code: string; label: string }[] }> = {
  System: {
    label: 'System',
    icon: Monitor,
    options: [
      { code: 'SY01', label: 'Process Gap' },
      { code: 'SY02', label: 'Ticketing Failure' },
      { code: 'SY03', label: 'Integration Error' }
    ]
  },
  Customer: {
    label: 'Customer',
    icon: User,
    options: [
      { code: 'C01', label: 'Missing Docs' },
      { code: 'C02', label: 'Change of Mind' },
      { code: 'C03', label: 'No Response' },
      { code: 'C04', label: 'Customer related' }
    ]
  },
  Supplier: {
    label: 'Supplier',
    icon: Building2,
    options: [
      { code: 'SP01', label: 'External Delay' },
      { code: 'SP02', label: 'Cancellation' },
      { code: 'SP03', label: 'Quality Issue' },
      { code: 'SP04', label: 'Embassy Update' },
      { code: 'SP05', label: 'Appointments not available' },
      { code: 'SP06', label: 'Refund of Financial Guarantee' }
    ]
  },
  Operations: {
    label: 'Operations',
    icon: Settings,
    options: [
      { code: 'OP01', label: 'Delay' },
      { code: 'OP02', label: 'Wrong Processing' },
      { code: 'OP03', label: 'Missed Step' },
      { code: 'OP04', label: 'Updates' }
    ]
  },
  Sales: {
    label: 'Sales',
    icon: TrendingUp,
    options: [
      { code: 'S01', label: 'Overpromise' },
      { code: 'S02', label: 'Wrong Service' },
      { code: 'S03', label: 'Missing Expectations' },
      { code: 'S04', label: 'Sales Errors' }
    ]
  },
  'Customer Service': {
    label: 'Customer Service',
    icon: Headphones,
    options: [
      { code: 'CS01', label: 'Agent related' },
      { code: 'CS02', label: 'Handling way' },
      { code: 'CS03', label: 'Wrong Ticket' }
    ]
  }
};

// Complaint Audit Buckets & Root Causes Definition
const COMPLAINT_BUCKET_MAP: Record<string, { label: string; icon: any; options: { code: string; label: string }[] }> = {
  System: {
    label: 'System',
    icon: Monitor,
    options: [
      { code: 'SY01', label: 'Process Gap' },
      { code: 'SY02', label: 'Ticketing Failure' },
      { code: 'SY03', label: 'Integration Error' },
      { code: 'SY04', label: 'Embassy' }
    ]
  },
  Customer: {
    label: 'Customer',
    icon: User,
    options: [
      { code: 'C01', label: 'Missing Docs' },
      { code: 'C02', label: 'Change of Mind' },
      { code: 'C03', label: 'No Response' },
      { code: 'C04', label: 'Customer Related' },
      { code: 'C05', label: 'Customer Behavior' }
    ]
  },
  Supplier: {
    label: 'Supplier',
    icon: Building2,
    options: [
      { code: 'SP01', label: 'External Delay' },
      { code: 'SP02', label: 'Cancellation' },
      { code: 'SP03', label: 'Quality Issue' },
      { code: 'SP04', label: 'Embassy Update' }
    ]
  },
  Operations: {
    label: 'Operations',
    icon: Settings,
    options: [
      { code: 'OP01', label: 'Delay' },
      { code: 'OP02', label: 'Wrong Processing' },
      { code: 'OP03', label: 'Missed Step' },
      { code: 'OP04', label: 'Fulfillment' },
      { code: 'OP05', label: 'Over Promise' },
      { code: 'OP06', label: 'Late Assign' }
    ]
  },
  Sales: {
    label: 'Sales',
    icon: TrendingUp,
    options: [
      { code: 'S01', label: 'Overpromise' },
      { code: 'S02', label: 'Wrong Service' },
      { code: 'S03', label: 'Missing Expectations' },
      { code: 'S04', label: 'Sales Errors' }
    ]
  },
  'Customer Service': {
    label: 'Customer Service',
    icon: Headphones,
    options: [
      { code: 'CS01', label: 'Agent Related' },
      { code: 'CS02', label: 'Handling Way' },
      { code: 'CS03', label: 'Wrong Ticket' }
    ]
  },
  Finance: {
    label: 'Finance',
    icon: DollarSign,
    options: [
      { code: 'F01', label: 'Delay' },
      { code: 'F02', label: 'Fulfillment' }
    ]
  }
};

// Default Cancellation Reasons & Associated Errors Mapping
const DEFAULT_CANCELLATION_MAP: Record<string, string[]> = {
  'Follow-up': [
    'Lack of Follow-up',
    'Two Calls Only',
    'One Call & One Message',
    'No Calls',
    'Next Step Not Completed'
  ],
  'Competitor': [
    'Found Better Price Elsewhere',
    'Competitor Cheaper Rate',
    'Competitor Faster Turnaround',
    'Competitor Offered Promotion'
  ],
  'Price': [
    'High Service Fee',
    'Unexpected Extra Charges',
    'Budget Constraints',
    'Hidden Processing Costs'
  ],
  'Customer': [
    'Customer Changed Mind',
    'Personal Emergency',
    'Travel Postponed / Rescheduled',
    'Customer Unresponsive'
  ],
  'Agent Behavior': [
    'Agent Behavior',
    'Lack of Sales Technique',
    'Inaccurate Information Provided',
    'Unprofessional Conduct / Rude Tone'
  ],
  'System': [
    'UI/UX Bug & Downtime',
    'Payment Gateway Failure',
    'Sync & Processing Delay'
  ]
};

// Type interfaces for Preset Checklists
export interface ParsedSubReason {
  id: string;
  name: string;
  weight_percentage: number;
  is_active: boolean;
}

export interface ParsedPreset {
  id: number;
  type: IncidentType;
  department: string;
  root_cause_name: string;
  weight: number;
  sub_reasons: ParsedSubReason[];
}

export const parseSubReasonsList = (raw: any): ParsedSubReason[] => {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(parsed)) return [];
  const basePct = Math.floor(100 / Math.max(1, parsed.length));
  return parsed.map((item: any, idx: number) => {
    if (typeof item === 'string') {
      return {
        id: `sr-${idx}`,
        name: item,
        weight_percentage: basePct,
        is_active: true
      };
    }
    return {
      id: item.id || `sr-${idx}`,
      name: item.name || '',
      weight_percentage: typeof item.weight_percentage === 'number' ? item.weight_percentage : (typeof item.weight === 'number' ? item.weight : basePct),
      is_active: item.is_active !== undefined ? item.is_active : true
    };
  });
};

export const IncidentWorkflowStepper: React.FC<IncidentWorkflowStepperProps> = ({
  type,
  initialRecord,
  presets = [],
  onSave,
  onClose,
  isFullPage = false
}) => {
  const isCancellation = type === 'cancellation';
  const isRefund = type === 'refund';
  const isComplaint = type === 'complaint';
  const isNps = type === 'nps';
  const isDelay = type === 'delay' || (!isCancellation && !isRefund && !isComplaint && !isNps);

  // Cancellation Reason & Error Dynamic Mapping State
  const [cancellationMap, setCancellationMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('qa_cancellation_reason_error_map');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading cancellation map:', e);
    }
    return DEFAULT_CANCELLATION_MAP;
  });

  // State for adding & editing in Cancellation Manager
  const { checkPermission, previewRole, user } = useAuth();
  const isSuperAdmin = !previewRole && (user?.role_id === 1 || (user as any)?.is_super_admin || user?.role === 'Admin' || user?.role_name === 'Admin');
  const canManageReasonsErrors = isSuperAdmin || 
    checkPermission('QA', 'custom:qa_reason_error_mgmt') || 
    checkPermission('QA', 'custom:reason_error_management') || 
    checkPermission('QA', 'custom:manage_reasons_errors') || 
    checkPermission('QA', 'action:Transactions Audit:write') ||
    checkPermission('QA', 'write');

  const [newMainReasonInput, setNewMainReasonInput] = useState('');
  const [newErrorInput, setNewErrorInput] = useState('');
  const [targetReasonForNewError, setTargetReasonForNewError] = useState<string>('');
  const [editingReasonKey, setEditingReasonKey] = useState<string | null>(null);
  const [editingReasonValue, setEditingReasonValue] = useState('');
  const [editingErrorKey, setEditingErrorKey] = useState<{ reason: string; oldError: string } | null>(null);
  const [editingErrorValue, setEditingErrorValue] = useState('');
  const [inlineAddErrorReason, setInlineAddErrorReason] = useState<string | null>(null);
  const [inlineAddErrorText, setInlineAddErrorText] = useState('');
  const [showReasonErrorManager, setShowReasonErrorManager] = useState<boolean>(false);

  // Stepper Header Steps Definition
  const steps = isCancellation ? [
    { number: 1, title: 'General Info', desc: 'Basic Request Details' },
    { number: 2, title: 'QA Review', desc: 'QA Review & Validation' },
    { number: 3, title: 'Cancellation Reason', desc: 'Reason & Classification' },
    { number: 4, title: 'Details', desc: 'Cancellation Details' },
    { number: 5, title: 'Review & Close', desc: 'Action & Approval' }
  ] : isRefund ? [
    { number: 1, title: 'General Info', desc: 'Basic Request Details' },
    { number: 2, title: 'Validation', desc: 'QA & Validation Check' },
    { number: 3, title: 'Classification', desc: 'Bucket & Root Cause' },
    { number: 4, title: 'Refund Details', desc: 'Amount & Error Switches' },
    { number: 5, title: 'Review & Close', desc: 'Action & Approval' }
  ] : isComplaint ? [
    { number: 1, title: 'General Info', desc: 'Basic Request Details' },
    { number: 2, title: 'Validation', desc: 'QA & Validation Check' },
    { number: 3, title: 'Classification', desc: 'Select Bucket' },
    { number: 4, title: 'Root Cause', desc: 'Root Cause & Sub Reason' },
    { number: 5, title: 'Complaint Details', desc: 'Switches & Comment' },
    { number: 6, title: 'Action & Review', desc: 'Action & Manager Approval' }
  ] : isNps ? [
    { number: 1, title: 'General Info', desc: 'Basic Request Details' },
    { number: 2, title: 'NPS Score', desc: 'Rating Score & Category' },
    { number: 3, title: 'Root Cause Classification', desc: 'Bucket 1, 2 & Root Cause' },
    { number: 4, title: 'Customer Feedback', desc: 'Comment & Action Required' },
    { number: 5, title: 'Manager Review', desc: 'Manager Notes & Status' }
  ] : [
    { number: 1, title: 'General Info', desc: 'Basic Request Details' },
    { number: 2, title: 'Operations Review', desc: 'SLA & Status Check' },
    { number: 3, title: 'QA Validation', desc: 'Auditor Evaluation' },
    { number: 4, title: 'Classification', desc: 'Department Bucket' },
    { number: 5, title: 'Root Cause', desc: 'Primary & Sub Reason' },
    { number: 6, title: 'Details', desc: 'Switches & Remarks' },
    { number: 7, title: 'Review & Close', desc: 'Action & Approval' }
  ];

  const [currentStep, setCurrentStep] = useState<number>(initialRecord?.current_step || 1);
  const [saving, setSaving] = useState(false);
  const [employeesList, setEmployeesList] = useState<EmployeeOption[]>([]);

  useEffect(() => {
    // Fetch live employees dynamically linked from HR module
    const fetchHrEmployees = async () => {
      try {
        const qaRes = await fetch('/api/qa/hr-employees');
        if (qaRes.ok) {
          const qaData = await qaRes.json();
          if (Array.isArray(qaData) && qaData.length > 0) {
            const formatted: EmployeeOption[] = qaData.map((emp: any) => ({
              id: emp.id,
              name: emp.full_name || emp.name || 'Employee',
              email: emp.email,
              department: emp.department || 'Operations',
              job_title: emp.position || emp.job_title || 'Specialist',
              id_number: emp.employee_code || String(emp.id),
              employee_code: emp.employee_code || String(emp.id),
              ext: emp.ext ? String(emp.ext).trim() : (emp.personal_info?.ext ? String(emp.personal_info.ext).trim() : (emp.personal_info?.extension ? String(emp.personal_info.extension).trim() : '')),
              phone: emp.phone || emp.mobile_phone || (emp.personal_info?.mobile_phone || emp.personal_info?.work_phone || ''),
              user_id: emp.id,
              avatar_url: emp.avatar_url
            }));
            setEmployeesList(formatted);
            return;
          }
        }

        const res = await fetch('/api/hr/employees');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const formatted: EmployeeOption[] = data.map((emp: any) => ({
              id: emp.id || emp.user_id || emp.employee_id,
              name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email || 'Employee',
              email: emp.email || emp.work_email,
              department: emp.department_name || emp.department || emp.team_name || emp.personal_info?.department_name || 'Operations',
              job_title: emp.job_title || emp.personal_info?.job_title || '',
              id_number: emp.id_number || emp.personal_info?.employee_number || emp.personal_info?.employee_id || emp.personal_info?.nin || String(emp.id),
              employee_code: emp.employee_code || emp.id_number || String(emp.id),
              ext: (emp.personal_info?.ext || emp.personal_info?.extension || emp.ext || '') ? String(emp.personal_info?.ext || emp.personal_info?.extension || emp.ext || '').trim() : '',
              phone: emp.phone || emp.mobile_phone || emp.personal_info?.mobile_phone || emp.personal_info?.work_phone || '',
              user_id: emp.user_id || emp.id,
              avatar_url: emp.avatar_url
            }));
            setEmployeesList(formatted);
          }
        }
      } catch (err) {
        console.warn("Could not fetch HR employees dynamically:", err);
      }
    };
    fetchHrEmployees();
  }, []);

  // Form State initialized with clean, zero-mock defaults
  const [formData, setFormData] = useState<AuditRecord>({
    id: initialRecord?.id,
    type: type,
    transaction_id: initialRecord?.transaction_id || (initialRecord?.details?.request_id) || '',
    qa_reference_number: initialRecord?.qa_reference_number || initialRecord?.details?.qa_reference_number || ('QA-' + (type ? type.toUpperCase().slice(0, 3) : 'AUD') + '-' + Math.floor(100000 + Math.random() * 900000)),
    handled_by: initialRecord?.handled_by || initialRecord?.details?.handled_by || '',
    created_at: initialRecord?.created_at || initialRecord?.details?.created_at || new Date().toISOString(),
    updated_at: initialRecord?.updated_at || initialRecord?.details?.updated_at || new Date().toISOString(),
    request_type: initialRecord?.request_type || initialRecord?.details?.request_type || '',
    request_sub_type: initialRecord?.request_sub_type || initialRecord?.details?.request_sub_type || '',
    request_date: initialRecord?.request_date || initialRecord?.details?.request_date || new Date().toISOString().slice(0, 10),
    survey_date: initialRecord?.survey_date || new Date().toISOString().slice(0, 10),
    customer_phone: initialRecord?.customer_phone || '',
    operations_owner: initialRecord?.operations_owner || initialRecord?.owner || (initialRecord as any)?.operation_owner || initialRecord?.details?.operations_owner || initialRecord?.details?.owner || '',
    owner: initialRecord?.owner || initialRecord?.operations_owner || (initialRecord as any)?.operation_owner || initialRecord?.details?.operations_owner || initialRecord?.details?.owner || '',
    owner_id: initialRecord?.owner_id || null,
    agent_name: initialRecord?.agent_name || '',
    agent_id: initialRecord?.agent_id || null,
    customer_name: initialRecord?.customer_name || '',
    order_amount: initialRecord?.order_amount !== undefined ? initialRecord.order_amount : 0,
    order_date: initialRecord?.order_date || new Date().toISOString().slice(0, 10),
    operations_status: initialRecord?.operations_status || initialRecord?.details?.operations_status || 'In Progress',
    sla_status: initialRecord?.sla_status || 'Met SLA',
    status_on_system: initialRecord?.status_on_system || initialRecord?.details?.status_on_system || 'Yes',
    auditor_name: initialRecord?.auditor_name || '',
    auditor_id: initialRecord?.auditor_id || null,
    reviewer_id: initialRecord?.reviewer_id || null,
    qa_status: initialRecord?.qa_status || 'Pass',
    department: initialRecord?.department || '',
    root_cause: initialRecord?.root_cause || '',
    sub_reason: initialRecord?.sub_reason || '',
    error_classification: initialRecord?.error_classification || '',
    rating: initialRecord?.rating ?? (initialRecord?.details?.rating ?? (isNps ? 10 : 8)),
    category: initialRecord?.category || (initialRecord?.details?.category || 'Promoter'),
    bucket_1_category: initialRecord?.bucket_1_category || '',
    bucket_2_area: initialRecord?.bucket_2_area || '',
    bucket_3_root_cause: initialRecord?.bucket_3_root_cause || '',
    other_reason: initialRecord?.other_reason || '',
    action_required: initialRecord?.action_required || '',
    manager_notes: initialRecord?.manager_notes || '',
    refund_reason: initialRecord?.refund_reason || initialRecord?.details?.refund_reason || '',
    refund_sub_reason: initialRecord?.refund_sub_reason || initialRecord?.details?.refund_sub_reason || '',
    complaint_reason: initialRecord?.complaint_reason || initialRecord?.details?.complaint_reason || (initialRecord as any)?.complaintReason || '',
    cancellation_reason: initialRecord?.cancellation_reason || initialRecord?.details?.cancellation_reason || '',
    lose_on_employee: initialRecord?.lose_on_employee ?? (initialRecord?.details?.lose_on_employee ?? false),
    lose_employee_id: initialRecord?.lose_employee_id || initialRecord?.details?.lose_employee_id || '',
    lose_employee_name: initialRecord?.lose_employee_name || initialRecord?.details?.lose_employee_name || '',
    lose_status: initialRecord?.lose_status || initialRecord?.details?.lose_status || 'Pending',
    lose_amount: initialRecord?.lose_amount !== undefined ? initialRecord.lose_amount : (initialRecord?.details?.lose_amount !== undefined ? initialRecord.details.lose_amount : 0),
    switches: {
      over_promise: initialRecord?.switches?.over_promise ?? false,
      system_remark: initialRecord?.switches?.system_remark ?? false,
      complaint_accuracy: initialRecord?.switches?.complaint_accuracy ?? false,
      document_accuracy: initialRecord?.switches?.document_accuracy ?? false,
      avoidable_refund: initialRecord?.switches?.avoidable_refund ?? false,
    },
    system_remarks: initialRecord?.system_remarks || initialRecord?.details?.system_remarks || '',
    comment: initialRecord?.comment !== undefined && initialRecord?.comment !== null ? initialRecord.comment : (initialRecord?.details?.comment || (initialRecord as any)?.feedback_text || ''),
    refund_amount: initialRecord?.refund_amount || 0,
    corrective_action: initialRecord?.corrective_action || '',
    assigned_manager: initialRecord?.assigned_manager || '',
    manager_approval: initialRecord?.manager_approval || 'Pending',
    action_plan_required: initialRecord?.action_plan_required ?? false,
    action_plan_type: initialRecord?.action_plan_type || 'Training Action',
    current_step: initialRecord?.current_step || 1,
    workflow_status: initialRecord?.workflow_status || 'Draft',
    details: initialRecord?.details || {}
  });

  // Sync state if initialRecord is populated or changes
  useEffect(() => {
    if (initialRecord && Object.keys(initialRecord).length > 0) {
      const recDate = initialRecord.request_date 
        ? String(initialRecord.request_date).slice(0, 10)
        : (initialRecord.survey_date 
            ? String(initialRecord.survey_date).slice(0, 10)
            : (initialRecord.order_date 
                ? String(initialRecord.order_date).slice(0, 10)
                : (initialRecord.created_at ? String(initialRecord.created_at).slice(0, 10) : undefined)));

      const resolvedOwner = initialRecord.owner || initialRecord.operations_owner || (initialRecord as any).operation_owner || initialRecord.details?.operations_owner || initialRecord.details?.owner || '';
      const resolvedComment = initialRecord.comment !== undefined && initialRecord.comment !== null 
        ? initialRecord.comment 
        : (initialRecord.details?.comment || (initialRecord as any)?.feedback_text);

      setFormData(prev => ({
        ...prev,
        ...initialRecord,
        transaction_id: initialRecord.transaction_id ?? prev.transaction_id,
        operations_owner: resolvedOwner || prev.operations_owner,
        owner: resolvedOwner || prev.owner,
        owner_id: initialRecord.owner_id !== undefined ? initialRecord.owner_id : prev.owner_id,
        agent_name: initialRecord.agent_name ?? prev.agent_name,
        agent_id: initialRecord.agent_id !== undefined ? initialRecord.agent_id : prev.agent_id,
        auditor_name: initialRecord.auditor_name ?? prev.auditor_name,
        auditor_id: initialRecord.auditor_id !== undefined ? initialRecord.auditor_id : prev.auditor_id,
        reviewer_id: initialRecord.reviewer_id !== undefined ? initialRecord.reviewer_id : prev.reviewer_id,
        request_type: initialRecord.request_type ?? prev.request_type,
        request_sub_type: initialRecord.request_sub_type ?? prev.request_sub_type,
        request_date: recDate || prev.request_date,
        survey_date: recDate || prev.survey_date,
        order_date: recDate || prev.order_date,
        created_at: initialRecord.created_at ?? prev.created_at,
        updated_at: initialRecord.updated_at ?? prev.updated_at,
        department: initialRecord.department ?? prev.department,
        root_cause: initialRecord.root_cause ?? prev.root_cause,
        sub_reason: initialRecord.sub_reason ?? prev.sub_reason,
        complaint_reason: (initialRecord as any).complaint_reason ?? (initialRecord as any)?.details?.complaint_reason ?? prev.complaint_reason,
        cancellation_reason: initialRecord.cancellation_reason ?? prev.cancellation_reason,
        comment: resolvedComment !== undefined ? resolvedComment : prev.comment,
        corrective_action: initialRecord.corrective_action ?? prev.corrective_action,
        assigned_manager: initialRecord.assigned_manager ?? prev.assigned_manager,
        current_step: initialRecord.current_step || prev.current_step || 1
      }));
    }
  }, [initialRecord]);

  // Flexible Date Selection Handler (allows past, present, or future audit dates)
  const handleDateChange = (newDateStr: string) => {
    const safeDate = newDateStr ? String(newDateStr).slice(0, 10) : '';
    const safeIsoTime = safeDate ? new Date(safeDate + 'T12:00:00Z').toISOString() : new Date().toISOString();
    setFormData(prev => ({
      ...prev,
      request_date: safeDate,
      survey_date: safeDate,
      order_date: safeDate,
      created_at: safeIsoTime,
      details: {
        ...(prev.details || {}),
        request_date: safeDate,
        survey_date: safeDate,
        order_date: safeDate,
        date: safeDate,
        created_at: safeIsoTime
      }
    }));
  };

  // Sync presets for cancellation if available
  useEffect(() => {
    if (isCancellation && presets && presets.length > 0) {
      const cancelPresets = presets.filter(p => p.type === 'cancellation');
      if (cancelPresets.length > 0) {
        setCancellationMap(prev => {
          let modified = false;
          const merged = { ...prev };
          cancelPresets.forEach(cp => {
            const rName = cp.department || cp.root_cause_name;
            if (rName) {
              let subList: string[] = [];
              if (Array.isArray(cp.sub_reasons)) {
                subList = cp.sub_reasons.map((sr: any) => typeof sr === 'string' ? sr : (sr.name || '')).filter(Boolean);
              } else if (typeof cp.sub_reasons === 'string') {
                try {
                  const parsed = JSON.parse(cp.sub_reasons);
                  subList = Array.isArray(parsed) ? parsed.map((sr: any) => typeof sr === 'string' ? sr : (sr.name || '')).filter(Boolean) : [];
                } catch {
                  subList = cp.sub_reasons.split(',').map((s: string) => s.trim()).filter(Boolean);
                }
              }
              if (!merged[rName]) {
                merged[rName] = subList;
                modified = true;
              } else if (subList.length > 0) {
                const combined = Array.from(new Set([...merged[rName], ...subList]));
                if (combined.length !== merged[rName].length) {
                  merged[rName] = combined;
                  modified = true;
                }
              }
            }
          });
          if (modified) {
            try {
              localStorage.setItem('qa_cancellation_reason_error_map', JSON.stringify(merged));
            } catch (e) {
              console.error(e);
            }
            return merged;
          }
          return prev;
        });
      }
    }
  }, [isCancellation, presets]);

  // Ensure formData.department is valid in cancellationMap if in cancellation mode
  useEffect(() => {
    if (isCancellation && cancellationMap) {
      const availableReasons = Object.keys(cancellationMap);
      if (availableReasons.length > 0) {
        if (!formData.department || !cancellationMap[formData.department]) {
          const firstReason = availableReasons[0];
          const firstErr = cancellationMap[firstReason]?.[0] || '';
          setFormData(prev => ({
            ...prev,
            department: firstReason,
            root_cause: prev.root_cause && cancellationMap[firstReason]?.includes(prev.root_cause) ? prev.root_cause : firstErr,
            error_classification: prev.error_classification || firstErr
          }));
        }
      }
    }
  }, [isCancellation, cancellationMap]);

  // Save helper for cancellation map
  const saveCancellationMap = (newMap: Record<string, string[]>) => {
    setCancellationMap(newMap);
    try {
      localStorage.setItem('qa_cancellation_reason_error_map', JSON.stringify(newMap));
    } catch (e) {
      console.error('Failed to save cancellation map:', e);
    }
  };

  // Add new Main Reason
  const handleAddMainReason = () => {
    const trimmed = newMainReasonInput.trim();
    if (!trimmed) return;
    if (cancellationMap[trimmed]) {
      // Already exists, just select it
      setFormData(prev => ({
        ...prev,
        department: trimmed,
        root_cause: cancellationMap[trimmed]?.[0] || '',
        error_classification: cancellationMap[trimmed]?.[0] || ''
      }));
      setNewMainReasonInput('');
      setTargetReasonForNewError(trimmed);
      return;
    }
    const updated = {
      ...cancellationMap,
      [trimmed]: []
    };
    saveCancellationMap(updated);
    setFormData(prev => ({
      ...prev,
      department: trimmed,
      root_cause: '',
      error_classification: ''
    }));
    setNewMainReasonInput('');
    setTargetReasonForNewError(trimmed);
  };

  // Add new Error to Reason
  const handleAddErrorToReason = (reasonName?: string, explicitError?: string) => {
    const rName = reasonName || targetReasonForNewError || formData.department || Object.keys(cancellationMap)[0];
    const errText = (explicitError !== undefined ? explicitError : newErrorInput).trim();
    if (!rName || !errText) return;

    const currentList = cancellationMap[rName] || [];
    if (!currentList.includes(errText)) {
      const updatedList = [...currentList, errText];
      const updatedMap = {
        ...cancellationMap,
        [rName]: updatedList
      };
      saveCancellationMap(updatedMap);
      if (formData.department === rName) {
        setFormData(prev => ({
          ...prev,
          root_cause: errText,
          error_classification: errText
        }));
      }
    }
    if (explicitError === undefined) {
      setNewErrorInput('');
    }
  };

  // Delete Main Reason
  const handleDeleteMainReason = (reasonName: string) => {
    const { [reasonName]: removed, ...rest } = cancellationMap;
    saveCancellationMap(rest);
    if (formData.department === reasonName) {
      const nextReason = Object.keys(rest)[0] || '';
      const nextError = rest[nextReason]?.[0] || '';
      setFormData(prev => ({
        ...prev,
        department: nextReason,
        root_cause: nextError,
        error_classification: nextError
      }));
    }
    if (targetReasonForNewError === reasonName) {
      setTargetReasonForNewError(Object.keys(rest)[0] || '');
    }
  };

  // Delete Error from Reason
  const handleDeleteError = (reasonName: string, errorToDelete: string) => {
    const currentList = cancellationMap[reasonName] || [];
    const updatedList = currentList.filter(e => e !== errorToDelete);
    const updatedMap = {
      ...cancellationMap,
      [reasonName]: updatedList
    };
    saveCancellationMap(updatedMap);
    if (formData.department === reasonName && formData.root_cause === errorToDelete) {
      const nextErr = updatedList[0] || '';
      setFormData(prev => ({
        ...prev,
        root_cause: nextErr,
        error_classification: nextErr
      }));
    }
  };

  // Rename Main Reason
  const handleSaveEditMainReason = (oldName: string) => {
    const trimmed = editingReasonValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingReasonKey(null);
      return;
    }
    const currentErrors = cancellationMap[oldName] || [];
    const newMap: Record<string, string[]> = {};
    Object.keys(cancellationMap).forEach(k => {
      if (k === oldName) {
        newMap[trimmed] = currentErrors;
      } else {
        newMap[k] = cancellationMap[k];
      }
    });
    saveCancellationMap(newMap);
    if (formData.department === oldName) {
      setFormData(prev => ({ ...prev, department: trimmed }));
    }
    if (targetReasonForNewError === oldName) {
      setTargetReasonForNewError(trimmed);
    }
    setEditingReasonKey(null);
    setEditingReasonValue('');
  };

  // Rename Error
  const handleSaveEditError = (reasonName: string, oldError: string) => {
    const trimmed = editingErrorValue.trim();
    if (!trimmed || trimmed === oldError) {
      setEditingErrorKey(null);
      return;
    }
    const currentList = cancellationMap[reasonName] || [];
    const updatedList = currentList.map(e => e === oldError ? trimmed : e);
    const updatedMap = {
      ...cancellationMap,
      [reasonName]: updatedList
    };
    saveCancellationMap(updatedMap);
    if (formData.department === reasonName && formData.root_cause === oldError) {
      setFormData(prev => ({
        ...prev,
        root_cause: trimmed,
        error_classification: trimmed
      }));
    }
    setEditingErrorKey(null);
    setEditingErrorValue('');
  };

  // Reset to Defaults
  const handleResetCancellationDefaults = () => {
    saveCancellationMap(DEFAULT_CANCELLATION_MAP);
    const firstReason = Object.keys(DEFAULT_CANCELLATION_MAP)[0];
    const firstError = DEFAULT_CANCELLATION_MAP[firstReason]?.[0] || '';
    setFormData(prev => ({
      ...prev,
      department: firstReason,
      root_cause: firstError,
      error_classification: firstError
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
      setFormData(prev => ({ ...prev, current_step: currentStep + 1 }));
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setFormData(prev => ({ ...prev, current_step: currentStep - 1 }));
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const nowIso = new Date().toISOString();
      const chosenDateStr = formData.request_date || formData.survey_date || formData.order_date;
      const safeRecordDateIso = chosenDateStr 
        ? new Date(chosenDateStr + 'T12:00:00Z').toISOString() 
        : (formData.created_at || nowIso);

      const resolvedQaRef = formData.qa_reference_number || ('QA-' + (type ? type.toUpperCase().slice(0, 3) : 'AUD') + '-' + Math.floor(100000 + Math.random() * 900000));
      const effectiveOwner = formData.operations_owner || formData.owner || null;
      const effectiveComment = formData.comment !== undefined && formData.comment !== null ? formData.comment : '';
      const finalPayload: AuditRecord = {
        ...formData,
        qa_reference_number: resolvedQaRef,
        handled_by: formData.handled_by || formData.details?.handled_by || null,
        owner: effectiveOwner,
        operations_owner: effectiveOwner,
        comment: effectiveComment,
        complaint_reason: formData.complaint_reason || null,
        cancellation_reason: formData.cancellation_reason || null,
        owner_id: formData.owner_id || null,
        agent_id: formData.agent_id || null,
        auditor_id: formData.auditor_id || null,
        reviewer_id: formData.reviewer_id || null,
        request_sub_type: formData.request_sub_type || formData.request_type || null,
        request_date: chosenDateStr || formData.request_date || null,
        survey_date: chosenDateStr || formData.survey_date || null,
        order_date: chosenDateStr || formData.order_date || nowIso.slice(0, 10),
        created_at: safeRecordDateIso,
        updated_at: nowIso,
        current_step: currentStep,
        workflow_status: currentStep === steps.length ? 'Closed' : 'Under Review',
        details: {
          ...formData.details,
          qa_reference_number: resolvedQaRef,
          handled_by: formData.handled_by || formData.details?.handled_by || null,
          created_at: safeRecordDateIso,
          updated_at: nowIso,
          request_id: formData.transaction_id,
          request_type: formData.request_type,
          request_sub_type: formData.request_sub_type || formData.request_type || null,
          request_date: chosenDateStr || formData.request_date || null,
          survey_date: chosenDateStr || formData.survey_date || null,
          order_date: chosenDateStr || formData.order_date || nowIso.slice(0, 10),
          date: chosenDateStr || null,
          operations_owner: effectiveOwner,
          owner: effectiveOwner,
          owner_id: formData.owner_id || null,
          agent_name: formData.agent_name || null,
          agent_id: formData.agent_id || null,
          auditor_name: formData.auditor_name || null,
          auditor_id: formData.auditor_id || null,
          reviewer_name: formData.assigned_manager || null,
          reviewer_id: formData.reviewer_id || null,
          operations_status: formData.operations_status,
          status_on_system: formData.status_on_system,
          system_remarks: formData.system_remarks,
          comment: effectiveComment,
          refund_reason: formData.refund_reason,
          refund_sub_reason: formData.refund_sub_reason,
          complaint_reason: formData.complaint_reason || null,
          cancellation_reason: formData.cancellation_reason || null,
          lose_on_employee: formData.lose_on_employee,
          lose_employee_id: formData.lose_employee_id,
          lose_employee_name: formData.lose_employee_name,
          lose_status: formData.lose_status,
          lose_amount: formData.lose_amount
        }
      };
      await onSave(finalPayload);
    } catch (err) {
      console.error("Error saving audit record:", err);
    } finally {
      setSaving(false);
    }
  };

  // Active Type Presets from Audit Checklists
  const activeTypePresets: ParsedPreset[] = useMemo(() => {
    if (!Array.isArray(presets)) return [];
    return presets
      .filter(p => p.type === type || (!p.type && type === 'complaint'))
      .map(p => ({
        id: p.id || Math.random(),
        type: p.type || type,
        department: p.department || 'Operations',
        root_cause_name: p.root_cause_name || p.name || '',
        weight: p.weight !== undefined && p.weight !== null ? Number(p.weight) : 25,
        sub_reasons: parseSubReasonsList(p.sub_reasons)
      }))
      .filter(p => Boolean(p.root_cause_name));
  }, [presets, type]);

  // Checked Sub-Reasons State
  const [checkedSubReasonIds, setCheckedSubReasonIds] = useState<string[]>(() => {
    if (initialRecord?.details?.checked_sub_reasons && Array.isArray(initialRecord.details.checked_sub_reasons)) {
      return initialRecord.details.checked_sub_reasons;
    }
    return [];
  });

  // Find the active preset matching selected root_cause and department
  const currentSelectedPreset = useMemo(() => {
    const rcToMatch = (formData.root_cause || formData.bucket_3_root_cause || '').toLowerCase().trim();
    if (!rcToMatch) return null;
    const deptToMatch = (formData.department || formData.bucket_2_area || '').toLowerCase().trim();

    if (deptToMatch) {
      const exactMatch = activeTypePresets.find(p => 
        p.root_cause_name.toLowerCase().trim() === rcToMatch &&
        p.department && p.department.toLowerCase().trim() === deptToMatch
      );
      if (exactMatch) return exactMatch;
    }

    return activeTypePresets.find(p => p.root_cause_name.toLowerCase().trim() === rcToMatch) || null;
  }, [activeTypePresets, formData.root_cause, formData.bucket_3_root_cause, formData.department, formData.bucket_2_area]);

  // Toggle Sub-Reason selection
  const handleToggleSubReason = (sub: ParsedSubReason, presetWeight: number) => {
    const isChecked = checkedSubReasonIds.includes(sub.id) || checkedSubReasonIds.includes(sub.name);
    let updated: string[];
    if (isChecked) {
      updated = checkedSubReasonIds.filter(id => id !== sub.id && id !== sub.name);
    } else {
      updated = [...checkedSubReasonIds, sub.id];
    }
    setCheckedSubReasonIds(updated);

    if (currentSelectedPreset) {
      const selectedNames = currentSelectedPreset.sub_reasons
        .filter(sr => updated.includes(sr.id) || updated.includes(sr.name))
        .map(sr => sr.name);
      
      const totalPoints = currentSelectedPreset.sub_reasons
        .filter(sr => updated.includes(sr.id) || updated.includes(sr.name))
        .reduce((sum, sr) => sum + ((sr.weight_percentage / 100) * presetWeight), 0);

      setFormData(prev => ({
        ...prev,
        sub_reason: selectedNames.length > 0 ? selectedNames.join('; ') : '',
        details: {
          ...(prev.details || {}),
          checked_sub_reasons: updated,
          checklist_total_weight_deduction: totalPoints
        }
      }));
    }
  };

  const handleSelectAllSubReasons = () => {
    if (!currentSelectedPreset) return;
    const allIds = currentSelectedPreset.sub_reasons.filter(sr => sr.is_active).map(sr => sr.id);
    setCheckedSubReasonIds(allIds);
    const allNames = currentSelectedPreset.sub_reasons.filter(sr => sr.is_active).map(sr => sr.name);
    setFormData(prev => ({
      ...prev,
      sub_reason: allNames.join('; '),
      details: {
        ...(prev.details || {}),
        checked_sub_reasons: allIds,
        checklist_total_weight_deduction: currentSelectedPreset.weight || 25
      }
    }));
  };

  const handleClearAllSubReasons = () => {
    setCheckedSubReasonIds([]);
    setFormData(prev => ({
      ...prev,
      sub_reason: '',
      details: {
        ...(prev.details || {}),
        checked_sub_reasons: [],
        checklist_total_weight_deduction: 0
      }
    }));
  };

  // Dedicated handler to select Root Cause and department cleanly without cross-contamination
  const handleSelectRootCause = (deptKey: string, opt: { label: string; code?: string; isPreset?: boolean; weight?: number; preset?: ParsedPreset }) => {
    setFormData(prev => ({
      ...prev,
      department: deptKey,
      bucket_2_area: deptKey,
      root_cause: opt.label,
      bucket_3_root_cause: opt.label,
      error_classification: opt.label
    }));

    // Find the preset for this department and root cause
    const matchingPreset = opt.preset || activeTypePresets.find(p => 
      p.root_cause_name.toLowerCase().trim() === opt.label.toLowerCase().trim() &&
      (!p.department || p.department.toLowerCase().trim() === deptKey.toLowerCase().trim())
    ) || activeTypePresets.find(p => p.root_cause_name.toLowerCase().trim() === opt.label.toLowerCase().trim());

    if (matchingPreset) {
      const subIds = matchingPreset.sub_reasons.filter(sr => sr.is_active).map(sr => sr.id);
      setCheckedSubReasonIds(subIds);
      const subNames = matchingPreset.sub_reasons.filter(sr => sr.is_active).map(sr => sr.name);
      setFormData(prev => ({
        ...prev,
        sub_reason: subNames.join('; '),
        details: {
          ...(prev.details || {}),
          checked_sub_reasons: subIds,
          checklist_total_weight_deduction: matchingPreset.weight
        }
      }));
    }
  };

  // Dynamic department buckets strictly derived from Audit Checklists (Presets)
  const activeTypeBuckets = useMemo(() => {
    const buckets: Record<string, {
      label: string;
      icon: any;
      options: {
        id: any;
        code: string;
        label: string;
        isPreset: boolean;
        weight: number;
        subReasonsCount: number;
        preset?: ParsedPreset;
      }[];
    }> = {};

    // 1. If Audit Checklists presets exist for this type, display ONLY presets configured in Audit Checklists
    if (activeTypePresets && activeTypePresets.length > 0) {
      activeTypePresets.forEach((p) => {
        const dept = p.department || 'Operations';
        if (!buckets[dept]) {
          let IconComp = Building2;
          const lower = dept.toLowerCase();
          if (lower.includes('system') || lower.includes('it') || lower.includes('tech')) IconComp = Monitor;
          else if (lower.includes('customer service') || lower.includes('cs') || lower.includes('support')) IconComp = Headphones;
          else if (lower.includes('customer') || lower.includes('client')) IconComp = User;
          else if (lower.includes('sales') || lower.includes('growth')) IconComp = TrendingUp;
          else if (lower.includes('operation') || lower.includes('ops') || lower.includes('fulfillment')) IconComp = Settings;
          else if (lower.includes('finance') || lower.includes('billing') || lower.includes('payment')) IconComp = DollarSign;
          else if (lower.includes('supplier') || lower.includes('vendor')) IconComp = ShieldAlert;
          else if (lower.includes('follow')) IconComp = PhoneCall;

          buckets[dept] = {
            label: dept,
            icon: IconComp,
            options: []
          };
        }

        const existing = buckets[dept].options.find(
          o => o.label.toLowerCase().trim() === p.root_cause_name.toLowerCase().trim()
        );
        if (!existing) {
          buckets[dept].options.push({
            id: p.id,
            code: `PR-${p.id}`,
            label: p.root_cause_name,
            isPreset: true,
            weight: p.weight,
            subReasonsCount: p.sub_reasons.length,
            preset: p
          });
        }
      });
      return buckets;
    }

    // 2. Safe fallback only if no presets are configured
    const fallbackMap = isComplaint 
      ? COMPLAINT_BUCKET_MAP 
      : isDelay 
      ? DELAY_BUCKET_MAP 
      : isRefund 
      ? REFUND_BUCKET_MAP 
      : COMPLAINT_BUCKET_MAP;

    Object.keys(fallbackMap).forEach(k => {
      buckets[k] = {
        label: fallbackMap[k].label,
        icon: fallbackMap[k].icon,
        options: fallbackMap[k].options.map(o => ({ 
          ...o, 
          id: o.code, 
          isPreset: false, 
          weight: 25, 
          subReasonsCount: 0 
        }))
      };
    });

    return buckets;
  }, [activeTypePresets, isComplaint, isDelay, isRefund]);

  // Backward compatibility alias references
  const mergedComplaintBuckets = activeTypeBuckets;
  const mergedDelayBuckets = activeTypeBuckets;
  const mergedRefundBuckets = activeTypeBuckets;

  // Quick Bar for Presets (Removed per user request - redundant with Department Buckets)
  const renderPresetsQuickBar = () => null;

  // Sub-Reasons Checklist Component
  const renderSubReasonsChecklist = (options?: {
    placeholder?: string;
  }) => {
    const matchingPreset = currentSelectedPreset;
    const subList = matchingPreset ? matchingPreset.sub_reasons : [];
    const presetWeight = matchingPreset ? matchingPreset.weight : 25;
    const activeSubs = subList.filter(s => s.is_active);

    const selectedSubs = activeSubs.filter(s => 
      checkedSubReasonIds.includes(s.id) || 
      checkedSubReasonIds.includes(s.name) ||
      (formData.sub_reason && formData.sub_reason.toLowerCase().includes(s.name.toLowerCase()))
    );

    const totalCalculatedDeduction = selectedSubs.reduce(
      (sum, s) => sum + ((s.weight_percentage / 100) * presetWeight), 
      0
    );

    return (
      <div className="pt-5 border-t border-slate-200/80 space-y-4">
        {/* Header Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50 p-4 rounded-2xl border border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-slate-900">
                  Sub-Reasons Checklist (قائمة الأسباب الفرعية)
                </h4>
                {matchingPreset ? (
                  <>
                    <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[11px] font-black rounded-lg border border-indigo-200">
                      Dept: {matchingPreset.department}
                    </span>
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 text-[11px] font-black rounded-lg border border-rose-200">
                      Weight: {presetWeight} pts
                    </span>
                  </>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10.5px] font-bold rounded-md">
                    Dept: {formData.department || formData.bucket_2_area || 'General'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {matchingPreset 
                  ? `Select applicable sub-reasons to calculate point impact and document finding details`
                  : `Enter sub-reason notes below, or link with presets from the Audit Checklists tab`}
              </p>
            </div>
          </div>

          {matchingPreset && activeSubs.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllSubReasons}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Select All</span>
              </button>
              <button
                type="button"
                onClick={handleClearAllSubReasons}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Sub-Reasons Checklist Grid */}
        {matchingPreset && activeSubs.length > 0 ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeSubs.map((sr) => {
                const isChecked = 
                  checkedSubReasonIds.includes(sr.id) || 
                  checkedSubReasonIds.includes(sr.name) ||
                  (formData.sub_reason && formData.sub_reason.toLowerCase().includes(sr.name.toLowerCase()));
                const pointDeduction = ((sr.weight_percentage / 100) * presetWeight).toFixed(1);

                return (
                  <div
                    key={sr.id}
                    onClick={() => handleToggleSubReason(sr, presetWeight)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                      isChecked
                        ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-300 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <div className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded border-2 border-slate-300 bg-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs leading-snug break-words ${isChecked ? 'font-black text-blue-900' : 'font-semibold text-slate-800'}`}>
                          {sr.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-black border ${
                            isChecked ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {sr.weight_percentage}%
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-black border ${
                            isChecked ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            -{pointDeduction} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checklist Live Summary Card */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-600 font-bold">
                <span>Selected Sub-Reasons:</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-black">
                  {selectedSubs.length} of {activeSubs.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-bold">Calculated Point Impact:</span>
                <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded-md font-black shadow-xs">
                  -{totalCalculatedDeduction.toFixed(1)} / {presetWeight} pts
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Sub Reason Notes / Details Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-slate-700 font-bold text-xs">
              Sub Reason & Detailed Root Cause Notes
            </label>
            {matchingPreset && (
              <span className="text-[11px] text-indigo-600 font-medium">
                Auto-populated from Checklist selections
              </span>
            )}
          </div>
          <textarea
            rows={2}
            value={formData.sub_reason}
            onChange={(e) => setFormData({ ...formData, sub_reason: e.target.value })}
            placeholder={options?.placeholder || "Provide specific details about the root cause findings..."}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all shadow-inner resize-none"
          />
        </div>
      </div>
    );
  };

  const content = (
    <div className={`bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex flex-col ${
      isFullPage ? 'w-full shadow-sm min-h-[720px]' : 'w-[96vw] max-w-[1400px] h-[92vh] max-h-[92vh] my-auto shadow-2xl'
    }`}>
      {/* Modal Top Header (Rendered only in modal popup mode) */}
      {!isFullPage && (
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-md">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-800 tracking-tight">Incident Audit & QA Stepper</h2>
                <span className="text-[11px] bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-mono font-bold border border-blue-200">
                  {formData.type.toUpperCase()} AUDIT
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Quality assurance evaluation and root cause classification workflow</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Step {currentStep} of {steps.length}: <strong className="text-slate-800">{steps[currentStep - 1]?.title}</strong></span>
            </div>

            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

        {/* Stepper Navigation Bar */}
        <div className="bg-white px-6 py-3 border-b border-slate-200 overflow-x-auto shrink-0 scrollbar-none">
          <div className="flex items-center justify-between min-w-[850px] gap-2">
            {steps.map((step, idx) => {
              const isCompleted = step.number < currentStep;
              const isActive = step.number === currentStep;

              return (
                <div key={step.number} className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => setCurrentStep(step.number)}
                    className={`flex items-center gap-2 text-left cursor-pointer transition-all ${
                      isActive 
                        ? 'text-blue-600 font-bold scale-102' 
                        : isCompleted 
                        ? 'text-emerald-600 font-semibold' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.number}
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-xs leading-tight font-bold whitespace-nowrap">{step.title}</p>
                      <p className="text-[10px] text-slate-400 font-normal truncate max-w-[100px]">{step.desc}</p>
                    </div>
                  </button>

                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 rounded-full ${
                      isCompleted ? 'bg-emerald-400' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>        {/* Main Body Layout: Render ONLY the section for currentStep */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="w-full max-w-[1320px] mx-auto space-y-6">

            {/* QA Reference & Audit Metadata Card (Created At, Updated At, QA Reference # vs Source Transaction ID) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs">
                {/* QA Reference Number (Internal Quality System) */}
                <div className="flex items-center gap-2.5 bg-blue-50/90 border border-blue-200 px-3.5 py-2 rounded-xl shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    #
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-black tracking-wider text-blue-700 flex items-center gap-1">
                      <span>QA Reference #</span>
                      <span className="text-[9px] font-semibold text-blue-500 lowercase">(QA System)</span>
                    </div>
                    <div className="font-mono font-black text-slate-900 text-xs">
                      {formData.qa_reference_number || 'QA-PENDING'}
                    </div>
                  </div>
                </div>

                {/* Source Transaction ID / Request ID (Sheet or operations module) */}
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    ID
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1">
                      <span>Source ID / Request ID</span>
                      <span className="text-[9px] font-medium text-slate-400 lowercase">(Sheet / Ops)</span>
                    </div>
                    <div className="font-mono font-bold text-slate-800 text-xs">
                      {formData.transaction_id || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Audit / Transaction Date */}
                <div className="flex items-center gap-2 text-slate-600 px-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <div>
                    <span className="text-[10px] block text-slate-400 font-bold uppercase">Audit Date / التاريخ</span>
                    <input
                      type="date"
                      value={formData.request_date ? String(formData.request_date).slice(0, 10) : (formData.survey_date ? String(formData.survey_date).slice(0, 10) : (formData.order_date ? String(formData.order_date).slice(0, 10) : (formData.created_at ? String(formData.created_at).slice(0, 10) : '')))}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-slate-100 hover:bg-white border border-slate-200 hover:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-0.5 outline-none cursor-pointer"
                      title="Select historical or current transaction audit date"
                    />
                  </div>
                </div>

                {/* Updated Date */}
                <div className="flex items-center gap-2 text-slate-600 px-2 border-l border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-[10px] block text-slate-400 font-bold uppercase">Last Update</span>
                    <span className="font-semibold text-slate-700 text-xs">
                      {formData.updated_at ? new Date(formData.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Initial Draft'}
                    </span>
                  </div>
                </div>

                {/* QA Auditor */}
                <div className="flex items-center gap-2 text-slate-600 px-2 border-l border-slate-200">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] block text-slate-400 font-bold uppercase">QA Auditor</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {formData.auditor_name || 'QA Auditor'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Type Pills */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wide">
                  {formData.type}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wide ${
                  formData.qa_status === 'Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  formData.qa_status === 'Fail' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {formData.qa_status || 'Pending'}
                </span>
              </div>
            </div>

            {/* CANCELLATION AUDIT STEPS */}
            {isCancellation ? (
              <>
                {/* Step 1: General Information */}
                {currentStep === 1 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                        1. General Information
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Basic Request Details</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs font-medium">
                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Transaction ID</label>
                        <input
                          type="text"
                          value={formData.transaction_id || ''}
                          onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                          placeholder="e.g. CAN-2026-0001"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Date</label>
                        <input
                          type="date"
                          value={formData.request_date ? String(formData.request_date).slice(0, 10) : (formData.order_date ? String(formData.order_date).slice(0, 10) : '')}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="Owner"
                          value={formData.operations_owner || formData.owner || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            operations_owner: name, 
                            owner: name, 
                            owner_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Select Owner..."
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="Agent Name"
                          value={formData.agent_name || ''}
                          onChange={(name, emp) => setFormData({ 
                            ...formData, 
                            agent_name: name, 
                            agent_id: emp?.id ? String(emp.id) : null 
                          })}
                          employees={employeesList}
                          placeholder="Select Agent..."
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="request_type"
                          label="Request Type"
                          value={formData.request_type || ''}
                          onChange={(val) => setFormData({ ...formData, request_type: val })}
                          defaultOptions={['Visa Application', 'Document Processing', 'Service Booking', 'Order Fulfillment']}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Cancellation Reason</label>
                        <input
                          type="text"
                          value={formData.cancellation_reason || ''}
                          onChange={(e) => setFormData({ ...formData, cancellation_reason: e.target.value })}
                          placeholder="e.g. Customer cancelled due to itinerary changes..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: QA Review */}
                {currentStep === 2 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                        2. QA Review
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Auditor & Validation Check</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
                      <div>
                        <EmployeeSearchSelect
                          label="QA"
                          value={formData.auditor_name || ''}
                          onChange={(name, emp) => setFormData({ 
                            ...formData, 
                            auditor_name: name, 
                            auditor_id: emp?.id ? String(emp.id) : null 
                          })}
                          employees={employeesList}
                          placeholder="Search & select QA Auditor..."
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="qa_status"
                          label="Validation"
                          value={formData.qa_status}
                          onChange={(val) => setFormData({ ...formData, qa_status: val })}
                          defaultOptions={['Pass', 'Fail', 'Pending']}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Cancellation Reason */}
                {currentStep === 3 && (
                  <div className="w-full space-y-6 animate-fadeIn">
                    {/* Main Full-Width Panel: Reason Inputs & Active Error Selection */}
                    <div className="w-full bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 space-y-5 flex flex-col">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
                          3. Cancellation Reason
                        </h3>
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-bold border border-blue-100">
                            {Object.keys(cancellationMap).length} Reasons Available
                          </span>
                          {canManageReasonsErrors && (
                            <button
                              type="button"
                              onClick={() => setShowReasonErrorManager(true)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-blue-300 cursor-pointer shadow-2xs group"
                              title="Open Reason & Error Management Settings"
                            >
                              <Settings className="w-4 h-4 text-blue-600 group-hover:rotate-45 transition-transform duration-300" />
                              <span>Reason & Error Management</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                            <span>Main Reason</span>
                            <span className="text-[10px] text-slate-400 font-normal">Primary Bucket</span>
                          </label>
                          <select
                            value={formData.department}
                            onChange={(e) => {
                              const newDept = e.target.value;
                              const availableErrors = cancellationMap[newDept] || [];
                              setFormData({
                                ...formData,
                                department: newDept,
                                root_cause: availableErrors[0] || '',
                                error_classification: availableErrors[0] || ''
                              });
                              setTargetReasonForNewError(newDept);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm cursor-pointer"
                          >
                            {Object.keys(cancellationMap).length === 0 ? (
                              <option value="">No Reasons (Add one on right)</option>
                            ) : (
                              Object.keys(cancellationMap).map((reasonKey) => (
                                <option key={reasonKey} value={reasonKey}>
                                  {reasonKey} ({cancellationMap[reasonKey]?.length || 0} errors)
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                            <span>Error</span>
                            <span className="text-[10px] text-slate-400 font-normal">Classification</span>
                          </label>
                          <select
                            value={formData.root_cause}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              root_cause: e.target.value,
                              error_classification: e.target.value
                            })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm cursor-pointer"
                          >
                            {(!cancellationMap[formData.department] || cancellationMap[formData.department].length === 0) ? (
                              <option value="">No errors for this reason</option>
                            ) : (
                              cancellationMap[formData.department].map((errOpt) => (
                                <option key={errOpt} value={errOpt}>
                                  {errOpt}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Error Options Radio List */}
                      <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3 flex-1 flex flex-col">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-blue-600" />
                            <span>Error Options for <span className="text-blue-700 font-black">"{formData.department || 'Selected Reason'}"</span></span>
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {(cancellationMap[formData.department] || []).length} options
                          </span>
                        </div>

                        {(!cancellationMap[formData.department] || cancellationMap[formData.department].length === 0) ? (
                          <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-3 my-auto">
                            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                            <div>
                              <p className="text-xs font-bold text-slate-700">No error classifications found for "{formData.department}"</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">Use Reason & Error Management settings to add errors.</p>
                            </div>
                            {canManageReasonsErrors && (
                              <button
                                type="button"
                                onClick={() => setShowReasonErrorManager(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 cursor-pointer transition-all"
                              >
                                <Settings className="w-3.5 h-3.5" />
                                <span>Open Reason & Error Management</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1 overflow-y-auto max-h-[300px] pr-1">
                            {cancellationMap[formData.department].map((errOpt) => {
                              const isSelected = formData.root_cause === errOpt;
                              return (
                                <label
                                  key={errOpt}
                                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="cancellation_error_option"
                                    checked={isSelected}
                                    onChange={() => setFormData({ 
                                      ...formData, 
                                      root_cause: errOpt,
                                      error_classification: errOpt 
                                    })}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0"
                                  />
                                  <span className="leading-tight break-words">{errOpt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Active Summary Footer */}
                      <div className="bg-blue-50/70 border border-blue-200 rounded-xl px-4 py-3 text-xs flex items-center justify-between text-blue-900">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="truncate">
                            Current Selection: <strong className="font-black text-blue-950">{formData.department || 'None'}</strong> &rarr; <strong className="font-black text-blue-950">{formData.root_cause || 'None'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Sub-Reasons Checklist & Notes */}
                      {renderSubReasonsChecklist({
                        placeholder: "Provide specific details on why the request was cancelled..."
                      })}
                    </div>

                    {/* Reason & Error Management Modal */}
                    {showReasonErrorManager && (
                      <div 
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
                        onClick={() => setShowReasonErrorManager(false)}
                      >
                        <div 
                          className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                <Layers className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                                  Reason & Error Management
                                </h3>
                                <p className="text-xs text-slate-400 font-medium">Add, rename, or delete Main Reasons and Errors</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleResetCancellationDefaults}
                                title="Reset to default reasons & errors"
                                className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 hover:bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Reset Defaults</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowReasonErrorManager(false)}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer"
                                title="Close"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-6 overflow-y-auto space-y-4 flex-1">

                      {/* Add Controls Card */}
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-3">
                        {/* 1. Add New Main Reason */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                            <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
                            <span>Add New Main Reason</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newMainReasonInput}
                              onChange={(e) => setNewMainReasonInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddMainReason();
                                }
                              }}
                              placeholder="e.g. Documentation, SLA Breach, Refund Policy..."
                              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={handleAddMainReason}
                              disabled={!newMainReasonInput.trim()}
                              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Reason</span>
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-slate-200/80 my-1" />

                        {/* 2. Add New Error to Selected Reason */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                            <span className="flex items-center gap-1.5">
                              <ListPlus className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Add Error Classification</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Under: <strong className="text-slate-700 font-bold">{targetReasonForNewError || formData.department || Object.keys(cancellationMap)[0] || 'Selected'}</strong>
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                            <div className="sm:col-span-4">
                              <select
                                value={targetReasonForNewError || formData.department || Object.keys(cancellationMap)[0] || ''}
                                onChange={(e) => setTargetReasonForNewError(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {Object.keys(cancellationMap).map(k => (
                                  <option key={k} value={k}>{k}</option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-5">
                              <input
                                type="text"
                                value={newErrorInput}
                                onChange={(e) => setNewErrorInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddErrorToReason(targetReasonForNewError || formData.department);
                                  }
                                }}
                                placeholder="e.g. Call Not Logged, Promised 24h..."
                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="sm:col-span-3">
                              <button
                                type="button"
                                onClick={() => handleAddErrorToReason(targetReasonForNewError || formData.department)}
                                disabled={!newErrorInput.trim()}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1 shadow-sm transition-all shrink-0 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Error</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive List of Reasons & Errors */}
                      <div className="flex-1 overflow-y-auto max-h-[340px] space-y-3 pr-1">
                        {Object.keys(cancellationMap).length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-xs">
                            No reasons defined yet. Use the box above to add your first reason.
                          </div>
                        ) : (
                          Object.entries(cancellationMap).map(([reasonName, errors]) => {
                            const isCurrentDept = formData.department === reasonName;
                            const isEditingThisReason = editingReasonKey === reasonName;

                            return (
                              <div
                                key={reasonName}
                                className={`rounded-xl border transition-all ${
                                  isCurrentDept 
                                    ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-300 shadow-sm' 
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {/* Reason Header Bar */}
                                <div className="p-3 flex items-center justify-between border-b border-slate-100">
                                  {isEditingThisReason ? (
                                    <div className="flex items-center gap-2 flex-1 mr-2">
                                      <input
                                        type="text"
                                        value={editingReasonValue}
                                        onChange={(e) => setEditingReasonValue(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveEditMainReason(reasonName);
                                          if (e.key === 'Escape') setEditingReasonKey(null);
                                        }}
                                        autoFocus
                                        className="bg-white border border-blue-500 rounded px-2 py-1 text-xs font-bold text-slate-800 w-full focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveEditMainReason(reasonName)}
                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                        title="Save name"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingReasonKey(null)}
                                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                        title="Cancel"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const firstErr = errors[0] || '';
                                          setFormData({
                                            ...formData,
                                            department: reasonName,
                                            root_cause: firstErr,
                                            error_classification: firstErr
                                          });
                                          setTargetReasonForNewError(reasonName);
                                        }}
                                        className="text-left font-bold text-xs text-slate-800 hover:text-blue-600 flex items-center gap-2 cursor-pointer group"
                                      >
                                        <span>{reasonName}</span>
                                        {isCurrentDept && (
                                          <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                                            Active in Form
                                          </span>
                                        )}
                                      </button>
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        ({errors.length} errors)
                                      </span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1 shrink-0">
                                    {!isCurrentDept && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const firstErr = errors[0] || '';
                                          setFormData({
                                            ...formData,
                                            department: reasonName,
                                            root_cause: firstErr,
                                            error_classification: firstErr
                                          });
                                          setTargetReasonForNewError(reasonName);
                                        }}
                                        className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-all"
                                      >
                                        Select
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingReasonKey(reasonName);
                                        setEditingReasonValue(reasonName);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                      title="Rename reason"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMainReason(reasonName)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                      title="Delete main reason"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Errors List under this reason */}
                                <div className="p-3 space-y-2 bg-slate-50/50">
                                  {errors.length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">No errors in this category yet.</p>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5">
                                      {errors.map((errItem) => {
                                        const isErrSelected = isCurrentDept && formData.root_cause === errItem;
                                        const isEditingThisError = editingErrorKey?.reason === reasonName && editingErrorKey?.oldError === errItem;

                                        if (isEditingThisError) {
                                          return (
                                            <div key={errItem} className="flex items-center gap-1 bg-white border border-blue-500 rounded-lg px-2 py-1 shadow-sm">
                                              <input
                                                type="text"
                                                value={editingErrorValue}
                                                onChange={(e) => setEditingErrorValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') handleSaveEditError(reasonName, errItem);
                                                  if (e.key === 'Escape') setEditingErrorKey(null);
                                                }}
                                                autoFocus
                                                className="text-xs font-semibold text-slate-800 outline-none w-36"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => handleSaveEditError(reasonName, errItem)}
                                                className="text-emerald-600 hover:bg-emerald-50 p-0.5 rounded"
                                              >
                                                <Check className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingErrorKey(null)}
                                                className="text-slate-400 hover:bg-slate-100 p-0.5 rounded"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div
                                            key={errItem}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                              isErrSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                                            }`}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setFormData({
                                                  ...formData,
                                                  department: reasonName,
                                                  root_cause: errItem,
                                                  error_classification: errItem
                                                });
                                                setTargetReasonForNewError(reasonName);
                                              }}
                                              className="text-left truncate max-w-[200px] cursor-pointer"
                                              title={`Select "${errItem}" in form`}
                                            >
                                              {errItem}
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingErrorKey({ reason: reasonName, oldError: errItem });
                                                setEditingErrorValue(errItem);
                                              }}
                                              className={`p-0.5 rounded hover:bg-black/10 ${
                                                isErrSelected ? 'text-blue-100 hover:text-white' : 'text-slate-400 hover:text-blue-600'
                                              }`}
                                              title="Rename error"
                                            >
                                              <Edit3 className="w-3 h-3" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => handleDeleteError(reasonName, errItem)}
                                              className={`p-0.5 rounded hover:bg-black/10 ${
                                                isErrSelected ? 'text-blue-100 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                                              }`}
                                              title="Delete error"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Inline Quick Add Error */}
                                  {inlineAddErrorReason === reasonName ? (
                                    <div className="flex items-center gap-2 pt-1">
                                      <input
                                        type="text"
                                        value={inlineAddErrorText}
                                        onChange={(e) => setInlineAddErrorText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddErrorToReason(reasonName, inlineAddErrorText);
                                            setInlineAddErrorText('');
                                            setInlineAddErrorReason(null);
                                          }
                                          if (e.key === 'Escape') {
                                            setInlineAddErrorReason(null);
                                            setInlineAddErrorText('');
                                          }
                                        }}
                                        autoFocus
                                        placeholder={`Add new error to ${reasonName}...`}
                                        className="flex-1 bg-white border border-blue-400 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          handleAddErrorToReason(reasonName, inlineAddErrorText);
                                          setInlineAddErrorText('');
                                          setInlineAddErrorReason(null);
                                        }}
                                        disabled={!inlineAddErrorText.trim()}
                                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
                                      >
                                        Add
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setInlineAddErrorReason(null);
                                          setInlineAddErrorText('');
                                        }}
                                        className="text-slate-400 hover:text-slate-600 text-xs px-1"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setInlineAddErrorReason(reasonName);
                                        setInlineAddErrorText('');
                                      }}
                                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline pt-0.5 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add error to {reasonName}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        Changes are auto-saved to your browser.
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowReasonErrorManager(false)}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

                {/* Step 4: Cancellation Details */}
                {currentStep === 4 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">4</span>
                        4. Cancellation Details
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Documents Accuracy, Price & Comments</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs font-medium">
                      {/* Documents Accuracy */}
                      <div className="md:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block font-bold text-slate-700 mb-3">Documents Accuracy</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="cancellation_docs_accuracy"
                              checked={formData.switches.document_accuracy === true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, document_accuracy: true } })}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Yes</span>
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="cancellation_docs_accuracy"
                              checked={formData.switches.document_accuracy === false}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, document_accuracy: false } })}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="md:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block font-bold text-slate-700 mb-2">Price</label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            value={formData.order_amount}
                            onChange={(e) => setFormData({ ...formData, order_amount: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-14 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <span className="absolute right-3 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            EGP
                          </span>
                        </div>
                      </div>

                      {/* Comments */}
                      <div className="md:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <label className="font-bold text-slate-700">Comments</label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(formData.comment || '').length} / 500
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={500}
                          value={formData.comment}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                          placeholder="Enter comments..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Review & Close */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">5</span>
                          5. Review & Close
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Manager Review & Status</span>
                      </div>

                    <div className="space-y-4 text-xs font-medium">
                      {/* Action Required Multi-Select */}
                      <div>
                        <ActionRequiredMultiSelect
                          value={formData.action_required || []}
                          onChange={(selected) => setFormData({ 
                            ...formData, 
                            action_required: selected.length > 0 ? JSON.stringify(selected) : '' 
                          })}
                          onAutoPlanTypeChange={(suggestedType) => setFormData(prev => ({
                            ...prev,
                            action_plan_type: suggestedType,
                            action_plan_required: true
                          }))}
                          label="Action Required"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <EmployeeSearchSelect
                            label="Manager Review"
                            value={formData.assigned_manager || ''}
                            onChange={(name, emp) => setFormData(prev => ({ 
                              ...prev, 
                              assigned_manager: name, 
                              reviewer_id: emp?.id ? String(emp.id) : null 
                            }))}
                            employees={employeesList}
                            placeholder="Search & select Manager..."
                          />
                        </div>

                        <div>
                          <ManageableSelect
                            fieldKey="manager_approval"
                            label="Status"
                            value={formData.manager_approval}
                            onChange={(val) => setFormData({ ...formData, manager_approval: val })}
                            defaultOptions={['Pending', 'Approved', 'Rejected']}
                          />
                        </div>
                      </div>

                      {/* Flag for Action Plan Section */}
                      <div className="pt-4 border-t border-slate-200">
                        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 border border-blue-200 rounded-2xl p-4.5 space-y-3 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <Zap className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900 tracking-tight">
                                  Action Plan Routing & Remediation
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  Flag this cancellation to automatically sync selected actions into the Action Plans workspace
                                </p>
                              </div>
                            </div>

                            <label className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs cursor-pointer select-none self-start sm:self-auto">
                              <input
                                type="checkbox"
                                checked={formData.action_plan_required === true}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  action_plan_required: e.target.checked,
                                  action_plan_type: formData.action_plan_type || 'Training Action'
                                })}
                                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-xs font-black text-blue-800">Flag for Action Plan</span>
                            </label>
                          </div>

                          {formData.action_plan_required && (
                            <div className="space-y-2 pt-1 animate-fadeIn">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">Choose Action Plan Category:</label>
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full">
                                  Auto-Routes to Action Plans Workspace
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                  {
                                    id: 'Training Action',
                                    title: 'Training Action',
                                    subtitle: 'Targeted Retraining, 1:1 Coaching & Assessment',
                                    icon: GraduationCap,
                                    badge: 'Knowledge & Skill'
                                  },
                                  {
                                    id: 'HR Action',
                                    title: 'HR Action',
                                    subtitle: 'Policy Compliance, Conduct & Performance Review',
                                    icon: Users,
                                    badge: 'HR & Governance'
                                  },
                                  {
                                    id: 'Quality Action',
                                    title: 'Quality Action',
                                    subtitle: 'Quality CAPA, 5-Whys Analysis & SOP Update',
                                    icon: ShieldAlert,
                                    badge: 'Process & QA'
                                  }
                                ].map((card) => {
                                  const isSelected = (formData.action_plan_type || 'Training Action') === card.id;
                                  const IconComp = card.icon;
                                  return (
                                    <button
                                      key={card.id}
                                      type="button"
                                      onClick={() => setFormData({ ...formData, action_plan_type: card.id })}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                        isSelected
                                          ? 'bg-white border-blue-600 ring-2 ring-blue-500/30 shadow-sm'
                                          : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                          }`}>
                                            <IconComp className="w-3.5 h-3.5" />
                                          </div>
                                          <span className="text-xs font-black text-slate-900 leading-none">{card.title}</span>
                                        </div>
                                        <input
                                          type="radio"
                                          name="action_plan_type_radio_cancellation"
                                          checked={isSelected}
                                          onChange={() => setFormData({ ...formData, action_plan_type: card.id })}
                                          className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                                        />
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{card.subtitle}</p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Executive Audit & Forward Action Summary Card */}
                  <AuditExecutiveSummary
                    formData={formData}
                    type="cancellation"
                    currentSelectedPreset={currentSelectedPreset}
                    checkedSubReasonIds={checkedSubReasonIds}
                  />
                </div>
                )}
              </>
            ) : isRefund ? (
              <>
                {/* REFUND AUDIT STEPS */}
                {/* Step 1: General Info */}
                {currentStep === 1 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                        1. General Information
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Refund Request Identifiers, Reasons & Owner</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 text-xs font-medium">
                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Request ID</label>
                        <input
                          type="text"
                          value={formData.transaction_id || ''}
                          onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                          placeholder="e.g. RF-2026-0001"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Request Date</label>
                        <input
                          type="date"
                          value={formData.request_date ? String(formData.request_date).slice(0, 10) : (formData.order_date ? String(formData.order_date).slice(0, 10) : '')}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Customer Name</label>
                        <input
                          type="text"
                          value={formData.customer_name || ''}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          placeholder="Customer name..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="Owner Name"
                          value={formData.operations_owner || formData.owner || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            operations_owner: name, 
                            owner: name, 
                            owner_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Select Owner..."
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="Agent Name"
                          value={formData.agent_name || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            agent_name: name, 
                            agent_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select Agent..."
                        />
                      </div>
                    </div>

                    {/* New Refund Reason & Refund Sub Reason text inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100 text-xs font-medium">
                      <div>
                        <label className="block text-slate-700 font-bold mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-blue-900">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            Refund Reason
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">سبب الاسترداد الرئيسي</span>
                        </label>
                        <input
                          type="text"
                          value={formData.refund_reason || ''}
                          onChange={(e) => setFormData({ ...formData, refund_reason: e.target.value })}
                          placeholder="e.g. Defective Item / Avoidable Service Breach"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-blue-900">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            Refund Sub Reason
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">السبب الفرعي للاسترداد</span>
                        </label>
                        <input
                          type="text"
                          value={formData.refund_sub_reason || ''}
                          onChange={(e) => setFormData({ ...formData, refund_sub_reason: e.target.value })}
                          placeholder="e.g. Specification Mismatch / Timeline Exceeded"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Validation */}
                {currentStep === 2 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                        2. QA & Validation Check
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Auditor Identification & Audit Status</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
                      <div>
                        <EmployeeSearchSelect
                          label="QA"
                          value={formData.auditor_name || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            auditor_name: name, 
                            auditor_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select QA Auditor..."
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="qa_status"
                          label="Validation"
                          value={formData.qa_status}
                          onChange={(val) => setFormData({ ...formData, qa_status: val })}
                          defaultOptions={['Pass', 'Fail', 'Pending']}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Classification */}
                {currentStep === 3 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
                        3. Classification & Root Cause
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Select Department Bucket & Root Cause Code</span>
                    </div>

                    {/* Bucket Matrix Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-1">
                      {Object.entries(activeTypeBuckets).map(([bKey, bucket]) => {
                        const isActiveBucket = (formData.department || '').toLowerCase().trim() === bKey.toLowerCase().trim();

                        return (
                          <div 
                            key={bKey} 
                            className={`p-3.5 rounded-2xl border text-xs space-y-3 transition-all ${
                              isActiveBucket ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-200 shadow-sm' : 'bg-slate-50/60 border-slate-200'
                            }`}
                          >
                            <p className={`font-black text-center border-b pb-2 text-[11px] leading-tight break-words min-h-[32px] flex items-center justify-center gap-1.5 ${
                              isActiveBucket ? 'text-blue-800 border-blue-200' : 'text-slate-700 border-slate-200'
                            }`}>
                              {bucket.icon && React.createElement(bucket.icon, { className: "w-3.5 h-3.5 shrink-0" })}
                              <span>{bucket.label}</span>
                            </p>

                            <div className="space-y-2 pt-1">
                              {bucket.options.map((opt) => {
                                const isChecked = Boolean(
                                  formData.root_cause &&
                                  formData.department &&
                                  formData.department.toLowerCase().trim() === bKey.toLowerCase().trim() &&
                                  (
                                    formData.root_cause.toLowerCase().trim() === opt.label.toLowerCase().trim() ||
                                    formData.root_cause === opt.code
                                  )
                                );

                                return (
                                  <label 
                                    key={opt.code || opt.label} 
                                    onClick={() => handleSelectRootCause(bKey, opt)}
                                    className={`flex items-start gap-2 p-2 rounded-xl cursor-pointer transition-all border ${
                                      isChecked 
                                        ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-300' 
                                        : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`refund_rc_${bKey}_${opt.code || opt.label}`}
                                      checked={isChecked}
                                      onChange={() => handleSelectRootCause(bKey, opt)}
                                      className="w-3.5 h-3.5 mt-0.5 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className={`leading-snug text-[10.5px] break-words ${isChecked ? 'font-black text-blue-700' : 'font-semibold text-slate-700 group-hover:text-slate-900'}`}>
                                        {opt.label}
                                      </span>
                                      {opt.isPreset && (
                                        <span className="text-[9.5px] text-blue-600 font-bold mt-0.5">
                                          {opt.subReasonsCount || 0} checklist items ({opt.weight} pts)
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sub-Reasons Checklist & Notes */}
                    {renderSubReasonsChecklist({
                      placeholder: "Provide specific details about the refund root cause..."
                    })}
                  </div>
                )}

                {/* Step 4: Refund Details */}
                {currentStep === 4 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">4</span>
                        4. Refund Details & Financial Deductions
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Refund Amount, Error Switches & Lose on Employee</span>
                    </div>

                    {/* Amount & Main Switches Grid (B1 and B2 removed) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs font-medium">
                      {/* Refund Amount */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block font-bold text-slate-700 mb-2">Refund Amount (EGP)</label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            value={formData.refund_amount}
                            onChange={(e) => setFormData({ ...formData, refund_amount: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-4 pr-14 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <span className="absolute right-3 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            EGP
                          </span>
                        </div>
                      </div>

                      {/* Avoidable Refund */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block font-bold text-slate-700 mb-3">Avoidable Refund</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="avoidable_refund"
                              checked={formData.switches.avoidable_refund === true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, avoidable_refund: true } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="avoidable_refund"
                              checked={formData.switches.avoidable_refund !== true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, avoidable_refund: false } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>

                      {/* Over Promise */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block font-bold text-slate-700 mb-3">Over Promise</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="refund_over_promise"
                              checked={formData.switches.over_promise === true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, over_promise: true } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="refund_over_promise"
                              checked={formData.switches.over_promise !== true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, over_promise: false } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>

                      {/* Document Accuracy */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 sm:col-span-1 lg:col-span-1">
                        <label className="block font-bold text-slate-700 mb-3">Document Accuracy</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="refund_docs_accuracy"
                              checked={formData.switches.document_accuracy === true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, document_accuracy: true } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="refund_docs_accuracy"
                              checked={formData.switches.document_accuracy !== true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, document_accuracy: false } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>

                      {/* Handled Field - Linked to Employees Directory */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 sm:col-span-1 lg:col-span-2">
                        <EmployeeSearchSelect
                          label="Handled"
                          value={formData.handled_by || formData.details?.handled_by || ''}
                          onChange={(val) => {
                            setFormData({
                              ...formData,
                              handled_by: val,
                              details: {
                                ...formData.details,
                                handled_by: val
                              }
                            });
                          }}
                          employees={employeesList}
                          placeholder="Select handling employee..."
                        />
                      </div>
                    </div>

                    {/* Lose on Employee Section (تحميل الخسارة على الموظف) */}
                    <div className="bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-slate-50 border border-amber-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                            <UserMinus className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
                              Lose on Employee
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                                خصم / تحميل خسارة على موظف
                              </span>
                            </h4>
                            <p className="text-[11px] text-amber-800/80 font-medium">
                              تحديد الموظف المتسبب وقيمة الخسارة لنقلها تلقائياً إلى سجل الجزاءات في موديول HR
                            </p>
                          </div>
                        </div>

                        {/* Enable / Disable toggle */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, lose_on_employee: !prev.lose_on_employee }))}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              formData.lose_on_employee ? 'bg-amber-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                formData.lose_on_employee ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-bold ${formData.lose_on_employee ? 'text-amber-900' : 'text-slate-500'}`}>
                            {formData.lose_on_employee ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      {formData.lose_on_employee && (
                        <div className="space-y-4 pt-1 animate-fadeIn">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
                            {/* Employee Name dropdown linked to HR Management */}
                            <div>
                              <label className="block text-slate-700 font-bold mb-2 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-amber-600" />
                                Employee Name (HR Linked)
                              </label>
                              <EmployeeSearchSelect
                                value={formData.lose_employee_name || formData.lose_employee_id || ''}
                                onChange={(name, emp) => {
                                  setFormData({
                                    ...formData,
                                    lose_employee_id: emp ? String(emp.id) : name,
                                    lose_employee_name: name
                                  });
                                }}
                                employees={employeesList}
                                placeholder="Search employee from HR Directory..."
                              />
                            </div>

                            {/* Lose Status (Accepted / Rejected) */}
                            <div>
                              <label className="block text-slate-700 font-bold mb-2 flex items-center gap-1.5">
                                <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                                Status
                              </label>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, lose_status: 'Accepted' })}
                                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                                    formData.lose_status === 'Accepted'
                                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Accepted (قبول)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, lose_status: 'Rejected' })}
                                  className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                                    formData.lose_status === 'Rejected'
                                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-300'
                                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  Rejected (رفض)
                                </button>
                              </div>
                            </div>

                            {/* Lose Amount (EGP) */}
                            <div>
                              <label className="block text-slate-700 font-bold mb-2 flex items-center gap-1.5">
                                <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                                Lose Amount (EGP)
                              </label>
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  value={formData.lose_amount !== undefined ? formData.lose_amount : ''}
                                  onChange={(e) => setFormData({ ...formData, lose_amount: parseFloat(e.target.value) || 0 })}
                                  placeholder="0.00"
                                  className="w-full bg-white border border-amber-200 rounded-xl pl-3.5 pr-14 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 text-xs"
                                />
                                <span className="absolute right-2.5 text-[11px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                                  EGP
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Info Banner linking to HR Employee File */}
                          <div className="bg-amber-100/70 border border-amber-300/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
                            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div className="text-[11px] leading-relaxed">
                              <span className="font-bold">تكامل آلي مع شؤون الموظفين (HR Management):</span> عند حفظ الـ Audit بحالة <strong className="underline">Accepted</strong>، سيتم ترحيل مبلغ الخصم (<strong>{formData.lose_amount || 0} EGP</strong>) مباشرة إلى <strong>Employee File</strong> الخاص بالموظف داخل سيكشن <strong>Penalty History & Issues</strong> في تابة <strong>Job</strong>.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Comments Textarea */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-bold text-slate-700 text-xs">Comments</label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {(formData.comment || '').length} / 500
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        placeholder="Enter refund audit comments..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Step 5: Review & Close */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">5</span>
                          5. Review & Close
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Corrective Action & Manager Review</span>
                      </div>

                    <div className="space-y-4 text-xs font-medium">
                      {/* Action Required Multi-Select */}
                      <div>
                        <ActionRequiredMultiSelect
                          value={formData.action_required || []}
                          onChange={(selected) => setFormData({ 
                            ...formData, 
                            action_required: selected.length > 0 ? JSON.stringify(selected) : '' 
                          })}
                          onAutoPlanTypeChange={(suggestedType) => setFormData(prev => ({
                            ...prev,
                            action_plan_type: suggestedType,
                            action_plan_required: true
                          }))}
                          label="Action Required"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-2">Corrective Action</label>
                        <textarea
                          rows={3}
                          value={formData.corrective_action}
                          onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                          placeholder="Agent re-trained on SLA policies and ticket assignment process..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <EmployeeSearchSelect
                            label="Manager Review"
                            value={formData.assigned_manager || ''}
                            onChange={(name, emp) => setFormData(prev => ({ 
                              ...prev, 
                              assigned_manager: name, 
                              reviewer_id: emp?.id ? String(emp.id) : null 
                            }))}
                            employees={employeesList}
                            placeholder="Search & select Manager..."
                          />
                        </div>

                        <div>
                          <ManageableSelect
                            fieldKey="manager_approval"
                            label="Status"
                            value={formData.manager_approval}
                            onChange={(val) => setFormData({ ...formData, manager_approval: val })}
                            defaultOptions={['Pending', 'Approved', 'Rejected']}
                          />
                        </div>
                      </div>

                      {/* Flag for Action Plan Section */}
                      <div className="pt-4 border-t border-slate-200">
                        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 border border-blue-200 rounded-2xl p-4.5 space-y-3 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <Zap className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900 tracking-tight">
                                  Action Plan Routing & Remediation
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  Flag this refund incident to automatically sync selected actions into the Action Plans workspace
                                </p>
                              </div>
                            </div>

                            <label className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs cursor-pointer select-none self-start sm:self-auto">
                              <input
                                type="checkbox"
                                checked={formData.action_plan_required === true}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  action_plan_required: e.target.checked,
                                  action_plan_type: formData.action_plan_type || 'Quality Action'
                                })}
                                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-xs font-black text-blue-800">Flag for Action Plan</span>
                            </label>
                          </div>

                          {formData.action_plan_required && (
                            <div className="space-y-2 pt-1 animate-fadeIn">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">Choose Action Plan Category:</label>
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full">
                                  Auto-Routes to Action Plans Workspace
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                  {
                                    id: 'Training Action',
                                    title: 'Training Action',
                                    subtitle: 'Targeted Retraining, 1:1 Coaching & Assessment',
                                    icon: GraduationCap,
                                    badge: 'Knowledge & Skill'
                                  },
                                  {
                                    id: 'HR Action',
                                    title: 'HR Action',
                                    subtitle: 'Policy Compliance, Conduct & Performance Review',
                                    icon: Users,
                                    badge: 'HR & Governance'
                                  },
                                  {
                                    id: 'Quality Action',
                                    title: 'Quality Action',
                                    subtitle: 'Quality CAPA, 5-Whys Analysis & SOP Update',
                                    icon: ShieldAlert,
                                    badge: 'Process & QA'
                                  }
                                ].map((card) => {
                                  const isSelected = (formData.action_plan_type || 'Quality Action') === card.id;
                                  const IconComp = card.icon;
                                  return (
                                    <button
                                      key={card.id}
                                      type="button"
                                      onClick={() => setFormData({ ...formData, action_plan_type: card.id })}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                        isSelected
                                          ? 'bg-white border-blue-600 ring-2 ring-blue-500/30 shadow-sm'
                                          : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                          }`}>
                                            <IconComp className="w-3.5 h-3.5" />
                                          </div>
                                          <span className="text-xs font-black text-slate-900 leading-none">{card.title}</span>
                                        </div>
                                        <input
                                          type="radio"
                                          name="action_plan_type_radio_refund"
                                          checked={isSelected}
                                          onChange={() => setFormData({ ...formData, action_plan_type: card.id })}
                                          className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                                        />
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{card.subtitle}</p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Executive Audit & Forward Action Summary Card */}
                  <AuditExecutiveSummary
                    formData={formData}
                    type="refund"
                    currentSelectedPreset={currentSelectedPreset}
                    checkedSubReasonIds={checkedSubReasonIds}
                  />
                </div>
                )}
              </>
            ) : isNps ? (
              <>
                {/* LOG CUSTOMER NPS / CSAT FEEDBACK STEPS */}
                
                {/* Step 1: General Information */}
                {currentStep === 1 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                        1. General Information
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Basic Request Details & Survey Identifiers</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs font-medium">
                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Survey Date</label>
                        <input
                          type="date"
                          value={formData.survey_date ? String(formData.survey_date).slice(0, 10) : (formData.request_date ? String(formData.request_date).slice(0, 10) : (formData.order_date ? String(formData.order_date).slice(0, 10) : ''))}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Transaction ID</label>
                        <input
                          type="text"
                          value={formData.transaction_id || ''}
                          onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                          placeholder="e.g. TRX-2026-0001"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Customer Phone</label>
                        <input
                          type="text"
                          value={formData.customer_phone || ''}
                          onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                          placeholder="Customer phone..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="department"
                          label="Department"
                          value={formData.department || ''}
                          onChange={(val) => setFormData({ ...formData, department: val })}
                          defaultOptions={['Customer Service', 'Operations', 'Sales', 'Finance', 'System', 'Supplier']}
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="Owner"
                          value={formData.operations_owner || formData.owner || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            operations_owner: name, 
                            owner: name, 
                            owner_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select Owner..."
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="Agent Name"
                          value={formData.agent_name || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            agent_name: name, 
                            agent_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select Agent..."
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="QA Auditor"
                          value={formData.auditor_name || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            auditor_name: name, 
                            auditor_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select QA Auditor..."
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="request_type"
                          label="Request Type"
                          value={formData.request_type || ''}
                          onChange={(val) => setFormData({ ...formData, request_type: val })}
                          defaultOptions={['Visa Application', 'Document Processing', 'Service Booking', 'Order Fulfillment']}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: NPS Score */}
                {currentStep === 2 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                        2. NPS Score
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Customer Rating Score & Category Mapping</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <div>
                        <label className="block text-slate-700 font-extrabold mb-2 text-xs">Score (0 - 10)</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={formData.rating ?? 8}
                          onChange={(e) => {
                            const val = Math.min(10, Math.max(0, parseInt(e.target.value) || 0));
                            const cat = val >= 9 ? 'Promoter' : val >= 7 ? 'Passive' : 'Detractor';
                            setFormData({ ...formData, rating: val, category: cat });
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 font-black text-slate-900 text-xl focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-extrabold mb-2 text-xs">Category</label>
                        <div className="flex items-center">
                          {(formData.rating ?? 8) >= 9 ? (
                            <span className="px-4 py-2.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-sm flex items-center gap-2 shadow-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Promoter (9 - 10)
                            </span>
                          ) : (formData.rating ?? 8) >= 7 ? (
                            <span className="px-4 py-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 font-black text-sm flex items-center gap-2 shadow-sm">
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                              Passive (7 - 8)
                            </span>
                          ) : (
                            <span className="px-4 py-2.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 font-black text-sm flex items-center gap-2 shadow-sm">
                              <XCircle className="w-4 h-4 text-rose-600" />
                              Detractor (0 - 6)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Interactive Rating Scale Buttons */}
                    <div className="space-y-3">
                      <label className="block text-xs font-extrabold text-slate-700">Select Score Scale</label>
                      <div className="grid grid-cols-11 gap-1.5 sm:gap-2">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                          const isSelected = (formData.rating ?? 8) === score;
                          const isDetractor = score <= 6;
                          const isPassive = score === 7 || score === 8;
                          const isPromoter = score >= 9;

                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() => {
                                const cat = score >= 9 ? 'Promoter' : score >= 7 ? 'Passive' : 'Detractor';
                                setFormData({ ...formData, rating: score, category: cat });
                              }}
                              className={`py-3 rounded-xl font-black text-xs transition-all cursor-pointer flex flex-col items-center justify-center border ${
                                isSelected
                                  ? isPromoter
                                    ? 'bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-200 scale-105 shadow-md'
                                    : isPassive
                                    ? 'bg-amber-500 text-white border-amber-600 ring-4 ring-amber-200 scale-105 shadow-md'
                                    : 'bg-rose-600 text-white border-rose-700 ring-4 ring-rose-200 scale-105 shadow-md'
                                  : isPromoter
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                  : isPassive
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                              }`}
                            >
                              <span>{score}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Visual Gradient Bar Indicator */}
                      <div className="relative pt-2">
                        <div className="h-3 w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 flex overflow-hidden">
                          <div className="w-[63.6%] border-r border-white/40"></div>
                          <div className="w-[18.2%] border-r border-white/40"></div>
                          <div className="w-[18.2%]"></div>
                        </div>

                        <div className="flex justify-between text-[10px] font-extrabold mt-1.5 px-1">
                          <span className="text-rose-600 uppercase tracking-wider">0 - 6 Detractor</span>
                          <span className="text-amber-600 uppercase tracking-wider">7 - 8 Passive</span>
                          <span className="text-emerald-600 uppercase tracking-wider">9 - 10 Promoter</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Root Cause Classification */}
                {currentStep === 3 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
                        3. Root Cause Classification
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Select Department & Root Cause from Audit Checklists</span>
                    </div>

                    {/* Root Cause Dynamic Matrix Grid from Audit Checklists */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-1">
                      {Object.entries(activeTypeBuckets).map(([bKey, bucket]) => {
                        const isActiveBucket = (formData.department || '').toLowerCase().trim() === bKey.toLowerCase().trim();

                        return (
                          <div 
                            key={bKey} 
                            className={`p-3.5 rounded-2xl border text-xs space-y-3 transition-all ${
                              isActiveBucket ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-200 shadow-sm' : 'bg-slate-50/60 border-slate-200'
                            }`}
                          >
                            <p className={`font-black text-center border-b pb-2 text-[11px] leading-tight break-words min-h-[32px] flex items-center justify-center gap-1.5 ${
                              isActiveBucket ? 'text-blue-800 border-blue-200' : 'text-slate-700 border-slate-200'
                            }`}>
                              {bucket.icon && React.createElement(bucket.icon, { className: "w-3.5 h-3.5 shrink-0" })}
                              <span>{bucket.label}</span>
                            </p>

                            <div className="space-y-2 pt-1">
                              {bucket.options.map((opt) => {
                                const isChecked = Boolean(
                                  formData.root_cause &&
                                  formData.department &&
                                  formData.department.toLowerCase().trim() === bKey.toLowerCase().trim() &&
                                  (
                                    formData.root_cause.toLowerCase().trim() === opt.label.toLowerCase().trim() ||
                                    formData.root_cause === opt.code
                                  )
                                );

                                return (
                                  <label 
                                    key={opt.code || opt.label} 
                                    onClick={() => handleSelectRootCause(bKey, opt)}
                                    className={`flex items-start gap-2 p-2 rounded-xl cursor-pointer transition-all border ${
                                      isChecked 
                                        ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-300' 
                                        : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`nps_rc_${bKey}_${opt.code || opt.label}`}
                                      checked={isChecked}
                                      onChange={() => handleSelectRootCause(bKey, opt)}
                                      className="w-3.5 h-3.5 mt-0.5 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className={`leading-snug text-[10.5px] break-words ${isChecked ? 'font-black text-blue-700' : 'font-semibold text-slate-700 group-hover:text-slate-900'}`}>
                                        {opt.label}
                                      </span>
                                      {opt.isPreset && (
                                        <span className="text-[9.5px] text-blue-600 font-bold mt-0.5">
                                          {opt.subReasonsCount || 0} checklist items ({opt.weight} pts)
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sub-Reasons Checklist & Notes */}
                    {renderSubReasonsChecklist({
                      placeholder: "Provide specific details about customer feedback root causes and findings..."
                    })}
                  </div>
                )}

                {/* Step 4: Customer Feedback */}
                {currentStep === 4 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">4</span>
                        4. Customer Feedback
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Verbal Feedback & Recommended Action</span>
                    </div>

                    <div className="space-y-4 text-xs font-medium">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-slate-700 font-bold">Customer Comment</label>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {(formData.comment || '').length} / 500
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          maxLength={500}
                          value={formData.comment || ''}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                          placeholder="Type customer's exact verbal comment..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-xs"
                        />
                      </div>

                      <div>
                        <ActionRequiredMultiSelect
                          value={formData.action_required || []}
                          onChange={(selected) => setFormData({ 
                            ...formData, 
                            action_required: selected.length > 0 ? JSON.stringify(selected) : '' 
                          })}
                          onAutoPlanTypeChange={(suggestedType) => setFormData(prev => ({
                            ...prev,
                            action_plan_type: suggestedType,
                            action_plan_required: true
                          }))}
                          label="Action Required"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: Manager Review */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">5</span>
                          5. Manager Review
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Review Assignment, Status & Manager Notes</span>
                      </div>

                    <div className="space-y-4 text-xs font-medium">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <EmployeeSearchSelect
                            label="Manager"
                            value={formData.assigned_manager || ''}
                            onChange={(name, emp) => setFormData(prev => ({ 
                              ...prev, 
                              assigned_manager: name, 
                              reviewer_id: emp?.id ? String(emp.id) : null 
                            }))}
                            employees={employeesList}
                            placeholder="Search & select Manager..."
                          />
                        </div>

                        <div>
                          <ManageableSelect
                            fieldKey="manager_approval"
                            label="Status"
                            value={formData.manager_approval || ''}
                            onChange={(val) => setFormData({ ...formData, manager_approval: val })}
                            defaultOptions={['Pending', 'Approved', 'Reviewed', 'Resolved', 'Closed']}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-slate-700 font-bold">Notes</label>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {(formData.manager_notes || formData.corrective_action || '').length} / 300
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          maxLength={300}
                          value={formData.manager_notes || formData.corrective_action || ''}
                          onChange={(e) => setFormData({ ...formData, manager_notes: e.target.value, corrective_action: e.target.value })}
                          placeholder="Follow up with the agent and provide additional training..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Executive Audit & Forward Action Summary Card */}
                  <AuditExecutiveSummary
                    formData={formData}
                    type="nps"
                    currentSelectedPreset={currentSelectedPreset}
                    checkedSubReasonIds={checkedSubReasonIds}
                  />
                </div>
                )}
              </>
            ) : isComplaint ? (
              <>
                {/* COMPLAINT AUDIT STEPS */}
                {/* Step 1: General Info */}
                {currentStep === 1 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                        1. General Information
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Complaint Identifiers & Request Meta</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4 text-xs font-medium">
                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Transaction ID</label>
                        <input
                          type="text"
                          value={formData.transaction_id || ''}
                          onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                          placeholder="e.g. CMP-2026-0001"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Timestamp / Date</label>
                        <input
                          type="date"
                          value={formData.request_date ? String(formData.request_date).slice(0, 10) : (formData.order_date ? String(formData.order_date).slice(0, 10) : '')}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="Owner"
                          value={formData.operations_owner || formData.owner || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            operations_owner: name, 
                            owner: name, 
                            owner_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select Owner..."
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="request_type"
                          label="Request Sub Type"
                          value={formData.request_type || ''}
                          onChange={(val) => setFormData({ ...formData, request_type: val })}
                          defaultOptions={['Visa Application', 'Document Processing', 'Service Booking', 'Order Fulfillment']}
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="Agent Name"
                          value={formData.agent_name || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            agent_name: name, 
                            agent_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select Agent..."
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Complaint Reason</label>
                        <input
                          type="text"
                          value={formData.complaint_reason || ''}
                          onChange={(e) => setFormData({ ...formData, complaint_reason: e.target.value })}
                          placeholder="Enter complaint reason..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Validation */}
                {currentStep === 2 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                        2. QA Validation
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Auditor & Validation Result</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
                      <div>
                        <EmployeeSearchSelect
                          label="QA"
                          value={formData.auditor_name || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            auditor_name: name, 
                            auditor_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select QA Auditor..."
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="qa_status"
                          label="Validation"
                          value={formData.qa_status}
                          onChange={(val) => setFormData({ ...formData, qa_status: val })}
                          defaultOptions={['Pass', 'Fail', 'Pending']}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Classification (Bucket) */}
                {currentStep === 3 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
                        3. Classification (Bucket)
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Select Active Department Bucket</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.keys(mergedComplaintBuckets).map((bKey) => {
                        const bucket = mergedComplaintBuckets[bKey];
                        const Icon = bucket.icon || Building2;
                        const isSelected = formData.department === bKey;

                        return (
                          <div
                            key={bKey}
                            onClick={() => setFormData({ ...formData, department: bKey })}
                            className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center gap-4 ${
                              isSelected
                                ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-300 shadow-md scale-[1.01]'
                                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                            }`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                                {bucket.label}
                              </h4>
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {bucket.options.length} Root Causes Available
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 4: Root Cause */}
                {currentStep === 4 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">4</span>
                        4. Root Cause
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Select Root Cause & Provide Details</span>
                    </div>

                    {/* Complaint Buckets Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-1">
                      {Object.entries(activeTypeBuckets).map(([bKey, bucket]) => {
                        const isActiveBucket = (formData.department || '').toLowerCase().trim() === bKey.toLowerCase().trim();

                        return (
                          <div 
                            key={bKey} 
                            className={`p-3.5 rounded-2xl border text-xs space-y-3 transition-all ${
                              isActiveBucket ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-200 shadow-sm' : 'bg-slate-50/60 border-slate-200'
                            }`}
                          >
                            <p className={`font-black text-center border-b pb-2 text-[11px] leading-tight break-words min-h-[32px] flex items-center justify-center gap-1.5 ${
                              isActiveBucket ? 'text-blue-800 border-blue-200' : 'text-slate-700 border-slate-200'
                            }`}>
                              {bucket.icon && React.createElement(bucket.icon, { className: "w-3.5 h-3.5 shrink-0" })}
                              <span>{bucket.label}</span>
                            </p>

                            <div className="space-y-2 pt-1">
                              {bucket.options.map((opt) => {
                                const isChecked = Boolean(
                                  formData.root_cause &&
                                  formData.department &&
                                  formData.department.toLowerCase().trim() === bKey.toLowerCase().trim() &&
                                  (
                                    formData.root_cause.toLowerCase().trim() === opt.label.toLowerCase().trim() ||
                                    formData.root_cause === opt.code
                                  )
                                );

                                return (
                                  <label 
                                    key={opt.code || opt.label} 
                                    onClick={() => handleSelectRootCause(bKey, opt)}
                                    className={`flex items-start gap-2 p-2 rounded-xl cursor-pointer transition-all border ${
                                      isChecked 
                                        ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-300' 
                                        : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`complaint_rc_${bKey}_${opt.code || opt.label}`}
                                      checked={isChecked}
                                      onChange={() => handleSelectRootCause(bKey, opt)}
                                      className="w-3.5 h-3.5 mt-0.5 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className={`leading-snug text-[10.5px] break-words ${isChecked ? 'font-black text-blue-700' : 'font-semibold text-slate-700 group-hover:text-slate-900'}`}>
                                        {opt.label}
                                      </span>
                                      {opt.isPreset && (
                                        <span className="text-[9.5px] text-blue-600 font-bold mt-0.5">
                                          {opt.subReasonsCount || 0} checklist items ({opt.weight} pts)
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sub-Reasons Checklist & Notes */}
                    {renderSubReasonsChecklist({
                      placeholder: "Provide specific details on what caused the complaint and root cause findings..."
                    })}
                  </div>
                )}

                {/* Step 5: Complaint Details */}
                {currentStep === 5 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">5</span>
                        5. Complaint Details
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Quality Switches & Auditor Comment</span>
                    </div>

                    {/* Quality Switches */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium">
                      {/* Over Promise */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block font-bold text-slate-700 mb-3">Over Promise</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="cmp_over_promise"
                              checked={formData.switches.over_promise === true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, over_promise: true } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="cmp_over_promise"
                              checked={formData.switches.over_promise !== true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, over_promise: false } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>

                      {/* Complaint Accuracy */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block font-bold text-slate-700 mb-3">Complaint Accuracy</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="cmp_accuracy"
                              checked={formData.switches.complaint_accuracy === true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, complaint_accuracy: true } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="cmp_accuracy"
                              checked={formData.switches.complaint_accuracy !== true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, complaint_accuracy: false } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>

                      {/* Document Accuracy */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block font-bold text-slate-700 mb-3">Document Accuracy</label>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="cmp_docs_accuracy"
                              checked={formData.switches.document_accuracy === true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, document_accuracy: true } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                            <input
                              type="radio"
                              name="cmp_docs_accuracy"
                              checked={formData.switches.document_accuracy !== true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, document_accuracy: false } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Comment Textarea */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-bold text-slate-700 text-xs">Comment</label>
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {(formData.comment || '').length} / 500
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={500}
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        placeholder="Enter complaint audit comments..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Step 6: Action & Review */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">6</span>
                          6. Action & Review
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Corrective Action, Action Selection & Manager Approval</span>
                      </div>

                    <div className="space-y-4 text-xs font-medium">
                      {/* Action Required Multi-Select */}
                      <div>
                        <ActionRequiredMultiSelect
                          value={formData.action_required || []}
                          onChange={(selected) => setFormData({ 
                            ...formData, 
                            action_required: selected.length > 0 ? JSON.stringify(selected) : '' 
                          })}
                          onAutoPlanTypeChange={(suggestedType) => setFormData(prev => ({
                            ...prev,
                            action_plan_type: suggestedType,
                            action_plan_required: true
                          }))}
                          label="Action Required"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-2">Corrective Action</label>
                        <textarea
                          rows={3}
                          value={formData.corrective_action}
                          onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                          placeholder="Agent re-trained regarding SLA commitment and accurate information sharing..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <EmployeeSearchSelect
                            label="Manager Review"
                            value={formData.assigned_manager || ''}
                            onChange={(name, emp) => setFormData(prev => ({ 
                              ...prev, 
                              assigned_manager: name, 
                              reviewer_id: emp?.id ? String(emp.id) : null 
                            }))}
                            employees={employeesList}
                            placeholder="Search & select Manager..."
                          />
                        </div>

                        <div>
                          <ManageableSelect
                            fieldKey="manager_approval"
                            label="Status"
                            value={formData.manager_approval}
                            onChange={(val) => setFormData({ ...formData, manager_approval: val })}
                            defaultOptions={['Pending', 'Approved', 'Rejected']}
                          />
                        </div>
                      </div>

                      {/* Flag for Action Plan Section */}
                      <div className="pt-4 border-t border-slate-200">
                        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 border border-blue-200 rounded-2xl p-4.5 space-y-3 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <Zap className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900 tracking-tight">
                                  Action Plan Routing & Remediation
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  Flag this incident to automatically sync selected actions into the Action Plans workspace
                                </p>
                              </div>
                            </div>

                            <label className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs cursor-pointer select-none self-start sm:self-auto">
                              <input
                                type="checkbox"
                                checked={formData.action_plan_required === true}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  action_plan_required: e.target.checked,
                                  action_plan_type: formData.action_plan_type || 'Training Action'
                                })}
                                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-xs font-black text-blue-800">Flag for Action Plan</span>
                            </label>
                          </div>

                          {formData.action_plan_required && (
                            <div className="space-y-2 pt-1 animate-fadeIn">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">Choose Action Plan Category:</label>
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full">
                                  Auto-Routes to Action Plans Workspace
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                  {
                                    id: 'Training Action',
                                    title: 'Training Action',
                                    subtitle: 'Targeted Retraining, 1:1 Coaching & Assessment',
                                    icon: GraduationCap,
                                    badge: 'Knowledge & Skill'
                                  },
                                  {
                                    id: 'HR Action',
                                    title: 'HR Action',
                                    subtitle: 'Policy Compliance, Conduct & Performance Review',
                                    icon: Users,
                                    badge: 'HR & Governance'
                                  },
                                  {
                                    id: 'Quality Action',
                                    title: 'Quality Action',
                                    subtitle: 'Quality CAPA, 5-Whys Analysis & SOP Update',
                                    icon: ShieldAlert,
                                    badge: 'Process & QA'
                                  }
                                ].map((card) => {
                                  const isSelected = (formData.action_plan_type || 'Training Action') === card.id;
                                  const IconComp = card.icon;
                                  return (
                                    <button
                                      key={card.id}
                                      type="button"
                                      onClick={() => setFormData({ ...formData, action_plan_type: card.id })}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                        isSelected
                                          ? 'bg-white border-blue-600 ring-2 ring-blue-500/30 shadow-sm'
                                          : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                          }`}>
                                            <IconComp className="w-3.5 h-3.5" />
                                          </div>
                                          <span className="text-xs font-black text-slate-900 leading-none">{card.title}</span>
                                        </div>
                                        <input
                                          type="radio"
                                          name="action_plan_type_radio_complaint"
                                          checked={isSelected}
                                          onChange={() => setFormData({ ...formData, action_plan_type: card.id })}
                                          className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                                        />
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{card.subtitle}</p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Executive Audit & Forward Action Summary Card */}
                  <AuditExecutiveSummary
                    formData={formData}
                    type="complaint"
                    currentSelectedPreset={currentSelectedPreset}
                    checkedSubReasonIds={checkedSubReasonIds}
                  />
                </div>
                )}
              </>
            ) : (
              <>
                {/* DELAY AUDIT STEPS (DEFAULT) */}
                {/* Step 1: General Information */}
                {currentStep === 1 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn">
                    <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">1</span>
                        1. General Information
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Basic Request Details</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-medium">
                      <div>
                        <label className="block text-slate-600 font-bold mb-2">ID / Request ID</label>
                        <input
                          type="text"
                          value={formData.transaction_id || ''}
                          onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                          placeholder="e.g. DEL-2026-0001"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="request_type"
                          label="Request Type"
                          value={formData.request_type || ''}
                          onChange={(val) => setFormData({ ...formData, request_type: val })}
                          defaultOptions={['Visa Application', 'Document Processing', 'Service Booking', 'Order Fulfillment']}
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Request Date</label>
                        <input
                          type="date"
                          value={formData.request_date ? String(formData.request_date).slice(0, 10) : (formData.order_date ? String(formData.order_date).slice(0, 10) : '')}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="Operations Owner"
                          value={formData.operations_owner || formData.owner || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            operations_owner: name, 
                            owner: name, 
                            owner_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select Operations Owner..."
                        />
                      </div>

                      <div>
                        <EmployeeSearchSelect
                          label="Agent Name"
                          value={formData.agent_name || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            agent_name: name, 
                            agent_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select Agent..."
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-2">Customer Name</label>
                        <input
                          type="text"
                          value={formData.customer_name || ''}
                          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                          placeholder="Customer name..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Operations Review */}
                {currentStep === 2 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn">
                    <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">2</span>
                        2. Operations Review
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">SLA & System Status</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs font-medium">
                      <div>
                        <ManageableSelect
                          fieldKey="operations_status"
                          label="Operations Status"
                          value={formData.operations_status}
                          onChange={(val) => setFormData({ ...formData, operations_status: val })}
                          defaultOptions={['In Progress', 'Completed', 'On Hold']}
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="sla_status"
                          label="SLA Status"
                          value={formData.sla_status}
                          onChange={(val) => setFormData({ ...formData, sla_status: val })}
                          defaultOptions={['Breached', 'Met SLA', 'Near Breach']}
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="status_on_system"
                          label="Status on System"
                          value={formData.status_on_system}
                          onChange={(val) => setFormData({ ...formData, status_on_system: val })}
                          defaultOptions={['Yes', 'No']}
                        />
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center">
                        <label className="block font-bold text-slate-700 mb-1.5 text-xs">System Remark</label>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800">
                            <input
                              type="radio"
                              name="delay_system_remark_step2"
                              checked={formData.switches.system_remark === true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, system_remark: true } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>Yes</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800">
                            <input
                              type="radio"
                              name="delay_system_remark_step2"
                              checked={formData.switches.system_remark !== true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, system_remark: false } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: QA Validation */}
                {currentStep === 3 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn">
                    <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">3</span>
                        3. QA Validation
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Auditor Evaluation</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
                      <div>
                        <EmployeeSearchSelect
                          label="QA Auditor"
                          value={formData.auditor_name || ''}
                          onChange={(name, emp) => setFormData(prev => ({ 
                            ...prev, 
                            auditor_name: name, 
                            auditor_id: emp?.id ? String(emp.id) : null 
                          }))}
                          employees={employeesList}
                          placeholder="Search & select QA Auditor..."
                        />
                      </div>

                      <div>
                        <ManageableSelect
                          fieldKey="qa_status"
                          label="Validation Result"
                          value={formData.qa_status}
                          onChange={(val) => setFormData({ ...formData, qa_status: val })}
                          defaultOptions={['Pass', 'Fail', 'Pending Review']}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Classification (Bucket) */}
                {currentStep === 4 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn">
                    <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">4</span>
                        4. Classification (Bucket)
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Select Department Bucket</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                      {Object.entries(mergedDelayBuckets).map(([key, bucket]) => {
                        const Icon = bucket.icon || Clock;
                        const isSelected = formData.department === key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setFormData({ ...formData, department: key })}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-md ring-2 ring-blue-500/20 scale-102'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3.5 ${
                              isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'
                            }`}>
                              <Icon className="w-7 h-7" />
                            </div>
                            <span className="text-sm font-extrabold leading-tight">{bucket.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 5: Root Cause */}
                {currentStep === 5 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">5</span>
                        5. Root Cause
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Select Primary Root Cause & Sub Reason</span>
                    </div>

                    {/* Grid matrix of bucket options - spacious dynamic columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pb-1">
                      {Object.entries(activeTypeBuckets).map(([bKey, bucket]) => {
                        const isActiveBucket = (formData.department || '').toLowerCase().trim() === bKey.toLowerCase().trim();

                        return (
                          <div 
                            key={bKey} 
                            className={`p-3.5 rounded-2xl border text-xs space-y-3 transition-all ${
                              isActiveBucket ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-200 shadow-sm' : 'bg-slate-50/60 border-slate-200'
                            }`}
                          >
                            <p className={`font-black text-center border-b pb-2 text-[11px] leading-tight break-words min-h-[32px] flex items-center justify-center gap-1.5 ${
                              isActiveBucket ? 'text-blue-800 border-blue-200' : 'text-slate-700 border-slate-200'
                            }`}>
                              {bucket.icon && React.createElement(bucket.icon, { className: "w-3.5 h-3.5 shrink-0" })}
                              <span>{bucket.label}</span>
                            </p>

                            <div className="space-y-2 pt-1">
                              {bucket.options.map((opt) => {
                                const isChecked = Boolean(
                                  formData.root_cause &&
                                  formData.department &&
                                  formData.department.toLowerCase().trim() === bKey.toLowerCase().trim() &&
                                  (
                                    formData.root_cause.toLowerCase().trim() === opt.label.toLowerCase().trim() ||
                                    formData.root_cause === opt.code
                                  )
                                );

                                return (
                                  <label 
                                    key={opt.code || opt.label} 
                                    onClick={() => handleSelectRootCause(bKey, opt)}
                                    className={`flex items-start gap-2 p-2 rounded-xl cursor-pointer transition-all border ${
                                      isChecked 
                                        ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-300' 
                                        : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`delay_rc_${bKey}_${opt.code || opt.label}`}
                                      checked={isChecked}
                                      onChange={() => handleSelectRootCause(bKey, opt)}
                                      className="w-3.5 h-3.5 mt-0.5 text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className={`leading-snug text-[10.5px] break-words ${isChecked ? 'font-black text-blue-700' : 'font-semibold text-slate-700 group-hover:text-slate-900'}`}>
                                        {opt.label}
                                      </span>
                                      {opt.isPreset && (
                                        <span className="text-[9.5px] text-blue-600 font-bold mt-0.5">
                                          {opt.subReasonsCount || 0} checklist items ({opt.weight} pts)
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sub-Reasons Checklist & Notes */}
                    {renderSubReasonsChecklist({
                      placeholder: "Provide specific details about the root cause and delay findings..."
                    })}
                  </div>
                )}

                {/* Step 6: Delay Details */}
                {currentStep === 6 && (
                  <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn">
                    <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">6</span>
                        6. Delay Details
                      </h3>
                      <span className="text-xs text-slate-400 font-medium">Switches & Text Remarks</span>
                    </div>

                    {/* Radio Switches for Over Promise */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="block font-bold text-slate-700 mb-2">Over Promise</span>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="over_promise"
                              checked={formData.switches.over_promise === true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, over_promise: true } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="font-bold text-slate-700">Yes</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="over_promise"
                              checked={formData.switches.over_promise !== true}
                              onChange={() => setFormData({ ...formData, switches: { ...formData.switches, over_promise: false } })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="font-bold text-slate-700">No</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* System Remarks */}
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-bold text-slate-700">System Remarks</label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(formData.system_remarks || '').length} / 500
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          maxLength={500}
                          value={formData.system_remarks}
                          onChange={(e) => setFormData({ ...formData, system_remarks: e.target.value })}
                          placeholder="Enter system observations regarding the delay..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-xs"
                        />
                      </div>

                      {/* Comment */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-bold text-slate-700">Comment</label>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {(formData.comment || '').length} / 500
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          maxLength={500}
                          value={formData.comment}
                          onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                          placeholder="Add customer communication or auditor comments..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 7: Action & Review */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-blue-400 p-6 shadow-sm ring-2 ring-blue-500/20 animate-fadeIn">
                      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">7</span>
                          7. Action & Review
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Corrective Action & Manager Approval</span>
                      </div>

                    <div className="space-y-4 text-xs">
                      {/* Action Required Multi-Select */}
                      <div>
                        <ActionRequiredMultiSelect
                          value={formData.action_required || []}
                          onChange={(selected) => setFormData({ 
                            ...formData, 
                            action_required: selected.length > 0 ? JSON.stringify(selected) : '' 
                          })}
                          onAutoPlanTypeChange={(suggestedType) => setFormData(prev => ({
                            ...prev,
                            action_plan_type: suggestedType,
                            action_plan_required: true
                          }))}
                          label="Action Required"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-2">Corrective Action</label>
                        <textarea
                          rows={4}
                          value={formData.corrective_action}
                          onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
                          placeholder="Describe preventative and corrective actions taken..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <EmployeeSearchSelect
                            label="Manager Reviewer"
                            value={formData.assigned_manager || ''}
                            onChange={(name, emp) => setFormData(prev => ({ 
                              ...prev, 
                              assigned_manager: name, 
                              reviewer_id: emp?.id ? String(emp.id) : null 
                            }))}
                            employees={employeesList}
                            placeholder="Search & select Manager..."
                          />
                        </div>

                        <div>
                          <ManageableSelect
                            fieldKey="manager_approval"
                            label="Manager Status"
                            value={formData.manager_approval}
                            onChange={(val) => setFormData({ ...formData, manager_approval: val })}
                            defaultOptions={['Pending', 'Approved', 'Rejected']}
                          />
                        </div>
                      </div>

                      {/* Flag for Action Plan Section */}
                      <div className="pt-4 border-t border-slate-200">
                        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 border border-blue-200 rounded-2xl p-4.5 space-y-3 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <Zap className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-black text-slate-900 tracking-tight">
                                  Action Plan Routing & Remediation
                                </h4>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  Flag this transaction to automatically generate an item in the Action Plans tab
                                </p>
                              </div>
                            </div>

                            <label className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-blue-200 shadow-2xs cursor-pointer select-none self-start sm:self-auto">
                              <input
                                type="checkbox"
                                checked={formData.action_plan_required === true}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  action_plan_required: e.target.checked,
                                  action_plan_type: formData.action_plan_type || 'Training Action'
                                })}
                                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-xs font-black text-blue-800">Flag for Action Plan</span>
                            </label>
                          </div>

                          {formData.action_plan_required && (
                            <div className="space-y-2 pt-1 animate-fadeIn">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">Choose Action Plan Category:</label>
                                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-full">
                                  Auto-Routes to Action Plans Workspace
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                  {
                                    id: 'Training Action',
                                    title: 'Training Action',
                                    subtitle: 'Targeted Retraining, 1:1 Coaching & Assessment',
                                    icon: GraduationCap,
                                    badge: 'Knowledge & Skill'
                                  },
                                  {
                                    id: 'HR Action',
                                    title: 'HR Action',
                                    subtitle: 'Policy Compliance, Conduct & Performance Review',
                                    icon: Users,
                                    badge: 'HR & Governance'
                                  },
                                  {
                                    id: 'Quality Action',
                                    title: 'Quality Action',
                                    subtitle: 'Quality CAPA, 5-Whys Analysis & SOP Update',
                                    icon: ShieldAlert,
                                    badge: 'Process & QA'
                                  }
                                ].map((card) => {
                                  const isSelected = (formData.action_plan_type || 'Training Action') === card.id;
                                  const IconComp = card.icon;
                                  return (
                                    <button
                                      key={card.id}
                                      type="button"
                                      onClick={() => setFormData({ ...formData, action_plan_type: card.id })}
                                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                                        isSelected
                                          ? 'bg-white border-blue-600 ring-2 ring-blue-500/30 shadow-sm'
                                          : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                                          }`}>
                                            <IconComp className="w-3.5 h-3.5" />
                                          </div>
                                          <span className="text-xs font-black text-slate-900 leading-none">{card.title}</span>
                                        </div>
                                        <input
                                          type="radio"
                                          name="action_plan_type_radio"
                                          checked={isSelected}
                                          onChange={() => setFormData({ ...formData, action_plan_type: card.id })}
                                          className="w-3.5 h-3.5 text-blue-600 cursor-pointer"
                                        />
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{card.subtitle}</p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Executive Audit & Forward Action Summary Card */}
                  <AuditExecutiveSummary
                    formData={formData}
                    type="delay"
                    currentSelectedPreset={currentSelectedPreset}
                    checkedSubReasonIds={checkedSubReasonIds}
                  />
                </div>
                )}
              </>
            )}

          </div>
        </div>

        {/* Modal Bottom Footer Bar */}
        <div className="bg-white px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2.5 border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Submit Final Review</span>
              </button>
            )}
          </div>
        </div>

      </div>
  );

  return isFullPage ? (
    <div className="w-full animate-fadeIn" id="incident-stepper-fullpage-container">
      {content}
    </div>
  ) : (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      {content}
    </div>
  );
};
