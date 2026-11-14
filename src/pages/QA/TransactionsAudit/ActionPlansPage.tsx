import React from 'react';
import { TransactionsAudit } from '../../../components/QA/TransactionsAudit';

export const ActionPlansPage: React.FC = () => {
  return (
    <div className="space-y-6" id="qa-action-plans-page">
      <TransactionsAudit forcedSubTab="action_plans" hideSubNav={true} />
    </div>
  );
};

export default ActionPlansPage;
