import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const ChecksPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Configuration', href: '/accounting/configuration/settings' },
        { label: 'Checks' }
      ]}
      title="Checks & Post-Dated Check Registers"
      badge="Treasury"
      entityName="Check Layout"
      columns={[
        { key: 'reference', label: 'Check Layout / Book' },
        { key: 'partner', label: 'Bank Account' },
        { key: 'range', label: 'Check Serial Range', align: 'center', render: r => <span className="font-mono">{r.range || '10001 - 10100'}</span> },
        { key: 'status', label: 'Status' }
      ]}
      initialData={[
        { id: 1, reference: 'NBE Corporate Checkbook Series 2026-A', partner: 'National Bank of Egypt (EGP Account)', range: '005401 - 005500', status: 'Active' },
        { id: 2, reference: 'CIB Commercial Checkbook Series 2026-B', partner: 'Commercial International Bank (USD Account)', range: '001201 - 001300', status: 'Active' }
      ]}
      emptyDescription="Configure check printing formats, serial ranges, post-dated check (PDC) portfolios, and collection workflows."
    />
  );
};

export default ChecksPage;
