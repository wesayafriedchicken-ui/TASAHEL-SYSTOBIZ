import React from 'react';
import { TransactionsAudit } from '../../../components/QA/TransactionsAudit';

export const ComplaintsAuditPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-complaints-audit-page">
      <TransactionsAudit forcedSubTab="complaints" hideSubNav={true} />
    </div>
  );
};

export default ComplaintsAuditPage;
