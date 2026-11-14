import React from 'react';
import QA from '../../../components/QA/QA';

export const PerformAuditsPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-perform-audits-page">
      <QA 
        forcedTab="internal_audit" 
        forcedInternalSubTab="audit" 
        hideTopBanner={true} 
        hideMainTabs={true} 
        hideInternalTabs={true} 
      />
    </div>
  );
};

export default PerformAuditsPage;
