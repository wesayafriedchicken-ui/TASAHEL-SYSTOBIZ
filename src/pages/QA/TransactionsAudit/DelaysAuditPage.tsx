import React from 'react';
import { TransactionsAudit } from '../../../components/QA/TransactionsAudit';

export const DelaysAuditPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-delays-audit-page">
      <TransactionsAudit forcedSubTab="delays" hideSubNav={true} />
    </div>
  );
};

export default DelaysAuditPage;
