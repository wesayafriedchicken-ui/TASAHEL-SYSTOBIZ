import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHRContext } from '../../HRContext';
import { TeamsBuilderSubTab, DeptSubTabType } from '../../../../components/HR/DepartmentSubTabs';

export const TeamsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    departments, 
    employees, 
    isHRAdmin, 
    canAddDept, 
    canEditDept, 
    canDeleteDept, 
    fetchData, 
    showCustomToast 
  } = useHRContext();

  const handleSubTabChange = (tab: DeptSubTabType) => {
    if (tab === 'departments') navigate('/hr/departments');
    else if (tab === 'teams') navigate('/hr/departments/teams');
    else if (tab === 'job_titles') navigate('/hr/departments/titles');
    else if (tab === 'job_descriptions') navigate('/hr/departments/descriptions');
  };

  return (
    <div className="space-y-6">
      <TeamsBuilderSubTab
        activeSubTab="teams"
        onSubTabChange={handleSubTabChange}
        departments={departments}
        employees={employees}
        isHRAdmin={isHRAdmin}
        canAddDept={canAddDept}
        canEditDept={canEditDept}
        canDeleteDept={canDeleteDept}
        onRefreshData={fetchData}
        showCustomToast={showCustomToast}
      />
    </div>
  );
};

export default TeamsListPage;
