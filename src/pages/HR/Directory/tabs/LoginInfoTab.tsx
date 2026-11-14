import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { LoginInfoTab as EmployeeLoginInfoTab } from '../../../../components/HR/LoginInfoTab';
import { EmployeeProfileOutletContext } from './types';

export const LoginInfoTab: React.FC = () => {
  const { 
    employee, 
    isViewOnly, 
    onSaveEmployeeDetails 
  } = useOutletContext<EmployeeProfileOutletContext>();

  if (!employee) return null;

  return (
    <div className="w-full">
      <EmployeeLoginInfoTab
        emp={employee}
        isViewOnly={isViewOnly}
        onSaveEmployeeDetails={onSaveEmployeeDetails}
      />
    </div>
  );
};

export default LoginInfoTab;
