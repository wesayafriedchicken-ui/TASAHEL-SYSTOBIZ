import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Printer, 
  Save, 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign,
  CheckCircle2,
  Send
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const QuotationBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const initialDealId = searchParams.get('dealId');
  const initialCustomerId = searchParams.get('customerId');

  const { 
    quotations, 
    customers, 
    deals, 
    saveQuotation, 
    formatCurrency, 
    baseCurrency,
    isSaving,
    showToast 
  } = useSalesContext();

  // Quotation header states
  const [quoteNumber, setQuoteNumber] = useState(`QT-${Date.now().toString().slice(-6)}`);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [selectedDealId, setSelectedDealId] = useState<string>(initialDealId || '');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<'Draft' | 'Sent' | 'Accepted' | 'Declined'>('Draft');
  const [notes, setNotes] = useState('Payment due within 30 days of contract execution. Thank you for your business.');

  // Items
  const [items, setItems] = useState<Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>>([
    { id: '1', description: 'Enterprise Software License & Integration', quantity: 1, unitPrice: 5000, taxRate: 15 }
  ]);

  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // If editing an existing quote, populate fields
  useEffect(() => {
    if (editId) {
      const q = quotations.find(item => String(item.id) === editId);
      if (q) {
        setQuoteNumber(q.quoteNumber || (q as any).quotationNumber || '');
        setSelectedCustomerId(String(q.customerId));
        const qDate = q.issueDate || (q as any).date;
        setQuoteDate(qDate ? qDate.split('T')[0] : '');
        setStatus((q.status as any) || 'draft');
        setNotes(q.notes || '');
        if (q.items && q.items.length > 0) {
          setItems(q.items.map((it: any, idx: number) => ({
            id: String(idx + 1),
            description: it.name || it.description || '',
            quantity: Number(it.quantity || 1),
            unitPrice: Number(it.unitPrice || 0),
            taxRate: Number(it.taxRate || 15)
          })));
        }
      }
    }
  }, [editId, quotations]);

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableTotal = subtotal - discountAmount;
  const totalTax = items.reduce((acc, it) => {
    const itemSub = it.quantity * it.unitPrice;
    const itemDiscounted = itemSub - (itemSub * discountPercent) / 100;
    return acc + (itemDiscounted * (it.taxRate / 100));
  }, 0);
  const grandTotal = taxableTotal + totalTax;

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0, taxRate: 15 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: string, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      showToast('Please select a customer for this quotation.', 'error');
      return;
    }

    const payload: any = {
      id: editId ? String(editId) : `quote-${Date.now()}`,
      quoteNumber,
      customerId: Number(selectedCustomerId),
      customerName: customer?.name || 'Customer',
      customerEmail: customer?.email || '',
      customerCompany: customer?.company || '',
      issueDate: quoteDate,
      expiryDate: validUntil,
      currency: baseCurrency,
      paymentTerms: 'Due on Receipt',
      status: (status.toLowerCase() as any) || 'draft',
      notes,
      subtotal,
      discountTotal: discountAmount,
      vatRate: 15,
      vatAmount: totalTax,
      grandTotal,
      items: items.map(i => ({
        id: i.id,
        name: i.description,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: (i.quantity * i.unitPrice) * (1 + i.taxRate / 100)
      }))
    };

    await saveQuotation(payload);
    navigate('/sales/quotations/list');
  };

  const customer = customers.find(c => String(c.id) === selectedCustomerId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/sales/quotations/list')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations Registry</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Quotation'}</span>
          </button>
        </div>
      </div>

      {/* Main Quotation Sheet */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-100 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                Commercial Proposal
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Accepted">Accepted</option>
                <option value="Declined">Declined</option>
              </select>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quotation
            </h1>
            <p className="text-xs text-slate-400 font-mono font-bold">
              REF: {quoteNumber}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Issue Date</label>
              <input
                type="date"
                value={quoteDate}
                onChange={(e) => setQuoteDate(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-xs outline-none"
              />
            </div>
          </div>
        </div>

        {/* Client Picker & Addresses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-2">
          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Prepared For (Client)
            </h3>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none print:hidden"
            >
              <option value="">Select a customer profile...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>

            {customer ? (
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs space-y-1">
                <p className="font-bold text-slate-900">{customer.name}</p>
                {customer.company && <p className="text-slate-600 font-medium">{customer.company}</p>}
                {customer.email && <p className="text-slate-500">{customer.email}</p>}
                {customer.phone && <p className="text-slate-500">{customer.phone}</p>}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No customer selected.</p>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Issuer Information
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs space-y-1">
              <p className="font-bold text-slate-900">NextGen Enterprise Solutions</p>
              <p className="text-slate-600 font-medium">Sales & Licensing Department</p>
              <p className="text-slate-500">sales@company.internal</p>
              <p className="text-slate-500">VAT Registration: 300192847100003</p>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Deliverables & Fee Breakdown
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 print:hidden"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Item Description</th>
                  <th className="py-3 px-3 w-20 text-center">Qty</th>
                  <th className="py-3 px-3 w-28 text-right">Unit Price</th>
                  <th className="py-3 px-3 w-20 text-center">Tax %</th>
                  <th className="py-3 px-3 w-28 text-right">Total</th>
                  <th className="py-3 px-2 w-10 text-center print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => {
                  const itemTotal = (item.quantity * item.unitPrice) * (1 + item.taxRate / 100);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40">
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="Deliverable description or license tier..."
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          className="w-full p-1.5 bg-transparent border-b border-transparent focus:border-indigo-400 font-bold text-slate-900 outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-14 p-1.5 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-24 p-1.5 text-right bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={item.taxRate}
                          onChange={(e) => handleUpdateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="w-14 p-1.5 text-center bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        {formatCurrency(itemTotal)}
                      </td>
                      <td className="py-2.5 px-2 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-300 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Terms Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Terms & Additional Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium flex items-center gap-1.5">
                <span>Discount</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                  className="w-12 p-0.5 text-center bg-white border border-slate-200 rounded text-[11px] font-bold"
                />
                <span>%</span>
              </span>
              <span className="font-bold text-rose-600">-{formatCurrency(discountAmount)}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="font-medium">Estimated Tax / VAT</span>
              <span className="font-bold text-slate-800">{formatCurrency(totalTax)}</span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-sm">
              <span className="font-black text-slate-900">Grand Total</span>
              <span className="text-xl font-black text-indigo-600">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
