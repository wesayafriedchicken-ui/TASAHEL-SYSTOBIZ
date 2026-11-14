import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const DepreciationModelsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Configuration', href: '/accounting/configuration/settings' },
        { label: 'Depreciation Models' }
      ]}
      title="Asset Depreciation Models"
      badge="Amortization"
      entityName="Depreciation Model"
      initialData={[
        { id: 1, reference: 'DEP-COMP: IT Equipment & Laptops', partner: 'Straight Line · 36 Months (3 Years)', date: '2026-01-01', amount: '33.33% / Year', status: 'Active' },
        { id: 2, reference: 'DEP-VEH: Commercial Fleet Vehicles', partner: 'Declining Balance · 60 Months (5 Years)', date: '2026-01-01', amount: '20.00% / Year', status: 'Active' },
        { id: 3, reference: 'DEP-FURN: Office Furniture & Fixtures', partner: 'Straight Line · 120 Months (10 Years)', date: '2026-01-01', amount: '10.00% / Year', status: 'Active' }
      ]}
      emptyDescription="Standardize depreciation rules, computation formulas, prorata temporis methods, and GL expense mapping."
    />
  );
};

export default DepreciationModelsPage;
