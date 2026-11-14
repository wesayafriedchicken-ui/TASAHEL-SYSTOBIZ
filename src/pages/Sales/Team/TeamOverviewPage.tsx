import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Award, 
  TrendingUp, 
  DollarSign, 
  Target, 
  CheckCircle2, 
  ArrowUpRight,
  Sliders
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const TeamOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, deals, stages, commissionSettings, calculateCommissionForRep, formatCurrency } = useSalesContext();

  const wonStageIds = stages.filter(s => s.is_won || s.name.toLowerCase().includes('won')).map(s => s.id);

  // Compute metrics per rep
  const repStats = useMemo(() => {
    return users.map(user => {
      const repDeals = deals.filter(d => d.assigned_to === user.id);
      const wonDeals = repDeals.filter(d => wonStageIds.includes(d.stage_id));
      const totalPipeline = repDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
      const totalWon = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
      const winRate = repDeals.length > 0 ? Math.round((wonDeals.length / repDeals.length) * 100) : 0;

      // Calculate estimated commission based on active rules
      let estimatedCommission = 0;
      try {
        const commResult = calculateCommissionForRep({
          ...user,
          wonCount: wonDeals.length,
          wonValue: totalWon
        });
        estimatedCommission = commResult?.amount || 0;
      } catch {
        estimatedCommission = totalWon * 0.05;
      }

      return {
        ...user,
        dealsCount: repDeals.length,
        wonCount: wonDeals.length,
        totalPipeline,
        totalWon,
        winRate,
        estimatedCommission
      };
    }).sort((a, b) => b.totalWon - a.totalWon);
  }, [users, deals, stages, commissionSettings]);

  const totalWonAll = repStats.reduce((sum, r) => sum + r.totalWon, 0);
  const totalPipelineAll = repStats.reduce((sum, r) => sum + r.totalPipeline, 0);

  return (
    <div className="space-y-6">
      {/* Sub-Header Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/sales/team-performance/overview')}
            className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs"
          >
            Leaderboard & Metrics
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/team-performance/commissions')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Commission Settings
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/team-performance/incentive-ledger')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <span>Representative Incentive Ledger</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('/sales/team-performance/commissions')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Configure Tiers</span>
        </button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Team Won Revenue</span>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(totalWonAll)}</p>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Closed & Contracted</span>
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Active Team Pipeline</span>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(totalPipelineAll)}</p>
          <p className="text-[11px] text-slate-500 font-medium">Across all active opportunity stages</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Sales Representatives</span>
          <p className="text-2xl font-black text-slate-900">{users.length}</p>
          <p className="text-[11px] text-indigo-600 font-bold">Active account executives</p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Sales Representative Leaderboard</h3>
            <p className="text-xs text-slate-500 font-medium">Ranked by closed won contract volume</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Rank & Rep Name</th>
                <th className="py-3.5 px-4 text-center">Deals (Won/Total)</th>
                <th className="py-3.5 px-4 text-center">Win Rate</th>
                <th className="py-3.5 px-4 text-right">Active Pipeline</th>
                <th className="py-3.5 px-4 text-right">Closed Won Revenue</th>
                <th className="py-3.5 px-4 text-right">Est. Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repStats.map((rep, idx) => (
                <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                        idx === 0 && "bg-amber-100 text-amber-800",
                        idx === 1 && "bg-slate-200 text-slate-700",
                        idx === 2 && "bg-amber-50 text-amber-900",
                        idx > 2 && "text-slate-400 font-medium"
                      )}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">{rep.name}</div>
                        <div className="text-[10px] text-slate-400">{rep.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    <span className="text-emerald-600 font-black">{rep.wonCount}</span> / {rep.dealsCount}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {rep.winRate}%
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                    {formatCurrency(rep.totalPipeline)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                    {formatCurrency(rep.totalWon)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-black text-indigo-600">
                    {formatCurrency(rep.estimatedCommission)}
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
