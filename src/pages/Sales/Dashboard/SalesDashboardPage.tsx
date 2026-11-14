import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, 
  TrendingUp, 
  Award, 
  Kanban, 
  Users, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Cell
} from 'recharts';
import { useSalesContext } from '../context/SalesContext';

export const SalesDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    deals, 
    stages, 
    leads, 
    customers, 
    users, 
    formatCurrency 
  } = useSalesContext();

  // Metrics calculations
  const totalPipelineValue = deals.reduce((sum, d) => sum + Number(d.value || 0), 0);
  
  // Find won stages
  const wonStageIds = stages.filter(s => s.is_won || s.name.toLowerCase().includes('won')).map(s => s.id);
  const wonDeals = deals.filter(d => wonStageIds.includes(d.stage_id));
  const wonRevenue = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
  
  const winRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
  const avgDealSize = deals.length > 0 ? Math.round(totalPipelineValue / deals.length) : 0;

  // Stages breakdown for Recharts
  const stageChartData = stages.map(stage => {
    const stageDeals = deals.filter(d => d.stage_id === stage.id);
    const stageValue = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    return {
      name: stage.name,
      count: stageDeals.length,
      value: stageValue,
      color: stage.color || '#4f46e5'
    };
  });

  // Recent deals
  const recentDeals = [...deals].slice(0, 6);

  // Top Reps
  const repStats = users.map(user => {
    const userDeals = deals.filter(d => d.assigned_to === user.id);
    const userWon = userDeals.filter(d => wonStageIds.includes(d.stage_id));
    const wonVal = userWon.reduce((s, d) => s + Number(d.value || 0), 0);
    return {
      id: user.id,
      name: user.name,
      avatar: (user as any).avatar || (user as any).avatar_url,
      totalDeals: userDeals.length,
      wonCount: userWon.length,
      wonRevenue: wonVal
    };
  }).filter(r => r.totalDeals > 0).sort((a, b) => b.wonRevenue - a.wonRevenue);

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pipeline Value</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(totalPipelineValue)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
            <span>vs previous month</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Closed Won Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(wonRevenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{wonDeals.length} deals closed</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Conversion Win Rate</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {winRate}%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Overall stage qualification</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Average Deal Size</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(avgDealSize)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Across {deals.length} total deals</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Pipeline Stages Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stages Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">Pipeline Stage Distribution</h2>
              <p className="text-xs text-slate-500 font-medium">Deals value aggregated by active workflow stage</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/sales/pipeline/deals')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View Kanban Board</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full pt-2">
            {stageChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${v > 999 ? (v/1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip 
                    formatter={(val: any) => [formatCurrency(val), 'Value']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {stageChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No stage data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Top Performers Leaderboard Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">Sales Leaderboard</h2>
              <button
                type="button"
                onClick={() => navigate('/sales/team-performance/overview')}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Full Leaderboard
              </button>
            </div>

            <div className="divide-y divide-slate-100 mt-2">
              {repStats.length > 0 ? (
                repStats.slice(0, 4).map((rep, idx) => (
                  <div 
                    key={rep.id} 
                    onClick={() => navigate(`/sales/team-performance/rep/${rep.id}`)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-center text-xs font-black text-slate-400">
                        #{idx + 1}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-black">
                        {rep.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{rep.name}</p>
                        <p className="text-[10px] text-slate-400">{rep.wonCount} won / {rep.totalDeals} active</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900">{formatCurrency(rep.wonRevenue)}</p>
                      <span className="text-[10px] text-emerald-600 font-bold">Top Closer</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No sales rep activity logged yet.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/sales/team-performance/Commission-Settings')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Configure Commission Settings
            </button>
          </div>
        </div>
      </div>

      {/* Recent High-Priority Pipeline Deals */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900">Active Deals in Pipeline</h2>
            <p className="text-xs text-slate-500 font-medium">Click on any deal to open its 360° detail inspector</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/sales/pipeline/deals/new')}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-bold rounded-xl transition-all"
          >
            + New Deal
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Deal Title</th>
                <th className="py-3 px-3">Associated Account</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3">Owner</th>
                <th className="py-3 px-3 text-right">Value</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDeals.map(deal => {
                const customer = customers.find(c => c.id === deal.customer_id);
                const stage = stages.find(s => s.id === deal.stage_id);
                const owner = users.find(u => u.id === deal.assigned_to);

                return (
                  <tr 
                    key={deal.id}
                    onClick={() => navigate(`/sales/pipeline/deals/${deal.id}`)}
                    className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {deal.title}
                      </div>
                      <div className="text-[11px] text-slate-400">{deal.service_type || 'General'}</div>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-600">
                      {customer?.name || 'Unassigned'}
                      {customer?.company ? ` (${customer.company})` : ''}
                    </td>
                    <td className="py-3.5 px-3">
                      <span 
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block"
                        style={{ 
                          backgroundColor: `${stage?.color || '#4f46e5'}15`,
                          color: stage?.color || '#4f46e5',
                          borderColor: `${stage?.color || '#4f46e5'}30`
                        }}
                      >
                        {stage?.name || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-600">
                      {owner?.name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-black text-slate-900">
                      {formatCurrency(deal.value)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="text-slate-400 group-hover:text-indigo-600 text-xs font-bold">
                        Inspect →
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
