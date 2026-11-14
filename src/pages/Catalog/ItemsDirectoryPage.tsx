import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  Briefcase, 
  Edit3, 
  Trash2, 
  FileText, 
  Layers, 
  Plus, 
  Eye, 
  ExternalLink,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { useCatalog } from './CatalogContext';
import DeleteConfirmation from '../../components/Common/DeleteConfirmation';
import { ExtendedProduct } from './types';

const getParsedVariants = (p: ExtendedProduct) => {
  if (Array.isArray(p.variants)) return p.variants;
  if (typeof p.variants === 'string') {
    try {
      const parsed = JSON.parse(p.variants);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
};

export const ItemsDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, sops, processMappings, baseCurrency, deleteProduct, isLoading } = useCatalog();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'product' | 'service'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>(() => {
    return searchParams.get('filter') === 'low-stock' ? 'low-stock' : 'all';
  });
  const [layoutStyle, setLayoutStyle] = useState<'board' | 'list'>('board');
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;

      let matchesStock = true;
      if (stockStatusFilter === 'low-stock') {
        matchesStock = p.type === 'product' && (p.stock_qty || 0) <= (p.low_stock_threshold || 10);
      } else if (stockStatusFilter === 'in-stock') {
        matchesStock = p.type === 'product' && (p.stock_qty || 0) > (p.low_stock_threshold || 10);
      }

      return matchesSearch && matchesType && matchesCat && matchesStock;
    });
  }, [products, searchQuery, typeFilter, categoryFilter, stockStatusFilter]);

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      await deleteProduct(itemToDelete);
      setItemToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading catalog items directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Search & Filter Controls Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by SKU, item name, keyword or category..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Type selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                All
              </button>
              <button 
                onClick={() => setTypeFilter('product')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'product' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Products
              </button>
              <button 
                onClick={() => setTypeFilter('service')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'service' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Services
              </button>
            </div>

            {/* Category dropdown */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Stock status filter */}
            <select
              value={stockStatusFilter}
              onChange={e => setStockStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
            >
              <option value="all">All Stock Status</option>
              <option value="low-stock">⚠️ Low Stock Warning</option>
              <option value="in-stock">✅ Sufficient Stock</option>
            </select>

            {/* View layout switch */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setLayoutStyle('board')}
                title="Board Card View"
                className={`p-1.5 rounded-lg transition-all ${layoutStyle === 'board' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setLayoutStyle('list')}
                title="Tabular List View"
                className={`p-1.5 rounded-lg transition-all ${layoutStyle === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Add New Item button */}
            <button
              onClick={() => navigate('/catalog/items/new')}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Item</span>
            </button>
          </div>
        </div>

        {/* Results summary bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <strong className="text-slate-800">{filteredProducts.length}</strong> of {products.length} items
            {stockStatusFilter === 'low-stock' && (
              <span className="ml-2 px-2 py-0.5 bg-red-50 text-red-700 rounded-md text-[10px] font-bold border border-red-200">
                Filtered: Low Stock Alert
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Items Collection Rendering */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
          <Briefcase className="w-12 h-12 text-slate-300 mb-3" />
          <h4 className="text-base font-bold text-slate-800">No Catalog items found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Modify your search keywords, clear active filters, or insert a new product/service to populate the directory.
          </p>
          <button
            onClick={() => navigate('/catalog/items/new')}
            className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
          >
            Add New Item
          </button>
        </div>
      ) : layoutStyle === 'board' ? (
        /* BOARD VIEW: Modern grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(p => {
            const isLowStock = p.type === 'product' && (p.stock_qty || 0) <= (p.low_stock_threshold || 10);
            const relatedSopTitle = sops.find(s => s.id === p.sop_id)?.title;
            const relatedProcess = processMappings.find(pm => pm.id === p.process_mapping_id)?.title;
            const variantsList = getParsedVariants(p);
            const hasVariants = p.has_variants || variantsList.length > 0;
            const prices = variantsList.map(v => Number(v.price) || 0);
            const minPrice = prices.length > 0 ? Math.min(...prices) : Number(p.price || 0);
            const maxPrice = prices.length > 0 ? Math.max(...prices) : Number(p.price || 0);
            
            return (
              <div 
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between group"
              >
                <div>
                  {/* Type header badge & Quick Action Icons */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider w-max ${p.type === 'product' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                          {p.type === 'product' ? 'Physical Product' : 'Service Solution'}
                        </span>
                        {hasVariants && (
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                            {variantsList.length > 0 ? `${variantsList.length} Sub-Types` : 'Has Sub-Types'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.is_cost_variable && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-pink-50 text-pink-700 border border-pink-100">
                            Var Cost
                          </span>
                        )}
                        {p.is_price_variable && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-100">
                            Var Price
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/catalog/items/${p.id}`)}
                        title="View & Edit Item Profile"
                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setItemToDelete(p.id)}
                        title="Delete Item"
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & SKU */}
                  <h3 
                    onClick={() => navigate(`/catalog/items/${p.id}`)}
                    className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 h-10 leading-tight cursor-pointer"
                  >
                    {p.name}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 font-bold tracking-wider mt-1 block">
                    SKU: {p.sku || 'N/A'}
                  </span>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 h-8 leading-relaxed">
                    {p.description || 'No custom description provided for this items directory.'}
                  </p>
                  
                  {/* Physical stock tracker */}
                  {p.type === 'product' && (
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">
                        {hasVariants ? 'Aggregated Stock:' : 'Available Stock:'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-slate-800">{p.stock_qty || 0}</span>
                        {isLowStock && (
                          <span className="bg-red-100 text-red-700 px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
                            Low
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Service hours tracker */}
                  {p.type === 'service' && (
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500">
                        {hasVariants ? 'Fulfillment TAT:' : 'Service Duration:'}
                      </span>
                      <span className="text-xs font-black text-slate-800">
                        {hasVariants && variantsList.length > 0 ? (
                          (() => {
                            const durs = variantsList.map(v => Number(v.service_duration_hours) || 0);
                            const minD = Math.min(...durs);
                            const maxD = Math.max(...durs);
                            const u = variantsList[0]?.service_duration_unit || 'days';
                            return minD === maxD ? `${minD} ${u}` : `${minD} - ${maxD} ${u}`;
                          })()
                        ) : (
                          `${p.service_duration_hours || 0} ${p.service_duration_unit === 'days' ? ((p.service_duration_hours || 0) === 1 ? 'day' : 'days') : 'hrs'}`
                        )}
                      </span>
                    </div>
                  )}

                  {/* Mapped work guidelines */}
                  {p.sop_id && (
                    <div className="mt-3 text-[10px] text-slate-500 bg-emerald-50/50 p-2 border border-emerald-100/60 rounded-xl flex items-center gap-1">
                      <FileText className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate font-semibold">Mapped SOP: <strong className="text-emerald-700">{relatedSopTitle || p.sop_id}</strong></span>
                    </div>
                  )}

                  {/* Linked Process Mapping */}
                  {p.process_mapping_id && (
                    <div className="mt-2 text-[10px] text-slate-500 bg-indigo-50/55 p-2 border border-indigo-100/60 rounded-xl flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="truncate font-semibold">
                        Process: <strong className="text-indigo-700">{relatedProcess || `Ref: ${p.process_mapping_id}`}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Pricing footer details */}
                <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">
                      {hasVariants && minPrice !== maxPrice ? 'Price Range' : 'Price Rate'}
                    </span>
                    <span className="text-base font-black text-slate-950">
                      {hasVariants && minPrice !== maxPrice
                        ? `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`
                        : Number(p.price || 0).toLocaleString()} <span className="text-[10px] text-slate-500 ml-0.5">{baseCurrency}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Tax Vat</span>
                    <span className="text-xs font-bold text-slate-800">{p.tax || 0}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW: Professional tabular directory */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Item Name / SKU</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Stock / Duration</th>
                  <th className="px-6 py-4 text-right">Operation Cost</th>
                  <th className="px-6 py-4 text-right">General Price</th>
                  <th className="px-6 py-4">SOP Guidelines</th>
                  <th className="px-6 py-4">Linked Process</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredProducts.map(p => {
                  const isLowStock = p.type === 'product' && (p.stock_qty || 0) <= (p.low_stock_threshold || 10);
                  const relatedSopTitle = sops.find(s => s.id === p.sop_id)?.title;
                  const relatedProcess = processMappings.find(pm => pm.id === p.process_mapping_id)?.title;
                  const variantsList = getParsedVariants(p);
                  const hasVariants = p.has_variants || variantsList.length > 0;
                  const prices = variantsList.map(v => Number(v.price) || 0);
                  const minPrice = prices.length > 0 ? Math.min(...prices) : Number(p.price || 0);
                  const maxPrice = prices.length > 0 ? Math.max(...prices) : Number(p.price || 0);
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => navigate(`/catalog/items/${p.id}`)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors cursor-pointer"
                        >
                          {p.name}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400">{p.sku || 'N/A'}</span>
                          {hasVariants && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200">
                              {variantsList.length > 0 ? `${variantsList.length} Sub-Types` : 'Variants'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase w-max ${p.type === 'product' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                            {p.type}
                          </span>
                          {p.is_cost_variable && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold uppercase bg-pink-50 text-pink-700 border border-pink-100 w-max">
                              Var Cost
                            </span>
                          )}
                          {p.is_price_variable && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-semibold uppercase bg-violet-50 text-violet-700 border border-violet-100 w-max">
                              Var Price
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-600">{p.category || 'General'}</td>
                      <td className="px-6 py-4">
                        {p.type === 'product' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{p.stock_qty || 0} left</span>
                            {isLowStock && (
                              <span className="bg-red-100 text-red-700 px-1.5 py-0.2 rounded text-[8px] font-bold animate-pulse uppercase">
                                Low
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-800">
                            {hasVariants && variantsList.length > 0 ? (
                              (() => {
                                const durs = variantsList.map(v => Number(v.service_duration_hours) || 0);
                                const minD = Math.min(...durs);
                                const maxD = Math.max(...durs);
                                const u = variantsList[0]?.service_duration_unit || 'days';
                                return minD === maxD ? `${minD} ${u}` : `${minD} - ${maxD} ${u}`;
                              })()
                            ) : (
                              `${p.service_duration_hours || 0} ${p.service_duration_unit === 'days' ? ((p.service_duration_hours || 0) === 1 ? 'day' : 'days') : 'hrs'}`
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-500">
                        {p.cost ? `${p.cost.toLocaleString()} ${baseCurrency}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-slate-900">
                        {hasVariants && minPrice !== maxPrice
                          ? `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} ${baseCurrency}`
                          : `${p.price.toLocaleString()} ${baseCurrency}`}
                      </td>
                      <td className="px-6 py-4 max-w-[140px] truncate font-bold text-emerald-700">
                        {relatedSopTitle || (p.sop_id ? `SOP Ref: ${p.sop_id}` : '—')}
                      </td>
                      <td className="px-6 py-4 max-w-[140px] truncate font-bold text-indigo-700">
                        {relatedProcess || (p.process_mapping_id ? `Ref: ${p.process_mapping_id}` : '—')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => navigate(`/catalog/items/${p.id}`)}
                            title="View & Edit Item Profile"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setItemToDelete(p.id)}
                            title="Delete Item"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg"
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
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmation 
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Catalog Item"
        message="Are you sure you want to delete this catalog item? Existing quotes, deals, and invoice relations referencing this item may be affected."
      />
    </div>
  );
};

export default ItemsDirectoryPage;
