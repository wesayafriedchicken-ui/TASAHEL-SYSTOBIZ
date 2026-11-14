import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHRContext } from '../HRContext';
import { AddEmployeeModal } from '../../../components/HR/AddEmployeeModal';
import { saveCustomFieldValues } from '../../../components/HR/CustomFieldsManager';

export const AddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    employees = [],
    departments = [],
    currentUser,
    fetchData,
    showCustomToast
  } = useHRContext();

  const safeDepartments = Array.isArray(departments) ? departments : [];
  const safeEmployees = Array.isArray(employees) ? employees : [];

  const [customFieldValues, setCustomFieldValues] = useState<Record<number, string>>({});
  const [formData, setFormData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    role: 'Staff',
    job_title: '',
    department_id: '',
    department_name: '',
    team_name: '',
    country: 'Egypt',
    city: 'Cairo',
    salary: '',
    status: 'active',
    contract_type: 'Full-time',
    contract_start_date: new Date().toISOString().split('T')[0],
    contract_end_date: '',
    joined_at: new Date().toISOString().split('T')[0],
    manager_id: '',
    manager_name: '',
    job_grade: 'L1',
    division: 'Corporate',
    job_description: '',
    location: 'Main Headquarter (Cairo)',
    work_phone: '',
    work_mobile: '',
    work_email: '',
    personal_email: '',
    national_id: '',
    passport_number: '',
    gender: 'Male',
    marital_status: 'Single',
    dob: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    attendance_method: 'Login System',
    system_role_id: '',
    system_role_name: '',
    portal_access: true,
    system_username: '',
    system_password: '',
    assigned_shift_id: null,
    job_informations: [],
    compensations: [],
    employment_statuses: [],
    personal_info: {}
  });

  const syncEmployeeStatusWithUser = async (employeeData: any) => {
    if (!employeeData) return;
    const statusStr = (employeeData.status || employeeData.personal_info?.status || employeeData.employment_status || '').toString().toLowerCase();
    const isInactive = statusStr === 'inactive' || statusStr === 'terminated' || statusStr === 'resigned' || statusStr === 'suspended';
    const targetUserStatus = isInactive ? 'inactive' : 'active';

    try {
      const localUsersStr = localStorage.getItem('business_core_users');
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr);
        let updated = false;
        const nextUsers = localUsers.map((u: any) => {
          const isMatch = (employeeData.id && String(u.employee_id) === String(employeeData.id)) ||
                          (employeeData.user_id && String(u.id) === String(employeeData.user_id)) ||
                          (employeeData.work_email && u.email && (u.email || '').toLowerCase() === (employeeData.work_email || '').toLowerCase()) ||
                          (employeeData.email && u.email && (u.email || '').toLowerCase() === (employeeData.email || '').toLowerCase()) ||
                          (employeeData.name && u.name && (u.name || '').toLowerCase() === (employeeData.name || '').toLowerCase());
          if (isMatch) {
            updated = true;
            if (u.id) {
              fetch(`/api/admin/users/${u.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetUserStatus })
              }).catch(() => {
                fetch(`/api/admin/users/${u.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: targetUserStatus })
                }).catch(() => null);
              });
            }
            return { ...u, status: targetUserStatus };
          }
          return u;
        });

        if (updated) {
          localStorage.setItem('business_core_users', JSON.stringify(nextUsers));
        }
      }
    } catch (e) {
      console.error('Failed to sync employee status to system users:', e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetDeptId = formData.department_id ? Number(formData.department_id) : (safeDepartments[0]?.id || null);
      const matchedDept = safeDepartments.find(d => d.id === targetDeptId);
      const computedDeptName = matchedDept?.name || formData.department_name || safeDepartments[0]?.name || 'Human Resources';
      const computedJobTitle = formData.job_title || 'Staff';
      const computedTeamName = formData.team_name || (matchedDept && Array.isArray(matchedDept.teams) && matchedDept.teams[0] ? (typeof matchedDept.teams[0] === 'string' ? matchedDept.teams[0] : (matchedDept.teams[0] as any).name) : 'Core Team');

      let computedManagerName = formData.manager_name || '';
      if (formData.manager_id) {
        const mgr = safeEmployees.find(emp => emp.id?.toString() === formData.manager_id?.toString());
        if (mgr) computedManagerName = mgr.name;
      }

      const hireDate = formData.contract_start_date || formData.joined_at || new Date().toISOString().split('T')[0];
      const initialJobInfo = {
        id: `ji-${Date.now()}`,
        date: hireDate,
        location: formData.location || 'Main Headquarter (Cairo)',
        division: formData.division || 'Corporate',
        jobGrade: formData.job_grade || 'L1',
        department: computedDeptName,
        teams: computedTeamName,
        jobTitle: computedJobTitle,
        reportingTo: computedManagerName,
        changeReason: 'Initial Hire'
      };

      const initialComp = {
        id: `comp-${Date.now()}`,
        date: hireDate,
        paySchedule: 'Monthly',
        payType: 'Salary',
        payRate: parseFloat(formData.salary) || 0,
        paidPer: 'Month',
        overtimeStatus: 'Exempt',
        changeReason: 'Initial Hire',
        comments: 'Initial contract compensation'
      };

      const initialStatus = {
        id: `es-${Date.now()}`,
        date: hireDate,
        status: formData.contract_type || 'Full-time',
        comments: 'Initial contract start'
      };

      const updatedPersonalInfo = {
        ...(formData.personal_info || {}),
        work_phone: formData.work_phone || '',
        work_mobile: formData.work_mobile || '',
        work_email: formData.work_email || formData.email || '',
        personal_email: formData.personal_email || '',
        national_id: formData.national_id || '',
        passport_number: formData.passport_number || '',
        gender: formData.gender || 'Male',
        marital_status: formData.marital_status || 'Single',
        dob: formData.dob || '',
        address: formData.address || '',
        emergency_contact_name: formData.emergency_contact_name || '',
        emergency_contact_phone: formData.emergency_contact_phone || '',
        emergency_contact_relation: formData.emergency_contact_relation || '',
        attendance_method: formData.attendance_method || 'Login System',
        system_role_id: formData.system_role_id || '',
        system_role_name: formData.system_role_name || '',
        portal_access: formData.portal_access ?? true,
        system_username: formData.system_username || formData.email || '',
        system_password: formData.system_password || '',
        assigned_shift_id: formData.assigned_shift_id ? Number(formData.assigned_shift_id) : null,
        country: formData.country || 'Egypt',
        city: formData.city || 'Cairo',
        job_description: formData.job_description || '',
        job_grade: formData.job_grade || 'L1',
        division: formData.division || 'Corporate',
        location: formData.location || 'Main Headquarter (Cairo)',
        team_name: computedTeamName,
        department_name: computedDeptName
      };

      const sanitizedData = {
        ...formData,
        department_id: targetDeptId,
        department_name: computedDeptName,
        job_title: computedJobTitle,
        team_name: computedTeamName,
        manager_id: formData.manager_id ? Number(formData.manager_id) : null,
        manager_name: computedManagerName,
        contract_start_date: hireDate,
        contract_end_date: formData.contract_end_date || null,
        joined_at: hireDate,
        status: formData.status || 'active',
        job_informations: (formData.job_informations && formData.job_informations.length > 0) 
          ? formData.job_informations 
          : [initialJobInfo],
        compensations: (formData.compensations && formData.compensations.length > 0) 
          ? formData.compensations 
          : [initialComp],
        employment_statuses: (formData.employment_statuses && formData.employment_statuses.length > 0) 
          ? formData.employment_statuses 
          : [initialStatus],
        personal_info: updatedPersonalInfo
      };

      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify(sanitizedData)
      });

      if (res.ok) {
        await syncEmployeeStatusWithUser(sanitizedData);
        let savedId = null;
        try {
          const result = await res.json();
          savedId = result.id || (Array.isArray(result) ? result[0]?.id : null);
        } catch (e) {}
        if (savedId) {
          await saveCustomFieldValues(savedId, customFieldValues);
        }
        await fetchData();
        showCustomToast('New employee added successfully!', 'success');
        navigate('/hr/directory');
      } else {
        alert('Failed to save employee. Please check required fields.');
      }
    } catch (err) {
      console.error('Failed to save employee:', err);
      alert('An error occurred while saving employee.');
    }
  };

  return (
    <AddEmployeeModal
      isOpen={true}
      isFullPage={true}
      onClose={() => navigate('/hr/directory')}
      formData={formData}
      setFormData={setFormData}
      handleSubmit={handleSubmit}
      employees={safeEmployees}
      departments={safeDepartments}
    />
  );
};

export default AddEmployeePage;
