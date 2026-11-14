import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const DeferredExpensesPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Review', href: '/accounting/review/journal-items' },
        { label: 'Deferred Expenses' }
      ]}
      title="Deferred Expenses (Prepaid Expenses)"
      badge="Prepayments"
      entityName="Expense Schedule"
      initialData={[
        { id: 1, reference: 'DEF-EXP-2026-01', partner: 'Commercial Headquarters Annual Office Rent', date: '2026-01-01', amount: 180000.00, status: 'Active' },
        { id: 2, reference: 'DEF-EXP-2026-02', partner: 'Corporate Health & Life Insurance Policy', date: '2026-04-01', amount: 64000.00, status: 'Active' }
      ]}
      emptyDescription="Track prepaid expenses, amortization periods, recurring deferred entries, and balance sheet recognition."
    />
  );
};

export default DeferredExpensesPage;
