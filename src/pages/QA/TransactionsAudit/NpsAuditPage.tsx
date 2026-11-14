import React from 'react';
import { TransactionsAudit } from '../../../components/QA/TransactionsAudit';

export const NpsAuditPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-nps-audit-page">
      <TransactionsAudit forcedSubTab="nps" hideSubNav={true} />
    </div>
  );
};

export default NpsAuditPage;
