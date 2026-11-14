import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const AuditTrailPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Review', href: '/accounting/review/journal-items' },
        { label: 'Audit Trail' }
      ]}
      title="Accounting Audit Trail"
      badge="Traceability"
      entityName="Audit Event"
      initialData={[
        { id: 1, reference: 'LOG-8901', partner: 'System Admin posted Customer Invoice INV/2026/0001', date: '2026-10-01 10:24', amount: 'Hash Verified', status: 'Posted' },
        { id: 2, reference: 'LOG-8902', partner: 'Financial Controller validated Vendor Bill BILL/2026/0012', date: '2026-10-02 14:15', amount: 'Hash Verified', status: 'Posted' },
        { id: 3, reference: 'LOG-8903', partner: 'Chief Accountant adjusted Lock Date to 2026-08-31', date: '2026-10-03 09:00', amount: 'Governance', status: 'Active' }
      ]}
      emptyDescription="Immutable audit trail of all posted entries, reconciliation actions, tax alterations, and lock date changes."
    />
  );
};

export default AuditTrailPage;
