import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Check, 
  Edit3, 
  Trash2, 
  Search, 
  Tag, 
  Info, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useCatalog } from '../CatalogContext';
import DeleteConfirmation from '../../../components/Common/DeleteConfirmation';
import { PriceList } from '../types';

export const PriceListsPage: React.FC = () => {
  const { 
    products, 
    priceLists, 
    selectedPriceList, 
    setSelectedPriceList, 
    priceOverrides, 
    savePriceOverride, 
    savePriceList, 
    deletePriceList, 
    baseCurrency, 
    isSaving 
  } = useCatalog();

  const [searchItem, setSearchItem] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [listToDelete, setListToDelete] = useState<number | null>(null);
  const [newListData, setNewListData] = useState({ name: '', description: '', is_active: true });
  const [editingPriceList, setEditingPriceList] = useState<PriceList | null>(null);

  // Local override draft state for inputs before saving
  const [localOverrides, setLocalOverrides] = useState<{ [key: number]: number }>({});
  const [savedSuccessId, setSavedSuccessId] = useState<number | null>(null);

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(searchItem.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(searchItem.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchItem.toLowerCase())
  );

  const handleCreateOrUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListData.name.trim()) return;

    if (editingPriceList) {
      await savePriceList({ ...newListData, id: editingPriceList.id });
    } else {
      const created = await savePriceList(newListData);
      if (created) setSelectedPriceList(created);
    }

    setShowAddModal(false);
    setEditingPriceList(null);
    setNewListData({ name: '', description: '', is_active: true });
  };

  const handleSaveOverridePrice = async (productId: number, basePrice: number) => {
    if (!selectedPriceList) return;
    const priceToSave = localOverrides[productId] !== undefined 
      ? localOverrides[productId] 
      : (priceOverrides.find(o => o.product_id === productId)?.override_price ?? basePrice);

    const success = await savePriceOverride(selectedPriceList.id, productId, priceToSave);
    if (success) {
      setSavedSuccessId(productId);
      setTimeout(() => setSavedSuccessId(null), 2000);
    }
  };

  const handleDeleteList = async () => {
    if (listToDelete) {
      await deletePriceList(listToDelete);
      setListToDelete(null);
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Top Banner & Profile Selector */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Custom Multi-Tier Price Profiles</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Define wholesale tiers, seasonal markdowns, and client-specific pricing overrides.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingPriceList(null);
              setNewListData({ name: '', description: '', is_active: true });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Price List</span>
          </button>
        </div>

        {/* Price list pills selector */}
        {priceLists.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
            No price lists configured yet. Create a wholesale, distributor, or seasonal profile.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 pt-2">
            {priceLists.map(pl => {
              const isSelected = selectedPriceList?.id === pl.id;
              return (
                <div
                  key={pl.id}
                  onClick={() => setSelectedPriceList(pl)}
                  className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${isSelected ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs ring-2 ring-emerald-500/10' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{pl.name}</span>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-1 border-l border-emerald-200 pl-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPriceList(pl);
                          setNewListData({ name: pl.name, description: pl.description || '', is_active: pl.is_active });
                          setShowAddModal(true);
                        }}
                        title="Edit List Profile"
                        className="p-1 hover:bg-emerald-100/60 rounded text-emerald-800"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setListToDelete(pl.id);
                        }}
                        title="Delete List Profile"
                        className="p-1 hover:bg-emerald-100/60 rounded text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Price List Overrides Sheet */}
      {selectedPriceList && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-black text-slate-900">
                  Override Table: {selectedPriceList.name}
                </h4>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {selectedPriceList.description || 'Set custom prices for this profile. Items without an override fallback to standard general prices.'}
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search products..."
                value={searchItem}
                onChange={e => setSearchItem(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Item Name & SKU</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5 text-right">Standard Price</th>
                  <th className="px-6 py-3.5 text-right">Cost</th>
                  <th className="px-6 py-3.5 text-center">Custom Override Price</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredProducts.map(p => {
                  const existingOverride = priceOverrides.find(o => o.product_id === p.id);
                  const currentVal = localOverrides[p.id] !== undefined
                    ? localOverrides[p.id]
                    : (existingOverride?.override_price ?? p.price);
                  
                  const isOverridden = existingOverride !== undefined;
                  const diff = currentVal - p.price;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">{p.sku || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">
                        {p.category || 'General'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {p.price.toLocaleString()} {baseCurrency}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-500">
                        {p.cost ? `${p.cost.toLocaleString()} ${baseCurrency}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input 
                            type="number"
                            step="0.01"
                            value={currentVal}
                            onChange={e => setLocalOverrides({ ...localOverrides, [p.id]: parseFloat(e.target.value) || 0 })}
                            className="w-28 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 text-right focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <span className="text-[10px] text-slate-400 font-bold">{baseCurrency}</span>
                        </div>
                        {diff !== 0 && (
                          <span className={`text-[10px] font-bold mt-1 block ${diff < 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {diff < 0 ? '' : '+'}{diff.toLocaleString()} vs standard
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleSaveOverridePrice(p.id, p.price)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer ${savedSuccessId === p.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'}`}
                        >
                          {savedSuccessId === p.id ? (
                            <>
                              <Check className="w-3 h-3 text-white" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <span>Set Price</span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Price List Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-black text-slate-900">
                {editingPriceList ? 'Edit Price List Profile' : 'New Price List Profile'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure a multi-tier group to apply discounts or markups.
              </p>
            </div>

            <form onSubmit={handleCreateOrUpdateList} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Price List Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. VIP Wholesale Tier or GCC Corporate Rates"
                  value={newListData.name}
                  onChange={e => setNewListData({ ...newListData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea 
                  rows={2}
                  placeholder="Target customer group, eligibility criteria, or seasonal dates..."
                  value={newListData.description}
                  onChange={e => setNewListData({ ...newListData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingPriceList(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                >
                  {editingPriceList ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmation 
        isOpen={!!listToDelete}
        onClose={() => setListToDelete(null)}
        onConfirm={handleDeleteList}
        title="Delete Price List Profile"
        message="Are you sure you want to delete this custom price list profile? All associated price overrides will also be removed."
      />
    </div>
  );
};

export default PriceListsPage;
