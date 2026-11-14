import React from 'react';
import HRManagement from '../../../components/HR/HRManagement';

export const CompanyHolidaysPage: React.FC = () => {
  return (
    <div className="w-full">
      <HRManagement 
        initialTab="attendance" 
        initialAttendanceSubTab="shifts" 
        initialShiftSection="holidays"
        hideLayoutNav={true} 
        hideAttendanceSubNav={true} 
      />
    </div>
  );
};

export default CompanyHolidaysPage;
