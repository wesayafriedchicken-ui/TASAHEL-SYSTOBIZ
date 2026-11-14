import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const VendorsListPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Vendors', href: '/accounting/vendors/bills' },
        { label: 'Vendors' }
      ]}
      title="Vendors Directory"
      badge="Suppliers"
      entityName="Vendor"
      initialData={[
        { id: 1, reference: 'VEND-001', partner: 'Amazon Web Services EMEA', date: '2026-08-01', amount: 3450.00, status: 'Active' },
        { id: 2, reference: 'VEND-002', partner: 'Office Towers Facility Mgmt', date: '2026-08-15', amount: 15000.00, status: 'Active' },
        { id: 3, reference: 'VEND-003', partner: 'Nile Telecom & Cloud', date: '2026-09-01', amount: 2100.00, status: 'Active' },
        { id: 4, reference: 'VEND-004', partner: 'Dell Technologies Middle East', date: '2026-09-10', amount: 48000.00, status: 'Active' }
      ]}
      emptyDescription="Manage vendor accounts, tax identification numbers, payment terms, and accounts payable balances."
    />
  );
};

export default VendorsListPage;
