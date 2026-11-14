import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const WorkingFilesPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Review', href: '/accounting/review/journal-items' },
        { label: 'Working Files' }
      ]}
      title="Audit Working Files"
      badge="Workpapers"
      entityName="Working File"
      initialData={[
        { id: 1, reference: 'WP-2026-Q3-01', partner: 'Accounts Receivable Confirmation Letters', date: '2026-10-01', amount: '12 Letters', status: 'Active' },
        { id: 2, reference: 'WP-2026-Q3-02', partner: 'Bank Confirmation Certificates', date: '2026-10-02', amount: '3 Accounts', status: 'Active' },
        { id: 3, reference: 'WP-2026-Q3-03', partner: 'Physical Inventory Count Sheet', date: '2026-10-03', amount: 'Reconciled', status: 'Posted' }
      ]}
      emptyDescription="Manage auditor workpapers, supporting vouchers, confirmation schedules, and analytical reviews."
    />
  );
};

export default WorkingFilesPage;
