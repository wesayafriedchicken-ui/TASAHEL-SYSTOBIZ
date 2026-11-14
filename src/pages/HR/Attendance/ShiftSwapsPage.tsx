import React from 'react';
import HRManagement from '../../../components/HR/HRManagement';

export const ShiftSwapsPage: React.FC = () => {
  return (
    <div className="w-full">
      <HRManagement 
        initialTab="attendance" 
        initialAttendanceSubTab="swaps" 
        hideLayoutNav={true} 
        hideAttendanceSubNav={true} 
      />
    </div>
  );
};

export default ShiftSwapsPage;
