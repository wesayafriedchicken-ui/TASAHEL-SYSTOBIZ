import React, { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import { useParams, useNavigate, useLocation, Outlet, NavLink } from 'react-router-dom';
import { 
  ArrowLeft, ChevronLeft, ChevronRight, X, Edit2, Eye, 
  Camera, Lock, Unlock, Globe, FileText, Phone, Smartphone, Mail,
  Cake, Clock, MapPin, Briefcase, Users, PhoneCall, Fingerprint,
  User, Check, AlertCircle, Loader2, DollarSign, ChevronDown,
  Repeat, Calendar, Plus, UserX, Linkedin, Twitter, Facebook,
  Instagram, Youtube
} from 'lucide-react';
import { getDefaultAvatar } from '../../../utils/defaultAvatars';
import { TabSkeletonLoader } from './tabs/TabSkeletonLoader';
import { EmployeeProfileOutletContext } from './tabs/types';
import { cn } from '../../../lib/utils';
import { Employee } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { CustomizeLayoutDropdown } from '../../../components/HR/CustomizeLayoutDropdown';
import { EmployeeMoreOptionsMenu } from '../../../components/HR/EmployeeMoreOptionsMenu';
import { AddEmployeeModal } from '../../../components/HR/AddEmployeeModal';
import { HRPermissionsManagerModal, HRPermissionsTabType } from '../../../components/HR/HRPermissionsManagerModal';
import { LeaveRequestModal } from './components/LeaveRequestModal';
import { FileComplaintModal } from './components/FileComplaintModal';
import { ShiftSwapModal } from './components/ShiftSwapModal';
import { useActionControls } from '../../../hooks/useActionControls';

const MORE_SUB_TABS = ['assets', 'benefits', 'onboarding', 'offboarding'] as const;

const getSafeArrayField = (val: any): any[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = typeof val === 'string' ? JSON.parse(val) : val;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getLatestJobInfo = (jobInfos: any[]) => {
  const arr = getSafeArrayField(jobInfos);
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  return sorted[0];
};

const getCalculatedTenure = (hireDateInput?: string | Date, endDateInput?: string | Date, statusStr?: string) => {
  if (!hireDateInput) return null;
  const hireDate = typeof hireDateInput === 'string' ? new Date(hireDateInput) : hireDateInput;
  if (isNaN(hireDate.getTime()) || hireDate.getFullYear() <= 1970) return null;
  const isOffboarded = ['inactive', 'terminated', 'archived', 'suspended', 'deleted'].includes((statusStr || '').toLowerCase());
  let targetEndDate: Date;
  if (isOffboarded && endDateInput) {
    const parsedEnd = typeof endDateInput === 'string' ? new Date(endDateInput) : endDateInput;
    targetEndDate = !isNaN(parsedEnd.getTime()) && parsedEnd.getFullYear() > 1970 ? parsedEnd : new Date();
  } else {
    targetEndDate = new Date();
  }
  if (targetEndDate < hireDate) {
    return {
      tenureStr: '0 days',
      formattedDate: hireDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      formattedEndDate: targetEndDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      isOffboarded,
      totalDays: 0
    };
  }
  let years = targetEndDate.getFullYear() - hireDate.getFullYear();
  let months = targetEndDate.getMonth() - hireDate.getMonth();
  let days = targetEndDate.getDate() - hireDate.getDate();
  if (days < 0) {
    months--;
    const prevMonth = new Date(targetEndDate.getFullYear(), targetEndDate.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  const formattedDate = hireDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedEndDate = targetEndDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (days > 0 || parts.length === 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  return { 
    tenureStr: parts.join(', '), 
    formattedDate, 
    formattedEndDate, 
    isOffboarded,
    totalDays: Math.ceil(Math.abs(targetEndDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24))
  };
};

export const EmployeeProfileLayout: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { getActionStatus: getActionSecurityStatus } = useActionControls();

  // Basic shell state
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allEmployeeIds, setAllEmployeeIds] = useState<(string | number)[]>([]);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState<boolean>(false);
  const [isSalaryVisible, setIsSalaryVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isChangePhotoOpen, setIsChangePhotoOpen] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [shiftsList, setShiftsList] = useState<any[]>([]);

  // Action Buttons & Modals state
  const [showChangeRequestDropdown, setShowChangeRequestDropdown] = useState(false);
  const changeRequestDropdownRef = useRef<HTMLDivElement>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [showManagePermissionsModal, setShowManagePermissionsModal] = useState(false);
  const [permissionsModalTab, setPermissionsModalTab] = useState<HRPermissionsTabType>('emails');

  // Close dropdown on outside click or when another dropdown opens
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (changeRequestDropdownRef.current && !changeRequestDropdownRef.current.contains(e.target as Node)) {
        setShowChangeRequestDropdown(false);
      }
    };
    const handleCloseOthers = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.except !== 'change_request') {
        setShowChangeRequestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('close-hr-dropdowns', handleCloseOthers);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('close-hr-dropdowns', handleCloseOthers);
    };
  }, []);

  // Extract current active subpath from location
  const currentPathSegments = location.pathname.split('/').filter(Boolean);
  const currentSubTab = currentPathSegments[currentPathSegments.length - 1] || 'personal';
  const isMoreActive = MORE_SUB_TABS.includes(currentSubTab as any);

  const showCustomToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch list of employee IDs, departments, shifts
  useEffect(() => {
    let isMounted = true;
    fetch('/api/hr/employees')
      .then(res => res.json())
      .then(data => {
        if (isMounted && Array.isArray(data)) {
          setEmployeesList(data);
          setAllEmployeeIds(data.map((e: any) => e.id));
        }
      })
      .catch(err => console.warn('Could not load employee directory index:', err));

    fetch('/api/hr/departments')
      .then(res => res.json())
      .then(data => {
        if (isMounted && Array.isArray(data)) {
          setDepartmentsList(data);
        }
      })
      .catch(err => console.warn('Could not load departments:', err));

    fetch('/api/hr/shifts')
      .then(res => res.json())
      .then(data => {
        if (isMounted && Array.isArray(data)) {
          setShiftsList(data);
        }
      })
      .catch(err => console.warn('Could not load shifts:', err));

    return () => { isMounted = false; };
  }, []);

  // Fetch employee data
  const fetchEmployeeData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/employees/${id}/details`);
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
        return;
      }
      const basicRes = await fetch(`/api/hr/employees/${id}`);
      if (basicRes.ok) {
        const data = await basicRes.json();
        setEmployee(data);
        return;
      }
    } catch (err) {
      console.error('Failed to fetch employee record:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const currentIndex = useMemo(() => {
    if (!id || allEmployeeIds.length === 0) return -1;
    return allEmployeeIds.findIndex(empId => String(empId) === String(id));
  }, [id, allEmployeeIds]);

  const handlePrevRecord = () => {
    if (currentIndex > 0) {
      const prevId = allEmployeeIds[currentIndex - 1];
      navigate(`/hr/directory/${prevId}/${currentSubTab}`);
    }
  };

  const handleNextRecord = () => {
    if (currentIndex >= 0 && currentIndex < allEmployeeIds.length - 1) {
      const nextId = allEmployeeIds[currentIndex + 1];
      navigate(`/hr/directory/${nextId}/${currentSubTab}`);
    }
  };

  const handleSaveEmployeeDetails = async (updatedFields: Partial<Employee>) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const updated = await res.json().catch(() => ({ ...employee, ...updatedFields }));
        setEmployee(prev => prev ? { ...prev, ...updated, ...updatedFields } : null);
        showCustomToast('Profile updated successfully', 'success');
        fetchEmployeeData();
      } else {
        const err = await res.json().catch(() => ({}));
        showCustomToast(err.error || 'Failed to update employee details', 'error');
      }
    } catch (err) {
      console.error('Save employee error:', err);
      showCustomToast('Network error while updating employee', 'error');
    }
  };

  const handleSaveAvatar = async () => {
    if (!newAvatarUrl.trim()) return;
    await handleSaveEmployeeDetails({ avatar_url: newAvatarUrl.trim() });
    setIsChangePhotoOpen(false);
    setNewAvatarUrl('');
  };

  // Edit employee submit handler
  const handleSaveEditedEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    try {
      const res = await fetch(`/api/hr/employees/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify(editFormData)
      });
      if (res.ok) {
        showCustomToast('Employee profile updated successfully', 'success');
        setShowEditModal(false);
        fetchEmployeeData();
      } else {
        showCustomToast('Failed to update employee profile', 'error');
      }
    } catch (err) {
      console.error('Error saving employee:', err);
      showCustomToast('Server error while saving employee', 'error');
    }
  };

  // Remove direct report handler
  const handleRemoveDirectReport = async (dr: any, managerEmp?: any) => {
    if (!dr) return;
    const targetManagerId = managerEmp?.id || employee?.id;
    const confirmMsg = `Are you sure you want to remove ${dr.name || 'this employee'} from direct reports?`;
    if (!window.confirm(confirmMsg)) return;
    try {
      setEmployeesList(prev => prev.map(e => {
        if (e.id === dr.id || (dr.user_id && e.user_id === dr.user_id)) {
          const cleanJobInfos = getSafeArrayField(e.job_informations).map((ji: any) => ({
            ...ji,
            reportingTo: ''
          }));
          return {
            ...e,
            reporting_to: null,
            manager_name: null,
            job_informations: cleanJobInfos,
            personal_info: {
              ...(typeof e.personal_info === 'object' ? e.personal_info : {}),
              reporting_to: null,
              manager_name: null,
              reportingTo: null
            }
          };
        }
        return e;
      }));

      const res = await fetch(`/api/hr/employees/${targetManagerId}/remove-direct-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify({
          directReportId: dr.user_id || dr.id
        })
      });

      if (!res.ok) {
        const cleanJobInfos = getSafeArrayField(dr.job_informations).map((ji: any) => ({
          ...ji,
          reportingTo: ''
        }));
        await fetch(`/api/hr/employees/${dr.user_id || dr.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser?.id?.toString() || '1'
          },
          body: JSON.stringify({
            ...dr,
            reporting_to: null,
            manager_name: null,
            job_informations: cleanJobInfos
          })
        });
      }

      showCustomToast('Direct report removed successfully', 'success');
      fetchEmployeeData();
    } catch (err) {
      console.error('Error removing direct report:', err);
      showCustomToast('Failed to remove direct report', 'error');
    }
  };

  const getResolvedManagerDisplay = (repToVal?: string | number) => {
    if (!repToVal) return 'Unassigned';
    const match = employeesList.find(e => String(e.id) === String(repToVal) || String(e.user_id) === String(repToVal));
    if (match) return `${match.name} (${match.job_title || 'Manager'})`;
    return String(repToVal);
  };

  // Calculated profile summaries matching original JSX
  const effectiveJobInfos = getSafeArrayField(employee?.job_informations);
  const latestJobInfo = getLatestJobInfo(effectiveJobInfos);
  const displayJobTitle = latestJobInfo?.jobTitle || employee?.job_title || 'Employee';
  const displayDeptName = latestJobInfo?.department || employee?.department_name || 'General';
  const displayManagerName = latestJobInfo?.reportingTo || employee?.manager_name || employee?.reporting_to;
  
  const effectiveStatuses = getSafeArrayField(employee?.employment_statuses);
  const latestStatusRow = [...effectiveStatuses].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
  const displayContractType = latestStatusRow?.status || employee?.contract_type || 'Full-time';

  const effectiveComps = getSafeArrayField(employee?.compensations);
  const latestCompRow = [...effectiveComps].sort((a: any, b: any) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())[0];
  const displayBaseSalary = latestCompRow?.payRate ? (typeof latestCompRow.payRate === 'number' ? latestCompRow.payRate : parseFloat(latestCompRow.payRate)) : (employee?.salary_base || 0);

  const kpiSettings = (employee?.personal_info as any)?.kpi_settings || {};
  const jobKpiAmount = kpiSettings.amount ?? employee?.kpi_amount ?? (employee as any)?.kpis ?? 0;
  const jobKpiFrequency = kpiSettings.frequency || employee?.kpi_frequency || 'Monthly';
  const jobAllowances = employee?.allowances || 0;

  // Tenure & Contract
  const empHireDateVal = employee?.joined_at || employee?.contract_start_date || (employee as any)?.hire_date;
  const empStatusDateVal = employee?.contract_end_date;
  const empStatusVal = employee?.status;
  const empTenureDetails = getCalculatedTenure(empHireDateVal, empStatusDateVal, empStatusVal);
  const joinedDate = empHireDateVal ? new Date(empHireDateVal) : new Date();

  // Age calculation
  const calculatedAge = useMemo(() => {
    const dob = (employee?.personal_info as any)?.dob || employee?.date_of_birth || (employee as any)?.birth_date;
    if (!dob) return null;
    try {
      const birth = new Date(dob);
      if (isNaN(birth.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? age : null;
    } catch {
      return null;
    }
  }, [employee]);

  // Manager resolution
  const managerObj = useMemo(() => {
    return employeesList.find(e => 
      e.id !== employee?.id && (
        e.id === employee?.reporting_to || 
        e.user_id === employee?.reporting_to || 
        String(e.id) === String(displayManagerName) || 
        String(e.user_id) === String(displayManagerName) || 
        (typeof displayManagerName === 'string' && displayManagerName.trim() !== '' && (
          e.name?.toLowerCase().trim() === (displayManagerName || '').toLowerCase().trim() ||
          e.job_title?.toLowerCase().trim() === (displayManagerName || '').toLowerCase().trim() ||
          (e.job_title && (displayManagerName || '').toLowerCase().trim().includes((e.job_title || '').toLowerCase().trim())) ||
          (e.job_title && (e.job_title || '').toLowerCase().trim().includes((displayManagerName || '').toLowerCase().trim()))
        ))
      )
    );
  }, [employeesList, employee, displayManagerName]);

  // Direct reports calculation
  const directReports = useMemo(() => {
    if (!employee) return [];
    return employeesList.filter(e => {
      if (!e || e.id === employee.id || (e.user_id && e.user_id === employee.id) || (employee.user_id && e.id === employee.user_id)) return false;
      const eJobInfos = getSafeArrayField(e.job_informations);
      const eLatestJob = getLatestJobInfo(eJobInfos);
      const eMgr = eLatestJob?.reportingTo || e.reporting_to || e.manager_name;
      if (!eMgr) return false;

      const eMgrStr = String(eMgr).trim().toLowerCase();
      const empNameStr = String(employee.name || '').trim().toLowerCase();
      const empTitleStr = String(displayJobTitle || employee.job_title || '').trim().toLowerCase();
      const empIdStr = String(employee.id);
      const empUserIdStr = String(employee.user_id || '');

      return (
        e.reporting_to === employee.id || 
        e.reporting_to === employee.user_id || 
        String(eMgr) === empIdStr || 
        String(eMgr) === empUserIdStr || 
        (empNameStr && eMgrStr === empNameStr) ||
        (empTitleStr && eMgrStr === empTitleStr) ||
        (empTitleStr && eMgrStr.length >= 3 && empTitleStr.includes(eMgrStr)) ||
        (empTitleStr && eMgrStr.length >= 3 && eMgrStr.includes(empTitleStr))
      );
    });
  }, [employeesList, employee, displayJobTitle]);

  const contextValue: EmployeeProfileOutletContext = {
    employee,
    basicInfo: employee || {},
    isViewOnly: isViewOnlyMode,
    isSalaryVisible,
    onRefreshEmployee: fetchEmployeeData,
    onSaveEmployeeDetails: handleSaveEmployeeDetails,
    currentUser,
    showCustomToast,
    canEditEmployee: !isViewOnlyMode,
    employees: employeesList,
    departments: departmentsList
  };

  const mainTabs = [
    { id: 'personal', label: 'Personal', path: 'personal' },
    { id: 'job', label: 'Job', path: 'job' },
    { id: 'time_off', label: 'Time Off', path: 'time-off' },
    { id: 'emergency', label: 'Emergency', path: 'emergency' },
    { id: 'recognition', label: 'Recognition', path: 'recognition' },
    { id: 'performance', label: 'Performance', path: 'performance' },
    { id: 'training', label: 'Training', path: 'training' },
    { id: 'documents', label: 'Documents', path: 'documents' },
    { id: 'login_info', label: 'Login info', path: 'login-info' },
    { id: 'notes', label: 'Notes', path: 'notes' },
    { id: 'more', label: 'More ▾', path: isMoreActive ? currentSubTab : 'assets', isMore: true },
  ];

  if (loading && !employee) {
    return (
      <div className="flex-1 min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#1E701E] mx-auto" />
          <p className="text-sm font-bold text-slate-500">Loading employee file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={cn(
          "fixed bottom-6 right-6 z-[250] flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-sm font-bold animate-in fade-in slide-in-from-bottom-2",
          toastMessage.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-800",
          toastMessage.type === 'error' && "bg-rose-50 border-rose-200 text-rose-800",
          toastMessage.type === 'info' && "bg-indigo-50 border-indigo-200 text-indigo-800"
        )}>
          {toastMessage.type === 'success' && <Check className="w-4 h-4 text-emerald-600" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate('/hr/directory')}
            className="flex items-center gap-2 text-slate-600 hover:text-[#1E701E] font-bold text-xs transition-colors p-2 hover:bg-slate-50 rounded-xl cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Directory</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Record Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={handlePrevRecord}
              disabled={currentIndex <= 0}
              className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Previous employee file"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-black tracking-wider text-slate-500 px-2 uppercase">
              {currentIndex >= 0 ? `${currentIndex + 1} of ${allEmployeeIds.length}` : 'Record'}
            </span>
            <button
              type="button"
              onClick={handleNextRecord}
              disabled={currentIndex < 0 || currentIndex >= allEmployeeIds.length - 1}
              className="p-1 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-all cursor-pointer"
              title="Next employee file"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider",
            isViewOnlyMode ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-[#1E701E] border border-emerald-200"
          )}>
            <span className={cn("w-2 h-2 rounded-full", isViewOnlyMode ? "bg-amber-500" : "bg-[#1E701E]")} />
            <span>{isViewOnlyMode ? 'View Only Mode' : 'Edit Mode'}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsViewOnlyMode(!isViewOnlyMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {isViewOnlyMode ? <Edit2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isViewOnlyMode ? 'Switch to Edit' : 'Switch to View'}</span>
          </button>
        </div>
      </div>

      {/* 2. Persistent Hero Banner */}
      <div className="bg-[#1E701E] text-white px-6 md:px-10 pt-8 pb-0 relative overflow-visible shadow-sm z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
          <div className="flex items-center gap-5">
            {/* Avatar & Photo Changer */}
            <div className="relative group shrink-0">
              <img 
                src={employee?.avatar_url || getDefaultAvatar(employee?.name || 'Employee')} 
                alt={employee?.name || 'Employee'}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-white/20 shadow-md bg-white/10"
              />
              {!isViewOnlyMode && (
                <button
                  type="button"
                  onClick={() => setIsChangePhotoOpen(!isChangePhotoOpen)}
                  className="absolute bottom-0 right-0 p-2 bg-white text-[#1E701E] rounded-full shadow-lg hover:scale-105 transition-all cursor-pointer"
                  title="Change avatar picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                  {employee?.name || 'Unnamed Employee'}
                </h1>
                <span className="font-mono text-xs text-white/70 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                  ID: #{employee?.user_id || employee?.id || '—'}
                </span>
              </div>
              <p className="text-sm font-medium text-emerald-100/90">
                {displayJobTitle}
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                {displayDeptName && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/15 text-white font-bold">
                    {displayDeptName}
                  </span>
                )}
                {employee?.status && (
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider",
                    employee.status === 'active' ? "bg-emerald-400/30 text-emerald-100" : "bg-white/20 text-white"
                  )}>
                    {employee.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons in Banner */}
          <div className="shrink-0 flex items-center gap-2.5 flex-wrap relative z-30">
            {/* 1. Request a Change Dropdown */}
            {getActionSecurityStatus('act_header_request_change', employee?.user_id || employee?.id, employee?.reporting_to).isVisible && (
              <div className="relative z-50" ref={changeRequestDropdownRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (getActionSecurityStatus('act_header_request_change', employee?.user_id || employee?.id, employee?.reporting_to).isDisabled) return;
                    const next = !showChangeRequestDropdown;
                    if (next) {
                      window.dispatchEvent(new CustomEvent('close-hr-dropdowns', { detail: { except: 'change_request' } }));
                    }
                    setShowChangeRequestDropdown(next);
                  }}
                  disabled={getActionSecurityStatus('act_header_request_change', employee?.user_id || employee?.id, employee?.reporting_to).isDisabled}
                  title={getActionSecurityStatus('act_header_request_change', employee?.user_id || employee?.id, employee?.reporting_to).isDisabled ? getActionSecurityStatus('act_header_request_change', employee?.user_id || employee?.id, employee?.reporting_to).tooltip : "Request a Change"}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#1E701E] text-xs font-bold rounded-full shadow-xs hover:bg-slate-50 transition-all cursor-pointer whitespace-nowrap",
                    showChangeRequestDropdown && "ring-2 ring-white/60 bg-emerald-50",
                    getActionSecurityStatus('act_header_request_change', employee?.user_id || employee?.id, employee?.reporting_to).isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span>Request a Change</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-[#1E701E] transition-transform duration-200", showChangeRequestDropdown && "rotate-180")} />
                </button>

                {showChangeRequestDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[300] text-slate-800 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Change Requests</span>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">Submit formal employee requests</p>
                    </div>
                    <div className="py-1">
                      {/* Request Leave */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowLeaveModal(true);
                          setShowChangeRequestDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-start gap-3 border-b border-slate-50 cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Request Leave</div>
                          <div className="text-[11px] text-slate-400 font-medium">Submit time-off or vacation request</div>
                        </div>
                      </button>

                      {/* File Complaint */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowComplaintModal(true);
                          setShowChangeRequestDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-start gap-3 border-b border-slate-50 cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-rose-50 group-hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors">File Complaint</div>
                          <div className="text-[11px] text-slate-400 font-medium">Submit confidential workplace grievance</div>
                        </div>
                      </button>

                      {/* Request Shift Swap */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowSwapModal(true);
                          setShowChangeRequestDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                          <Repeat className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors">Request Shift Swap</div>
                          <div className="text-[11px] text-slate-400 font-medium">Propose shift exchange with a colleague</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. Salary Visibility Toggle */}
            <button
              type="button"
              onClick={() => setIsSalaryVisible(!isSalaryVisible)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-full transition-all border border-white/20 cursor-pointer shadow-2xs whitespace-nowrap"
              title={isSalaryVisible ? "Salary is visible. Click to hide sensitive salary data." : "Salary is hidden. Click to make salary visible."}
            >
              {isSalaryVisible ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Salary Visible</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-200" />
                  <span>Salary Hidden</span>
                </>
              )}
            </button>

            {/* 3. Customize Layout Dropdown */}
            {employee && getActionSecurityStatus('act_header_customize_layout', employee.user_id || employee.id, employee.reporting_to).isVisible && (
              <CustomizeLayoutDropdown 
                activeTab={isMoreActive ? currentSubTab : currentSubTab}
                employeeId={employee.id}
                isViewOnly={isViewOnlyMode || getActionSecurityStatus('act_header_customize_layout', employee.user_id || employee.id, employee.reporting_to).isDisabled}
                onRefresh={fetchEmployeeData}
                buttonClassName="rounded-full border-none hover:bg-slate-50 text-[#1E701E]"
              />
            )}

            {/* 4. More Options Menu */}
            {employee && getActionSecurityStatus('act_header_more_options', employee.user_id || employee.id, employee.reporting_to).isVisible && (
              <EmployeeMoreOptionsMenu 
                employee={employee}
                onEdit={() => {
                  setEditFormData({ ...employee, personal_info: employee.personal_info || {} });
                  setShowEditModal(true);
                }}
                onRefresh={fetchEmployeeData}
                onOpenPermissionsManager={() => {
                  setPermissionsModalTab('emails');
                  setShowManagePermissionsModal(true);
                }}
                isViewOnly={isViewOnlyMode || getActionSecurityStatus('act_header_more_options', employee.user_id || employee.id, employee.reporting_to).isDisabled}
              />
            )}
          </div>
        </div>

        {/* Change Photo Inline Panel */}
        {isChangePhotoOpen && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/20 flex flex-col sm:flex-row items-center gap-3">
            <input 
              type="text"
              placeholder="Paste new image URL (https://...)"
              value={newAvatarUrl}
              onChange={(e) => setNewAvatarUrl(e.target.value)}
              className="w-full sm:flex-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 bg-white border border-white/30 outline-none"
            />
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleSaveAvatar}
                className="px-4 py-2 bg-white text-[#1E701E] rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-50 transition-all cursor-pointer"
              >
                Save Photo
              </button>
              <button 
                type="button"
                onClick={() => setIsChangePhotoOpen(false)}
                className="px-3 py-2 bg-white/20 text-white rounded-xl text-xs font-bold hover:bg-white/30 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 3. Banner Folder Tabs (Active tab matches URL path dynamically) */}
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-none pt-4 -mb-0.5 w-full">
          {mainTabs.map(tab => {
            const isActive = tab.isMore ? isMoreActive : currentSubTab === tab.id;
            return (
              <NavLink
                key={tab.id}
                to={`/hr/directory/${id}/${tab.path}`}
                className={cn(
                  "text-xs sm:text-[13px] font-bold px-3 sm:px-3.5 py-2 transition-all shrink-0 cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-[#f4f5f7] text-[#1E701E] rounded-t-xl font-black shadow-xs"
                    : "text-white/85 hover:text-white hover:bg-white/10 rounded-t-lg"
                )}
              >
                {tab.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* 4. Scrollable Layout Body */}
      <div className="flex-1 p-6 md:p-10 pt-6 md:pt-8 bg-[#f4f5f7]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar Column (Vitals & Profile Summary) */}
            <div className="lg:col-span-1 space-y-6">
              {/* 1. Vitals Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Vitals</h3>
                <div className="space-y-3.5 text-xs text-slate-700">
                  <div className="flex items-center gap-2.5" title="Work Phone">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{(employee?.personal_info as any)?.work_phone || employee?.phone || "801-724-6600"}</span>
                  </div>
                  <div className="flex items-center gap-2.5" title="Mobile Phone">
                    <Smartphone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{(employee?.personal_info as any)?.mobile_phone || "415-555-8965"}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <a href={`mailto:${(employee?.personal_info as any)?.work_email || employee?.email}`} className="text-[#1b5e20] font-semibold truncate hover:underline">
                      {(employee?.personal_info as any)?.work_email || employee?.email || "employee@company.com"}
                    </a>
                  </div>

                  {/* Social Links Row */}
                  {(() => {
                    const socialList = [
                      {
                        key: 'linkedin',
                        val: (employee?.personal_info as any)?.linkedin || (employee as any)?.linkedin_url,
                        label: 'LinkedIn',
                        icon: Linkedin,
                        color: 'hover:text-blue-700',
                      },
                      {
                        key: 'twitter',
                        val: (employee?.personal_info as any)?.twitter,
                        label: 'Twitter / X',
                        icon: Twitter,
                        color: 'hover:text-sky-500',
                      },
                      {
                        key: 'facebook',
                        val: (employee?.personal_info as any)?.facebook,
                        label: 'Facebook',
                        icon: Facebook,
                        color: 'hover:text-blue-600',
                      },
                      {
                        key: 'instagram',
                        val: (employee?.personal_info as any)?.instagram,
                        label: 'Instagram',
                        icon: Instagram,
                        color: 'hover:text-pink-600',
                      },
                      {
                        key: 'youtube',
                        val: (employee?.personal_info as any)?.youtube,
                        label: 'YouTube',
                        icon: Youtube,
                        color: 'hover:text-red-600',
                      },
                      {
                        key: 'cv_url',
                        val: (employee?.personal_info as any)?.cv_url || (employee as any)?.cv_url,
                        label: 'CV / Resume',
                        icon: FileText,
                        color: 'hover:text-emerald-700',
                      },
                      {
                        key: 'website',
                        val: (employee?.personal_info as any)?.website,
                        label: 'Website',
                        icon: Globe,
                        color: 'hover:text-[#1b5e20]',
                      },
                    ].filter(item => Boolean(item.val && item.val.toString().trim()));

                    if (socialList.length === 0) return null;

                    return (
                      <div className="flex flex-wrap items-center gap-3 pt-1 pl-6">
                        {socialList.map(item => {
                          const IconComp = item.icon;
                          const rawUrl = item.val!.toString().trim();
                          const href = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('//')
                            ? rawUrl 
                            : (rawUrl.startsWith('@') ? `https://x.com/${rawUrl.slice(1)}` : `https://${rawUrl}`);
                          return (
                            <a
                              key={item.key}
                              href={href}
                              target="_blank"
                              rel="noreferrer"
                              title={`${item.label}: ${rawUrl}`}
                              className={`text-slate-400 ${item.color} transition-colors cursor-pointer p-0.5`}
                            >
                              <IconComp className="w-4 h-4" />
                            </a>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Age */}
                  <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-100">
                    <Cake className="w-4 h-4 text-pink-500 shrink-0" />
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-slate-600 font-semibold">Age:</span>
                      {calculatedAge !== null ? (
                        <strong className="text-slate-800">{calculatedAge} yrs old</strong>
                      ) : (
                        <span className="text-slate-400 italic">Not specified</span>
                      )}
                    </span>
                  </div>

                  {/* Local Time */}
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} Local Time</span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{(employee?.personal_info as any)?.city ? `${(employee?.personal_info as any).city}, ${(employee?.personal_info as any).country || ""}` : (employee?.work_location || "Cairo, Egypt")}</span>
                  </div>

                  {/* Contract Type & Job Title */}
                  <div className="flex items-center gap-2.5">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{displayJobTitle} ({displayContractType})</span>
                  </div>

                  {/* Department */}
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{displayDeptName}</span>
                  </div>

                  {/* Ext */}
                  <div className="flex items-center gap-2.5">
                    <PhoneCall className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Ext: {(employee?.personal_info as any)?.ext || employee?.phone || "N/A"}</span>
                  </div>

                  {/* Fingerprint / Login ID */}
                  <div className="flex items-center gap-2.5">
                    {employee?.attendance_method === 'Fingerprint' ? (
                      <Fingerprint className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <User className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                    <span className="font-mono font-bold text-slate-800">
                      {employee?.attendance_method === 'Fingerprint' ? 'Fingerprint ID : ' : 'Login System ID : '}
                      <span className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                        {(employee as any)?.employee_id || (employee as any)?.id_number || employee?.id || 'N/A'}
                      </span>
                    </span>
                  </div>

                  {/* System User ID */}
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono font-bold text-slate-700">
                      System User ID: <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">#{employee?.user_id || employee?.id}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Contract Date & Duration Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Contract Date & Duration</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Contract Date: {joinedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {empTenureDetails?.isOffboarded && (
                    <div className="flex items-center gap-2 text-rose-700 font-bold">
                      <UserX className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>Offboarded: {empTenureDetails.formattedEndDate}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-700 font-medium pt-2 border-t border-slate-100">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      {empTenureDetails?.isOffboarded ? 'Final Tenure:' : 'Tenure:'}{' '}
                      <strong className="text-indigo-700 font-black">{empTenureDetails ? empTenureDetails.tenureStr : 'N/A'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Total Rewards Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Total Rewards</h3>
                  {!isSalaryVisible && (
                    <span className="text-[10px] text-amber-700 font-bold flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      <Lock className="w-2.5 h-2.5" /> Hidden
                    </span>
                  )}
                </div>
                <div className="pt-1">
                  <p className="text-xl font-black text-[#1b5e20]">
                    {!isSalaryVisible ? (
                      <span className="font-mono text-slate-400 tracking-widest">•••••••• EGP</span>
                    ) : (
                      `${((displayBaseSalary) + (jobAllowances || employee?.allowances || 0) + (jobKpiAmount || 0)).toLocaleString()} EGP`
                    )}
                  </p>
                  <div className="flex flex-col gap-1.5 text-[11px] text-slate-400 font-bold pt-2 border-t border-slate-100 mt-2">
                    <div className="flex justify-between">
                      <span>Base Salary:</span>
                      <span className="text-slate-700">
                        {!isSalaryVisible ? (
                          <span className="font-mono text-slate-400">••••••••</span>
                        ) : (
                          `${(displayBaseSalary).toLocaleString()} EGP`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allowances:</span>
                      <span className="text-slate-700">
                        {!isSalaryVisible ? (
                          <span className="font-mono text-slate-400">••••••••</span>
                        ) : (
                          `${(jobAllowances || employee?.allowances || 0).toLocaleString()} EGP`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-50 text-[#1b5e20]">
                      <span>KPI Target ({jobKpiFrequency}):</span>
                      <span className="font-black">
                        {!isSalaryVisible ? (
                          <span className="font-mono text-slate-400">••••••••</span>
                        ) : (
                          `${(jobKpiAmount || 0).toLocaleString()} EGP`
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Manager Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Manager</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20] font-black text-xs shrink-0">
                    {managerObj ? (managerObj.name ? managerObj.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'M') : 'M'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {managerObj?.name || (displayManagerName ? getResolvedManagerDisplay(displayManagerName) : "Unassigned")}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium truncate">
                      {managerObj?.job_title || (displayManagerName || "Direct Manager")}
                    </p>
                  </div>
                </div>
              </div>

              {/* 5. Direct Reports Card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Direct Reports</h3>
                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/hr/directory/${id}/job`);
                    }}
                    className="p-1 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-[#1b5e20] transition-colors cursor-pointer"
                    title="Add / Assign direct report"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2.5 text-xs font-medium text-slate-700">
                  {directReports.length > 0 ? (
                    directReports.map((dr: any) => {
                      const drInitials = dr.name ? dr.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'EE';
                      return (
                        <div 
                          key={dr.id} 
                          className="flex items-center justify-between gap-2 p-1 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div 
                            className="flex items-center gap-2 cursor-pointer hover:text-[#1b5e20] min-w-0 flex-1"
                            onClick={() => navigate(`/hr/directory/${dr.user_id || dr.id}/${currentSubTab}`)}
                          >
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#1b5e20] flex items-center justify-center font-bold text-[9px] group-hover:bg-[#1b5e20] group-hover:text-white transition-all shrink-0">
                              {drInitials}
                            </div>
                            <span className="font-semibold truncate group-hover:underline">{dr.name}</span>
                          </div>
                          {!isViewOnlyMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDirectReport(dr, employee);
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                              title="Remove direct report"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-400 italic text-[11px]">No direct reports recorded</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Secondary Subtab Nav for "More ▾" */}
              {isMoreActive && (
                <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto">
                  {MORE_SUB_TABS.map(subtab => {
                    const isSubActive = currentSubTab === subtab;
                    return (
                      <NavLink
                        key={subtab}
                        to={`/hr/directory/${id}/${subtab}`}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap",
                          isSubActive
                            ? "bg-[#1E701E] text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        {subtab}
                      </NavLink>
                    );
                  })}
                </div>
              )}

              {/* Dynamic Child Tab Route */}
              <Suspense fallback={<TabSkeletonLoader />}>
                <Outlet context={contextValue} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {/* --- Action Dialog Modals --- */}

      {/* 1. Leave Request Modal */}
      <LeaveRequestModal 
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        employee={employee}
        employees={employeesList}
        departments={departmentsList}
        currentUser={currentUser}
        onSuccess={fetchEmployeeData}
        showCustomToast={showCustomToast}
      />

      {/* 2. Complaint Modal */}
      <FileComplaintModal 
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        employee={employee}
        currentUser={currentUser}
        onSuccess={fetchEmployeeData}
        showCustomToast={showCustomToast}
      />

      {/* 3. Shift Swap Modal */}
      <ShiftSwapModal 
        isOpen={showSwapModal}
        onClose={() => setShowSwapModal(false)}
        employee={employee}
        employees={employeesList}
        shifts={shiftsList}
        currentUser={currentUser}
        onSuccess={fetchEmployeeData}
        showCustomToast={showCustomToast}
      />

      {/* 4. Edit Employee Modal */}
      <AddEmployeeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        formData={editFormData}
        setFormData={setEditFormData}
        handleSubmit={handleSaveEditedEmployee}
        employees={employeesList}
        departments={departmentsList}
      />

      {/* 5. HR Permissions Manager Modal */}
      <HRPermissionsManagerModal
        isOpen={showManagePermissionsModal}
        onClose={() => setShowManagePermissionsModal(false)}
        initialTab={permissionsModalTab}
      />
    </div>
  );
};
