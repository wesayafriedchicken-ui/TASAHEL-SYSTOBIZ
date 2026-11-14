import React from 'react';
import HRManagement from '../../../components/HR/HRManagement';

export const ShiftScheduleConfigurePage: React.FC = () => {
  return (
    <div className="w-full">
      <HRManagement 
        initialTab="attendance" 
        initialAttendanceSubTab="shifts" 
        initialShiftSection="configure"
        hideLayoutNav={true} 
        hideAttendanceSubNav={true} 
      />
    </div>
  );
};

export default ShiftScheduleConfigurePage;
