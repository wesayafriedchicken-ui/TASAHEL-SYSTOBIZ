import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { EmployeeTrainingTab } from '../../../../components/HR/EmployeeTrainingTab';
import { EmployeeProfileOutletContext } from './types';

export const TrainingTab: React.FC = () => {
  const { 
    employee, 
    currentUser, 
    isViewOnly 
  } = useOutletContext<EmployeeProfileOutletContext>();

  if (!employee) return null;

  return (
    <div className="w-full">
      <EmployeeTrainingTab
        emp={employee}
        currentUser={currentUser}
        isViewOnly={isViewOnly}
      />
    </div>
  );
};

export default TrainingTab;
