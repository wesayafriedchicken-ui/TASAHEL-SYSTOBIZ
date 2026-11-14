import React from 'react';
import HRManagement from '../../../components/HR/HRManagement';

export const ShiftScheduleRotationMatrixPage: React.FC = () => {
  return (
    <div className="w-full">
      <HRManagement 
        initialTab="attendance" 
        initialAttendanceSubTab="shifts" 
        initialShiftSection="rotation-matrix"
        hideLayoutNav={true} 
        hideAttendanceSubNav={true} 
      />
    </div>
  );
};

export default ShiftScheduleRotationMatrixPage;
