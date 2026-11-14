import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const BillsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Vendors', href: '/accounting/vendors/bills' },
        { label: 'Bills' }
      ]}
      title="Vendor Bills"
      badge="Purchases"
      entityName="Bill"
      initialData={[
        { id: 1, reference: 'BILL/2026/0012', partner: 'Amazon Web Services EMEA', date: '2026-09-25', amount: 3450.00, status: 'Posted' },
        { id: 2, reference: 'BILL/2026/0013', partner: 'Office Towers Facility Mgmt', date: '2026-09-28', amount: 15000.00, status: 'Paid' },
        { id: 3, reference: 'BILL/2026/0014', partner: 'Nile Telecom & Cloud', date: '2026-10-02', amount: 2100.00, status: 'Draft' }
      ]}
      emptyDescription="Record incoming vendor invoices, match purchase receipts, and schedule vendor payments."
    />
  );
};

export default BillsPage;
