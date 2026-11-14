import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutGrid, ChevronDown, ChevronsUpDown, SquarePen, Table, 
  X, Plus, Check, Trash2, Edit2, Edit3, GripVertical, HelpCircle,
  FolderPlus, Archive, Lock, ShieldAlert, Eye, EyeOff, ArrowUp, ArrowDown,
  MousePointerClick, CheckCircle2, Ban, Shield, UserCheck, User, Globe, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { refreshFieldOverridesCache } from '../common/PermittedField';
import { useActionControls, ActionControl } from '../../hooks/useActionControls';
import { ConfigureButtonSecurityModal } from './ConfigureButtonSecurityModal';

// Types
export interface CustomField {
  id: number;
  company_id: number;
  entity_type: string;
  field_name: string;
  field_label_ar: string;
  field_label_en: string;
  field_type: string; // text, select, checkbox, custom_table
  is_required: boolean;
  options: string | null; // For select, options joined by comma. For custom_table, columns JSON.
  relation_target_table: string | null; // profile tab id e.g. personal, job, benefits, emergency, training
  relation_display_column: string | null; // section name e.g. Basic Information, Benefits Overview
  order_index?: number;
  hidden?: boolean;
  read_only?: boolean;
  allow_on_submit?: boolean;
  perm_level?: number;
  own_only?: boolean;
  mask_value?: boolean;
}

export interface ProfileTabDefinition {
  id: string;
  label: string;
  group: 'Core Profile Tabs' | 'More Tabs ▾';
}

export const PROFILE_TABS_CONFIG: ProfileTabDefinition[] = [
  { id: 'personal', label: 'Personal', group: 'Core Profile Tabs' },
  { id: 'job', label: 'Job', group: 'Core Profile Tabs' },
  { id: 'time_off', label: 'Time Off', group: 'Core Profile Tabs' },
  { id: 'emergency', label: 'Emergency', group: 'Core Profile Tabs' },
  { id: 'recognition', label: 'Recognition', group: 'Core Profile Tabs' },
  { id: 'performance', label: 'Performance', group: 'Core Profile Tabs' },
  { id: 'training', label: 'Training', group: 'Core Profile Tabs' },
  { id: 'documents', label: 'Documents', group: 'Core Profile Tabs' },
  { id: 'login_info', label: 'Login info', group: 'Core Profile Tabs' },
  { id: 'notes', label: 'Notes', group: 'Core Profile Tabs' },
  { id: 'assets', label: 'Assets', group: 'More Tabs ▾' },
  { id: 'benefits', label: 'Benefits', group: 'More Tabs ▾' },
  { id: 'onboarding', label: 'Onboarding', group: 'More Tabs ▾' },
  { id: 'offboarding', label: 'Offboarding', group: 'More Tabs ▾' }
];

export const normalizeTabId = (tab?: string): string => {
  if (!tab) return 'personal';
  const lower = tab.toLowerCase().trim();
  if (lower === 'timeoff' || lower === 'time-off') return 'time_off';
  if (lower === 'login' || lower === 'logininfo' || lower === 'login-info') return 'login_info';
  if (lower === 'more') return 'assets';
  return lower;
};

// Standard Sections & Fields per Tab covering all 14 Employee Profile Tabs
export const STANDARD_LAYOUT_BY_TAB: Record<string, { name: string; items: { id: string; label: string; type: 'field' | 'field_group' | 'table' }[] }[]> = {
  personal: [
    {
      name: 'Basic Information',
      items: [
        { id: 'std_personal_employee_id', label: 'System User ID', type: 'field' },
        { id: 'std_personal_first_name', label: 'First Name', type: 'field' },
        { id: 'std_personal_middle_name', label: 'Middle Name', type: 'field' },
        { id: 'std_personal_last_name', label: 'Last Name', type: 'field' },
        { id: 'std_personal_preferred_name', label: 'Preferred Name', type: 'field' },
        { id: 'std_personal_national_id', label: 'National ID / NIN / Iqama', type: 'field' },
        { id: 'std_personal_birth_date', label: 'Birth Date', type: 'field' },
        { id: 'std_personal_gender', label: 'Gender', type: 'field' },
        { id: 'std_personal_marital_status', label: 'Marital Status', type: 'field' },
        { id: 'std_personal_nationality', label: 'Nationality', type: 'field' }
      ]
    },
    {
      name: 'Address',
      items: [
        { id: 'std_personal_street_1', label: 'Street 1', type: 'field' },
        { id: 'std_personal_street_2', label: 'Street 2', type: 'field' },
        { id: 'std_personal_city', label: 'City', type: 'field' },
        { id: 'std_personal_state', label: 'State / Province', type: 'field' },
        { id: 'std_personal_postal_code', label: 'Zip / Postal Code', type: 'field' },
        { id: 'std_personal_country', label: 'Country', type: 'field' }
      ]
    },
    {
      name: 'Contact',
      items: [
        { id: 'std_personal_work_phone', label: 'Work Phone', type: 'field' },
        { id: 'std_personal_work_phone_ext', label: 'Work Extension', type: 'field' },
        { id: 'std_personal_mobile_phone', label: 'Mobile Phone', type: 'field' },
        { id: 'std_personal_home_phone', label: 'Home Phone', type: 'field' },
        { id: 'std_personal_work_email', label: 'Work Email', type: 'field' },
        { id: 'std_personal_personal_email', label: 'Personal Email', type: 'field' }
      ]
    },
    {
      name: 'Social Links',
      items: [
        { id: 'std_personal_linkedin', label: 'LinkedIn Profile', type: 'field' },
        { id: 'std_personal_twitter', label: 'Twitter / X Profile', type: 'field' },
        { id: 'std_personal_github', label: 'GitHub Profile', type: 'field' },
        { id: 'std_personal_portfolio', label: 'Portfolio / Website', type: 'field' }
      ]
    },
    {
      name: 'Education',
      items: [
        { id: 'std_personal_education_table', label: 'Education History & Degrees', type: 'table' }
      ]
    }
  ],
  job: [
    {
      name: 'Job Details',
      items: [
        { id: 'std_job_contract_date', label: 'Contract Date', type: 'field' },
        { id: 'std_job_probation_date', label: 'Probationary Date', type: 'field' },
        { id: 'std_job_attendance_method', label: 'Attendance Method', type: 'field' },
        { id: 'std_job_assigned_shift', label: 'Assigned Shift (Default)', type: 'field' },
        { id: 'std_job_base_salary', label: 'Base Salary (EGP)', type: 'field' },
        { id: 'std_job_allowances', label: 'Allowances (EGP)', type: 'field' },
        { id: 'std_job_direct_reports', label: 'Direct Reports', type: 'field' },
        { id: 'std_job_description', label: 'Current Job Description', type: 'field' }
      ]
    },
    {
      name: 'Employment Status',
      items: [
        { id: 'std_emp_contract_type', label: 'Contract Type', type: 'field' },
        { id: 'std_emp_contract_start', label: 'Contract Start Date', type: 'field' },
        { id: 'std_emp_contract_end', label: 'Contract End Date', type: 'field' },
        { id: 'std_emp_status_history', label: 'Employment Status & Contract History', type: 'table' }
      ]
    },
    {
      name: 'Job Information',
      items: [
        { id: 'std_job_info_effective_date', label: 'Effective Date', type: 'field' },
        { id: 'std_job_info_department', label: 'Department', type: 'field' },
        { id: 'std_job_info_teams', label: 'Teams', type: 'field' },
        { id: 'std_job_info_job_title', label: 'Job Title', type: 'field' },
        { id: 'std_job_info_reporting_to', label: 'Reporting to', type: 'field' },
        { id: 'std_job_info_location', label: 'Location', type: 'field' },
        { id: 'std_job_info_grade', label: 'Job Grade / Level', type: 'field' },
        { id: 'std_job_info_change_reason', label: 'Change Reason', type: 'field' },
        { id: 'std_job_info_history', label: 'Job Information & Position History', type: 'table' }
      ]
    },
    {
      name: 'Compensation',
      items: [
        { id: 'std_comp_date', label: 'Compensation: Date', type: 'field' },
        { id: 'std_comp_pay_schedule', label: 'Pay Schedule', type: 'field' },
        { id: 'std_comp_pay_type', label: 'Pay Type', type: 'field' },
        { id: 'std_comp_pay_rate', label: 'Pay Rate', type: 'field' },
        { id: 'std_comp_paid_per', label: 'Paid Per', type: 'field' },
        { id: 'std_comp_overtime_status', label: 'Overtime Status', type: 'field' },
        { id: 'std_comp_change_reason', label: 'Compensation Change Reason', type: 'field' },
        { id: 'std_comp_comments', label: 'Compensation Comments', type: 'field' },
        { id: 'std_compensation_history', label: 'Compensation History', type: 'table' }
      ]
    },
    {
      name: 'Key Performance Indicators (KPIs)',
      items: [
        { id: 'std_kpi_target_value', label: 'Target KPI Value', type: 'field' },
        { id: 'std_kpi_frequency', label: 'Payout Frequency', type: 'field' },
        { id: 'std_kpi_mechanism', label: 'Payout Mechanism', type: 'field' },
        { id: 'std_kpi_payout_date', label: 'Separate Payment Schedule', type: 'field' }
      ]
    },
    {
      name: 'Potential Bonus',
      items: [
        { id: 'std_potential_bonus_percent', label: 'Potential Bonus: Annual Percentage (%)', type: 'field' },
        { id: 'std_potential_bonus_amount', label: 'Potential Bonus: Annual Amount', type: 'field' }
      ]
    },
    {
      name: 'Bonus',
      items: [
        { id: 'std_bonus_date', label: 'Bonus: Date', type: 'field' },
        { id: 'std_bonus_amount', label: 'Bonus: Amount', type: 'field' },
        { id: 'std_bonus_reason', label: 'Bonus: Reason', type: 'field' },
        { id: 'std_bonus_comment', label: 'Bonus: Comment', type: 'field' },
        { id: 'std_bonus_history', label: 'Bonus History', type: 'table' }
      ]
    },
    {
      name: 'Commission',
      items: [
        { id: 'std_commission_date', label: 'Commission: Date', type: 'field' },
        { id: 'std_commission_amount', label: 'Commission: Amount', type: 'field' },
        { id: 'std_commission_comment', label: 'Commission: Comment', type: 'field' },
        { id: 'std_commission_history', label: 'Commission History', type: 'table' }
      ]
    },
    {
      name: 'Penalty History & Issues',
      items: [
        { id: 'std_penalty_type', label: 'Penalty Type', type: 'field' },
        { id: 'std_penalty_amount', label: 'Penalty Amount (EGP)', type: 'field' },
        { id: 'std_penalty_date', label: 'Penalty Date', type: 'field' },
        { id: 'std_penalty_reason', label: 'Penalty Reason', type: 'field' },
        { id: 'std_penalty_history', label: 'Penalty History & Disciplinary Records', type: 'table' }
      ]
    },
    {
      name: 'Equity Grants',
      items: [
        { id: 'std_equity_grant_type', label: 'Equity: Grant Type', type: 'field' },
        { id: 'std_equity_custom_name', label: 'Equity: Custom Grant Type Name', type: 'field' },
        { id: 'std_equity_grant_date', label: 'Equity: Grant Date', type: 'field' },
        { id: 'std_equity_vesting_start', label: 'Equity: Vesting Start Date', type: 'field' },
        { id: 'std_equity_granted_count', label: 'Equity: # of Equity Granted', type: 'field' },
        { id: 'std_equity_strike_price', label: 'Equity: Strike Price', type: 'field' },
        { id: 'std_equity_vesting_schedule', label: 'Equity: Vesting Schedule', type: 'field' },
        { id: 'std_equity_vesting_months', label: 'Equity: Vesting Months', type: 'field' },
        { id: 'std_equity_cliff_months', label: 'Equity: Cliff Months', type: 'field' },
        { id: 'std_equity_history', label: 'Equity Grants History', type: 'table' }
      ]
    },
    {
      name: 'Shift Differential Allowance',
      items: [
        { id: 'std_shift_allowance_name', label: 'Shift Differential Allowance', type: 'field' },
        { id: 'std_shift_allowance_start', label: 'Differential Allowance Start Date', type: 'field' },
        { id: 'std_shift_allowance_end', label: 'Differential Allowance End Date', type: 'field' },
        { id: 'std_shift_allowance_history', label: 'Shift Differential Allowance History', type: 'table' }
      ]
    }
  ],
  time_off: [
    {
      name: 'Leave Balances & Policies',
      items: [
        { id: 'std_vacation_balance', label: 'Annual Vacation / Holiday Available (Days)', type: 'field' },
        { id: 'std_sick_balance', label: 'Sick Leave Available (Days)', type: 'field' },
        { id: 'std_bereavement_balance', label: 'Bereavement Used (YTD)', type: 'field' }
      ]
    },
    {
      name: 'Shift Schedule & Calendar',
      items: [
        { id: 'std_shift_schedule', label: 'Employee Shift Schedule', type: 'table' }
      ]
    },
    {
      name: 'Break Schedule & Slot Assignments',
      items: [
        { id: 'std_break_schedule_table', label: 'Break Schedule & Slot Assignments', type: 'table' }
      ]
    },
    {
      name: 'Upcoming Time Off',
      items: [
        { id: 'std_upcoming_time_off', label: 'Upcoming Leave Requests', type: 'table' }
      ]
    },
    {
      name: 'Time Off & Accrual History',
      items: [
        { id: 'std_time_off_history', label: 'Time Off, Accrual & Attendance History', type: 'table' }
      ]
    }
  ],
  emergency: [
    {
      name: 'Primary Contact',
      items: [
        { id: 'std_emg_name', label: 'Contact Full Name', type: 'field' },
        { id: 'std_emg_relationship', label: 'Relationship', type: 'field' }
      ]
    },
    {
      name: 'Phone & Email',
      items: [
        { id: 'std_emg_work_phone', label: 'Work Phone', type: 'field' },
        { id: 'std_emg_work_phone_ext', label: 'Work Phone Extension', type: 'field' },
        { id: 'std_emg_mobile_phone', label: 'Mobile Phone', type: 'field' },
        { id: 'std_emg_home_phone', label: 'Home Phone', type: 'field' },
        { id: 'std_emg_email', label: 'Email Address', type: 'field' }
      ]
    },
    {
      name: 'Residential Address',
      items: [
        { id: 'std_emg_street_1', label: 'Street 1', type: 'field' },
        { id: 'std_emg_street_2', label: 'Street 2', type: 'field' },
        { id: 'std_emg_city', label: 'City', type: 'field' },
        { id: 'std_emg_state', label: 'State / Province', type: 'field' },
        { id: 'std_emg_zip', label: 'Zip / Postal Code', type: 'field' },
        { id: 'std_emg_country', label: 'Country', type: 'field' }
      ]
    },
    {
      name: 'Emergency Contacts List',
      items: [
        { id: 'std_emergency_contacts_table', label: 'Emergency Contacts Table', type: 'table' }
      ]
    }
  ],
  recognition: [
    {
      name: 'Recognition & Spot Bonuses',
      items: [
        { id: 'std_recognition_title', label: 'Recognition / Award Title', type: 'field' },
        { id: 'std_recognition_type', label: 'Award Type', type: 'field' },
        { id: 'std_recognition_date', label: 'Award Date', type: 'field' },
        { id: 'std_recognition_amount', label: 'Monetary Value / Spot Bonus', type: 'field' },
        { id: 'std_recognition_giver', label: 'Awarded By', type: 'field' },
        { id: 'std_recognition_notes', label: 'Achievement & Citation Notes', type: 'field' }
      ]
    },
    {
      name: 'Recognitions & Honors List',
      items: [
        { id: 'std_recognition_table', label: 'Employee Recognitions & Honors History', type: 'table' }
      ]
    }
  ],
  performance: [
    {
      name: 'Performance Evaluation & Scoring',
      items: [
        { id: 'std_perf_score', label: 'Live Evaluation Score (out of 10)', type: 'field' },
        { id: 'std_perf_status', label: 'Performance Status', type: 'field' },
        { id: 'std_perf_company_rank', label: 'Company-Wide Ranking', type: 'field' },
        { id: 'std_perf_dept_rank', label: 'Department Ranking', type: 'field' }
      ]
    },
    {
      name: 'Performance Reviews & Appraisals',
      items: [
        { id: 'std_perf_eval_history', label: 'Performance Reviews & Appraisals History', type: 'table' }
      ]
    }
  ],
  training: [
    {
      name: 'Training Courses & Programs',
      items: [
        { id: 'std_training_title', label: 'Training Program / Course Name', type: 'field' },
        { id: 'std_training_category', label: 'Training Category', type: 'field' },
        { id: 'std_training_status', label: 'Progress Status', type: 'field' },
        { id: 'std_training_table', label: 'Assigned Training Programs', type: 'table' }
      ]
    },
    {
      name: 'Completed Training & Certificates',
      items: [
        { id: 'std_training_completed_date', label: 'Completion Date', type: 'field' },
        { id: 'std_training_certificate_url', label: 'Certificate Attachment / URL', type: 'field' },
        { id: 'std_training_history_table', label: 'Completed Training History', type: 'table' }
      ]
    }
  ],
  documents: [
    {
      name: 'Personal & System Identification',
      items: [
        { id: 'std_doc_nat_id', label: 'National ID / Passport Document', type: 'field' },
        { id: 'std_doc_contract', label: 'Employment Contract Document', type: 'field' }
      ]
    },
    {
      name: 'Employee Documents Repository',
      items: [
        { id: 'std_doc_folder', label: 'Document Folder / Category', type: 'field' },
        { id: 'std_doc_name', label: 'Document Title / File Name', type: 'field' },
        { id: 'std_doc_upload_date', label: 'Upload Date', type: 'field' },
        { id: 'std_documents_table', label: 'Employee Documents Repository', type: 'table' }
      ]
    }
  ],
  login_info: [
    {
      name: 'Attendance & System Identifiers',
      items: [
        { id: 'std_login_biometric_id', label: 'Employee ID / Fingerprint Code', type: 'field' },
        { id: 'std_login_system_user_id', label: 'System User ID', type: 'field' }
      ]
    },
    {
      name: 'System Credentials & Logins',
      items: [
        { id: 'std_login_system_name', label: 'System / Application Name', type: 'field' },
        { id: 'std_login_username', label: 'Username / Email', type: 'field' },
        { id: 'std_login_credentials_table', label: 'System Credentials & Logins Register', type: 'table' }
      ]
    }
  ],
  notes: [
    {
      name: 'Comments & Notes',
      items: [
        { id: 'std_notes_comment_input', label: 'Employee Comments & Notes', type: 'field' },
        { id: 'std_notes_comments_table', label: 'Comments & Collaboration History', type: 'table' }
      ]
    },
    {
      name: 'Activity & Audit Trail',
      items: [
        { id: 'std_notes_activity_log', label: 'Activity Log & Timeline', type: 'table' }
      ]
    }
  ],
  assets: [
    {
      name: 'Assigned Assets & Hardware',
      items: [
        { id: 'std_asset_category', label: 'Asset Category', type: 'field' },
        { id: 'std_asset_description', label: 'Asset Description', type: 'field' },
        { id: 'std_asset_serial_number', label: 'Serial Number', type: 'field' },
        { id: 'std_asset_assigned_date', label: 'Date Assigned', type: 'field' },
        { id: 'std_asset_returned_date', label: 'Date Returned', type: 'field' },
        { id: 'std_assets_table', label: 'Assets Custom Table', type: 'table' }
      ]
    }
  ],
  benefits: [
    {
      name: 'Benefits & Insurance Plans',
      items: [
        { id: 'std_benefit_plan_name', label: 'Benefit / Plan Name', type: 'field' },
        { id: 'std_benefit_coverage_type', label: 'Coverage Type', type: 'field' },
        { id: 'std_benefit_start_date', label: 'Benefit Start Date', type: 'field' },
        { id: 'std_benefit_end_date', label: 'Benefit End Date', type: 'field' },
        { id: 'std_benefit_cost', label: 'Employee Contribution / Cost', type: 'field' },
        { id: 'std_benefits_table', label: 'Benefits & Insurance Plans', type: 'table' }
      ]
    }
  ],
  onboarding: [
    {
      name: 'Onboarding Checklist & Status',
      items: [
        { id: 'std_onboard_task_name', label: 'Onboarding Task Name', type: 'field' },
        { id: 'std_onboard_assigned_to', label: 'Assigned Department / Mentor', type: 'field' },
        { id: 'std_onboard_due_date', label: 'Due Date', type: 'field' },
        { id: 'std_onboard_status', label: 'Task Completion Status', type: 'field' },
        { id: 'std_onboarding_table', label: 'Onboarding Tasks Checklist', type: 'table' }
      ]
    }
  ],
  offboarding: [
    {
      name: 'Offboarding Clearance & Handover',
      items: [
        { id: 'std_offboard_notice_date', label: 'Notice Date', type: 'field' },
        { id: 'std_offboard_last_day', label: 'Last Working Day', type: 'field' },
        { id: 'std_offboard_departure_reason', label: 'Departure Reason', type: 'field' },
        { id: 'std_offboard_eligible_rehire', label: 'Eligible for Rehire', type: 'field' },
        { id: 'std_offboarding_table', label: 'Offboarding Clearance Tasks', type: 'table' }
      ]
    }
  ]
};

export const TAB_SECTIONS_CONFIG: Record<string, string[]> = Object.fromEntries(
  Object.entries(STANDARD_LAYOUT_BY_TAB).map(([tabId, sections]) => [
    tabId,
    sections.map(s => s.name)
  ])
);

interface CustomizeLayoutDropdownProps {
  activeTab: string; // e.g. personal, job, benefits, training
  employeeId?: number;
  onRefresh?: () => void;
  className?: string;
  buttonClassName?: string;
  isViewOnly?: boolean;
}

export const CustomizeLayoutDropdown: React.FC<CustomizeLayoutDropdownProps> = ({
  activeTab,
  employeeId,
  onRefresh,
  className,
  buttonClassName,
  isViewOnly = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'reorder' | 'add_field' | 'add_table' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or when another dropdown opens
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleCloseOthers = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.except !== 'customize_layout') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('close-hr-dropdowns', handleCloseOthers);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('close-hr-dropdowns', handleCloseOthers);
    };
  }, []);

  if (isViewOnly) return null;

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left z-50", className)}>
      <button 
        onClick={() => {
          const next = !isOpen;
          if (next) {
            window.dispatchEvent(new CustomEvent('close-hr-dropdowns', { detail: { except: 'customize_layout' } }));
          }
          setIsOpen(next);
        }}
        className={cn(
          "flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#1b5e20] bg-white hover:bg-slate-50 border border-[#1b5e20] rounded-full transition-all cursor-pointer shadow-xs",
          buttonClassName,
          isOpen && "ring-2 ring-white/60 bg-emerald-50 text-[#1b5e20]"
        )}
        id="btn-customize-layout"
      >
        <LayoutGrid className="w-3.5 h-3.5 text-[#1b5e20]" />
        <span>Customize Layout</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-[#1b5e20] transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[300] animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Layout Settings</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {normalizeTabId(activeTab).replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Customize layout, fields, and tables for this tab</p>
          </div>

          <div className="py-1">
            {/* Reorder Fields */}
            <button
              onClick={() => {
                setActiveModal('reorder');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-all flex items-start gap-3 border-b border-slate-50 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                <ChevronsUpDown className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 group-hover:text-[#1b5e20] transition-colors">Reorder Fields</div>
                <div className="text-[11px] text-slate-400 font-medium">Arrange, show/hide, or reorganize layout fields</div>
              </div>
            </button>

            {/* Add Custom Field */}
            <button
              onClick={() => {
                setActiveModal('add_field');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-all flex items-start gap-3 border-b border-slate-50 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-[#1b5e20] flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                <SquarePen className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 group-hover:text-[#1b5e20] transition-colors">Add Custom Field</div>
                <div className="text-[11px] text-slate-400 font-medium">Create custom text, select, or date attributes</div>
              </div>
            </button>

            {/* Add Custom Table */}
            <button
              onClick={() => {
                setActiveModal('add_table');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-all flex items-start gap-3 border-b border-slate-50 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                <Table className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">Add Custom Table</div>
                <div className="text-[11px] text-slate-400 font-medium">Create structured multi-row tabular record lists</div>
              </div>
            </button>

            {/* Configure Button Security & Actions */}
            <button
              onClick={() => {
                setActiveModal('reorder');
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-all flex items-start gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700 transition-colors">Button & Action Security</div>
                <div className="text-[11px] text-slate-400 font-medium">Configure button visibility, disable states & role scopes</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal === 'add_field' && (
        <AddFieldModal 
          activeTab={activeTab} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => {
            setActiveModal(null);
            if (onRefresh) onRefresh();
          }} 
        />
      )}

      {activeModal === 'add_table' && (
        <AddTableModal 
          activeTab={activeTab} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => {
            setActiveModal(null);
            if (onRefresh) onRefresh();
          }} 
        />
      )}

      {activeModal === 'reorder' && (
        <ReorderFieldsModal 
          activeTab={activeTab} 
          onClose={() => setActiveModal(null)} 
          onSuccess={() => {
            setActiveModal(null);
            if (onRefresh) onRefresh();
          }} 
        />
      )}
    </div>
  );
};

// ==========================================
// 1. ADD CUSTOM FIELD MODAL (Matches Image 2)
// ==========================================
interface AddFieldModalProps {
  activeTab: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddFieldModal: React.FC<AddFieldModalProps> = ({ activeTab, onClose, onSuccess }) => {
  const [fieldName, setFieldName] = useState('');
  const [fieldType, setFieldType] = useState('');
  const [fieldStatus, setFieldStatus] = useState<'required' | 'optional'>('optional');
  const [selectedTab, setSelectedTab] = useState(() => normalizeTabId(activeTab));
  const [selectedSection, setSelectedSection] = useState('');
  const [optionsText, setOptionsText] = useState(''); // Comma separated for lists
  const [isOwnOnly, setIsOwnOnly] = useState(false);
  const [responsibilityChecked, setResponsibilityChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sections = TAB_SECTIONS_CONFIG[selectedTab] || [];
    if (sections.length > 0) {
      setSelectedSection(sections[0]);
    } else {
      setSelectedSection('');
    }
  }, [selectedTab]);

  const handleSave = async () => {
    if (!fieldName.trim()) {
      alert('Please specify a Field Name');
      return;
    }
    if (!fieldType) {
      alert('Please select a Field Type');
      return;
    }
    if (!selectedSection) {
      alert('Please select a Section');
      return;
    }
    if (!responsibilityChecked) {
      alert('Please confirm you take full responsibility for this field.');
      return;
    }

    setIsSaving(true);
    try {
      // Slugify field name to be a standard variable-safe string
      const sanitizedName = 'cf_' + fieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

      const body = {
        entity_type: 'employee',
        field_name: sanitizedName,
        field_label_en: fieldName.trim(),
        field_label_ar: fieldName.trim(),
        field_type: fieldType,
        is_required: fieldStatus === 'required',
        options: fieldType === 'select' ? optionsText : null,
        relation_target_table: selectedTab, // custom usage to store destination tab
        relation_display_column: selectedSection, // custom usage to store section name
        order_index: 100,
        hidden: false,
        own_only: isOwnOnly,
        perm_level: isOwnOnly ? 4 : 0
      };

      const res = await fetch('/api/hr/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        refreshFieldOverridesCache();
        alert('Custom field created successfully!');
        onSuccess();
      } else {
        const err = await res.json();
        alert(`Failed to save custom field: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#fcfbfa] rounded-[32px] w-full max-w-6xl shadow-2xl overflow-hidden border border-slate-200/50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-2xl font-serif font-black text-[#1b5e20]">New Custom Field</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-10 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Field Name*</label>
                <input 
                  type="text"
                  value={fieldName}
                  onChange={(e) => setFieldName(e.target.value)}
                  placeholder="e.g. Pension ID#, Birthplace, etc."
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-2.5 outline-none text-slate-800 transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Type*</label>
                <select
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-2.5 outline-none text-slate-800 transition-all shadow-sm"
                >
                  <option value="">-Select-</option>
                  <option value="text">Short Answer (Text)</option>
                  <option value="longtext">Long Answer (Paragraph)</option>
                  <option value="select">Dropdown List (Select)</option>
                  <option value="checkbox">Checkbox</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="currency">Currency</option>
                </select>
              </div>

              {fieldType === 'select' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Select Options (comma separated)</label>
                  <input 
                    type="text"
                    value={optionsText}
                    onChange={(e) => setOptionsText(e.target.value)}
                    placeholder="e.g. Spain, France, Germany, USA"
                    className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-2.5 outline-none text-slate-800 transition-all shadow-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Field Status*</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-600">
                    <input 
                      type="radio" 
                      name="fieldStatus" 
                      checked={fieldStatus === 'required'}
                      onChange={() => setFieldStatus('required')}
                      className="text-[#1b5e20] focus:ring-[#1b5e20]"
                    />
                    Required, this field must be answered
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-600">
                    <input 
                      type="radio" 
                      name="fieldStatus" 
                      checked={fieldStatus === 'optional'}
                      onChange={() => setFieldStatus('optional')}
                      className="text-[#1b5e20] focus:ring-[#1b5e20]"
                    />
                    Optional, this field can be skipped
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-xs font-black text-[#1b5e20] uppercase tracking-wider mb-3">Where will this new field appear?</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Employee Profile Tab*</label>
                  <select
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-2.5 outline-none text-slate-800 transition-all shadow-sm"
                  >
                    <optgroup label="Core Profile Tabs">
                      {PROFILE_TABS_CONFIG.filter(t => t.group === 'Core Profile Tabs').map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="More Tabs ▾">
                      {PROFILE_TABS_CONFIG.filter(t => t.group === 'More Tabs ▾').map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Section within selected tab*</label>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-4 py-2.5 outline-none text-slate-800 transition-all shadow-sm"
                  >
                    {(TAB_SECTIONS_CONFIG[selectedTab] || []).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Own Only Security Protection */}
            <div className="border-t border-slate-100 pt-6">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isOwnOnly}
                    onChange={(e) => setIsOwnOnly(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                  />
                  <div>
                    <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-700" />
                      Own Only (Self-Access Only)
                    </span>
                    <p className="text-[11px] text-amber-800/80 font-medium mt-0.5">
                      Strictly restricts visibility so that only the employee themselves (or Super Admin) can view this sensitive field. Regular managers, peers, and standard users will not have access.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6 space-y-3">
              <h3 className="text-xs font-black text-amber-700 uppercase tracking-wider">Just checking...</h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Custom fields can be tricky. Make sure this one isn't a duplicate, a privacy issue, or a legal no-no. If you have any questions please reach out to support.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-600 pt-1">
                <input 
                  type="checkbox"
                  checked={responsibilityChecked}
                  onChange={(e) => setResponsibilityChecked(e.target.checked)}
                  className="rounded text-[#1b5e20] focus:ring-[#1b5e20] mt-0.5"
                />
                <span>I take full responsibility for the creation of this field.</span>
              </label>
            </div>
          </div>

          {/* Right Live Preview Box */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 min-h-[300px] flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-4">Preview</span>
              
              {!fieldName.trim() ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 animate-pulse">
                    <SquarePen className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 font-bold max-w-xs leading-relaxed">
                    Name your new field and watch it come to life here in this little box.
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-start space-y-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-black text-[#1b5e20] uppercase tracking-wider">
                      {fieldName} {fieldStatus === 'required' && <span className="text-rose-500">*</span>}
                    </label>
                    
                    {fieldType === 'select' ? (
                      <select className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none">
                        <option value="">-Select-</option>
                        {(optionsText ? optionsText.split(',') : ['Option A', 'Option B']).map((o, idx) => (
                          <option key={idx} value={o.trim()}>{o.trim()}</option>
                        ))}
                      </select>
                    ) : fieldType === 'checkbox' ? (
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-600 p-1 cursor-pointer">
                        <input type="checkbox" className="rounded text-[#1b5e20]" />
                        <span>Confirm {fieldName}</span>
                      </label>
                    ) : fieldType === 'longtext' ? (
                      <textarea rows={3} placeholder={`Enter ${fieldName}...`} className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none" />
                    ) : fieldType === 'date' ? (
                      <input type="date" className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-500" />
                    ) : fieldType === 'number' ? (
                      <input type="number" placeholder="0" className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none" />
                    ) : fieldType === 'currency' ? (
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                        <input type="text" placeholder="0.00" className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl pl-6 pr-3 py-2 outline-none" />
                      </div>
                    ) : (
                      <input type="text" placeholder={`Enter ${fieldName}...`} className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none" />
                    )}
                  </div>
                  
                  <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Interactive Preview Active
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#1b5e20] text-white rounded-xl text-xs font-black hover:bg-[#123e15] transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-900/10"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. ADD CUSTOM TABLE MODAL (Matches Image 3)
// ==========================================
interface AddTableModalProps {
  activeTab: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface TableColumn {
  id: string;
  name: string;
  type: string;
}

const AddTableModal: React.FC<AddTableModalProps> = ({ activeTab, onClose, onSuccess }) => {
  const [tableName, setTableName] = useState('');
  const [selectedTab, setSelectedTab] = useState(() => normalizeTabId(activeTab));
  const [selectedSection, setSelectedSection] = useState(() => TAB_SECTIONS_CONFIG[normalizeTabId(activeTab)]?.[0] || 'General');
  const [columns, setColumns] = useState<TableColumn[]>([
    { id: '1', name: 'Column 1', type: 'Short Answer' }
  ]);
  const [sortBy, setSortBy] = useState('Select');
  const [isOwnOnly, setIsOwnOnly] = useState(false);
  const [responsibilityChecked, setResponsibilityChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const sections = TAB_SECTIONS_CONFIG[selectedTab] || [];
    if (sections.length > 0) {
      setSelectedSection(sections[0]);
    } else {
      setSelectedSection('General');
    }
  }, [selectedTab]);

  // Column edit states
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState('Short Answer');

  const columnTypes = [
    'Short Answer',
    'Long Answer',
    'Checkbox',
    'Employee List',
    'List: Single Answer',
    'List: Multiple Answers',
    'Currency',
    'Date'
  ];

  const handleAddColumn = () => {
    const newId = String(Date.now());
    const newCol: TableColumn = { id: newId, name: `New Column ${columns.length + 1}`, type: 'Short Answer' };
    setColumns([...columns, newCol]);
    setEditingColId(newId);
    setColName(newCol.name);
    setColType(newCol.type);
  };

  const handleSaveColumn = () => {
    if (!colName.trim()) {
      alert('Please specify column name');
      return;
    }
    setColumns(columns.map(c => c.id === editingColId ? { ...c, name: colName.trim(), type: colType } : c));
    setEditingColId(null);
  };

  const handleDeleteColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id));
    if (editingColId === id) setEditingColId(null);
  };

  const handleSaveTable = async () => {
    if (!tableName.trim()) {
      alert('Please specify a Table Name');
      return;
    }
    if (columns.length === 0) {
      alert('Please add at least one column');
      return;
    }
    if (!responsibilityChecked) {
      alert('Please check the responsibility checkbox');
      return;
    }

    setIsSaving(true);
    try {
      const sanitizedFieldName = 'ct_' + tableName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

      // Save columns definition as JSON string inside 'options'
      const body = {
        entity_type: 'employee',
        field_name: sanitizedFieldName,
        field_label_en: tableName.trim(),
        field_label_ar: tableName.trim(),
        field_type: 'custom_table', // mark as a custom table field!
        is_required: false,
        options: JSON.stringify(columns), // store column models!
        relation_target_table: selectedTab, // destination profile tab
        relation_display_column: selectedSection, // destination section
        order_index: 200,
        hidden: false,
        own_only: isOwnOnly,
        perm_level: isOwnOnly ? 4 : 0
      };

      const res = await fetch('/api/hr/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        refreshFieldOverridesCache();
        alert('Custom table created successfully!');
        onSuccess();
      } else {
        const err = await res.json();
        alert(`Failed to save custom table: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating custom table');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#fcfbfa] rounded-[32px] w-full max-w-7xl shadow-2xl overflow-hidden border border-slate-200/50 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-10 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-serif font-black text-[#1b5e20]">Add Custom Table</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column Builder */}
          <div className="lg:col-span-5 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Table Name</label>
              <input 
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g. Pension details, Certificates, etc."
                className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-800"
              />
            </div>

            {/* Profile Tab & Section Selectors */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Tab*</label>
                <select
                  value={selectedTab}
                  onChange={(e) => setSelectedTab(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none text-slate-800"
                >
                  <optgroup label="Core Profile Tabs">
                    {PROFILE_TABS_CONFIG.filter(t => t.group === 'Core Profile Tabs').map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="More Tabs ▾">
                    {PROFILE_TABS_CONFIG.filter(t => t.group === 'More Tabs ▾').map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Section*</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none text-slate-800"
                >
                  {(TAB_SECTIONS_CONFIG[selectedTab] || []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Own Only Security Protection */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={isOwnOnly}
                  onChange={(e) => setIsOwnOnly(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                />
                <div>
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    Own Only (Self-Access Only Table)
                  </span>
                  <p className="text-[10px] text-amber-800/80 font-medium mt-0.5">
                    Restrict table rows and data strictly to the employee themselves and Super Admin.
                  </p>
                </div>
              </label>
            </div>

            {/* Columns list */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                  <Table className="w-4 h-4 text-[#1b5e20]" /> Columns
                </span>
                <button 
                  onClick={handleAddColumn}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {columns.map((col, idx) => (
                  <div key={col.id} className="bg-white border border-slate-150 rounded-xl p-2.5 flex flex-col gap-2 shadow-sm">
                    {editingColId === col.id ? (
                      <div className="space-y-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Name</label>
                          <input 
                            type="text"
                            value={colName}
                            onChange={(e) => setColName(e.target.value)}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Type</label>
                          <select
                            value={colType}
                            onChange={(e) => setColType(e.target.value)}
                            className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none"
                          >
                            {columnTypes.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button onClick={() => setEditingColId(null)} className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-md text-[10px] font-bold text-slate-600">Cancel</button>
                          <button onClick={handleSaveColumn} className="px-2.5 py-1 bg-[#1b5e20] hover:bg-emerald-800 rounded-md text-[10px] font-bold text-white">Done</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-3.5 h-3.5 text-slate-300" />
                          <div>
                            <span className="text-xs font-bold text-slate-800">{idx + 1}. {col.name}</span>
                            <span className="text-[9px] font-bold text-slate-400 block uppercase">{col.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => {
                              setEditingColId(col.id);
                              setColName(col.name);
                              setColType(col.type);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteColumn(col.id)}
                            className="p-1 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Configs */}
            <div className="border-t border-slate-100 pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sort By</label>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none"
                >
                  <option>Select</option>
                  {columns.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-600 pt-1">
                <input 
                  type="checkbox"
                  checked={responsibilityChecked}
                  onChange={(e) => setResponsibilityChecked(e.target.checked)}
                  className="rounded text-[#1b5e20] focus:ring-[#1b5e20] mt-0.5"
                />
                <span>I take full responsibility for the creation of this custom table.</span>
              </label>
            </div>
          </div>

          {/* Right Live Table Preview (Matches Image 3) */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 min-h-[400px] shadow-sm space-y-4">
              <div className="flex items-start gap-2 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-[#1b5e20]">
                  <Table className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-black text-[#1b5e20]">Preview Your Table Here</h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none">
                    Please note, the data displayed is solely for preview purposes and will not appear once the table is live.
                  </p>
                </div>
              </div>

              {/* Real dynamic table rendering preview */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-[#1b5e20] tracking-wide uppercase">
                  {tableName || 'Table Title'}
                </h4>
                
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        {columns.map(c => (
                          <th key={c.id} className="px-4 py-2.5 font-black">{c.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Row 1 Dummy */}
                      <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                        {columns.map(c => (
                          <td key={c.id} className="px-4 py-3 text-slate-600 font-medium">
                            {c.type === 'Checkbox' ? (
                              <input type="checkbox" checked disabled className="rounded text-[#1b5e20]" />
                            ) : c.type === 'Date' ? (
                              '2026-07-21'
                            ) : c.type === 'Currency' ? (
                              '$120.00'
                            ) : c.type === 'Employee List' ? (
                              'Charlotte Abbott'
                            ) : (
                              '—'
                            )}
                          </td>
                        ))}
                      </tr>
                      {/* Row 2 Dummy */}
                      <tr className="border-b border-slate-50 hover:bg-slate-50/50">
                        {columns.map(c => (
                          <td key={c.id} className="px-4 py-3 text-slate-600 font-medium">
                            {c.type === 'Checkbox' ? (
                              <input type="checkbox" disabled className="rounded text-[#1b5e20]" />
                            ) : c.type === 'Date' ? (
                              '2026-01-15'
                            ) : c.type === 'Currency' ? (
                              '$4,500.00'
                            ) : c.type === 'Employee List' ? (
                              'Jennifer Caldwell'
                            ) : (
                              '—'
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveTable}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#1b5e20] text-white rounded-xl text-xs font-black hover:bg-[#123e15] transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-900/10"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// 3. REORDER & MANAGE FIELDS MODAL (Matches Image 4)
// ==============================================
interface ReorderFieldsModalProps {
  activeTab: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface StandardFieldItem {
  id: string | number;
  label: string;
  type: 'field' | 'field_group' | 'table' | 'custom_table';
  section: string;
  isStandard?: boolean;
  dbField?: CustomField;
}

export const ReorderFieldsModal: React.FC<ReorderFieldsModalProps> = ({ activeTab, onClose, onSuccess }) => {
  const [selectedTab, setSelectedTab] = useState<string>(() => normalizeTabId(activeTab));
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(false);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  
  // Modals state
  const [activeSubModal, setActiveSubModal] = useState<'add_field' | 'add_table' | 'add_section' | 'edit_field' | 'add_action' | 'edit_action' | null>(null);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [selectedActionForEdit, setSelectedActionForEdit] = useState<ActionControl | null>(null);
  
  // Action Buttons & Controls for this tab
  const { controls: actionControls, updateControl, createControl, deleteControl, refreshControls } = useActionControls(selectedTab);
  const [currentSectionForAdd, setCurrentSectionForAdd] = useState<string>('');
  
  // Custom Sections added by user in session
  const [extraSections, setExtraSections] = useState<Record<string, string[]>>({});
  const [newSectionName, setNewSectionName] = useState('');

  // Store custom field/table order per tab and section
  const [orderOverrides, setOrderOverrides] = useState<Record<string, (string | number)[]>>(() => {
    try {
      const saved = localStorage.getItem('hr_field_order_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleMoveItem = (sectionName: string, itemIdx: number, direction: 'up' | 'down') => {
    const sec = activeTabSections.find(s => s.sectionName === sectionName);
    if (!sec) return;
    const items = [...sec.items];
    const targetIdx = direction === 'up' ? itemIdx - 1 : itemIdx + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    // Swap items
    const temp = items[itemIdx];
    items[itemIdx] = items[targetIdx];
    items[targetIdx] = temp;

    const newOrder = items.map(it => it.id);
    setOrderOverrides(prev => {
      const updated = {
        ...prev,
        [`${selectedTab}__${sectionName}`]: newOrder
      };
      try {
        localStorage.setItem('hr_field_order_overrides', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const fetchFields = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/custom-fields?entity_type=employee`);
      if (res.ok) {
        const data = await res.json();
        setCustomFields(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleDeleteCustomField = async (id: number) => {
    if (!confirm('Are you sure you want to delete this field/table?')) return;
    try {
      const res = await fetch(`/api/hr/custom-fields/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refreshFieldOverridesCache();
        setCustomFields(prev => prev.filter(f => f.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) {
      alert('Please enter a section name');
      return;
    }
    const currentList = extraSections[selectedTab] || [];
    if (!currentList.includes(newSectionName.trim())) {
      setExtraSections({
        ...extraSections,
        [selectedTab]: [...currentList, newSectionName.trim()]
      });
    }
    setNewSectionName('');
    setActiveSubModal(null);
  };

  // Build current Sections & Items list for selected tab
  const activeTabSections = useMemo(() => {
    const stdSections = STANDARD_LAYOUT_BY_TAB[selectedTab] || [
      { name: 'General Information', items: [] }
    ];

    // Collect all section names (standard + extra + custom fields sections)
    const sectionNames = new Set<string>();
    stdSections.forEach(s => sectionNames.add(s.name));
    if (extraSections[selectedTab]) {
      extraSections[selectedTab].forEach(s => sectionNames.add(s));
    }
    customFields
      .filter(f => f.relation_target_table === selectedTab && f.relation_display_column)
      .forEach(f => sectionNames.add(f.relation_display_column!));

    const result: { sectionName: string; items: StandardFieldItem[] }[] = [];

    sectionNames.forEach(secName => {
      const stdSec = stdSections.find(s => s.name === secName);
      
      const stdItems: StandardFieldItem[] = stdSec
        ? stdSec.items.map(i => {
            const dbField = customFields.find(f => 
              f.field_name === i.id || 
              f.field_name === `std_${i.id}` ||
              f.field_name === i.label ||
              f.field_label_en === i.label ||
              (f.relation_target_table === selectedTab && f.field_label_en?.toLowerCase() === i.label.toLowerCase())
            );
            return {
              id: dbField ? dbField.id : i.id,
              label: dbField ? (dbField.field_label_en || i.label) : i.label,
              type: i.type,
              section: secName,
              isStandard: true,
              dbField: dbField
            };
          })
        : [];

      const usedCustomFieldIds = new Set(
        stdItems.map(item => item.dbField?.id).filter((id): id is number => !!id)
      );

      // DB custom fields for this tab & section that are NOT standard overrides
      const dbItems: StandardFieldItem[] = customFields
        .filter(f => 
          f.relation_target_table === selectedTab && 
          f.relation_display_column === secName &&
          !usedCustomFieldIds.has(f.id) &&
          !f.field_name.startsWith('std_')
        )
        .map(f => ({
          id: f.id,
          label: f.field_label_en || f.field_name,
          type: f.field_type === 'custom_table' ? 'custom_table' : 'field',
          section: secName,
          isStandard: false,
          dbField: f
        }));

      const combinedItems = [...stdItems, ...dbItems];
      const orderKey = `${selectedTab}__${secName}`;
      const customOrder = orderOverrides[orderKey];
      if (customOrder && customOrder.length > 0) {
        combinedItems.sort((a, b) => {
          const idxA = customOrder.indexOf(a.id);
          const idxB = customOrder.indexOf(b.id);
          if (idxA === -1 && idxB === -1) return 0;
          if (idxA === -1) return 1;
          if (idxB === -1) return -1;
          return idxA - idxB;
        });
      }

      result.push({
        sectionName: secName,
        items: combinedItems
      });
    });

    return result;
  }, [selectedTab, customFields, extraSections, orderOverrides]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-[#fcfbfa] rounded-[32px] w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200/50 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-serif font-black text-[#1b5e20]">Manage Fields & Tables For All Employees</h2>
            <p className="text-xs text-slate-400 font-medium">Configure profile tabs, custom fields, tables and security permissions</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto space-y-6">
          
          {/* Tab Selection Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1 w-full sm:w-auto">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Select Profile Tab ({PROFILE_TABS_CONFIG.length} Tabs Available)
                </label>
                <div className="relative">
                  <select
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(e.target.value)}
                    className="w-full sm:w-64 text-base font-serif font-black text-[#1b5e20] bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 outline-none cursor-pointer transition-all pr-8"
                  >
                    <optgroup label="Core Profile Tabs">
                      {PROFILE_TABS_CONFIG.filter(t => t.group === 'Core Profile Tabs').map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </optgroup>
                    <optgroup label="More Tabs ▾">
                      {PROFILE_TABS_CONFIG.filter(t => t.group === 'More Tabs ▾').map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Top Right + Add Dropdown */}
              <div className="relative shrink-0">
                <button 
                  onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#1b5e20]" />
                  <span>Add</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {addDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-[150] animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      onClick={() => {
                        setAddDropdownOpen(false);
                        setActiveSubModal('add_field');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <SquarePen className="w-4 h-4 text-[#1b5e20]" />
                      <span>Add Custom Field</span>
                    </button>
                    <button
                      onClick={() => {
                        setAddDropdownOpen(false);
                        setActiveSubModal('add_table');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 border-t border-slate-50 cursor-pointer"
                    >
                      <Table className="w-4 h-4 text-[#1b5e20]" />
                      <span>Add Custom Table</span>
                    </button>
                    <button
                      onClick={() => {
                        setAddDropdownOpen(false);
                        setActiveSubModal('add_section');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 border-t border-slate-50 cursor-pointer"
                    >
                      <FolderPlus className="w-4 h-4 text-[#1b5e20]" />
                      <span>Add Custom Section</span>
                    </button>
                    <button
                      onClick={() => {
                        setAddDropdownOpen(false);
                        setSelectedActionForEdit(null);
                        setActiveSubModal('add_action');
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 border-t border-slate-50 cursor-pointer"
                    >
                      <MousePointerClick className="w-4 h-4 text-[#1b5e20]" />
                      <span>+ Add Action / Button Control</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick-switch Tab Pills for all 14 Tabs */}
            <div className="border-t border-slate-100 pt-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {PROFILE_TABS_CONFIG.map(t => {
                  const isActive = selectedTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTab(t.id)}
                      className={cn(
                        "text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer whitespace-nowrap",
                        isActive
                          ? "bg-[#1b5e20] text-white font-black shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reorder Subtitle Instruction */}
          <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5 px-1">
            <ChevronsUpDown className="w-4 h-4 text-slate-400" />
            <span>Information sections and fields on the <strong className="text-slate-700 capitalize">{PROFILE_TABS_CONFIG.find(t => t.id === selectedTab)?.label || selectedTab}</strong> Tab</span>
          </div>

          {/* Sections & Fields Listing */}
          {loading ? (
            <div className="text-center p-12 text-slate-400 font-bold text-xs">Loading fields...</div>
          ) : (
            <div className="space-y-8">
              {activeTabSections.map((section, secIdx) => (
                <div key={secIdx} className="space-y-3">
                  
                  {/* Section Title */}
                  <div className="flex justify-between items-center px-1">
                    <h3 className="text-base font-bold text-[#1b5e20]">
                      {section.sectionName}
                    </h3>
                  </div>

                  {/* Section Items Cards */}
                  <div className="space-y-2.5">
                    {section.items.length === 0 ? (
                      <div className="text-center py-4 px-6 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-medium">
                        No fields in this section yet. Click Add to insert a new field!
                      </div>
                    ) : (
                      section.items.map((item, itemIdx) => (
                        <div 
                          key={item.id} 
                          className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:border-slate-300 transition-all group"
                        >
                          {/* Left: Grip + Name + Type Tag */}
                          <div className="flex items-center gap-3">
                            <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0 cursor-grab" />
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800">
                                {item.label}
                              </span>

                              {/* Type badge */}
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-500 text-[11px] font-semibold">
                                {item.type === 'field_group' ? (
                                  <>
                                    <SquarePen className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Field Group</span>
                                  </>
                                ) : item.type === 'custom_table' || item.type === 'table' ? (
                                  <>
                                    <Table className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Table</span>
                                  </>
                                ) : (
                                  <>
                                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Field</span>
                                  </>
                                )}
                              </span>

                              {/* Own Only Badge */}
                              {(item.dbField?.own_only || item.dbField?.perm_level === 4) && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
                                  <Lock className="w-3 h-3 text-rose-600" />
                                  Own Only
                                </span>
                              )}

                              {/* Frappe/ERPNext Perm Level Badge */}
                              <span className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition-all",
                                (item.dbField?.perm_level || 0) === 0 ? "bg-slate-100/80 text-slate-700 border-slate-200" :
                                (item.dbField?.perm_level || 0) === 1 ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                                (item.dbField?.perm_level || 0) === 2 ? "bg-purple-50 text-purple-700 border-purple-200" :
                                (item.dbField?.perm_level || 0) === 3 ? "bg-amber-50 text-amber-800 border-amber-200" :
                                "bg-rose-50 text-rose-700 border-rose-200"
                              )}>
                                <Lock className="w-3 h-3" />
                                Perm Level {item.dbField?.perm_level ?? 0}
                              </span>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Reorder Up / Down Controls */}
                            <div className="flex items-center gap-1 mr-1">
                              <button
                                type="button"
                                onClick={() => handleMoveItem(section.sectionName, itemIdx, 'up')}
                                disabled={itemIdx === 0}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveItem(section.sectionName, itemIdx, 'down')}
                                disabled={itemIdx === section.items.length - 1}
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <button
                              onClick={() => {
                                if (item.dbField) {
                                  setEditingField(item.dbField);
                                } else {
                                  // Standard field override or new custom field record
                                  const existing = customFields.find(f => 
                                    f.field_name === String(item.id) || 
                                    f.field_name === `std_${item.id}` ||
                                    (f.relation_target_table === selectedTab && f.field_label_en?.toLowerCase() === item.label.toLowerCase())
                                  );
                                  if (existing) {
                                    setEditingField(existing);
                                  } else {
                                    setEditingField({
                                      id: 0,
                                      company_id: 1,
                                      entity_type: 'employee',
                                      field_name: String(item.id).startsWith('std_') ? String(item.id) : `std_${item.id}`,
                                      field_label_en: item.label,
                                      field_label_ar: item.label,
                                      field_type: item.type === 'custom_table' ? 'custom_table' : 'text',
                                      is_required: false,
                                      options: null,
                                      relation_target_table: selectedTab,
                                      relation_display_column: item.section,
                                      perm_level: 0,
                                      read_only: false,
                                      hidden: false,
                                      allow_on_submit: false,
                                      own_only: false
                                    });
                                  }
                                }
                                setActiveSubModal('edit_field');
                              }}
                              className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer"
                              title="Edit Field Security & Permissions"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (item.dbField) {
                                  handleDeleteCustomField(item.dbField.id);
                                } else {
                                  alert(`Standard field "${item.label}" archived.`);
                                }
                              }}
                              className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete or Archive Field"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Associated Action & Button Controls for this Section */}
                  {(() => {
                    const sectionActions = actionControls.filter(a => {
                      if (a.tab_id !== selectedTab) return false;
                      const aSec = (a.section_name || '').toLowerCase().trim();
                      const sSec = (section.sectionName || '').toLowerCase().trim();

                      // 1. Direct match
                      if (aSec === sSec) return true;

                      // 2. Partial match
                      if (aSec && sSec && (aSec.includes(sSec) || sSec.includes(aSec))) return true;

                      // 3. Single-section tab fallback
                      if (activeTabSections.length === 1) return true;

                      // 4. Catch unmatched actions in the first section
                      if (secIdx === 0) {
                        const matchesAnyOther = activeTabSections.some((otherSec, idx) => {
                          if (idx === 0) return false;
                          const otherName = (otherSec.sectionName || '').toLowerCase().trim();
                          return otherName === aSec || (aSec && otherName && (aSec.includes(otherName) || otherName.includes(aSec)));
                        });
                        if (!matchesAnyOther) return true;
                      }

                      return false;
                    });

                    return (
                      <div className="mt-3.5 pt-3 border-t border-slate-100/90 space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <MousePointerClick className="w-3.5 h-3.5 text-[#1b5e20]" />
                            <span>Action Buttons & Controls ({sectionActions.length})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedActionForEdit(null);
                              setCurrentSectionForAdd(section.sectionName);
                              setActiveSubModal('add_action');
                            }}
                            className="text-[10px] font-bold text-[#1b5e20] hover:text-[#123e15] flex items-center gap-1 cursor-pointer bg-emerald-50/80 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all"
                            title={`Add new action button into ${section.sectionName}`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Add Action</span>
                          </button>
                        </div>

                        {sectionActions.length === 0 ? (
                          <div className="bg-slate-50/40 border border-dashed border-slate-200 rounded-xl p-3 text-center">
                            <span className="text-[11px] font-medium text-slate-400">
                              No action buttons in this section yet. Click "+ Add Action" above to configure buttons for this section.
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {sectionActions.map((action) => (
                              <div
                                key={action.id}
                                className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:border-[#1b5e20]/40 hover:bg-white transition-all group"
                              >
                                {/* Left: Icon + Label + Badges */}
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#1b5e20] flex items-center justify-center shrink-0 shadow-2xs">
                                    <MousePointerClick className="w-4 h-4" />
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                                    <span className="text-xs font-bold text-slate-800 truncate">
                                      {action.label_en}
                                    </span>
                                    {action.label_ar && action.label_ar !== action.label_en && (
                                      <span className="text-[11px] font-medium text-slate-400" dir="rtl">
                                        ({action.label_ar})
                                      </span>
                                    )}

                                    {/* Type Badge */}
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[#1b5e20] text-[10px] font-black">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      Action / Button
                                    </span>

                                    {/* State Badge */}
                                    {action.state === 'active' && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black shadow-2xs">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        Visible & Active
                                      </span>
                                    )}
                                    {action.state === 'disabled' && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black shadow-2xs">
                                        <Ban className="w-3 h-3 text-amber-600" />
                                        Disabled (Greyed Out)
                                      </span>
                                    )}
                                    {action.state === 'hidden' && (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-black shadow-2xs">
                                        <EyeOff className="w-3 h-3 text-rose-600" />
                                        Hidden
                                      </span>
                                    )}

                                    {/* Permission Scope Badge */}
                                    {action.permission_scope === 'super_admin' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                                        <Shield className="w-2.5 h-2.5" />
                                        Super Admin Only
                                      </span>
                                    )}
                                    {action.permission_scope === 'direct_manager' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                        <UserCheck className="w-2.5 h-2.5" />
                                        Direct Manager
                                      </span>
                                    )}
                                    {action.permission_scope === 'self' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                                        <User className="w-2.5 h-2.5" />
                                        Self
                                      </span>
                                    )}
                                    {action.permission_scope === 'everyone' && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold">
                                        <Globe className="w-2.5 h-2.5" />
                                        Everyone
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right: Edit Button */}
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedActionForEdit(action);
                                      setActiveSubModal('edit_action');
                                    }}
                                    className="p-1.5 rounded-full border border-slate-200 text-slate-500 hover:text-[#1b5e20] hover:border-emerald-200 hover:bg-emerald-50 transition-all cursor-pointer"
                                    title="Configure Button & Action Security"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="px-8 py-2.5 bg-[#1b5e20] text-white rounded-full text-xs font-black hover:bg-[#123e15] transition-all cursor-pointer shadow-md shadow-emerald-900/10"
          >
            Done
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      {activeSubModal === 'add_field' && (
        <AddFieldModal 
          activeTab={selectedTab} 
          onClose={() => setActiveSubModal(null)} 
          onSuccess={() => {
            setActiveSubModal(null);
            fetchFields();
          }} 
        />
      )}

      {activeSubModal === 'add_table' && (
        <AddTableModal 
          activeTab={selectedTab} 
          onClose={() => setActiveSubModal(null)} 
          onSuccess={() => {
            setActiveSubModal(null);
            fetchFields();
          }} 
        />
      )}

      {activeSubModal === 'add_section' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800">Add New Custom Section</h3>
              <button onClick={() => setActiveSubModal(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Section Name</label>
              <input 
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g. Financial Certificates, Additional Documents"
                className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1b5e20]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveSubModal(null)} className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">Cancel</button>
              <button onClick={handleAddSection} className="px-5 py-2 bg-[#1b5e20] text-white rounded-xl text-xs font-bold">Add Section</button>
            </div>
          </div>
        </div>
      )}

      {activeSubModal === 'edit_field' && editingField && (
        <EditFieldModal 
          field={editingField}
          onClose={() => {
            setActiveSubModal(null);
            setEditingField(null);
          }}
          onSuccess={() => {
            setActiveSubModal(null);
            setEditingField(null);
            fetchFields();
          }}
        />
      )}

      {(activeSubModal === 'add_action' || activeSubModal === 'edit_action') && (
        <ConfigureButtonSecurityModal
          control={selectedActionForEdit}
          selectedTab={selectedTab}
          selectedSection={selectedActionForEdit?.section_name || currentSectionForAdd || activeTabSections[0]?.sectionName || 'General'}
          availableSections={activeTabSections.map(s => s.sectionName)}
          onClose={() => {
            setActiveSubModal(null);
            setSelectedActionForEdit(null);
            setCurrentSectionForAdd('');
          }}
          onSave={async (data) => {
            if (selectedActionForEdit) {
              await updateControl(selectedActionForEdit.id, data);
            } else {
              await createControl(data as any);
            }
            await refreshControls();
          }}
          onDelete={selectedActionForEdit ? async (id) => {
            await deleteControl(id);
            await refreshControls();
          } : undefined}
        />
      )}
    </div>
  );
};

// Helper Edit Field Modal Component
interface EditFieldModalProps {
  field: CustomField;
  onClose: () => void;
  onSuccess: () => void;
}

type FieldAccessMode = 'editable' | 'readonly' | 'hidden';

const EditFieldModal: React.FC<EditFieldModalProps> = ({ field, onClose, onSuccess }) => {
  const [labelEn, setLabelEn] = useState(field.field_label_en || '');
  const [labelAr, setLabelAr] = useState(field.field_label_ar || '');
  const [section, setSection] = useState(field.relation_display_column || 'Basic Information');
  
  // Field access mode: Mutually exclusive 'editable' | 'readonly' | 'hidden'
  const initialMode: FieldAccessMode = field.hidden ? 'hidden' : (field.read_only ? 'readonly' : 'editable');
  const [accessMode, setAccessMode] = useState<FieldAccessMode>(initialMode);
  
  const [isRequired, setIsRequired] = useState(field.is_required || false);
  const [maskValue, setMaskValue] = useState<boolean>(field.mask_value || false);
  const [optionsText, setOptionsText] = useState(field.options || '');
  const [permLevel, setPermLevel] = useState<number>(field.perm_level ?? 0);
  const [ownOnly, setOwnOnly] = useState<boolean>(field.own_only || field.perm_level === 4);
  const [allowOnSubmit, setAllowOnSubmit] = useState<boolean>(field.allow_on_submit || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!labelEn.trim()) {
      alert('Field Label is required');
      return;
    }
    setIsSaving(true);
    try {
      const isNewOverride = field.id === 0;
      const url = isNewOverride ? '/api/hr/custom-fields' : `/api/hr/custom-fields/${field.id}`;
      const method = isNewOverride ? 'POST' : 'PUT';
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

      const payload = {
        ...field,
        field_label_en: labelEn.trim(),
        field_label_ar: labelAr.trim() || labelEn.trim(),
        relation_display_column: section,
        is_required: accessMode === 'editable' ? isRequired : false,
        options: optionsText,
        perm_level: ownOnly ? 4 : Number(permLevel),
        read_only: accessMode === 'readonly',
        hidden: accessMode === 'hidden',
        allow_on_submit: allowOnSubmit,
        own_only: ownOnly,
        mask_value: maskValue
      };

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        refreshFieldOverridesCache();
        alert('Field settings & Permission Level saved successfully!');
        onSuccess();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to update field: ${errData.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving changes to database');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-xl text-[#1b5e20]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Edit Field & Permission Level</h3>
              <p className="text-[11px] text-slate-400 font-medium">Configure display label, permission level and access controls</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase mb-1">Field Name (English)</label>
            <input 
              type="text"
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase mb-1">Field Name (Arabic)</label>
            <input 
              type="text"
              value={labelAr}
              onChange={(e) => setLabelAr(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-900 uppercase mb-1">Section</label>
            <input 
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {field.field_type === 'select' && (
            <div>
              <label className="block text-xs font-black text-slate-900 uppercase mb-1">Dropdown Options (comma separated)</label>
              <input 
                type="text"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] placeholder:text-slate-400 shadow-2xs"
              />
            </div>
          )}

          {/* Own Only Dedicated Permission Setting */}
          <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200/80 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input 
                type="checkbox"
                checked={ownOnly}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOwnOnly(checked);
                  if (checked) {
                    setPermLevel(4);
                  } else if (permLevel === 4) {
                    setPermLevel(0);
                  }
                }}
                className="rounded text-rose-600 focus:ring-rose-500 mt-0.5"
              />
              <div>
                <span className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-700" />
                  Own Only (Self-Access Only)
                </span>
                <p className="text-[11px] text-rose-800/80 font-medium mt-0.5">
                  Restricts visibility so that only the employee themselves (or Super Admin) can view or modify this field. Regular managers and peers cannot access it.
                </p>
              </div>
            </label>
          </div>

          {/* Permission Level Control */}
          <div className="space-y-2 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#1b5e20] flex items-center gap-1.5 uppercase tracking-wide">
                <Lock className="w-3.5 h-3.5 text-[#1b5e20]" />
                Permission Level (Perm Level)
              </label>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Level 0 - 4
              </span>
            </div>

            <select
              value={permLevel}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPermLevel(val);
                if (val === 4) {
                  setOwnOnly(true);
                } else {
                  setOwnOnly(false);
                }
              }}
              className="w-full text-xs font-black bg-white border border-emerald-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3.5 py-2.5 outline-none text-slate-800 shadow-xs cursor-pointer"
            >
              <option value={0}>Level 0 - Default Document Level (General / Standard)</option>
              <option value={1}>Level 1 - Manager & Reviewer Field Level (Supervisors & Evaluation)</option>
              <option value={2}>Level 2 - Financial & Sensitive Field Level (Salary & Banking)</option>
              <option value={3}>Level 3 - Super Admin & Confidential Level (Executive & Compliance)</option>
              <option value={4}>Level 4 - Owner Only (Strictly Self-Access & System Admin)</option>
            </select>

            <p className="text-[11px] text-slate-600 leading-snug font-medium">
              Level 0 fields follow the document permissions. Higher levels (1, 2, 3) require roles with matching or higher permission level. Level 4 limits access strictly to the owner.
            </p>
          </div>

          {/* Security & Access Mode (Radio Buttons / Segmented Control) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600">
                Field Security & Access Mode
              </label>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Mutually Exclusive
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* 1. Editable */}
              <label 
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all text-center select-none",
                  accessMode === 'editable'
                    ? "bg-emerald-50/80 border-[#1b5e20] text-[#1b5e20] shadow-xs ring-2 ring-[#1b5e20]/15"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                )}
              >
                <input 
                  type="radio"
                  name="fieldAccessMode"
                  value="editable"
                  checked={accessMode === 'editable'}
                  onChange={() => setAccessMode('editable')}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={cn(
                    "w-3 h-3 rounded-full border flex items-center justify-center transition-all",
                    accessMode === 'editable' ? "border-[#1b5e20] bg-white" : "border-slate-400 bg-white"
                  )}>
                    {accessMode === 'editable' && <span className="w-1.5 h-1.5 rounded-full bg-[#1b5e20]" />}
                  </span>
                  <span className="text-xs font-black text-slate-900">Editable</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 leading-tight">Can view & edit</span>
              </label>

              {/* 2. Read-Only */}
              <label 
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all text-center select-none",
                  accessMode === 'readonly'
                    ? "bg-blue-50/80 border-blue-600 text-blue-800 shadow-xs ring-2 ring-blue-600/15"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                )}
              >
                <input 
                  type="radio"
                  name="fieldAccessMode"
                  value="readonly"
                  checked={accessMode === 'readonly'}
                  onChange={() => setAccessMode('readonly')}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={cn(
                    "w-3 h-3 rounded-full border flex items-center justify-center transition-all",
                    accessMode === 'readonly' ? "border-blue-600 bg-white" : "border-slate-400 bg-white"
                  )}>
                    {accessMode === 'readonly' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                  </span>
                  <span className="text-xs font-black text-slate-900">Read-Only</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 leading-tight">View only mode</span>
              </label>

              {/* 3. Hidden */}
              <label 
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all text-center select-none",
                  accessMode === 'hidden'
                    ? "bg-rose-50/80 border-rose-600 text-rose-800 shadow-xs ring-2 ring-rose-600/15"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                )}
              >
                <input 
                  type="radio"
                  name="fieldAccessMode"
                  value="hidden"
                  checked={accessMode === 'hidden'}
                  onChange={() => setAccessMode('hidden')}
                  className="sr-only"
                />
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={cn(
                    "w-3 h-3 rounded-full border flex items-center justify-center transition-all",
                    accessMode === 'hidden' ? "border-rose-600 bg-white" : "border-slate-400 bg-white"
                  )}>
                    {accessMode === 'hidden' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />}
                  </span>
                  <span className="text-xs font-black text-slate-900">Hidden</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 leading-tight">Completely hidden</span>
              </label>
            </div>
          </div>

          {/* Behavior & Sensitivity Flags */}
          <div className="space-y-2 pt-1">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600">
              Behavior & Sensitivity Flags
            </label>

            <div className="space-y-2">
              {/* Required - Only active when Editable */}
              <label 
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-2xl border transition-all text-xs select-none",
                  accessMode === 'editable'
                    ? "bg-white border-slate-200 cursor-pointer hover:bg-slate-50 text-slate-900"
                    : "bg-slate-100/70 border-slate-200/60 opacity-60 cursor-not-allowed text-slate-400"
                )}
              >
                <input 
                  type="checkbox"
                  disabled={accessMode !== 'editable'}
                  checked={accessMode === 'editable' && isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="rounded text-[#1b5e20] focus:ring-[#1b5e20] mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900">Required</span>
                    {accessMode !== 'editable' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        Only active in Editable mode
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Field must be filled in before the employee profile can be saved.
                  </p>
                </div>
              </label>

              {/* Mask Value (Sensitive Data) */}
              <label className="flex items-start gap-2.5 p-3 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 cursor-pointer hover:bg-indigo-50 transition-all text-xs select-none">
                <input 
                  type="checkbox"
                  checked={maskValue}
                  onChange={(e) => setMaskValue(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-extrabold text-indigo-950">Mask Value (Sensitive Data)</span>
                    <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded border border-indigo-200">
                      ***
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-900/80 font-medium mt-0.5">
                    Partially masks sensitive data (such as salaries, insurance and national IDs) with *** for users without Super Admin permission.
                  </p>
                </div>
              </label>

              {/* Allow on Submit */}
              <label className="flex items-start gap-2.5 p-3 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all text-xs select-none">
                <input 
                  type="checkbox"
                  checked={allowOnSubmit}
                  onChange={(e) => setAllowOnSubmit(e.target.checked)}
                  className="rounded text-[#1b5e20] focus:ring-[#1b5e20] mt-0.5"
                />
                <div className="flex-1">
                  <span className="font-extrabold text-slate-900">Allow on Submit</span>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Permits editing this field during workflow or document submission even if otherwise restricted.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer">Cancel</button>
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-[#1b5e20] hover:bg-[#123e15] text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm">
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

