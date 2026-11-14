import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Sliders, 
  Percent, 
  DollarSign,
  Award,
  Sparkles,
  Calculator,
  TrendingUp,
  CheckCircle2,
  Layers,
  Scale,
  RefreshCw,
  UserCheck,
  BarChart3,
  HelpCircle
} from 'lucide-react';
import { useSalesContext, CommissionSettings } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const CommissionSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    commissionSettings, 
    setCommissionSettings, 
    users, 
    deals, 
    stages, 
    formatCurrency, 
    showToast 
  } = useSalesContext();

  // Active Scheme State
  const [activeScheme, setActiveScheme] = useState<CommissionSettings['activeScheme']>(
    commissionSettings.activeScheme || 'revenue_tiers'
  );

  // Scheme 1: Fixed Revenue Percentage
  const [revenueFixedPercentage, setRevenueFixedPercentage] = useState<number>(
    commissionSettings.revenueFixedPercentage ?? 5
  );

  // Scheme 2: Revenue Tiers
  const [revenueCalculationType, setRevenueCalculationType] = useState<'flat' | 'cumulative'>(
    commissionSettings.revenueCalculationType || 'flat'
  );
  const [revenueTiers, setRevenueTiers] = useState<Array<{ id: string; min: number; max: number; rate: number }>>(() => {
    return commissionSettings.revenueTiers && commissionSettings.revenueTiers.length > 0
      ? commissionSettings.revenueTiers
      : [
          { id: 'r1', min: 0, max: 50000, rate: 3 },
          { id: 'r2', min: 50001, max: 150000, rate: 6 },
          { id: 'r3', min: 150001, max: 99999999, rate: 10 }
        ];
  });

  // Scheme 3: Volume Tiers (Closed Won Count)
  const [volumeCalculationType, setVolumeCalculationType] = useState<'flat' | 'cumulative'>(
    commissionSettings.volumeCalculationType || 'flat'
  );
  const [volumeTiers, setVolumeTiers] = useState<Array<{ id: string; min: number; max: number; rate: number }>>(() => {
    return commissionSettings.volumeTiers && commissionSettings.volumeTiers.length > 0
      ? commissionSettings.volumeTiers
      : [
          { id: 'v1', min: 1, max: 10, rate: 150 },
          { id: 'v2', min: 11, max: 25, rate: 300 },
          { id: 'v3', min: 26, max: 999999, rate: 500 }
        ];
  });

  // Scheme 4: Fixed Profit Percentage
  const [profitFixedPercentage, setProfitFixedPercentage] = useState<number>(
    commissionSettings.profitFixedPercentage ?? 12
  );
  const [profitCostPercentage, setProfitCostPercentage] = useState<number>(
    commissionSettings.profitCostPercentage ?? 60
  );

  // Scheme 5: Profit Tiers
  const [profitCalculationType, setProfitCalculationType] = useState<'flat' | 'cumulative'>(
    commissionSettings.profitCalculationType || 'flat'
  );
  const [profitTiers, setProfitTiers] = useState<Array<{ id: string; min: number; max: number; rate: number }>>(() => {
    return commissionSettings.profitTiers && commissionSettings.profitTiers.length > 0
      ? commissionSettings.profitTiers
      : [
          { id: 'p1', min: 0, max: 30000, rate: 6 },
          { id: 'p2', min: 30001, max: 80000, rate: 12 },
          { id: 'p3', min: 80001, max: 99999999, rate: 18 }
        ];
  });

  // Rep Custom Overrides
  const [repOverrides, setRepOverrides] = useState<{ [repId: number]: { customCost?: number; customCostPercentage?: number } }>(
    commissionSettings.repOverrides || {}
  );

  // Live Simulator State
  const [simMode, setSimMode] = useState<'rep' | 'custom'>('custom');
  const [selectedRepId, setSelectedRepId] = useState<number>(users[0]?.id || 1);
  const [simRevenue, setSimRevenue] = useState<number>(120000);
  const [simDealsCount, setSimDealsCount] = useState<number>(14);
  const [simCostPercentage, setSimCostPercentage] = useState<number>(profitCostPercentage);

  // Handlers for Revenue Tiers
  const handleAddRevenueTier = () => {
    const lastTier = revenueTiers[revenueTiers.length - 1];
    const newMin = lastTier ? (lastTier.max >= 99999999 ? lastTier.min + 50000 : lastTier.max + 1) : 0;
    setRevenueTiers([
      ...revenueTiers,
      {
        id: `r-${Date.now()}`,
        min: newMin,
        max: newMin + 50000,
        rate: lastTier ? Math.min(100, lastTier.rate + 2) : 5
      }
    ]);
  };

  const handleRemoveRevenueTier = (id: string) => {
    if (revenueTiers.length <= 1) return;
    setRevenueTiers(revenueTiers.filter(t => t.id !== id));
  };

  const handleUpdateRevenueTier = (id: string, field: 'min' | 'max' | 'rate', val: number) => {
    setRevenueTiers(revenueTiers.map(t => t.id === id ? { ...t, [field]: val } : t));
  };

  // Handlers for Volume Tiers
  const handleAddVolumeTier = () => {
    const lastTier = volumeTiers[volumeTiers.length - 1];
    const newMin = lastTier ? (lastTier.max >= 999999 ? lastTier.min + 10 : lastTier.max + 1) : 1;
    setVolumeTiers([
      ...volumeTiers,
      {
        id: `v-${Date.now()}`,
        min: newMin,
        max: newMin + 15,
        rate: lastTier ? lastTier.rate + 100 : 200
      }
    ]);
  };

  const handleRemoveVolumeTier = (id: string) => {
    if (volumeTiers.length <= 1) return;
    setVolumeTiers(volumeTiers.filter(t => t.id !== id));
  };

  const handleUpdateVolumeTier = (id: string, field: 'min' | 'max' | 'rate', val: number) => {
    setVolumeTiers(volumeTiers.map(t => t.id === id ? { ...t, [field]: val } : t));
  };

  // Handlers for Profit Tiers
  const handleAddProfitTier = () => {
    const lastTier = profitTiers[profitTiers.length - 1];
    const newMin = lastTier ? (lastTier.max >= 99999999 ? lastTier.min + 25000 : lastTier.max + 1) : 0;
    setProfitTiers([
      ...profitTiers,
      {
        id: `p-${Date.now()}`,
        min: newMin,
        max: newMin + 30000,
        rate: lastTier ? Math.min(100, lastTier.rate + 3) : 8
      }
    ]);
  };

  const handleRemoveProfitTier = (id: string) => {
    if (profitTiers.length <= 1) return;
    setProfitTiers(profitTiers.filter(t => t.id !== id));
  };

  const handleUpdateProfitTier = (id: string, field: 'min' | 'max' | 'rate', val: number) => {
    setProfitTiers(profitTiers.map(t => t.id === id ? { ...t, [field]: val } : t));
  };

  // Update Rep Override
  const handleSetRepCostPercentage = (repId: number, percentage: number | undefined) => {
    setRepOverrides(prev => {
      const current = prev[repId] || {};
      if (percentage === undefined || isNaN(percentage)) {
        const copy = { ...prev };
        delete copy[repId];
        return copy;
      }
      return {
        ...prev,
        [repId]: { ...current, customCostPercentage: percentage }
      };
    });
  };

  // Save All Settings
  const handleSave = () => {
    const updated: CommissionSettings = {
      activeScheme,
      revenueFixedPercentage,
      revenueCalculationType,
      revenueTiers: [...revenueTiers].sort((a, b) => a.min - b.min),
      volumeCalculationType,
      volumeTiers: [...volumeTiers].sort((a, b) => a.min - b.min),
      profitFixedPercentage,
      profitCostPercentage,
      profitCalculationType,
      profitTiers: [...profitTiers].sort((a, b) => a.min - b.min),
      repOverrides
    };

    setCommissionSettings(updated);
    showToast('Commission scheme & tier structures saved successfully!', 'success');
  };

  // Live Simulator Calculation
  const simulationResult = useMemo(() => {
    let rev = simRevenue;
    let count = simDealsCount;
    let costRate = simCostPercentage;

    if (simMode === 'rep') {
      const chosenRep = users.find(u => u.id === selectedRepId);
      if (chosenRep) {
        const wonStageIds = stages.filter(s => s.is_won || s.name.toLowerCase().includes('won')).map(s => s.id);
        const repDeals = deals.filter(d => d.assigned_to === chosenRep.id);
        const wonDeals = repDeals.filter(d => wonStageIds.includes(d.stage_id));
        rev = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
        count = wonDeals.length;
        const repOverride = repOverrides[chosenRep.id];
        if (repOverride?.customCostPercentage !== undefined) {
          costRate = repOverride.customCostPercentage;
        }
      }
    }

    const totalCost = rev * (costRate / 100);
    const netProfit = Math.max(0, rev - totalCost);

    let payout = 0;
    let formulaText = '';
    let steps: string[] = [];

    switch (activeScheme) {
      case 'revenue_fixed': {
        payout = rev * (revenueFixedPercentage / 100);
        formulaText = `${formatCurrency(rev)} × ${revenueFixedPercentage}%`;
        steps.push(`Total Won Revenue: ${formatCurrency(rev)}`);
        steps.push(`Commission Rate: ${revenueFixedPercentage}%`);
        break;
      }
      case 'revenue_tiers': {
        const sorted = [...revenueTiers].sort((a, b) => a.min - b.min);
        if (revenueCalculationType === 'flat') {
          const matched = sorted.find(t => rev >= t.min && rev <= t.max) || sorted.filter(t => rev >= t.min).pop() || sorted[0];
          const rate = matched ? matched.rate : 0;
          payout = rev * (rate / 100);
          formulaText = `${formatCurrency(rev)} × ${rate}% (Flat Tier Bracket: ${formatCurrency(matched?.min || 0)} - ${matched?.max >= 99999999 ? '∞' : formatCurrency(matched?.max || 0)})`;
          steps.push(`Revenue qualifies for tier: ${rate}%`);
        } else {
          let runningSum = 0;
          sorted.forEach((t, i) => {
            if (rev > t.min) {
              const upper = Math.min(rev, t.max);
              const slice = upper - t.min;
              if (slice > 0) {
                const slicePayout = slice * (t.rate / 100);
                runningSum += slicePayout;
                steps.push(`Bracket ${i + 1} (${formatCurrency(t.min)} - ${formatCurrency(upper)}): ${formatCurrency(slice)} @ ${t.rate}% = ${formatCurrency(slicePayout)}`);
              }
            }
          });
          payout = runningSum;
          formulaText = `Cumulative progressive sum across ${steps.length} brackets`;
        }
        break;
      }
      case 'volume_tiers': {
        const sorted = [...volumeTiers].sort((a, b) => a.min - b.min);
        if (volumeCalculationType === 'flat') {
          const matched = sorted.find(t => count >= t.min && count <= t.max) || sorted.filter(t => count >= t.min).pop() || sorted[0];
          const rate = matched ? matched.rate : 0;
          payout = count * rate;
          formulaText = `${count} deals × ${formatCurrency(rate)} / deal (Flat Bracket: ${matched?.min} - ${matched?.max >= 999999 ? '∞' : matched?.max})`;
          steps.push(`Closed count (${count} deals) hits bonus level: ${formatCurrency(rate)} per deal`);
        } else {
          let runningSum = 0;
          sorted.forEach((t, i) => {
            if (count >= t.min) {
              const upper = Math.min(count, t.max);
              const slice = upper - (t.min - 1);
              if (slice > 0) {
                const slicePayout = slice * t.rate;
                runningSum += slicePayout;
                steps.push(`Tier ${i + 1} (${t.min} - ${upper} deals): ${slice} deals @ ${formatCurrency(t.rate)} = ${formatCurrency(slicePayout)}`);
              }
            }
          });
          payout = runningSum;
          formulaText = `Progressive sum of deals across bonus brackets`;
        }
        break;
      }
      case 'profit_fixed': {
        payout = netProfit * (profitFixedPercentage / 100);
        formulaText = `(${formatCurrency(rev)} - ${formatCurrency(totalCost)} costs [${costRate}%]) × ${profitFixedPercentage}%`;
        steps.push(`Total Revenue: ${formatCurrency(rev)}`);
        steps.push(`Estimated Direct Costs (${costRate}%): -${formatCurrency(totalCost)}`);
        steps.push(`Calculated Gross Profit: ${formatCurrency(netProfit)}`);
        steps.push(`Profit Commission (${profitFixedPercentage}%): ${formatCurrency(payout)}`);
        break;
      }
      case 'profit_tiers': {
        const sorted = [...profitTiers].sort((a, b) => a.min - b.min);
        if (profitCalculationType === 'flat') {
          const matched = sorted.find(t => netProfit >= t.min && netProfit <= t.max) || sorted.filter(t => netProfit >= t.min).pop() || sorted[0];
          const rate = matched ? matched.rate : 0;
          payout = netProfit * (rate / 100);
          formulaText = `${formatCurrency(netProfit)} net profit × ${rate}%`;
          steps.push(`Calculated Net Profit: ${formatCurrency(netProfit)} (Revenue ${formatCurrency(rev)} less ${costRate}% costs)`);
          steps.push(`Matched profit bracket: ${rate}%`);
        } else {
          let runningSum = 0;
          sorted.forEach((t, i) => {
            if (netProfit > t.min) {
              const upper = Math.min(netProfit, t.max);
              const slice = upper - t.min;
              if (slice > 0) {
                const slicePayout = slice * (t.rate / 100);
                runningSum += slicePayout;
                steps.push(`Profit Tier ${i + 1}: ${formatCurrency(slice)} @ ${t.rate}% = ${formatCurrency(slicePayout)}`);
              }
            }
          });
          payout = runningSum;
          formulaText = `Progressive gross margin tier payout`;
        }
        break;
      }
    }

    return {
      revenue: rev,
      dealsCount: count,
      costRate,
      totalCost,
      netProfit,
      payout,
      formulaText,
      steps
    };
  }, [
    activeScheme,
    revenueFixedPercentage,
    revenueCalculationType,
    revenueTiers,
    volumeCalculationType,
    volumeTiers,
    profitFixedPercentage,
    profitCostPercentage,
    profitCalculationType,
    profitTiers,
    simMode,
    selectedRepId,
    simRevenue,
    simDealsCount,
    simCostPercentage,
    users,
    deals,
    stages,
    repOverrides,
    formatCurrency
  ]);

  const schemes = [
    {
      id: 'revenue_tiers' as const,
      label: 'Revenue Tiers',
      sublabel: 'شرائح قيمة المبيعات',
      desc: 'Progressive or flat brackets based on closed won deal value ($)',
      icon: TrendingUp,
      badge: 'Most Popular'
    },
    {
      id: 'volume_tiers' as const,
      label: 'Deals Volume Tiers',
      sublabel: 'شرائح عدد الصفقات',
      desc: 'Fixed cash bonus per closed deal based on count milestones',
      icon: Award,
      badge: 'High Frequency'
    },
    {
      id: 'revenue_fixed' as const,
      label: 'Fixed Revenue %',
      sublabel: 'نسبة ثابتة من المبيعات',
      desc: 'Straightforward constant percentage on all won sales revenue',
      icon: Percent,
      badge: 'Simple'
    },
    {
      id: 'profit_fixed' as const,
      label: 'Fixed Profit %',
      sublabel: 'نسبة ثابتة من صافي الربح',
      desc: 'Percentage of gross margin after deducting product/lead costs',
      icon: Scale,
      badge: 'Margin Focused'
    },
    {
      id: 'profit_tiers' as const,
      label: 'Profit Tiers',
      sublabel: 'شرائح صافي الأرباح',
      desc: 'Tiered incentive brackets tied directly to net gross profit',
      icon: Layers,
      badge: 'Advanced'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/sales/team-performance/overview')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Performance Leaderboard</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Commission Architecture & Tiers
            </h1>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              Multi-Scheme Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Configure flexible revenue brackets, deal volume rewards, profit deductions, and individual sales rep targets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/sales/team-performance/overview')}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Commission Architecture</span>
          </button>
        </div>
      </div>

      {/* Sub-Header Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
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
          className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs cursor-pointer"
        >
          Commission Settings
        </button>
        <button
          type="button"
          onClick={() => navigate('/sales/team-performance/incentive-ledger')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>Representative Incentive Ledger</span>
        </button>
      </div>

      {/* 1. SCHEME SELECTOR CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Select Active Calculation Scheme | طريقة حساب العمولات الأساسية</span>
          </label>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            Active: {schemes.find(s => s.id === activeScheme)?.label}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {schemes.map(s => {
            const Icon = s.icon;
            const isSelected = activeScheme === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveScheme(s.id)}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all flex flex-col justify-between relative group cursor-pointer",
                  isSelected 
                    ? "bg-white border-indigo-600 ring-2 ring-indigo-600/10 shadow-sm" 
                    : "bg-white/80 border-slate-200/80 hover:border-slate-300 hover:bg-white"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-colors",
                      isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:text-slate-800"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {s.badge && (
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                        isSelected ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {s.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-black text-slate-900 leading-snug">{s.label}</h3>
                  <div className="text-[10px] font-bold text-slate-400 mt-0.5">{s.sublabel}</div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{s.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className={cn(
                    "text-[10px] font-bold",
                    isSelected ? "text-indigo-600 font-black" : "text-slate-400"
                  )}>
                    {isSelected ? '✓ Selected Scheme' : 'Click to activate'}
                  </span>
                  <div className={cn(
                    "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
                    isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                  )}>
                    {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ACTIVE SCHEME DETAILED CONFIGURATION */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Header for Active Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Active Scheme Rule Builder
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-2">
              {schemes.find(s => s.id === activeScheme)?.label} Configuration
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Customize bracket thresholds, progression mode, and payout incentives.
            </p>
          </div>

          {/* Mode switch for tier-based schemes */}
          {(activeScheme === 'revenue_tiers' || activeScheme === 'volume_tiers' || activeScheme === 'profit_tiers') && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (activeScheme === 'revenue_tiers') setRevenueCalculationType('flat');
                  if (activeScheme === 'volume_tiers') setVolumeCalculationType('flat');
                  if (activeScheme === 'profit_tiers') setProfitCalculationType('flat');
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  (activeScheme === 'revenue_tiers' && revenueCalculationType === 'flat') ||
                  (activeScheme === 'volume_tiers' && volumeCalculationType === 'flat') ||
                  (activeScheme === 'profit_tiers' && profitCalculationType === 'flat')
                    ? "bg-white text-indigo-700 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Flat Tier Mode (شريحة موحدة)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeScheme === 'revenue_tiers') setRevenueCalculationType('cumulative');
                  if (activeScheme === 'volume_tiers') setVolumeCalculationType('cumulative');
                  if (activeScheme === 'profit_tiers') setProfitCalculationType('cumulative');
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  (activeScheme === 'revenue_tiers' && revenueCalculationType === 'cumulative') ||
                  (activeScheme === 'volume_tiers' && volumeCalculationType === 'cumulative') ||
                  (activeScheme === 'profit_tiers' && profitCalculationType === 'cumulative')
                    ? "bg-white text-indigo-700 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                Cumulative Progressive (تصاعدي تراكمي)
              </button>
            </div>
          )}
        </div>

        {/* --- METHOD 1: REVENUE TIERS --- */}
        {activeScheme === 'revenue_tiers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Revenue Brackets ({revenueTiers.length} Tiers)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {revenueCalculationType === 'flat' 
                    ? 'Total closed won revenue determines which single tier percentage applies to 100% of sales.'
                    : 'Progressive brackets: revenue is taxed/rewarded in slices through each threshold.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRevenueTier}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Revenue Tier</span>
              </button>
            </div>

            <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {revenueTiers.map((tier, idx) => (
                <div key={tier.id} className="p-4 bg-white hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        Tier {idx + 1}: {formatCurrency(tier.min)} - {tier.max >= 99999999 ? '∞ (No Cap)' : formatCurrency(tier.max)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Payout: <strong className="text-indigo-600 font-black">{tier.rate}%</strong> of closed won volume
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Min ($):</span>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={tier.min}
                        onChange={(e) => handleUpdateRevenueTier(tier.id, 'min', parseFloat(e.target.value) || 0)}
                        className="w-28 p-2 text-right bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Max ($):</span>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={tier.max >= 99999999 ? 99999999 : tier.max}
                        onChange={(e) => handleUpdateRevenueTier(tier.id, 'max', parseFloat(e.target.value) || 0)}
                        className="w-28 p-2 text-right bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Rate:</span>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={tier.rate}
                          onChange={(e) => handleUpdateRevenueTier(tier.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="w-20 p-2 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-600 outline-none pr-5"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveRevenueTier(tier.id)}
                      disabled={revenueTiers.length <= 1}
                      className="p-2 text-slate-300 hover:text-rose-600 disabled:opacity-30 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- METHOD 2: VOLUME TIERS (CLOSED DEALS COUNT) --- */}
        {activeScheme === 'volume_tiers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Deals Count Volume Tiers ({volumeTiers.length} Tiers)
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Reps are paid a direct cash bounty per closed-won deal according to the number of deals closed in the cycle.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVolumeTier}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Deal Volume Tier</span>
              </button>
            </div>

            <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {volumeTiers.map((tier, idx) => (
                <div key={tier.id} className="p-4 bg-white hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        {tier.min} to {tier.max >= 999999 ? '∞ deals' : `${tier.max} closed deals`}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Payout: <strong className="text-emerald-600 font-black">{formatCurrency(tier.rate)}</strong> per completed deal
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Min Deals:</span>
                      <input
                        type="number"
                        min="0"
                        value={tier.min}
                        onChange={(e) => handleUpdateVolumeTier(tier.id, 'min', parseInt(e.target.value) || 0)}
                        className="w-20 p-2 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Max Deals:</span>
                      <input
                        type="number"
                        min="0"
                        value={tier.max >= 999999 ? 999999 : tier.max}
                        onChange={(e) => handleUpdateVolumeTier(tier.id, 'max', parseInt(e.target.value) || 0)}
                        className="w-20 p-2 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Per Deal ($):</span>
                      <input
                        type="number"
                        min="0"
                        step="25"
                        value={tier.rate}
                        onChange={(e) => handleUpdateVolumeTier(tier.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 text-right bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-emerald-600 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveVolumeTier(tier.id)}
                      disabled={volumeTiers.length <= 1}
                      className="p-2 text-slate-300 hover:text-rose-600 disabled:opacity-30 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- METHOD 3: FIXED REVENUE PERCENTAGE --- */}
        {activeScheme === 'revenue_fixed' && (
          <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">
                Universal Revenue Commission Rate | نسبة المبيعات الثابتة
              </h3>
              <p className="text-xs text-slate-500 max-w-lg">
                Applied equally to every closed won dollar without quotas, volume thresholds, or brackets.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commission Rate:</span>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={revenueFixedPercentage}
                  onChange={(e) => setRevenueFixedPercentage(parseFloat(e.target.value) || 0)}
                  className="w-24 p-2 text-center bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-600 text-base outline-none pr-6"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>
        )}

        {/* --- METHOD 4: FIXED PROFIT PERCENTAGE --- */}
        {activeScheme === 'profit_fixed' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-800">
                    Default Direct Cost Basis (%)
                  </h4>
                  <span className="text-xs font-bold text-slate-500">
                    {profitCostPercentage}% Cost / {100 - profitCostPercentage}% Margin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Percentage automatically deducted from deal value to represent delivery, advertising, or COGS.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="95"
                    step="5"
                    value={profitCostPercentage}
                    onChange={(e) => setProfitCostPercentage(parseFloat(e.target.value) || 0)}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-xs font-black text-slate-800 w-12 text-right">{profitCostPercentage}%</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-slate-800">
                    Profit Commission Rate (%)
                  </h4>
                  <span className="text-xs font-black text-indigo-600">
                    {profitFixedPercentage}% of Gross Margin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  The sales representative receives this percentage of the remaining net margin.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={profitFixedPercentage}
                    onChange={(e) => setProfitFixedPercentage(parseFloat(e.target.value) || 0)}
                    className="w-24 p-2 text-center bg-white border border-slate-200 rounded-xl font-black text-indigo-600 text-sm outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500">% of Net Margin</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- METHOD 5: PROFIT TIERS --- */}
        {activeScheme === 'profit_tiers' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase text-slate-800">Operating Cost Deduction Basis:</span>
                <span className="text-xs text-slate-500 ml-2">Deducts {profitCostPercentage}% from total revenue before tier evaluation</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={profitCostPercentage}
                  onChange={(e) => setProfitCostPercentage(parseFloat(e.target.value) || 0)}
                  className="w-16 p-1.5 text-center bg-white border border-slate-200 rounded-lg text-xs font-black outline-none"
                />
                <span className="text-xs font-bold text-slate-400">%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                  Gross Profit Brackets ({profitTiers.length} Tiers)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddProfitTier}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Profit Tier</span>
              </button>
            </div>

            <div className="border border-slate-200/80 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {profitTiers.map((tier, idx) => (
                <div key={tier.id} className="p-4 bg-white hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-black shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-black text-slate-800">
                        Tier {idx + 1}: {formatCurrency(tier.min)} - {tier.max >= 99999999 ? '∞ profit' : formatCurrency(tier.max)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Rate: <strong className="text-indigo-600 font-black">{tier.rate}%</strong> of net profit
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Min Profit:</span>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={tier.min}
                        onChange={(e) => handleUpdateProfitTier(tier.id, 'min', parseFloat(e.target.value) || 0)}
                        className="w-28 p-2 text-right bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Max Profit:</span>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        value={tier.max >= 99999999 ? 99999999 : tier.max}
                        onChange={(e) => handleUpdateProfitTier(tier.id, 'max', parseFloat(e.target.value) || 0)}
                        className="w-28 p-2 text-right bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Rate (%):</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={tier.rate}
                        onChange={(e) => handleUpdateProfitTier(tier.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-20 p-2 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-600 outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveProfitTier(tier.id)}
                      disabled={profitTiers.length <= 1}
                      className="p-2 text-slate-300 hover:text-rose-600 disabled:opacity-30 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. REP SPECIFIC OVERRIDES */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-slate-600" />
              <span>Representative Custom Adjustments</span>
            </span>
            <h3 className="text-base font-black text-slate-900 mt-2">
              Sales Rep Individual Cost & Quota Overrides
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Grant custom cost basis deductions or target exceptions to senior executives or trainees.
            </p>
          </div>
        </div>

        <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Sales Representative</th>
                <th className="py-3 px-4">Default Rule Setting</th>
                <th className="py-3 px-4">Custom Cost Deduction (%)</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => {
                const override = repOverrides[user.id];
                const hasOverride = override?.customCostPercentage !== undefined;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{user.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Using System Global ({profitCostPercentage}%)
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder={`Default (${profitCostPercentage}%)`}
                          value={override?.customCostPercentage ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            handleSetRepCostPercentage(user.id, val);
                          }}
                          className="w-32 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                        />
                        {hasOverride && (
                          <button
                            type="button"
                            onClick={() => handleSetRepCostPercentage(user.id, undefined)}
                            className="text-[10px] font-bold text-rose-600 hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {hasOverride ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Custom Override ({override.customCostPercentage}%)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Default Scheme</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. INTERACTIVE LIVE COMMISSION SIMULATOR */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                <span>Real-Time Math Engine</span>
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-1">
              Live Commission Simulator & Payout Breakdown
            </h3>
            <p className="text-xs text-slate-300">
              Verify how your configured rules and tiers calculate bonuses against live sales numbers.
            </p>
          </div>

          <div className="bg-white/10 p-1 rounded-xl flex items-center gap-1 border border-white/10">
            <button
              type="button"
              onClick={() => setSimMode('custom')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                simMode === 'custom' ? "bg-white text-slate-900 font-black" : "text-slate-300 hover:text-white"
              )}
            >
              Hypothetical Test
            </button>
            <button
              type="button"
              onClick={() => setSimMode('rep')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                simMode === 'rep' ? "bg-white text-slate-900 font-black" : "text-slate-300 hover:text-white"
              )}
            >
              Load Actual Rep Data
            </button>
          </div>
        </div>

        {/* Inputs Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {simMode === 'rep' ? (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Select Active Rep:</label>
              <select
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(Number(e.target.value))}
                className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white outline-none"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="text-slate-900">{u.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Test Won Revenue ($):</label>
              <input
                type="number"
                step="5000"
                value={simRevenue}
                onChange={(e) => setSimRevenue(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white outline-none"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Closed Won Deals Count:</label>
            <input
              type="number"
              min="0"
              disabled={simMode === 'rep'}
              value={simDealsCount}
              onChange={(e) => setSimDealsCount(parseInt(e.target.value) || 0)}
              className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white outline-none disabled:opacity-50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Cost Deduction (%):</label>
            <input
              type="number"
              min="0"
              max="90"
              disabled={simMode === 'rep'}
              value={simCostPercentage}
              onChange={(e) => setSimCostPercentage(parseFloat(e.target.value) || 0)}
              className="w-full p-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white outline-none disabled:opacity-50"
            />
          </div>
        </div>

        {/* Output Hero Banner */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-indigo-300">Estimated Total Payout</span>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-bold border border-indigo-400/20">
                {schemes.find(s => s.id === activeScheme)?.label}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
              {formatCurrency(simulationResult.payout)}
            </div>
            <div className="text-xs text-slate-300 font-medium">
              Formula: <span className="font-mono text-indigo-200">{simulationResult.formulaText}</span>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-2 gap-3 min-w-[240px]">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Revenue</div>
              <div className="text-sm font-black text-white font-mono">{formatCurrency(simulationResult.revenue)}</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Deals Won</div>
              <div className="text-sm font-black text-white font-mono">{simulationResult.dealsCount} deals</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Est. Margin</div>
              <div className="text-sm font-black text-white font-mono">{formatCurrency(simulationResult.netProfit)}</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Effective Rate</div>
              <div className="text-sm font-black text-emerald-400 font-mono">
                {simulationResult.revenue > 0 
                  ? ((simulationResult.payout / simulationResult.revenue) * 100).toFixed(2) + '%'
                  : '0%'}
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Traced Calculation */}
        {simulationResult.steps.length > 0 && (
          <div className="space-y-2 border-t border-white/10 pt-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Calculation Breakdown Steps:
            </span>
            <div className="space-y-1">
              {simulationResult.steps.map((step, idx) => (
                <div key={idx} className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <span className="text-indigo-400 font-bold">↳</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
