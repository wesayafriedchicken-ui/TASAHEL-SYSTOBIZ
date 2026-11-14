import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { EmployeeEmergencyTab } from '../../../../components/HR/EmployeeEmergencyTab';
import { EmployeeProfileOutletContext } from './types';

export const EmergencyTab: React.FC = () => {
  const { 
    employee, 
    currentUser, 
    isViewOnly, 
    onSaveEmployeeDetails 
  } = useOutletContext<EmployeeProfileOutletContext>();

  if (!employee) return null;

  return (
    <div className="w-full">
      <EmployeeEmergencyTab
        emp={employee}
        currentUser={currentUser}
        isViewOnly={isViewOnly}
        onSaveEmployeeDetails={onSaveEmployeeDetails}
      />
    </div>
  );
};

export default EmergencyTab;
