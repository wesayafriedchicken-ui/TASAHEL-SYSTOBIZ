import React from 'react';
import HRManagement from '../../../components/HR/HRManagement';

export const BreakShiftsPage: React.FC = () => {
  return (
    <div className="w-full">
      <HRManagement 
        initialTab="attendance" 
        initialAttendanceSubTab="breaks" 
        hideLayoutNav={true} 
        hideAttendanceSubNav={true} 
      />
    </div>
  );
};

export default BreakShiftsPage;
