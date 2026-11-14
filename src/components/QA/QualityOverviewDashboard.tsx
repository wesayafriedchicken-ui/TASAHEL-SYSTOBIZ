import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  MessageSquare, 
  Clock, 
  RotateCcw, 
  XCircle, 
  Star, 
  Gauge, 
  TrendingUp, 
  MoreVertical, 
  AlertTriangle, 
  Info, 
  Sparkles,
  Filter,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
  Building2,
  User,
  ChevronDown,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { QAAdvancedFilter } from './QAAdvancedFilter';

export const QualityOverviewDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [npsPeriod, setNpsPeriod] = useState<'This Week' | 'This Month' | 'This Quarter'>('This Week');
  const [reasonsPeriod, setReasonsPeriod] = useState<'This Week' | 'This Month' | 'This Quarter'>('This Week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Live State from API
  const [summary, setSummary] = useState({
    totalCases: 0,
    complaintsCount: 0,
    delaysCount: 0,
    refundsCount: 0,
    cancellationsCount: 0,
    surveysCount: 0,
    npsScore: 0,
    npsTotalCount: 0,
    promotersCount: 0,
    passivesCount: 0,
    detractorsCount: 0,
    promoterPct: 0,
    passivePct: 0,
    detractorPct: 0
  });

  const [trendData, setTrendData] = useState<any[]>([]);
  const [moduleData, setModuleData] = useState<any[]>([]);
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [negativeReasons, setNegativeReasons] = useState<any[]>([]);
  const [recentCases, setRecentCases] = useState<any[]>([]);
  const [filteredRecentCases, setFilteredRecentCases] = useState<any[] | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchOverviewData();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [timeRange, npsPeriod, reasonsPeriod]);

  const fetchOverviewData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'x-user-id': userId
      };
      if (token && token !== 'null' && token !== 'undefined' && token !== '') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams({
        timeRange,
        npsPeriod,
        reasonsPeriod
      });

      let res: Response | null = null;
      let lastErr: any = null;

      // Resilient fetch with automatic single retry for transient network recovery
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          res = await fetch(`/api/qa/overview-stats?${params.toString()}`, {
            headers,
            signal: controller.signal
          });
          if (res.ok) break;
        } catch (e: any) {
          if (e?.name === 'AbortError') return;
          lastErr = e;
          if (attempt === 0) {
            await new Promise(r => setTimeout(r, 300));
          }
        }
      }

      if (res && res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
        if (data.trendData) setTrendData(data.trendData);
        if (data.moduleData) setModuleData(data.moduleData);
        if (data.departmentData) setDepartmentData(data.departmentData);
        if (data.negativeReasons) setNegativeReasons(data.negativeReasons);
        if (data.recentCases) setRecentCases(data.recentCases);
        if (data.alerts) setAlerts(data.alerts);
      } else if (lastErr) {
        console.warn("QA overview live stats fetch deferred:", lastErr?.message || lastErr);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn("QA overview live stats notice:", err?.message || err);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Needle calculation for NPS Gauge (-100 to +100 map to 180 to 0 degrees)
  // Score range: -100 to +100. Normalized to 0 to 1: (score + 100) / 200
  const normalizedNps = Math.max(0, Math.min(1, (summary.npsScore + 100) / 200));
  const angleRad = Math.PI * (1 - normalizedNps);
  const needleLength = 55;
  const needleX = 100 + needleLength * Math.cos(angleRad);
  const needleY = 100 - needleLength * Math.sin(angleRad);

  return (
    <div className="space-y-6" id="quality-overview-dashboard">
      
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Quality Operations Overview</h3>
            <p className="text-xs text-slate-500 font-medium">Real-time incident stream and customer satisfaction metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchOverviewData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-60"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Live'}</span>
          </button>
          
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live DB Synced
          </span>
        </div>
      </div>

      {/* 1. TOP METRICS CARDS (7 CARDS ROW) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        
        {/* Total Cases */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">Total Cases</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{summary.totalCases.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active Live Stream</span>
          </div>
        </div>

        {/* Complaints */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">Complaints</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{summary.complaintsCount.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-indigo-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Logged Incidents</span>
          </div>
        </div>

        {/* Delays */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">Delays</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{summary.delaysCount.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            <span>SLA Tracked</span>
          </div>
        </div>

        {/* Refunds */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">Refunds</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{summary.refundsCount.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Finance Audits</span>
          </div>
        </div>

        {/* Cancellations */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">Cancellations</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{summary.cancellationsCount.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-rose-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Order Dropouts</span>
          </div>
        </div>

        {/* Surveys */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">Surveys</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">{summary.surveysCount.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-purple-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Evaluations & NPS</span>
          </div>
        </div>

        {/* NPS Score */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-bold block">NPS Score</span>
              <span className="text-xl font-black text-slate-900 block mt-0.5">
                {summary.npsScore > 0 ? `+${summary.npsScore}` : summary.npsScore}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{summary.promoterPct}% Promoters</span>
          </div>
        </div>

      </div>

      {/* 2. MAIN CHARTS AREA (2-COLUMN GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2 SPANS) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Multi-Line Cases Trend Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h4 className="text-base font-black text-slate-900">Cases Trend</h4>
                <p className="text-xs text-slate-400 font-medium">Daily incident occurrences across all quality modules</p>
              </div>

              {/* Time Range Filter Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {(['Daily', 'Weekly', 'Monthly'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTimeRange(mode)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      timeRange === mode 
                        ? 'bg-white text-indigo-700 shadow-sm font-black' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Multi-line Area */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0F172A', 
                      borderRadius: '16px', 
                      border: 'none', 
                      color: '#FFF', 
                      fontSize: '11px',
                      padding: '10px 14px'
                    }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle" 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '10px' }} 
                  />
                  <Line type="monotone" dataKey="complaints" name="Complaints" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="delays" name="Delays" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="refunds" name="Refunds" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="cancellations" name="Cancellations" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="surveys" name="Surveys" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="nps" name="NPS" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2 Donut Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Donut 1: Cases by Module */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <h4 className="text-sm font-black text-slate-900 mb-4">Cases by Module</h4>
              
              <div className="flex items-center gap-4">
                <div className="w-36 h-36 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={moduleData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={55}
                        paddingAngle={3}
                      >
                        {moduleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-base font-black text-slate-900">{summary.totalCases.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Total</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="flex-1 space-y-1.5 text-xs font-medium">
                  {moduleData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{item.value} ({item.percentage})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Donut 2: Cases by Department */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <h4 className="text-sm font-black text-slate-900 mb-4">Cases by Department</h4>
              
              <div className="flex items-center gap-4">
                <div className="w-36 h-36 relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={36}
                        outerRadius={55}
                        paddingAngle={3}
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-base font-black text-slate-900">
                      {departmentData.reduce((acc, d) => acc + (d.value || 0), 0)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Total</span>
                  </div>
                </div>

                {/* Legend List */}
                <div className="flex-1 space-y-1.5 text-xs font-medium">
                  {departmentData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-700">{item.name}</span>
                      </div>
                      <span className="font-bold text-slate-900">{item.value} ({item.percentage})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Recent Cases Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-slate-900">Recent Cases</h4>
                <span className="text-xs text-slate-400 font-medium">Live incident records from database</span>
              </div>
              <div className="flex items-center gap-2">
                <QAAdvancedFilter
                  items={recentCases}
                  onFilter={(filtered) => setFilteredRecentCases(filtered)}
                  title="Filter Recent Cases"
                  buttonLabel="Filter Records"
                />
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  {(filteredRecentCases !== null ? filteredRecentCases : recentCases).length} Records
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="p-3.5 pl-5">ID</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Customer / Request</th>
                    <th className="p-3.5">Owner</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(filteredRecentCases !== null ? filteredRecentCases : recentCases).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                        No recent cases match the current criteria.
                      </td>
                    </tr>
                  ) : (
                    (filteredRecentCases !== null ? filteredRecentCases : recentCases).map((row, idx) => (
                      <tr key={row.id || `recent-case-${idx}`} className="hover:bg-slate-50/70 transition-all">
                        <td className="p-3.5 pl-5 font-bold text-slate-900">{row.transaction_id || row.id}</td>
                        <td className="p-3.5 font-semibold text-slate-700">{row.type}</td>
                        <td className="p-3.5 font-medium text-slate-800">{row.customer}</td>
                        <td className="p-3.5">{row.owner}</td>
                        <td className="p-3.5">{row.department}</td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${row.statusColor}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">{row.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (1 SPAN) */}
        <div className="space-y-6">
          
          {/* NPS Overview Card with Gauge / Speedometer */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-black text-slate-900">NPS Overview</h4>
              <div className="relative">
                <select
                  value={npsPeriod}
                  onChange={(e) => setNpsPeriod(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700 pr-6 cursor-pointer focus:bg-white appearance-none"
                >
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="This Quarter">This Quarter</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
              </div>
            </div>

            {/* Semi-Circle SVG Gauge */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-48 h-28 flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 200 110" className="w-full h-full">
                  {/* Background Track */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  {/* Red Arc (Detractors: 0% - 30%) */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 60 40"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  {/* Yellow Arc (Passives: 30% - 60%) */}
                  <path
                    d="M 62 38 A 80 80 0 0 1 138 38"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="16"
                  />
                  {/* Green Arc (Promoters: 60% - 100%) */}
                  <path
                    d="M 140 40 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  {/* Live Needle Pointing to dynamic NPS Score */}
                  <line
                    x1="100"
                    y1="100"
                    x2={needleX}
                    y2={needleY}
                    stroke="#1E293B"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="100" r="7" fill="#1E293B" />
                </svg>
              </div>

              <div className="text-center -mt-2">
                <span className="text-2xl font-black text-slate-900 block tracking-tight">
                  {summary.npsScore > 0 ? `+${summary.npsScore}` : summary.npsScore}
                </span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Net Promoter Score</span>
              </div>
            </div>

            {/* NPS Legend */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
              <div>
                <div className="flex items-center justify-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Promoters</span>
                </div>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {summary.promotersCount} ({summary.promoterPct}%)
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Passives</span>
                </div>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {summary.passivesCount} ({summary.passivePct}%)
                </span>
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Detractors</span>
                </div>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {summary.detractorsCount} ({summary.detractorPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* Top Negative Reasons (Detractors) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-900">Top Negative Reasons (Detractors)</h4>
              <div className="relative">
                <select
                  value={reasonsPeriod}
                  onChange={(e) => setReasonsPeriod(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700 pr-6 cursor-pointer focus:bg-white appearance-none"
                >
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-4 text-xs font-medium">
              {negativeReasons.length === 0 ? (
                <p className="text-slate-400 text-center py-4 font-semibold">No negative reasons recorded in this period.</p>
              ) : (
                negativeReasons.map((item) => (
                  <div key={item.reason} className="space-y-1.5">
                    <div className="flex items-center justify-between text-slate-700">
                      <span className="truncate max-w-[200px]" title={item.reason}>{item.reason}</span>
                      <span className="font-bold text-slate-900">{item.count} ({item.pct})</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{ width: item.barWidth }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-900">Live Alerts & SLA Watch</h4>
              <span className="text-xs font-bold text-slate-400">Automated QA</span>
            </div>

            <div className="space-y-3.5">
              {alerts.length === 0 ? (
                <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-emerald-800">All Quality Systems Operational</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">No critical SLA breaches or overdue exceptions active.</p>
                </div>
              ) : (
                alerts.map((al) => (
                  <div 
                    key={al.id} 
                    className={`flex items-start gap-3 p-3 border rounded-2xl ${
                      al.type === 'danger' 
                        ? 'bg-rose-50/50 border-rose-100' 
                        : al.type === 'warning' 
                        ? 'bg-amber-50/50 border-amber-100' 
                        : 'bg-blue-50/50 border-blue-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      al.type === 'danger' 
                        ? 'bg-rose-100 text-rose-600' 
                        : al.type === 'warning' 
                        ? 'bg-amber-100 text-amber-600' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {al.type === 'danger' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900 truncate">{al.title}</h5>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{al.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{al.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
