import React, { useState, useEffect } from 'react';
import { 
  User, Home, Phone, Share2, GraduationCap, Calendar, 
  Trash2, Plus, Save, Loader2, CreditCard, ChevronDown, Check, LayoutGrid, FileText, Fingerprint, Lock,
  Linkedin, Twitter, Facebook, Instagram, Youtube, Globe, Clock, UserCheck, UserX, AlertCircle, Timer, History
} from 'lucide-react';
import { motion } from 'motion/react';
import { Employee } from '../../types';
import { CustomAddableSelect } from '../Common/CustomAddableSelect';
import { SearchableLocationSelect } from '../Common/SearchableLocationSelect';
import { DynamicLayoutSection } from './DynamicLayoutSection';
import { PermittedField } from '../common/PermittedField';
import { cn } from '../../lib/utils';
import { 
  getAllCountries, 
  getCountiesForCountry, 
  getCitiesForCountryAndCounty, 
  resolveLocationFromCity 
} from '../../lib/locationHelpers';
import { calculateExactTenure } from '../../utils/tenure';

interface EmployeePersonalTabProps {
  emp: Employee;
  currentUser: any;
  onRefreshEmployee: () => Promise<void>;
  isViewOnly?: boolean;
  onMarkDirty?: () => void;
  onDraftChange?: (updatedEmp: Partial<Employee>) => void;
  onSaveEmployeeDetails?: (updatedEmp: Partial<Employee>) => Promise<void>;
}

interface EducationItem {
  id: string | number;
  college: string;
  degree: string;
  major: string;
  gpa: string;
  education_start: string;
  education_end: string;
}

export const EmployeePersonalTab: React.FC<EmployeePersonalTabProps> = ({ 
  emp, 
  currentUser, 
  onRefreshEmployee,
  isViewOnly = false,
  onMarkDirty,
  onDraftChange,
  onSaveEmployeeDetails
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [layoutTrigger, setLayoutTrigger] = useState(0);

  const handleLayoutRefresh = () => {
    setLayoutTrigger(prev => prev + 1);
  };

  const [educationList, setEducationList] = useState<EducationItem[]>([]);

  // Parse and set state for all personal fields
  const [formData, setFormData] = useState({
    status: '',
    status_date: '',
    status_reason: '',
    employee_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    preferred_name: '',
    birth_date: '',
    nin: '',
    gender: '',
    nationality: '',
    marital_status: '',
    shirt_size: '',
    bank_details_copy: '',
    
    // Address
    street_1: '',
    street_2: '',
    city: '',
    county: '',
    postcode: '',
    country: '',

    // Contact
    work_phone: '',
    ext: '',
    mobile_phone: '',
    home_phone: '',
    work_email: '',
    home_email: '',

    // Social
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    youtube: '',
    cv_url: '',

    // Education legacy fields
    college: '',
    degree: '',
    major: '',
    gpa: '',
    education_start: '',
    education_end: '',
    secondary_language: ''
  });

  // Memoized location lists
  const allCountries = React.useMemo(() => getAllCountries(), []);
  const currentCountry = formData.country || 'Egypt';
  const countiesList = React.useMemo(() => getCountiesForCountry(currentCountry), [currentCountry]);
  const currentCounty = formData.county || '';
  const citiesList = React.useMemo(() => getCitiesForCountryAndCounty(currentCountry, currentCounty), [currentCountry, currentCounty]);

  // Load from DB if personal_info exists
  useEffect(() => {
    const personal = emp.personal_info || {};
    
    // Split name for Charlotte Abbott if we don't have first/middle/last stored
    let initialFirst = personal.first_name || '';
    let initialLast = personal.last_name || '';
    let initialMiddle = personal.middle_name || '';
    
    if (!initialFirst && emp.name) {
      const parts = emp.name.split(' ');
      if (parts.length >= 3) {
        initialFirst = parts[0];
        initialMiddle = parts.slice(1, -1).join(' ');
        initialLast = parts[parts.length - 1];
      } else if (parts.length === 2) {
        initialFirst = parts[0];
        initialLast = parts[1];
      } else {
        initialFirst = emp.name;
      }
    }

    const rawStatus = (personal.status || emp.status || 'Active').toString().toLowerCase();
    let initialStatus = 'Active';
    if (rawStatus === 'inactive') initialStatus = 'Inactive';
    else if (rawStatus === 'terminated') initialStatus = 'Terminated';
    else if (rawStatus === 'archived') initialStatus = 'Archived';
    else if (rawStatus === 'suspended') initialStatus = 'Suspended';
    else if (rawStatus === 'on_leave' || rawStatus === 'on leave') initialStatus = 'On Leave';
    else if (personal.status) initialStatus = personal.status;

    const initialStatusDate = personal.status_date || personal.status_change_date || personal.termination_date || (emp as any).status_date || (emp as any).termination_date || '';
    const initialStatusReason = personal.status_reason || (emp as any).status_reason || '';

    setFormData({
      status: initialStatus,
      status_date: initialStatusDate,
      status_reason: initialStatusReason,
      employee_id: emp.employee_id || emp.id_number || personal.employee_number || '',
      first_name: initialFirst,
      middle_name: initialMiddle,
      last_name: initialLast,
      preferred_name: personal.preferred_name || initialFirst,
      birth_date: personal.birth_date || '',
      nin: personal.nin || emp.id_number || '',
      gender: personal.gender || emp.gender || '',
      nationality: personal.nationality || emp.nationality || '',
      marital_status: personal.marital_status || emp.marital_status || '',
      shirt_size: personal.shirt_size || '',
      bank_details_copy: personal.bank_details_copy || '',
      
      street_1: personal.street_1 || '',
      street_2: personal.street_2 || '',
      city: personal.city || (emp as any).city || 'Cairo',
      county: personal.county || personal.province || 'Cairo',
      postcode: personal.postcode || '',
      country: personal.country || (emp as any).country || 'Egypt',

      work_phone: personal.work_phone || emp.phone || '',
      ext: personal.ext || '',
      mobile_phone: personal.mobile_phone || '',
      home_phone: personal.home_phone || '',
      work_email: personal.work_email || emp.email || '',
      home_email: personal.home_email || '',

      linkedin: personal.linkedin || '',
      twitter: personal.twitter || '',
      facebook: personal.facebook || '',
      instagram: personal.instagram || '',
      youtube: personal.youtube || '',
      cv_url: personal.cv_url || (emp as any).cv_url || '',

      college: personal.college || '',
      degree: personal.degree || '',
      major: personal.major || '',
      gpa: personal.gpa || '',
      education_start: personal.education_start || '',
      education_end: personal.education_end || '',
      secondary_language: personal.secondary_language || ''
    });

    // Education list setup
    let loadedEdu: EducationItem[] = [];
    if (Array.isArray(personal.education_list) && personal.education_list.length > 0) {
      loadedEdu = personal.education_list;
    } else if (personal.college || personal.degree || personal.major) {
      loadedEdu = [{
        id: 1,
        college: personal.college || '',
        degree: personal.degree || '',
        major: personal.major || '',
        gpa: personal.gpa || '',
        education_start: personal.education_start || '',
        education_end: personal.education_end || ''
      }];
    } else {
      loadedEdu = [];
    }
    setEducationList(loadedEdu);
  }, [emp]);

  const buildUpdatedEmp = (newFormData = formData, newEduList = educationList) => {
    const full_name = [newFormData.first_name, newFormData.middle_name, newFormData.last_name]
      .filter(Boolean)
      .join(' ');

    const primaryEdu = newEduList[0] || {
      college: '',
      degree: '',
      major: '',
      gpa: '',
      education_start: '',
      education_end: ''
    };

    const updatedPersonalInfo = {
      ...(emp.personal_info || {}),
      ...newFormData,
      college: primaryEdu.college,
      degree: primaryEdu.degree,
      major: primaryEdu.major,
      gpa: primaryEdu.gpa,
      education_start: primaryEdu.education_start,
      education_end: primaryEdu.education_end,
      education_list: newEduList
    };

    return {
      ...emp,
      name: full_name || emp.name,
      email: newFormData.work_email || emp.email,
      phone: newFormData.work_phone || emp.phone,
      id_number: newFormData.employee_id !== undefined ? newFormData.employee_id : (newFormData.nin || emp.id_number),
      employee_id: newFormData.employee_id !== undefined ? newFormData.employee_id : (emp.employee_id || emp.id_number),
      gender: newFormData.gender,
      nationality: newFormData.nationality,
      marital_status: newFormData.marital_status,
      date_of_birth: newFormData.birth_date,
      address: [newFormData.street_1, newFormData.street_2, newFormData.city, newFormData.county, newFormData.postcode, newFormData.country].filter(Boolean).join(', '),
      status: (newFormData.status || '').toLowerCase() as any,
      status_date: newFormData.status_date || null,
      termination_date: newFormData.status_date || null,
      status_reason: newFormData.status_reason || '',
      personal_info: updatedPersonalInfo
    };
  };

  const handleInputChange = (field: string, value: string) => {
    const nextFormData = {
      ...formData,
      [field]: value
    };
    setFormData(nextFormData);
    if (onMarkDirty) onMarkDirty();
    if (onDraftChange) onDraftChange(buildUpdatedEmp(nextFormData, educationList));
  };

  const handleAddEducation = () => {
    const newItem: EducationItem = {
      id: Date.now(),
      college: '',
      degree: "Bachelor's",
      major: '',
      gpa: '',
      education_start: '',
      education_end: ''
    };
    const nextEduList = [...educationList, newItem];
    setEducationList(nextEduList);
    if (onMarkDirty) onMarkDirty();
    if (onDraftChange) onDraftChange(buildUpdatedEmp(formData, nextEduList));
  };

  const handleDeleteEducation = (id: string | number) => {
    const nextEduList = educationList.filter(item => item.id !== id);
    setEducationList(nextEduList);
    if (onMarkDirty) onMarkDirty();
    if (onDraftChange) onDraftChange(buildUpdatedEmp(formData, nextEduList));
  };

  const handleEducationChange = (id: string | number, field: keyof EducationItem, value: string) => {
    const nextEduList = educationList.map(item => item.id === id ? { ...item, [field]: value } : item);
    setEducationList(nextEduList);
    if (onMarkDirty) onMarkDirty();
    if (onDraftChange) onDraftChange(buildUpdatedEmp(formData, nextEduList));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const updatedEmp = buildUpdatedEmp();

      if (onSaveEmployeeDetails) {
        await onSaveEmployeeDetails(updatedEmp);
        setSaveStatus('success');
      } else {
        const res = await fetch(`/api/hr/employees/${emp.user_id || emp.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': currentUser?.id?.toString() || '1'
          },
          body: JSON.stringify(updatedEmp)
        });

        if (res.ok) {
          setSaveStatus('success');
          await onRefreshEmployee();
          setTimeout(() => setSaveStatus('idle'), 3000);
        } else {
          setSaveStatus('error');
        }
      }
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate age based on birthdate
  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `Age: ${age}`;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header exactly matching theme */}
      <div className="flex justify-between items-center bg-white px-6 py-4 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1b5e20] leading-none">Personal</h2>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex items-center gap-2">
          {!isViewOnly && (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-[#1b5e20] hover:bg-[#123e15] rounded-xl transition-all cursor-pointer shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saveStatus === 'success' ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              {isSaving ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Main sections layout */}
      <fieldset disabled={isViewOnly} className="space-y-6 max-w-5xl mx-auto pb-12 border-0 p-0 m-0 w-full group-disabled:pointer-events-none">
        
        {/* Section 1: Basic Information */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-[24px] p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20]">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-[#1b5e20] uppercase tracking-wide">
              Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-bold text-slate-600">
            {/* Employee # (System User ID) */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">System User ID</label>
              <input 
                type="text" 
                readOnly
                value={`#${emp.user_id || emp.id}`}
                className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Employee ID / Fingerprint Code */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[11px] font-black text-indigo-700 uppercase flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-indigo-600" />
                <span>Employee ID / Fingerprint Code (كود البصمة)</span>
              </label>
              <input 
                type="text" 
                value={formData.employee_id}
                onChange={(e) => handleInputChange('employee_id', e.target.value)}
                placeholder="e.g. 101 or EMP-101"
                className="w-full text-xs font-mono font-bold bg-white border border-indigo-200 hover:border-indigo-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 rounded-xl px-3 py-2.5 outline-none text-slate-800 transition-all shadow-2xs"
              />
            </div>

            {/* Status */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Status</label>
              <CustomAddableSelect
                options={['Active', 'On Leave', 'Inactive', 'Terminated', 'Archived', 'Suspended']}
                value={formData.status}
                onChange={(val) => {
                  handleInputChange('status', val);
                  if (['Inactive', 'Terminated', 'Archived', 'Suspended'].includes(val) && !formData.status_date) {
                    handleInputChange('status_date', new Date().toISOString().split('T')[0]);
                  }
                }}
                placeholder="Select Status"
                disabled={isViewOnly}
              />
            </div>

            {/* Conditional Status Date & Offboarding / Tenure Details */}
            {['inactive', 'terminated', 'archived', 'suspended'].includes((formData.status || '').toLowerCase()) && (
              <div className="md:col-span-12 p-4 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-3.5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-xs font-black text-rose-900 uppercase tracking-wide flex items-center gap-1.5">
                      <UserX className="w-4 h-4 text-rose-600" />
                      Offboarding & Status Change Details ({formData.status})
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2.5 py-1 rounded-lg">
                    Automated Tenure Calculation based on Offboarding Date
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-rose-800 uppercase flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-600" />
                      <span>Status Change / Offboarding Date</span>
                    </label>
                    <input 
                      type="date"
                      value={formData.status_date}
                      disabled={isViewOnly}
                      onChange={(e) => handleInputChange('status_date', e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-rose-300 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 rounded-xl px-3 py-2.5 outline-none text-slate-800 shadow-2xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-rose-800 uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span>Reason / Notes</span>
                    </label>
                    <input 
                      type="text"
                      value={formData.status_reason}
                      disabled={isViewOnly}
                      placeholder="e.g. Resignation, End of contract, Seasonal layoff"
                      onChange={(e) => handleInputChange('status_reason', e.target.value)}
                      className="w-full text-xs font-bold bg-white border border-rose-300 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 rounded-xl px-3 py-2.5 outline-none text-slate-800 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Live Tenure Calculation Banner */}
                {(() => {
                  const hireDate = emp.joined_at || emp.contract_start_date || (emp.personal_info as any)?.hire_date;
                  const tenureInfo = calculateExactTenure(hireDate, formData.status_date, formData.status);
                  
                  return (
                    <div className="bg-white/90 border border-rose-200 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black shrink-0">
                          <Timer className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-black text-slate-500 uppercase">
                            Accurate Tenure Calculation
                          </div>
                          <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center gap-2">
                            <span>{tenureInfo ? tenureInfo.tenureStr : 'N/A (No Contract Date)'}</span>
                            {tenureInfo && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                                {tenureInfo.totalDays} total days
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {tenureInfo && (
                        <div className="text-xs text-slate-600 font-medium md:text-right bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          <div><span className="font-bold text-slate-700">Contract Date:</span> {tenureInfo.formattedStartDate}</div>
                          <div><span className="font-bold text-rose-700">Status Date:</span> {tenureInfo.formattedEndDate}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* First Name */}
            <PermittedField moduleName="HR" tabName="Personal" fieldKey="first_name" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email} className="md:col-span-3 space-y-1">
              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                <>
                  <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center">
                      {effectiveLabel || "First Name"}
                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> View only</span>}
                  </label>
                  <input 
                    type="text" 
                    value={formData.first_name}
                    required={isRequired}
                    readOnly={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className={cn(
                      "w-full text-xs font-bold rounded-xl px-3 py-2.5 outline-none transition-all",
                      isReadOnly || (isViewOnly && !allowOnSubmit)
                        ? "bg-slate-100/90 border border-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                    )}
                  />
                </>
              )}
            </PermittedField>

            {/* Middle Name */}
            <PermittedField moduleName="HR" tabName="Personal" fieldKey="middle_name" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email} className="md:col-span-3 space-y-1">
              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                <>
                  <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center">
                      {effectiveLabel || "Middle Name"}
                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> View only</span>}
                  </label>
                  <input 
                    type="text" 
                    value={formData.middle_name}
                    required={isRequired}
                    readOnly={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    onChange={(e) => handleInputChange('middle_name', e.target.value)}
                    className={cn(
                      "w-full text-xs font-bold rounded-xl px-3 py-2.5 outline-none transition-all",
                      isReadOnly || (isViewOnly && !allowOnSubmit)
                        ? "bg-slate-100/90 border border-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                    )}
                  />
                </>
              )}
            </PermittedField>

            {/* Last Name */}
            <PermittedField moduleName="HR" tabName="Personal" fieldKey="last_name" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email} className="md:col-span-3 space-y-1">
              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                <>
                  <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center">
                      {effectiveLabel || "Last Name"}
                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> View only</span>}
                  </label>
                  <input 
                    type="text" 
                    value={formData.last_name}
                    required={isRequired}
                    readOnly={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className={cn(
                      "w-full text-xs font-bold rounded-xl px-3 py-2.5 outline-none transition-all",
                      isReadOnly || (isViewOnly && !allowOnSubmit)
                        ? "bg-slate-100/90 border border-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                    )}
                  />
                </>
              )}
            </PermittedField>

            {/* Preferred Name */}
            <PermittedField moduleName="HR" tabName="Personal" fieldKey="preferred_name" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email} className="md:col-span-3 space-y-1">
              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                <>
                  <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center">
                      {effectiveLabel || "Preferred Name"}
                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> View only</span>}
                  </label>
                  <input 
                    type="text" 
                    value={formData.preferred_name}
                    required={isRequired}
                    readOnly={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    onChange={(e) => handleInputChange('preferred_name', e.target.value)}
                    className={cn(
                      "w-full text-xs font-bold rounded-xl px-3 py-2.5 outline-none transition-all",
                      isReadOnly || (isViewOnly && !allowOnSubmit)
                        ? "bg-slate-100/90 border border-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                    )}
                  />
                </>
              )}
            </PermittedField>

            {/* Birth Date */}
            <PermittedField moduleName="HR" tabName="Personal" fieldKey="birth_date" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email} className="md:col-span-4 space-y-1">
              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                <>
                  <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center">
                      {effectiveLabel || "Birth Date"}
                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> View only</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input 
                        type="date" 
                        value={formData.birth_date}
                        required={isRequired}
                        readOnly={isReadOnly || (isViewOnly && !allowOnSubmit)}
                        disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                        onChange={(e) => handleInputChange('birth_date', e.target.value)}
                        className={cn(
                          "w-full text-xs font-bold rounded-xl pl-3 pr-8 py-2.5 outline-none transition-all",
                          isReadOnly || (isViewOnly && !allowOnSubmit)
                            ? "bg-slate-100/90 border border-slate-200 text-slate-500 cursor-not-allowed"
                            : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                        )}
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <span className="text-xs font-bold text-slate-400">{calculateAge(formData.birth_date)}</span>
                  </div>
                </>
              )}
            </PermittedField>

            {/* NIN */}
            <PermittedField moduleName="HR" tabName="Personal" fieldKey="nin" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email} className="md:col-span-4 space-y-1">
              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                <>
                  <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center">
                      {effectiveLabel || "NIN"}
                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> View only</span>}
                  </label>
                  <input 
                    type="text" 
                    value={formData.nin}
                    required={isRequired}
                    readOnly={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    onChange={(e) => handleInputChange('nin', e.target.value)}
                    className={cn(
                      "w-full text-xs font-bold rounded-xl px-3 py-2.5 outline-none transition-all",
                      isReadOnly || (isViewOnly && !allowOnSubmit)
                        ? "bg-slate-100/90 border border-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                    )}
                  />
                </>
              )}
            </PermittedField>

            {/* Gender */}
            <PermittedField moduleName="HR" tabName="Personal" fieldKey="gender" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email} className="md:col-span-4 space-y-1">
              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                <>
                  <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center">
                      {effectiveLabel || "Gender"}
                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> View only</span>}
                  </label>
                  <CustomAddableSelect
                    options={['Female', 'Male', 'Non-binary', 'Prefer not to say']}
                    value={formData.gender}
                    onChange={(val) => handleInputChange('gender', val)}
                    placeholder="Select Gender"
                    disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                  />
                </>
              )}
            </PermittedField>

            {/* Marital Status */}
            <PermittedField moduleName="HR" tabName="Personal" fieldKey="marital_status" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email} className="md:col-span-4 space-y-1">
              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                <>
                  <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center">
                      {effectiveLabel || "Marital Status"}
                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> View only</span>}
                  </label>
                  <CustomAddableSelect
                    options={['Single', 'Married', 'Divorced', 'Widowed', 'Separated']}
                    value={formData.marital_status}
                    onChange={(val) => handleInputChange('marital_status', val)}
                    placeholder="Select Marital Status"
                    disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                  />
                </>
              )}
            </PermittedField>

            {/* Shirt Size */}
            <PermittedField moduleName="HR" tabName="Personal" fieldKey="shirt_size" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email} className="md:col-span-4 space-y-1">
              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                <>
                  <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center">
                      {effectiveLabel || "Shirt Size"}
                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> View only</span>}
                  </label>
                  <input 
                    type="text" 
                    value={formData.shirt_size}
                    required={isRequired}
                    readOnly={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                    onChange={(e) => handleInputChange('shirt_size', e.target.value)}
                    className={cn(
                      "w-full text-xs font-bold rounded-xl px-3 py-2.5 outline-none transition-all",
                      isReadOnly || (isViewOnly && !allowOnSubmit)
                        ? "bg-slate-100/90 border border-slate-200 text-slate-500 cursor-not-allowed"
                        : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] text-slate-800"
                    )}
                  />
                </>
              )}
            </PermittedField>

            {/* Bank Details Copy */}
            <PermittedField moduleName="HR" tabName="Personal" fieldKey="bank_details_copy" employeeId={emp.id} employeeUserId={emp.user_id} employeeEmail={emp.email || (emp as any).work_email} className="md:col-span-4 space-y-1">
              {({ isReadOnly, isRequired, allowOnSubmit, effectiveLabel }) => (
                <>
                  <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                    <span className="flex items-center">
                      {effectiveLabel || "Bank Details Copy"}
                      {isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                    </span>
                    {isReadOnly && <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> View only</span>}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={formData.bank_details_copy}
                      required={isRequired}
                      readOnly={isReadOnly || (isViewOnly && !allowOnSubmit)}
                      disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                      onChange={(e) => handleInputChange('bank_details_copy', e.target.value)}
                      className={cn(
                        "w-full text-xs font-bold border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2.5 outline-none text-slate-800 transition-all",
                        isReadOnly || (isViewOnly && !allowOnSubmit)
                          ? "bg-slate-100/90 text-slate-500 cursor-not-allowed"
                          : "bg-white"
                      )}
                    />
                    <button 
                      type="button"
                      disabled={isReadOnly || (isViewOnly && !allowOnSubmit)}
                      className="flex items-center gap-1 px-3 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-black transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      PDF
                    </button>
                  </div>
                </>
              )}
            </PermittedField>
          </div>

          <DynamicLayoutSection 
            tab="personal" 
            section="Basic Information" 
            employeeId={emp.id} 
            key={`bi-${layoutTrigger}`} 
          />
        </div>

        {/* Section 2: Address */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-[24px] p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20]">
              <Home className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-[#1b5e20] uppercase tracking-wide">
              Address
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-bold text-slate-600">
            {/* Street 1 */}
            <div className="md:col-span-6 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Street 1</label>
              <input 
                type="text" 
                value={formData.street_1}
                onChange={(e) => handleInputChange('street_1', e.target.value)}
                className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2.5 outline-none text-slate-800 transition-all"
              />
            </div>

            {/* Street 2 */}
            <div className="md:col-span-6 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Street 2</label>
              <input 
                type="text" 
                value={formData.street_2}
                onChange={(e) => handleInputChange('street_2', e.target.value)}
                className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2.5 outline-none text-slate-800 transition-all"
              />
            </div>

            {/* Country */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                <span>Country</span>
                <span className="text-[10px] text-emerald-700 font-bold lowercase">{allCountries.length} countries</span>
              </label>
              <SearchableLocationSelect
                items={allCountries}
                value={formData.country || 'Egypt'}
                onChange={(newCountry) => {
                  handleInputChange('country', newCountry);
                  if (newCountry !== formData.country) {
                    const newCounties = getCountiesForCountry(newCountry);
                    const defaultCounty = newCounties[0]?.name || '';
                    handleInputChange('county', defaultCounty);
                    const newCities = getCitiesForCountryAndCounty(newCountry, defaultCounty);
                    handleInputChange('city', newCities[0]?.name || '');
                  }
                }}
                placeholder="Select Country"
                searchPlaceholder="Search country (e.g. Egypt, Saudi Arabia, UK)..."
                iconType="country"
                disabled={isViewOnly}
              />
            </div>

            {/* County / Governorate */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                <span>County / Governorate</span>
                <span className="text-[10px] text-indigo-600 font-bold lowercase">{countiesList.length} options</span>
              </label>
              <SearchableLocationSelect
                items={countiesList}
                value={formData.county}
                onChange={(newCounty) => {
                  handleInputChange('county', newCounty);
                  const newCities = getCitiesForCountryAndCounty(formData.country || 'Egypt', newCounty);
                  if (newCities.length > 0 && !newCities.some(c => c.name.toLowerCase() === (formData.city || '').toLowerCase())) {
                    handleInputChange('city', newCities[0]?.name || '');
                  }
                }}
                placeholder="Select County / Governorate"
                searchPlaceholder="Search county/governorate..."
                iconType="county"
                disabled={isViewOnly}
              />
            </div>

            {/* City */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase flex items-center justify-between">
                <span>City</span>
                <span className="text-[10px] text-slate-500 font-bold lowercase">{citiesList.length} cities</span>
              </label>
              <SearchableLocationSelect
                items={citiesList}
                value={formData.city}
                onChange={(newCity) => {
                  handleInputChange('city', newCity);
                  const resolved = resolveLocationFromCity(newCity);
                  if (resolved) {
                    if (!formData.county) handleInputChange('county', resolved.county);
                    if (!formData.country) handleInputChange('country', resolved.country);
                  }
                }}
                placeholder="Select City"
                searchPlaceholder="Search city or district..."
                iconType="city"
                disabled={isViewOnly}
              />
            </div>

            {/* Postcode */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Postcode</label>
              <input 
                type="text" 
                value={formData.postcode}
                onChange={(e) => handleInputChange('postcode', e.target.value)}
                placeholder="e.g. 11511"
                className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2.5 outline-none text-slate-800 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          <DynamicLayoutSection 
            tab="personal" 
            section="Address" 
            employeeId={emp.id} 
            key={`addr-${layoutTrigger}`} 
          />
        </div>

        {/* Section 3: Contact */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-[24px] p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20]">
              <Phone className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-[#1b5e20] uppercase tracking-wide">
              Contact
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-bold text-slate-600">
            {/* Work Phone */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Work Phone</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.work_phone}
                  onChange={(e) => handleInputChange('work_phone', e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Ext */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Ext</label>
              <input 
                type="text" 
                value={formData.ext}
                onChange={(e) => handleInputChange('ext', e.target.value)}
                className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2.5 outline-none text-slate-800 transition-all"
              />
            </div>

            {/* Mobile Phone */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Mobile Phone</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.mobile_phone}
                  onChange={(e) => handleInputChange('mobile_phone', e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Home Phone */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Home Phone</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.home_phone}
                  onChange={(e) => handleInputChange('home_phone', e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Work Email */}
            <div className="md:col-span-6 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Work Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={formData.work_email}
                  onChange={(e) => handleInputChange('work_email', e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">✉</span>
              </div>
            </div>

            {/* Home Email */}
            <div className="md:col-span-6 space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Home Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={formData.home_email}
                  onChange={(e) => handleInputChange('home_email', e.target.value)}
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">✉</span>
              </div>
            </div>
          </div>

          <DynamicLayoutSection 
            tab="personal" 
            section="Contact Information" 
            employeeId={emp.id} 
            key={`cont-${layoutTrigger}`} 
          />
        </div>

        {/* Section 4: Social Links */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-[24px] p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20]">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-[#1b5e20] uppercase tracking-wide">
              Social Links
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-600">
            {/* LinkedIn */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">LinkedIn Profile</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                </span>
              </div>
            </div>

            {/* Twitter Username / URL */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Twitter / X</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.twitter}
                  onChange={(e) => handleInputChange('twitter', e.target.value)}
                  placeholder="@username or https://x.com/username"
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Twitter className="w-3.5 h-3.5 text-sky-500" />
                </span>
              </div>
            </div>

            {/* Facebook */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Facebook</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.facebook}
                  onChange={(e) => handleInputChange('facebook', e.target.value)}
                  placeholder="https://facebook.com/profile"
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Facebook className="w-3.5 h-3.5 text-blue-700" />
                </span>
              </div>
            </div>

            {/* Instagram */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">Instagram</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.instagram}
                  onChange={(e) => handleInputChange('instagram', e.target.value)}
                  placeholder="https://instagram.com/username"
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                </span>
              </div>
            </div>

            {/* YouTube */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">YouTube Channel</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.youtube}
                  onChange={(e) => handleInputChange('youtube', e.target.value)}
                  placeholder="https://youtube.com/@channel"
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <Youtube className="w-3.5 h-3.5 text-red-600" />
                </span>
              </div>
            </div>

            {/* CV / Resume Link */}
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-400 uppercase">CV / Resume Link</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.cv_url}
                  onChange={(e) => handleInputChange('cv_url', e.target.value)}
                  placeholder="https://drive.google.com/... or CV link"
                  className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                </span>
              </div>
            </div>
          </div>

          <DynamicLayoutSection 
            tab="personal" 
            section="Social Accounts" 
            employeeId={emp.id} 
            key={`soc-${layoutTrigger}`} 
          />
        </div>

        {/* Section 5: Education */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-[24px] p-6 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-black text-[#1b5e20] uppercase tracking-wide">
                Education
              </h3>
            </div>

            {!isViewOnly && (
              <button 
                type="button" 
                onClick={handleAddEducation}
                className="text-[#1565c0] hover:text-[#0d47a1] text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 bg-[#1565c0]/5 hover:bg-[#1565c0]/10 px-3 py-1.5 rounded-xl border border-[#1565c0]/20 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Education
              </button>
            )}
          </div>

          <div className="space-y-6">
            {educationList.length === 0 ? (
              <div className="py-6 text-center text-xs font-bold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                No education records added.
              </div>
            ) : (
              educationList.map((edu, idx) => (
                <div key={edu.id} className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4 relative">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Education #{idx + 1}
                    </span>
                    {!isViewOnly && (
                      <button 
                        type="button" 
                        onClick={() => handleDeleteEducation(edu.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Delete education record"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-[11px]">Delete</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-bold text-slate-600">
                    {/* College/Institution */}
                    <div className="md:col-span-12 space-y-1">
                      <label className="block text-[11px] font-black text-slate-400 uppercase">College/Institution</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={edu.college}
                          onChange={(e) => handleEducationChange(edu.id, 'college', e.target.value)}
                          placeholder="e.g. University of Utah"
                          className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-9 pr-3 py-2.5 outline-none text-slate-800 transition-all"
                        />
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Degree, Major, GPA */}
                    <div className="md:col-span-5 space-y-1">
                      <label className="block text-[11px] font-black text-slate-400 uppercase">Degree</label>
                      <CustomAddableSelect
                        options={["Bachelor's", "Master's", "PhD", "Associate's", "Diploma", "High School"]}
                        value={edu.degree}
                        onChange={(val) => handleEducationChange(edu.id, 'degree', val)}
                        placeholder="Select Degree"
                        disabled={isViewOnly}
                      />
                    </div>

                    <div className="md:col-span-5 space-y-1">
                      <label className="block text-[11px] font-black text-slate-400 uppercase">Major/Specialization</label>
                      <input 
                        type="text" 
                        value={edu.major}
                        onChange={(e) => handleEducationChange(edu.id, 'major', e.target.value)}
                        placeholder="e.g. Computer Science, Psychology"
                        className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2.5 outline-none text-slate-800 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-[11px] font-black text-slate-400 uppercase">GPA</label>
                      <input 
                        type="text" 
                        value={edu.gpa}
                        onChange={(e) => handleEducationChange(edu.id, 'gpa', e.target.value)}
                        placeholder="e.g. 3.8"
                        className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl px-3 py-2.5 outline-none text-slate-800 transition-all"
                      />
                    </div>

                    {/* Start Date & End Date */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="block text-[11px] font-black text-slate-400 uppercase">Start Date</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={edu.education_start}
                          onChange={(e) => handleEducationChange(edu.id, 'education_start', e.target.value)}
                          className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-3 pr-8 py-2.5 outline-none text-slate-800 transition-all"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="md:col-span-6 space-y-1">
                      <label className="block text-[11px] font-black text-slate-400 uppercase">End Date</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          value={edu.education_end}
                          onChange={(e) => handleEducationChange(edu.id, 'education_end', e.target.value)}
                          className="w-full text-xs font-bold bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20] rounded-xl pl-3 pr-8 py-2.5 outline-none text-slate-800 transition-all"
                        />
                        <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Secondary Language */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2">
              <div className="md:col-span-6 space-y-1">
                <label className="block text-[11px] font-black text-slate-400 uppercase">Secondary Language</label>
                <CustomAddableSelect
                  options={['Spanish', 'Arabic', 'French', 'German', 'Mandarin', 'Japanese', 'None']}
                  value={formData.secondary_language}
                  onChange={(val) => handleInputChange('secondary_language', val)}
                  placeholder="Select Language"
                  disabled={isViewOnly}
                />
              </div>
            </div>
          </div>

          <DynamicLayoutSection 
            tab="personal" 
            section="Education" 
            employeeId={emp.id} 
            key={`edu-${layoutTrigger}`} 
          />
        </div>

      </fieldset>
    </div>
  );
};
