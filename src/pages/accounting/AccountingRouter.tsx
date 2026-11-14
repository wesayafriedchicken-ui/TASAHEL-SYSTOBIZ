import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AccountingLayout from './AccountingLayout';

// Subpage Lazy / Direct Imports
import AccountingDashboardPage from './dashboard/AccountingDashboardPage';

// Customers
import InvoicesPage from './customers/InvoicesPage';
import CreditNotesPage from './customers/CreditNotesPage';
import PaymentsPage from './customers/PaymentsPage';
import ProductsPage from './customers/ProductsPage';
import CustomersListPage from './customers/CustomersListPage';

// Vendors
import BillsPage from './vendors/BillsPage';
import RefundsPage from './vendors/RefundsPage';
import VendorPaymentsPage from './vendors/VendorPaymentsPage';
import VendorProductsPage from './vendors/VendorProductsPage';
import VendorsListPage from './vendors/VendorsListPage';

// Accounting Operations
import JournalEntriesPage from './operations/JournalEntriesPage';
import AssetsPage from './operations/AssetsPage';
import LoansPage from './operations/LoansPage';
import ReconcilePage from './operations/ReconcilePage';
import TaxReturnsPage from './operations/TaxReturnsPage';
import LockDatesPage from './operations/LockDatesPage';

// Review
import JournalItemsPage from './review/JournalItemsPage';
import AuditTrailPage from './review/AuditTrailPage';
import JournalAuditPage from './review/JournalAuditPage';
import WorkingFilesPage from './review/WorkingFilesPage';
import AnnualReportPage from './review/AnnualReportPage';
import InventoryValuationPage from './review/InventoryValuationPage';
import DeferredRevenuesPage from './review/DeferredRevenuesPage';
import DeferredExpensesPage from './review/DeferredExpensesPage';

// Reporting
import ReportingPage from './reporting/ReportingPage';

// Configuration
import SettingsPage from './configuration/SettingsPage';
import OnlinePaymentsPage from './configuration/OnlinePaymentsPage';
import ChartOfAccountsPage from './configuration/ChartOfAccountsPage';
import ChartOfAccountDetailPage from './configuration/ChartOfAccountDetailPage';
import TaxesPage from './configuration/TaxesPage';
import TaxDetailPage from './configuration/TaxDetailPage';
import JournalsPage from './configuration/JournalsPage';
import CurrenciesPage from './configuration/CurrenciesPage';
import FiscalPositionsPage from './configuration/FiscalPositionsPage';
import MultiLedgerPage from './configuration/MultiLedgerPage';
import ChecksPage from './configuration/ChecksPage';
import DepreciationModelsPage from './configuration/DepreciationModelsPage';
import ReturnTypesPage from './configuration/ReturnTypesPage';
import InvoiceRemindersPage from './configuration/InvoiceRemindersPage';
import PaymentTermsPage from './configuration/PaymentTermsPage';
import ProductCategoriesPage from './configuration/ProductCategoriesPage';

export const AccountingRouter: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12 text-xs font-bold text-slate-400">
        Loading Accounting Module...
      </div>
    }>
      <Routes>
        <Route element={<AccountingLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AccountingDashboardPage />} />

          {/* Customers (Dropdown sub-routes) */}
          <Route path="customers">
            <Route index element={<Navigate to="invoices" replace />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="credit-notes" element={<CreditNotesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="list" element={<CustomersListPage />} />
          </Route>

          {/* Vendors (Dropdown sub-routes) */}
          <Route path="vendors">
            <Route index element={<Navigate to="bills" replace />} />
            <Route path="bills" element={<BillsPage />} />
            <Route path="refunds" element={<RefundsPage />} />
            <Route path="payments" element={<VendorPaymentsPage />} />
            <Route path="products" element={<VendorProductsPage />} />
            <Route path="list" element={<VendorsListPage />} />
          </Route>

          {/* Accounting Operations (Dropdown sub-routes) */}
          <Route path="operations">
            <Route index element={<Navigate to="journal-entries" replace />} />
            <Route path="journal-entries" element={<JournalEntriesPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="loans" element={<LoansPage />} />
            <Route path="reconcile" element={<ReconcilePage />} />
            <Route path="tax-returns" element={<TaxReturnsPage />} />
            <Route path="lock-dates" element={<LockDatesPage />} />
          </Route>

          {/* Review (Dropdown sub-routes) */}
          <Route path="review">
            <Route index element={<Navigate to="journal-items" replace />} />
            <Route path="journal-items" element={<JournalItemsPage />} />
            <Route path="audit-trail" element={<AuditTrailPage />} />
            <Route path="journal-audit" element={<JournalAuditPage />} />
            <Route path="working-files" element={<WorkingFilesPage />} />
            <Route path="annual-report" element={<AnnualReportPage />} />
            <Route path="inventory-valuation" element={<InventoryValuationPage />} />
            <Route path="deferred-revenues" element={<DeferredRevenuesPage />} />
            <Route path="deferred-expenses" element={<DeferredExpensesPage />} />
          </Route>

          {/* Reporting (Direct sub-route) */}
          <Route path="reporting" element={<ReportingPage />} />

          {/* Configuration (Dropdown sub-routes) */}
          <Route path="configuration">
            <Route index element={<Navigate to="settings" replace />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="online-payments" element={<OnlinePaymentsPage />} />
            <Route path="chart-of-accounts" element={<ChartOfAccountsPage />} />
            <Route path="chart-of-accounts/new" element={<ChartOfAccountDetailPage />} />
            <Route path="chart-of-accounts/:id" element={<ChartOfAccountDetailPage />} />
            <Route path="taxes" element={<TaxesPage />} />
            <Route path="taxes/new" element={<TaxDetailPage />} />
            <Route path="taxes/:id" element={<TaxDetailPage />} />
            <Route path="journals" element={<JournalsPage />} />
            <Route path="currencies" element={<CurrenciesPage />} />
            <Route path="fiscal-positions" element={<FiscalPositionsPage />} />
            <Route path="multi-ledger" element={<MultiLedgerPage />} />
            <Route path="checks" element={<ChecksPage />} />
            <Route path="depreciation-models" element={<DepreciationModelsPage />} />
            <Route path="return-types" element={<ReturnTypesPage />} />
            <Route path="invoice-reminders" element={<InvoiceRemindersPage />} />
            <Route path="payment-terms" element={<PaymentTermsPage />} />
            <Route path="product-categories" element={<ProductCategoriesPage />} />
          </Route>

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AccountingRouter;
