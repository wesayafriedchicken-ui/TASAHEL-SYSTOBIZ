import React from 'react';
import { TransactionsAudit } from '../../../components/QA/TransactionsAudit';

export const RefundsAuditPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-refunds-audit-page">
      <TransactionsAudit forcedSubTab="refunds" hideSubNav={true} />
    </div>
  );
};

export default RefundsAuditPage;
