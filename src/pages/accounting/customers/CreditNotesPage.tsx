import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const CreditNotesPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Customers', href: '/accounting/customers/invoices' },
        { label: 'Credit Notes' }
      ]}
      title="Credit Notes"
      badge="Refunds"
      entityName="Credit Note"
      initialData={[
        { id: 1, reference: 'RINV/2026/0001', partner: 'Al-Madina Hypermarkets', date: '2026-09-30', amount: 1200.00, status: 'Posted' },
        { id: 2, reference: 'RINV/2026/0002', partner: 'Horizon Logistics Corp', date: '2026-10-02', amount: 450.00, status: 'Draft' }
      ]}
      emptyDescription="Issue credit notes for returns, discounts, or bill adjustments with automatic ledger postings."
    />
  );
};

export default CreditNotesPage;
