import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const AssetsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Accounting', href: '/accounting/operations/journal-entries' },
        { label: 'Assets' }
      ]}
      title="Fixed Assets"
      badge="Depreciation"
      entityName="Asset"
      initialData={[
        { id: 1, reference: 'AST-001', partner: 'Office Laptops & Workstations', date: '2026-01-15', amount: 120000.00, status: 'Active' },
        { id: 2, reference: 'AST-002', partner: 'Commercial Executive Van', date: '2026-03-20', amount: 450000.00, status: 'Active' },
        { id: 3, reference: 'AST-003', partner: 'Data Center HVAC Unit', date: '2026-06-10', amount: 85000.00, status: 'Active' }
      ]}
      emptyDescription="Manage fixed asset registers, automatic straight-line or declining depreciation schedules, and disposal entries."
    />
  );
};

export default AssetsPage;
