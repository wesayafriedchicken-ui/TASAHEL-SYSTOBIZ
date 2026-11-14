import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const VendorPaymentsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Vendors', href: '/accounting/vendors/bills' },
        { label: 'Payments' }
      ]}
      title="Vendor Payments"
      badge="Disbursements"
      entityName="Payment"
      initialData={[
        { id: 1, reference: 'VPAY/2026/0501', partner: 'Office Towers Facility Mgmt', date: '2026-09-29', amount: 15000.00, status: 'Posted' },
        { id: 2, reference: 'VPAY/2026/0502', partner: 'Amazon Web Services EMEA', date: '2026-10-01', amount: 3450.00, status: 'Posted' }
      ]}
      emptyDescription="Track outgoing supplier disbursements, check payments, bank transfers, and remittance advices."
    />
  );
};

export default VendorPaymentsPage;
