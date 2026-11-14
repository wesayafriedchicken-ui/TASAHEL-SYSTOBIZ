import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Employee, 
  PayrollRecord, 
  AttendanceRecord, 
  LeaveRequest, 
  PerformanceReview, 
  Department, 
  Shift, 
  ShiftAssignment 
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../context/RBACContext';
import { 
  LayoutGrid,
  BarChart2, 
  Users, 
  Building2, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Award, 
  Network, 
  AlertCircle, 
  Archive 
} from 'lucide-react';

export interface HRTabItem {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  name: string;
}

export interface HRContextType {
  // Core Data States
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  rawEmployees: Employee[];
  
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  rawDepartments: Department[];
  
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  
  shiftAssignments: ShiftAssignment[];
  setShiftAssignments: React.Dispatch<React.SetStateAction<ShiftAssignment[]>>;
  
  payroll: PayrollRecord[];
  setPayroll: React.Dispatch<React.SetStateAction<PayrollRecord[]>>;
  rawPayroll: PayrollRecord[];
  
  payrollConfig: any;
  setPayrollConfig: React.Dispatch<React.SetStateAction<any>>;
  
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  rawAttendance: AttendanceRecord[];
  
  leaves: LeaveRequest[];
  setLeaves: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  rawLeaves: LeaveRequest[];
  
  performance: PerformanceReview[];
  setPerformance: React.Dispatch<React.SetStateAction<PerformanceReview[]>>;
  rawPerformance: PerformanceReview[];
  
  complaints: any[];
  setComplaints: React.Dispatch<React.SetStateAction<any[]>>;
  rawComplaints: any[];
  
  shiftSwaps: any[];
  setShiftSwaps: React.Dispatch<React.SetStateAction<any[]>>;
  rawShiftSwaps: any[];
  
  hrLogs: any[];
  setHrLogs: React.Dispatch<React.SetStateAction<any[]>>;
  
  pipelines: any[];
  setPipelines: React.Dispatch<React.SetStateAction<any[]>>;
  
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Modals & UI States
  showManagePermissionsModal: boolean;
  setShowManagePermissionsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showClearHrDataConfirm: boolean;
  setShowClearHrDataConfirm: React.Dispatch<React.SetStateAction<boolean>>;

  // Salary Visibility (Directory & Employee Files)
  isSalaryVisible: boolean;
  setIsSalaryVisible: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSalaryVisibility: () => void;
  canViewSalaryPerm: boolean;
  
  hrToast: { message: string; type: 'success' | 'error' | 'info' } | null;
  setHrToast: React.Dispatch<React.SetStateAction<{ message: string; type: 'success' | 'error' | 'info' } | null>>;
  showCustomToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  handleClearHrData: () => Promise<void>;

  // Tabs & Navigation
  allHrTabs: HRTabItem[];
  allowedHrTabs: HRTabItem[];

  // Permissions & Auth
  currentUser: any;
  isHRAdmin: boolean;
  canRead: (module: string, section?: string) => boolean;
  canWrite: (module: string, section?: string) => boolean;
  canDelete: (module: string, section?: string) => boolean;
  canCreate: (module: string, section?: string) => boolean;
  canExport: (module: string, section?: string) => boolean;
  canImport: (module: string, section?: string) => boolean;
  canShare: (module: string, section?: string) => boolean;
  checkPermission: (module: string, action: string) => boolean;
  getCustomActionAccess: (actionName: string, fallback?: boolean) => boolean;
  getFieldPerm: (fieldKey: string, sectionKey?: string) => 'editable' | 'readonly' | 'hidden';
  getFieldPermStatus: (moduleName: string, fieldKey: string, fieldId?: number, sectionKey?: string) => 'editable' | 'readonly' | 'hidden';

  // Granular Action Permissions
  canAddEmployee: boolean;
  canEditEmployee: boolean;
  canDeleteEmployee: boolean;
  canShareEmployee: boolean;
  canExportEmployee: boolean;
  canImportEmployee: boolean;
  canViewDept: boolean;
  canAddDept: boolean;
  canEditDept: boolean;
  canDeleteDept: boolean;
  canShareDept: boolean;
  canCreateRecruitment: boolean;
  canEditRecruitment: boolean;
  canDeleteRecruitment: boolean;
  canRunPayroll: boolean;
  canDeletePayroll: boolean;
  canAdjustLeaveBalances: boolean;
  canApproveLeaves: boolean;
  canRejectLeaves: boolean;
  canRequestLeave: boolean;
  canEditLeave: boolean;
  canBulkApproveLeaves: boolean;
  canFilterLeaves: boolean;
  canClockInOut: boolean;
  canManageShifts: boolean;
  canDeleteShift: boolean;
  canSmartSync: boolean;
  canFilterDailyLogs: boolean;
  canEditAttendanceLogs: boolean;
  canExportAttendanceLogs: boolean;
  canAssignShift: boolean;
  canCreateNewShift: boolean;
  canManageShiftSchedule: boolean;
  canEditShiftOptions: boolean;
  canFilterShifts: boolean;
  canAddBreakSlot: boolean;
  canEditBreakSlot: boolean;
  canDeleteBreakSlot: boolean;
  canFilterBreaks: boolean;
  canNewEvaluation: boolean;
  canManageOKRs: boolean;
  canViewComplaint: boolean;
  canEditComplaint: boolean;
  canSubmitComplaint: boolean;
  canResolveComplaint: boolean;
  canDeleteComplaint: boolean;
  canShareComplaint: boolean;
  canRequestSwap: boolean;
  canEditShiftSwap: boolean;
  canApproveSwapManager: boolean;
  canApproveSwapAttendance: boolean;
  canDeleteShiftSwap: boolean;
  canFilterSwaps: boolean;
  canExportPayrollExcelCSV: boolean;
  canPrintPDFReport: boolean;
  canGeneratePayrollReport: boolean;
  canEditPayrollEntry: boolean;
  canManagePermissions: boolean;

  // Data Fetching & Sync Functions
  fetchCoreData: () => Promise<void>;
  fetchTabData: (tab: string, force?: boolean) => Promise<void>;
  fetchData: (options?: { silent?: boolean }) => Promise<void>;
  fetchEndpoint: (url: string, fallback?: any) => Promise<any>;
  fetchPermissionsData: () => Promise<void>;
  permRoles: any[];
  permUsers: any[];
  selectedPermRoleId: number | null;
  setSelectedPermRoleId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedPermUserId: number | null;
  setSelectedPermUserId: React.Dispatch<React.SetStateAction<number | null>>;
}

const HRContext = createContext<HRContextType | null>(null);

export const HRProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { 
    user: currentUser, 
    canRead, 
    canWrite, 
    canDelete, 
    canCreate, 
    canExport, 
    canImport, 
    canShare, 
    checkPermission, 
    getFieldPermStatus,
    getPermLevel,
    getDataScope
  } = useAuth();

  const { filterDataByScope, isScreenHidden, isSuperAdmin } = useRBAC();

  const isHRAdmin = useMemo(() => {
    if ((currentUser as any)?.isPreviewActive) return false;
    return (
      currentUser?.role === 'Admin' || 
      currentUser?.role_name === 'Admin' || 
      currentUser?.role_id === 1 || 
      (currentUser as any)?.is_super_admin === true || 
      currentUser?.email === 'admin@gmail.com' || 
      currentUser?.email === 'admin@opex.com'
    );
  }, [currentUser]);

  // Strict Restriction: "Manage Permissions" is exclusively for the owner / super admin
  const canManagePermissions = useMemo(() => {
    if ((currentUser as any)?.isPreviewActive) return false;
    const email = currentUser?.email?.toLowerCase().trim();
    if (email === 'esraaessoo19@gmail.com') return true;
    return Boolean(
      (currentUser as any)?.is_super_admin === true ||
      (currentUser?.role_id === 1 && (email === 'admin@gmail.com' || email === 'admin@opex.com')) ||
      (isSuperAdmin && email === 'esraaessoo19@gmail.com')
    );
  }, [currentUser, isSuperAdmin]);

  // Core Data States
  const [rawEmployees, setEmployees] = useState<Employee[]>(() => {
    try {
      const cached = localStorage.getItem('hr_cached_employees');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [rawDepartments, setDepartments] = useState<Department[]>(() => {
    try {
      const cached = localStorage.getItem('hr_cached_departments');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [rawPayroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [payrollConfig, setPayrollConfig] = useState<any>(null);
  const [rawAttendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [rawLeaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [rawPerformance, setPerformance] = useState<PerformanceReview[]>([]);
  const [rawComplaints, setComplaints] = useState<any[]>([]);
  const [rawShiftSwaps, setShiftSwaps] = useState<any[]>([]);
  const [hrLogs, setHrLogs] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Data Scoping via RBACContext (Layer 3)
  const scopedEmployees = useMemo(() => {
    return filterDataByScope(rawEmployees, 'directory', { module: 'HR' });
  }, [rawEmployees, filterDataByScope]);

  const scopedPayroll = useMemo(() => {
    return filterDataByScope(rawPayroll, 'payroll', { module: 'HR' });
  }, [rawPayroll, filterDataByScope]);

  const scopedAttendance = useMemo(() => {
    return filterDataByScope(rawAttendance, 'attendance', { module: 'HR' });
  }, [rawAttendance, filterDataByScope]);

  const scopedLeaves = useMemo(() => {
    return filterDataByScope(rawLeaves, 'leaves', { module: 'HR' });
  }, [rawLeaves, filterDataByScope]);

  const scopedPerformance = useMemo(() => {
    return filterDataByScope(rawPerformance, 'performance', { module: 'HR' });
  }, [rawPerformance, filterDataByScope]);

  const scopedComplaints = useMemo(() => {
    return filterDataByScope(rawComplaints, 'complaints', { module: 'HR' });
  }, [rawComplaints, filterDataByScope]);

  // Modals & UI States
  const [showManagePermissionsModal, setShowManagePermissionsModal] = useState(false);
  const [showClearHrDataConfirm, setShowClearHrDataConfirm] = useState(false);
  const [hrToast, setHrToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Salary Visibility (Shared across Directory & Employee Files)
  const [isSalaryVisible, setIsSalaryVisible] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('hr_directory_salary_visible');
      if (stored !== null) return stored === 'true';
    } catch (e) {}
    return true;
  });

  const toggleSalaryVisibility = useCallback(() => {
    setIsSalaryVisible(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hr_directory_salary_visible', String(next));
        window.dispatchEvent(new CustomEvent('hr_salary_visible_change', { detail: { isSalaryVisible: next } }));
      } catch (e) {}
      return next;
    });
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hr_directory_salary_visible' && e.newValue !== null) {
        setIsSalaryVisible(e.newValue === 'true');
      }
    };
    const handleCustom = (e: Event) => {
      const customDetail = (e as CustomEvent)?.detail;
      if (customDetail && typeof customDetail.isSalaryVisible === 'boolean') {
        setIsSalaryVisible(customDetail.isSalaryVisible);
      } else {
        try {
          const stored = localStorage.getItem('hr_directory_salary_visible');
          if (stored !== null) setIsSalaryVisible(stored === 'true');
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('hr_salary_visible_change', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('hr_salary_visible_change', handleCustom);
    };
  }, []);

  const canViewSalaryPerm = useMemo(() => {
    return isHRAdmin || (checkPermission as any)('HR', 'custom:Directory_showSalary') !== false;
  }, [isHRAdmin, checkPermission]);

  const [permRoles, setPermRoles] = useState<any[]>([]);
  const [permUsers, setPermUsers] = useState<any[]>([]);
  const [selectedPermRoleId, setSelectedPermRoleId] = useState<number | null>(null);
  const [selectedPermUserId, setSelectedPermUserId] = useState<number | null>(null);

  const loadedTabsRef = useRef<Set<string>>(new Set());

  const showCustomToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setHrToast({ message, type });
    setTimeout(() => setHrToast(null), 3500);
  }, []);

  const getCustomActionAccess = useCallback((actionName: string, fallback: boolean = false): boolean => {
    if (isHRAdmin) return true;
    const permissions = (currentUser as any)?.permissions;
    const hrPerms = permissions?.HR?.custom_actions || permissions?.['HR Management']?.custom_actions;
    if (hrPerms) {
      if (hrPerms[actionName] !== undefined) {
        return !!hrPerms[actionName];
      }
      // Check namespaced matching (e.g. hr:directory:add_employee vs add_employee)
      const shortAction = actionName.includes(':') ? actionName.split(':').pop()! : actionName;
      if (hrPerms[shortAction] !== undefined) {
        return !!hrPerms[shortAction];
      }
      for (const k of Object.keys(hrPerms)) {
        if (k.endsWith(':' + shortAction) || shortAction === k) {
          return !!hrPerms[k];
        }
      }
    }
    const checkVal = (checkPermission as any)('HR', 'custom:' + actionName);
    if (checkVal !== undefined && typeof checkVal === 'boolean') {
      return checkVal;
    }
    if (actionName.includes(':')) {
      const shortAction = actionName.split(':').pop()!;
      const checkShort = (checkPermission as any)('HR', 'custom:' + shortAction);
      if (checkShort !== undefined && typeof checkShort === 'boolean') {
        return checkShort;
      }
    }
    return fallback;
  }, [isHRAdmin, currentUser, checkPermission]);

  const getFieldPerm = useCallback((fieldKey: string, sectionKey?: string): 'editable' | 'readonly' | 'hidden' => {
    if (isHRAdmin) return 'editable';
    const status = getFieldPermStatus('HR', fieldKey, 0, sectionKey || 'Employee Directory');
    if (status === 'hidden') return 'hidden';
    if (status === 'readonly') return 'readonly';
    return status;
  }, [isHRAdmin, getFieldPermStatus]);

  // Granular Action Permissions
  const canAddEmployee = useMemo(() => getCustomActionAccess('add_employee', canCreate('HR', 'Employee Directory')), [getCustomActionAccess, canCreate]);
  const canEditEmployee = useMemo(() => getCustomActionAccess('edit_employee', canWrite('HR', 'Employee Directory')), [getCustomActionAccess, canWrite]);
  const canDeleteEmployee = useMemo(() => getCustomActionAccess('delete_employee', canDelete('HR', 'Employee Directory')), [getCustomActionAccess, canDelete]);
  const canShareEmployee = useMemo(() => getCustomActionAccess('share_employee', canShare('HR', 'Employee Directory')), [getCustomActionAccess, canShare]);
  const canExportEmployee = useMemo(() => canExport('HR', 'Employee Directory'), [canExport]);
  const canImportEmployee = useMemo(() => canImport('HR', 'Employee Directory'), [canImport]);

  const canViewDept = useMemo(() => getCustomActionAccess('view_department', canRead('HR', 'Departments & Structure')), [getCustomActionAccess, canRead]);
  const canAddDept = useMemo(() => getCustomActionAccess('add_department', canCreate('HR', 'Departments & Structure')), [getCustomActionAccess, canCreate]);
  const canEditDept = useMemo(() => getCustomActionAccess('edit_department', canWrite('HR', 'Departments & Structure')), [getCustomActionAccess, canWrite]);
  const canDeleteDept = useMemo(() => getCustomActionAccess('delete_department', canDelete('HR', 'Departments & Structure')), [getCustomActionAccess, canDelete]);
  const canShareDept = useMemo(() => getCustomActionAccess('share_department', canShare('HR', 'Departments & Structure')), [getCustomActionAccess, canShare]);

  const canCreateRecruitment = useMemo(() => getCustomActionAccess('add_job_posting', canCreate('HR', 'Recruitment & Jobs')), [getCustomActionAccess, canCreate]);
  const canEditRecruitment = useMemo(() => getCustomActionAccess('edit_job_posting', canWrite('HR', 'Recruitment & Jobs')), [getCustomActionAccess, canWrite]);
  const canDeleteRecruitment = useMemo(() => getCustomActionAccess('edit_job_posting', canDelete('HR', 'Recruitment & Jobs')), [getCustomActionAccess, canDelete]);

  const canRunPayroll = useMemo(() => getCustomActionAccess('run_payroll', canCreate('HR', 'Payroll & Salaries')), [getCustomActionAccess, canCreate]);
  const canDeletePayroll = useMemo(() => getCustomActionAccess('delete_payroll', canDelete('HR', 'Payroll & Salaries')), [getCustomActionAccess, canDelete]);

  const canAdjustLeaveBalances = useMemo(() => getCustomActionAccess('adjust_leave_balances', canWrite('HR', 'Time Off & Leaves')), [getCustomActionAccess, canWrite]);
  const canApproveLeaves = useMemo(() => getCustomActionAccess('approve_leaves', canWrite('HR', 'Time Off & Leaves')), [getCustomActionAccess, canWrite]);
  const canRejectLeaves = useMemo(() => getCustomActionAccess('reject_leaves', canWrite('HR', 'Time Off & Leaves')), [getCustomActionAccess, canWrite]);
  const canRequestLeave = useMemo(() => getCustomActionAccess('request_leave', true), [getCustomActionAccess]);
  const canEditLeave = useMemo(() => getCustomActionAccess('edit_leave', canWrite('HR', 'Time Off & Leaves')), [getCustomActionAccess, canWrite]);
  const canBulkApproveLeaves = useMemo(() => getCustomActionAccess('bulk_approve_leaves', canWrite('HR', 'Time Off & Leaves')), [getCustomActionAccess, canWrite]);
  const canFilterLeaves = useMemo(() => getCustomActionAccess('filter_leaves', true), [getCustomActionAccess]);

  const canClockInOut = useMemo(() => getCustomActionAccess('attendance_clock_in_out', canWrite('HR', 'Attendance & Clock In')), [getCustomActionAccess, canWrite]);
  const canManageShifts = useMemo(() => getCustomActionAccess('attendance_manage_shifts', canCreate('HR', 'Attendance & Clock In')), [getCustomActionAccess, canCreate]);
  const canDeleteShift = useMemo(() => getCustomActionAccess('attendance_manage_shifts', canDelete('HR', 'Attendance & Clock In')), [getCustomActionAccess, canDelete]);
  const canSmartSync = useMemo(() => getCustomActionAccess('attendance_smart_sync', true), [getCustomActionAccess]);
  const canFilterDailyLogs = useMemo(() => getCustomActionAccess('attendance_filter_logs', true), [getCustomActionAccess]);
  const canEditAttendanceLogs = useMemo(() => getCustomActionAccess('attendance_edit_logs', canWrite('HR', 'Attendance & Clock In')), [getCustomActionAccess, canWrite]);
  const canExportAttendanceLogs = useMemo(() => getCustomActionAccess('attendance_export', canExport('HR', 'Attendance & Clock In')), [getCustomActionAccess, canExport]);

  const canAssignShift = useMemo(() => getCustomActionAccess('assign_shift', canCreate('HR', 'Attendance & Clock In')), [getCustomActionAccess, canCreate]);
  const canCreateNewShift = useMemo(() => getCustomActionAccess('create_new_shift', canCreate('HR', 'Attendance & Clock In')), [getCustomActionAccess, canCreate]);
  const canManageShiftSchedule = useMemo(() => getCustomActionAccess('view_edit_shift_schedule', canWrite('HR', 'Attendance & Clock In')), [getCustomActionAccess, canWrite]);
  const canEditShiftOptions = useMemo(() => getCustomActionAccess('edit_shift', canWrite('HR', 'Attendance & Clock In')), [getCustomActionAccess, canWrite]);
  const canFilterShifts = useMemo(() => getCustomActionAccess('filter_shifts', true), [getCustomActionAccess]);

  const canAddBreakSlot = useMemo(() => getCustomActionAccess('add_break_slot', true), [getCustomActionAccess]);
  const canEditBreakSlot = useMemo(() => getCustomActionAccess('edit_break_slot', true), [getCustomActionAccess]);
  const canDeleteBreakSlot = useMemo(() => getCustomActionAccess('delete_break_slot', true), [getCustomActionAccess]);
  const canFilterBreaks = useMemo(() => getCustomActionAccess('filter_breaks', true), [getCustomActionAccess]);

  const canNewEvaluation = useMemo(() => getCustomActionAccess('performance_add_review', canCreate('HR', 'Performance & OKRs')), [getCustomActionAccess, canCreate]);
  const canManageOKRs = useMemo(() => getCustomActionAccess('performance_manage_okrs', canWrite('HR', 'Performance & OKRs')), [getCustomActionAccess, canWrite]);

  const canViewComplaint = useMemo(() => getCustomActionAccess('complaints_view', canRead('HR', 'Complaints & Grievances')), [getCustomActionAccess, canRead]);
  const canEditComplaint = useMemo(() => getCustomActionAccess('complaints_edit', canWrite('HR', 'Complaints & Grievances')), [getCustomActionAccess, canWrite]);
  const canSubmitComplaint = useMemo(() => getCustomActionAccess('complaints_submit', true), [getCustomActionAccess]);
  const canResolveComplaint = useMemo(() => getCustomActionAccess('complaints_resolve', canWrite('HR', 'Complaints & Grievances')), [getCustomActionAccess, canWrite]);
  const canDeleteComplaint = useMemo(() => getCustomActionAccess('complaints_delete', canDelete('HR', 'Complaints & Grievances')), [getCustomActionAccess, canDelete]);
  const canShareComplaint = useMemo(() => getCustomActionAccess('complaints_share', canShare('HR', 'Complaints & Grievances')), [getCustomActionAccess, canShare]);

  const canRequestSwap = useMemo(() => getCustomActionAccess('request_shift_swap', true) || getCustomActionAccess('swap_request', true), [getCustomActionAccess]);
  const canEditShiftSwap = useMemo(() => getCustomActionAccess('edit_shift_swap', true), [getCustomActionAccess]);
  const canApproveSwapManager = useMemo(() => getCustomActionAccess('swap_manager_approve', canWrite('HR', 'Swap Management')), [getCustomActionAccess, canWrite]);
  const canApproveSwapAttendance = useMemo(() => getCustomActionAccess('swap_attendance_approve', canWrite('HR', 'Attendance & Clock In')), [getCustomActionAccess, canWrite]);
  const canDeleteShiftSwap = useMemo(() => getCustomActionAccess('delete_shift_swap', canDelete('HR', 'Swap Management')), [getCustomActionAccess, canDelete]);
  const canFilterSwaps = useMemo(() => getCustomActionAccess('filter_swaps', true), [getCustomActionAccess]);

  const canExportPayrollExcelCSV = useMemo(() => getCustomActionAccess('export_payroll_excel_csv', true), [getCustomActionAccess]);
  const canPrintPDFReport = useMemo(() => getCustomActionAccess('print_pdf_report', true), [getCustomActionAccess]);
  const canGeneratePayrollReport = useMemo(() => getCustomActionAccess('generate_payroll_report', true), [getCustomActionAccess]);
  const canEditPayrollEntry = useMemo(() => getCustomActionAccess('edit_payroll_entry', canWrite('HR', 'Payroll & Salaries')), [getCustomActionAccess, canWrite]);

  // Tabs Definitions
  const allHrTabs: HRTabItem[] = useMemo(() => [
    { id: 'hub', path: '/hr', label: 'Hub', icon: LayoutGrid, name: 'HR Hub' },
    { id: 'dashboard', path: '/hr/dashboard', label: 'Dashboard', icon: BarChart2, name: 'Dashboard' },
    { id: 'directory', path: '/hr/directory', label: 'Directory', icon: Users, name: 'Employee Directory' },
    { id: 'departments', path: '/hr/departments', label: 'Departments', icon: Building2, name: 'Departments & Structure' },
    { id: 'recruitment', path: '/hr/recruitment', label: 'Hiring', icon: Briefcase, name: 'Recruitment & Jobs' },
    { id: 'payroll', path: '/hr/payroll', label: 'Payroll', icon: DollarSign, name: 'Payroll & Salaries' },
    { id: 'attendance', path: '/hr/attendance', label: 'Attendance', icon: Clock, name: 'Attendance & Clock In' },
    { id: 'performance', path: '/hr/performance', label: 'Performance', icon: Award, name: 'Performance & OKRs' },
    { id: 'orgchart', path: '/hr/orgchart', label: 'Org Chart', icon: Network, name: 'Org Chart' },
    { id: 'complaints', path: '/hr/complaints', label: 'Complaints', icon: AlertCircle, name: 'Complaints & Grievances' },
    { id: 'archived', path: '/hr/archived', label: 'Archived Staff', icon: Archive, name: 'Archived Employees' }
  ], []);

  const allowedHrTabs = useMemo(() => {
    return allHrTabs.filter(tab => {
      if (tab.id === 'hub') return true;
      if (isHRAdmin || isSuperAdmin) return true;
      if (isScreenHidden(tab.id, 'HR') || isScreenHidden(tab.name, 'HR')) {
        return false;
      }
      const isLevelHidden = getPermLevel('HR', tab.id) === 3 || getPermLevel('HR', tab.name) === 3;
      if (isLevelHidden) return false;
      return (
        (canRead('HR', tab.name) || canRead('HR Management', tab.name)) && 
        (checkPermission as any)('HR', 'tab:' + tab.name) !== false
      );
    });
  }, [allHrTabs, isHRAdmin, isSuperAdmin, isScreenHidden, canRead, checkPermission, getPermLevel]);

  // Helper fetch function
  const fetchEndpoint = useCallback(async (url: string, fallback: any = null) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`Failed to fetch ${url}:`, err);
      return fallback;
    }
  }, []);

  const fetchCoreData = useCallback(async () => {
    try {
      const isDirectoryHidden = !isHRAdmin && !isSuperAdmin && (
        isScreenHidden('directory', 'HR') || 
        isScreenHidden('Employee Directory', 'HR') || 
        getPermLevel('HR', 'directory') === 3 ||
        !allowedHrTabs.some(t => t.id === 'directory' || t.id === 'archived')
      );
      const isDeptHidden = !isHRAdmin && !isSuperAdmin && (
        isScreenHidden('departments', 'HR') || 
        isScreenHidden('Departments & Structure', 'HR') || 
        getPermLevel('HR', 'departments') === 3 ||
        !allowedHrTabs.some(t => t.id === 'departments' || t.id === 'orgchart')
      );

      // Progressive Sequential Loading instead of simultaneous Promise.all spike
      if (!isDeptHidden) {
        const deptData = await fetchEndpoint('/api/departments');
        if (deptData) {
          setDepartments(deptData);
          try { localStorage.setItem('hr_cached_departments', JSON.stringify(deptData)); } catch {}
        }
      }

      if (!isDirectoryHidden) {
        const empData = await fetchEndpoint('/api/hr/employees');
        if (empData) {
          setEmployees(empData);
          try { localStorage.setItem('hr_cached_employees', JSON.stringify(empData)); } catch {}
        }
      }
    } catch (err) {
      console.error('Failed to fetch HR core data:', err);
    }
  }, [fetchEndpoint, isHRAdmin, isSuperAdmin, isScreenHidden, getPermLevel, allowedHrTabs]);

  const fetchTabData = useCallback(async (tab: string, force: boolean = false) => {
    if (!tab) return;

    // CRITICAL USER REQUIREMENT: If tab is hidden or restricted from view, NEVER make any query for it!
    // "المفروض الحاجه اللي امنع رؤيتها متظهرش نهائيا و متعملهاش اي استعلام خالص"
    if (!isHRAdmin && !isSuperAdmin) {
      const isHidden = isScreenHidden(tab, 'HR') || getPermLevel('HR', tab) === 3 || !allowedHrTabs.some(t => t.id === tab);
      if (isHidden) {
        return;
      }
    }

    if (!force && loadedTabsRef.current.has(tab)) {
      return;
    }

    try {
      if (rawEmployees.length === 0 || rawDepartments.length === 0) {
        await fetchCoreData();
      }

      switch (tab) {
        case 'dashboard':
        case 'directory':
        case 'orgchart':
        case 'departments':
        case 'archived': {
          await fetchCoreData();
          break;
        }
        case 'recruitment': {
          const pipelinesData = await fetchEndpoint('/api/hr/pipelines');
          if (pipelinesData) setPipelines(pipelinesData);
          break;
        }
        case 'payroll': {
          const [payData, configData] = await Promise.all([
            fetchEndpoint('/api/hr/payroll'),
            fetchEndpoint('/api/hr/payroll/config')
          ]);
          if (payData) setPayroll(payData);
          if (configData) setPayrollConfig(configData);
          break;
        }
        case 'attendance': {
          const [attData, shiftData, shiftAssignData, swapData, leaveData, logsData] = await Promise.all([
            fetchEndpoint('/api/hr/attendance'),
            fetchEndpoint('/api/hr/shifts'),
            fetchEndpoint('/api/hr/shift-assignments'),
            fetchEndpoint('/api/hr/shift-swaps'),
            fetchEndpoint('/api/hr/leave'),
            fetchEndpoint('/api/hr/logs')
          ]);
          if (attData) setAttendance(attData);
          if (shiftData) setShifts(shiftData);
          if (shiftAssignData) setShiftAssignments(shiftAssignData);
          if (swapData) setShiftSwaps(swapData);
          if (leaveData) setLeaves(leaveData);
          if (logsData) setHrLogs(logsData);
          break;
        }
        case 'performance': {
          const perfData = await fetchEndpoint('/api/hr/performance');
          if (perfData) setPerformance(perfData);
          break;
        }
        case 'complaints': {
          const compData = await fetchEndpoint('/api/hr/complaints');
          if (compData) setComplaints(compData);
          break;
        }
        default:
          break;
      }

      loadedTabsRef.current.add(tab);
    } catch (err) {
      console.error(`Failed to fetch tab data for [${tab}]:`, err);
    } finally {
      setLoading(false);
    }
  }, [fetchEndpoint, fetchCoreData, rawEmployees.length, rawDepartments.length, isHRAdmin, isSuperAdmin, isScreenHidden, getPermLevel, allowedHrTabs]);

  const fetchData = useCallback(async (options?: { silent?: boolean }) => {
    await fetchCoreData();
    loadedTabsRef.current.clear();
  }, [fetchCoreData]);

  const fetchPermissionsData = useCallback(async () => {
    try {
      const [rolesRes, usersRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/users')
      ]);
      const rolesData = await rolesRes.json();
      const usersData = await usersRes.json();

      if (Array.isArray(rolesData)) {
        setPermRoles(rolesData);
        if (rolesData.length > 0) {
          setSelectedPermRoleId(rolesData[0].id);
        }
      }
      if (Array.isArray(usersData)) {
        setPermUsers(usersData);
        if (usersData.length > 0) {
          setSelectedPermUserId(usersData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch permissions data:', err);
    }
  }, []);

  const handleClearHrData = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/clear-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        }
      });
      const data = await res.json();
      if (data.success) {
        showCustomToast('تم مسح جميع بيانات موديول الموارد البشرية بنجاح.', 'success');
        setShowClearHrDataConfirm(false);
        await fetchData();
      } else {
        showCustomToast('حدث خطأ أثناء مسح البيانات: ' + (data.error || 'فشلت العملية'), 'error');
      }
    } catch (err) {
      console.error('Failed to clear HR data:', err);
      showCustomToast('فشل الاتصال بالخادم لمسح البيانات.', 'error');
    }
  }, [currentUser, showCustomToast, fetchData]);

  // Initial Core Fetch - Skip when on root launchpads (/hr, /hr/hub, /hr/attendance) to enforce ZERO initial DB queries!
  useEffect(() => {
    if (
      location.pathname === '/hr' ||
      location.pathname === '/hr/' ||
      location.pathname === '/hr/hub' ||
      location.pathname === '/hr/attendance' ||
      location.pathname === '/hr/attendance/'
    ) {
      return;
    }
    fetchCoreData();
  }, [fetchCoreData, location.pathname]);

  // Fetch permissions when modal opens
  useEffect(() => {
    if (showManagePermissionsModal) {
      fetchPermissionsData();
    }
  }, [showManagePermissionsModal, fetchPermissionsData]);

  const contextValue: HRContextType = {
    employees: scopedEmployees,
    setEmployees,
    rawEmployees,
    departments: rawDepartments,
    setDepartments,
    rawDepartments,
    shifts,
    setShifts,
    shiftAssignments,
    setShiftAssignments,
    payroll: scopedPayroll,
    setPayroll,
    rawPayroll,
    payrollConfig,
    setPayrollConfig,
    attendance: scopedAttendance,
    setAttendance,
    rawAttendance,
    leaves: scopedLeaves,
    setLeaves,
    rawLeaves,
    performance: scopedPerformance,
    setPerformance,
    rawPerformance,
    complaints: scopedComplaints,
    setComplaints,
    rawComplaints,
    shiftSwaps: rawShiftSwaps,
    setShiftSwaps,
    rawShiftSwaps,
    hrLogs,
    setHrLogs,
    pipelines,
    setPipelines,
    loading,
    setLoading,

    showManagePermissionsModal,
    setShowManagePermissionsModal,
    showClearHrDataConfirm,
    setShowClearHrDataConfirm,
    hrToast,
    setHrToast,
    showCustomToast,
    handleClearHrData,

    allHrTabs,
    allowedHrTabs,

    currentUser,
    isHRAdmin,
    canRead,
    canWrite,
    canDelete,
    canCreate,
    canExport,
    canImport,
    canShare,
    checkPermission,
    getCustomActionAccess,
    getFieldPerm,
    getFieldPermStatus,

    canAddEmployee,
    canEditEmployee,
    canDeleteEmployee,
    canShareEmployee,
    canExportEmployee,
    canImportEmployee,
    canViewDept,
    canAddDept,
    canEditDept,
    canDeleteDept,
    canShareDept,
    canCreateRecruitment,
    canEditRecruitment,
    canDeleteRecruitment,
    canRunPayroll,
    canDeletePayroll,
    canAdjustLeaveBalances,
    canApproveLeaves,
    canRejectLeaves,
    canRequestLeave,
    canEditLeave,
    canBulkApproveLeaves,
    canFilterLeaves,
    canClockInOut,
    canManageShifts,
    canDeleteShift,
    canSmartSync,
    canFilterDailyLogs,
    canEditAttendanceLogs,
    canExportAttendanceLogs,
    canAssignShift,
    canCreateNewShift,
    canManageShiftSchedule,
    canEditShiftOptions,
    canFilterShifts,
    canAddBreakSlot,
    canEditBreakSlot,
    canDeleteBreakSlot,
    canFilterBreaks,
    canNewEvaluation,
    canManageOKRs,
    canViewComplaint,
    canEditComplaint,
    canSubmitComplaint,
    canResolveComplaint,
    canDeleteComplaint,
    canShareComplaint,
    canRequestSwap,
    canEditShiftSwap,
    canApproveSwapManager,
    canApproveSwapAttendance,
    canDeleteShiftSwap,
    canFilterSwaps,
    canExportPayrollExcelCSV,
    canPrintPDFReport,
    canGeneratePayrollReport,
    canEditPayrollEntry,
    canManagePermissions,

    fetchCoreData,
    fetchTabData,
    fetchData,
    fetchEndpoint,
    fetchPermissionsData,
    permRoles,
    permUsers,
    selectedPermRoleId,
    setSelectedPermRoleId,
    selectedPermUserId,
    setSelectedPermUserId,

    // Salary Visibility (Directory & Employee Files)
    isSalaryVisible,
    setIsSalaryVisible,
    toggleSalaryVisibility,
    canViewSalaryPerm
  };

  return (
    <HRContext.Provider value={contextValue}>
      {children}
    </HRContext.Provider>
  );
};

export const useHRContext = (): HRContextType => {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error('useHRContext must be used within an HRProvider');
  }
  return context;
};

// Standalone or Context-compatible hook for Salary Visibility
export const useSalaryVisibility = () => {
  const hrContext = useContext(HRContext);
  const [localVisible, setLocalVisible] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('hr_directory_salary_visible');
      if (stored !== null) return stored === 'true';
    } catch (e) {}
    return true;
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hr_directory_salary_visible' && e.newValue !== null) {
        setLocalVisible(e.newValue === 'true');
      }
    };
    const handleCustom = (e: Event) => {
      const customDetail = (e as CustomEvent)?.detail;
      if (customDetail && typeof customDetail.isSalaryVisible === 'boolean') {
        setLocalVisible(customDetail.isSalaryVisible);
      } else {
        try {
          const stored = localStorage.getItem('hr_directory_salary_visible');
          if (stored !== null) setLocalVisible(stored === 'true');
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('hr_salary_visible_change', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('hr_salary_visible_change', handleCustom);
    };
  }, []);

  if (hrContext) {
    return {
      isSalaryVisible: hrContext.isSalaryVisible,
      toggleSalaryVisibility: hrContext.toggleSalaryVisibility,
      setIsSalaryVisible: hrContext.setIsSalaryVisible,
      canViewSalaryPerm: hrContext.canViewSalaryPerm
    };
  }

  const toggle = () => {
    setLocalVisible(prev => {
      const next = !prev;
      try {
        localStorage.setItem('hr_directory_salary_visible', String(next));
        window.dispatchEvent(new CustomEvent('hr_salary_visible_change', { detail: { isSalaryVisible: next } }));
      } catch (e) {}
      return next;
    });
  };

  return {
    isSalaryVisible: localVisible,
    toggleSalaryVisibility: toggle,
    setIsSalaryVisible: (val: boolean | ((p: boolean) => boolean)) => {
      const next = typeof val === 'function' ? val(localVisible) : val;
      setLocalVisible(next);
      try {
        localStorage.setItem('hr_directory_salary_visible', String(next));
        window.dispatchEvent(new CustomEvent('hr_salary_visible_change', { detail: { isSalaryVisible: next } }));
      } catch (e) {}
    },
    canViewSalaryPerm: true
  };
};
