import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { EmployeeRecognitionTab } from '../../../../components/HR/EmployeeRecognitionTab';
import { EmployeeProfileOutletContext } from './types';

export const RecognitionTab: React.FC = () => {
  const { 
    employee, 
    currentUser, 
    isViewOnly, 
    onSaveEmployeeDetails 
  } = useOutletContext<EmployeeProfileOutletContext>();

  if (!employee) return null;

  return (
    <div className="w-full">
      <EmployeeRecognitionTab
        emp={employee}
        currentUser={currentUser}
        isViewOnly={isViewOnly}
        onSaveEmployeeDetails={onSaveEmployeeDetails}
      />
    </div>
  );
};

export default RecognitionTab;
