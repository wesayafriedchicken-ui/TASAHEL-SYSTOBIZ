import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const JournalItemsPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Review', href: '/accounting/review/journal-items' },
        { label: 'Journal Items' }
      ]}
      title="Journal Items"
      badge="General Ledger"
      entityName="Journal Item"
      columns={[
        { key: 'date', label: 'Date' },
        { key: 'journal', label: 'Journal' },
        { key: 'account', label: 'Account Code & Title' },
        { key: 'partner', label: 'Partner' },
        { key: 'label', label: 'Label / Memo' },
        { key: 'debit', label: 'Debit', align: 'right', render: r => <span className="font-mono">{r.debit ? `${r.debit.toLocaleString()} LE` : '—'}</span> },
        { key: 'credit', label: 'Credit', align: 'right', render: r => <span className="font-mono">{r.credit ? `${r.credit.toLocaleString()} LE` : '—'}</span> },
        { key: 'matching', label: 'Matching', align: 'center', render: r => <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{r.matching || 'A1'}</span> }
      ]}
      initialData={[
        { id: 1, date: '2026-10-01', journal: 'Customer Invoices', account: '400000 Product Sales', partner: 'Al-Madina Hypermarkets', label: 'INV/2026/0001', debit: 0, credit: 14500, matching: 'A1' },
        { id: 2, date: '2026-10-01', journal: 'Customer Invoices', account: '120000 Accounts Receivable', partner: 'Al-Madina Hypermarkets', label: 'INV/2026/0001', debit: 14500, credit: 0, matching: 'A1' },
        { id: 3, date: '2026-10-02', journal: 'Vendor Bills', account: '220000 Accounts Payable', partner: 'Amazon Web Services', label: 'BILL/2026/0012', debit: 3450, credit: 0, matching: 'B4' },
        { id: 4, date: '2026-10-02', journal: 'Vendor Bills', account: '600100 Cloud Infrastructure', partner: 'Amazon Web Services', label: 'BILL/2026/0012', debit: 0, credit: 3450, matching: 'B4' }
      ]}
      emptyDescription="Atomic double-entry ledger items across all journals with debit/credit balance audit."
    />
  );
};

export default JournalItemsPage;
