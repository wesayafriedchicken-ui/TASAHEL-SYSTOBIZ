import React from 'react';
import QA from '../../../components/QA/QA';

export const CapaActionPlansPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-capa-action-plans-page">
      <QA 
        forcedTab="internal_audit" 
        forcedInternalSubTab="capa" 
        hideTopBanner={true} 
        hideMainTabs={true} 
        hideInternalTabs={true} 
      />
    </div>
  );
};

export default CapaActionPlansPage;
