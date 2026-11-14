import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  User, 
  MapPin, 
  CreditCard, 
  PhoneCall, 
  Phone, 
  Smartphone, 
  Mail, 
  Briefcase, 
  BadgeCheck, 
  Building2, 
  UserCheck, 
  Ban,
  Shield,
  LogIn,
  Fingerprint,
  Clock,
  ArrowLeft,
  Check
} from 'lucide-react';
import { Employee, Department } from '../../types';
import { cn } from '../../lib/utils';
import { SearchableLocationSelect } from '../Common/SearchableLocationSelect';
import { 
  getAllCountries, 
  getCountiesForCountry, 
  getCitiesForCountryAndCounty, 
  resolveLocationFromCity 
} from '../../lib/locationHelpers';
import { 
  getDivisionsForLocation, 
  CITIES_LIST, 
  getCountyAndCountryForCity, 
  getTeamsAndTitlesForDepartment,
  GRADE_LEVEL_OPTIONS,
  LOCATION_OPTIONS,
  getJDForTitle,
  getGradeForJobTitle
} from '../../lib/hrData';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleSubmit: (e: React.FormEvent) => void;
  employees: Employee[];
  departments: Department[];
  isFullPage?: boolean;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  handleSubmit,
  employees,
  departments,
  isFullPage = false
}) => {
  const [systemRoles, setSystemRoles] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const loadRoles = async () => {
      try {
        const local = localStorage.getItem('sys_rbac_roles') || localStorage.getItem('sys_roles');
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSystemRoles(parsed);
            return;
          }
        }

        const res = await fetch('/api/admin/roles');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSystemRoles(data);
            return;
          }
        }

        const res2 = await fetch('/api/roles');
        if (res2.ok) {
          const data2 = await res2.json();
          if (Array.isArray(data2) && data2.length > 0) {
            setSystemRoles(data2);
            return;
          }
        }

        // Strictly empty if no roles exist in RBAC tab
        setSystemRoles([]);
      } catch {
        setSystemRoles([]);
      }
    };

    loadRoles();
  }, [isOpen]);

  if (!isOpen) return null;

  const personalInfo = formData.personal_info || {};

  const personalCountry = personalInfo.country || 'Egypt';
  const personalCounty = personalInfo.province || personalInfo.county || 'Cairo';
  const personalCity = personalInfo.city || 'Cairo';

  const allCountries = React.useMemo(() => getAllCountries(), []);
  const countiesList = React.useMemo(() => getCountiesForCountry(personalCountry), [personalCountry]);
  const citiesList = React.useMemo(() => getCitiesForCountryAndCounty(personalCountry, personalCounty), [personalCountry, personalCounty]);

  const safeDepartments = Array.isArray(departments) ? departments : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeSystemRoles = Array.isArray(systemRoles) ? systemRoles : [];

  const selectedDept = safeDepartments.find(d => 
    (formData.department_id && Number(d.id) === Number(formData.department_id)) ||
    (formData.department_name && d.name === formData.department_name)
  );

  // Extract teams for a selected department strictly from user department data
  const getTeamsForDept = (dept?: Department) => {
    if (!dept) return [];
    let teamsArr: { name: string; job_titles?: string[] }[] = [];
    if (Array.isArray(dept.teams)) {
      teamsArr = dept.teams.map((t: any) => 
        typeof t === 'string' 
          ? { name: t, job_titles: [] } 
          : { name: t.name || '', job_titles: Array.isArray(t.job_titles) ? t.job_titles : (Array.isArray((t as any).jobTitles) ? (t as any).jobTitles : []) }
      );
    } else if (typeof dept.teams === 'string') {
      try {
        const parsed = JSON.parse(dept.teams);
        if (Array.isArray(parsed)) {
          teamsArr = parsed.map((t: any) => 
            typeof t === 'string' 
              ? { name: t, job_titles: [] } 
              : { name: t.name || '', job_titles: Array.isArray(t.job_titles) ? t.job_titles : (Array.isArray(t.jobTitles) ? t.jobTitles : []) }
          );
        }
      } catch (e) {}
    }
    return teamsArr;
  };

  const selectedDeptTeams = getTeamsForDept(selectedDept);

  // Extract job titles strictly from user department & team data
  const getJobTitlesForDeptAndTeam = (dept?: Department, teamName?: string) => {
    if (!dept) return [];
    
    const teamsArr = getTeamsForDept(dept);
    if (teamName) {
      const selectedTeamObj = teamsArr.find(t => t.name === teamName);
      if (selectedTeamObj && Array.isArray(selectedTeamObj.job_titles) && selectedTeamObj.job_titles.length > 0) {
        return selectedTeamObj.job_titles.map((t: any) => typeof t === 'string' ? t : (t?.title || t?.name || '')).filter(Boolean);
      }
    }

    let deptTitles: string[] = [];
    const rawTitles: any = (dept as any)?.job_titles;
    if (Array.isArray(rawTitles)) {
      deptTitles = rawTitles.map((t: any) => typeof t === 'string' ? t : (t?.title || t?.name || '')).filter(Boolean);
    } else if (typeof rawTitles === 'string') {
      try {
        const parsed = JSON.parse(rawTitles);
        if (Array.isArray(parsed)) {
          deptTitles = parsed.map((t: any) => typeof t === 'string' ? t : (t?.title || t?.name || '')).filter(Boolean);
        }
      } catch (e) {
        if (rawTitles.includes(',')) {
          deptTitles = rawTitles.split(',').map((s: string) => s.trim()).filter(Boolean);
        } else if (rawTitles.trim()) {
          deptTitles = [rawTitles.trim()];
        }
      }
    }

    if (deptTitles.length > 0) return deptTitles;

    const allTeamTitles = teamsArr.flatMap(t => t.job_titles || []).map((t: any) => typeof t === 'string' ? t : (t?.title || t?.name || '')).filter(Boolean);
    if (allTeamTitles.length > 0) {
      return Array.from(new Set(allTeamTitles));
    }

    return [];
  };

  const availableJobTitles = getJobTitlesForDeptAndTeam(selectedDept, formData.team_name);

  // Dynamic Reporting to options: based on selected Department, Team, and Job Title
  const getReportingToOptions = () => {
    const options: { id: number | string; label: string; isCeoMd?: boolean; isHead?: boolean }[] = [];
    const addedKeys = new Set<string>();

    const addOpt = (val: number | string, label: string, isCeoMd = false, isHead = false) => {
      const key = `${val}_${label}`;
      if (!addedKeys.has(key)) {
        addedKeys.add(key);
        options.push({ id: val, label, isCeoMd, isHead });
      }
    };

    // 1. Board of Directors / CEO Options
    addOpt('No Manager / Board of Directors', 'No Manager / Board of Directors', true);
    if (Array.isArray(employees)) {
      employees.forEach(e => {
        const jt = (e.job_title || '').toLowerCase();
        if (jt.includes('ceo') || jt.includes('md') || jt.includes('managing director') || jt.includes('chief executive') || jt.includes('president')) {
          addOpt(e.id || e.name, `${e.name} (${e.job_title || 'CEO / MD'})`, true);
        }
      });
    }
    addOpt('CEO', 'Chief Executive Officer (CEO)', true);
    addOpt('MD', 'Managing Director (MD)', true);

    // 2. Department Head for selected department
    if (selectedDept) {
      const headId = (selectedDept as any).department_head_id || (selectedDept as any).head_id;
      const headName = (selectedDept as any).department_head_name || (selectedDept as any).head_name || (selectedDept as any).manager_name;

      if (headId) {
        const matchEmp = employees.find(e => e.id === headId || e.user_id === headId);
        if (matchEmp) {
          addOpt(matchEmp.id, `${matchEmp.name} (Department Head - ${selectedDept.name})`, false, true);
        } else if (headName) {
          addOpt(headName, `${headName} (Department Head - ${selectedDept.name})`, false, true);
        }
      } else if (headName) {
        addOpt(headName, `${headName} (Department Head - ${selectedDept.name})`, false, true);
      }

      // Department managers / directors / heads from employees list
      if (Array.isArray(employees)) {
        employees.forEach(e => {
          const belongsToDept = (e.department_id && Number(e.department_id) === Number(selectedDept.id)) ||
                                (e.department_name && (e.department_name || '').toLowerCase() === (selectedDept.name || '').toLowerCase());
          if (belongsToDept) {
            const jt = (e.job_title || '').toLowerCase();
            if (jt.includes('head') || jt.includes('director') || jt.includes('manager') || jt.includes('lead')) {
              addOpt(e.id, `${e.name} (${e.job_title || 'Manager'} - ${selectedDept.name})`);
            }
          }
        });
      }

      // 3. Team Lead for selected team
      if (formData.team_name && selectedDeptTeams.length > 0) {
        const teamObj = selectedDeptTeams.find(t => t.name === formData.team_name);
        if (teamObj) {
          const leadId = (teamObj as any).team_lead_id || (teamObj as any).lead_id;
          const leadName = (teamObj as any).team_lead_name || (teamObj as any).leader_name || (teamObj as any).lead_name || (teamObj as any).team_lead;

          if (leadId) {
            const matchEmp = employees.find(e => e.id === leadId || e.user_id === leadId);
            if (matchEmp) {
              addOpt(matchEmp.id, `${matchEmp.name} (Team Lead - ${teamObj.name})`);
            } else if (leadName) {
              addOpt(leadName, `${leadName} (Team Lead - ${teamObj.name})`);
            }
          } else if (leadName) {
            addOpt(leadName, `${leadName} (Team Lead - ${teamObj.name})`);
          }
        }
      }

      // 4. Employees in selected Department and Team
      if (Array.isArray(employees)) {
        employees.forEach(e => {
          const belongsToDept = (e.department_id && Number(e.department_id) === Number(selectedDept.id)) ||
                                (e.department_name && (e.department_name || '').toLowerCase() === (selectedDept.name || '').toLowerCase());
          const empTeam = e.team_name || (e.personal_info as any)?.team_name || '';
          const matchTeam = !formData.team_name || empTeam === formData.team_name;
          
          if (belongsToDept && matchTeam) {
            addOpt(e.id, `${e.name} (${e.job_title || 'Employee'})`);
          }
        });
      }
    } else {
      // Fallback: List registered employees if no department is selected
      if (Array.isArray(employees)) {
        employees.forEach(e => {
          addOpt(e.id, `${e.name} (${e.job_title || 'Employee'})`);
        });
      }
    }

    return options;
  };

  // Extract divisions strictly from user departments data
  const availableDivisions = Array.from(new Set([
    ...safeDepartments
      .map((d: any) => d.division)
      .filter((div): div is string => Boolean(div && typeof div === 'string' && div.trim())),
    ...(selectedDept && (selectedDept as any).division ? [(selectedDept as any).division] : [])
  ]));

  const renderFormCards = () => (
    <>
      {/* 1. Personal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1E701E] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1E701E] tracking-tight">Personal</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-indigo-700">
                      <Fingerprint className="w-3.5 h-3.5 text-indigo-600" />
                      Employee ID / Fingerprint Code (كود البصمة)
                    </span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">Editable</span>
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                    placeholder="e.g. 101 or EMP-101 (رقم الموظف في أجهزة البصمة)"
                    value={formData.employee_id !== undefined ? formData.employee_id : (personalInfo.employee_number || formData.id_number || '')}
                    onChange={e => setFormData({
                      ...formData,
                      employee_id: e.target.value,
                      id_number: e.target.value,
                      personal_info: { ...personalInfo, employee_number: e.target.value }
                    })}
                  />
                  <p className="text-[10px] text-slate-500">
                    رقم الموظف في جهاز البصمة لحساب الحضور والانصراف تلقائياً (يمكن تعديله لاحقاً).
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      System User ID (رقم المستخدم بالنظام)
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-200/60 px-1.5 py-0.5 rounded">Read-Only</span>
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-600 flex items-center justify-between shadow-2xs">
                    <span>{formData.user_id || formData.id ? `User ID: #${formData.user_id || formData.id}` : 'ينشأ تلقائياً عند تسجيل الحساب'}</span>
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    معرّف دخول المستخدم على النظام (user_id) - لا يتغير يدويًا.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">First Name<span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E] focus:ring-1 focus:ring-[#1E701E]"
                    value={personalInfo.first_name || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, first_name: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Middle Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E] focus:ring-1 focus:ring-[#1E701E]"
                    value={personalInfo.middle_name || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, middle_name: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Last Name<span className="text-red-500">*</span></label>
                  <input
                    required
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E] focus:ring-1 focus:ring-[#1E701E]"
                    value={personalInfo.last_name || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, last_name: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Preferred Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E] focus:ring-1 focus:ring-[#1E701E]"
                    value={personalInfo.preferred_name || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, preferred_name: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Birth Date */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Birth Date / تاريخ الميلاد</label>
                    {personalInfo.birth_date && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {(() => {
                          const today = new Date();
                          const birthDate = new Date(personalInfo.birth_date);
                          let age = today.getFullYear() - birthDate.getFullYear();
                          const m = today.getMonth() - birthDate.getMonth();
                          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                          }
                          return age >= 0 ? `Age: ${age}` : '';
                        })()}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E] focus:ring-1 focus:ring-[#1E701E]"
                    value={personalInfo.birth_date || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, birth_date: e.target.value }
                    })}
                  />
                </div>

                {/* NIN / National ID */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    NIN / National ID (الرقم القومي / رقم الهوية)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E] focus:ring-1 focus:ring-[#1E701E]"
                    placeholder="e.g. 29801011234567"
                    value={personalInfo.nin || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, nin: e.target.value }
                    })}
                  />
                </div>

                {/* Shirt Size */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Shirt Size / مقاس القميص
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E] focus:ring-1 focus:ring-[#1E701E]"
                    placeholder="e.g. S, M, L, XL, XXL"
                    value={personalInfo.shirt_size || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, shirt_size: e.target.value }
                    })}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Gender / الجنس</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                    value={personalInfo.gender || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, gender: e.target.value }
                    })}
                  >
                    <option value="">--Select Gender--</option>
                    <option value="Male">Male / ذكر</option>
                    <option value="Female">Female / أنثى</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Marital Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Marital Status / الحالة الاجتماعية</label>
                  <select
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                    value={personalInfo.marital_status || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, marital_status: e.target.value }
                    })}
                  >
                    <option value="">--Select Marital Status--</option>
                    <option value="Single">Single / أعزب</option>
                    <option value="Married">Married / متزوج</option>
                    <option value="Divorced">Divorced / مطلق</option>
                    <option value="Widowed">Widowed / أرمل</option>
                    <option value="Separated">Separated / منفصل</option>
                  </select>
                </div>

                {/* Bank Details Copy */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Bank Details Copy / تفاصيل الحساب البنكي
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E] focus:ring-1 focus:ring-[#1E701E]"
                    placeholder="e.g. Bank Name - IBAN / Account #"
                    value={personalInfo.bank_details_copy || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, bank_details_copy: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Address */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1E701E] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1E701E] tracking-tight">Address</h3>
            </div>

            <div className="space-y-3">
              <div className="space-y-1 max-w-xl">
                <label className="text-xs font-semibold text-slate-700 block">Street 1</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={personalInfo.street_1 || ''}
                  onChange={e => setFormData({
                    ...formData,
                    personal_info: { ...personalInfo, street_1: e.target.value }
                  })}
                />
              </div>

              <div className="space-y-1 max-w-xl">
                <label className="text-xs font-semibold text-slate-700 block">Street 2</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={personalInfo.street_2 || ''}
                  onChange={e => setFormData({
                    ...formData,
                    personal_info: { ...personalInfo, street_2: e.target.value }
                  })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Country</span>
                    <span className="text-[10px] text-emerald-700 font-bold lowercase">{allCountries.length} countries</span>
                  </label>
                  <SearchableLocationSelect
                    items={allCountries}
                    value={personalCountry}
                    onChange={(newCountry) => {
                      const newCounties = getCountiesForCountry(newCountry);
                      const defaultCounty = newCounties[0]?.name || '';
                      const newCities = getCitiesForCountryAndCounty(newCountry, defaultCounty);
                      const defaultCity = newCities[0]?.name || '';
                      setFormData({
                        ...formData,
                        personal_info: {
                          ...personalInfo,
                          country: newCountry,
                          province: defaultCounty,
                          county: defaultCounty,
                          city: defaultCity
                        }
                      });
                    }}
                    placeholder="Select Country"
                    searchPlaceholder="Search country..."
                    iconType="country"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>County / Governorate</span>
                    <span className="text-[10px] text-indigo-600 font-bold lowercase">{countiesList.length} options</span>
                  </label>
                  <SearchableLocationSelect
                    items={countiesList}
                    value={personalCounty}
                    onChange={(newCounty) => {
                      const newCities = getCitiesForCountryAndCounty(personalCountry, newCounty);
                      const defaultCity = newCities[0]?.name || personalCity;
                      setFormData({
                        ...formData,
                        personal_info: {
                          ...personalInfo,
                          province: newCounty,
                          county: newCounty,
                          city: defaultCity
                        }
                      });
                    }}
                    placeholder="Select County / Governorate"
                    searchPlaceholder="Search county/governorate..."
                    iconType="county"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>City</span>
                    <span className="text-[10px] text-slate-500 font-bold lowercase">{citiesList.length} cities</span>
                  </label>
                  <SearchableLocationSelect
                    items={citiesList}
                    value={personalCity}
                    onChange={(newCity) => {
                      const resolved = resolveLocationFromCity(newCity);
                      setFormData({
                        ...formData,
                        personal_info: {
                          ...personalInfo,
                          city: newCity,
                          province: resolved ? resolved.county : (personalInfo.province || personalCounty),
                          county: resolved ? resolved.county : (personalInfo.county || personalCounty),
                          country: resolved ? resolved.country : personalCountry
                        }
                      });
                    }}
                    placeholder="Select City"
                    searchPlaceholder="Search city..."
                    iconType="city"
                  />
                </div>
              </div>

              <div className="space-y-1 max-w-xs">
                <label className="text-xs font-semibold text-slate-700 block">Postcode</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={personalInfo.postcode || ''}
                  onChange={e => setFormData({
                    ...formData,
                    personal_info: { ...personalInfo, postcode: e.target.value }
                  })}
                  placeholder="e.g. 11511"
                />
              </div>
            </div>
          </div>

          {/* 3. Compensation */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1E701E] flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1E701E] tracking-tight">Compensation</h3>
            </div>

            <div className="space-y-3 max-w-md">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Pay Schedule</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={personalInfo.pay_schedule || ''}
                  onChange={e => setFormData({
                    ...formData,
                    personal_info: { ...personalInfo, pay_schedule: e.target.value }
                  })}
                >
                  <option value="">--Select--</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Semi-Monthly">Semi-Monthly</option>
                  <option value="Bi-Weekly">Bi-Weekly</option>
                  <option value="Weekly">Weekly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Pay type</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={personalInfo.pay_type || ''}
                  onChange={e => setFormData({
                    ...formData,
                    personal_info: { ...personalInfo, pay_type: e.target.value }
                  })}
                >
                  <option value="">--Select--</option>
                  <option value="Salary">Salary</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Commission">Commission</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Pay Rate</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">E£</span>
                    <input
                      type="number"
                      className="w-full pl-8 pr-12 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                      placeholder="0.00"
                      value={personalInfo.pay_rate || formData.salary_base || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          salary_base: val ? parseFloat(val) : 0,
                          personal_info: { ...personalInfo, pay_rate: val }
                        });
                      }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      EGP
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">per</span>
                  <select
                    className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                    value={personalInfo.pay_per || 'Month'}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, pay_per: e.target.value }
                    })}
                  >
                    <option value="">--Select--</option>
                    <option value="Month">Month</option>
                    <option value="Hour">Hour</option>
                    <option value="Year">Year</option>
                    <option value="Week">Week</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Contact */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1E701E] flex items-center justify-center shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1E701E] tracking-tight">Contact</h3>
            </div>

            <div className="space-y-3 max-w-xl">
              <div className="flex items-center gap-2">
                <div className="space-y-1 flex-1">
                  <label className="text-xs font-semibold text-slate-700 block">Work Phone</label>
                  <div className="relative">
                    <input
                      type="tel"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                      value={personalInfo.work_phone || ''}
                      onChange={e => setFormData({
                        ...formData,
                        personal_info: { ...personalInfo, work_phone: e.target.value }
                      })}
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <div className="space-y-1 w-24">
                  <label className="text-xs font-semibold text-slate-700 block">Ext</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                    value={personalInfo.ext || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, ext: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Mobile Phone</label>
                <div className="relative">
                  <input
                    type="tel"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                    value={personalInfo.mobile_phone || formData.phone || ''}
                    onChange={e => setFormData({
                      ...formData,
                      phone: e.target.value,
                      personal_info: { ...personalInfo, mobile_phone: e.target.value }
                    })}
                  />
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Home Phone</label>
                <div className="relative">
                  <input
                    type="tel"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                    value={personalInfo.home_phone || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, home_phone: e.target.value }
                    })}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Work Email<span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                    value={personalInfo.work_email || formData.email || ''}
                    onChange={e => setFormData({
                      ...formData,
                      email: e.target.value,
                      personal_info: { ...personalInfo, work_email: e.target.value }
                    })}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Home Email</label>
                <div className="relative">
                  <input
                    type="email"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                    value={personalInfo.home_email || ''}
                    onChange={e => setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, home_email: e.target.value }
                    })}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Job */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1E701E] flex items-center justify-center shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1E701E] tracking-tight">Job</h3>
            </div>

            <div className="space-y-1 max-w-xs">
              <label className="text-xs font-semibold text-slate-700 block">Contract Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                value={formData.joined_at || ''}
                onChange={e => setFormData({
                  ...formData,
                  joined_at: e.target.value,
                  contract_start_date: e.target.value
                })}
              />
            </div>
          </div>

          {/* 6. Employment Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1E701E] flex items-center justify-center shrink-0">
                <BadgeCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1E701E] tracking-tight">Employment Status</h3>
            </div>

            <div className="space-y-1 max-w-xs">
              <label className="text-xs font-semibold text-slate-700 block">Employment Status</label>
              <select
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                value={personalInfo.employment_status || formData.contract_type || ''}
                onChange={e => setFormData({
                  ...formData,
                  contract_type: e.target.value,
                  personal_info: { ...personalInfo, employment_status: e.target.value }
                })}
              >
                <option value="">--Select--</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Probation">Probation</option>
                <option value="Remote">Remote</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>

          {/* 7. Job Information */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1E701E] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1E701E] tracking-tight">Job Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* 1. Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Job Information: Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={formData.job_info_date || formData.joined_at || new Date().toISOString().split('T')[0]}
                  onChange={e => setFormData({
                    ...formData,
                    job_info_date: e.target.value
                  })}
                />
              </div>

              {/* 2. Department */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Department</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={formData.department_id || ''}
                  onChange={e => {
                    const newDeptId = e.target.value ? parseInt(e.target.value) : '';
                    const newDeptObj = departments.find(d => Number(d.id) === Number(newDeptId));
                    const newTeams = getTeamsForDept(newDeptObj);
                    const firstTeam = newTeams[0]?.name || '';
                    const newTitles = getJobTitlesForDeptAndTeam(newDeptObj, firstTeam);
                    const firstTitle = newTitles[0] || '';

                    let defaultMgr: any = '';
                    if (newDeptObj) {
                      const headId = (newDeptObj as any).department_head_id || (newDeptObj as any).head_id;
                      const headName = (newDeptObj as any).department_head_name || (newDeptObj as any).head_name || (newDeptObj as any).manager_name;
                      defaultMgr = headId || headName || 'CEO';
                    } else {
                      defaultMgr = 'CEO';
                    }

                    const configuredGrades = (() => {
                      try {
                        const raw = localStorage.getItem('systo_org_structure_settings');
                        if (raw) {
                          const parsed = JSON.parse(raw);
                          if (Array.isArray(parsed.job_grades) && parsed.job_grades.length > 0) return parsed.job_grades;
                        }
                      } catch (err) {}
                      return [];
                    })();

                    const autoGrade = getGradeForJobTitle(firstTitle, newDeptId || newDeptObj?.name, departments, configuredGrades);
                    const jd = getJDForTitle(firstTitle, newDeptId || newDeptObj?.name, departments, configuredGrades);
                    let finalGrade = autoGrade || jd?.grade || personalInfo.job_grade || personalInfo.division;
                    let finalLoc = personalInfo.location;
                    if (jd) {
                      if (jd.reportsTo) defaultMgr = jd.reportsTo;
                      if (jd.location) finalLoc = jd.location;
                    }

                    setFormData({
                      ...formData,
                      department_id: newDeptId,
                      department_name: newDeptObj?.name || '',
                      team_name: firstTeam,
                      job_title: firstTitle,
                      reporting_to: defaultMgr,
                      personal_info: {
                        ...personalInfo,
                        location: finalLoc || personalInfo.location,
                        division: finalGrade || personalInfo.division,
                        job_grade: finalGrade || personalInfo.job_grade
                      }
                    });
                  }}
                >
                  <option value="">--Select Department--</option>
                  {departments.map((deptItem, idx) => (
                    <option key={`dept-${deptItem.id}-${idx}`} value={deptItem.id}>{deptItem.name}</option>
                  ))}
                </select>
              </div>

              {/* 3. Teams */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Teams</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={formData.team_name || ''}
                  onChange={e => {
                    const newTeam = e.target.value;
                    const newTitles = getJobTitlesForDeptAndTeam(selectedDept, newTeam);
                    const validTitle = newTitles.includes(formData.job_title) ? formData.job_title : (newTitles[0] || '');

                    let defaultMgr = formData.reporting_to;
                    if (selectedDept && newTeam && selectedDeptTeams.length > 0) {
                      const teamObj = selectedDeptTeams.find(t => t.name === newTeam);
                      if (teamObj) {
                        const leadId = (teamObj as any).team_lead_id || (teamObj as any).lead_id;
                        const leadName = (teamObj as any).team_lead_name || (teamObj as any).leader_name || (teamObj as any).lead_name;
                        if (leadId) defaultMgr = leadId;
                        else if (leadName) defaultMgr = leadName;
                      }
                    }

                    const configuredGrades = (() => {
                      try {
                        const raw = localStorage.getItem('systo_org_structure_settings');
                        if (raw) {
                          const parsed = JSON.parse(raw);
                          if (Array.isArray(parsed.job_grades) && parsed.job_grades.length > 0) return parsed.job_grades;
                        }
                      } catch (err) {}
                      return [];
                    })();

                    const autoGrade = getGradeForJobTitle(validTitle, formData.department_id || selectedDept?.name, departments, configuredGrades);
                    const jd = getJDForTitle(validTitle, formData.department_id || selectedDept?.name, departments, configuredGrades);
                    let finalGrade = autoGrade || jd?.grade || personalInfo.job_grade || personalInfo.division;
                    let finalLoc = personalInfo.location;
                    if (jd) {
                      if (jd.reportsTo) defaultMgr = jd.reportsTo;
                      if (jd.location) finalLoc = jd.location;
                    }

                    setFormData({
                      ...formData,
                      team_name: newTeam,
                      job_title: validTitle,
                      reporting_to: defaultMgr,
                      personal_info: {
                        ...personalInfo,
                        location: finalLoc || personalInfo.location,
                        division: finalGrade || personalInfo.division,
                        job_grade: finalGrade || personalInfo.job_grade
                      }
                    });
                  }}
                >
                  <option value="">--Select Team--</option>
                  {selectedDeptTeams.map((t, idx) => (
                    <option key={`team-${t.name}-${idx}`} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* 4. Job Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Job Title</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={formData.job_title || ''}
                  onChange={e => {
                    const newTitle = e.target.value;
                    const titleLower = (newTitle || '').toLowerCase();
                    const isCeoTitle = titleLower.includes('ceo') || titleLower.includes('chief executive');
                    const isDeptHeadTitle = titleLower.includes('department head') || titleLower.includes('head of department') || titleLower.includes('head of') || isCeoTitle || titleLower.includes('md');

                    let updatedMgr = formData.reporting_to;
                    if (isCeoTitle) {
                      updatedMgr = 'No Manager / Board of Directors';
                    } else if (isDeptHeadTitle) {
                      updatedMgr = 'CEO';
                    }

                    const configuredGrades = (() => {
                      try {
                        const raw = localStorage.getItem('systo_org_structure_settings');
                        if (raw) {
                          const parsed = JSON.parse(raw);
                          if (Array.isArray(parsed.job_grades) && parsed.job_grades.length > 0) return parsed.job_grades;
                        }
                      } catch (err) {}
                      return [];
                    })();

                    const autoGrade = getGradeForJobTitle(newTitle, formData.department_id || formData.department_name, departments, configuredGrades);
                    const jd = getJDForTitle(newTitle, formData.department_id || formData.department_name, departments, configuredGrades);
                    let updatedDeptId = formData.department_id;
                    let updatedDeptName = formData.department_name;
                    let updatedTeam = formData.team_name;
                    let updatedLoc = personalInfo.location;
                    let updatedGrade = autoGrade || jd?.grade || personalInfo.job_grade || personalInfo.division;

                    if (jd) {
                      if (jd.reportsTo && !isDeptHeadTitle) updatedMgr = jd.reportsTo;
                      if (jd.location) updatedLoc = jd.location;
                      if (jd.department) {
                        const foundDept = departments.find(d => d.name?.toLowerCase() === jd.department?.toLowerCase());
                        if (foundDept) {
                          updatedDeptId = foundDept.id;
                          updatedDeptName = foundDept.name;
                        } else {
                          updatedDeptName = jd.department;
                        }
                      }
                      if (jd.team) updatedTeam = jd.team;
                    }

                    setFormData({
                      ...formData,
                      department_id: updatedDeptId,
                      department_name: updatedDeptName,
                      team_name: updatedTeam,
                      job_title: newTitle,
                      reporting_to: updatedMgr,
                      personal_info: {
                        ...personalInfo,
                        location: updatedLoc || personalInfo.location,
                        division: updatedGrade || personalInfo.division,
                        job_grade: updatedGrade || personalInfo.job_grade
                      }
                    });
                  }}
                >
                  <option value="">--Select Job Title--</option>
                  {availableJobTitles.map((jt, idx) => (
                    <option key={`jt-${jt}-${idx}`} value={jt}>{jt}</option>
                  ))}
                </select>
              </div>

              {/* 5. Reporting to */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Reporting to</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={formData.reporting_to || ''}
                  onChange={e => {
                    const val = e.target.value;
                    const numVal = Number(val);
                    setFormData({
                      ...formData,
                      reporting_to: val ? (!isNaN(numVal) ? numVal : val) : null
                    });
                  }}
                >
                  <option value="">--Select Manager--</option>
                  {getReportingToOptions().map((opt, idx) => (
                    <option key={`rep-${opt.id}-${idx}`} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Location */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Location</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={personalInfo.location || ''}
                  onChange={e => {
                    const newLoc = e.target.value;
                    setFormData({
                      ...formData,
                      personal_info: { ...personalInfo, location: newLoc }
                    });
                  }}
                >
                  <option value="">--Select Location--</option>
                  {Array.from(new Set([...LOCATION_OPTIONS, personalInfo.location].filter(Boolean))).map((locOpt, idx) => (
                    <option key={`loc-${locOpt}-${idx}`} value={locOpt}>{locOpt}</option>
                  ))}
                </select>
              </div>

              {/* 7. Job Grade / Level */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 block">Job Grade / Level</label>
                  {formData.job_title && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Auto-synced
                    </span>
                  )}
                </div>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={personalInfo.job_grade || personalInfo.division || ''}
                  onChange={e => setFormData({
                    ...formData,
                    personal_info: { 
                      ...personalInfo, 
                      division: e.target.value,
                      job_grade: e.target.value 
                    }
                  })}
                >
                  <option value="">--Select Job Grade / Level--</option>
                  {(() => {
                    const opts = new Set<string>();
                    try {
                      const raw = localStorage.getItem('systo_org_structure_settings');
                      if (raw) {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed.job_grades)) {
                          parsed.job_grades.forEach((g: any) => {
                            if (g.code && g.name) opts.add(`${g.code} - ${g.name}`);
                            else if (g.name) opts.add(g.name);
                          });
                        }
                      }
                    } catch (err) {}
                    GRADE_LEVEL_OPTIONS.forEach(gr => opts.add(gr));
                    if (Array.isArray(departments)) {
                      departments.forEach((dept: any) => {
                        let deptTitles: any[] = [];
                        if (Array.isArray(dept.job_titles)) deptTitles = dept.job_titles;
                        else if (typeof dept.job_titles === 'string') {
                          try { deptTitles = JSON.parse(dept.job_titles); } catch (e) {}
                        }
                        deptTitles.forEach((jt: any) => {
                          if (typeof jt === 'object' && jt) {
                            const l = jt.level || jt.grade;
                            if (typeof l === 'string' && l.trim()) opts.add(l.trim());
                          }
                        });
                      });
                    }
                    if (personalInfo.job_grade) opts.add(personalInfo.job_grade);
                    if (personalInfo.division) opts.add(personalInfo.division);
                    return Array.from(opts).map((grName, idx) => (
                      <option key={`gr-${grName}-${idx}`} value={grName}>{grName}</option>
                    ));
                  })()}
                </select>
              </div>

              {/* 8. Change Reason */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Change Reason</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1E701E]"
                  value={formData.job_info_change_reason || 'New Hire'}
                  onChange={e => setFormData({
                    ...formData,
                    job_info_change_reason: e.target.value
                  })}
                >
                  {['New Hire', 'Initial Contract Hire', 'Promotion', 'Demotion', 'Transfer', 'Rehire', 'Title Change'].map((reason, idx) => (
                    <option key={`rs-${reason}-${idx}`} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 8. Attendance Calculation Method */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1E701E] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1E701E] tracking-tight">Attendance Method</h3>
                <p className="text-xs text-slate-500 font-medium">Select attendance tracking method for deduction policy and payroll calculation</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, attendance_method: 'Login System' })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 text-left",
                  (formData.attendance_method || 'Login System') === 'Login System'
                    ? "border-[#1E701E] bg-emerald-50/30 shadow-xs ring-1 ring-[#1E701E]/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                  <LogIn className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">Login System</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    For Sales, Call Center, and field staff (clock-in directly through system login)
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, attendance_method: 'Fingerprint' })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 text-left",
                  formData.attendance_method === 'Fingerprint'
                    ? "border-[#1E701E] bg-emerald-50/30 shadow-xs ring-1 ring-[#1E701E]/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">Fingerprint</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    For Managers, HR management, and Administrative staff (biometric fingerprint device)
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 9. Self-service access */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1E701E] flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#1E701E] tracking-tight">Self-service access & System Role</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div 
                onClick={() => setFormData({
                  ...formData,
                  personal_info: { ...personalInfo, self_service_access: 'allow' }
                })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3",
                  (personalInfo.self_service_access || 'allow') === 'allow'
                    ? "border-[#1E701E] bg-emerald-50/20 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#1E701E] flex items-center justify-center shrink-0 font-bold mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#1E701E]">Allow Access to Portal</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Employee will get system access and automatically appear in the Admin Panel Users list.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => setFormData({
                  ...formData,
                  role_id: null,
                  personal_info: { ...personalInfo, self_service_access: 'no_access', role_id: null }
                })}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3",
                  personalInfo.self_service_access === 'no_access'
                    ? "border-[#1E701E] bg-emerald-50/20 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 font-bold mt-0.5">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">No Access</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Employee will NOT have system login and will NOT be added to Admin Panel Users.
                  </p>
                </div>
              </div>
            </div>

            {/* Role Selection Dropdown when Allow Access is selected */}
            {(personalInfo.self_service_access || 'allow') === 'allow' ? (
              <div className="mt-4 pt-4 border-t border-slate-100 max-w-xl space-y-2 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#1E701E]" />
                  <span>System Permissions Role</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.role_id || personalInfo.role_id || ''}
                  onChange={(e) => {
                    const rId = e.target.value ? Number(e.target.value) : null;
                    const selectedRole = safeSystemRoles.find((r: any) => r.id === rId);
                    setFormData({
                      ...formData,
                      role_id: rId,
                      personal_info: {
                        ...personalInfo,
                        self_service_access: 'allow',
                        role_id: rId,
                        role_name: selectedRole?.name || ''
                      }
                    });
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-[#1E701E] outline-none shadow-2xs cursor-pointer"
                  required
                >
                  <option value="">-- Choose System Role --</option>
                  {safeSystemRoles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5 mt-1">
                  <span>✓</span> Selecting a role automatically creates a user entry in the Admin Panel Users tab.
                </p>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 font-medium flex items-center gap-2">
                <Ban className="w-4 h-4 text-slate-400 shrink-0" />
                <span>No System Access: This employee will be stored in HR records only and will NOT appear in Admin Panel Users.</span>
              </div>
            )}
          </div>
    </>
  );

  if (isFullPage) {
    return (
      <div className="flex-1 flex flex-col min-h-screen bg-[#f4f5f7] rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden font-sans">
        <form id="employee-add-form" onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {/* 1. Header Navigation Bar (Identical to Employee Profile) */}
          <div className="bg-white border-b border-slate-200 px-6 md:px-10 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Directory</span>
              </button>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">Add New Employee</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 bg-[#1E701E] hover:bg-[#165516] text-white text-xs font-bold rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer border-none"
              >
                <Check className="w-4 h-4" />
                <span>Save Employee</span>
              </button>
            </div>
          </div>

          {/* 2. Hero Green Banner (Identical to Employee Profile) */}
          <div className="bg-[#1E701E] text-white px-6 md:px-10 pt-8 pb-8 relative shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Avatar Placeholder */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white/20 shadow-md bg-white/10 flex items-center justify-center text-white">
                    <UserPlus className="w-10 h-10 text-white/80" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                      {[personalInfo.first_name, personalInfo.last_name].filter(Boolean).join(' ') || formData.name || 'New Employee'}
                    </h1>
                    <span className="font-mono text-xs text-white/70 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                      ID: #{formData.employee_id !== undefined && formData.employee_id !== '' ? formData.employee_id : (personalInfo.employee_number || formData.id_number || 'Auto')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-400/30 text-emerald-100">
                      {formData.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-emerald-100/90">
                    {formData.job_title || 'Position Title Not Specified'}
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/15 text-white font-bold">
                      {selectedDept?.name || formData.department_name || 'Human Resources'}
                    </span>
                    {formData.team_name && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-100 font-medium">
                        Team: {formData.team_name}
                      </span>
                    )}
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-100 font-medium">
                      {formData.contract_type || 'Full-time'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 bg-white text-[#1E701E] hover:bg-slate-50 text-xs font-bold rounded-full shadow-sm hover:shadow transition-all cursor-pointer border-none"
                >
                  <Check className="w-4 h-4 text-[#1E701E]" />
                  <span>Save Employee Record</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Form Body Content */}
          <div className="flex-1 bg-[#f4f5f7] p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-6">
              {renderFormCards()}

              {/* Bottom Action Footer Bar */}
              <div className="sticky bottom-4 bg-white/95 backdrop-blur border border-slate-200 p-4 sm:px-8 shadow-xl flex items-center justify-between gap-3 z-30 rounded-2xl">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Ready to register • All fields will be synced to Employee Profile</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2.5 bg-[#1E701E] hover:bg-[#165516] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Employee</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 md:p-8 animate-fadeIn">
      <div className="max-w-5xl mx-auto pb-24 space-y-5 font-sans">
        <form id="employee-add-form" onSubmit={handleSubmit} className="space-y-5">
          {/* Top Modal Sticky Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-[#1E701E] flex items-center justify-center font-bold shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                  <span>Add New Employee</span>
                  {personalInfo.first_name && (
                    <span className="text-[#1E701E] font-semibold text-base">
                      ({[personalInfo.first_name, personalInfo.last_name].filter(Boolean).join(' ')})
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Fill in the employee information to register their profile in the system
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {renderFormCards()}

          {/* Bottom Action Footer Bar */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-200 p-4 sm:px-8 shadow-xl flex items-center justify-end gap-3 z-30 rounded-2xl">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-8 py-2.5 bg-[#1E701E] hover:bg-[#165516] text-white rounded-lg text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Save</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployeeModal;
