import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Save, 
  Sparkles, 
  DollarSign, 
  Clock, 
  Layers, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  Tag,
  TrendingUp,
  Info
} from 'lucide-react';
import { useCatalog } from './CatalogContext';
import { ExtendedProduct, ProductVariant } from './types';

export const ItemFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    categories, 
    sops, 
    processMappings, 
    currenciesList, 
    baseCurrency, 
    saveProduct, 
    isSaving 
  } = useCatalog();

  const [hasVariants, setHasVariants] = useState<boolean>(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const [formData, setFormData] = useState<Partial<ExtendedProduct>>({
    name: '',
    sku: '',
    type: 'service', // Default to service solution as per common user operations (e.g., Visas/Consulting)
    price: 0,
    cost: 0,
    tax: 15,
    currency: baseCurrency,
    category: '',
    description: '',
    stock_qty: 0,
    low_stock_threshold: 10,
    service_duration_hours: 1,
    service_duration_unit: 'days',
    sop_id: null,
    process_mapping_id: null,
    is_cost_variable: false,
    is_price_variable: false,
    has_variants: false,
    variants: []
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toggle Has Variants model with sensible starter templates
  const handleSetHasVariants = (enable: boolean) => {
    setHasVariants(enable);
    setFormData(prev => ({ ...prev, has_variants: enable }));

    if (enable && variants.length === 0) {
      const isService = (formData.type || 'service') === 'service';
      const initialList: ProductVariant[] = [
        {
          id: `var_${Date.now()}_1`,
          name: isService ? 'Standard Type (e.g. 30-Day Single Entry)' : 'Standard Specification (Type A)',
          sku: formData.sku ? `${formData.sku}-01` : 'VAR-01',
          price: formData.price && formData.price > 0 ? formData.price : 1500,
          cost: formData.cost && formData.cost > 0 ? formData.cost : 900,
          currency: formData.currency || baseCurrency,
          tax: formData.tax ?? 15,
          service_duration_hours: 3,
          service_duration_unit: 'days',
          stock_qty: formData.stock_qty || 0,
          low_stock_threshold: formData.low_stock_threshold || 10,
          notes: ''
        },
        {
          id: `var_${Date.now()}_2`,
          name: isService ? 'Extended Type (e.g. 1-Year Multiple Entry)' : 'Premium Specification (Type B)',
          sku: formData.sku ? `${formData.sku}-02` : 'VAR-02',
          price: (formData.price && formData.price > 0 ? formData.price : 1500) * 2,
          cost: (formData.cost && formData.cost > 0 ? formData.cost : 900) * 1.8,
          currency: formData.currency || baseCurrency,
          tax: formData.tax ?? 15,
          service_duration_hours: 5,
          service_duration_unit: 'days',
          stock_qty: formData.stock_qty || 0,
          low_stock_threshold: formData.low_stock_threshold || 10,
          notes: ''
        }
      ];
      setVariants(initialList);
    }
  };

  // Add new variant row
  const handleAddVariant = () => {
    const isService = (formData.type || 'service') === 'service';
    const nextIdx = variants.length + 1;
    const newVar: ProductVariant = {
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `Option / Type ${nextIdx}`,
      sku: formData.sku ? `${formData.sku}-0${nextIdx}` : `VAR-0${nextIdx}`,
      price: variants.length > 0 ? variants[variants.length - 1].price : 1000,
      cost: variants.length > 0 ? variants[variants.length - 1].cost : 600,
      currency: formData.currency || baseCurrency,
      tax: formData.tax ?? 15,
      service_duration_hours: isService ? 3 : 0,
      service_duration_unit: 'days',
      stock_qty: 0,
      low_stock_threshold: 10,
      notes: ''
    };
    setVariants(prev => [...prev, newVar]);
  };

  // Duplicate an existing variant
  const handleDuplicateVariant = (source: ProductVariant) => {
    const cloned: ProductVariant = {
      ...source,
      id: `var_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${source.name} (Copy)`,
      sku: source.sku ? `${source.sku}-COPY` : ''
    };
    setVariants(prev => [...prev, cloned]);
  };

  // Update specific field in variant
  const handleUpdateVariant = (id: string, field: keyof ProductVariant, val: any) => {
    setVariants(prev => prev.map(v => (v.id === id ? { ...v, [field]: val } : v)));
  };

  // Remove variant
  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) return;
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  // Price range summary calculation
  const getVariantPriceRange = () => {
    if (variants.length === 0) return 'N/A';
    const prices = variants.map(v => Number(v.price) || 0);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const curr = variants[0]?.currency || formData.currency || baseCurrency;
    if (min === max) return `${min.toLocaleString()} ${curr}`;
    return `${min.toLocaleString()} - ${max.toLocaleString()} ${curr}`;
  };

  // Duration range summary
  const getVariantDurationRange = () => {
    if (variants.length === 0) return 'N/A';
    const durations = variants.map(v => Number(v.service_duration_hours) || 0);
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    const unit = variants[0]?.service_duration_unit || 'days';
    if (min === max) return `${min} ${unit}`;
    return `${min} - ${max} ${unit}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name?.trim()) {
      setErrorMsg('Item name is required.');
      return;
    }

    if (hasVariants) {
      if (variants.length === 0) {
        setErrorMsg('Please configure at least one sub-type / variant for this item.');
        return;
      }
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        if (!v.name.trim()) {
          setErrorMsg(`Please specify a name for Type #${i + 1}`);
          return;
        }
        if (Number(v.price) < 0) {
          setErrorMsg(`Selling price for Type #${i + 1} cannot be negative.`);
          return;
        }
      }
    } else {
      if ((formData.price ?? 0) < 0) {
        setErrorMsg('Price cannot be negative.');
        return;
      }
    }

    // Prepare final payload
    const finalPayload: Partial<ExtendedProduct> = {
      ...formData,
      has_variants: hasVariants,
      variants: hasVariants ? variants : []
    };

    // If variants are enabled, sync baseline price and cost to first variant for consistency
    if (hasVariants && variants.length > 0) {
      finalPayload.price = variants[0].price;
      finalPayload.cost = variants[0].cost;
      finalPayload.currency = variants[0].currency || formData.currency || baseCurrency;
      finalPayload.tax = variants[0].tax ?? formData.tax ?? 15;
      if (formData.type === 'service') {
        finalPayload.service_duration_hours = variants[0].service_duration_hours;
        finalPayload.service_duration_unit = variants[0].service_duration_unit;
      } else {
        finalPayload.stock_qty = variants.reduce((sum, v) => sum + (v.stock_qty || 0), 0);
      }
    }

    const saved = await saveProduct(finalPayload);
    if (saved && saved.id) {
      navigate(`/catalog/items/${saved.id}`);
    } else if (saved) {
      navigate('/catalog/items');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left animate-in fade-in duration-300">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/catalog/items')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Items Directory</span>
        </button>

        <span className="text-xs font-mono font-bold text-slate-400">
          Drafting New Catalog Specification
        </span>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs space-y-8">
        <div>
          <h3 className="text-xl font-black text-slate-900">Add Product or Service</h3>
          <p className="text-xs text-slate-500 mt-1">
            Define basic attributes, pricing tiers, operational cost, and process mapping linkages.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

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
                  onClick={() => setFormData({ ...formData, type: 'product' })}
                  className={`py-3 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    formData.type === 'product' 
                      ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100' 
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Physical Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'service' })}
                  className={`py-3 px-4 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    formData.type === 'service' 
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
                  Item Structure & Variations
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Classification Structure
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Radio Option 1: Single Standard Item */}
                <label
                  className={`relative flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    !hasVariants
                      ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="has_variants_toggle"
                    checked={!hasVariants}
                    onChange={() => handleSetHasVariants(false)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-left">
                    <span className="block text-xs font-bold text-slate-800">Single Standard Item</span>
                    <span className="block text-[10px] text-slate-500">No sub-types (flat pricing)</span>
                  </div>
                </label>

                {/* Radio Option 2: Has Multiple Types / Variants */}
                <label
                  className={`relative flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                    hasVariants
                      ? 'bg-blue-50/80 border-blue-600 text-blue-950 shadow-xs ring-1 ring-blue-600'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="has_variants_toggle"
                    checked={hasVariants}
                    onChange={() => handleSetHasVariants(true)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="text-left">
                    <span className="block text-xs font-bold text-blue-950">Has Multiple Types / Variants</span>
                    <span className="block text-[10px] text-blue-700 font-medium">Distinct price, cost & time</span>
                  </div>
                </label>
              </div>

              <p className="text-[11px] text-slate-400 mt-1.5">
                Enable if this item has multiple sub-types (e.g., Saudi Visa with different validity, selling prices, costs, and processing times).
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
                placeholder="e.g. Saudi Visa Services, Enterprise Cloud Consultation, Granite Cookware Set"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Master SKU / Catalog Code
              </label>
              <input 
                type="text"
                placeholder="e.g. KSA-VISA or SRV-001 or PROD-998"
                value={formData.sku || ''}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <input 
              type="text"
              list="catalog-categories"
              placeholder="e.g. Government Visas, Tourism, IT Consulting, Hardware, Legal Logistics"
              value={formData.category || ''}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <datalist id="catalog-categories">
              {categories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Scope of Work</label>
            <textarea 
              rows={3}
              placeholder="Detailed technical specifications, terms, requirements, or deliverables description..."
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* DYNAMIC SUB-TYPES & VARIANTS SPECIFICATION MATRIX */}
          {hasVariants && (
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
                      {variants.length} {variants.length === 1 ? 'Type Configured' : 'Types Configured'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 max-w-2xl">
                    Each sub-type row below carries its dedicated selling price, direct cost, currency, VAT rate, and execution timeframe / inventory metrics.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddVariant}
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
                            {formData.type === 'service' ? 'Fulfillment Time (TAT)' : 'Stock & Threshold'}
                          </span>
                          <span className="text-[9px] text-indigo-500 font-semibold normal-case">
                            {formData.type === 'service' ? 'Service Duration' : 'Inventory Tracking'}
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
                    {variants.map((variant, index) => {
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
                              onChange={e => handleUpdateVariant(variant.id, 'name', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* SKU */}
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="e.g. KSA-V1Y"
                              value={variant.sku || ''}
                              onChange={e => handleUpdateVariant(variant.id, 'sku', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* Selling Price */}
                          <td className="p-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              required
                              placeholder="0.00"
                              value={variant.price}
                              onChange={e => handleUpdateVariant(variant.id, 'price', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* Direct Cost */}
                          <td className="p-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={variant.cost}
                              onChange={e => handleUpdateVariant(variant.id, 'cost', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* Currency */}
                          <td className="p-3">
                            <select
                              value={variant.currency || formData.currency || baseCurrency}
                              onChange={e => handleUpdateVariant(variant.id, 'currency', e.target.value)}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {currenciesList.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                              ))}
                            </select>
                          </td>

                          {/* VAT % */}
                          <td className="p-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={variant.tax ?? formData.tax ?? 15}
                              onChange={e => handleUpdateVariant(variant.id, 'tax', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* Duration (Service) or Stock (Product) */}
                          <td className="p-3">
                            {formData.type === 'service' ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  placeholder="Time"
                                  value={variant.service_duration_hours ?? 1}
                                  onChange={e => handleUpdateVariant(variant.id, 'service_duration_hours', parseFloat(e.target.value) || 0)}
                                  className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white"
                                  title="Duration Value"
                                />
                                <select
                                  value={variant.service_duration_unit || 'days'}
                                  onChange={e => handleUpdateVariant(variant.id, 'service_duration_unit', e.target.value)}
                                  className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:bg-white"
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
                                  onChange={e => handleUpdateVariant(variant.id, 'stock_qty', parseInt(e.target.value) || 0)}
                                  className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white"
                                  title="Stock Quantity"
                                />
                                <span className="text-[10px] text-slate-400">/ Min:</span>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="10"
                                  value={variant.low_stock_threshold || 10}
                                  onChange={e => handleUpdateVariant(variant.id, 'low_stock_threshold', parseInt(e.target.value) || 0)}
                                  className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white"
                                  title="Low Stock Alert Threshold"
                                />
                              </div>
                            )}
                          </td>

                          {/* Net Margin */}
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-mono font-bold text-slate-900 text-[11px]">
                                {margin.toLocaleString()} {variant.currency || formData.currency || baseCurrency}
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
                                onClick={() => handleDuplicateVariant(variant)}
                                title="Duplicate this sub-type"
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariant(variant.id)}
                                disabled={variants.length <= 1}
                                title={variants.length <= 1 ? "At least one type is required" : "Remove this sub-type"}
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
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-white/60 px-3.5 py-2 rounded-xl border border-blue-100">
                  <span className="font-bold">
                    Active Types: <strong className="text-slate-900">{variants.length}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Price Spectrum: <strong className="text-emerald-700">{getVariantPriceRange()}</strong>
                  </span>
                  {formData.type === 'service' && (
                    <>
                      <span>•</span>
                      <span>
                        Fulfillment Spectrum: <strong className="text-blue-700">{getVariantDurationRange()}</strong>
                      </span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddVariant}
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
            {hasVariants && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Governed Per Sub-Type Above
              </span>
            )}
          </div>

          {hasVariants && (
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
                {hasVariants ? 'Baseline Selling Price' : 'Selling Price'} <span className="text-red-500">*</span>
              </label>
              <input 
                type="number"
                step="0.01"
                required={!hasVariants}
                value={formData.price || 0}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Currency</label>
              <select
                value={formData.currency || baseCurrency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                {currenciesList.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {hasVariants ? 'Baseline Direct Cost' : 'Production / Direct Cost'}
              </label>
              <input 
                type="number"
                step="0.01"
                value={formData.cost || 0}
                onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Standard VAT Rate (%)</label>
              <input 
                type="number"
                value={formData.tax || 0}
                onChange={e => setFormData({ ...formData, tax: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {/* Quick margin live feedback */}
          {((formData.price || 0) > 0 || (formData.cost || 0) > 0) && (
            <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                {hasVariants ? 'Baseline Reference Margin:' : 'Estimated Net Margin:'}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-800">
                  {((formData.price || 0) - (formData.cost || 0)).toLocaleString()} {formData.currency || baseCurrency}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${((formData.price || 0) - (formData.cost || 0)) >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                  {formData.price && formData.price > 0 ? Math.round((((formData.price - (formData.cost || 0)) / formData.price) * 100)) : 0}% Markup
                </span>
              </div>
            </div>
          )}

          {/* Pricing Flexibility checkboxes */}
          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={formData.is_cost_variable || false}
                onChange={e => setFormData({ ...formData, is_cost_variable: e.target.checked })}
                className="w-4 h-4 text-pink-600 rounded border-slate-300 focus:ring-pink-500"
              />
              <span>Variable Operational Cost (Fluctuates by project or vendor)</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input 
                type="checkbox"
                checked={formData.is_price_variable || false}
                onChange={e => setFormData({ ...formData, is_price_variable: e.target.checked })}
                className="w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500"
              />
              <span>Variable Selling Price (Customizable upon quotation)</span>
            </label>
          </div>
        </div>

        {/* Section 3: Inventory or Service Parameters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              3. Operational & Inventory Metrics
            </h4>
            {hasVariants && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Turnaround Metrics Per Variant
              </span>
            )}
          </div>

          {formData.type === 'product' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {hasVariants ? 'Master Aggregated Stock' : 'Initial Stock Quantity'}
                </label>
                <input 
                  type="number"
                  value={formData.stock_qty || 0}
                  onChange={e => setFormData({ ...formData, stock_qty: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Low Stock Alert Threshold
                </label>
                <input 
                  type="number"
                  value={formData.low_stock_threshold || 10}
                  onChange={e => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    {hasVariants ? 'Baseline Execution Duration' : 'Estimated Service Duration'}
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {formData.service_duration_unit === 'days' ? 'Tracked in days' : 'Tracked in hours'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.service_duration_hours ?? 1}
                    onChange={e => setFormData({ ...formData, service_duration_hours: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 1"
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <select
                    value={formData.service_duration_unit || 'days'}
                    onChange={e => setFormData({ ...formData, service_duration_unit: e.target.value as 'hours' | 'days' })}
                    className="w-32 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="days">Days (days)</option>
                    <option value="hours">Hours (hrs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Standard Operating Procedure (SOP)
                </label>
                <select
                  value={formData.sop_id || ''}
                  onChange={e => setFormData({ ...formData, sop_id: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="">-- No Linked SOP --</option>
                  {sops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Linked Process Mapping Architecture
            </label>
            <select
              value={formData.process_mapping_id || ''}
              onChange={e => setFormData({ ...formData, process_mapping_id: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="">-- No Linked Process Mapping --</option>
              {processMappings.map(pm => (
                <option key={pm.id} value={pm.id}>
                  {pm.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-slate-100 pt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/catalog/items')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>{isSaving ? 'Saving...' : 'Save & Publish Item'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemFormPage;
