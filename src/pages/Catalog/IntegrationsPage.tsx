import React, { useState } from 'react';
import { 
  Share2, 
  FileText, 
  Plus, 
  Trash2, 
  Tag, 
  Layers, 
  CheckCircle2, 
  DollarSign, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  Send,
  Building2
} from 'lucide-react';
import { useCatalog } from './CatalogContext';
import { ExtendedProduct } from './types';

interface QuoteLineItem {
  productId: number;
  qty: number;
}

export const IntegrationsPage: React.FC = () => {
  const { 
    products, 
    priceLists, 
    promoCodes, 
    priceOverrides, 
    customers, 
    baseCurrency, 
    showToast,
    invoiceLogs,
    addInvoiceLog
  } = useCatalog();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('c1');
  const [selectedPriceListId, setSelectedPriceListId] = useState<string>('standard');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string>('');
  const [promoDiscountVal, setPromoDiscountVal] = useState<number>(0);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [quoteItems, setQuoteItems] = useState<QuoteLineItem[]>(() => {
    return products.length > 0 
      ? [{ productId: products[0].id, qty: 1 }] 
      : [];
  });

  const defaultCustomers = [
    { id: 'c1', name: 'Smart Solutions Ltd (VIP Corporate)' },
    { id: 'c2', name: 'Ameely Travel & Tourism Agency' },
    { id: 'c3', name: 'Nile Hospitality Group' },
    { id: 'c4', name: 'Al-Noor Retail Distribution' }
  ];

  const handleApplyPromo = () => {
    setPromoError(null);
    if (!appliedPromoCode.trim()) {
      setPromoDiscountVal(0);
      return;
    }

    const promo = promoCodes.find(p => p.code.toUpperCase() === appliedPromoCode.trim().toUpperCase());
    if (!promo) {
      setPromoError('Invalid promo coupon code');
      setPromoDiscountVal(0);
      return;
    }

    if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) {
      setPromoError('This promo coupon has expired');
      setPromoDiscountVal(0);
      return;
    }

    if (!promo.is_active) {
      setPromoError('Promo code is currently disabled');
      setPromoDiscountVal(0);
      return;
    }

    setPromoDiscountVal(promo.discount_value);
    showToast(`Coupon ${promo.code} successfully applied!`, 'success');
  };

  const handleAddItem = (productId: number) => {
    setQuoteItems(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing) {
        return prev.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { productId, qty: 1 }];
    });
  };

  const handleRemoveItem = (productId: number) => {
    setQuoteItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleUpdateQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setQuoteItems(prev => prev.map(i => i.productId === productId ? { ...i, qty } : i));
  };

  // Calculations
  const calculatedItems = quoteItems.map(item => {
    const p = products.find(prod => prod.id === item.productId);
    if (!p) return null;

    let unitPrice = p.price;
    if (selectedPriceListId !== 'standard') {
      const override = priceOverrides.find(o => o.price_list_id === parseInt(selectedPriceListId) && o.product_id === p.id);
      if (override) {
        unitPrice = override.override_price;
      }
    }

    const lineTotal = unitPrice * item.qty;
    const taxVal = lineTotal * ((p.tax || 0) / 100);

    return {
      product: p,
      unitPrice,
      qty: item.qty,
      lineTotal,
      taxVal
    };
  }).filter(Boolean) as { product: ExtendedProduct; unitPrice: number; qty: number; lineTotal: number; taxVal: number }[];

  const subtotal = calculatedItems.reduce((acc, i) => acc + i.lineTotal, 0);
  const totalTax = calculatedItems.reduce((acc, i) => acc + i.taxVal, 0);

  // Apply promo
  let discountAmount = 0;
  if (promoDiscountVal > 0) {
    const promo = promoCodes.find(p => p.code.toUpperCase() === appliedPromoCode.trim().toUpperCase());
    if (promo?.discount_type === 'percentage') {
      discountAmount = (subtotal * promoDiscountVal) / 100;
    } else {
      discountAmount = Math.min(subtotal, promoDiscountVal);
    }
  }

  const grandTotal = Math.max(0, subtotal - discountAmount + totalTax);

  const handlePostToLedger = () => {
    if (quoteItems.length === 0) {
      showToast('Please add at least one catalog item to post.', 'error');
      return;
    }

    const customerName = defaultCustomers.find(c => c.id === selectedCustomerId)?.name || 'Walk-in Client';
    const invoiceId = `INV-SIM-${Math.floor(10000 + Math.random() * 90000)}`;
    const newLog = {
      id: invoiceId,
      date: new Date().toISOString().split('T')[0],
      customer_name: customerName,
      total_amount: Math.round(grandTotal)
    };

    addInvoiceLog(newLog);
    showToast(`Invoice ${invoiceId} posted to General Ledger & Accounting Hub!`, 'success');
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      {/* Top Architecture Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900">Cross-Module Workflow Integrations</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Test quote generation, verify multi-tier price rules, apply coupons, and push transactions to accounting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5" />
            <span>CRM & Accounting Bridges Active</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Quote Generator Simulator */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h4 className="font-black text-sm text-slate-900">Live Quote & Deal Simulator</h4>
                <p className="text-xs text-slate-500 mt-0.5">Simulate real pricing logic used by sales team.</p>
              </div>
            </div>

            {/* Select Customer & Pricing Profile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Customer (CRM)</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {defaultCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pricing Profile Tier</label>
                <select
                  value={selectedPriceListId}
                  onChange={e => setSelectedPriceListId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="standard">Standard General Price</option>
                  {priceLists.map(pl => (
                    <option key={pl.id} value={pl.id.toString()}>{pl.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Promo Code Input */}
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
              <label className="block text-xs font-bold text-slate-700">Apply Promo Coupon Code</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="e.g. MEGA50 or WELCOME10"
                  value={appliedPromoCode}
                  onChange={e => setAppliedPromoCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>
              {promoError && (
                <p className="text-[11px] font-bold text-red-600">{promoError}</p>
              )}
              {promoDiscountVal > 0 && (
                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Coupon active: {discountAmount.toLocaleString()} {baseCurrency} discount deducted</span>
                </p>
              )}
            </div>

            {/* Line items in Quote */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Quote Line Items</span>
                <span className="text-xs font-bold text-slate-500">{quoteItems.length} items added</span>
              </div>

              {calculatedItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400">
                  No items in quote. Click items below to add.
                </div>
              ) : (
                <div className="space-y-2">
                  {calculatedItems.map(item => (
                    <div 
                      key={item.product.id}
                      className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100"
                    >
                      <div className="max-w-[50%]">
                        <div className="font-bold text-xs text-slate-900 truncate">{item.product.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.unitPrice.toLocaleString()} {baseCurrency} each
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1">
                          <button
                            onClick={() => handleUpdateQty(item.product.id, item.qty - 1)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 px-1"
                          >
                            -
                          </button>
                          <span className="text-xs font-mono font-bold text-slate-800 w-6 text-center">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(item.product.id, item.qty + 1)}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 px-1"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-right min-w-[70px]">
                          <span className="text-xs font-black text-slate-900">
                            {item.lineTotal.toLocaleString()} {baseCurrency}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="p-1 text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Add Products list */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 block mb-2">Add Catalog Item:</span>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddItem(p.id)}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span className="truncate max-w-[140px]">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Invoice Summary & Ledger Output */}
        <div className="lg:col-span-5 space-y-6">
          {/* Formal Invoice Summary Card */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Formal Quotation</span>
                <h4 className="text-sm font-black text-white mt-0.5">Financial Breakdown</h4>
              </div>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">
                Live Draft
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Items Subtotal</span>
                <span className="font-mono text-white font-bold">{subtotal.toLocaleString()} {baseCurrency}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-400">
                  <span>Promo Voucher Discount</span>
                  <span className="font-mono font-bold">-{discountAmount.toLocaleString()} {baseCurrency}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-400">
                <span>Tax VAT Total</span>
                <span className="font-mono text-white font-bold">+{Math.round(totalTax).toLocaleString()} {baseCurrency}</span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-sm font-black text-white">Grand Total</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {Math.round(grandTotal).toLocaleString()} {baseCurrency}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePostToLedger}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Post to General Ledger</span>
            </button>
          </div>

          {/* Real-time Ledger Stream */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-900">Recent Accounting Ledger Entries</span>
              <span className="text-[10px] text-slate-400 font-mono">Real-time sync</span>
            </div>

            <div className="space-y-2">
              {invoiceLogs.map(log => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{log.id}</div>
                    <div className="text-[10px] text-slate-500">{log.customer_name} • {log.date}</div>
                  </div>
                  <span className="font-mono font-black text-emerald-700">
                    +{log.total_amount.toLocaleString()} {baseCurrency}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsPage;
