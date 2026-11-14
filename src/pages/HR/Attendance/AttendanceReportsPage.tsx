import React from 'react';
import HRManagement from '../../../components/HR/HRManagement';

export const AttendanceReportsPage: React.FC = () => {
  return (
    <div className="w-full">
      <HRManagement 
        initialTab="attendance" 
        initialAttendanceSubTab="reports" 
        hideLayoutNav={true} 
        hideAttendanceSubNav={true} 
      />
    </div>
  );
};

export default AttendanceReportsPage;
