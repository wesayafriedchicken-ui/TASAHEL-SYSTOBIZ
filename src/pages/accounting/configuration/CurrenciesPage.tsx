import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const CurrenciesPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Configuration', href: '/accounting/configuration/settings' },
        { label: 'Currencies' }
      ]}
      title="Multi-Currency & Exchange Rates"
      badge="FX"
      entityName="Currency"
      columns={[
        { key: 'reference', label: 'Currency Code & Name' },
        { key: 'symbol', label: 'Symbol', align: 'center', render: r => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{r.symbol || '$'}</span> },
        { key: 'rate', label: 'Current Conversion Rate', align: 'right', render: r => <span className="font-mono font-bold">{r.rate || '1.000'}</span> },
        { key: 'date', label: 'Last Rate Update' },
        { key: 'status', label: 'Status' }
      ]}
      initialData={[
        { id: 1, reference: 'EGP - Egyptian Pound', symbol: 'LE', rate: '1.00000 (Base)', date: '2026-10-04', status: 'Base Currency' },
        { id: 2, reference: 'USD - United States Dollar', symbol: '$', rate: '48.65000', date: '2026-10-04', status: 'Active' },
        { id: 3, reference: 'EUR - European Euro', symbol: '€', rate: '53.20000', date: '2026-10-04', status: 'Active' },
        { id: 4, reference: 'SAR - Saudi Riyal', symbol: 'SR', rate: '12.97000', date: '2026-10-04', status: 'Active' },
        { id: 5, reference: 'AED - United Arab Emirates Dirham', symbol: 'AED', rate: '13.25000', date: '2026-10-04', status: 'Active' }
      ]}
      emptyDescription="Manage foreign currency revaluation, automatic daily central bank exchange rates, and gain/loss accounts."
    />
  );
};

export default CurrenciesPage;
