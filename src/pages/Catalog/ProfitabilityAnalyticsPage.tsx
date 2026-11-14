import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  Filter, 
  Search, 
  DollarSign, 
  Package, 
  Clock, 
  Eye
} from 'lucide-react';
import { useCatalog } from './CatalogContext';

export const ProfitabilityAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { products, baseCurrency, isLoading } = useCatalog();

  const [marginFilter, setMarginFilter] = useState<'all' | 'high' | 'healthy' | 'thin' | 'negative'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate margins for all products
  const marginData = useMemo(() => {
    return products.map(p => {
      const cost = p.cost || 0;
      const price = p.price || 0;
      const netMargin = price - cost;
      const marginPct = price > 0 ? (netMargin / price) * 100 : 0;
      
      let tier: 'high' | 'healthy' | 'thin' | 'negative' = 'healthy';
      if (netMargin < 0) {
        tier = 'negative';
      } else if (marginPct >= 50) {
        tier = 'high';
      } else if (marginPct >= 20) {
        tier = 'healthy';
      } else {
        tier = 'thin';
      }

      return {
        product: p,
        cost,
        price,
        netMargin,
        marginPct,
        tier
      };
    });
  }, [products]);

  const highCount = marginData.filter(m => m.tier === 'high').length;
  const healthyCount = marginData.filter(m => m.tier === 'healthy').length;
  const thinCount = marginData.filter(m => m.tier === 'thin').length;
  const negativeCount = marginData.filter(m => m.tier === 'negative').length;

  const avgMargin = marginData.length > 0 
    ? Math.round(marginData.reduce((acc, m) => acc + m.marginPct, 0) / marginData.length)
    : 0;

  const filteredData = useMemo(() => {
    return marginData.filter(m => {
      const matchesSearch = 
        (m.product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.product.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.product.category || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTier = marginFilter === 'all' || m.tier === marginFilter;
      return matchesSearch && matchesTier;
    });
  }, [marginData, searchQuery, marginFilter]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Calculating profitability audit matrices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Average Markup</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{avgMargin}%</div>
          <p className="text-xs text-slate-500 mt-1">Weighted average across active catalog items</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">High Margin (&gt;50%)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700">{highCount}</div>
          <p className="text-xs text-slate-500 mt-1">Items providing healthy profitability</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Moderate / Healthy</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-700">{healthyCount}</div>
          <p className="text-xs text-slate-500 mt-1">Between 20% to 50% profit margin</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Thin or Negative Margin</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${negativeCount > 0 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black ${negativeCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>
            {thinCount + negativeCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {negativeCount > 0 ? `${negativeCount} items losing money!` : 'Items under 20% markup'}
          </p>
        </div>
      </div>

      {/* Margin Audit Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Direct Profit Margin Audit Sheet</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed unit economics, cost of delivery, and profitability classification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-full md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Search audit items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              />
            </div>

            {/* Margin Filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMarginFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${marginFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}`}
              >
                All
              </button>
              <button
                onClick={() => setMarginFilter('high')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${marginFilter === 'high' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'}`}
              >
                &gt;50%
              </button>
              <button
                onClick={() => setMarginFilter('healthy')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${marginFilter === 'healthy' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'}`}
              >
                20-50%
              </button>
              <button
                onClick={() => setMarginFilter('thin')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${marginFilter === 'thin' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'}`}
              >
                &lt;20%
              </button>
              <button
                onClick={() => setMarginFilter('negative')}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${marginFilter === 'negative' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-500'}`}
              >
                Risk
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Item & SKU</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Production Cost</th>
                <th className="px-6 py-4 text-right">Consumer Price</th>
                <th className="px-6 py-4 text-center">Gross Markup %</th>
                <th className="px-6 py-4 text-right">Net Margin</th>
                <th className="px-6 py-4 text-center">Profitability Health</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredData.map(({ product, cost, price, netMargin, marginPct, tier }) => (
                <tr key={product.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/catalog/items/${product.id}`)}
                      className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors"
                    >
                      {product.name}
                    </button>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5">{product.sku || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${product.type === 'product' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {product.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-500">
                    {cost.toLocaleString()} {baseCurrency}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">
                    {price.toLocaleString()} {baseCurrency}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-black text-xs ${tier === 'high' ? 'text-emerald-700' : tier === 'negative' ? 'text-red-600' : 'text-slate-800'}`}>
                      {Math.round(marginPct)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black">
                    <span className={netMargin >= 0 ? 'text-slate-900' : 'text-red-600'}>
                      {netMargin >= 0 ? '+' : ''}{netMargin.toLocaleString()} {baseCurrency}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {tier === 'high' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                        High Margin
                      </span>
                    )}
                    {tier === 'healthy' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-blue-50 text-blue-800 border border-blue-200">
                        Healthy
                      </span>
                    )}
                    {tier === 'thin' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                        Thin Margin
                      </span>
                    )}
                    {tier === 'negative' && (
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase bg-red-50 text-red-800 border border-red-200 animate-pulse">
                        Negative Risk
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => navigate(`/catalog/items/${product.id}`)}
                      title="Adjust Pricing"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityAnalyticsPage;
