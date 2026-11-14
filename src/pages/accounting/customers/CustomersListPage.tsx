import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const CustomersListPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Customers', href: '/accounting/customers/invoices' },
        { label: 'Customers' }
      ]}
      title="Customers Directory"
      badge="Partners"
      entityName="Customer"
      initialData={[
        { id: 1, reference: 'CUST-001', partner: 'Al-Madina Hypermarkets', date: '2026-08-10', amount: 35000.00, status: 'Active' },
        { id: 2, reference: 'CUST-002', partner: 'Delta Engineering LLC', date: '2026-08-20', amount: 8200.00, status: 'Active' },
        { id: 3, reference: 'CUST-003', partner: 'Horizon Logistics Corp', date: '2026-09-05', amount: 22580.00, status: 'Active' },
        { id: 4, reference: 'CUST-004', partner: 'Apex Retailers Group', date: '2026-09-12', amount: 6400.00, status: 'Active' }
      ]}
      emptyDescription="Central customer partner directory with accounts receivable balances, credit terms, and fiscal profiles."
    />
  );
};

export default CustomersListPage;
