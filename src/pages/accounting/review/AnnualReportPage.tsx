import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const AnnualReportPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Review', href: '/accounting/review/journal-items' },
        { label: 'Annual Report' }
      ]}
      title="Annual Financial Report Compilation"
      badge="Year-End"
      entityName="Report Binder"
      initialData={[
        { id: 1, reference: 'AR-2025-FINAL', partner: 'Audited Financial Statements FY2025 (Bilingual)', date: '2026-03-31', amount: 'Board Approved', status: 'Posted' },
        { id: 2, reference: 'AR-2026-DRAFT', partner: 'Executive Interim Year-to-Date Compilation FY2026', date: '2026-10-01', amount: 'In Review', status: 'Draft' }
      ]}
      emptyDescription="Compile annual IFRS/GAAP statements, board disclosures, cash flow statements, and notes to accounts."
    />
  );
};

export default AnnualReportPage;
