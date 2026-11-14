import React from 'react';
import { TransactionsAudit } from '../../../components/QA/TransactionsAudit';

export const ChecklistsAuditPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-checklists-audit-page">
      <TransactionsAudit forcedSubTab="checklists" hideSubNav={true} />
    </div>
  );
};

export default ChecklistsAuditPage;
