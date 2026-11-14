import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const InvoicesPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Customers', href: '/accounting/customers/invoices' },
        { label: 'Invoices' }
      ]}
      title="Customer Invoices"
      badge="Sales"
      entityName="Invoice"
      initialData={[
        { id: 1, reference: 'INV/2026/0001', partner: 'Al-Madina Hypermarkets', date: '2026-09-28', amount: 14500.00, status: 'Posted' },
        { id: 2, reference: 'INV/2026/0002', partner: 'Delta Engineering LLC', date: '2026-09-29', amount: 8200.00, status: 'Paid' },
        { id: 3, reference: 'INV/2026/0003', partner: 'Horizon Logistics Corp', date: '2026-10-01', amount: 22580.00, status: 'Draft' },
        { id: 4, reference: 'INV/2026/0004', partner: 'Apex Retailers Group', date: '2026-10-02', amount: 6400.00, status: 'Posted' }
      ]}
      emptyDescription="Create clean customer tax invoices, record electronic sales, and track settlements."
    />
  );
};

export default InvoicesPage;
