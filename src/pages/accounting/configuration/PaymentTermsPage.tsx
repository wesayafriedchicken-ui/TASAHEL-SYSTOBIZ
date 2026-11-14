import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const PaymentTermsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Configuration', href: '/accounting/configuration/settings' },
        { label: 'Payment Terms' }
      ]}
      title="Payment Terms"
      badge="Credit Rules"
      entityName="Payment Term"
      initialData={[
        { id: 1, reference: 'Immediate Payment (Due Upon Receipt)', partner: 'Due immediately upon issuance (0 Days)', date: '2026-01-01', amount: 'Net 0', status: 'Active' },
        { id: 2, reference: 'Net 15 Days', partner: 'Due 15 days from invoice issuance date', date: '2026-01-01', amount: 'Net 15', status: 'Active' },
        { id: 3, reference: 'Net 30 Days', partner: 'Due 30 days from invoice issuance date', date: '2026-01-01', amount: 'Net 30', status: 'Active' },
        { id: 4, reference: '30% Advance, Balance on Delivery', partner: 'Two-stage installment split (30% / 70%)', date: '2026-01-01', amount: 'Milestone', status: 'Active' },
        { id: 5, reference: 'End of Following Month (EOM)', partner: 'Due at the end of the month following the invoice month', date: '2026-01-01', amount: 'EOM', status: 'Active' }
      ]}
      emptyDescription="Define customer and vendor credit periods, early payment cash discounts, and milestone payment schedules."
    />
  );
};

export default PaymentTermsPage;
