import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const JournalEntriesPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting/operations/journal-entries' },
        { label: 'Journal Entries' }
      ]}
      title="Journal Entries"
      badge="Transactions"
      entityName="Journal Entry"
      initialData={[
        { id: 1, reference: 'MISC/2026/0001', partner: 'Monthly Depreciation Adjustment', date: '2026-09-30', amount: 4500.00, status: 'Posted' },
        { id: 2, reference: 'MISC/2026/0002', partner: 'Accrued Payroll September', date: '2026-09-30', amount: 84000.00, status: 'Posted' },
        { id: 3, reference: 'MISC/2026/0003', partner: 'VAT Settlement Q3', date: '2026-10-01', amount: 16200.00, status: 'Draft' }
      ]}
      emptyDescription="Create manual journal entries, adjusting vouchers, and general ledger transaction records."
    />
  );
};

export default JournalEntriesPage;
