import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const RefundsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Vendors', href: '/accounting/vendors/bills' },
        { label: 'Refunds' }
      ]}
      title="Vendor Refunds"
      badge="Debit Notes"
      entityName="Refund"
      initialData={[
        { id: 1, reference: 'RBILL/2026/0001', partner: 'Office Towers Facility Mgmt', date: '2026-09-30', amount: 800.00, status: 'Posted' }
      ]}
      emptyDescription="Manage vendor credit notes, debit adjustments, and return compensations."
    />
  );
};

export default RefundsPage;
