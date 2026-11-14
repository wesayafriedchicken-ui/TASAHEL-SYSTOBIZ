import React from 'react';
import QA from '../../../components/QA/QA';

export const NCRIncidentLogPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-ncr-logs-page">
      <QA 
        forcedTab="internal_audit" 
        forcedInternalSubTab="ncr" 
        hideTopBanner={true} 
        hideMainTabs={true} 
        hideInternalTabs={true} 
      />
    </div>
  );
};

export default NCRIncidentLogPage;
