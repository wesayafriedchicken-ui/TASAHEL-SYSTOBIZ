import React from 'react';
import { useNavigate } from 'react-router-dom';
import IntradayTimeline from '../../../components/HR/IntradayTimeline';

export const IntradayTimelinePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full" id="hr-intraday-timeline-page">
      <IntradayTimeline 
        onBack={() => navigate('/hr/attendance/shifts')}
      />
    </div>
  );
};

export default IntradayTimelinePage;
