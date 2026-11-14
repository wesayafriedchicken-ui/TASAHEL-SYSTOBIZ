import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const ReturnTypesPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Configuration', href: '/accounting/configuration/settings' },
        { label: 'Return Types' }
      ]}
      title="Return Types & Reason Codes"
      badge="Reversals"
      entityName="Return Type"
      initialData={[
        { id: 1, reference: 'RET-01 Defective Goods Received', partner: 'Restock into Quarantine / Debit Vendor', date: '2026-01-01', amount: 'Reversal Rule', status: 'Active' },
        { id: 2, reference: 'RET-02 Customer Cancellation / Exchange', partner: 'Restock into Sellable Inventory / Credit Customer', date: '2026-01-01', amount: 'Reversal Rule', status: 'Active' },
        { id: 3, reference: 'RET-03 Invoice Pricing Discrepancy', partner: 'Financial Credit Note only (No Physical Movement)', date: '2026-01-01', amount: 'Financial Only', status: 'Active' }
      ]}
      emptyDescription="Standardize return authorization reasons, inventory restock rules, and automatic credit/debit note generation."
    />
  );
};

export default ReturnTypesPage;
