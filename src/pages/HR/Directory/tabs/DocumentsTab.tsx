import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { EmployeeDocumentsTab } from '../../../../components/HR/EmployeeDocumentsTab';
import { EmployeeProfileOutletContext } from './types';

export const DocumentsTab: React.FC = () => {
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
      <EmployeeDocumentsTab
        emp={employee}
        currentUser={currentUser}
        onRefreshEmployee={onRefreshEmployee}
        isViewOnly={isViewOnly}
        onSaveEmployeeDetails={onSaveEmployeeDetails}
      />
    </div>
  );
};

export default DocumentsTab;
