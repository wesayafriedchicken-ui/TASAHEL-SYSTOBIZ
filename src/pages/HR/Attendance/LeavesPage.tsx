import React from 'react';
import HRManagement from '../../../components/HR/HRManagement';

export const LeavesPage: React.FC = () => {
  return (
    <div className="w-full">
      <HRManagement 
        initialTab="attendance" 
        initialAttendanceSubTab="leave" 
        hideLayoutNav={true} 
        hideAttendanceSubNav={true} 
      />
    </div>
  );
};

export default LeavesPage;
