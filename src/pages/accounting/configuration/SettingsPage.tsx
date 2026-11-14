import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, RotateCcw, Search, CheckCircle2, HelpCircle, 
  ArrowRight, ExternalLink, Download, FileText, Check, X
} from 'lucide-react';
import { AccountingPageHeader } from '../components/AccountingPageHeader';
import { cn } from '../../../lib/utils';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial State initialized from localStorage or defaults
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('acct_configuration_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return {
      // 1. Initial Setup
      fiscalLocalization: 'Egypt',
      accountingImport: 'manual',

      // 2. Taxes
      salesTax: '14%',
      purchaseTax: '14%',
      pricesTaxIncluded: false, // Tax Excluded by default
      taxPeriodicity: 'Monthly',
      taxDeadlineDays: '7',
      taxReturnJournal: 'Tax Returns',
      roundingMethod: 'line', // 'tax' | 'line'
      verifyVatNumbers: false,
      cashBasis: true,
      taxCashBasisJournal: 'Cash Basis Taxes',
      baseTaxReceivedAccount: '210802 Base Tax Received',
      fiscalCountry: 'Egypt',

      // 3. Currencies
      mainCurrency: 'EGP',

      // 4. Customer Invoices
      snailmail: false,
      customerAddresses: false,
      totalRounding: false,
      defaultIncoterm: '',
      saleReceipt: false,
      defaultTerms: false,
      salesCreditLimit: false,
      totalAmountWords: false,
      taxesInCompanyCurrency: true,
      authorizedSignatory: false,
      automaticInvoiceReminders: false,

      // 5. Units & Packagings
      unitsOfMeasure: false,

      // 6. Customer Payments
      invoiceOnlinePayment: true,
      addQrCodePdf: false,
      batchPayments: false,
      paymentQrCodes: false,

      // 7. Vendor Bills
      autoValidateBills: true,

      // 8. Vendor Payments
      checks: false,
      sepaCreditTransfer: false,

      // 9. Digitization
      documentDigitization: true,
      digitizeCustomerInvoices: 'on_demand', // 'none' | 'on_demand' | 'auto'
      digitizeVendorBills: 'auto',
      digitizeBankStatements: 'auto',
      digitizeLoans: 'auto',
      singleInvoiceLinePerTax: true,

      // 10. Default Accounts
      bankSuspenseAccount: '160103 Bank Suspense',
      internalTransferAccount: '160700 Funds in Transit',
      deferredExpenseJournal: 'Miscellaneous Operations',
      deferredExpenseAccount: '131300 Other Prepayments',
      deferredExpenseGenerate: 'On bill validation',
      deferredExpensePeriodicity: 'Monthly',
      deferredExpenseComputation: 'By Months',
      deferredRevenueJournal: 'Miscellaneous Operations',
      deferredRevenueAccount: '230100 Deferred Income',
      deferredRevenueGenerate: 'On invoice validation',
      deferredRevenuePeriodicity: 'Monthly',
      deferredRevenueComputation: 'By Months',
      discountCustomerInvoices: 'Same Account as product',
      discountVendorBills: 'Same Account as product',
      earlyDiscountGain: '510400 Cash Discount Gain',
      earlyDiscountLoss: '430800 Cash Discount Loss',
      incomeAccount: '500100 Sales Account',
      expenseAccount: '424800 Other Expenses',
      withholdingTaxBase: '',

      // 11. Inventory Valuation
      inventoryValuation: 'Periodic (at closing)',
      inventoryCostMethod: 'Standard Price',
      periodicValuation: 'Manual',
      stockValuationAccount: '120100 Inventory - Raw Materials',
      inventoryJournal: 'Inventory Valuation',

      // 12. Bank & Cash
      qifImport: false,
      enableAutoTransfer: false,

      // 13. Fiscal Periods
      fiscalYearMonth: 'December',
      fiscalYearDay: '31',
      invoicingSwitchThreshold: '',
      fiscalYearsFlexible: false,

      // 14. Analytics
      analyticAccounting: false,
      budgetManagement: false,
      marginAnalysis: false,

      // 15. Reporting
      restrictiveAuditTrail: false,
      addTotalsBelowSections: false,
      negativeAmountDisplay: '-100',

      // 16. Accounting Firms mode
      quickEncoding: false,
      documentSequenceEditable: false,
      reviewData: false
    };
  });

  const updateSetting = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('acct_configuration_settings', JSON.stringify(settings));
      setToastMessage('Accounting configuration settings saved successfully.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (e) {
      setToastMessage('Error saving settings.');
    }
  };

  const handleDiscard = () => {
    try {
      const saved = localStorage.getItem('acct_configuration_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
      setToastMessage('Changes reverted to saved configuration.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (e) {
      // noop
    }
  };

  // Helper for quick search highlight / filter
  const matchesSearch = (text: string) => {
    if (!searchTerm.trim()) return true;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header with Breadcrumbs */}
      <AccountingPageHeader
        breadcrumbs={[
          { label: 'Configuration', href: '/accounting/configuration/settings' },
          { label: 'Settings' }
        ]}
        title="Settings"
        badge="Enterprise Fiscal 2026"
        primaryAction={{
          label: 'Save Changes',
          onClick: handleSave,
          icon: <Save className="w-4 h-4" />
        }}
        secondaryAction={{
          label: 'Discard',
          onClick: handleDiscard,
          icon: <RotateCcw className="w-3.5 h-3.5" />
        }}
        extraActions={
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in settings..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 w-44 md:w-56"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        }
      />

      {/* Main Settings Sections */}
      <div className="flex-1 w-full pb-16 space-y-0 text-xs">

        {/* 1. INITIAL SETUP */}
        {(matchesSearch('initial setup') || matchesSearch('fiscal localization') || matchesSearch('accounting import')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Initial Setup
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              {/* Fiscal Localization */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                  <span>Fiscal Localization</span>
                  <span title="Legal accounting package">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 cursor-pointer" />
                  </span>
                </div>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 leading-relaxed">
                  Taxes, fiscal positions, chart of accounts & legal statements for your country
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 border-b border-slate-300 dark:border-slate-700 pb-1 max-w-sm">
                    <span className="text-sm">🇪🇬</span>
                    <select
                      value={settings.fiscalLocalization}
                      onChange={(e) => updateSetting('fiscalLocalization', e.target.value)}
                      className="bg-transparent font-medium text-slate-900 dark:text-slate-100 outline-none flex-1 cursor-pointer"
                    >
                      <option value="Egypt">Egypt</option>
                      <option value="Saudi Arabia">Saudi Arabia (ZATCA)</option>
                      <option value="UAE">United Arab Emirates (FTA)</option>
                      <option value="Generic">Generic Chart of Accounts</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Accounting import */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white">
                  Accounting import
                </div>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 leading-relaxed">
                  Choose how you want to setup your CoA
                </div>
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => navigate('/accounting/configuration/chart-of-accounts')}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Review Manually</span>
                    </button>
                    <span className="text-slate-400">(end of year balances)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.csv, .xlsx';
                        input.onchange = (ev: any) => {
                          const file = ev.target?.files?.[0];
                          if (file) {
                            setToastMessage(`CoA import template "${file.name}" uploaded successfully.`);
                            setTimeout(() => setToastMessage(null), 3500);
                          }
                        };
                        input.click();
                      }}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Import</span>
                    </button>
                    <span className="text-slate-400">(for full history)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TAXES */}
        {(matchesSearch('taxes') || matchesSearch('default taxes') || matchesSearch('rounding method') || matchesSearch('cash basis')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Taxes
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              {/* Default Taxes */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                    <span>Default Taxes</span>
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 cursor-pointer" />
                  </div>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400">
                    Default taxes applied when creating new products.
                  </div>
                </div>

                <div className="space-y-2 pt-1 pl-3">
                  <div className="flex items-center justify-between max-w-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Sales Tax</span>
                    <div className="flex items-center gap-1.5">
                      <select 
                        value={settings.salesTax}
                        onChange={(e) => updateSetting('salesTax', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer"
                      >
                        <option value="14%">14%</option>
                        <option value="0%">0%</option>
                        <option value="5%">5%</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => navigate('/accounting/configuration/taxes')}
                        className="text-slate-400 hover:text-emerald-600"
                        title="Edit tax"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between max-w-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Purchase Tax</span>
                    <div className="flex items-center gap-1.5">
                      <select 
                        value={settings.purchaseTax}
                        onChange={(e) => updateSetting('purchaseTax', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer"
                      >
                        <option value="14%">14%</option>
                        <option value="0%">0%</option>
                        <option value="1%">1% WHT</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => navigate('/accounting/configuration/taxes')}
                        className="text-slate-400 hover:text-emerald-600"
                        title="Edit tax"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium w-16">Prices</span>
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pricesTax"
                          checked={settings.pricesTaxIncluded}
                          onChange={() => updateSetting('pricesTaxIncluded', true)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Tax Included</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="pricesTax"
                          checked={!settings.pricesTaxIncluded}
                          onChange={() => updateSetting('pricesTaxIncluded', false)}
                          className="text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Tax Excluded</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Return Periodicity */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                    <span>Tax Return Periodicity</span>
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 cursor-pointer" />
                  </div>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400">
                    How often tax returns have to be made
                  </div>
                </div>

                <div className="space-y-2 pt-1 pl-3 max-w-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Periodicity</span>
                    <select
                      value={settings.taxPeriodicity}
                      onChange={(e) => updateSetting('taxPeriodicity', e.target.value)}
                      className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Deadline</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={settings.taxDeadlineDays}
                        onChange={(e) => updateSetting('taxDeadlineDays', e.target.value)}
                        className="w-12 text-center border-b border-slate-300 dark:border-slate-700 pb-0.5 font-bold outline-none bg-transparent"
                      />
                      <span className="text-slate-500 text-[11px]">days after period</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Journal</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={settings.taxReturnJournal}
                        onChange={(e) => updateSetting('taxReturnJournal', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer"
                      >
                        <option value="Tax Returns">Tax Returns</option>
                        <option value="General Operations">General Operations</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => navigate('/accounting/configuration/journals')}
                        className="text-slate-400 hover:text-emerald-600"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('/accounting/operations/tax-returns')}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Configure your tax returns</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Rounding Method */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">
                  Rounding Method
                </div>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400">
                  How total tax amount is computed in orders and invoices
                </div>
                <div className="pl-3 pt-1 space-y-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="roundingMethod"
                      checked={settings.roundingMethod === 'tax'}
                      onChange={() => updateSetting('roundingMethod', 'tax')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Round per Tax</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="roundingMethod"
                      checked={settings.roundingMethod === 'line'}
                      onChange={() => updateSetting('roundingMethod', 'line')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Round per Line</span>
                  </label>
                </div>
              </div>

              {/* Verify VAT Numbers */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.verifyVatNumbers}
                    onChange={(e) => updateSetting('verifyVatNumbers', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Verify VAT Numbers</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Verify VAT numbers using the European VIES service
                </div>
              </div>

              {/* Cash Basis */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.cashBasis}
                    onChange={(e) => updateSetting('cashBasis', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Cash Basis</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Allow to configure taxes using cash basis
                </div>

                {settings.cashBasis && (
                  <div className="pl-4 pt-2 space-y-2.5 max-w-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Tax Cash Basis Journal</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.taxCashBasisJournal}
                          onChange={(e) => updateSetting('taxCashBasisJournal', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer"
                        >
                          <option value="Cash Basis Taxes">Cash Basis Taxes</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Base Tax Received Account</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.baseTaxReceivedAccount}
                          onChange={(e) => updateSetting('baseTaxReceivedAccount', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer max-w-[150px] truncate"
                        >
                          <option value="210802 Base Tax Received">210802 Base Tax Rec...</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fiscal Country */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white">
                  Fiscal Country
                </div>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400">
                  Domestic country of your accounting
                </div>
                <div className="pt-1.5 pl-3">
                  <select
                    value={settings.fiscalCountry}
                    onChange={(e) => updateSetting('fiscalCountry', e.target.value)}
                    className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer"
                  >
                    <option value="Egypt">Egypt</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="UAE">United Arab Emirates</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. CURRENCIES */}
        {(matchesSearch('currencies') || matchesSearch('main currency')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Currencies
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                  <span>Main Currency</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400">
                  Main currency of your company
                </div>
                <div className="pt-2 pl-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Currency</span>
                    <select
                      value={settings.mainCurrency}
                      onChange={(e) => updateSetting('mainCurrency', e.target.value)}
                      className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer"
                    >
                      <option value="EGP">EGP</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="SAR">SAR</option>
                    </select>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => navigate('/accounting/configuration/currencies')}
                      className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Currencies</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CUSTOMER INVOICES */}
        {(matchesSearch('customer invoices') || matchesSearch('snailmail') || matchesSearch('credit limit') || matchesSearch('terms')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Customer Invoices
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              {/* Snailmail */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.snailmail}
                    onChange={(e) => updateSetting('snailmail', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Snailmail</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Send invoices and payment reminders by post
                </div>
              </div>

              {/* Customer Addresses */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.customerAddresses}
                    onChange={(e) => updateSetting('customerAddresses', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Customer Addresses</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Select specific invoice and delivery addresses
                </div>
              </div>

              {/* Total Rounding */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.totalRounding}
                    onChange={(e) => updateSetting('totalRounding', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Total Rounding</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Apply rounding to the total amount of a sales invoice.
                </div>
              </div>

              {/* Default Incoterm */}
              <div className="space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">
                  Default Incoterm
                </div>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400">
                  Default Incoterm of your company
                </div>
                <div className="pt-1.5 pl-3">
                  <select
                    value={settings.defaultIncoterm}
                    onChange={(e) => updateSetting('defaultIncoterm', e.target.value)}
                    className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48"
                  >
                    <option value="">Select Incoterm...</option>
                    <option value="EXW">EXW - Ex Works</option>
                    <option value="FOB">FOB - Free on Board</option>
                    <option value="CIF">CIF - Cost, Insurance and Freight</option>
                  </select>
                </div>
              </div>

              {/* Sale Receipt */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.saleReceipt}
                    onChange={(e) => updateSetting('saleReceipt', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sale Receipt</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Activate to create sale receipt
                </div>
              </div>

              {/* Default Terms & Conditions */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.defaultTerms}
                    onChange={(e) => updateSetting('defaultTerms', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Default Terms & Conditions</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Add your terms & conditions at the bottom of invoices/orders/quotations
                </div>
              </div>

              {/* Sales Credit Limit */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.salesCreditLimit}
                    onChange={(e) => updateSetting('salesCreditLimit', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Sales Credit Limit</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1 leading-relaxed">
                  Trigger alerts when creating Invoices and Sales Orders for Partners with a Total Receivable amount exceeding a limit. Set a value greater than 0.0 to activate a credit limit check
                </div>
              </div>

              {/* Total amount of invoice in words */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.totalAmountWords}
                    onChange={(e) => updateSetting('totalAmountWords', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Total amount of invoice in words</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Display the total amount of an invoice in words
                </div>
              </div>

              {/* Taxes in company currency */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.taxesInCompanyCurrency}
                    onChange={(e) => updateSetting('taxesInCompanyCurrency', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Taxes in company currency</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Taxes are also displayed in local currency on invoices
                </div>
              </div>

              {/* Authorized Signatory on invoice */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.authorizedSignatory}
                    onChange={(e) => updateSetting('authorizedSignatory', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Authorized Signatory on invoice</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  To enhance authenticity, add a signature to your invoices
                </div>
              </div>

              {/* Automatic Invoice Reminders */}
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.automaticInvoiceReminders}
                    onChange={(e) => updateSetting('automaticInvoiceReminders', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Automatic Invoice Reminders</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Send reminders for invoices and customer statement
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. UNITS & PACKAGINGS */}
        {(matchesSearch('units') || matchesSearch('packagings')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Units & Packagings
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.unitsOfMeasure}
                    onChange={(e) => updateSetting('unitsOfMeasure', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Units of Measure & Packagings</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Sell and purchase products in different units of measure or packagings
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. CUSTOMER PAYMENTS */}
        {(matchesSearch('customer payments') || matchesSearch('online payment') || matchesSearch('qr')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Customer Payments
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-2">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.invoiceOnlinePayment}
                    onChange={(e) => updateSetting('invoiceOnlinePayment', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Invoice Online Payment</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Let your customers pay their invoices on your portal
                </div>
                {settings.invoiceOnlinePayment && (
                  <div className="pl-6 pt-1">
                    <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.addQrCodePdf}
                        onChange={(e) => updateSetting('addQrCodePdf', e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Add QR-code link on PDF</span>
                    </label>
                  </div>
                )}

                <div className="pt-3">
                  <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.paymentQrCodes}
                      onChange={(e) => updateSetting('paymentQrCodes', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Payment QR Codes</span>
                  </label>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1 leading-relaxed">
                    Add a QR-code to your invoices so that your customers can pay instantly with their banking application.
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.batchPayments}
                    onChange={(e) => updateSetting('batchPayments', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Batch Payments</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Group payments into a single batch to ease the reconciliation process
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. VENDOR BILLS */}
        {(matchesSearch('vendor bills') || matchesSearch('auto-validate')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Vendor Bills
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoValidateBills}
                    onChange={(e) => updateSetting('autoValidateBills', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Auto-validate bills</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1 leading-relaxed">
                  Propose to validate bills automatically when AI accuracy is right 3 times in a row for a vendor.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. VENDOR PAYMENTS */}
        {(matchesSearch('vendor payments') || matchesSearch('checks') || matchesSearch('sepa')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Vendor Payments
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.checks}
                    onChange={(e) => updateSetting('checks', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Checks</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Print checks to pay your vendors
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sepaCreditTransfer}
                    onChange={(e) => updateSetting('sepaCreditTransfer', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>SEPA Credit Transfer / ISO20022</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Pay your bills in one-click using Euro SEPA Service / ISO20022
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 9. DIGITIZATION */}
        {(matchesSearch('digitization') || matchesSearch('document digitization') || matchesSearch('ocr')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Digitization
            </div>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.documentDigitization}
                    onChange={(e) => updateSetting('documentDigitization', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Document Digitization</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Digitize your PDF or scanned documents with OCR and Artificial Intelligence
                </div>

                {settings.documentDigitization && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-3 pl-4">
                    {/* Left Column: Customer Invoices & Bank Statements */}
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">Customer Invoices</span>
                        <div className="space-y-1 pl-1">
                          {['Do not digitize', 'Digitize on demand only', 'Digitize automatically'].map((opt) => {
                            const val = opt.toLowerCase().includes('demand') ? 'on_demand' : opt.toLowerCase().includes('auto') ? 'auto' : 'none';
                            return (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="digitizeCustomerInvoices"
                                  checked={settings.digitizeCustomerInvoices === val}
                                  onChange={() => updateSetting('digitizeCustomerInvoices', val)}
                                  className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">Bank Statements</span>
                        <div className="space-y-1 pl-1">
                          {['Do not digitize', 'Digitize automatically'].map((opt) => {
                            const val = opt.toLowerCase().includes('auto') ? 'auto' : 'none';
                            return (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="digitizeBankStatements"
                                  checked={settings.digitizeBankStatements === val}
                                  onChange={() => updateSetting('digitizeBankStatements', val)}
                                  className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Vendor Bills & Loans */}
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">Vendor Bills</span>
                        <div className="space-y-1 pl-1">
                          {['Do not digitize', 'Digitize on demand only', 'Digitize automatically'].map((opt) => {
                            const val = opt.toLowerCase().includes('demand') ? 'on_demand' : opt.toLowerCase().includes('auto') ? 'auto' : 'none';
                            return (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="digitizeVendorBills"
                                  checked={settings.digitizeVendorBills === val}
                                  onChange={() => updateSetting('digitizeVendorBills', val)}
                                  className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">Loans</span>
                        <div className="space-y-1 pl-1">
                          {['Do not digitize', 'Digitize automatically'].map((opt) => {
                            const val = opt.toLowerCase().includes('auto') ? 'auto' : 'none';
                            return (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="digitizeLoans"
                                  checked={settings.digitizeLoans === val}
                                  onChange={() => updateSetting('digitizeLoans', val)}
                                  className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pl-4 pt-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => setToastMessage('Redirecting to Digitization Service Credits Portal...')}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Manage Service & Buy Credits</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setToastMessage('Connected to OCR Services Hub.')}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>View My Services</span>
                  </button>
                </div>
              </div>

              {/* Single Invoice Line Per Tax */}
              <div className="space-y-1 pt-2">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.singleInvoiceLinePerTax}
                    onChange={(e) => updateSetting('singleInvoiceLinePerTax', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Single Invoice Line Per Tax</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Enable to get only one invoice line per tax
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. DEFAULT ACCOUNTS */}
        {(matchesSearch('default accounts') || matchesSearch('suspense') || matchesSearch('deferred') || matchesSearch('discount')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Default Accounts
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 max-w-7xl mx-auto">
              
              {/* Left Column */}
              <div className="space-y-6">
                {/* Bank transactions and payments: */}
                <div className="space-y-2.5">
                  <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-1">
                    Bank transactions and payments:
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Bank Suspense</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.bankSuspenseAccount}
                          onChange={(e) => updateSetting('bankSuspenseAccount', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                        >
                          <option value="160103 Bank Suspense">160103 Bank Suspen...</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Internal Transfer</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.internalTransferAccount}
                          onChange={(e) => updateSetting('internalTransferAccount', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                        >
                          <option value="160700 Funds in Transit">160700 Funds in Tra...</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deferred revenue entries: */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="font-bold text-slate-900 dark:text-white">Deferred revenue entries:</span>
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Journal</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.deferredRevenueJournal}
                          onChange={(e) => updateSetting('deferredRevenueJournal', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                        >
                          <option value="Miscellaneous Operations">Miscellaneous Oper...</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Account</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.deferredRevenueAccount}
                          onChange={(e) => updateSetting('deferredRevenueAccount', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                        >
                          <option value="230100 Deferred Income">230100 Deferred Inc...</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Generate Entries</span>
                      <select
                        value={settings.deferredRevenueGenerate}
                        onChange={(e) => updateSetting('deferredRevenueGenerate', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48"
                      >
                        <option value="On invoice validation">On invoice validation</option>
                        <option value="Manually">Manually</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Periodicity</span>
                      <select
                        value={settings.deferredRevenuePeriodicity}
                        onChange={(e) => updateSetting('deferredRevenuePeriodicity', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Computation</span>
                      <select
                        value={settings.deferredRevenueComputation}
                        onChange={(e) => updateSetting('deferredRevenueComputation', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48"
                      >
                        <option value="By Months">By Months</option>
                        <option value="By Days">By Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Early payment discounts: */}
                <div className="space-y-2.5">
                  <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-1">
                    Early payment discounts:
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Early Discount Gain</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.earlyDiscountGain}
                          onChange={(e) => updateSetting('earlyDiscountGain', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                        >
                          <option value="510400 Cash Discount Gain">510400 Cash Discou...</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Early Discount Loss</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.earlyDiscountLoss}
                          onChange={(e) => updateSetting('earlyDiscountLoss', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                        >
                          <option value="430800 Cash Discount Loss">430800 Cash Discou...</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Withholding: */}
                <div className="space-y-2.5">
                  <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-1">
                    Withholding:
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Withholding Tax Base</span>
                    <select
                      value={settings.withholdingTaxBase}
                      onChange={(e) => updateSetting('withholdingTaxBase', e.target.value)}
                      className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48"
                    >
                      <option value="">Select Base...</option>
                      <option value="Net Amount">Net Amount</option>
                      <option value="Total Amount">Total Amount (Tax Inc.)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Deferred expense entries: */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-1">
                    <span className="font-bold text-slate-900 dark:text-white">Deferred expense entries:</span>
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Journal</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.deferredExpenseJournal}
                          onChange={(e) => updateSetting('deferredExpenseJournal', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                        >
                          <option value="Miscellaneous Operations">Miscellaneous Oper...</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Account</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.deferredExpenseAccount}
                          onChange={(e) => updateSetting('deferredExpenseAccount', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                        >
                          <option value="131300 Other Prepayments">131300 Other Prepa...</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Generate Entries</span>
                      <select
                        value={settings.deferredExpenseGenerate}
                        onChange={(e) => updateSetting('deferredExpenseGenerate', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48"
                      >
                        <option value="On bill validation">On bill validation</option>
                        <option value="Manually">Manually</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Periodicity</span>
                      <select
                        value={settings.deferredExpensePeriodicity}
                        onChange={(e) => updateSetting('deferredExpensePeriodicity', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48"
                      >
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Computation</span>
                      <select
                        value={settings.deferredExpenseComputation}
                        onChange={(e) => updateSetting('deferredExpenseComputation', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48"
                      >
                        <option value="By Months">By Months</option>
                        <option value="By Days">By Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Invoice line discounts: */}
                <div className="space-y-2.5">
                  <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-1">
                    Invoice line discounts:
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Customer Invoices</span>
                      <select
                        value={settings.discountCustomerInvoices}
                        onChange={(e) => updateSetting('discountCustomerInvoices', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium text-slate-400 cursor-pointer w-48"
                      >
                        <option value="Same Account as product">Same Account as product</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Vendor Bills</span>
                      <select
                        value={settings.discountVendorBills}
                        onChange={(e) => updateSetting('discountVendorBills', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium text-slate-400 cursor-pointer w-48"
                      >
                        <option value="Same Account as product">Same Account as product</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Product Accounts: */}
                <div className="space-y-2.5">
                  <span className="font-bold text-slate-900 dark:text-white block border-b border-slate-200 dark:border-slate-800 pb-1">
                    Product Accounts:
                  </span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Income Account</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.incomeAccount}
                          onChange={(e) => updateSetting('incomeAccount', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                        >
                          <option value="500100 Sales Account">500100 Sales Account</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Expense Account</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={settings.expenseAccount}
                          onChange={(e) => updateSetting('expenseAccount', e.target.value)}
                          className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                        >
                          <option value="424800 Other Expenses">424800 Other Expen...</option>
                        </select>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 11. INVENTORY VALUATION */}
        {(matchesSearch('inventory valuation') || matchesSearch('inventory accounting') || matchesSearch('stock valuation')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Inventory Valuation
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-3">
                <div className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1">
                  Inventory Accounting
                </div>
                <div className="space-y-2.5 pl-1">
                  <div className="flex items-center justify-between max-w-md">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Inventory Valuation</span>
                    <select
                      value={settings.inventoryValuation}
                      onChange={(e) => updateSetting('inventoryValuation', e.target.value)}
                      className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer w-48"
                    >
                      <option value="Periodic (at closing)">Periodic (at closing)</option>
                      <option value="Perpetual (real-time)">Perpetual (real-time)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between max-w-md">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Inventory Cost Method</span>
                    <select
                      value={settings.inventoryCostMethod}
                      onChange={(e) => updateSetting('inventoryCostMethod', e.target.value)}
                      className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer w-48"
                    >
                      <option value="Standard Price">Standard Price</option>
                      <option value="Average Cost (AVCO)">Average Cost (AVCO)</option>
                      <option value="First In First Out (FIFO)">First In First Out (FIFO)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between max-w-md">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Periodic Valuation</span>
                    <select
                      value={settings.periodicValuation}
                      onChange={(e) => updateSetting('periodicValuation', e.target.value)}
                      className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer w-48"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Automated">Automated</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between max-w-md">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Stock Valuation Account</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={settings.stockValuationAccount}
                        onChange={(e) => updateSetting('stockValuationAccount', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-medium cursor-pointer w-48 truncate"
                      >
                        <option value="120100 Inventory - Raw Materials">120100 Inventory - ...</option>
                      </select>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between max-w-md">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Journal</span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={settings.inventoryJournal}
                        onChange={(e) => updateSetting('inventoryJournal', e.target.value)}
                        className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer w-48"
                      >
                        <option value="Inventory Valuation">Inventory Valuation</option>
                      </select>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 12. BANK & CASH */}
        {(matchesSearch('bank & cash') || matchesSearch('qif') || matchesSearch('auto transfer')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Bank & Cash
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.qifImport}
                    onChange={(e) => updateSetting('qifImport', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>QIF Import</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Import your bank statements in QIF
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableAutoTransfer}
                    onChange={(e) => updateSetting('enableAutoTransfer', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Enable Auto Transfer</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Enable Auto Transfers
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 13. FISCAL PERIODS */}
        {(matchesSearch('fiscal periods') || matchesSearch('fiscal year') || matchesSearch('threshold')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Fiscal Periods
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-900 dark:text-white block">Fiscal Year</span>
                  <div className="flex items-center gap-3 pl-3">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Last Day</span>
                    <select
                      value={settings.fiscalYearMonth}
                      onChange={(e) => updateSetting('fiscalYearMonth', e.target.value)}
                      className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer"
                    >
                      <option value="December">December</option>
                      <option value="June">June</option>
                    </select>
                    <input
                      type="text"
                      value={settings.fiscalYearDay}
                      onChange={(e) => updateSetting('fiscalYearDay', e.target.value)}
                      className="w-10 text-center border-b border-slate-300 dark:border-slate-700 pb-0.5 font-bold outline-none bg-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.fiscalYearsFlexible}
                      onChange={(e) => updateSetting('fiscalYearsFlexible', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Fiscal Years</span>
                  </label>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                    Define fiscal years of more or less than one year
                  </div>
                </div>
              </div>

              {/* Invoicing Switch Threshold */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block">Invoicing Switch Threshold</span>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 leading-relaxed">
                  All entries created by Invoicing before that date will be ignored in Accounting.
                </div>
                <div className="pt-2 pl-3">
                  <input
                    type="date"
                    value={settings.invoicingSwitchThreshold}
                    onChange={(e) => updateSetting('invoicingSwitchThreshold', e.target.value)}
                    className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 font-medium outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 14. ANALYTICS */}
        {(matchesSearch('analytics') || matchesSearch('budget') || matchesSearch('margin')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Analytics
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.analyticAccounting}
                      onChange={(e) => updateSetting('analyticAccounting', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Analytic Accounting</span>
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </label>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                    Track costs & revenues by project, department, etc
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.marginAnalysis}
                      onChange={(e) => updateSetting('marginAnalysis', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Margin Analysis</span>
                  </label>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                    Monitor your product margins from invoices
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.budgetManagement}
                    onChange={(e) => updateSetting('budgetManagement', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Budget Management</span>
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  Use budgets to compare actual with expected revenues and costs
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 15. REPORTING */}
        {(matchesSearch('reporting') || matchesSearch('audit trail') || matchesSearch('negative amount') || matchesSearch('inalterability')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Reporting
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.restrictiveAuditTrail}
                      onChange={(e) => updateSetting('restrictiveAuditTrail', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Restrictive Audit Trail</span>
                  </label>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                    Log changes to posted journal entries immutably
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="font-bold text-slate-900 dark:text-white block">Negative amount display</span>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400">
                    How negative amounts are displayed on financial reports.
                  </div>
                  <div className="pt-1.5 pl-3">
                    <select
                      value={settings.negativeAmountDisplay}
                      onChange={(e) => updateSetting('negativeAmountDisplay', e.target.value)}
                      className="bg-transparent border-b border-slate-300 dark:border-slate-700 pb-0.5 outline-none font-bold cursor-pointer w-28"
                    >
                      <option value="-100">-100</option>
                      <option value="(100)">(100)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.addTotalsBelowSections}
                      onChange={(e) => updateSetting('addTotalsBelowSections', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Add totals below sections</span>
                  </label>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                    When ticked, totals and subtotals appear below the sections of the report
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setToastMessage('Data Inalterability Check Report (Chained Hash Cryptographic Audit) generated.');
                      setTimeout(() => setToastMessage(null), 3500);
                    }}
                    className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>Download the Data Inalterability Check Report</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 16. ACCOUNTING FIRMS MODE */}
        {(matchesSearch('accounting firms') || matchesSearch('quick encoding') || matchesSearch('sequence') || matchesSearch('review data')) && (
          <div className="border-b border-slate-200 dark:border-slate-800">
            <div className="bg-[#eaedf0] dark:bg-slate-800/90 py-2 px-6 font-bold text-slate-800 dark:text-slate-200 text-sm tracking-tight border-y border-slate-200/90 dark:border-slate-700/80">
              Accounting Firms mode
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-7xl mx-auto">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.quickEncoding}
                      onChange={(e) => updateSetting('quickEncoding', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Quick encoding</span>
                  </label>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1 leading-relaxed">
                    A new field 'Total (tax inc.)' to speed up and control the encoding by automating line creation with the right account and tax.
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.reviewData}
                      onChange={(e) => updateSetting('reviewData', e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Review data</span>
                  </label>
                  <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1 leading-relaxed">
                    Review all the modification done by the user with right under bookkeeper.
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 font-bold text-slate-900 dark:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.documentSequenceEditable}
                    onChange={(e) => updateSetting('documentSequenceEditable', e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Document's sequence editable</span>
                </label>
                <div className="border-l-2 border-slate-200 dark:border-slate-700 pl-3 text-slate-500 dark:text-slate-400 ml-1">
                  The document's sequence becomes editable on all documents.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsPage;
