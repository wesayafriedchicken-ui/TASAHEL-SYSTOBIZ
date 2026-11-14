import React from 'react';
import HRManagement from '../../../components/HR/HRManagement';

export const DailyLogsPage: React.FC = () => {
  return (
    <div className="w-full">
      <HRManagement 
        initialTab="attendance" 
        initialAttendanceSubTab="daily" 
        hideLayoutNav={true} 
        hideAttendanceSubNav={true} 
      />
    </div>
  );
};

export default DailyLogsPage;
