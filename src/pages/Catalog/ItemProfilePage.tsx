import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  FileText, 
  Layers, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Tag, 
  CheckCircle2,
  Share2,
  Plus,
  Pencil,
  ExternalLink,
  Copy,
  Info
} from 'lucide-react';
import { useCatalog } from './CatalogContext';
import DeleteConfirmation from '../../components/Common/DeleteConfirmation';
import { ExtendedProduct, ProductPriceListItem, ProductVariant } from './types';

export const ItemProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    products, 
    categories, 
    sops, 
    processMappings, 
    priceLists, 
    baseCurrency, 
    currenciesList, 
    saveProduct, 
    deleteProduct, 
    isSaving,
    savePriceOverride,
    deletePriceOverride,
    fetchProductPriceLists,
    showToast
  } = useCatalog();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const product = products.find(p => p.id.toString() === id);

  // Safe parse variants for view mode
  const productVariants: ProductVariant[] = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.variants)) return product.variants;
    if (typeof product.variants === 'string') {
      try {
        const parsed = JSON.parse(product.variants);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [product]);

  const [editFormData, setEditFormData] = useState<Partial<ExtendedProduct>>({});
  const [editHasVariants, setEditHasVariants] = useState<boolean>(false);
  const [editVariants, setEditVariants] = useState<ProductVariant[]>([]);

  // Price lists state for this item
  const [productPriceLists, setProductPriceLists] = useState<ProductPriceListItem[]>([]);
  const [loadingPriceLists, setLoadingPriceLists] = useState(false);
  const [showPriceListModal, setShowPriceListModal] = useState(false);
  const [editingPriceListItem, setEditingPriceListItem] = useState<ProductPriceListItem | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | ''>('');
  const [overridePriceVal, setOverridePriceVal] = useState<string>('');
  const [priceListToDelete, setPriceListToDelete] = useState<ProductPriceListItem | null>(null);
  const [isSubmittingPriceList, setIsSubmittingPriceList] = useState(false);

  const loadItemPriceLists = useCallback(async () => {
    if (!product?.id) return;
    setLoadingPriceLists(true);
    try {
      const data = await fetchProductPriceLists(product.id);
      setProductPriceLists(data);
    } catch (err) {
      console.error('Error loading product price lists:', err);
    } finally {
      setLoadingPriceLists(false);
    }
  }, [product?.id, fetchProductPriceLists]);

  useEffect(() => {
    if (product) {
      let parsedVars: ProductVariant[] = [];
      if (Array.isArray(product.variants)) {
        parsedVars = product.variants;
      } else if (typeof product.variants === 'string') {
        try {
          const parsed = JSON.parse(product.variants);
          if (Array.isArray(parsed)) parsedVars = parsed;
        } catch {
          parsedVars = [];
        }
      }

      setEditFormData({
        ...product,
        has_variants: product.has_variants || false,
        variants: parsedVars
      });
      setEditHasVariants(product.has_variants || false);
      setEditVariants(parsedVars);
      loadItemPriceLists();
    }
  }, [product, loadItemPriceLists]);

  const handleSetEditHasVariants = (enable: boolean) => {
    setEditHasVariants(enable);
    setEditFormData(prev => ({ ...prev, has_variants: enable }));

    if (enable && editVariants.length === 0) {
      const isService = (editFormData.type || product?.type || 'service') === 'service';
      const initialList: ProductVariant[] = [
        {
          id: `var_${Date.now()}_1`,
          name: isService ? 'Standard Type (e.g. 30-Day Single Entry)' : 'Standard Specification (Type A)',
          sku: editFormData.sku ? `${editFormData.sku}-01` : 'VAR-01',
          price: editFormData.price && editFormData.price > 0 ? editFormData.price : 1500,
          cost: editFormData.cost && editFormData.cost > 0 ? editFormData.cost : 900,
          currency: editFormData.currency || baseCurrency,
          tax: editFormData.tax ?? 15,
          service_duration_hours: 3,
          service_duration_unit: 'days',
          stock_qty: editFormData.stock_qty || 0,
          low_stock_threshold: editFormData.low_stock_threshold || 10,
          notes: ''
        },
        {
          id: `var_${Date.now()}_2`,
          name: isService ? 'Extended Type (e.g. 1-Year Multiple Entry)' : 'Premium Specification (Type B)',
          sku: editFormData.sku ? `${editFormData.sku}-02` : 'VAR-02',
          price: (editFormData.price && editFormData.price > 0 ? editFormData.price : 1500) * 2,
          cost: (editFormData.cost && editFormData.cost > 0 ? editFormData.cost : 900) * 1.8,
          currency: editFormData.currency || baseCurrency,
          tax: editFormData.tax ?? 15,
          service_duration_hours: 5,
          service_duration_unit: 'days',
          stock_qty: editFormData.stock_qty || 0,
          low_stock_threshold: editFormData.low_stock_threshold || 10,
          notes: ''
        }
      ];
      setEditVariants(initialList);
    }
  };

  const handleAddEditVariant = () => {
    const isService = (editFormData.type || product?.type || 'service') === 'service';
    const nextIdx = editVariants.length + 1;
    const newVar: ProductVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `Option / Type ${nextIdx}`,
      sku: editFormData.sku ? `${editFormData.sku}-0${nextIdx}` : `VAR-0${nextIdx}`,
      price: editVariants.length > 0 ? editVariants[editVariants.length - 1].price : 1000,
      cost: editVariants.length > 0 ? editVariants[editVariants.length - 1].cost : 600,
      currency: editFormData.currency || baseCurrency,
      tax: editFormData.tax ?? 15,
      service_duration_hours: isService ? 3 : 0,
      service_duration_unit: 'days',
      stock_qty: 0,
      low_stock_threshold: 10,
      notes: ''
    };
    setEditVariants(prev => [...prev, newVar]);
  };

  const handleDuplicateEditVariant = (source: ProductVariant) => {
    const cloned: ProductVariant = {
      ...source,
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${source.name} (Copy)`,
      sku: source.sku ? `${source.sku}-COPY` : ''
    };
    setEditVariants(prev => [...prev, cloned]);
  };

  const handleUpdateEditVariant = (varId: string, field: keyof ProductVariant, val: any) => {
    setEditVariants(prev => prev.map(v => (v.id === varId ? { ...v, [field]: val } : v)));
  };

  const handleRemoveEditVariant = (varId: string) => {
    if (editVariants.length <= 1) return;
    setEditVariants(prev => prev.filter(v => v.id !== varId));
  };

  const handleOpenAddPriceList = () => {
    setEditingPriceListItem(null);
    const unassignedList = priceLists.find(pl => !productPriceLists.some(item => item.price_list_id === pl.id));
    setSelectedListId(unassignedList ? unassignedList.id : (priceLists[0]?.id || ''));
    setOverridePriceVal(product?.price !== undefined ? product.price.toString() : '0');
    setShowPriceListModal(true);
  };

  const handleOpenEditPriceList = (item: ProductPriceListItem) => {
    setEditingPriceListItem(item);
    setSelectedListId(item.price_list_id);
    setOverridePriceVal(item.override_price.toString());
    setShowPriceListModal(true);
  };

  const handleSavePriceListOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !selectedListId) return;
    const priceNum = parseFloat(overridePriceVal);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid non-negative price', 'error');
      return;
    }
    setIsSubmittingPriceList(true);
    const success = await savePriceOverride(Number(selectedListId), product.id, priceNum);
    setIsSubmittingPriceList(false);
    if (success) {
      setShowPriceListModal(false);
      await loadItemPriceLists();
    }
  };

  const handleDeletePriceListOverride = async () => {
    if (!product || !priceListToDelete) return;
    const success = await deletePriceOverride(priceListToDelete.price_list_id, product.id);
    if (success) {
      setPriceListToDelete(null);
      await loadItemPriceLists();
    }
  };

  if (!product) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center max-w-lg mx-auto space-y-4">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Item Not Found</h3>
        <p className="text-xs text-slate-500">
          The requested catalog item # {id} could not be located in the current database.
        </p>
        <button
          onClick={() => navigate('/catalog/items')}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
        >
          Return to Items Directory
        </button>
      </div>
    );
  }

  const cost = product.cost || 0;
  const price = product.price || 0;
  const netMargin = price - cost;
  const marginPct = price > 0 ? Math.round((netMargin / price) * 100) : 0;
  const isLowStock = product.type === 'product' && (product.stock_qty || 0) <= (product.low_stock_threshold || 10);

  const mappedSop = sops.find(s => s.id === product.sop_id);
  const mappedProcess = processMappings.find(pm => pm.id === product.process_mapping_id);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name?.trim()) return;

    const payload: Partial<ExtendedProduct> = {
      ...editFormData,
      id: product.id,
      has_variants: editHasVariants,
      variants: editHasVariants ? editVariants : []
    };

    if (editHasVariants && editVariants.length > 0) {
      payload.price = editVariants[0].price;
      payload.cost = editVariants[0].cost;
      payload.currency = editVariants[0].currency || editFormData.currency || baseCurrency;
      payload.tax = editVariants[0].tax ?? editFormData.tax ?? 15;
      if (editFormData.type === 'service') {
        payload.service_duration_hours = editVariants[0].service_duration_hours;
        payload.service_duration_unit = editVariants[0].service_duration_unit;
      } else {
        payload.stock_qty = editVariants.reduce((sum, v) => sum + (v.stock_qty || 0), 0);
      }
    }

    const saved = await saveProduct(payload);
    if (saved) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    const success = await deleteProduct(product.id);
    if (success) {
      navigate('/catalog/items');
    }
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Back and Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/catalog/items')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Items Directory</span>
        </button>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Edit Specifications</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditFormData({ ...product });
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel Editing</span>
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        /* Edit Mode Form */
        <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-8">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">Editing Specifications</h3>
              <p className="text-xs text-slate-500 mt-1">Item #{product.id} — {product.name}</p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-mono font-bold">
              {product.sku || 'NO-SKU'}
            </span>
          </div>

          {/* Section 1: Classification & Basic Specs */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              1. Classification & Basic Specs
            </h4>

            {/* Row: Item Type & Item Structure (Variants Model Radio Box) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Item Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Item Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, type: 'product' })}
                    className={`py-3 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      editFormData.type === 'product' 
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Physical Product</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, type: 'service' })}
                    className={`py-3 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      editFormData.type === 'service' 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Service Solution</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Select whether this offering represents tangible inventory or an operational service/procedure.
                </p>
              </div>

              {/* Column 2: Item Structure / Variants Toggle (Radio Box) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Does this Item have Multiple Types / Variations?
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Specification Structure
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Radio Option 1: No */}
                  <label
                    className={`relative flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      !editHasVariants
                        ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="edit_has_variants_toggle"
                      checked={!editHasVariants}
                      onChange={() => handleSetEditHasVariants(false)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-slate-800">No (Single Standard Item)</span>
                      <span className="block text-[10px] text-slate-500">Uniform rate & turnaround</span>
                    </div>
                  </label>

                  {/* Radio Option 2: Yes */}
                  <label
                    className={`relative flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                      editHasVariants
                        ? 'bg-blue-50/80 border-blue-600 text-blue-950 shadow-xs ring-1 ring-blue-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="edit_has_variants_toggle"
                      checked={editHasVariants}
                      onChange={() => handleSetEditHasVariants(true)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-blue-950">Yes (Has Multiple Types)</span>
                      <span className="block text-[10px] text-blue-700 font-medium">Distinct price, cost & time</span>
                    </div>
                  </label>
                </div>

                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enable if this item has multiple sub-types (e.g. Saudi Visa with different validity, selling prices, costs, and processing times).
                </p>
              </div>
            </div>

            {/* Core Basic Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={editFormData.name || ''}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Catalog Code</label>
                <input 
                  type="text"
                  value={editFormData.sku || ''}
                  onChange={e => setEditFormData({ ...editFormData, sku: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <input 
                type="text"
                list="edit-categories"
                value={editFormData.category || ''}
                onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <datalist id="edit-categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description / Scope of Work</label>
              <textarea 
                rows={3}
                value={editFormData.description || ''}
                onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* DYNAMIC SUB-TYPES & VARIANTS SPECIFICATION MATRIX (EDIT MODE) */}
            {editHasVariants && (
              <div className="p-6 bg-gradient-to-br from-blue-50/50 via-slate-50/70 to-indigo-50/40 rounded-3xl border border-blue-200 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-blue-600 text-white rounded-xl shadow-xs">
                        <Layers className="w-4 h-4" />
                      </span>
                      <h5 className="text-sm font-black text-slate-900 tracking-tight">
                        Sub-types & Variations Specification Matrix
                      </h5>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                        {editVariants.length} {editVariants.length === 1 ? 'Type Configured' : 'Types Configured'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 max-w-2xl">
                      Each sub-type row below carries its dedicated selling price, direct cost, currency, VAT rate, and execution timeframe / inventory metrics.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEditVariant}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Type / Variant</span>
                  </button>
                </div>

                {/* Table of Variant Rows */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3 min-w-[220px]">
                          <span className="block">Type / Sub-Type Name *</span>
                          <span className="text-[9px] text-slate-400 font-semibold normal-case">e.g. 30-Day, 1-Year, Express</span>
                        </th>
                        <th className="p-3 min-w-[120px]">
                          <span className="block">SKU / Code</span>
                          <span className="text-[9px] text-slate-400 font-semibold normal-case">Sub-Code</span>
                        </th>
                        <th className="p-3 min-w-[130px] bg-blue-50/50">
                          <span className="block text-blue-900">Selling Price *</span>
                          <span className="text-[9px] text-blue-500 font-semibold normal-case">Financials</span>
                        </th>
                        <th className="p-3 min-w-[120px] bg-blue-50/50">
                          <span className="block text-blue-900">Direct Cost</span>
                          <span className="text-[9px] text-blue-500 font-semibold normal-case">Operational Cost</span>
                        </th>
                        <th className="p-3 min-w-[100px] bg-blue-50/50">
                          <span className="block text-blue-900">Currency</span>
                          <span className="text-[9px] text-blue-500 font-semibold normal-case">Per-type FX</span>
                        </th>
                        <th className="p-3 min-w-[90px] bg-blue-50/50">
                          <span className="block text-blue-900">VAT (%)</span>
                          <span className="text-[9px] text-blue-500 font-semibold normal-case">Tax Rate</span>
                        </th>
                        <th className="p-3 min-w-[160px] bg-indigo-50/40">
                          <span className="block text-indigo-900">
                            {editFormData.type === 'service' ? 'Fulfillment Time (TAT)' : 'Stock & Threshold'}
                          </span>
                          <span className="text-[9px] text-indigo-500 font-semibold normal-case">
                            {editFormData.type === 'service' ? 'Service Duration' : 'Inventory Tracking'}
                          </span>
                        </th>
                        <th className="p-3 min-w-[130px] bg-emerald-50/40">
                          <span className="block text-emerald-900">Net Margin</span>
                          <span className="text-[9px] text-emerald-600 font-semibold normal-case">Unit Profit & Markup</span>
                        </th>
                        <th className="p-3 w-20 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editVariants.map((variant, index) => {
                        const margin = (variant.price || 0) - (variant.cost || 0);
                        const markup = (variant.price || 0) > 0 ? Math.round((margin / variant.price) * 100) : 0;
                        return (
                          <tr key={variant.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3 text-slate-400 font-bold text-center">{index + 1}</td>
                            
                            {/* Variant Name */}
                            <td className="p-3">
                              <input
                                type="text"
                                required
                                placeholder="e.g. 1-Year Multiple Entry Visa"
                                value={variant.name}
                                onChange={e => handleUpdateEditVariant(variant.id, 'name', e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            {/* SKU */}
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="e.g. KSA-V1Y"
                                value={variant.sku || ''}
                                onChange={e => handleUpdateEditVariant(variant.id, 'sku', e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            {/* Selling Price */}
                            <td className="p-3 bg-blue-50/20">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                placeholder="0.00"
                                value={variant.price}
                                onChange={e => handleUpdateEditVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            {/* Direct Cost */}
                            <td className="p-3 bg-blue-50/20">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={variant.cost}
                                onChange={e => handleUpdateEditVariant(variant.id, 'cost', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            {/* Currency */}
                            <td className="p-3 bg-blue-50/20">
                              <select
                                value={variant.currency || editFormData.currency || baseCurrency}
                                onChange={e => handleUpdateEditVariant(variant.id, 'currency', e.target.value)}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {currenciesList.map(c => (
                                  <option key={c.code} value={c.code}>{c.code}</option>
                                ))}
                              </select>
                            </td>

                            {/* VAT % */}
                            <td className="p-3 bg-blue-50/20">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={variant.tax ?? editFormData.tax ?? 15}
                                onChange={e => handleUpdateEditVariant(variant.id, 'tax', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>

                            {/* Duration (Service) or Stock (Product) */}
                            <td className="p-3 bg-indigo-50/20">
                              {editFormData.type === 'service' ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="Time"
                                    value={variant.service_duration_hours ?? 1}
                                    onChange={e => handleUpdateEditVariant(variant.id, 'service_duration_hours', parseFloat(e.target.value) || 0)}
                                    className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                                    title="Duration Value"
                                  />
                                  <select
                                    value={variant.service_duration_unit || 'days'}
                                    onChange={e => handleUpdateEditVariant(variant.id, 'service_duration_unit', e.target.value)}
                                    className="w-20 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                                  >
                                    <option value="days">Days</option>
                                    <option value="hours">Hours</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Stock"
                                    value={variant.stock_qty || 0}
                                    onChange={e => handleUpdateEditVariant(variant.id, 'stock_qty', parseInt(e.target.value) || 0)}
                                    className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                    title="Stock Quantity"
                                  />
                                  <span className="text-[10px] text-slate-400">/ Min:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="10"
                                    value={variant.low_stock_threshold || 10}
                                    onChange={e => handleUpdateEditVariant(variant.id, 'low_stock_threshold', parseInt(e.target.value) || 0)}
                                    className="w-14 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                                    title="Low Stock Alert Threshold"
                                  />
                                </div>
                              )}
                            </td>

                            {/* Net Margin */}
                            <td className="p-3 bg-emerald-50/20">
                              <div className="flex flex-col">
                                <span className="font-mono font-bold text-slate-900 text-[11px]">
                                  {margin.toLocaleString()} {variant.currency || editFormData.currency || baseCurrency}
                                </span>
                                <span className={`text-[9px] font-black ${margin >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                  {markup}% markup
                                </span>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateEditVariant(variant)}
                                  title="Duplicate this sub-type"
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEditVariant(variant.id)}
                                  disabled={editVariants.length <= 1}
                                  title={editVariants.length <= 1 ? "At least one type is required" : "Remove this sub-type"}
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-white/70 px-3.5 py-2 rounded-xl border border-blue-100">
                    <span className="font-bold">
                      Active Sub-Types: <strong className="text-slate-900">{editVariants.length}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Price Range: <strong className="text-emerald-700">
                        {editVariants.length > 0 ? `${Math.min(...editVariants.map(v => Number(v.price) || 0)).toLocaleString()} - ${Math.max(...editVariants.map(v => Number(v.price) || 0)).toLocaleString()} ${editVariants[0]?.currency || editFormData.currency || baseCurrency}` : 'N/A'}
                      </strong>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEditVariant}
                    className="px-4 py-2 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-2xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Type</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Financials & Margins */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                2. Financials, Currency & VAT
              </h4>
              {editHasVariants && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Governed Per Sub-Type Above
                </span>
              )}
            </div>

            {editHasVariants && (
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-800 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <strong className="block font-bold">Sub-types Pricing Matrix Active:</strong>
                  <span>
                    Each variant defines its own selling price, direct cost, and VAT. The baseline values below act as default fallback parameters for global catalog indexes.
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editHasVariants ? 'Baseline Selling Price' : 'Selling Price'} <span className="text-red-500">*</span>
                </label>
                <input 
                  type="number"
                  step="0.01"
                  required={!editHasVariants}
                  value={editFormData.price || 0}
                  onChange={e => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Currency</label>
                <select
                  value={editFormData.currency || baseCurrency}
                  onChange={e => setEditFormData({ ...editFormData, currency: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  {currenciesList.map(c => (
                    <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editHasVariants ? 'Baseline Direct Cost' : 'Production / Direct Cost'}
                </label>
                <input 
                  type="number"
                  step="0.01"
                  value={editFormData.cost || 0}
                  onChange={e => setEditFormData({ ...editFormData, cost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Standard VAT Rate (%)</label>
                <input 
                  type="number"
                  value={editFormData.tax || 0}
                  onChange={e => setEditFormData({ ...editFormData, tax: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={editFormData.is_cost_variable || false}
                  onChange={e => setEditFormData({ ...editFormData, is_cost_variable: e.target.checked })}
                  className="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500"
                />
                <span>Variable Operational Cost (Fluctuates by project or vendor)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={editFormData.is_price_variable || false}
                  onChange={e => setEditFormData({ ...editFormData, is_price_variable: e.target.checked })}
                  className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
                />
                <span>Variable Selling Price (Customizable upon quotation)</span>
              </label>
            </div>
          </div>

          {/* Section 3: Operational & Inventory Metrics */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                3. Operational & Inventory Metrics
              </h4>
              {editHasVariants && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Turnaround Metrics Per Variant
                </span>
              )}
            </div>

            {editFormData.type === 'product' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editHasVariants ? 'Master Aggregated Stock' : 'Stock Quantity'}
                  </label>
                  <input 
                    type="number"
                    value={editFormData.stock_qty || 0}
                    onChange={e => setEditFormData({ ...editFormData, stock_qty: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Low Stock Alert Threshold
                  </label>
                  <input 
                    type="number"
                    value={editFormData.low_stock_threshold || 10}
                    onChange={e => setEditFormData({ ...editFormData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editHasVariants ? 'Baseline Execution Duration' : 'Estimated Service Duration'}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="number"
                      step="0.5"
                      min="0"
                      value={editFormData.service_duration_hours ?? 1}
                      onChange={e => setEditFormData({ ...editFormData, service_duration_hours: parseFloat(e.target.value) || 0 })}
                      placeholder="e.g. 1"
                      className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <select
                      value={editFormData.service_duration_unit || 'days'}
                      onChange={e => setEditFormData({ ...editFormData, service_duration_unit: e.target.value as 'hours' | 'days' })}
                      className="w-32 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="days">Days (days)</option>
                      <option value="hours">Hours (hrs)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Linked SOP Guidelines
                  </label>
                  <select
                    value={editFormData.sop_id || ''}
                    onChange={e => setEditFormData({ ...editFormData, sop_id: e.target.value ? parseInt(e.target.value) : null })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="">-- None --</option>
                    {sops.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Linked Process Mapping Architecture
              </label>
              <select
                value={editFormData.process_mapping_id || ''}
                onChange={e => setEditFormData({ ...editFormData, process_mapping_id: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="">-- None --</option>
                {processMappings.map(pm => <option key={pm.id} value={pm.id}>{pm.title}</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* View Specifications Mode */
        <div className="space-y-6">
          {/* Main Title & Type Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${product.type === 'product' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                    {product.type === 'product' ? 'Physical Product' : 'Service Solution'}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    SKU: {product.sku || 'N/A'}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                    Category: {product.category || 'General'}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900">{product.name}</h2>
                <p className="text-xs text-slate-500 mt-2 max-w-2xl leading-relaxed">
                  {product.description || 'No detailed scope of work or item description provided.'}
                </p>
              </div>

              {/* Badges for variable settings */}
              <div className="flex flex-wrap gap-2">
                {product.is_cost_variable && (
                  <span className="px-3 py-1 bg-pink-50 text-pink-700 border border-pink-200 rounded-xl text-xs font-bold">
                    Variable Cost
                  </span>
                )}
                {product.is_price_variable && (
                  <span className="px-3 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-xs font-bold">
                    Variable Price
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sub-types & Variations Specification Matrix (View Mode) */}
          {(product.has_variants || productVariants.length > 0) && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">
                        Sub-types & Variations Specification Matrix
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                        {productVariants.length} {productVariants.length === 1 ? 'Type Configured' : 'Types Configured'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Each sub-type below has dedicated selling prices, operational costs, currency, and execution timeframes.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Sub-Types</span>
                </button>
              </div>

              {/* Table of Variants */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3 min-w-[200px]">Sub-Type Name</th>
                      <th className="p-3 min-w-[110px]">SKU / Code</th>
                      <th className="p-3 min-w-[120px] bg-blue-50/30">Selling Price</th>
                      <th className="p-3 min-w-[110px] bg-blue-50/30">Direct Cost</th>
                      <th className="p-3 min-w-[80px] bg-blue-50/30">Currency</th>
                      <th className="p-3 min-w-[70px] bg-blue-50/30">VAT (%)</th>
                      <th className="p-3 min-w-[150px] bg-indigo-50/30">
                        {product.type === 'service' ? 'Fulfillment Time (TAT)' : 'Stock Level'}
                      </th>
                      <th className="p-3 min-w-[120px] bg-emerald-50/30">Unit Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productVariants.map((v, i) => {
                      const vMargin = (v.price || 0) - (v.cost || 0);
                      const vMarkup = (v.price || 0) > 0 ? Math.round((vMargin / v.price) * 100) : 0;
                      return (
                        <tr key={v.id || i} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 text-slate-400 font-bold text-center">{i + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{v.name}</td>
                          <td className="p-3 font-mono text-slate-500">{v.sku || '—'}</td>
                          <td className="p-3 font-black text-slate-900 bg-blue-50/10">
                            {Number(v.price || 0).toLocaleString()} {v.currency || product.currency || baseCurrency}
                          </td>
                          <td className="p-3 font-bold text-slate-600 bg-blue-50/10">
                            {Number(v.cost || 0).toLocaleString()} {v.currency || product.currency || baseCurrency}
                          </td>
                          <td className="p-3 font-bold text-slate-700 bg-blue-50/10">{v.currency || product.currency || baseCurrency}</td>
                          <td className="p-3 font-bold text-slate-700 bg-blue-50/10">{v.tax ?? product.tax ?? 15}%</td>
                          <td className="p-3 bg-indigo-50/10">
                            {product.type === 'service' ? (
                              <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {v.service_duration_hours || 1} {v.service_duration_unit || 'days'}
                              </span>
                            ) : (
                              <span className="font-bold text-slate-800">
                                {v.stock_qty || 0} Units (Min: {v.low_stock_threshold || 10})
                              </span>
                            )}
                          </td>
                          <td className="p-3 bg-emerald-50/10">
                            <span className="font-bold text-emerald-700 block">
                              +{vMargin.toLocaleString()} {v.currency || product.currency || baseCurrency}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              {vMarkup}% markup
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {productVariants.length > 0 ? 'Selling Price Range' : 'General Selling Price'}
              </span>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {productVariants.length > 0 ? (
                  (() => {
                    const prices = productVariants.map(v => Number(v.price) || 0);
                    const minP = Math.min(...prices);
                    const maxP = Math.max(...prices);
                    const curr = productVariants[0]?.currency || product.currency || baseCurrency;
                    return minP === maxP 
                      ? `${minP.toLocaleString()} ${curr}`
                      : `${minP.toLocaleString()} - ${maxP.toLocaleString()} ${curr}`;
                  })()
                ) : (
                  `${price.toLocaleString()} ${product.currency || baseCurrency}`
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                {productVariants.length > 0 ? `${productVariants.length} sub-types configured` : 'Excluding Tax VAT'}
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {productVariants.length > 0 ? 'Direct Cost Range' : 'Production / Direct Cost'}
              </span>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {productVariants.length > 0 ? (
                  (() => {
                    const costs = productVariants.map(v => Number(v.cost) || 0);
                    const minC = Math.min(...costs);
                    const maxC = Math.max(...costs);
                    const curr = productVariants[0]?.currency || product.currency || baseCurrency;
                    return minC === maxC 
                      ? `${minC.toLocaleString()} ${curr}`
                      : `${minC.toLocaleString()} - ${maxC.toLocaleString()} ${curr}`;
                  })()
                ) : (
                  `${cost.toLocaleString()} ${product.currency || baseCurrency}`
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Operational fulfillment costs</span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Net Unit Profit</span>
              <div className={`text-2xl font-black mt-2 ${netMargin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {netMargin >= 0 ? '+' : ''}{netMargin.toLocaleString()} <span className="text-xs font-bold text-slate-400">{product.currency || baseCurrency}</span>
              </div>
              <span className={`text-[10px] font-black mt-1 block ${netMargin >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {marginPct}% Profit Margin
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tax VAT & Regulation</span>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {product.tax || 0}%
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Total with VAT: {Math.round(price * (1 + (product.tax || 0) / 100)).toLocaleString()} {product.currency || baseCurrency}
              </span>
            </div>
          </div>

          {/* Operational Metrics & Linkages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inventory or Duration */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                {product.type === 'product' ? 'Physical Inventory Tracking' : 'Service Delivery Parameters'}
              </h4>

              {product.type === 'product' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-bold text-slate-600">Current Stock On-Hand</span>
                    <span className="text-sm font-black text-slate-900">{product.stock_qty || 0} Units</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-bold text-slate-600">Low Stock Safety Threshold</span>
                    <span className="text-sm font-bold text-slate-700">{product.low_stock_threshold || 10} Units</span>
                  </div>

                  {isLowStock && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse" />
                      <span>Warning: Stock on hand is at or below minimum threshold!</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                    <span className="text-xs font-bold text-slate-600">Standard Service Duration</span>
                    <span className="text-sm font-black text-indigo-700">
                      {product.service_duration_hours || 1} {product.service_duration_unit === 'days' ? ((product.service_duration_hours || 1) === 1 ? 'Day' : 'Days') : ((product.service_duration_hours || 1) === 1 ? 'Hour' : 'Hours')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {product.service_duration_unit === 'days'
                      ? 'Turnaround delivery days are integrated with project dispatch and client SLA milestones.'
                      : 'Work billable hours are tracked and integrated with project dispatch and CRM invoicing.'}
                  </p>
                </div>
              )}
            </div>

            {/* Quality & Process Linkages */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                Operational Standard Linkages
              </h4>

              <div className="space-y-3">
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                      Standard Operating Procedure (SOP)
                    </span>
                    {mappedSop ? (
                      <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                        {mappedSop.title} (SOP #{mappedSop.id})
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        No SOP linked to this catalog item.
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-3">
                  <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 block">
                      Process Mapping Architecture
                    </span>
                    {mappedProcess ? (
                      <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                        {mappedProcess.title} (Process #{mappedProcess.id})
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        No process workflow attached.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Lists & Multi-Tier Pricing Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">Price Lists & Multi-Tier Pricing</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                      {productPriceLists.length} {productPriceLists.length === 1 ? 'Tier Assigned' : 'Tiers Assigned'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tiered pricing assigned to this item for wholesale, partners, VIP clients, or regional distributor agreements.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenAddPriceList}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign to Price List</span>
                </button>
              </div>
            </div>

            {loadingPriceLists ? (
              <div className="py-8 text-center text-xs font-bold text-slate-400">
                Loading item price lists...
              </div>
            ) : productPriceLists.length === 0 ? (
              <div className="p-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl space-y-3">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
                  <Tag className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-slate-800">No Custom Price Lists Assigned</h5>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    This item currently sells at its base standard price of <span className="font-bold text-slate-900">{product.price.toLocaleString()} {product.currency || baseCurrency}</span> across all standard orders.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddPriceList}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign First Price List</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productPriceLists.map(plItem => {
                  const diff = plItem.override_price - (product.price || 0);
                  const diffPercent = product.price > 0 ? (diff / product.price) * 100 : 0;
                  const unitProfit = plItem.override_price - (product.cost || 0);
                  const tierMargin = plItem.override_price > 0 ? (unitProfit / plItem.override_price) * 100 : 0;

                  return (
                    <div 
                      key={plItem.id} 
                      className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4.5 space-y-3.5 hover:border-indigo-200 hover:bg-white hover:shadow-xs transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-slate-900">
                              {plItem.price_list_name || `Price List #${plItem.price_list_id}`}
                            </span>
                            {plItem.price_list_active === false ? (
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold">Inactive</span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold">Active</span>
                            )}
                          </div>
                          {plItem.price_list_description && (
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                              {plItem.price_list_description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPriceList(plItem)}
                            title="Edit Override Price"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPriceListToDelete(plItem)}
                            title="Remove from this Price List"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Price Display */}
                      <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Tier Selling Price
                        </div>
                        <div className="flex items-baseline justify-between">
                          <div className="text-lg font-black text-slate-900">
                            {plItem.override_price.toLocaleString()} <span className="text-xs font-semibold text-slate-500">{product.currency || baseCurrency}</span>
                          </div>
                          
                          {diff === 0 ? (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              Base price
                            </span>
                          ) : diff < 0 ? (
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                              {diffPercent.toFixed(1)}% ({diff.toLocaleString()} {product.currency || baseCurrency})
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                              +{diffPercent.toFixed(1)}% (+{diff.toLocaleString()} {product.currency || baseCurrency})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Profitability under this tier */}
                      <div className="pt-1 text-[11px] flex items-center justify-between text-slate-500 font-medium">
                        <span>Est. Margin: <strong className={tierMargin >= 20 ? 'text-emerald-700 font-bold' : tierMargin > 0 ? 'text-amber-700 font-bold' : 'text-red-700 font-bold'}>{tierMargin.toFixed(1)}%</strong></span>
                        <span>Unit Profit: <strong className="text-slate-800 font-bold">{unitProfit >= 0 ? '+' : ''}{unitProfit.toLocaleString()} {product.currency || baseCurrency}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Price List Override Modal */}
      {showPriceListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingPriceListItem ? 'Edit Price List Override' : 'Assign to Price List'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {product.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPriceListModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePriceListOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Price List
                </label>
                {priceLists.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                    <p>No price lists created yet in your organization.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/catalog/pricing/price-lists')}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Create price lists in Pricing settings <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedListId}
                    onChange={e => setSelectedListId(Number(e.target.value))}
                    disabled={!!editingPriceListItem}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">-- Select Price List --</option>
                    {priceLists.map(pl => {
                      const alreadyAssigned = productPriceLists.some(item => item.price_list_id === pl.id);
                      return (
                        <option key={pl.id} value={pl.id}>
                          {pl.name} {alreadyAssigned ? '(Assigned)' : ''}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Tier Override Price ({product.currency || baseCurrency})
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    Base: {product.price.toLocaleString()} {product.currency || baseCurrency}
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={overridePriceVal}
                  onChange={e => setOverridePriceVal(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Enter custom selling price"
                />

                {/* Quick discount presets */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-400 mr-1">Presets:</span>
                  {[
                    { label: '-5%', factor: 0.95 },
                    { label: '-10%', factor: 0.90 },
                    { label: '-15%', factor: 0.85 },
                    { label: '-20%', factor: 0.80 },
                    { label: 'Base', factor: 1.0 },
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setOverridePriceVal(((product.price || 0) * preset.factor).toFixed(2))}
                      className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                  {Boolean(product.cost && product.cost > 0) && (
                    <button
                      type="button"
                      onClick={() => setOverridePriceVal(((product.cost || 0) * 1.25).toFixed(2))}
                      className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg text-[10px] font-bold text-slate-600 transition-colors cursor-pointer"
                    >
                      Cost + 25%
                    </button>
                  )}
                </div>
              </div>

              {/* Real-time calculated preview */}
              {(() => {
                const parsedVal = parseFloat(overridePriceVal);
                if (isNaN(parsedVal)) return null;
                const diff = parsedVal - (product.price || 0);
                const diffPct = product.price > 0 ? (diff / product.price) * 100 : 0;
                const profit = parsedVal - (product.cost || 0);
                const margin = parsedVal > 0 ? (profit / parsedVal) * 100 : 0;

                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Variance from Base:</span>
                      <span className={`font-bold ${diff < 0 ? 'text-emerald-700' : diff > 0 ? 'text-blue-700' : 'text-slate-700'}`}>
                        {diff < 0 ? `${diffPct.toFixed(1)}% Discount` : diff > 0 ? `+${diffPct.toFixed(1)}% Markup` : 'Standard Price'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Projected Margin:</span>
                      <span className="font-bold text-slate-900">
                        {margin.toFixed(1)}% (Profit: {profit >= 0 ? '+' : ''}{profit.toFixed(2)} {product.currency || baseCurrency})
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPriceListModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPriceList || !selectedListId}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {isSubmittingPriceList ? 'Saving...' : editingPriceListItem ? 'Update Override' : 'Save & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Price List override confirmation */}
      <DeleteConfirmation
        isOpen={!!priceListToDelete}
        onClose={() => setPriceListToDelete(null)}
        onConfirm={handleDeletePriceListOverride}
        title="Remove Price List Override"
        message={`Remove "${priceListToDelete?.price_list_name || 'this price list'}" pricing override for ${product.name}? Standard catalog price (${product.price.toLocaleString()} ${product.currency || baseCurrency}) will apply.`}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmation 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Catalog Item"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ItemProfilePage;
