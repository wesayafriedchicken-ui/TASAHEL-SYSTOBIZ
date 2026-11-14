import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FileSpreadsheet,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Save,
  Download,
  Check,
  X,
  ChevronDown,
  RefreshCw,
  Trash2,
  Building2,
  DollarSign,
  Laptop,
  GraduationCap,
  Calendar,
  Mail,
  Phone,
  User,
  Briefcase,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ShieldAlert,
  CreditCard,
  MapPin,
  Clock,
  HeartPulse,
  BadgeCheck,
  Layers,
  Filter,
  Palmtree,
  CalendarCheck,
  History,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';

// --- Column Definition Interface ---
export interface ColumnDef {
  key: string;
  label: string;
  category: 
    | 'primary' 
    | 'contact' 
    | 'identity' 
    | 'emergency' 
    | 'financials' 
    | 'banking' 
    | 'attendance' 
    | 'leaves_accrual' 
    | 'assets_records';
  type: 'text' | 'number' | 'date' | 'select' | 'action';
  width: string;
  editable: boolean;
  options?: { value: string | number; label: string }[];
  align?: 'left' | 'center' | 'right';
  badgeStyle?: boolean;
}

// --- All Database Columns for hr_employees Table & Adjust Leave Balances ---
export const ALL_COLUMNS: ColumnDef[] = [
  // ==========================================
  // 1. Primary Profile & Job (hr_employees)
  // ==========================================
  { key: 'name', label: 'Full Name', category: 'primary', type: 'text', width: 'w-56 min-w-[220px]', editable: true, align: 'left' },
  { key: 'employee_id', label: 'Employee ID / Code', category: 'primary', type: 'text', width: 'w-40 min-w-[160px]', editable: true, align: 'center' },
  { key: 'first_name', label: 'First Name', category: 'primary', type: 'text', width: 'w-36 min-w-[140px]', editable: true, align: 'left' },
  { key: 'middle_name', label: 'Middle Name', category: 'primary', type: 'text', width: 'w-36 min-w-[140px]', editable: true, align: 'left' },
  { key: 'last_name', label: 'Last Name', category: 'primary', type: 'text', width: 'w-36 min-w-[140px]', editable: true, align: 'left' },
  { key: 'preferred_name', label: 'Preferred Name', category: 'primary', type: 'text', width: 'w-36 min-w-[140px]', editable: true, align: 'left' },
  { key: 'job_title', label: 'Job Title', category: 'primary', type: 'text', width: 'w-48 min-w-[190px]', editable: true, align: 'left' },
  { key: 'department', label: 'Department', category: 'primary', type: 'select', width: 'w-48 min-w-[190px]', editable: true, align: 'left' },
  { key: 'position', label: 'Position', category: 'primary', type: 'text', width: 'w-44 min-w-[170px]', editable: true, align: 'left' },
  { key: 'job_grade', label: 'Job Grade', category: 'primary', type: 'text', width: 'w-32 min-w-[120px]', editable: true, align: 'center' },
  { key: 'team_name', label: 'Team Name', category: 'primary', type: 'text', width: 'w-40 min-w-[160px]', editable: true, align: 'left' },
  { key: 'manager_name', label: 'Reporting Manager', category: 'primary', type: 'text', width: 'w-48 min-w-[190px]', editable: true, align: 'left' },
  { key: 'reporting_to', label: 'Manager User ID', category: 'primary', type: 'number', width: 'w-36 min-w-[140px]', editable: true, align: 'center' },
  { key: 'assigned_shift_id', label: 'Assigned Shift ID', category: 'primary', type: 'number', width: 'w-36 min-w-[140px]', editable: true, align: 'center' },
  { 
    key: 'status', 
    label: 'Employment Status', 
    category: 'primary', 
    type: 'select', 
    width: 'w-36 min-w-[140px]', 
    editable: true, 
    align: 'center',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'on_leave', label: 'On Leave' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'terminated', label: 'Terminated' },
      { value: 'suspended', label: 'Suspended' }
    ]
  },
  { 
    key: 'employment_status', 
    label: 'HR Service Status', 
    category: 'primary', 
    type: 'select', 
    width: 'w-36 min-w-[140px]', 
    editable: true, 
    align: 'center',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'probation', label: 'Probation' },
      { value: 'resigned', label: 'Resigned' },
      { value: 'terminated', label: 'Terminated' }
    ]
  },
  { 
    key: 'contract_type', 
    label: 'Contract Type', 
    category: 'primary', 
    type: 'select', 
    width: 'w-36 min-w-[140px]', 
    editable: true, 
    align: 'center',
    options: [
      { value: 'Full-time', label: 'Full-time' },
      { value: 'Part-time', label: 'Part-time' },
      { value: 'Contractor', label: 'Contractor' },
      { value: 'Internship', label: 'Internship' },
      { value: 'Probation', label: 'Probation' }
    ]
  },

  // ==========================================
  // 2. Adjust Leave Balances & Accrual (NEW DEDICATED SHEET)
  // ==========================================
  { key: 'eligibility_date', label: 'Eligibility Date', category: 'leaves_accrual', type: 'date', width: 'w-36 min-w-[140px]', editable: true, align: 'center' },
  { key: 'eligibility_status', label: 'Eligibility Status', category: 'leaves_accrual', type: 'text', width: 'w-36 min-w-[140px]', editable: false, align: 'center', badgeStyle: true },
  { key: 'worked_months', label: 'Worked Months', category: 'leaves_accrual', type: 'number', width: 'w-36 min-w-[140px]', editable: false, align: 'center' },
  { key: 'accrual_period', label: 'Accrual Period', category: 'leaves_accrual', type: 'text', width: 'w-44 min-w-[170px]', editable: false, align: 'center' },
  { key: 'accrued_balance', label: 'Accrued Balance', category: 'leaves_accrual', type: 'number', width: 'w-40 min-w-[150px]', editable: true, align: 'right' },
  { key: 'consumed_balance', label: 'Consumed Balance', category: 'leaves_accrual', type: 'number', width: 'w-40 min-w-[150px]', editable: false, align: 'right' },
  { key: 'remaining_balance', label: 'Remaining Balance', category: 'leaves_accrual', type: 'number', width: 'w-44 min-w-[160px]', editable: true, align: 'right' },
  { key: 'balance_history', label: 'Balance History', category: 'leaves_accrual', type: 'action', width: 'w-44 min-w-[160px]', editable: false, align: 'center' },

  // ==========================================
  // 3. Contact & Location (hr_employees)
  // ==========================================
  { key: 'work_email', label: 'Work Email', category: 'contact', type: 'text', width: 'w-56 min-w-[220px]', editable: true, align: 'left' },
  { key: 'personal_email', label: 'Personal Email', category: 'contact', type: 'text', width: 'w-56 min-w-[220px]', editable: true, align: 'left' },
  { key: 'mobile_phone', label: 'Mobile Phone', category: 'contact', type: 'text', width: 'w-40 min-w-[160px]', editable: true, align: 'left' },
  { key: 'phone', label: 'Work Phone', category: 'contact', type: 'text', width: 'w-40 min-w-[160px]', editable: true, align: 'left' },
  { key: 'home_phone', label: 'Home Phone', category: 'contact', type: 'text', width: 'w-40 min-w-[160px]', editable: true, align: 'left' },
  { key: 'extension_number', label: 'Extension Number', category: 'contact', type: 'text', width: 'w-36 min-w-[130px]', editable: true, align: 'center' },
  { key: 'work_location', label: 'Work Location', category: 'contact', type: 'text', width: 'w-40 min-w-[160px]', editable: true, align: 'left' },
  { key: 'address', label: 'Address', category: 'contact', type: 'text', width: 'w-64 min-w-[240px]', editable: true, align: 'left' },
  { key: 'street_1', label: 'Street Line 1', category: 'contact', type: 'text', width: 'w-52 min-w-[200px]', editable: true, align: 'left' },
  { key: 'street_2', label: 'Street Line 2', category: 'contact', type: 'text', width: 'w-48 min-w-[180px]', editable: true, align: 'left' },
  { key: 'city', label: 'City', category: 'contact', type: 'text', width: 'w-36 min-w-[140px]', editable: true, align: 'left' },
  { key: 'county', label: 'County / State', category: 'contact', type: 'text', width: 'w-36 min-w-[140px]', editable: true, align: 'left' },
  { key: 'country', label: 'Country', category: 'contact', type: 'text', width: 'w-36 min-w-[140px]', editable: true, align: 'left' },
  { key: 'postcode', label: 'Postal Code', category: 'contact', type: 'text', width: 'w-32 min-w-[120px]', editable: true, align: 'center' },

  // ==========================================
  // 4. Personal & Identity (hr_employees)
  // ==========================================
  { key: 'national_id', label: 'National ID', category: 'identity', type: 'text', width: 'w-44 min-w-[170px]', editable: true, align: 'left' },
  { key: 'id_number', label: 'ID Document Number', category: 'identity', type: 'text', width: 'w-44 min-w-[170px]', editable: true, align: 'left' },
  { key: 'passport_number', label: 'Passport Number', category: 'identity', type: 'text', width: 'w-40 min-w-[160px]', editable: true, align: 'left' },
  { 
    key: 'gender', 
    label: 'Gender', 
    category: 'identity', 
    type: 'select', 
    width: 'w-28 min-w-[110px]', 
    editable: true, 
    align: 'center',
    options: [
      { value: 'Male', label: 'Male' },
      { value: 'Female', label: 'Female' }
    ]
  },
  { key: 'nationality', label: 'Nationality', category: 'identity', type: 'text', width: 'w-36 min-w-[140px]', editable: true, align: 'left' },
  { 
    key: 'marital_status', 
    label: 'Marital Status', 
    category: 'identity', 
    type: 'select', 
    width: 'w-32 min-w-[120px]', 
    editable: true, 
    align: 'center',
    options: [
      { value: 'Single', label: 'Single' },
      { value: 'Married', label: 'Married' },
      { value: 'Divorced', label: 'Divorced' },
      { value: 'Widowed', label: 'Widowed' }
    ]
  },
  { key: 'date_of_birth', label: 'Date of Birth', category: 'identity', type: 'date', width: 'w-36 min-w-[140px]', editable: true, align: 'center' },
  { key: 'shirt_size', label: 'Shirt Size', category: 'identity', type: 'text', width: 'w-28 min-w-[110px]', editable: true, align: 'center' },

  // ==========================================
  // 5. Emergency Contacts (hr_employees)
  // ==========================================
  { key: 'emergency_contact_name', label: 'Emergency Contact Name', category: 'emergency', type: 'text', width: 'w-48 min-w-[190px]', editable: true, align: 'left' },
  { key: 'emergency_contact_phone', label: 'Emergency Phone', category: 'emergency', type: 'text', width: 'w-40 min-w-[160px]', editable: true, align: 'left' },
  { key: 'emergency_contact_relation', label: 'Emergency Relationship', category: 'emergency', type: 'text', width: 'w-40 min-w-[160px]', editable: true, align: 'left' },
  { key: 'emergency_contact_address', label: 'Emergency Address', category: 'emergency', type: 'text', width: 'w-56 min-w-[220px]', editable: true, align: 'left' },

  // ==========================================
  // 6. Financials & Compensation (hr_employees)
  // ==========================================
  { key: 'salary_base', label: 'Basic Salary', category: 'financials', type: 'number', width: 'w-36 min-w-[140px]', editable: true, align: 'right' },
  { key: 'currency', label: 'Currency', category: 'financials', type: 'text', width: 'w-28 min-w-[100px]', editable: true, align: 'center' },
  { key: 'allowances', label: 'Allowances', category: 'financials', type: 'number', width: 'w-36 min-w-[140px]', editable: true, align: 'right' },
  { key: 'total_bonuses', label: 'Total Bonuses', category: 'financials', type: 'number', width: 'w-36 min-w-[140px]', editable: true, align: 'right' },
  { key: 'potential_bonus_percent', label: 'Bonus Percent (%)', category: 'financials', type: 'number', width: 'w-36 min-w-[130px]', editable: true, align: 'right' },
  { key: 'potential_bonus_amount', label: 'Potential Bonus Amt', category: 'financials', type: 'number', width: 'w-40 min-w-[150px]', editable: true, align: 'right' },
  { key: 'shift_allowances', label: 'Shift Allowances', category: 'financials', type: 'number', width: 'w-40 min-w-[150px]', editable: true, align: 'right' },
  { key: 'equities', label: 'Equities (Stock Units)', category: 'financials', type: 'number', width: 'w-36 min-w-[140px]', editable: true, align: 'right' },
  { key: 'kpi_amount', label: 'KPI Target Amount', category: 'financials', type: 'number', width: 'w-40 min-w-[150px]', editable: true, align: 'right' },
  { key: 'kpi_frequency', label: 'KPI Frequency', category: 'financials', type: 'text', width: 'w-36 min-w-[130px]', editable: true, align: 'center' },
  { key: 'kpi_payout_mechanism', label: 'KPI Payout Method', category: 'financials', type: 'text', width: 'w-40 min-w-[150px]', editable: true, align: 'left' },
  { key: 'kpi_payout_date', label: 'KPI Payout Date', category: 'financials', type: 'date', width: 'w-36 min-w-[140px]', editable: true, align: 'center' },

  // ==========================================
  // 7. Banking & Payroll (hr_employees)
  // ==========================================
  { key: 'bank_name', label: 'Bank Name', category: 'banking', type: 'text', width: 'w-44 min-w-[170px]', editable: true, align: 'left' },
  { key: 'account_number', label: 'Account Number', category: 'banking', type: 'text', width: 'w-48 min-w-[190px]', editable: true, align: 'left' },
  { key: 'iban', label: 'IBAN', category: 'banking', type: 'text', width: 'w-56 min-w-[220px]', editable: true, align: 'left' },
  { key: 'swift_code', label: 'SWIFT / BIC', category: 'banking', type: 'text', width: 'w-36 min-w-[140px]', editable: true, align: 'center' },
  { key: 'bank_details_copy', label: 'Bank Account Notes', category: 'banking', type: 'text', width: 'w-48 min-w-[190px]', editable: true, align: 'left' },

  // ==========================================
  // 8. Contract & Time-Off / Attendance (hr_employees)
  // ==========================================
  { key: 'hire_date', label: 'Hire Date', category: 'attendance', type: 'date', width: 'w-36 min-w-[140px]', editable: true, align: 'center' },
  { key: 'contract_start_date', label: 'Contract Start Date', category: 'attendance', type: 'date', width: 'w-40 min-w-[150px]', editable: true, align: 'center' },
  { key: 'contract_end_date', label: 'Contract End Date', category: 'attendance', type: 'date', width: 'w-40 min-w-[150px]', editable: true, align: 'center' },
  { key: 'vacation_balance', label: 'Vacation Balance (Days)', category: 'attendance', type: 'number', width: 'w-44 min-w-[160px]', editable: true, align: 'center' },
  { key: 'sick_leave_balance', label: 'Sick Leave Balance', category: 'attendance', type: 'number', width: 'w-40 min-w-[150px]', editable: true, align: 'center' },
  { key: 'bereavement_used', label: 'Bereavement Days Used', category: 'attendance', type: 'number', width: 'w-44 min-w-[160px]', editable: true, align: 'center' },
  { 
    key: 'attendance_method', 
    label: 'Attendance Method', 
    category: 'attendance', 
    type: 'select', 
    width: 'w-40 min-w-[150px]', 
    editable: true, 
    align: 'center',
    options: [
      { value: 'Login System', label: 'Login System' },
      { value: 'Fingerprint', label: 'Fingerprint' },
      { value: 'Both', label: 'Both' }
    ]
  },

  // ==========================================
  // 9. Assets, Hardware & Records
  // ==========================================
  { key: 'assets_count', label: 'Assigned Assets Count', category: 'assets_records', type: 'number', width: 'w-40 min-w-[150px]', editable: false, align: 'center' },
  { key: 'primary_device', label: 'Primary Device', category: 'assets_records', type: 'text', width: 'w-48 min-w-[190px]', editable: true, align: 'left' },
  { key: 'penalty_count', label: 'Penalty Count', category: 'assets_records', type: 'number', width: 'w-32 min-w-[120px]', editable: true, align: 'center' },
  { key: 'trainings_completed', label: 'Trainings Completed', category: 'assets_records', type: 'number', width: 'w-44 min-w-[170px]', editable: true, align: 'center' }
];

export const CATEGORY_METADATA = {
  leaves_accrual: { 
    label: 'Adjust Leave Balances & Accrual', 
    icon: CalendarCheck, 
    color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700' 
  },
  primary: { 
    label: 'Primary Profile & Job (hr_employees)', 
    icon: User, 
    color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200' 
  },
  financials: { 
    label: 'Financials & Compensation (hr_employees)', 
    icon: DollarSign, 
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' 
  },
  contact: { 
    label: 'Contact & Location (hr_employees)', 
    icon: MapPin, 
    color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200' 
  },
  identity: { 
    label: 'Personal & Identification (hr_employees)', 
    icon: BadgeCheck, 
    color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200' 
  },
  emergency: { 
    label: 'Emergency Contacts (hr_employees)', 
    icon: HeartPulse, 
    color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200' 
  },
  banking: { 
    label: 'Banking & Payroll (hr_employees)', 
    icon: CreditCard, 
    color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200' 
  },
  attendance: { 
    label: 'Contract & Time-Off / Attendance (hr_employees)', 
    icon: Clock, 
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200' 
  },
  assets_records: { 
    label: 'Assets, Hardware & Records', 
    icon: Laptop, 
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200' 
  }
};

// --- System Preset Views ---
const SYSTEM_PRESETS: Record<string, { name: string; keys: string[] }> = {
  leave_balances: {
    name: 'Adjust Leave Balances',
    keys: [
      'employee_id',
      'name',
      'department',
      'job_title',
      'hire_date',
      'eligibility_date',
      'eligibility_status',
      'worked_months',
      'accrual_period',
      'accrued_balance',
      'consumed_balance',
      'remaining_balance',
      'balance_history'
    ]
  },
  default: {
    name: 'Default Directory View',
    keys: ['name', 'employee_id', 'job_title', 'department', 'work_email', 'mobile_phone', 'status', 'salary_base', 'hire_date']
  },
  complete_db: {
    name: 'All hr_employees Database Columns',
    keys: ALL_COLUMNS.map(c => c.key)
  },
  payroll_focus: {
    name: 'Payroll & Compensation Focus',
    keys: ['name', 'employee_id', 'job_title', 'department', 'salary_base', 'currency', 'allowances', 'total_bonuses', 'shift_allowances', 'equities', 'bank_name', 'account_number', 'status']
  },
  asset_audit: {
    name: 'Asset & IT Audit',
    keys: ['name', 'employee_id', 'job_title', 'department', 'work_email', 'work_location', 'assets_count', 'primary_device', 'status']
  },
  hr_records: {
    name: 'HR & Compliance Records',
    keys: ['name', 'employee_id', 'job_title', 'department', 'hire_date', 'contract_type', 'vacation_balance', 'penalty_count', 'trainings_completed', 'status']
  },
  emergency_sheet: {
    name: 'Emergency & Contacts Roster',
    keys: ['name', 'mobile_phone', 'personal_email', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relation', 'emergency_contact_address']
  }
};

const LOCAL_STORAGE_KEY = 'systobiz_hr_spreadsheet_views';

export const HRSpreadsheetView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { departments, isHRAdmin, showCustomToast } = useHRContext();

  // Selected Columns State
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>(() => {
    // If route or param requested leave_balances, load leave_balances preset
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('sheet') === 'leave_balances' || searchParams.get('view') === 'leave_balances') {
      return SYSTEM_PRESETS.leave_balances.keys;
    }
    return SYSTEM_PRESETS.leave_balances.keys;
  });

  // Active View Preset
  const [activeViewPreset, setActiveViewPreset] = useState<string>(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('sheet') === 'leave_balances' || searchParams.get('view') === 'leave_balances') {
      return 'leave_balances';
    }
    return 'leave_balances';
  });

  const [savedViews, setSavedViews] = useState<Record<string, { name: string; keys: string[] }>>({});
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Column Picker Dropdown State
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [columnSearch, setColumnSearch] = useState('');
  const columnPickerRef = useRef<HTMLDivElement>(null);

  // Data & Table State
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<string>('employee_id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Inline Cell Editing State
  const [editingCell, setEditingCell] = useState<{ rowId: number; fieldKey: string } | null>(null);
  const [editValue, setEditValue] = useState<any>('');
  const [savingCells, setSavingCells] = useState<Record<string, boolean>>({});
  const [successSavedCells, setSuccessSavedCells] = useState<Record<string, boolean>>({});

  // Leave Balance History Modal State
  const [selectedHistoryEmployee, setSelectedHistoryEmployee] = useState<any | null>(null);
  const [historyModalLoading, setHistoryModalLoading] = useState(false);
  const [employeeHistoryRecords, setEmployeeHistoryRecords] = useState<any[]>([]);
  const [showAdjustSubForm, setShowAdjustSubForm] = useState(false);
  const [adjustFormData, setAdjustFormData] = useState({
    adjustment_type: 'credit' as 'credit' | 'debit' | 'set',
    days: 1,
    reason: '',
    effective_date: new Date().toISOString().split('T')[0]
  });
  const [submittingAdjustment, setSubmittingAdjustment] = useState(false);

  // Load Custom Saved Views from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedViews(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved spreadsheet views:", e);
    }
  }, []);

  // Fetch Spreadsheet Matrix Data
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedDepartment && selectedDepartment !== 'all') {
        params.append('department_id', selectedDepartment);
      }
      if (selectedStatus && selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await fetch(`/api/hr/spreadsheet/data?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load data (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setData(json.data);
      } else {
        throw new Error(json.error || 'Failed to parse spreadsheet records');
      }
    } catch (err: any) {
      console.error("Error fetching spreadsheet data:", err);
      setError(err.message || 'An error occurred while loading data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDepartment, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Click outside listener for column chooser dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(event.target as Node)) {
        setIsColumnPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Columns to display
  const activeColumns = useMemo(() => {
    const map = new Map<string, ColumnDef>();
    ALL_COLUMNS.forEach(c => map.set(c.key, c));
    return selectedColumnKeys
      .map(key => map.get(key))
      .filter((c): c is ColumnDef => !!c);
  }, [selectedColumnKeys]);

  // Sorting and Filtering
  const processedData = useMemo(() => {
    let result = [...data];

    // Search query filter (client-side instantaneous)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.employee_id && String(item.employee_id).toLowerCase().includes(q)) ||
          (item.work_email && item.work_email.toLowerCase().includes(q)) ||
          (item.job_title && item.job_title.toLowerCase().includes(q)) ||
          (item.mobile_phone && item.mobile_phone.includes(q)) ||
          (item.national_id && item.national_id.includes(q)) ||
          (item.department_name && item.department_name.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'department') {
        aVal = a.department_name || '';
        bVal = b.department_name || '';
      }

      if (aVal === null || aVal === undefined) return sortDirection === 'asc' ? 1 : -1;
      if (bVal === null || bVal === undefined) return sortDirection === 'asc' ? -1 : 1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchQuery, sortField, sortDirection]);

  // Sort Handler
  const handleSort = (fieldKey: string) => {
    if (sortField === fieldKey) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(fieldKey);
      setSortDirection('asc');
    }
  };

  // Toggle Column in Picker
  const toggleColumn = (key: string) => {
    if (key === 'name') return; // Name is primary locked column
    setSelectedColumnKeys(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // Preset Selection
  const handleSelectPreset = (presetKey: string) => {
    setActiveViewPreset(presetKey);
    if (SYSTEM_PRESETS[presetKey]) {
      setSelectedColumnKeys(SYSTEM_PRESETS[presetKey].keys);
    } else if (savedViews[presetKey]) {
      setSelectedColumnKeys(savedViews[presetKey].keys);
    }
  };

  // Save Custom View
  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    const viewId = `custom_${Date.now()}`;
    const newViews = {
      ...savedViews,
      [viewId]: {
        name: newViewName.trim(),
        keys: selectedColumnKeys
      }
    };
    setSavedViews(newViews);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newViews));
    } catch (e) {
      console.error(e);
    }
    setActiveViewPreset(viewId);
    setNewViewName('');
    setIsSaveModalOpen(false);
    if (showCustomToast) {
      showCustomToast(`Saved view "${newViewName}"`, 'success');
    }
  };

  const handleDeleteCustomView = (viewKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...savedViews };
    delete updated[viewKey];
    setSavedViews(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (activeViewPreset === viewKey) {
      handleSelectPreset('leave_balances');
    }
  };

  // Commit Inline Cell Update
  const commitCellUpdate = async (rowId: number, fieldKey: string, value: any) => {
    const cellKey = `${rowId}-${fieldKey}`;
    setEditingCell(null);

    // Optimistically update local state
    setData(prev => prev.map(item => {
      if (item.id === rowId) {
        const updated = { ...item, [fieldKey]: value };
        if (fieldKey === 'department') {
          const dept = departments.find(d => String(d.id) === String(value));
          updated.department_name = dept ? dept.name : '';
          updated.department = dept ? dept.name : '';
        }
        if (fieldKey === 'remaining_balance' || fieldKey === 'vacation_balance') {
          updated.remaining_balance = parseFloat(value) || 0;
          updated.vacation_balance = parseFloat(value) || 0;
          updated.accrued_balance = (parseFloat(value) || 0) + (parseFloat(item.consumed_balance) || 0);
        }
        if (fieldKey === 'accrued_balance') {
          const newAcc = parseFloat(value) || 0;
          const cons = parseFloat(item.consumed_balance) || 0;
          updated.accrued_balance = newAcc;
          updated.remaining_balance = Math.max(0, newAcc - cons);
          updated.vacation_balance = Math.max(0, newAcc - cons);
        }
        return updated;
      }
      return item;
    }));

    setSavingCells(prev => ({ ...prev, [cellKey]: true }));

    try {
      const res = await fetch('/api/hr/spreadsheet/cell', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: rowId,
          field_key: fieldKey,
          value
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      setSuccessSavedCells(prev => ({ ...prev, [cellKey]: true }));
      setTimeout(() => {
        setSuccessSavedCells(prev => {
          const next = { ...prev };
          delete next[cellKey];
          return next;
        });
      }, 2500);
    } catch (err: any) {
      console.error("Cell save failed:", err);
      if (showCustomToast) {
        showCustomToast(`Failed to update ${fieldKey}: ${err.message}`, 'error');
      }
      // Revert from server
      fetchData(true);
    } finally {
      setSavingCells(prev => {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      });
    }
  };

  // Open Leave Balance History Ledger Modal
  const openBalanceHistoryModal = async (emp: any) => {
    setSelectedHistoryEmployee(emp);
    setHistoryModalLoading(true);
    setShowAdjustSubForm(false);
    setAdjustFormData({
      adjustment_type: 'credit',
      days: 1,
      reason: '',
      effective_date: new Date().toISOString().split('T')[0]
    });

    try {
      const res = await fetch(`/api/hr/spreadsheet/leave-history/${emp.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.history)) {
          setEmployeeHistoryRecords(json.history);
        } else {
          setEmployeeHistoryRecords(emp.leave_history || []);
        }
      } else {
        setEmployeeHistoryRecords(emp.leave_history || []);
      }
    } catch (err) {
      console.error("Failed to load leave history:", err);
      setEmployeeHistoryRecords(emp.leave_history || []);
    } finally {
      setHistoryModalLoading(false);
    }
  };

  // Submit Leave Balance Adjustment
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHistoryEmployee) return;

    setSubmittingAdjustment(true);
    try {
      const res = await fetch('/api/hr/spreadsheet/adjust-leave-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedHistoryEmployee.id,
          adjustment_type: adjustFormData.adjustment_type,
          days: adjustFormData.days,
          reason: adjustFormData.reason,
          effective_date: adjustFormData.effective_date
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to adjust balance');
      }

      const result = await res.json();
      if (showCustomToast) {
        showCustomToast(`Leave balance successfully adjusted to ${result.new_balance} days!`, 'success');
      }

      // Update local employee balance
      setSelectedHistoryEmployee((prev: any) => ({
        ...prev,
        remaining_balance: result.new_balance,
        vacation_balance: result.new_balance,
        accrued_balance: result.new_balance + (parseFloat(prev.consumed_balance) || 0)
      }));

      // Reload history and parent data
      setShowAdjustSubForm(false);
      openBalanceHistoryModal({
        ...selectedHistoryEmployee,
        remaining_balance: result.new_balance,
        vacation_balance: result.new_balance
      });
      fetchData(true);
    } catch (err: any) {
      console.error("Adjustment error:", err);
      if (showCustomToast) {
        showCustomToast(err.message || 'Failed to save adjustment', 'error');
      }
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  // Export to CSV Functionality
  const exportToCSV = () => {
    if (processedData.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = activeColumns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const rows = processedData.map(row => {
      return activeColumns.map(col => {
        let val = row[col.key];
        if (col.key === 'department') {
          val = row.department_name || '';
        } else if (col.key === 'balance_history') {
          val = `${row.approved_leaves_count || 0} Records`;
        } else if ((col.key === 'hire_date' || col.key === 'eligibility_date' || col.key === 'contract_start_date' || col.key === 'contract_end_date' || col.key === 'date_of_birth' || col.key === 'kpi_payout_date') && val) {
          val = String(val).split('T')[0];
        }
        if (val === null || val === undefined) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hr_spreadsheet_${activeViewPreset}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Aggregated Summary Statistics
  const summaryStats = useMemo(() => {
    const totalCount = processedData.length;
    const totalSalary = processedData.reduce((acc, r) => acc + (parseFloat(r.salary_base) || 0), 0);
    const totalAccruedLeaves = processedData.reduce((acc, r) => acc + (parseFloat(r.accrued_balance) || 0), 0);
    const totalConsumedLeaves = processedData.reduce((acc, r) => acc + (parseFloat(r.consumed_balance) || 0), 0);
    const totalRemainingLeaves = processedData.reduce((acc, r) => acc + (parseFloat(r.remaining_balance) || 0), 0);
    return { totalCount, totalSalary, totalAccruedLeaves, totalConsumedLeaves, totalRemainingLeaves };
  }, [processedData]);

  const categoriesList = Object.keys(CATEGORY_METADATA) as (keyof typeof CATEGORY_METADATA)[];

  // Helper to format date cleanly
  const formatDateValue = (val: any) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val).split('T')[0];
      return d.toISOString().split('T')[0];
    } catch {
      return String(val);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-3 pb-12 animate-in fade-in duration-300">
      
      {/* 1. Sleek Top Bar & Breadcrumb & Navigation Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Left: Breadcrumbs & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <Link to="/hr/directory" className="hover:text-emerald-600 transition-colors">Directory</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800 dark:text-slate-200 font-bold">Spreadsheet Matrix</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-emerald-600 font-black">
                  {SYSTEM_PRESETS[activeViewPreset]?.name || savedViews[activeViewPreset]?.name || 'Adjust Leave Balances'}
                </span>
              </div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Spreadsheet Grid View</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {summaryStats.totalCount} Employees
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  ({selectedColumnKeys.length}/{ALL_COLUMNS.length} Columns)
                </span>
              </h1>
            </div>
          </div>

          {/* Right: Layout Switcher, Saved Layouts Selector, Columns Chooser, Export, Save */}
          <div className="flex items-center flex-wrap gap-2 self-start lg:self-auto">
            
            {/* 3-Way Layout Switcher: Grid / List / Spreadsheet */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => navigate('/hr/directory')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title="Board / Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/hr/directory?view=list')}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1.5 rounded-lg bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold cursor-default"
                title="Spreadsheet Matrix View (Active)"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            </div>

            {/* Saved Layouts Dropdown Selector */}
            <div className="relative inline-flex items-center">
              <div className="flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                <span className="text-[11px] text-slate-400 uppercase tracking-wider mr-1.5 hidden sm:inline">View:</span>
                <select
                  value={activeViewPreset}
                  onChange={(e) => handleSelectPreset(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden cursor-pointer text-xs pr-2"
                >
                  <optgroup label="System Presets">
                    {Object.entries(SYSTEM_PRESETS).map(([k, p]) => (
                      <option key={k} value={k} className="dark:bg-slate-800">{p.name}</option>
                    ))}
                  </optgroup>
                  {Object.keys(savedViews).length > 0 && (
                    <optgroup label="Saved Views">
                      {Object.entries(savedViews).map(([k, v]) => (
                        <option key={k} value={k} className="dark:bg-slate-800">{v.name}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
                {activeViewPreset.startsWith('custom_') && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCustomView(activeViewPreset, e)}
                    className="ml-1 text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                    title="Delete Saved View"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Save View Button */}
            <button
              type="button"
              onClick={() => setIsSaveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200/80 dark:border-slate-700 cursor-pointer shadow-2xs"
              title="Save current columns as a custom preset"
            >
              <Save className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Save View</span>
            </button>

            {/* Column Chooser Popover Dropdown (All hr_employees DB Columns) */}
            <div className="relative" ref={columnPickerRef}>
              <button
                type="button"
                onClick={() => setIsColumnPickerOpen(!isColumnPickerOpen)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all border cursor-pointer shadow-2xs",
                  isColumnPickerOpen
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                    : "bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                )}
                title="Configure Columns (All hr_employees Database Columns)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Columns</span>
                <span className="w-5 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-[10px] font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  {selectedColumnKeys.length}
                </span>
                <ChevronDown className={cn("w-3 h-3 transition-transform text-slate-400", isColumnPickerOpen && "rotate-180")} />
              </button>

              {/* Categorized Column Chooser Dropdown */}
              {isColumnPickerOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[360px] sm:w-[560px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Configure Columns ({selectedColumnKeys.length}/{ALL_COLUMNS.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedColumnKeys(ALL_COLUMNS.map(c => c.key))}
                        className="text-emerald-600 hover:underline font-bold cursor-pointer"
                      >
                        Select All ({ALL_COLUMNS.length})
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedColumnKeys(SYSTEM_PRESETS.leave_balances.keys)}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Adjust Leaves
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setSelectedColumnKeys(SYSTEM_PRESETS.default.keys)}
                        className="text-slate-500 hover:underline font-semibold cursor-pointer"
                      >
                        Reset Defaults
                      </button>
                    </div>
                  </div>

                  {/* Filter inside column picker */}
                  <div className="relative my-2.5">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search hr_employees database columns..."
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
                    />
                  </div>

                  {/* Categorized Sections with All hr_employees Table Columns */}
                  <div className="max-h-96 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin">
                    {categoriesList.map(catKey => {
                      const catMeta = CATEGORY_METADATA[catKey];
                      const IconComponent = catMeta.icon;
                      const catCols = ALL_COLUMNS.filter(c => 
                        c.category === catKey &&
                        (columnSearch === '' || c.label.toLowerCase().includes(columnSearch.toLowerCase()) || c.key.toLowerCase().includes(columnSearch.toLowerCase()))
                      );

                      if (catCols.length === 0) return null;

                      const selectedCountInCat = catCols.filter(c => selectedColumnKeys.includes(c.key)).length;

                      return (
                        <div key={catKey} className="space-y-1.5 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                              <IconComponent className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{catMeta.label}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                              {selectedCountInCat}/{catCols.length}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {catCols.map(col => {
                              const isChecked = selectedColumnKeys.includes(col.key);
                              const isLocked = col.key === 'name';

                              return (
                                <label
                                  key={col.key}
                                  className={cn(
                                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border",
                                    isChecked
                                      ? "bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs"
                                      : "bg-transparent border-transparent hover:bg-white/80 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400",
                                    isLocked && "opacity-75 cursor-not-allowed"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isLocked}
                                    onChange={() => toggleColumn(col.key)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                                  />
                                  <div className="flex flex-col min-w-0">
                                    <span className="truncate">{col.label}</span>
                                    <span className="text-[9px] font-mono text-slate-400 truncate">{col.key}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Export to CSV Option */}
            <button
              type="button"
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              title="Export visible columns and rows to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
              title="Refresh spreadsheet data"
            >
              <RefreshCw className={cn("w-4 h-4 text-emerald-600", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* 2. Dedicated Quick Sheet Selector Tabs */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Quick Sheets:
          </span>
          <button
            type="button"
            onClick={() => handleSelectPreset('leave_balances')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 border",
              activeViewPreset === 'leave_balances'
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
            )}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Adjust Leave Balances</span>
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              activeViewPreset === 'leave_balances' ? "bg-white/20 text-white" : "bg-emerald-200/60 text-emerald-900"
            )}>
              Active Sheet
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('default')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border",
              activeViewPreset === 'default'
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            )}
          >
            <User className="w-3.5 h-3.5" />
            <span>Employee Directory</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('payroll_focus')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border",
              activeViewPreset === 'payroll_focus'
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            )}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Compensation & Payroll</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('asset_audit')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border",
              activeViewPreset === 'asset_audit'
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            )}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Assets & Hardware</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPreset('complete_db')}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border",
              activeViewPreset === 'complete_db'
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All hr_employees Columns</span>
          </button>
        </div>

        {/* 3. Interactive Search & Quick Filters Bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, employee ID, email, job title, phone, national ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Building2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative w-full sm:w-40">
              <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Enterprise Excel Grid Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
        
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold">Loading HR spreadsheet matrix data from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-600">{error}</p>
            <button
              onClick={() => fetchData()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : processedData.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center gap-2 text-slate-400">
            <FileSpreadsheet className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No matching employees found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[72vh] relative scrollbar-thin">
            <table className="w-full border-collapse text-left text-xs">
              
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 uppercase font-black tracking-wider text-[11px]">
                <tr>
                  {activeColumns.map((col, idx) => {
                    const isStickyFirst = idx === 0;
                    const isSorted = sortField === col.key;

                    return (
                      <th
                        key={col.key}
                        onClick={() => col.type !== 'action' && handleSort(col.key)}
                        className={cn(
                          "py-2.5 px-3 border-r border-slate-200/80 dark:border-slate-700/80 select-none transition-colors",
                          col.type !== 'action' && "cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60",
                          col.width,
                          isStickyFirst && "sticky left-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 shadow-[2px_0_5px_rgba(0,0,0,0.05)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.3)]",
                          col.align === 'right' && "text-right",
                          col.align === 'center' && "text-center"
                        )}
                      >
                        <div className={cn(
                          "flex items-center gap-1.5",
                          col.align === 'right' && "justify-end",
                          col.align === 'center' && "justify-center"
                        )}>
                          <span>{col.label}</span>
                          {col.type !== 'action' && (
                            <span className="text-slate-400">
                              {isSorted ? (
                                sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <ArrowUpDown className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {processedData.map((row, rowIdx) => {
                  const isEven = rowIdx % 2 === 1;

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "h-10 transition-colors group",
                        isEven ? "bg-slate-50/40 dark:bg-slate-800/30" : "bg-white dark:bg-slate-900",
                        "hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20"
                      )}
                    >
                      {activeColumns.map((col, colIdx) => {
                        const isStickyFirst = colIdx === 0;
                        const cellKey = `${row.id}-${col.key}`;
                        const isEditing = editingCell?.rowId === row.id && editingCell?.fieldKey === col.key;
                        const isSavedSuccess = !!successSavedCells[cellKey];
                        const isSaving = !!savingCells[cellKey];

                        let cellValue = row[col.key];
                        if (col.key === 'department') cellValue = row.department_name || row.department;

                        return (
                          <td
                            key={col.key}
                            onDoubleClick={() => {
                              if (col.editable && col.type !== 'action') {
                                setEditingCell({ rowId: row.id, fieldKey: col.key });
                                setEditValue(col.key === 'department' ? (row.department_id || '') : (row[col.key] ?? ''));
                              }
                            }}
                            className={cn(
                              "px-3 py-1.5 border-r border-slate-100 dark:border-slate-800/80 relative text-slate-800 dark:text-slate-200 transition-all",
                              col.width,
                              col.align === 'right' && "text-right",
                              col.align === 'center' && "text-center",
                              isStickyFirst && cn(
                                "sticky left-0 z-10 font-bold shadow-[2px_0_5px_rgba(0,0,0,0.03)] dark:shadow-[2px_0_5px_rgba(0,0,0,0.2)]",
                                isEven ? "bg-slate-50 dark:bg-slate-900" : "bg-white dark:bg-slate-900",
                                "group-hover:bg-emerald-50/70 dark:group-hover:bg-emerald-950/40"
                              ),
                              col.editable && col.type !== 'action' && "cursor-pointer hover:ring-1 hover:ring-emerald-400/50 hover:bg-emerald-50/30"
                            )}
                          >
                            {/* Saved Feedback Badge */}
                            {isSavedSuccess && (
                              <span className="absolute top-1 right-1 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500 text-white animate-in zoom-in duration-150 shadow-xs z-10">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </span>
                            )}
                            {isSaving && (
                              <span className="absolute top-1 right-1 flex items-center justify-center z-10">
                                <RefreshCw className="w-3 h-3 text-emerald-500 animate-spin" />
                              </span>
                            )}

                            {/* In-Cell Editor */}
                            {isEditing ? (
                              <div className="w-full -mx-1 -my-1">
                                {col.type === 'select' && col.key === 'department' ? (
                                  <select
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => commitCellUpdate(row.id, col.key, editValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitCellUpdate(row.id, col.key, editValue);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-md text-xs font-semibold focus:outline-hidden shadow-xs"
                                  >
                                    <option value="">(No Department)</option>
                                    {departments.map(d => (
                                      <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                  </select>
                                ) : col.type === 'select' && col.options ? (
                                  <select
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => commitCellUpdate(row.id, col.key, editValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitCellUpdate(row.id, col.key, editValue);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-md text-xs font-semibold focus:outline-hidden shadow-xs"
                                  >
                                    {col.options.map(opt => (
                                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                  </select>
                                ) : col.type === 'number' ? (
                                  <input
                                    type="number"
                                    step="0.5"
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => commitCellUpdate(row.id, col.key, editValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitCellUpdate(row.id, col.key, editValue);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-md text-xs text-right font-mono font-bold focus:outline-hidden shadow-xs"
                                  />
                                ) : col.type === 'date' ? (
                                  <input
                                    type="date"
                                    autoFocus
                                    value={editValue ? String(editValue).split('T')[0] : ''}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => commitCellUpdate(row.id, col.key, editValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitCellUpdate(row.id, col.key, editValue);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-md text-xs focus:outline-hidden shadow-xs"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => commitCellUpdate(row.id, col.key, editValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitCellUpdate(row.id, col.key, editValue);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-md text-xs focus:outline-hidden shadow-xs"
                                  />
                                )}
                              </div>
                            ) : (
                              /* Standard Cell Display */
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                {col.key === 'name' ? (
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 shrink-0">
                                      {row.name ? row.name.charAt(0) : 'U'}
                                    </div>
                                    <span 
                                      onClick={() => navigate(`/hr/directory/${row.id}`)}
                                      className="truncate hover:text-emerald-600 hover:underline cursor-pointer font-bold"
                                      title={row.name}
                                    >
                                      {row.name || 'Unnamed Employee'}
                                    </span>
                                  </div>
                                ) : col.key === 'employee_id' ? (
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 w-full text-center">
                                    {row.employee_id ? `#${row.employee_id}` : `#EMP-${row.id}`}
                                  </span>
                                ) : col.key === 'eligibility_status' ? (
                                  <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mx-auto flex items-center gap-1 border",
                                    row.eligibility_status === 'Eligible'
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300/80 dark:bg-emerald-950/60 dark:text-emerald-300"
                                      : "bg-amber-100 text-amber-800 border-amber-300/80 dark:bg-amber-950/60 dark:text-amber-300"
                                  )}>
                                    {row.eligibility_status === 'Eligible' ? (
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                    )}
                                    <span>{row.eligibility_status || 'Eligible'}</span>
                                  </span>
                                ) : col.key === 'worked_months' ? (
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300 w-full text-center">
                                    {row.worked_months ?? 0} <span className="text-[10px] text-slate-400 font-medium">Mos</span>
                                  </span>
                                ) : col.key === 'accrual_period' ? (
                                  <span className="text-slate-600 dark:text-slate-400 font-semibold w-full text-center">
                                    {row.accrual_period || 'Annual (12 Months)'}
                                  </span>
                                ) : col.key === 'accrued_balance' ? (
                                  <span className="font-mono font-black text-slate-800 dark:text-slate-200 w-full text-right">
                                    {parseFloat(row.accrued_balance ?? 21).toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">Days</span>
                                  </span>
                                ) : col.key === 'consumed_balance' ? (
                                  <span className={cn(
                                    "font-mono font-bold w-full text-right",
                                    parseFloat(row.consumed_balance) > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-400"
                                  )}>
                                    {parseFloat(row.consumed_balance ?? 0).toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">Days</span>
                                  </span>
                                ) : col.key === 'remaining_balance' ? (
                                  <div className="w-full flex items-center justify-end gap-1.5">
                                    <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                                      {parseFloat(row.remaining_balance ?? row.vacation_balance ?? 21).toFixed(1)}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md">
                                      Days
                                    </span>
                                  </div>
                                ) : col.key === 'balance_history' ? (
                                  <button
                                    type="button"
                                    onClick={() => openBalanceHistoryModal(row)}
                                    className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 font-black text-[11px] rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs transition-all cursor-pointer"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                    <span>Ledger</span>
                                    {row.approved_leaves_count ? (
                                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold">
                                        {row.approved_leaves_count}
                                      </span>
                                    ) : null}
                                  </button>
                                ) : col.key === 'status' ? (
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mx-auto",
                                    row.status === 'active' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60",
                                    row.status === 'on_leave' && "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60",
                                    row.status === 'inactive' && "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300/60",
                                    row.status === 'terminated' && "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/60",
                                    row.status === 'suspended' && "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300/60"
                                  )}>
                                    {row.status || 'Active'}
                                  </span>
                                ) : col.type === 'date' ? (
                                  <span className="font-mono text-slate-600 dark:text-slate-400 w-full text-center">
                                    {formatDateValue(cellValue)}
                                  </span>
                                ) : col.type === 'number' && (col.key === 'salary_base' || col.key === 'total_bonuses' || col.key === 'allowances' || col.key === 'shift_allowances' || col.key === 'kpi_amount' || col.key === 'potential_bonus_amount') ? (
                                  <span className="font-mono font-bold w-full text-right">
                                    {parseFloat(cellValue || 0).toLocaleString()}
                                  </span>
                                ) : col.type === 'number' ? (
                                  <span className="font-mono font-bold w-full text-center">
                                    {cellValue ?? 0}
                                  </span>
                                ) : (
                                  <span className="truncate" title={String(cellValue || '')}>
                                    {cellValue || <span className="text-slate-300 dark:text-slate-600 font-light italic">—</span>}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Bottom Statistics & Aggregation Footer */}
        <div className="bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Total Staff: <strong className="text-emerald-600 font-black">{summaryStats.totalCount}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>
              Total Accrued Leaves: <strong className="font-mono font-bold text-slate-800 dark:text-slate-100">{summaryStats.totalAccruedLeaves.toFixed(1)} Days</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>
              Consumed Leaves: <strong className="font-mono font-bold text-amber-700 dark:text-amber-400">{summaryStats.totalConsumedLeaves.toFixed(1)} Days</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>
              Available Balance: <strong className="font-mono font-black text-emerald-600">{summaryStats.totalRemainingLeaves.toFixed(1)} Days</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Double-click any cell to edit inline &bull; Press Enter to save to database
          </div>
        </div>
      </div>

      {/* 6. Leave Balance History & Adjustment Ledger Modal */}
      {selectedHistoryEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedHistoryEmployee.name}
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      #{selectedHistoryEmployee.employee_id || selectedHistoryEmployee.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedHistoryEmployee.job_title} &bull; {selectedHistoryEmployee.department_name || selectedHistoryEmployee.department || 'General'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustSubForm(!showAdjustSubForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1b5e20] hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{showAdjustSubForm ? 'Close Adjustment' : '+ Adjust Balance'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedHistoryEmployee(null)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 scrollbar-thin">
              
              {/* Top KPI Cards Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Hire Date</span>
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono">
                    {formatDateValue(selectedHistoryEmployee.hire_date)}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {selectedHistoryEmployee.worked_months} Mos of service
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Accrued Entitlement</span>
                  <span className="text-sm font-black text-emerald-800 dark:text-emerald-200 font-mono">
                    {parseFloat(selectedHistoryEmployee.accrued_balance ?? 21).toFixed(1)} Days
                  </span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    {selectedHistoryEmployee.accrual_period || 'Annual Statutory'}
                  </span>
                </div>

                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">Consumed Leaves</span>
                  <span className="text-sm font-black text-amber-800 dark:text-amber-200 font-mono">
                    {parseFloat(selectedHistoryEmployee.consumed_balance ?? 0).toFixed(1)} Days
                  </span>
                  <span className="text-[10px] text-amber-600 block mt-0.5">Approved Time-Off</span>
                </div>

                <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">Current Balance</span>
                  <span className="text-base font-black font-mono">
                    {parseFloat(selectedHistoryEmployee.remaining_balance ?? selectedHistoryEmployee.vacation_balance ?? 21).toFixed(1)} Days
                  </span>
                  <span className="text-[10px] text-emerald-200 block mt-0.5">Available for use</span>
                </div>
              </div>

              {/* Instant Balance Adjustment Sub-Form */}
              {showAdjustSubForm && (
                <form onSubmit={handleSaveAdjustment} className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Quick Admin Leave Balance Adjustment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Adjustment Type
                      </label>
                      <select
                        value={adjustFormData.adjustment_type}
                        onChange={(e) => setAdjustFormData({ ...adjustFormData, adjustment_type: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                      >
                        <option value="credit">Credit (+ Add Days)</option>
                        <option value="debit">Debit (- Deduct Days)</option>
                        <option value="set">Set Exact Balance (= Days)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Days Amount
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        required
                        value={adjustFormData.days}
                        onChange={(e) => setAdjustFormData({ ...adjustFormData, days: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Effective Date
                      </label>
                      <input
                        type="date"
                        required
                        value={adjustFormData.effective_date}
                        onChange={(e) => setAdjustFormData({ ...adjustFormData, effective_date: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Reason / Reference Note
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Overtime compensation, Annual carryover, Labor law statutory adjustment"
                      value={adjustFormData.reason}
                      onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdjustSubForm(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAdjustment}
                      className="px-4 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {submittingAdjustment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Apply & Update Database</span>
                    </button>
                  </div>
                </form>
              )}

              {/* History Ledger Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chronological Balance & Leave Ledger</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {employeeHistoryRecords.length + 1} Transaction Entries
                  </span>
                </div>

                {historyModalLoading ? (
                  <div className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                    <p className="text-xs font-medium">Loading ledger records...</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Transaction / Description</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-center">Used (-)</th>
                          <th className="py-2.5 px-3 text-center">Earned (+)</th>
                          <th className="py-2.5 px-3 text-right">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {/* 1. Initial Annual Accrual Row */}
                        <tr className="bg-emerald-50/20 dark:bg-emerald-950/20">
                          <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                            {formatDateValue(selectedHistoryEmployee.hire_date)}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            Annual Statutory Accrual (Initial Allocation)
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Accrued
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center text-slate-400">—</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-emerald-600">
                            +{parseFloat(selectedHistoryEmployee.accrued_balance ?? 21).toFixed(1)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400">
                            {parseFloat(selectedHistoryEmployee.accrued_balance ?? 21).toFixed(1)} Days
                          </td>
                        </tr>

                        {/* 2. Leave Requests & Adjustments Rows */}
                        {employeeHistoryRecords.map((req, idx) => {
                          const used = req.status === 'Approved' ? parseFloat(req.days || 1) : 0;
                          return (
                            <tr key={req.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">
                                {formatDateValue(req.start_date || req.created_at)}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                                  {req.type || 'Leave Request'}
                                </span>
                                {req.reason && (
                                  <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                    {req.reason}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                  req.status === 'Approved' ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                                )}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-rose-600">
                                {used > 0 ? `-${used.toFixed(1)}` : '—'}
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-emerald-600">
                                {used < 0 ? `+${Math.abs(used).toFixed(1)}` : '—'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                Recorded
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
              <span>All balance adjustments sync immediately with the PostgreSQL database.</span>
              <button
                type="button"
                onClick={() => setSelectedHistoryEmployee(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl font-bold cursor-pointer transition-colors"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Save View Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Save View Layout
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Enter View Name
              </label>
              <input
                type="text"
                placeholder="e.g. Leave Balances Audit, Payroll Focus"
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveView();
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                This will save your current selection of {selectedColumnKeys.length} columns to your browser.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveView}
                disabled={!newViewName.trim()}
                className="px-4 py-1.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Save View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRSpreadsheetView;
