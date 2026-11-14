import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
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
import { usePerformanceContext } from './PerformanceContext';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';

export const PerformanceAnalysisHubPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const { employees, departments, currentUser } = useHRContext();
  const {
    performanceAnalysis,
    setPerformanceAnalysis,
    analyzedEmployee,
    setAnalyzedEmployee,
    analysisStartDate,
    setAnalysisStartDate,
    analysisEndDate,
    setAnalysisEndDate,
    isRefreshingAnalysis,
    fetchAnalysisWithDates,
    calculateCommissionForEmployee
  } = usePerformanceContext();

  const [appliedRule, setAppliedRule] = useState<any>(null);
  const [isLoadingRule, setIsLoadingRule] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Active employees list
  const activeEmployees = useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || 'active').toLowerCase().trim();
      return s === 'active';
    });
  }, [employees]);

  // Determine targeted employee ID
  useEffect(() => {
    let targetId: number | null = null;
    if (id) {
      targetId = parseInt(id);
    } else if (searchParams.get('employee_id')) {
      targetId = parseInt(searchParams.get('employee_id')!);
    } else if (analyzedEmployee?.id) {
      targetId = analyzedEmployee.id;
    } else if (activeEmployees.length > 0) {
      targetId = activeEmployees[0].id;
    }

    if (targetId && !isNaN(targetId)) {
      setSelectedUserId(prev => prev === targetId ? prev : targetId);
      const emp = employees.find(e => e.id === targetId) || null;
      if (emp && emp.id !== analyzedEmployee?.id) {
        setAnalyzedEmployee(emp);
      }
    }
  }, [id, searchParams, activeEmployees, employees, analyzedEmployee?.id, setAnalyzedEmployee]);

  // Fetch analysis when selectedUserId changes
  useEffect(() => {
    if (selectedUserId) {
      fetchAnalysisWithDates(selectedUserId, analysisStartDate, analysisEndDate);
      fetchScopeRule(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchScopeRule = async (userId: number) => {
    setIsLoadingRule(true);
    const emp = employees.find(e => e.id === userId);
    try {
      const res = await fetch('/api/hr/performance/evaluate-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          department_id: emp?.department_id,
          job_title: emp?.job_title,
          team_name: (emp as any)?.team || ''
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

  const currentEmp = useMemo(() => {
    return employees.find(e => e.id === selectedUserId) || analyzedEmployee;
  }, [employees, selectedUserId, analyzedEmployee]);

  const empName = currentEmp?.name || "Employee Scorecard";
  const empTitle = currentEmp?.job_title || "Team Member";
  const avatarLetter = empName.charAt(0);

  const incentiveResult = useMemo(() => {
    if (!performanceAnalysis) return { amount: 0, formula: '' };
    return calculateCommissionForEmployee(
      performanceAnalysis.user_id || currentEmp?.id || 0,
      performanceAnalysis.won_deals || 0,
      performanceAnalysis.won_deals_value || 0
    );
  }, [calculateCommissionForEmployee, performanceAnalysis, currentEmp]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header with Back Button & Employee Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/performance')}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors shadow-2xs cursor-pointer"
            title="Back to Performance Core"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider">
                Performance Analysis Hub
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Employee Performance Scorecard & Analysis
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Detailed 4-pillar index metrics, live sales incentives, quantitative KPIs, and automated evaluation insights.
            </p>
          </div>
        </div>

        {/* Top Controls: Switcher & Evaluate Action */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap sm:flex-nowrap">
          {/* Employee Switcher */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shadow-2xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedUserId || ''}
              onChange={(e) => {
                const newId = parseInt(e.target.value);
                if (!isNaN(newId)) {
                  setSelectedUserId(newId);
                  navigate(`/hr/performance/analysis/${newId}`);
                }
              }}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none cursor-pointer"
            >
              {activeEmployees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.job_title || 'Staff'})
                </option>
              ))}
            </select>
          </div>

          {currentEmp && (
            <button
              type="button"
              onClick={() => navigate(`/hr/performance/new?employee_id=${currentEmp.id}`)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Evaluate Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Employee Hero Card */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-black text-white text-2xl shadow-inner">
            {avatarLetter}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-400/30">
                Staff Profile
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white mt-0.5">
              {empName}
            </h3>
            <p className="text-xs text-indigo-200 font-medium">{empTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 bg-white/10 rounded-xl text-xs font-bold text-slate-200 border border-white/10">
            ID: #{currentEmp?.id || selectedUserId}
          </span>
          {performanceAnalysis?.period && (
            <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 rounded-xl text-xs font-bold">
              Cycle: {performanceAnalysis.period}
            </span>
          )}
        </div>
      </div>

      {/* Analysis Period Filter Bar */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
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
          {performanceAnalysis?.period && (
            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase self-start md:self-auto">
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
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">To Date</label>
            <input 
              type="date"
              value={analysisEndDate}
              onChange={(e) => setAnalysisEndDate(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-600"
            />
          </div>

          <button
            disabled={isRefreshingAnalysis || !analysisStartDate || !analysisEndDate || !selectedUserId}
            onClick={() => selectedUserId && fetchAnalysisWithDates(selectedUserId, analysisStartDate, analysisEndDate)}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
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

      {/* Engine Rule Summary Card */}
      <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-3">
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

          <div className="flex items-center gap-2 self-start sm:self-auto">
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

      {/* Main Analysis Content */}
      {performanceAnalysis ? (
        <div className="space-y-6">
          {/* Top Metrics Banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-wider">System Performance Score</p>
                <p className="text-4xl font-black mt-1">
                  {(performanceAnalysis.score || 0).toFixed(2)}
                  <span className="text-sm font-medium text-indigo-300/70"> / 10</span>
                </p>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">Composite weighted evaluation index</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black">
                📊
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-[#1b5e20] to-emerald-950 text-white rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-emerald-300 uppercase tracking-wider">Productivity & Efficiency Rate</p>
                <p className="text-4xl font-black mt-1">{(performanceAnalysis.productivity_rate || 0).toFixed(1)}%</p>
                <p className="text-[11px] text-slate-300 mt-1 font-medium">Weighted overall productivity across tasks & targets</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl font-black">
                🚀
              </div>
            </div>
          </div>

          {/* Bento Grid: 4-Pillars & KPI Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* COLUMN 1: 4-PILLARS CORE */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    1. 4-Pillars Performance Metrics
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">Real-time stats compiled from operational modules.</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">Live Feed</span>
              </div>

              <div className="space-y-3.5">
                {/* Tasks */}
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Tasks Completion</span>
                    <span className="font-mono font-black text-indigo-700">{(performanceAnalysis.tasks_adherence || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${performanceAnalysis.tasks_adherence || 0}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Completed: {performanceAnalysis.completed_tasks || 0} of {performanceAnalysis.total_tasks || 0} Tasks</p>
                </div>

                {/* Sales Deals */}
                <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-600" /> Sales Deals Attainment</span>
                    <span className="font-mono font-black text-emerald-700">{(performanceAnalysis.sales_attainment || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all duration-700" style={{ width: `${performanceAnalysis.sales_attainment || 0}%` }} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center text-xs">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase">Deals Won</span>
                      <span className="font-black text-slate-800">{performanceAnalysis.won_deals || 0} / {performanceAnalysis.total_deals || 0}</span>
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
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-sky-600" /> Quality Assurance Score</span>
                    <span className="font-mono font-black text-sky-700">{(performanceAnalysis.qa_passed_rate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full rounded-full transition-all duration-700" style={{ width: `${performanceAnalysis.qa_passed_rate || 0}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Standard QA Evaluation Pass Rate</p>
                </div>

                {/* Attendance */}
                <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-600" /> Attendance Consistency</span>
                    <span className="font-mono font-black text-amber-700">{(performanceAnalysis.attendance_consistency || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full transition-all duration-700" style={{ width: `${performanceAnalysis.attendance_consistency || 0}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Active Logged Days: {performanceAnalysis.attendance_days || 0} Days</p>
                </div>
              </div>
            </div>

            {/* COLUMN 2: KPI ACHIEVEMENTS & WORKFLOW */}
            <div className="space-y-6 flex flex-col justify-between">
              
              {/* KPI Section */}
              <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-2xs space-y-4 flex-1">
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
                      <span className="text-indigo-700 font-black">{(performanceAnalysis.kpiRate || 0).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, performanceAnalysis.kpiRate || 0)}%` }} />
                    </div>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {(performanceAnalysis.kpis || []).map((kpi: any) => {
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
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                    <Info className="w-5 h-5 text-slate-400" />
                    <p className="text-xs font-bold text-slate-600">No Custom KPIs Assigned for This Window</p>
                    <p className="text-[11px] text-slate-400">Scores are evaluated using standard role pillars.</p>
                  </div>
                )}
              </div>

              {/* AUTOMATED ASSESSMENT INSIGHTS */}
              <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-sm space-y-3">
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
      ) : (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">Loading performance analysis scorecard...</p>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalysisHubPage;
