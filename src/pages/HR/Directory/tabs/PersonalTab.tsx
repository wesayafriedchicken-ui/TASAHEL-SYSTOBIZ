import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { EmployeePersonalTab } from '../../../../components/HR/EmployeePersonalTab';
import { EmployeeProfileOutletContext } from './types';

export const PersonalTab: React.FC = () => {
  const { 
    employee, 
    currentUser, 
    onRefreshEmployee, 
    isViewOnly, 
    onSaveEmployeeDetails 
  } = useOutletContext<EmployeeProfileOutletContext>();

  if (!employee) return null;

  return (
    <div className="w-full">
      <EmployeePersonalTab
        emp={employee}
        currentUser={currentUser}
        onRefreshEmployee={onRefreshEmployee}
        isViewOnly={isViewOnly}
        onSaveEmployeeDetails={onSaveEmployeeDetails}
      />
    </div>
  );
};

export default PersonalTab;
