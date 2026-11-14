import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  List, 
  Settings, 
  Plus, 
  Calendar, 
  Search, 
  TrendingUp, 
  Zap, 
  Activity, 
  Award,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { usePerformanceContext } from './PerformanceContext';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';
import { AdvancedFilter } from '../../../components/HR/AdvancedFilter';
import { CustomFieldsDisplay } from '../../../components/HR/CustomFieldsManager';

export const PerformanceCorePage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    employees, 
    departments, 
    leaves, 
    performance, 
    hrLogs,
    isHRAdmin, 
    canNewEvaluation 
  } = useHRContext();

  const {
    liveEvaluations,
    isLoadingLiveEvaluations,
    fetchLiveEvaluations,
    perfFilterStartDate,
    setPerfFilterStartDate,
    perfFilterEndDate,
    setPerfFilterEndDate,
    perfFilterDept,
    setPerfFilterDept,
    perfFilterEmployee,
    setPerfFilterEmployee,
    performanceViewMode,
    setPerformanceViewMode,
    advancedFilteredPerformance,
    setAdvancedFilteredPerformance
  } = usePerformanceContext();

  const activeEmployees = useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || 'active').toLowerCase().trim();
      return s === 'active';
    });
  }, [employees]);

  // Compute processed list of performance items
  const displayList = useMemo(() => {
    let list = [...liveEvaluations];

    // If liveEvaluations is empty, populate with fallback data from activeEmployees
    if (list.length === 0 && activeEmployees.length > 0) {
      list = activeEmployees.map(emp => {
        const userReviews = performance.filter(p => p.user_id === emp.id);
        const latestReview = userReviews.length > 0 
          ? [...userReviews].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0]
          : null;
        return {
          user_id: emp.id,
          name: emp.name,
          job_title: emp.job_title,
          department_id: emp.department_id,
          score: latestReview?.score || 4.0,
          productivity_rate: latestReview?.productivity_rate || 0.0,
          tasks_adherence: 85,
          sales_attainment: 80,
          qa_passed_rate: 82.5,
          attendance_consistency: 95
        };
      });
    }

    // Apply advanced filter if active
    if (advancedFilteredPerformance !== null) {
      list = list.filter(item => {
        const userReviews = performance.filter(p => p.user_id === item.user_id);
        if (userReviews.length === 0) return false;
        return userReviews.some(ur => advancedFilteredPerformance.some(ap => ap.id === ur.id));
      });
    }

    // Filter by Department
    if (perfFilterDept !== 'all') {
      list = list.filter(item => item.department_id === perfFilterDept);
    }

    // Filter by Employee Search
    if (perfFilterEmployee.trim() !== '') {
      const searchLower = perfFilterEmployee.toLowerCase();
      list = list.filter(item => {
        const nameStr = item.name ? String(item.name).toLowerCase() : '';
        const jobTitleStr = item.job_title ? String(item.job_title).toLowerCase() : '';
        return nameStr.includes(searchLower) || jobTitleStr.includes(searchLower);
      });
    }

    // Sort descending by score
    list.sort((a, b) => (b.score || 0) - (a.score || 0));

    return list;
  }, [
    liveEvaluations, 
    activeEmployees, 
    performance, 
    advancedFilteredPerformance, 
    perfFilterDept, 
    perfFilterEmployee
  ]);

  const renderTabLogs = (entityTypes: string[], actionTypes: string[]) => {
    const filteredLogs = hrLogs.filter(log => 
      entityTypes.includes(log.entity_type) || actionTypes.includes(log.action)
    );

    return (
      <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase">Log History</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200">
            {filteredLogs.length} Records
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <p className="text-xs text-slate-400 font-medium py-4 text-center">No logs recorded for this section yet.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-3 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-black text-[10px] uppercase">
                    {log.action}
                  </span>
                  <span className="text-slate-700 font-medium">{log.description || log.details || 'Action performed'}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 shrink-0 text-[11px]">
                  <span>{log.performed_by_name || log.user_name || 'System'}</span>
                  <span>{log.created_at ? new Date(log.created_at).toLocaleDateString() : ''}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        {/* Top Header & Toggler */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">System Performance Core</h3>
            <p className="text-xs text-slate-500 font-bold mt-1">
              Track live performance metrics, operations, and productivity rates
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Board / List toggler */}
            <div className="flex bg-slate-100 p-1 border border-slate-200/60 rounded-xl shadow-xs">
              <button 
                type="button"
                onClick={() => setPerformanceViewMode('board')} 
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer", 
                  performanceViewMode === 'board' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                )}
                title="Board View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>
              <button 
                type="button"
                onClick={() => setPerformanceViewMode('list')} 
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer", 
                  performanceViewMode === 'list' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
                )}
                title="List View"
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            <button 
              type="button"
              onClick={() => navigate('/hr/performance/engine')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1b5e20] text-white rounded-xl text-xs font-bold hover:bg-emerald-900 shadow-md transition-all cursor-pointer"
              title="Performance Appraisal Engine & Evaluation Rules"
            >
              <Settings className="w-4 h-4" />
              <span>Appraisal Engine & Evaluation Rules</span>
            </button>

            {(isHRAdmin || canNewEvaluation) && (
              <button 
                type="button"
                onClick={() => navigate('/hr/performance/new')}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" /> New Evaluation
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Interactive Filter & Calculator Bar */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end shadow-xs">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Analysis From Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="date"
                value={perfFilterStartDate}
                onChange={(e) => setPerfFilterStartDate(e.target.value)}
                className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Analysis To Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="date"
                value={perfFilterEndDate}
                onChange={(e) => setPerfFilterEndDate(e.target.value)}
                className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Filter by Department
            </label>
            <select
              value={perfFilterDept}
              onChange={(e) => {
                const val = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
                setPerfFilterDept(val);
              }}
              className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Search Employee
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Employee name..."
                value={perfFilterEmployee}
                onChange={(e) => setPerfFilterEmployee(e.target.value)}
                className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="md:col-span-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60 mt-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-black uppercase tracking-wider bg-indigo-50/50 px-2.5 py-1.5 rounded-xl border border-indigo-100/30">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Sorted by Live Score descending</span>
              </div>

              <AdvancedFilter 
                items={performance} 
                entityType="performance" 
                departments={departments}
                employees={employees}
                onFilter={setAdvancedFilteredPerformance} 
                title=""
                compact={true}
              />
            </div>

            <button
              type="button"
              onClick={() => fetchLiveEvaluations(perfFilterStartDate, perfFilterEndDate, perfFilterDept)}
              disabled={isLoadingLiveEvaluations}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/15 cursor-pointer"
            >
              {isLoadingLiveEvaluations ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calculating & filtering...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 animate-pulse" />
                  <span>Calculate Live Performance</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* List Content */}
        {displayList.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
            <p className="text-slate-400 text-sm font-bold">No employees match current search filters.</p>
          </div>
        ) : performanceViewMode === 'board' ? (
          /* BOARD VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayList.map((item, idx) => {
              const empObj = employees.find(e => e.id === item.user_id) || {
                id: item.user_id,
                name: item.name || '',
                job_title: item.job_title || '',
                department_id: item.department_id,
                salary_base: 0,
                allowances: 0
              };

              const score = item.score || 0;
              const productivity = item.productivity_rate || 0;

              const tasks_adherence = item.tasks_adherence ?? 85;
              const sales_attainment = item.sales_attainment ?? 80;
              const qa_passed_rate = item.qa_passed_rate ?? 82.5;
              const attendance_consistency = item.attendance_consistency ?? 95;

              // Rank designator
              const rankNum = idx + 1;
              let rankBadge = "bg-slate-100 text-slate-700 border-slate-200";
              let rankIcon = null;
              if (rankNum === 1) {
                rankBadge = "bg-amber-500/10 text-amber-600 border-amber-500/20";
                rankIcon = "🏆";
              } else if (rankNum === 2) {
                rankBadge = "bg-slate-300/30 text-slate-700 border-slate-300/40";
                rankIcon = "🥈";
              } else if (rankNum === 3) {
                rankBadge = "bg-amber-700/10 text-amber-800 border-amber-700/20";
                rankIcon = "🥉";
              }

              const deptName = departments.find(d => d.id === item.department_id)?.name || "General Unit";

              return (
                <div 
                  key={item.user_id} 
                  className="p-6 border border-slate-200/60 bg-white rounded-3xl space-y-4 hover:border-indigo-400 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between shadow-2xs"
                >
                  {/* Rank Badge & Top section */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1",
                      rankBadge
                    )}>
                      {rankIcon && <span>{rankIcon}</span>}
                      <span>Rank #{rankNum}</span>
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Avatar, Name, Job Title */}
                    <div className="flex items-start gap-3 pt-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 shadow-2xs border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all text-base">
                        {item.name ? item.name[0] : ''}
                      </div>
                      <div className="max-w-[150px]">
                        <h4 className="text-sm font-black text-slate-800 truncate">{item.name || ''}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{item.job_title || ''}</p>
                        <p className="text-[9px] text-indigo-500 font-extrabold mt-0.5 truncate">{deptName}</p>
                      </div>
                    </div>

                    {/* Major Performance Score Dashboard */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Live Score</p>
                        <p className="text-lg font-black text-indigo-600 mt-0.5">
                          {score > 0 ? score.toFixed(1) : '0.0'}
                          <span className="text-xs text-slate-400">/10</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Productivity Index</p>
                        <p className="text-lg font-black text-emerald-600 mt-0.5">{productivity.toFixed(0)}%</p>
                      </div>
                    </div>
                    
                    {/* Overall Productivity Index Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase">
                        <span>Productivity index</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/30">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full transition-all duration-1000" 
                          style={{ width: `${Math.min(100, productivity)}%` }} 
                        />
                      </div>
                    </div>

                    {/* 4 Pillars Mini Progress Grid */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">4-Pillar Status</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-[9px]">
                        {/* Pillar 1: Tasks */}
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-medium block">Tasks</span>
                          <span className="font-mono font-black text-indigo-600">{tasks_adherence.toFixed(0)}%</span>
                        </div>
                        
                        {/* Pillar 2: Sales */}
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-medium block">Sales</span>
                          <span className="font-mono font-black text-emerald-600">{sales_attainment.toFixed(0)}%</span>
                        </div>

                        {/* Pillar 3: QA */}
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-medium block">QA</span>
                          <span className="font-mono font-black text-sky-600">{qa_passed_rate.toFixed(0)}%</span>
                        </div>

                        {/* Pillar 4: Attendance */}
                        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                          <span className="text-slate-500 font-medium block">Attendance</span>
                          <span className="font-mono font-black text-amber-600">{attendance_consistency.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Custom Fields Section */}
                    {(() => {
                      const userReviews = performance.filter(p => p.user_id === item.user_id);
                      const latestReview = userReviews.length > 0 
                        ? [...userReviews].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0]
                        : null;
                      const reviewId = item.id || latestReview?.id;
                      return reviewId ? (
                        <div className="pt-2 border-t border-slate-100">
                          <CustomFieldsDisplay entityType="performance" entityId={reviewId} />
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-150/50 mt-1">
                    <button 
                      type="button"
                      onClick={() => navigate(`/hr/performance/analysis/${item.user_id}`)}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-indigo-600" />
                      <span>ANALYSIS</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => navigate(`/hr/performance/new?employee_id=${item.user_id}`)}
                      className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>EVALUATE</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Live Score</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Productivity Rate</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">4 pillars Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayList.map((item, idx) => {
                    const empObj = employees.find(e => e.id === item.user_id) || {
                      id: item.user_id,
                      name: item.name || '',
                      job_title: item.job_title || '',
                      department_id: item.department_id,
                      salary_base: 0,
                      allowances: 0
                    };

                    const score = item.score || 0;
                    const productivity = item.productivity_rate || 0;
                    const tasks_adherence = item.tasks_adherence ?? 85;
                    const sales_attainment = item.sales_attainment ?? 80;
                    const qa_passed_rate = item.qa_passed_rate ?? 82.5;
                    const attendance_consistency = item.attendance_consistency ?? 95;

                    const rankNum = idx + 1;
                    let rankIcon = null;
                    if (rankNum === 1) rankIcon = "🏆";
                    else if (rankNum === 2) rankIcon = "🥈";
                    else if (rankNum === 3) rankIcon = "🥉";

                    const deptName = departments.find(d => d.id === item.department_id)?.name || "General Unit";

                    return (
                      <tr key={item.user_id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-bold text-slate-600">
                          <span className="flex items-center gap-1">
                            {rankIcon && <span>{rankIcon}</span>}
                            <span>#{rankNum}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600 text-xs">
                              {item.name ? item.name[0] : ''}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{item.job_title}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-500">{deptName}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-black text-indigo-600">{score > 0 ? score.toFixed(1) : '0.0'}/10</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-black text-emerald-600">{productivity.toFixed(0)}%</span>
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/30">
                              <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, productivity)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-600">Tasks: {tasks_adherence.toFixed(0)}%</span>
                            <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-600">Sales: {sales_attainment.toFixed(0)}%</span>
                            <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-600">QA: {qa_passed_rate.toFixed(0)}%</span>
                            <span className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-600">Attend: {attendance_consistency.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              type="button"
                              onClick={() => navigate(`/hr/performance/analysis/${item.user_id}`)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                              title="Analysis"
                            >
                              <Activity className="w-3.5 h-3.5 text-indigo-600" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => navigate(`/hr/performance/new?employee_id=${item.user_id}`)}
                              className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
                              title="Evaluate"
                            >
                              <Award className="w-3.5 h-3.5" />
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
      </div>

      {/* Analytics Banner */}
      <div className="bg-emerald-900 p-8 rounded-3xl text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2">Performance Analytics</h3>
          <p className="text-emerald-100 text-sm opacity-80 mb-6 max-w-lg">
            Evaluations are system-correlated with task completion rates, quality metrics from QA module, and attendance consistency.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Headcount', value: `${employees.length} Staff`, info: 'Across all departments' },
              { label: 'Average Base Salary', value: `EGP ${Math.round(employees.reduce((acc, curr) => acc + (curr.salary_base || 0), 0) / (employees.length || 1)).toLocaleString()}`, info: 'Basic compensation index' },
              { label: 'Total Departments', value: `${departments.length} Units`, info: 'Functional departments' },
              { label: 'Pending Leave Requests', value: `${leaves.filter(l => l.status === 'Pending').length} Pending`, info: 'Awaiting HR validation' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <p className="text-xs text-emerald-200 font-medium mb-1">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-emerald-400 mt-1">{stat.info}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      {/* Log History */}
      {renderTabLogs(['HR Performance'], ['EVALUATE_PERFORMANCE'])}
    </div>
  );
};

export default PerformanceCorePage;
