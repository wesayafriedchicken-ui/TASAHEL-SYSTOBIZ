import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, TrendingUp, Award, Settings, Search, Plus, 
  Users, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, 
  DollarSign, Briefcase, Calendar, ShieldCheck, Clock
} from 'lucide-react';

interface TargetProps {
  performanceOverview: any[];
  loadingPerformance: boolean;
  onRefresh: (start?: string, end?: string) => void;
  onSaveTarget: (empId: number, source: string, val: number) => Promise<boolean>;
  onApplyBonus: (emp: any) => Promise<boolean>;
  showCelebration: string | null;
  departments: any[];
}

export default function KPIPerformanceHub({
  performanceOverview,
  loadingPerformance,
  onRefresh,
  onSaveTarget,
  onApplyBonus,
  showCelebration,
  departments
}: TargetProps) {
  const [activeTab, setActiveTab] = useState<'targets' | 'matrix' | 'appraisal'>('targets');
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');
  
  // View mode: Individual vs Departmental Targets
  const [targetType, setTargetType] = useState<'individual' | 'departmental'>('individual');
  const [departmentalOverview, setDepartmentalOverview] = useState<any[]>([]);
  const [loadingDeptPerformance, setLoadingDeptPerformance] = useState(false);

  // Individual Target Modal State
  const [targetEmp, setTargetEmp] = useState<any | null>(null);
  const [targetValue, setTargetValue] = useState('');
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  // Departmental Target Modal State
  const [selectedDeptTarget, setSelectedDeptTarget] = useState<any | null>(null);
  const [deptTargetValue, setDeptTargetValue] = useState('');
  const [isSavingDeptTarget, setIsSavingDeptTarget] = useState(false);

  const fetchDeptPerformance = async () => {
    setLoadingDeptPerformance(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch(`/api/kpis/departmental-overview?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartmentalOverview(data);
      }
    } catch (err) {
      console.error("Error fetching departmental overview:", err);
    } finally {
      setLoadingDeptPerformance(false);
    }
  };

  useEffect(() => {
    onRefresh(startDate, endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'targets' && targetType === 'departmental') {
      fetchDeptPerformance();
    }
  }, [activeTab, targetType, startDate, endDate]);

  const handleRefreshAll = () => {
    onRefresh(startDate, endDate);
    if (targetType === 'departmental') {
      fetchDeptPerformance();
    }
  };

  // Bonus posting state
  const [postingBonusId, setPostingBonusId] = useState<number | null>(null);

  // Sorting States
  const [targetsSortBy, setTargetsSortBy] = useState<string>('name');
  const [matrixSortBy, setMatrixSortBy] = useState<string>('score-desc');
  const [appraisalSortBy, setAppraisalSortBy] = useState<string>('score-desc');

  // Filter & Search employee data
  const filteredEmployees = performanceOverview.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'all' || (emp.department_name && emp.department_name.toLowerCase().includes(deptFilter.toLowerCase()));
    return matchesSearch && matchesDept;
  });

  // Filter & Search departmental data
  const filteredDepartments = departmentalOverview.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'all' || dept.name.toLowerCase().includes(deptFilter.toLowerCase());
    return matchesSearch && matchesDept;
  });

  // Sort for Target Setting Desk
  const sortedTargetsEmployees = [...filteredEmployees].sort((a, b) => {
    if (targetsSortBy === 'name') {
      return a.name.localeCompare(b.name, 'ar');
    }
    if (targetsSortBy === 'dept') {
      return (a.department_name || '').localeCompare(b.department_name || '', 'ar');
    }
    if (targetsSortBy === 'target') {
      const targetA = a.targets[a.metric_source] || 0;
      const targetB = b.targets[b.metric_source] || 0;
      return targetB - targetA;
    }
    if (targetsSortBy === 'productivity') {
      return b.productivity_rate - a.productivity_rate;
    }
    return 0;
  });

  // Sort for Performance Matrix
  const sortedMatrixEmployees = [...filteredEmployees].sort((a, b) => {
    if (matrixSortBy === 'score-desc') {
      return b.final_score - a.final_score;
    }
    if (matrixSortBy === 'score-asc') {
      return a.final_score - b.final_score;
    }
    if (matrixSortBy === 'name') {
      return a.name.localeCompare(b.name, 'ar');
    }
    if (matrixSortBy === 'productivity') {
      return b.productivity_rate - a.productivity_rate;
    }
    if (matrixSortBy === 'punctuality') {
      return b.punctuality_rate - a.punctuality_rate;
    }
    if (matrixSortBy === 'attendance') {
      return b.attendance_rate - a.attendance_rate;
    }
    if (matrixSortBy === 'quality') {
      return b.quality_score - a.quality_score;
    }
    return 0;
  });

  // Sort for Appraisal & Rewards
  const sortedAppraisalEmployees = [...filteredEmployees].sort((a, b) => {
    if (appraisalSortBy === 'score-desc') {
      return b.final_score - a.final_score;
    }
    if (appraisalSortBy === 'name') {
      return a.name.localeCompare(b.name, 'ar');
    }
    if (appraisalSortBy === 'salary-desc') {
      return b.base_salary - a.base_salary;
    }
    if (appraisalSortBy === 'bonus-desc') {
      return b.computed_bonus - a.computed_bonus;
    }
    return 0;
  });

  // Sort and get top 3 employees for the Leaderboard
  const leaderboard = [...performanceOverview]
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 3);

  // Helper for Radial progress stroke color
  const getProgressColor = (rate: number) => {
    if (rate >= 90) return 'stroke-emerald-500 text-emerald-600';
    if (rate >= 75) return 'stroke-amber-500 text-amber-600';
    return 'stroke-rose-500 text-rose-600';
  };

  const getProgressBg = (rate: number) => {
    if (rate >= 90) return 'bg-emerald-50 text-emerald-700';
    if (rate >= 75) return 'bg-amber-50 text-amber-700';
    return 'bg-rose-50 text-rose-700';
  };

  // SVG Radial Progress render
  const RadialMeter = ({ val, label, metricUnit = '%' }: { val: number; label: string; metricUnit?: string }) => {
    const size = 64;
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const cleanVal = Math.min(Math.max(val, 0), 100);
    const offset = circumference - (cleanVal / 100) * circumference;
    const colorClass = getProgressColor(val);

    return (
      <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100/80 hover:border-slate-200 transition-all text-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="w-full h-full -rotate-90">
            <circle
              className="text-slate-200 stroke-current"
              strokeWidth={strokeWidth}
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
            <circle
              className={`transition-all duration-1000 ease-out stroke-current ${colorClass}`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800">
            {Math.round(val)}{metricUnit}
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-500 mt-2 block whitespace-nowrap overflow-hidden text-ellipsis w-16">{label}</span>
      </div>
    );
  };

  // Submit target editing
  const handleSaveTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetEmp) return;
    setIsSavingTarget(true);
    const success = await onSaveTarget(targetEmp.id, targetEmp.metric_source, parseFloat(targetValue));
    setIsSavingTarget(false);
    if (success) {
      setTargetEmp(null);
      setTargetValue('');
    }
  };

  // Submit departmental target editing
  const handleSaveDeptTargetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptTarget) return;
    setIsSavingDeptTarget(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const res = await fetch('/api/kpis/set-departmental-target', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': userId
        },
        body: JSON.stringify({
          department_id: selectedDeptTarget.id,
          source: selectedDeptTarget.metric_source,
          target_value: parseFloat(deptTargetValue)
        })
      });
      if (res.ok) {
        await fetchDeptPerformance();
        onRefresh(startDate, endDate);
        setSelectedDeptTarget(null);
        setDeptTargetValue('');
      }
    } catch (err) {
      console.error("Error setting departmental target:", err);
    } finally {
      setIsSavingDeptTarget(false);
    }
  };

  // Submit bonus posting
  const handlePostBonusAction = async (emp: any) => {
    setPostingBonusId(emp.id);
    await onApplyBonus(emp);
    setPostingBonusId(null);
  };

  return (
    <div className="space-y-8">
      {/* Celebration Notification */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-rose-500/30"
          >
            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-xl animate-bounce">
              🎉
            </div>
            <div>
              <p className="font-bold text-sm text-slate-100">تم ترحيل المكافأة بنجاح! 💸</p>
              <p className="text-xs text-rose-300">تم تحديث كشف رواتب الموظف: <span className="font-bold text-white">{showCelebration}</span></p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Horizontal Navigation Tabs */}
      <div className="flex flex-wrap border-b border-slate-100 gap-2 no-print pb-1">
        <button
          onClick={() => setActiveTab('targets')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'targets'
              ? 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Target className="w-4 h-4" />
          تحديد المستهدفات (Target Setting Desk)
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'matrix'
              ? 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          رادار الأداء والمقارنة (Performance Matrix)
        </button>

        <button
          onClick={() => setActiveTab('appraisal')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all ${
            activeTab === 'appraisal'
              ? 'bg-rose-50 text-rose-600 shadow-sm shadow-rose-100'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          تقييم 360 والـ Bonuses (Appraisal & Rewards)
        </button>

        <button
          onClick={handleRefreshAll}
          className="ml-auto p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors self-center"
          title="تحديث البيانات"
        >
          <RefreshCw className={`w-4 h-4 ${(loadingPerformance || loadingDeptPerformance) ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Target Setting Desk View */}
      {activeTab === 'targets' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Top Filter & Month selector */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Scope Toggle Switch */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">عرض المستهدفات حسب / Target Scope</label>
                <div className="bg-slate-50 p-1 rounded-xl flex items-center gap-1 border border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTargetType('individual')}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                      targetType === 'individual'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    الفردي (Individual)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('departmental')}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                      targetType === 'departmental'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    الأقسام (Departmental)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">القسم / Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
                >
                  <option value="all">كل الأقسام / All Departments</option>
                  {departments && departments.length > 0 ? (
                    departments.map((dept: any) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="Sales">قسم المبيعات (Sales CRM)</option>
                      <option value="Operations">قسم التشغيل والعمليات (Operations Hub)</option>
                      <option value="Marketing">قسم التسويق (Marketing Hub)</option>
                      <option value="QA">إدارة الجودة والتقييم (QA)</option>
                      <option value="HR Management">الموارد البشرية (HR Management)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">من تاريخ / From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">إلى تاريخ / To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">ترتيب حسب / Sort By</label>
                <select
                  value={targetsSortBy}
                  onChange={(e) => setTargetsSortBy(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
                >
                  <option value="name">الاسم (Name)</option>
                  <option value="dept">القسم (Department)</option>
                  <option value="target">قيمة المستهدف (Target Value)</option>
                  <option value="productivity">معدل الإنتاجية (Productivity)</option>
                </select>
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={targetType === 'individual' ? "ابحث عن موظف..." : "ابحث عن قسم..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
             {/* Employee or Departmental Cards Grid */}
             <div className="lg:col-span-2 space-y-6">
               <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 px-1">
                 {targetType === 'individual' ? (
                   <>
                     <Users className="w-5 h-5 text-rose-500" />
                     كروت الموظفين والعدادات الفورية
                   </>
                 ) : (
                   <>
                     <Briefcase className="w-5 h-5 text-rose-500" />
                     مستهدفات ومؤشرات الأداء للأقسام الرئيسية
                   </>
                 )}
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {targetType === 'individual' ? (
                   sortedTargetsEmployees.map((emp) => {
                     const unitLabel = emp.metric_source === 'sales' ? ' ج.م' : emp.metric_source === 'operations' ? ' طلب' : emp.metric_source === 'marketing' ? ' $' : '%';
                     return (
                       <motion.div
                         key={emp.id}
                         whileHover={{ y: -4 }}
                         className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
                       >
                         {/* Top profile and department */}
                         <div>
                           <div className="flex items-start gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white font-black flex items-center justify-center text-lg shadow-sm shadow-rose-100">
                               {emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                             </div>
                             <div className="space-y-0.5">
                               <h4 className="font-bold text-slate-900 text-base">{emp.name}</h4>
                               <p className="text-xs text-slate-500">{emp.job_title}</p>
                               <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                 {emp.department_name}
                               </span>
                             </div>
                           </div>
 
                           {/* Current Monthly Goal detail */}
                           <div className="mt-4 p-3 bg-rose-50/50 rounded-2xl border border-rose-100/40 flex items-center justify-between">
                             <div className="space-y-0.5">
                               <span className="text-[10px] font-black text-rose-500 uppercase">المستهدف الحالي</span>
                               <p className="text-sm font-black text-slate-800">
                                 {emp.metric_source === 'sales' ? 'قيمة مبيعات لا تقل عن:' : 
                                  emp.metric_source === 'operations' ? 'عدد تسليم طلبات لا يقل عن:' : 
                                  emp.metric_source === 'marketing' ? 'تكلفة الـ Lead المستهدفة:' : 
                                  'التزام حضور عام لا يقل عن:'}
                               </p>
                             </div>
                             <div className="text-right">
                               <span className="text-base font-black text-rose-600">
                                 {emp.targets[emp.metric_source]}
                                 {unitLabel}
                               </span>
                             </div>
                           </div>
 
                           {/* Radial Progress bars */}
                           <div className="grid grid-cols-4 gap-2 mt-6">
                             <RadialMeter val={emp.productivity_rate} label="الإنتاجية" />
                             <RadialMeter val={emp.punctuality_rate} label="التزام المواعيد" />
                             <RadialMeter val={emp.attendance_rate} label="الحضور" />
                             <RadialMeter val={emp.quality_score} label="الجودة" />
                           </div>
                         </div>
 
                         {/* Action trigger to change target */}
                         <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                           <div className="flex items-center gap-1.5 text-xs">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-slate-500 font-medium">الربط العصبي نشط</span>
                           </div>
                           <button
                             onClick={() => {
                               setTargetEmp(emp);
                               setTargetValue(emp.targets[emp.metric_source].toString());
                             }}
                             className="px-4 py-2 bg-slate-800 text-white hover:bg-rose-500 transition-colors text-xs font-black rounded-xl"
                           >
                             تعديل التارجت
                           </button>
                         </div>
                       </motion.div>
                     );
                   })
                 ) : (
                   filteredDepartments.map((dept) => {
                     return (
                       <motion.div
                         key={dept.id}
                         whileHover={{ y: -4 }}
                         className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
                       >
                         {/* Top profile and department */}
                         <div>
                           <div className="flex items-start justify-between gap-4">
                             <div className="flex items-start gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white font-black flex items-center justify-center text-lg shadow-sm shadow-rose-100 animate-pulse">
                                 🏢
                               </div>
                               <div className="space-y-0.5">
                                 <h4 className="font-bold text-slate-900 text-base">{dept.name}</h4>
                                 <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
                                   <Users className="w-3 h-3" /> {dept.employee_count} موظفين
                                 </span>
                               </div>
                             </div>
                             <span className="text-xs font-mono font-bold text-slate-400">ID #{dept.id}</span>
                           </div>
 
                           {/* Current Monthly Goal detail */}
                           <div className="mt-4 p-4 bg-rose-50/20 rounded-2xl border border-rose-100/30 space-y-3">
                             <div className="flex items-center justify-between">
                               <div className="space-y-0.5">
                                 <span className="text-[10px] font-black text-rose-500 uppercase">مستهدف القسم الإجمالي</span>
                                 <p className="text-xs font-extrabold text-slate-700">
                                   {dept.metric_source === 'sales' ? 'مبيعات مستهدفة إجمالية:' : 
                                    dept.metric_source === 'operations' ? 'إجمالي الطلبات المطلوب تسليمها:' : 
                                    dept.metric_source === 'marketing' ? 'المستهدف لتكلفة الـ Lead (CPL):' : 
                                    dept.metric_source === 'qa' ? 'متوسط درجة تقييم الجودة المستهدف:' :
                                    'متوسط نسبة الحضور والالتزام المستهدفة:'}
                                 </p>
                               </div>
                               <div className="text-right">
                                 <span className="text-base font-black text-rose-600">
                                   {dept.target_value}
                                   {dept.unit_label}
                                 </span>
                               </div>
                             </div>
 
                             <div className="flex items-center justify-between pt-2 border-t border-rose-100/20">
                               <div>
                                 <span className="text-[10px] font-black text-slate-400 uppercase">المحقق الفعلي للقسم</span>
                               </div>
                               <div className="text-right">
                                 <span className="text-sm font-black text-slate-800">
                                   {typeof dept.actual_value === 'number' ? dept.actual_value.toLocaleString('ar-EG', { maximumFractionDigits: 1 }) : dept.actual_value}
                                   {dept.unit_label}
                                 </span>
                               </div>
                             </div>
                           </div>
 
                           {/* Radial Progress for Department */}
                           <div className="flex justify-center mt-6">
                             <RadialMeter val={dept.progress_rate} label="نسبة الإنجاز الإجمالية" />
                           </div>
                         </div>
 
                         {/* Action trigger to change target */}
                         <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                           <div className="flex items-center gap-1.5 text-xs">
                             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span className="text-slate-500 font-medium">مستهدف تشغيلي موحد</span>
                           </div>
                           <button
                             onClick={() => {
                               setSelectedDeptTarget(dept);
                               setDeptTargetValue(dept.target_value.toString());
                             }}
                             className="px-4 py-2 bg-slate-800 text-white hover:bg-rose-500 transition-colors text-xs font-black rounded-xl"
                           >
                             تعديل مستهدف القسم
                           </button>
                         </div>
                       </motion.div>
                     );
                   })
                 )}
 
                 {targetType === 'individual' && filteredEmployees.length === 0 && (
                   <div className="col-span-full p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-500">
                     لم نجد موظفين يطابقون خيارات البحث.
                   </div>
                 )}
 
                 {targetType === 'departmental' && filteredDepartments.length === 0 && (
                   <div className="col-span-full p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-500">
                     لم نجد أقساماً تطابق خيارات البحث.
                   </div>
                 )}
               </div>
             </div>

            {/* Leaderboard Podium Column */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 px-1">
                <Award className="w-5 h-5 text-amber-500 animate-pulse" />
                لوحة الشرف (Leaderboard)
              </h3>

              <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />
                
                <div className="text-center space-y-1">
                  <h4 className="font-extrabold text-amber-400 text-base flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    فرسان الشهر
                  </h4>
                  <p className="text-xs text-slate-300">أعلى الموظفين تحقيقاً للأهداف في الشركة كلها</p>
                </div>

                {/* Vertical Podium Visual Representation */}
                <div className="flex items-end justify-center gap-2 pt-6 pb-2 border-b border-slate-100/10">
                  {/* 2nd place */}
                  {leaderboard[1] && (
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-10 h-10 rounded-full bg-slate-100/10 text-white font-extrabold flex items-center justify-center text-xs relative border-2 border-slate-300">
                        🥈
                      </div>
                      <p className="text-[10px] font-bold text-slate-200 mt-2 text-center truncate w-20">{leaderboard[1].name}</p>
                      <span className="text-[10px] font-bold text-emerald-400">{leaderboard[1].final_score}%</span>
                      <div className="w-full bg-slate-700 h-16 rounded-t-xl mt-2 flex items-center justify-center">
                        <span className="text-xs font-black text-slate-400">2nd</span>
                      </div>
                    </div>
                  )}

                  {/* 1st place */}
                  {leaderboard[0] && (
                    <div className="flex flex-col items-center flex-1 relative -top-3">
                      <div className="absolute -top-6 text-xl animate-bounce">👑</div>
                      <div className="w-12 h-12 rounded-full bg-yellow-500 text-white font-extrabold flex items-center justify-center text-sm relative border-4 border-yellow-300 shadow-lg shadow-yellow-500/20">
                        🥇
                      </div>
                      <p className="text-xs font-black text-yellow-400 mt-2 text-center truncate w-24">{leaderboard[0].name}</p>
                      <span className="text-xs font-black text-emerald-400">{leaderboard[0].final_score}%</span>
                      <div className="w-full bg-yellow-600/20 border-t border-yellow-500/40 h-24 rounded-t-xl mt-2 flex items-center justify-center">
                        <span className="text-sm font-black text-yellow-400">1st</span>
                      </div>
                    </div>
                  )}

                  {/* 3rd place */}
                  {leaderboard[2] && (
                    <div className="flex flex-col items-center flex-1">
                      <div className="w-10 h-10 rounded-full bg-slate-100/10 text-white font-extrabold flex items-center justify-center text-xs relative border-2 border-amber-600">
                        🥉
                      </div>
                      <p className="text-[10px] font-bold text-slate-200 mt-2 text-center truncate w-20">{leaderboard[2].name}</p>
                      <span className="text-[10px] font-bold text-emerald-400">{leaderboard[2].final_score}%</span>
                      <div className="w-full bg-slate-700/60 h-12 rounded-t-xl mt-2 flex items-center justify-center">
                        <span className="text-xs font-black text-amber-500">3rd</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* List detail */}
                <div className="space-y-3 pt-2">
                  {leaderboard.map((emp, index) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400">#{index + 1}</span>
                        <div>
                          <p className="text-xs font-bold text-white">{emp.name}</p>
                          <p className="text-[10px] text-slate-400">{emp.job_title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-400">{emp.final_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Performance Matrix View */}
      {activeTab === 'matrix' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-in fade-in duration-500">
          <div className="border-b border-slate-50 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">رادار مقارنة أداء الموظفين</h3>
              <p className="text-xs text-slate-500">مقارنة بصرية شاملة لمعدل تحقيق مستهدف الإنتاجية والجودة وعقد المقارنات المباشرة</p>
            </div>
          </div>

          {/* Filter & Sort controls */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">القسم / Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
                >
                  <option value="all">كل الأقسام / All Departments</option>
                  {departments && departments.length > 0 ? (
                    departments.map((dept: any) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="Sales">قسم المبيعات (Sales CRM)</option>
                      <option value="Operations">قسم التشغيل والعمليات (Operations Hub)</option>
                      <option value="Marketing">قسم التسويق (Marketing Hub)</option>
                      <option value="QA">إدارة الجودة والتقييم (QA)</option>
                      <option value="HR Management">الموارد البشرية (HR Management)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">ترتيب حسب / Sort By</label>
                <select
                  value={matrixSortBy}
                  onChange={(e) => setMatrixSortBy(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
                >
                  <option value="score-desc">التقييم العام (أعلى إلى أقل)</option>
                  <option value="score-asc">التقييم العام (أقل إلى أعلى)</option>
                  <option value="name">الاسم (Name)</option>
                  <option value="productivity">معدل الإنتاجية (Productivity)</option>
                  <option value="punctuality">التزام المواعيد (Punctuality)</option>
                  <option value="attendance">الحضور (Attendance)</option>
                  <option value="quality">الجودة (Quality)</option>
                </select>
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن موظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-6 max-w-4xl">
            {sortedMatrixEmployees.map((emp) => {
              const score = emp.final_score;
              return (
                <div key={emp.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="md:col-span-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-700 font-extrabold flex items-center justify-center text-xs">
                      {emp.name[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800">{emp.name}</h4>
                      <p className="text-[10px] text-slate-400">{emp.job_title}</p>
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>الإنتاجية مقابل المستهدف</span>
                      <span>{score}%</span>
                    </div>
                    <div className="h-3 bg-slate-200/60 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(score, 100)}%` }}
                        className={`h-full rounded-full transition-all duration-1000 ${
                          score >= 90 ? 'bg-emerald-500' : score >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black ${getProgressBg(score)}`}>
                      {emp.appraisal_grade}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appraisal & Rewards View */}
      {activeTab === 'appraisal' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 animate-in fade-in duration-500">
          <div className="border-b border-slate-50 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">تقييم 360 درجة وصرف المكافآت الشهرية</h3>
              <p className="text-xs text-slate-500">ربط فوري لأداء الموظفين بكشف الرواتب الشهري في موديول المالية والموارد البشرية</p>
            </div>
            <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl">
              تم التوطيد التلقائي لشهر يوليو 2026
            </div>
          </div>

          {/* Filter & Sort Controls */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">القسم / Department</label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
                >
                  <option value="all">كل الأقسام / All Departments</option>
                  {departments && departments.length > 0 ? (
                    departments.map((dept: any) => (
                      <option key={dept.id} value={dept.name}>{dept.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="Sales">قسم المبيعات (Sales CRM)</option>
                      <option value="Operations">قسم التشغيل والعمليات (Operations Hub)</option>
                      <option value="Marketing">قسم التسويق (Marketing Hub)</option>
                      <option value="QA">إدارة الجودة والتقييم (QA)</option>
                      <option value="HR Management">الموارد البشرية (HR Management)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">ترتيب حسب / Sort By</label>
                <select
                  value={appraisalSortBy}
                  onChange={(e) => setAppraisalSortBy(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
                >
                  <option value="score-desc">التقييم العام (Score)</option>
                  <option value="name">الاسم (Name)</option>
                  <option value="salary-desc">الراتب الأساسي (Base Salary)</option>
                  <option value="bonus-desc">المكافأة المستحقة (Bonus)</option>
                </select>
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن موظف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-4 px-4 text-right">الموظف / Employee</th>
                  <th className="py-4 px-4 text-center">الإنتاجية / Prod.</th>
                  <th className="py-4 px-4 text-center">المواعيد / Punct.</th>
                  <th className="py-4 px-4 text-center">الحضور / Attendance</th>
                  <th className="py-4 px-4 text-center">متوسط التقييم / Score</th>
                  <th className="py-4 px-4 text-center">التقدير / Grade</th>
                  <th className="py-4 px-4 text-center">الراتب الأساسي</th>
                  <th className="py-4 px-4 text-center">المكافأة المستحقة / Bonus</th>
                  <th className="py-4 px-4 text-center">حالة الصرف / Payroll Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedAppraisalEmployees.map((emp) => {
                  const hasBonus = emp.computed_bonus > 0;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors text-xs font-bold text-slate-700">
                      <td className="py-4 px-4 text-right flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 font-extrabold flex items-center justify-center">
                          {emp.name[0]}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{emp.job_title}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-800">{emp.productivity_rate}%</td>
                      <td className="py-4 px-4 text-center text-slate-800">{emp.punctuality_rate}%</td>
                      <td className="py-4 px-4 text-center text-slate-800">{emp.attendance_rate}%</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-extrabold ${getProgressBg(emp.final_score)}`}>
                          {emp.final_score}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-[10px]">{emp.appraisal_grade.split(' / ')[0]}</span>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-500 font-medium">{emp.base_salary} ج.م</td>
                      <td className="py-4 px-4 text-center text-rose-600 font-black">
                        {hasBonus ? `+${emp.computed_bonus} ج.م` : '0'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {emp.applied_bonus > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                            <ShieldCheck className="w-3.5 h-3.5" /> رحلت للراتب
                          </span>
                        ) : hasBonus ? (
                          <button
                            onClick={() => handlePostBonusAction(emp)}
                            disabled={postingBonusId === emp.id}
                            className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[10px] font-extrabold transition-colors flex items-center gap-1 mx-auto"
                          >
                            {postingBonusId === emp.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <DollarSign className="w-3 h-3" />
                            )}
                            صرف ترحيل المكافأة
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dynamic Target Setting Drawer/Modal */}
      <AnimatePresence>
        {targetEmp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-right"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <button 
                  onClick={() => setTargetEmp(null)} 
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                >
                  <XIcon className="w-5 h-5 text-slate-400" />
                </button>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-rose-500" />
                  تعديل مستهدف الموظف المالي والعملياتي
                </h3>
              </div>
              <form onSubmit={handleSaveTargetSubmit} className="p-6 space-y-4">
                <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100/50 space-y-1">
                  <p className="text-xs font-extrabold text-slate-800">تعديل مستهدف للموظف: {targetEmp.name}</p>
                  <p className="text-[10px] text-slate-500">سوف ينعكس هذا المستهدف مباشرة على لوحة البيانات وحساب معدلات التميز والإنتاجية</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">
                    قيمة المستهدف الجديد ({targetEmp.metric_source === 'sales' ? 'بالجنيه المصري' : targetEmp.metric_source === 'operations' ? 'بالطلبات' : targetEmp.metric_source === 'marketing' ? 'بالدولار لـ CPL' : 'بالنسبة المئوية'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none text-left"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTargetEmp(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTarget}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
                  >
                    {isSavingTarget ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'حفظ المستهدف'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {selectedDeptTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-right"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <button 
                  onClick={() => setSelectedDeptTarget(null)} 
                  className="p-2 hover:bg-white rounded-xl transition-colors"
                >
                  <XIcon className="w-5 h-5 text-slate-400" />
                </button>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-rose-500" />
                  تعديل المستهدف الإجمالي للقسم
                </h3>
              </div>
              <form onSubmit={handleSaveDeptTargetSubmit} className="p-6 space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-1">
                  <p className="text-xs font-extrabold text-slate-800">تعديل مستهدف قسم: {selectedDeptTarget.name}</p>
                  <p className="text-[10px] text-slate-500">سوف ينعكس هذا المستهدف مباشرة على حساب أداء القسم الإجمالي في رادار الأداء والعدادات</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">
                    قيمة المستهدف الجديد ({selectedDeptTarget.unit_label})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={deptTargetValue}
                    onChange={(e) => setDeptTargetValue(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none text-left"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDeptTarget(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDeptTarget}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-200"
                  >
                    {isSavingDeptTarget ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'حفظ مستهدف القسم'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}
