import React, { useState } from 'react';
import { 
  Percent, 
  Plus, 
  Calendar, 
  Clock, 
  Trash2, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { useCatalog } from '../CatalogContext';
import DeleteConfirmation from '../../../components/Common/DeleteConfirmation';
import { PromoCode } from '../types';

export const PromoCodesPage: React.FC = () => {
  const { promoCodes, savePromoCode, deletePromoCode, baseCurrency, isSaving, showToast } = useCatalog();

  const [showAddModal, setShowAddModal] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<PromoCode>>({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    expiry_date: '',
    is_active: true
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code ${code} copied to clipboard`, 'info');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim()) return;

    await savePromoCode({
      ...formData,
      code: formData.code.trim().toUpperCase()
    });

    setShowAddModal(false);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      expiry_date: '',
      is_active: true
    });
  };

  const handleDeleteConfirm = async () => {
    if (promoToDelete) {
      await deletePromoCode(promoToDelete);
      setPromoToDelete(null);
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Header card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900">Discount Coupons & Promo Codes</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage promotional vouchers applied at CRM quoting and sales checkout.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>New Promo Code</span>
        </button>
      </div>

      {/* Promo Codes Grid */}
      {promoCodes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
          <Tag className="w-12 h-12 text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-800">No promo coupons yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Create seasonal discounts, VIP coupons, or launch campaign codes to offer deals.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            Create Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promoCodes.map(promo => {
            const isExpired = promo.expiry_date && new Date(promo.expiry_date) < new Date();
            
            return (
              <div 
                key={promo.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${isExpired ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {isExpired ? 'Expired' : 'Active Voucher'}
                    </span>

                    <button
                      onClick={() => setPromoToDelete(promo.id)}
                      title="Delete Coupon"
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Coupon Code Pill */}
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-600" />
                      <span className="font-mono font-black text-sm tracking-wider text-slate-900">
                        {promo.code}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCode(promo.code)}
                      title="Copy Code"
                      className="p-1.5 hover:bg-white rounded-lg text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                    >
                      {copiedCode === promo.code ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Discount Value */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Discount Rate</span>
                    <div className="text-2xl font-black text-slate-900">
                      {promo.discount_type === 'percentage' 
                        ? `${promo.discount_value}% OFF`
                        : `-${promo.discount_value} ${baseCurrency}`}
                    </div>
                  </div>
                </div>

                {/* Expiry date footer */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {promo.expiry_date 
                        ? new Date(promo.expiry_date).toLocaleDateString() 
                        : 'No Expiration'}
                    </span>
                  </div>
                  {isExpired && (
                    <span className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Expired</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Coupon Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-black text-slate-900">Create Discount Coupon</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Generate a voucher code for customers or sales campaigns.
              </p>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. SUMMER20 or VIP100"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black tracking-wider text-slate-900 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={e => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Cash Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Value ({formData.discount_type === 'percentage' ? '%' : baseCurrency})
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={formData.discount_value}
                    onChange={e => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date (Optional)</label>
                <input 
                  type="date"
                  value={formData.expiry_date}
                  onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation 
        isOpen={!!promoToDelete}
        onClose={() => setPromoToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Promo Coupon"
        message="Are you sure you want to remove this discount coupon? Existing quotes using this coupon may lose their discount."
      />
    </div>
  );
};

export default PromoCodesPage;
