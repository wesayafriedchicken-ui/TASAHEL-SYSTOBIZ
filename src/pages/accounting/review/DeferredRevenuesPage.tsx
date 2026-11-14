import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const DeferredRevenuesPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Review', href: '/accounting/review/journal-items' },
        { label: 'Deferred Revenues' }
      ]}
      title="Deferred Revenues (Unearned Revenue)"
      badge="Regularization"
      entityName="Revenue Schedule"
      initialData={[
        { id: 1, reference: 'DEF-REV-2026-01', partner: 'Delta Engineering LLC (12-Month Support Contract)', date: '2026-09-01', amount: 120000.00, status: 'Active' },
        { id: 2, reference: 'DEF-REV-2026-02', partner: 'Al-Madina Hypermarkets (Annual Cloud License)', date: '2026-09-15', amount: 48000.00, status: 'Active' }
      ]}
      emptyDescription="Manage unearned revenue recognition models, monthly amortization entries, and accrual cut-offs."
    />
  );
};

export default DeferredRevenuesPage;
