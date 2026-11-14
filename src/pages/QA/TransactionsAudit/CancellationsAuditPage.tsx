import React from 'react';
import { TransactionsAudit } from '../../../components/QA/TransactionsAudit';

export const CancellationsAuditPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-cancellations-audit-page">
      <TransactionsAudit forcedSubTab="cancellations" hideSubNav={true} />
    </div>
  );
};

export default CancellationsAuditPage;
