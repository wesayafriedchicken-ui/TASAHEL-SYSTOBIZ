import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const VendorProductsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Vendors', href: '/accounting/vendors/bills' },
        { label: 'Products' }
      ]}
      title="Purchasable Products & Supplies"
      badge="Supplies"
      entityName="Product"
      initialData={[
        { id: 1, reference: 'VPROD-101', partner: 'Server Hosting & Dedicated VPS', date: '2026-09-01', amount: 3450.00, status: 'Active' },
        { id: 2, reference: 'VPROD-102', partner: 'Commercial Electricity & Power', date: '2026-09-01', amount: 4800.00, status: 'Active' },
        { id: 3, reference: 'VPROD-103', partner: 'Office Cleaning & Hospitality Supplies', date: '2026-09-10', amount: 1200.00, status: 'Active' }
      ]}
      emptyDescription="Manage supplier purchase catalog, inventory valuation accounts, and default vendor expense rules."
    />
  );
};

export default VendorProductsPage;
