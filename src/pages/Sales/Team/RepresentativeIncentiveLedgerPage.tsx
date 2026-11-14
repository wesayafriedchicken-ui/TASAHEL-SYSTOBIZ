import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sliders, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Award, 
  Users, 
  Download, 
  FileText, 
  CheckCircle2, 
  Briefcase, 
  ChevronRight, 
  X, 
  Sparkles, 
  Layers, 
  Info,
  ArrowUpRight,
  Filter,
  Check
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';
import { CRMDeal } from '../../../types';

export const RepresentativeIncentiveLedgerPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    users, 
    deals, 
    stages, 
    commissionSettings, 
    calculateCommissionForRep, 
    formatCurrency, 
    baseCurrency,
    showToast 
  } = useSalesContext();

  // Date Range State (defaults to current month: 1st of month to today)
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Selected Rep for detailed deals modal
  const [selectedRepForModal, setSelectedRepForModal] = useState<any | null>(null);

  // Won Stages Identification
  const wonStageIds = useMemo(() => {
    return stages
      .filter(s => s.is_won || s.name.toLowerCase().includes('won') || s.name.toLowerCase().includes('مغلق بنجاح'))
      .map(s => s.id);
  }, [stages]);

  // Preset Date Range Helper
  const setPresetRange = (type: 'this_month' | 'last_month' | 'this_quarter' | 'all_time') => {
    const now = new Date();
    if (type === 'this_month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (type === 'last_month') {
      const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(firstDayPrevMonth.toISOString().split('T')[0]);
      setEndDate(lastDayPrevMonth.toISOString().split('T')[0]);
    } else if (type === 'this_quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const firstDayQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      setStartDate(firstDayQuarter.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (type === 'all_time') {
      setStartDate('2020-01-01');
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Filtered Won Deals within the selected Date Range
  const filteredWonDeals = useMemo(() => {
    return deals.filter(deal => {
      // Must be won stage
      const isWon = wonStageIds.includes(deal.stage_id) || (deal as any).status === 'won';
      if (!isWon) return false;

      // Check date
      const dealDateStr = (deal as any).close_date || deal.updated_at || deal.created_at || '';
      if (!dealDateStr) return true; // If no date, include by default

      const dealDate = dealDateStr.substring(0, 10);
      return dealDate >= startDate && dealDate <= endDate;
    });
  }, [deals, wonStageIds, startDate, endDate]);

  // Aggregate Performance and Commission Ledger per Representative
  const ledgerPerformance = useMemo(() => {
    return users.map(user => {
      const repDeals = deals.filter(d => d.assigned_to === user.id);
      const repWonDeals = repDeals.filter(d => {
        const isWon = wonStageIds.includes(d.stage_id) || (d as any).status === 'won';
        if (!isWon) return false;
        const dealDateStr = (d as any).close_date || d.updated_at || d.created_at || '';
        if (!dealDateStr) return true;
        const dealDate = dealDateStr.substring(0, 10);
        return dealDate >= startDate && dealDate <= endDate;
      });

      const wonValue = repWonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const wonCount = repWonDeals.length;
      const averageSize = wonCount > 0 ? Math.round(wonValue / wonCount) : 0;

      // Calculate dynamic commission payout via context engine
      const calculation = calculateCommissionForRep({
        ...user,
        wonCount,
        wonValue
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name || (user as any).role || 'Sales Representative',
        wonCount,
        wonValue,
        averageSize,
        wonDealsList: repWonDeals,
        calculation
      };
    }).sort((a, b) => b.wonValue - a.wonValue);
  }, [users, deals, wonStageIds, startDate, endDate, calculateCommissionForRep]);

  // Grand Totals
  const totalWonValueAll = useMemo(() => {
    return ledgerPerformance.reduce((sum, r) => sum + r.wonValue, 0);
  }, [ledgerPerformance]);

  const totalWonCountAll = useMemo(() => {
    return ledgerPerformance.reduce((sum, r) => sum + r.wonCount, 0);
  }, [ledgerPerformance]);

  const totalCommissionPoolAll = useMemo(() => {
    return ledgerPerformance.reduce((sum, r) => sum + (r.calculation?.amount || 0), 0);
  }, [ledgerPerformance]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Rep ID', 'Representative Name', 'Email', 'Role', 'Closed Deals Count', 'Won Revenue', 'Average Deal Size', 'Est. Commission Payout', 'Calculation Formula'];
    const rows = ledgerPerformance.map(r => [
      r.id,
      `"${r.name}"`,
      `"${r.email || ''}"`,
      `"${r.role}"`,
      r.wonCount,
      r.wonValue,
      r.averageSize,
      r.calculation?.amount || 0,
      `"${(r.calculation?.formula || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `commission-incentive-ledger-${startDate}-to-${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Incentive ledger exported successfully as CSV.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Sub-Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => navigate('/sales/team-performance/overview')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Leaderboard & Metrics
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/team-performance/commissions')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Commission Settings
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/team-performance/incentive-ledger')}
            className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Representative Incentive Ledger</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/team-performance/commissions')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configure Tiers</span>
          </button>
        </div>
      </div>

      {/* Filter Card: Date Range & Summary */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">
                Incentive Calculation Filters
              </h2>
              <span className="text-[11px] font-bold text-slate-400">
                كشف استحقاق عمولات الموظفين
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Filter and calculate commission payouts for verified Closed Won opportunities within the selected timeframe.
            </p>
          </div>

          {/* Date Range Inputs & Presets */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPresetRange('this_month')}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('last_month')}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                Last Month
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('this_quarter')}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                Quarter
              </button>
              <button
                type="button"
                onClick={() => setPresetRange('all_time')}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                All Time
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">From Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">To Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Banner Summary Metrics */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
              Active Date Range Overview
            </span>
            <p className="text-xs text-slate-600 font-medium">
              Processing won deals closed between <span className="font-bold text-indigo-900">{startDate}</span> and <span className="font-bold text-indigo-900">{endDate}</span>
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-indigo-100/80 shadow-3xs">
            <div className="text-center pr-4 border-r border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Matched Deals</span>
              <span className="text-xs font-black text-indigo-700">{filteredWonDeals.length} Won Deals</span>
            </div>
            <div className="text-center pr-4 border-r border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Contract Revenue</span>
              <span className="text-xs font-black text-slate-900">{formatCurrency(totalWonValueAll)}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Commission Due</span>
              <span className="text-xs font-black text-emerald-600">{formatCurrency(totalCommissionPoolAll)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Representative Incentive Ledger Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs space-y-0">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Representative Incentive Ledger / كشف استحقاق عمولات الموظفين</span>
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verified commission entitlements dynamically aggregated from live CRM deals and commission tiers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5">
              Scheme: {commissionSettings.activeScheme.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-5">Representative</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Closed Won Volume</th>
                <th className="py-3.5 px-4 text-center">Won Count</th>
                <th className="py-3.5 px-4">Calculation Formula & Logic</th>
                <th className="py-3.5 px-5 text-right">Due Commission</th>
                <th className="py-3.5 px-4 text-center">Deals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledgerPerformance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-medium">
                    No sales representatives registered or found in the system.
                  </td>
                </tr>
              ) : (
                ledgerPerformance.map((rep) => {
                  const calc = rep.calculation || { amount: 0, formula: 'N/A', description: '' };
                  return (
                    <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Rep Info */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black uppercase text-[11px] shrink-0">
                            {rep.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{rep.name}</p>
                            <span className="text-[10px] text-slate-400 font-mono block">{rep.email || `Rep ID #${rep.id}`}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4 text-slate-600 font-semibold text-xs">
                        {rep.role}
                      </td>

                      {/* Closed Won Revenue */}
                      <td className="py-4 px-4 font-black text-slate-900 font-mono text-xs">
                        {formatCurrency(rep.wonValue)}
                      </td>

                      {/* Won Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                          {rep.wonCount} Deals
                        </span>
                      </td>

                      {/* Formula & Explanation */}
                      <td className="py-4 px-4 max-w-[280px]">
                        <p className="font-mono text-[11px] text-indigo-600 font-black truncate" title={calc.formula}>
                          {calc.formula || 'No won deals in period'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5" title={calc.description}>
                          {calc.description || 'Zero commission calculated for inactive period.'}
                        </p>
                      </td>

                      {/* Due Commission */}
                      <td className="py-4 px-5 text-right font-mono">
                        <span className={cn(
                          "inline-block text-xs font-black px-3 py-1.5 rounded-xl border",
                          calc.amount > 0 
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                            : "text-slate-400 bg-slate-100 border-slate-200"
                        )}>
                          {formatCurrency(calc.amount)}
                        </span>
                      </td>

                      {/* Actions / View Deals */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedRepForModal(rep)}
                          className="px-2.5 py-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          View ({rep.wonCount})
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down Modal: Rep's Won Deals in Period */}
      {selectedRepForModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  {selectedRepForModal.name} &mdash; Won Deals Breakdown
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Showing {selectedRepForModal.wonCount} won opportunities from {startDate} to {endDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRepForModal(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {selectedRepForModal.wonDealsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No won deals found for this representative in the selected timeframe.
                </div>
              ) : (
                selectedRepForModal.wonDealsList.map((deal: CRMDeal) => (
                  <div key={deal.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{deal.title}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Client ID #{deal.customer_id || 'N/A'} &bull; Closed: {(deal as any).close_date || deal.created_at?.substring(0, 10) || 'N/A'}
                      </p>
                    </div>
                    <span className="text-xs font-black text-emerald-600 font-mono">
                      {formatCurrency(deal.value || 0)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Revenue</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {formatCurrency(selectedRepForModal.wonValue)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Calculated Commission</span>
                <span className="text-sm font-black text-emerald-600 font-mono">
                  {formatCurrency(selectedRepForModal.calculation?.amount || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
