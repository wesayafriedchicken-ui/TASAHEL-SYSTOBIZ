import React from 'react';
import QA from '../../../components/QA/QA';

export const AuditHistoryPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-audit-history-page">
      <QA 
        forcedTab="history" 
        hideTopBanner={true} 
        hideMainTabs={true} 
      />
    </div>
  );
};

export default AuditHistoryPage;
