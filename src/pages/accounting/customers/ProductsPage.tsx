import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const ProductsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Customers', href: '/accounting/customers/invoices' },
        { label: 'Products' }
      ]}
      title="Sales Products & Services"
      badge="Catalog"
      entityName="Product"
      initialData={[
        { id: 1, reference: 'PROD-001', partner: 'Enterprise Consulting Hours', date: '2026-09-01', amount: 1500.00, status: 'Active' },
        { id: 2, reference: 'PROD-002', partner: 'SaaS Platform License Tier 1', date: '2026-09-01', amount: 4900.00, status: 'Active' },
        { id: 3, reference: 'PROD-003', partner: 'Hardware Terminal POS-X90', date: '2026-09-15', amount: 12500.00, status: 'Active' }
      ]}
      emptyDescription="Manage sellable items, services, accounting income accounts, and default customer tax rates."
    />
  );
};

export default ProductsPage;
