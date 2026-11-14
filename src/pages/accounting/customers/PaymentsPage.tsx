import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const PaymentsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Customers', href: '/accounting/customers/invoices' },
        { label: 'Payments' }
      ]}
      title="Customer Payments"
      badge="Receipts"
      entityName="Payment"
      initialData={[
        { id: 1, reference: 'PAY/2026/0101', partner: 'Delta Engineering LLC', date: '2026-09-29', amount: 8200.00, status: 'Posted' },
        { id: 2, reference: 'PAY/2026/0102', partner: 'Al-Madina Hypermarkets', date: '2026-10-01', amount: 10000.00, status: 'Posted' }
      ]}
      emptyDescription="Register customer incoming receipts, reconcile open invoices, and allocate bank transactions."
    />
  );
};

export default PaymentsPage;
