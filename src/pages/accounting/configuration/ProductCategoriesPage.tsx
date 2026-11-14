import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const ProductCategoriesPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Configuration', href: '/accounting/configuration/settings' },
        { label: 'Product Categories' }
      ]}
      title="Product Categories & Account Mapping"
      badge="Account Automation"
      entityName="Category"
      columns={[
        { key: 'reference', label: 'Category Name' },
        { key: 'incomeAccount', label: 'Default Income Account', render: r => <span className="font-mono text-xs">{r.incomeAccount || '400000 Product Sales'}</span> },
        { key: 'expenseAccount', label: 'Default Expense Account', render: r => <span className="font-mono text-xs">{r.expenseAccount || '500000 COGS'}</span> },
        { key: 'costing', label: 'Costing Method', align: 'center', render: r => <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{r.costing || 'AVCO'}</span> },
        { key: 'status', label: 'Status' }
      ]}
      initialData={[
        { id: 1, reference: 'All / Software & Digital Licenses', incomeAccount: '401000 Software License Revenue', expenseAccount: '500100 Third-Party Royalty Costs', costing: 'Standard Price', status: 'Active' },
        { id: 2, reference: 'All / POS & Hardware Terminals', incomeAccount: '400000 Physical Goods Sales', expenseAccount: '500000 Cost of Goods Sold', costing: 'AVCO (Average Cost)', status: 'Active' },
        { id: 3, reference: 'All / Professional Consulting Services', incomeAccount: '402000 Consulting & Advisory', expenseAccount: '600100 Subcontractor Expenses', costing: 'Standard Price', status: 'Active' },
        { id: 4, reference: 'All / Office & Internal Consumables', incomeAccount: '409000 Other Operating Income', expenseAccount: '600300 General Office Supplies', costing: 'FIFO', status: 'Active' }
      ]}
      emptyDescription="Map product categories directly to automatic GL income, expense, inventory valuation, and input/output stock accounts."
    />
  );
};

export default ProductCategoriesPage;
