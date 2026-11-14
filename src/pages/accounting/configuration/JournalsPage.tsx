import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const JournalsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Configuration', href: '/accounting/configuration/settings' },
        { label: 'Journals' }
      ]}
      title="Accounting Journals"
      badge="Registers"
      entityName="Journal"
      columns={[
        { key: 'reference', label: 'Journal Name & Code' },
        { key: 'type', label: 'Type' },
        { key: 'account', label: 'Default Account' },
        { key: 'currency', label: 'Currency', align: 'center' },
        { key: 'status', label: 'Status' }
      ]}
      initialData={[
        { id: 1, reference: 'Customer Invoices (INV)', type: 'Sales', account: '400000 Product Sales', currency: 'EGP', status: 'Active' },
        { id: 2, reference: 'Vendor Bills (BILL)', type: 'Purchase', account: '220000 Accounts Payable', currency: 'EGP', status: 'Active' },
        { id: 3, reference: 'National Bank Account (BNK1)', type: 'Bank', account: '101000 Cash at Bank (NBE)', currency: 'EGP', status: 'Active' },
        { id: 4, reference: 'Main Cash Register (CSH1)', type: 'Cash', account: '102000 Petty Cash Safe', currency: 'EGP', status: 'Active' },
        { id: 5, reference: 'Miscellaneous Operations (MISC)', type: 'General', account: 'Various Accounts', currency: 'EGP', status: 'Active' },
        { id: 6, reference: 'Exchange Difference (EXCH)', type: 'General', account: '600800 Foreign Currency Loss/Gain', currency: 'USD', status: 'Active' }
      ]}
      emptyDescription="Manage discrete journals for sales, purchases, bank accounts, cash registers, and general entries."
    />
  );
};

export default JournalsPage;
