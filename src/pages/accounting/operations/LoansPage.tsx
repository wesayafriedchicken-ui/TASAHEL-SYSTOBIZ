import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const LoansPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting/operations/journal-entries' },
        { label: 'Loans' }
      ]}
      title="Loans & Liabilities"
      badge="Financing"
      entityName="Loan"
      initialData={[
        { id: 1, reference: 'LOAN-001', partner: 'Commercial Bank Expansion Loan', date: '2026-01-01', amount: 500000.00, status: 'Active' },
        { id: 2, reference: 'LOAN-002', partner: 'Equipment Capital Lease', date: '2026-04-15', amount: 150000.00, status: 'Active' }
      ]}
      emptyDescription="Track corporate loans, principal amortizations, accrued interest expenses, and liability schedules."
    />
  );
};

export default LoansPage;
