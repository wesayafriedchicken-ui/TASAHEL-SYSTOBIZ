import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const MultiLedgerPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Configuration', href: '/accounting/configuration/settings' },
        { label: 'Multi-Ledger' }
      ]}
      title="Multi-Ledger & Parallel Accounting"
      badge="Multi-GAAP"
      entityName="Ledger Book"
      initialData={[
        { id: 1, reference: 'LEDGER-01 Local Statutory Accounting', partner: 'Egyptian Accounting Standards (EAS / Tax Book)', date: '2026-01-01', amount: 'Primary Ledger', status: 'Active' },
        { id: 2, reference: 'LEDGER-02 International IFRS Group Book', partner: 'IFRS Standards for Foreign Investors & Board Reports', date: '2026-01-01', amount: 'Secondary Ledger', status: 'Active' },
        { id: 3, reference: 'LEDGER-03 Management Cost Accounting', partner: 'Internal Activity-Based Costing (ABC Model)', date: '2026-01-01', amount: 'Analytical Ledger', status: 'Active' }
      ]}
      emptyDescription="Parallel accounting books enabling simultaneous compliance with local statutory law and international IFRS/US GAAP."
    />
  );
};

export default MultiLedgerPage;
