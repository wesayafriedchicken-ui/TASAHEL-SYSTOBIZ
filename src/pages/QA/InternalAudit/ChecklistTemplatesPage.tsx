import React from 'react';
import QA from '../../../components/QA/QA';

export const ChecklistTemplatesPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-checklist-templates-page">
      <QA 
        forcedTab="internal_audit" 
        forcedInternalSubTab="builder" 
        hideTopBanner={true} 
        hideMainTabs={true} 
        hideInternalTabs={true} 
      />
    </div>
  );
};

export default ChecklistTemplatesPage;
