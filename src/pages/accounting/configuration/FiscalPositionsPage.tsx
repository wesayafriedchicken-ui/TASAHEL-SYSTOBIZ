import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const FiscalPositionsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Configuration', href: '/accounting/configuration/settings' },
        { label: 'Fiscal Positions' }
      ]}
      title="Fiscal Positions (Tax Mapping)"
      badge="Jurisdictions"
      entityName="Fiscal Position"
      initialData={[
        { id: 1, reference: 'Domestic Standard Commercial', partner: 'Standard Local Companies (14% VAT)', date: '2026-01-01', amount: 'Default Rule', status: 'Active' },
        { id: 2, reference: 'Export Outside Egypt (Tax Exempt)', partner: 'Maps 14% VAT → 0% Zero-Rated Export', date: '2026-01-01', amount: 'Auto-Trigger', status: 'Active' },
        { id: 3, reference: 'Free Zone Investment Projects', partner: 'Maps all input/output taxes to 0% Free Zone Exemption', date: '2026-01-01', amount: 'Special Treaty', status: 'Active' }
      ]}
      emptyDescription="Map taxes and accounts automatically based on customer delivery region, country, or tax exemption certificate."
    />
  );
};

export default FiscalPositionsPage;
