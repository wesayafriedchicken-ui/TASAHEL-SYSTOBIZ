import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Package, 
  Layers, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight, 
  Tag, 
  DollarSign, 
  Clock, 
  Plus, 
  CheckCircle2, 
  BarChart3, 
  FileText, 
  Share2, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useCatalog } from './CatalogContext';
import { cn } from '../../lib/utils';

export const CatalogDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, priceLists, promoCodes, baseCurrency, isLoading } = useCatalog();

  const totalProducts = products.filter(p => p.type === 'product');
  const totalServices = products.filter(p => p.type === 'service');

  const lowStockItems = totalProducts.filter(p => (p.stock_qty || 0) <= (p.low_stock_threshold || 10));
  const totalStockUnits = totalProducts.reduce((acc, p) => acc + (p.stock_qty || 0), 0);
  const totalStockValuation = totalProducts.reduce((acc, p) => acc + ((p.cost || p.price) * (p.stock_qty || 0)), 0);

  // Profit margins calculation
  const margins = products.map(p => {
    const cost = p.cost || 0;
    const price = p.price || 0;
    const margin = price - cost;
    const marginPct = price > 0 ? (margin / price) * 100 : 0;
    return { product: p, margin, marginPct };
  });

  const avgMargin = margins.length > 0
    ? Math.round(margins.reduce((acc, m) => acc + m.marginPct, 0) / margins.length)
    : 0;

  const topMarginItems = [...margins].sort((a, b) => b.marginPct - a.marginPct).slice(0, 5);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading catalog dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      {/* Top Stat Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total SKUs */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total SKUs</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{products.length}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
              <span className="font-bold text-amber-600">{totalProducts.length} Products</span>
              <span>•</span>
              <span className="font-bold text-indigo-600">{totalServices.length} Services</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Stock Units & Valuation */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Physical Stock Valuation</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 truncate">
              {Math.round(totalStockValuation).toLocaleString()} <span className="text-xs font-bold text-slate-400">{baseCurrency}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              <span className="font-bold text-slate-800">{totalStockUnits.toLocaleString()}</span> Total physical units on hand
            </div>
          </div>
        </div>

        {/* Metric 3: Inventory Health / Low Stock */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Low Stock Alerts</span>
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", lowStockItems.length > 0 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-100 text-slate-400")}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={cn("text-3xl font-black", lowStockItems.length > 0 ? "text-red-600" : "text-slate-900")}>
              {lowStockItems.length}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {lowStockItems.length > 0 ? 'Items below low stock threshold' : 'All items sufficiently stocked'}
            </div>
          </div>
        </div>

        {/* Metric 4: Average Margin */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Avg Catalog Margin</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{avgMargin}%</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              Across active products and service specs
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner if items need attention */}
      {lowStockItems.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-amber-50 border border-red-200 rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-100 text-red-700 rounded-2xl shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-red-950">
                  Critical Low Stock Warning ({lowStockItems.length} Items Detected)
                </h4>
                <p className="text-xs text-red-800/80 mt-0.5">
                  The following physical inventory items have reached or breached their minimum safety threshold.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {lowStockItems.slice(0, 4).map(item => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/catalog/items/${item.id}`)}
                      className="px-2.5 py-1 bg-white/90 border border-red-200 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-1.5 hover:bg-white transition-all shadow-xs cursor-pointer"
                    >
                      <span>{item.name}</span>
                      <span className="px-1.5 py-0.2 bg-red-100 text-red-700 text-[10px] font-black rounded-md">
                        {item.stock_qty || 0} left
                      </span>
                    </button>
                  ))}
                  {lowStockItems.length > 4 && (
                    <span className="text-xs font-bold text-red-700 flex items-center">
                      +{lowStockItems.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/catalog/items?filter=low-stock')}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
            >
              Review Low Stock
            </button>
          </div>
        </div>
      )}

      {/* Main Two Columns: Quick Actions & Top Margin Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Quick Navigation & Module Jump Points */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="font-black text-base text-slate-900">Catalog Operations & Hubs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quick access to submodules, pricing rules, and sales automations.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Items Directory */}
              <div 
                onClick={() => navigate('/catalog/items')}
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-amber-200 hover:bg-amber-50/20 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Package className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
                    Items Directory
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage all {products.length} products & service solutions with board and tabular views.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-amber-600">
                  <span>Browse Items</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Price Lists & Promo Codes */}
              <div 
                onClick={() => navigate('/catalog/pricing/price-lists')}
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Tag className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Pricing & Promo Codes
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {priceLists.length} custom price tiers and {promoCodes.length} discount coupons configured.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <span>Manage Pricing</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Profitability Analytics */}
              <div 
                onClick={() => navigate('/catalog/analytics')}
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-rose-200 hover:bg-rose-50/20 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-rose-600 transition-colors">
                    Profitability Audit
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Deep dive into markup percentages, operation costs, and negative margin warnings.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-rose-600">
                  <span>View Margins</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 4: Integrations & Invoice Generator */}
              <div 
                onClick={() => navigate('/catalog/integrations')}
                className="p-5 rounded-2xl border border-slate-200/80 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                    Quote & Invoice Flow
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Simulate customer quotes, apply overrides, and post formal entries to General Ledger.
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold text-blue-600">
                  <span>Open Simulator</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Top Margin Catalog Items */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="font-black text-base text-slate-900">Highest Margin Items</h3>
                <p className="text-xs text-slate-500 mt-0.5">Top performing items by profit margin percentage.</p>
              </div>
              <button
                onClick={() => navigate('/catalog/analytics')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                View all
              </button>
            </div>

            {topMarginItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400">
                No items with pricing registered yet.
              </div>
            ) : (
              <div className="space-y-3">
                {topMarginItems.map(({ product, margin, marginPct }) => (
                  <div 
                    key={product.id}
                    onClick={() => navigate(`/catalog/items/${product.id}`)}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="max-w-[65%]">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase ${product.type === 'product' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                          {product.type}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-bold">{product.sku || 'N/A'}</span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors truncate mt-1">
                        {product.name}
                      </h5>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-700 block">
                        +{Math.round(marginPct)}% Margin
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Net: +{Math.round(margin).toLocaleString()} {baseCurrency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogDashboardPage;
