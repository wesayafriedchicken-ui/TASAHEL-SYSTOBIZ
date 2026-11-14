import React from 'react';
import HRManagement from '../../../components/HR/HRManagement';

export const ShiftSchedulePage: React.FC = () => {
  return (
    <div className="w-full">
      <HRManagement 
        initialTab="attendance" 
        initialAttendanceSubTab="shifts" 
        initialShiftSection="hub"
        hideLayoutNav={true} 
        hideAttendanceSubNav={true} 
      />
    </div>
  );
};

export default ShiftSchedulePage;
