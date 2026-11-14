import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  DollarSign, 
  UserCheck, 
  Building2, 
  Briefcase, 
  Layers, 
  FileText 
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';

export const NewDealPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    stages, 
    customers, 
    users, 
    products, 
    saveDeal, 
    saveCustomer, 
    isSaving, 
    formatCurrency, 
    baseCurrency 
  } = useSalesContext();

  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState<string>('');
  const [stageId, setStageId] = useState<string>(() => stages[0]?.id ? String(stages[0].id) : '');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [serviceType, setServiceType] = useState('');
  const [product, setProduct] = useState('');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState<number>(0);

  // Line items state
  const [items, setItems] = useState<{ id: string; name: string; quantity: number; unitPrice: number; total: number }[]>([]);

  // Quick Customer Creation modal/state
  const [showQuickCustomer, setShowQuickCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, name: '', quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const handleUpdateItem = (id: string, field: 'name' | 'quantity' | 'unitPrice', val: any) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const newItem = { ...item, [field]: val };
          if (field === 'quantity' || field === 'unitPrice') {
            newItem.total = Number(newItem.quantity || 0) * Number(newItem.unitPrice || 0);
          }
          return newItem;
        }
        return item;
      });
      // Recalculate total value
      const sum = updated.reduce((acc, curr) => acc + curr.total, 0);
      if (sum > 0) setValue(sum);
      return updated;
    });
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => {
      const filtered = prev.filter(i => i.id !== id);
      const sum = filtered.reduce((acc, curr) => acc + curr.total, 0);
      setValue(sum);
      return filtered;
    });
  };

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const created = await saveCustomer({
      name: newCustName.trim(),
      company: newCustCompany.trim(),
      email: newCustEmail.trim(),
      phone: newCustPhone.trim()
    });
    if (created) {
      setCustomerId(String(created.id));
      setShowQuickCustomer(false);
      setNewCustName('');
      setNewCustCompany('');
      setNewCustEmail('');
      setNewCustPhone('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !customerId) return;

    const payload = {
      title: title.trim(),
      customer_id: Number(customerId),
      stage_id: stageId ? Number(stageId) : stages[0]?.id || 1,
      assigned_to: assignedTo ? Number(assignedTo) : null,
      service_type: serviceType.trim(),
      product: product.trim(),
      value: Number(value) || 0,
      description: description.trim(),
      items
    };

    const saved = await saveDeal(payload);
    if (saved) {
      navigate(`/sales/pipeline/deals/${saved.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/sales/pipeline/deals')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deals Pipeline</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-8">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Pipeline Deal Setup
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Create New Sales Deal
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Initialize an active opportunity in your sales pipeline with associated prospect, products, and target values.
          </p>
        </div>

        {/* Section 1: Core Specifications */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide border-b pb-2 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-500" />
            <span>1. Deal Scope & Ownership</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-8 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Deal Title / Project Reference <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Enterprise Cloud ERP Migration & Licensing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Estimated Deal Value ({baseCurrency}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={value || ''}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
                />
                <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Customer select */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  Client Account <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  + Add New
                </button>
              </div>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
              >
                <option value="">Select Associated Client...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Pipeline Stage <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
              >
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Sales Rep select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Assigned Sales Rep
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
              >
                <option value="">Select Deal Owner...</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Service Category / Tag
              </label>
              <input
                type="text"
                placeholder="e.g. Software, Cloud Infrastructure, Consulting..."
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">
                Target Product / Solution
              </label>
              <input
                type="text"
                placeholder="e.g. Enterprise CRM Suite 2026"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Order Line Items (Optional) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>2. Products & Deliverables (Line Items)</span>
            </h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line Item</span>
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              No specific item breakdown added yet. You can leave this empty or add specific deliverables to automatically compute the total value.
            </p>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Item name / service description"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center outline-none"
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Unit Price"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right outline-none"
                    />
                  </div>
                  <div className="w-28 text-right font-black text-xs text-slate-900">
                    {formatCurrency(item.total)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Notes & Follow-up Memo */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wide">
            3. Internal Deal Memo & Objectives
          </label>
          <textarea
            rows={3}
            placeholder="Add context, key decision makers, client requirements, or special milestones..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-medium outline-none transition-all"
          />
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/sales/pipeline/deals')}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Creating Deal...' : 'Create & Open Deal'}</span>
          </button>
        </div>
      </form>

      {/* Quick Customer Creation Modal */}
      {showQuickCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900">Add New Client Account</h3>
            <form onSubmit={handleQuickCreateCustomer} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Company / Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={newCustEmail}
                    onChange={(e) => setNewCustEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone</label>
                  <input
                    type="tel"
                    placeholder="+966 50 000 0000"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowQuickCustomer(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
