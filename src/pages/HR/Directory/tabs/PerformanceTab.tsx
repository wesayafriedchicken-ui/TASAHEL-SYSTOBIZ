import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Trophy, Award, RefreshCw, Plus, Calendar, Zap, BarChart2, 
  CheckCircle2, TrendingUp, ShieldCheck, Clock, FileText, Star,
  AlertCircle
} from 'lucide-react';
import { EmployeeProfileOutletContext } from './types';
import { PerformanceEvaluationModal } from '../../../../components/HR/PerformanceEvaluationModal';
import { cn } from '../../../../lib/utils';

export const PerformanceTab: React.FC = () => {
  const { 
    employee: emp, 
    isViewOnly: isViewOnlyMode, 
    currentUser,
    showCustomToast,
    employees: allEmployees = [],
    departments = []
  } = useOutletContext<EmployeeProfileOutletContext>();

  if (!emp) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 font-medium text-xs">
        No employee data available.
      </div>
    );
  }

  // Dates state
  const [analysisStartDate, setAnalysisStartDate] = useState(() => 
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [analysisEndDate, setAnalysisEndDate] = useState(() => 
    new Date().toISOString().split('T')[0]
  );

  // Performance state
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<any>(null);
  const [isRefreshingAnalysis, setIsRefreshingAnalysis] = useState<boolean>(false);

  // Review modal state
  const [showPerformanceModal, setShowPerformanceModal] = useState<boolean>(false);
  const [performanceCustomFieldValues, setPerformanceCustomFieldValues] = useState<Record<string, any>>({});
  const [reviewFormData, setReviewFormData] = useState({
    id: null as number | null,
    user_id: emp.id,
    period: 'Monthly',
    score: 8.5,
    productivity_rate: 85.0,
    strengths: '',
    areas_for_improvement: '',
    status: 'Finalized',
    created_at: new Date().toISOString().slice(0, 16)
  });

  // Keep review form synced with target employee
  useEffect(() => {
    if (emp?.id) {
      setReviewFormData(prev => ({
        ...prev,
        user_id: emp.id
      }));
    }
  }, [emp?.id]);

  // Fetch reviews for this employee
  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/performance', {
        headers: { 'x-user-id': currentUser?.id?.toString() || '1' }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPerformanceReviews(data);
        }
      }
    } catch (err) {
      console.warn('Could not load performance reviews:', err);
    }
  }, [currentUser?.id]);

  // Fetch live evaluation & analysis
  const fetchAnalysisWithDates = useCallback(async (empId: number, start: string, end: string) => {
    try {
      setIsRefreshingAnalysis(true);
      const url = `/api/hr/performance/evaluate/${empId}?startDate=${start}&endDate=${end}`;
      const res = await fetch(url, {
        headers: { 'x-user-id': currentUser?.id?.toString() || '1' }
      });
      if (res.ok) {
        const data = await res.json();
        setPerformanceAnalysis(data);
      }
    } catch (err) {
      console.error('Failed to fetch analysis:', err);
    } finally {
      setIsRefreshingAnalysis(false);
    }
  }, [currentUser?.id]);

  // Initial load
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    if (emp?.id) {
      fetchAnalysisWithDates(emp.id, analysisStartDate, analysisEndDate);
    }
  }, [emp?.id, fetchAnalysisWithDates, analysisStartDate, analysisEndDate]);

  // Handle Review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/hr/performance', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify({ ...reviewFormData, reviewer_id: currentUser?.id })
      });
      if (res.ok) {
        setShowPerformanceModal(false);
        await fetchReviews();
        if (emp?.id) {
          await fetchAnalysisWithDates(emp.id, analysisStartDate, analysisEndDate);
        }
        showCustomToast('Performance review saved successfully!', 'success');
      } else {
        showCustomToast('Failed to save performance review', 'error');
      }
    } catch (err) {
      console.error('Failed to save performance review:', err);
      showCustomToast('Failed to save performance review', 'error');
    }
  };

  // Dynamic ranking calculations matching HRManagement
  const { sortedCompany, companyRank, totalCompany, deptRank, totalDept, rankIcon, rankBadgeColor, rankTitle } = useMemo(() => {
    const list = (allEmployees.length > 0 ? allEmployees : [emp]).map(empItem => {
      const userReviews = (performanceReviews || []).filter(p => p.user_id === empItem.id);
      const latestRev = userReviews.length > 0
        ? [...userReviews].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0]
        : null;
      let score = 8.0;
      if (empItem.id === emp.id && performanceAnalysis && typeof performanceAnalysis.score === 'number') {
        score = performanceAnalysis.score;
      } else if (latestRev && typeof latestRev.score === 'number') {
        score = latestRev.score;
      }
      return { id: empItem.id, score, deptId: empItem.department_id };
    }).sort((a, b) => b.score - a.score);

    const cRank = Math.max(1, list.findIndex(e => e.id === emp.id) + 1);
    const totComp = list.length || 1;

    const dList = list.filter(e => e.deptId === emp.department_id);
    const dRank = Math.max(1, dList.findIndex(e => e.id === emp.id) + 1);
    const totDept = dList.length || 1;

    let icon = "🏆";
    let badgeColor = "bg-amber-400 text-amber-950 border-amber-300";
    let title = "Top Performer";
    if (cRank === 2) {
      icon = "🥈";
      badgeColor = "bg-slate-200 text-slate-900 border-slate-300";
      title = "Runner Up";
    } else if (cRank === 3) {
      icon = "🥉";
      badgeColor = "bg-amber-700/20 text-amber-300 border-amber-700/30";
      title = "High Achiever";
    } else if (cRank > 3) {
      icon = "🎖️";
      badgeColor = "bg-emerald-800/40 text-emerald-200 border-emerald-700/50";
      title = `Ranked #${cRank}`;
    }

    return {
      sortedCompany: list,
      companyRank: cRank,
      totalCompany: totComp,
      deptRank: dRank,
      totalDept: totDept,
      rankIcon: icon,
      rankBadgeColor: badgeColor,
      rankTitle: title
    };
  }, [allEmployees, emp, performanceReviews, performanceAnalysis]);

  // Active analysis fallback
  const activeAnalysis = useMemo(() => {
    if (performanceAnalysis && performanceAnalysis.user_id === emp.id) {
      return performanceAnalysis;
    }
    return {
      user_id: emp.id,
      score: 8.50,
      productivity_rate: 85.6,
      tasks_adherence: 85.0,
      completed_tasks: 0,
      total_tasks: 0,
      sales_attainment: 80.0,
      won_deals: 0,
      total_deals: 0,
      won_deals_value: 0,
      qa_passed_rate: 90.0,
      attendance_consistency: 95.0,
      attendance_days: 0,
      hasKpis: false,
      kpiRate: 0,
      kpis: [],
      period: `${analysisStartDate} to ${analysisEndDate}`
    };
  }, [performanceAnalysis, emp.id, analysisStartDate, analysisEndDate]);

  const activeScore = activeAnalysis.score ? Number(activeAnalysis.score).toFixed(2) : '8.50';
  const activeProd = activeAnalysis.productivity_rate ? Number(activeAnalysis.productivity_rate).toFixed(1) : '85.6';

  const empReviews = useMemo(() => {
    return (performanceReviews || []).filter(p => p.user_id === emp.id || p.user_id === emp.user_id);
  }, [performanceReviews, emp.id, emp.user_id]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HIGHLIGHT: RANK & LEADERBOARD CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#13522a] to-emerald-950 text-white p-6 md:p-8 shadow-xl border border-emerald-500/20">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center text-3xl md:text-4xl shadow-lg border-2 border-white/30 shrink-0">
              {rankIcon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", rankBadgeColor)}>
                  {rankTitle}
                </span>
                <span className="bg-white/10 text-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                  Company Leaderboard
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Rank #{companyRank}</span>
                <span className="text-emerald-300/80 text-lg font-bold">of {totalCompany} Employees</span>
              </h2>
              <p className="text-xs text-emerald-100/80 font-medium mt-1">
                Current employee rank based on comprehensive 4-Pillars analysis and KPI metrics.
              </p>
            </div>
          </div>

          {!isViewOnlyMode && (
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button
                type="button"
                onClick={() => fetchAnalysisWithDates(emp.id, analysisStartDate, analysisEndDate)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/10 backdrop-blur-sm cursor-pointer"
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshingAnalysis && "animate-spin")} />
                <span>Recalculate Rank</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPerformanceModal(true)}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition shadow-lg shadow-amber-400/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Review</span>
              </button>
            </div>
          )}
        </div>

        {/* Sub-grid with Rank metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="block text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider">Company Rank</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-amber-300">#{companyRank}</span>
              <span className="text-xs text-emerald-200/60 font-semibold">/ {totalCompany}</span>
            </div>
            <span className="text-[9px] text-emerald-300 font-bold block mt-1">
              Top {Math.max(1, Math.round((companyRank / totalCompany) * 100))}% Performer
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="block text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider">Department Rank</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-white">#{deptRank}</span>
              <span className="text-xs text-emerald-200/60 font-semibold">/ {totalDept}</span>
            </div>
            <span className="text-[9px] text-emerald-200/80 font-bold block mt-1 truncate">
              {departments.find(d => d.id === emp.department_id)?.name || emp.department_name || 'General Unit'}
            </span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="block text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider">Performance Score</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-300">{activeScore}</span>
              <span className="text-xs text-emerald-200/60 font-semibold">/ 10</span>
            </div>
            <span className="text-[9px] text-emerald-300 font-bold block mt-1">Overall System Score</span>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <span className="block text-[10px] font-bold text-emerald-200/70 uppercase tracking-wider">Productivity Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-sky-300">{activeProd}%</span>
            </div>
            <span className="text-[9px] text-sky-200/80 font-bold block mt-1">Efficiency Index</span>
          </div>
        </div>
      </div>

      {/* 2. DATE FILTER & RECALCULATE CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1b5e20]" />
              <span>Analysis Period</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
              Select time range to recalculate 4-Pillars and KPI metrics live.
            </p>
          </div>
          {activeAnalysis?.period && (
            <span className="text-[10px] font-black text-[#1b5e20] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase self-start md:self-auto">
              Active Period: {activeAnalysis.period}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              From (Start Date)
            </label>
            <input
              type="date"
              value={analysisStartDate}
              onChange={(e) => setAnalysisStartDate(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              To (End Date)
            </label>
            <input
              type="date"
              value={analysisEndDate}
              onChange={(e) => setAnalysisEndDate(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-[#1b5e20] focus:ring-1 focus:ring-[#1b5e20]"
            />
          </div>

          <button
            type="button"
            disabled={isRefreshingAnalysis || !analysisStartDate || !analysisEndDate}
            onClick={() => fetchAnalysisWithDates(emp.id, analysisStartDate, analysisEndDate)}
            className="w-full py-2.5 bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isRefreshingAnalysis ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Updating</span>
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

      {/* 3. EMPLOYEE PERFORMANCE ANALYSIS / 4-PILLARS CORE */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#1b5e20]" />
              <span>Employee Performance Analysis</span>
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Analytical results, 4-Pillars metrics, and extracted KPIs for the selected period.
            </p>
          </div>
          <span className="text-xs font-bold text-[#1b5e20] bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full uppercase tracking-wider self-start md:self-auto">
            Period: {activeAnalysis.period || `${analysisStartDate} to ${analysisEndDate}`}
          </span>
        </div>

        {/* Top Summary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 border border-slate-700/50 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-200/80 tracking-widest block">System Performance Score</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-amber-300">{activeScore}</span>
                <span className="text-sm font-bold text-slate-400">/ 10</span>
              </div>
              <span className="text-[10px] text-slate-300 font-medium block mt-1">Total live composite performance score</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
              <BarChart2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0c381a] via-[#13522a] to-emerald-950 text-white rounded-2xl p-5 border border-emerald-600/30 shadow-md flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-200/80 tracking-widest block">Overall Efficiency / Productivity</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-emerald-300">{activeProd}%</span>
              </div>
              <span className="text-[10px] text-emerald-100/80 font-medium block mt-1">Weighted overall productivity based on active filter</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Pillars & KPIs Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pillar Core */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 space-y-4">
            <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-[#1b5e20]" />
                <span>1. 4-Pillar Performance Core</span>
              </h4>
              <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full font-bold">LIVE STATS</span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Tasks */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-600" /> Tasks</span>
                  <span className="font-mono text-slate-950 font-black">{Number(activeAnalysis.tasks_adherence || 85).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-700" style={{ width: `${activeAnalysis.tasks_adherence || 85}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Completed: {activeAnalysis.completed_tasks || 0} / {activeAnalysis.total_tasks || 0} Tasks</p>
              </div>

              {/* Sales */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Sales Deals</span>
                  <span className="font-mono text-slate-950 font-black">{Number(activeAnalysis.sales_attainment || 80).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full transition-all duration-700" style={{ width: `${activeAnalysis.sales_attainment || 80}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center text-[10px]">
                  <div>
                    <span className="text-slate-400 block font-semibold">Won Deals</span>
                    <span className="font-bold text-slate-800">{activeAnalysis.won_deals || 0} / {activeAnalysis.total_deals || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Deals Value</span>
                    <span className="font-bold text-emerald-600">EGP {Number(activeAnalysis.won_deals_value || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Quality QA */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-sky-600" /> Quality QA</span>
                  <span className="font-mono text-slate-950 font-black">{Number(activeAnalysis.qa_passed_rate || 90).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-sky-600 h-full rounded-full transition-all duration-700" style={{ width: `${activeAnalysis.qa_passed_rate || 90}%` }} />
                </div>
              </div>

              {/* Attendance */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /> Attendance</span>
                  <span className="font-mono text-slate-950 font-black">{Number(activeAnalysis.attendance_consistency || 95).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full transition-all duration-700" style={{ width: `${activeAnalysis.attendance_consistency || 95}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Logged Workdays: {activeAnalysis.attendance_days || 0} Days</p>
              </div>
            </div>
          </div>

          {/* KPIs & AI Insights */}
          <div className="space-y-4 flex flex-col justify-between">
            {/* Active KPIs */}
            <div className="bg-slate-50/70 rounded-2xl border border-slate-200/80 p-5 space-y-4 flex-1">
              <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>2. Active KPI Achievements</span>
                </h4>
                <span className="text-[10px] text-indigo-800 bg-indigo-100/80 px-2.5 py-0.5 rounded-full font-bold">CALCULATED</span>
              </div>

              {activeAnalysis.hasKpis && activeAnalysis.kpis?.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Overall KPI Attainment</span>
                    <span className="text-[#1b5e20] font-black">{Number(activeAnalysis.kpiRate || 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#1b5e20] h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, activeAnalysis.kpiRate || 0)}%` }} />
                  </div>
                  <div className="space-y-2 pt-2">
                    {activeAnalysis.kpis.map((kpi: any) => {
                      const pct = kpi.target_value > 0 ? Math.round((kpi.actual_value / kpi.target_value) * 100) : 0;
                      return (
                        <div key={kpi.id} className="p-2.5 bg-white rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{kpi.name}</span>
                          <span className="font-mono text-slate-900 font-black">{kpi.actual_value} / {kpi.target_value} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center space-y-1 my-auto">
                  <p className="text-xs text-slate-400 italic font-medium">No specific KPI metrics set for this employee during the selected period.</p>
                  <p className="text-[10px] text-slate-400">No active KPIs specified for this range.</p>
                </div>
              )}
            </div>

            {/* AI Summary Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md space-y-2.5 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                <Zap className="w-4 h-4 animate-pulse text-amber-400" />
                <span>Automated Performance Insights</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                "Employee <strong className="text-white">{emp.name}</strong> has an overall performance score of <strong className="text-emerald-400">{(activeAnalysis.score || 8.5).toFixed(2)}/10</strong> with a productivity rate of <strong className="text-sky-300">{(activeAnalysis.productivity_rate || 85.6).toFixed(1)}%</strong>. Company rank is <strong className="text-amber-300">#{companyRank}</strong> and department rank is <strong className="text-amber-300">#{deptRank}</strong>. Consistent performance meeting high quality standards."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. PAST FORMAL EVALUATION REVIEWS HISTORY */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1b5e20]" />
              <span>Evaluation Reviews History</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold">Record of performance reports and management-approved reviews</p>
          </div>
          {!isViewOnlyMode && (
            <button
              type="button"
              onClick={() => setShowPerformanceModal(true)}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#1b5e20] text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Conduct Review
            </button>
          )}
        </div>

        {empReviews.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <Award className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-bold">No formal review logs recorded yet</p>
            <p className="text-[10px] text-slate-400">Press 'Conduct Review' above to issue a formal performance evaluation report.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {empReviews.map((rev: any) => (
              <div key={rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{rev.review_period || 'Annual Review'}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">{new Date(rev.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                      Score: {typeof rev.score === 'number' ? rev.score.toFixed(1) : (rev.score || 'N/A')} / 10
                    </span>
                  </div>
                </div>
                {rev.comments && (
                  <p className="text-xs text-slate-600 font-medium bg-white p-3 rounded-xl border border-slate-100">{rev.comments}</p>
                )}
                {(rev.strengths || rev.areas_for_improvement) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] pt-1">
                    {rev.strengths && (
                      <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                        <span className="font-bold text-emerald-900 block uppercase">Strengths:</span>
                        <span className="text-emerald-800">{rev.strengths}</span>
                      </div>
                    )}
                    {rev.areas_for_improvement && (
                      <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                        <span className="font-bold text-amber-900 block uppercase">Areas for Growth:</span>
                        <span className="text-amber-800">{rev.areas_for_improvement}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Performance Evaluation Modal */}
      <PerformanceEvaluationModal
        isOpen={showPerformanceModal}
        onClose={() => setShowPerformanceModal(false)}
        reviewFormData={reviewFormData}
        setReviewFormData={setReviewFormData}
        employees={allEmployees.length > 0 ? allEmployees : [emp]}
        departments={departments}
        currentUser={currentUser}
        handleSubmitReview={handleSubmitReview}
        performanceCustomFieldValues={performanceCustomFieldValues}
        setPerformanceCustomFieldValues={setPerformanceCustomFieldValues}
      />
    </div>
  );
};

export default PerformanceTab;
