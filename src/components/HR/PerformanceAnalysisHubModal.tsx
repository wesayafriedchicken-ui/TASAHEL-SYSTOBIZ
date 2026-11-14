import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Calendar, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Target, 
  Cpu, 
  Users, 
  Award, 
  Workflow, 
  Sparkles, 
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PerformanceAnalysisHubModalProps {
  performanceAnalysis: any;
  analyzedEmployee: any;
  employees: any[];
  currentUser: any;
  onClose: () => void;
  analysisStartDate: string;
  setAnalysisStartDate: (d: string) => void;
  analysisEndDate: string;
  setAnalysisEndDate: (d: string) => void;
  fetchAnalysisWithDates: (empId: number, start: string, end: string) => Promise<void>;
  isRefreshingAnalysis: boolean;
  calculateCommissionForEmployee: (empId: number, wonDeals: number, wonValue: number) => { amount: number; formula: string };
}

export const PerformanceAnalysisHubModal: React.FC<PerformanceAnalysisHubModalProps> = ({
  performanceAnalysis,
  analyzedEmployee,
  employees,
  currentUser,
  onClose,
  analysisStartDate,
  setAnalysisStartDate,
  analysisEndDate,
  setAnalysisEndDate,
  fetchAnalysisWithDates,
  isRefreshingAnalysis,
  calculateCommissionForEmployee
}) => {
  const [appliedRule, setAppliedRule] = useState<any>(null);
  const [isLoadingRule, setIsLoadingRule] = useState<boolean>(false);

  // Resolve active engine rule for analyzed employee
  useEffect(() => {
    const empId = performanceAnalysis?.user_id || analyzedEmployee?.id;
    if (empId) {
      fetchScopeRule(empId);
    }
  }, [performanceAnalysis?.user_id, analyzedEmployee?.id]);

  const fetchScopeRule = async (userId: number) => {
    setIsLoadingRule(true);
    const emp = analyzedEmployee || employees.find(e => e.id === userId);
    try {
      const res = await fetch('/api/hr/performance/evaluate-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          department_id: emp?.department_id,
          job_title: emp?.job_title,
          team_name: emp?.team || ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAppliedRule(data.applied_rule);
      }
    } catch (err) {
      console.error('Failed to fetch rule for analysis hub', err);
    } finally {
      setIsLoadingRule(false);
    }
  };

  if (!performanceAnalysis) return null;

  const emp = analyzedEmployee || employees.find(e => e.id === performanceAnalysis.user_id);
  const empName = emp?.name || "Employee Scorecard";
  const empTitle = emp?.job_title || "Team Member";
  const avatarLetter = empName.charAt(0);

  const incentiveResult = calculateCommissionForEmployee(
    performanceAnalysis.user_id || emp?.id || 0,
    performanceAnalysis.won_deals || 0,
    performanceAnalysis.won_deals_value || 0
  );

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[160] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 15, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.96 }}
        className="bg-slate-50 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-slate-200 text-slate-800"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between shrink-0 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-black text-white text-xl shadow-inner">
              {avatarLetter}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-400/30">
                  Performance Analysis Hub
                </span>
              </div>
              <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
                {empName}
              </h3>
              <p className="text-xs text-indigo-200 font-medium">{empTitle}</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Main Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* ANALYSIS PERIOD FILTER BAR */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Select Analysis Time Window</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Re-evaluate performance metrics, KPI targets, and sales incentives across custom dates.
                </p>
              </div>
              {performanceAnalysis.period && (
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase">
                  Current Filter: {performanceAnalysis.period}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">From Date</label>
                <input 
                  type="date"
                  value={analysisStartDate}
                  onChange={(e) => setAnalysisStartDate(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">To Date</label>
                <input 
                  type="date"
                  value={analysisEndDate}
                  onChange={(e) => setAnalysisEndDate(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-600"
                />
              </div>

              <button
                disabled={isRefreshingAnalysis || !analysisStartDate || !analysisEndDate}
                onClick={() => emp && fetchAnalysisWithDates(emp.id, analysisStartDate, analysisEndDate)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isRefreshingAnalysis ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Recalculating...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Filter & Recalculate</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ENGINE RULE SUMMARY CARD */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-[#1b5e20] flex items-center justify-center font-black text-xs">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Configured Evaluation Rule & Framework
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Department/Role rule mapping resolved for this evaluation window.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#1b5e20] text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                  {appliedRule?.framework_code?.toUpperCase() || 'HYBRID MODEL'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                  Cycle: {appliedRule?.cycle_frequency || 'Quarterly'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                Active Framework Weight Distribution:
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(appliedRule?.evaluation_weights || { okrs: 40, '360': 30, competencies: 15, mbo: 15 }).map(([key, val]) => (
                  <div key={key} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span className="uppercase text-slate-500">{key}:</span>
                    <span className="text-emerald-700 font-black">{String(val)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* TOP METRICS BANNERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">System Performance Score</p>
                <p className="text-3xl font-black mt-1">
                  {performanceAnalysis.score.toFixed(2)}
                  <span className="text-sm font-medium text-indigo-300/70"> / 10</span>
                </p>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">Composite weighted evaluation index</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black">
                📊
              </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-[#1b5e20] to-emerald-950 text-white rounded-2xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">Productivity & Efficiency Rate</p>
                <p className="text-3xl font-black mt-1">{performanceAnalysis.productivity_rate.toFixed(1)}%</p>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">Weighted overall productivity across tasks & targets</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-black">
                🚀
              </div>
            </div>
          </div>

          {/* BENTO GRID: 4-PILLARS & KPI ACHIEVEMENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COLUMN 1: 4-PILLARS CORE */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    1. 4-Pillars Performance Metrics
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">Real-time stats compiled from operational modules.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">Live Feed</span>
              </div>

              <div className="space-y-3">
                {/* Tasks */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Tasks Completion</span>
                    <span className="font-mono font-black text-indigo-700">{performanceAnalysis.tasks_adherence.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${performanceAnalysis.tasks_adherence}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Completed: {performanceAnalysis.completed_tasks} of {performanceAnalysis.total_tasks} Tasks</p>
                </div>

                {/* Sales Deals */}
                <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-600" /> Sales Deals Attainment</span>
                    <span className="font-mono font-black text-emerald-700">{performanceAnalysis.sales_attainment.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-700" style={{ width: `${performanceAnalysis.sales_attainment}%` }} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center text-xs">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Deals Won</span>
                      <span className="font-black text-slate-800">{performanceAnalysis.won_deals} / {performanceAnalysis.total_deals}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Won Value</span>
                      <span className="font-black text-emerald-700">EGP {(performanceAnalysis?.won_deals_value || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-indigo-600 font-bold uppercase">Incentive</span>
                      <span className="font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 inline-block">
                        EGP {(incentiveResult?.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quality QA */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-sky-600" /> Quality Assurance Score</span>
                    <span className="font-mono font-black text-sky-700">{performanceAnalysis.qa_passed_rate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full rounded-full transition-all duration-700" style={{ width: `${performanceAnalysis.qa_passed_rate}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Standard QA Evaluation Pass Rate</p>
                </div>

                {/* Attendance */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-600" /> Attendance Consistency</span>
                    <span className="font-mono font-black text-amber-700">{performanceAnalysis.attendance_consistency.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full transition-all duration-700" style={{ width: `${performanceAnalysis.attendance_consistency}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Active Logged Days: {performanceAnalysis.attendance_days} Days</p>
                </div>
              </div>
            </div>

            {/* COLUMN 2: KPI ACHIEVEMENTS & WORKFLOW */}
            <div className="space-y-6 flex flex-col justify-between">
              
              {/* KPI Section */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 flex-1">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      2. Active KPI Achievements
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">Quantitative milestone target measurements.</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">Quantified</span>
                </div>

                {performanceAnalysis.hasKpis ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Overall Target Attainment Ratio</span>
                      <span className="text-indigo-700 font-black">{performanceAnalysis.kpiRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, performanceAnalysis.kpiRate)}%` }} />
                    </div>

                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {performanceAnalysis.kpis.map((kpi: any) => {
                        const percent = kpi.target_value > 0 ? ((kpi.actual_value / kpi.target_value) * 100).toFixed(0) : '0';
                        return (
                          <div key={kpi.id} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="font-semibold text-slate-800 truncate max-w-[200px]">{kpi.name}</span>
                            <span className="font-mono text-slate-600 font-bold">
                              {kpi.actual_value} / {kpi.target_value} ({percent}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-1.5">
                    <Info className="w-5 h-5 text-slate-400" />
                    <p className="text-xs font-bold text-slate-600">No Custom KPIs Assigned for This Window</p>
                    <p className="text-[11px] text-slate-400">Scores are evaluated using standard role pillars.</p>
                  </div>
                )}
              </div>

              {/* AUTOMATED ASSESSMENT INSIGHTS */}
              <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-sm space-y-2.5">
                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>3. Engine Assessment Summary</span>
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  "Employee <strong className="text-white">{empName}</strong> achieved a tasks adherence rate of <strong className="text-indigo-300">{(performanceAnalysis?.tasks_adherence || 0).toFixed(1)}%</strong>, with sales deal attainment of <strong className="text-emerald-300">{(performanceAnalysis?.sales_attainment || 0).toFixed(1)}%</strong> (won deal value EGP {(performanceAnalysis?.won_deals_value || 0).toLocaleString()}). Quality QA score is <strong className="text-sky-300">{(performanceAnalysis?.qa_passed_rate || 0).toFixed(1)}%</strong> and attendance consistency is <strong className="text-amber-300">{(performanceAnalysis?.attendance_consistency || 0).toFixed(1)}%</strong>. Composite appraisal score: <strong className="text-white">{(performanceAnalysis?.score || 0).toFixed(2)} / 10</strong>."
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-medium">Engine Audited Review Scorecard</span>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Close Scorecard
          </button>
        </div>
      </motion.div>
    </div>
  );
};
