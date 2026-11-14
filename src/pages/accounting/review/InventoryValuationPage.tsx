import React from 'react';
import { AccountingPlaceholderView } from '../components/AccountingPlaceholderView';

export const InventoryValuationPage: React.FC = () => {
  return (
    <AccountingPlaceholderView
      breadcrumbs={[
        { label: 'Review', href: '/accounting/review/journal-items' },
        { label: 'Inventory Valuation' }
      ]}
      title="Inventory Valuation"
      badge="Stock Ledger"
      entityName="Valuation Item"
      columns={[
        { key: 'reference', label: 'Item Code & Name' },
        { key: 'partner', label: 'Category / Location' },
        { key: 'date', label: 'Valuation Date' },
        { key: 'quantity', label: 'On Hand Qty', align: 'center', render: r => <span className="font-mono font-bold">{r.quantity || 100}</span> },
        { key: 'unitCost', label: 'Unit Cost', align: 'right', render: r => <span className="font-mono">{r.unitCost || '150.00 LE'}</span> },
        { key: 'amount', label: 'Total Value', align: 'right', render: r => <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{r.amount ? `${r.amount.toLocaleString()} LE` : '0.00 LE'}</span> },
        { key: 'status', label: 'Method' }
      ]}
      initialData={[
        { id: 1, reference: 'POS-X90 Retail Terminal Unit', partner: 'Hardware Products / Main Warehouse', date: '2026-10-01', quantity: 45, unitCost: '2,500.00 LE', amount: 112500.00, status: 'AVCO (Average Cost)' },
        { id: 2, reference: 'Barcode Scanner Handheld Wireless', partner: 'Accessories / Central Hub', date: '2026-10-01', quantity: 120, unitCost: '450.00 LE', amount: 54000.00, status: 'FIFO (First-In First-Out)' },
        { id: 3, reference: 'Thermal Receipt Rolls 80mm (Box 50)', partner: 'Consumables / Buffer Store', date: '2026-10-01', quantity: 300, unitCost: '60.00 LE', amount: 18000.00, status: 'Standard Price' }
      ]}
      emptyDescription="Real-time automated inventory accounting, perpetual valuation entries, and stock reconciliation."
    />
  );
};

export default InventoryValuationPage;
