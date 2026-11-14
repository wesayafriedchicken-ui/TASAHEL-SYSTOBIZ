import React from 'react';
import { EmployeeQualityTracker } from '../../../components/QA/EmployeeQualityTracker';

export const EmployeeQualityTrackingPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-employee-tracking-page">
      <EmployeeQualityTracker />
    </div>
  );
};

export default EmployeeQualityTrackingPage;
