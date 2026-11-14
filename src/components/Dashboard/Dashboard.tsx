import React, { useState, useEffect, useCallback } from 'react';
import { 
  motion, AnimatePresence 
} from 'motion/react';
import { 
  TrendingUp, Users, BookOpen, AlertTriangle, Zap, 
  ChevronRight, ArrowUpRight, ArrowDownRight, 
  Plus, Bell, Filter, Printer, 
  MessageCircle, ShieldAlert, CheckCircle2,
  BarChart3, PieChart as PieChartIcon, Activity,
  LayoutGrid, List, MoreVertical, Search, X, GraduationCap,
  DollarSign, Megaphone, Target, Percent, Clock, Coins, Package, Truck, UserCheck, Briefcase
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Funnel, FunnelChart, LabelList, Legend
} from 'recharts';
import { cn, fetchWithRetry, safeJsonResponse } from '../../lib/utils';

interface DashboardData {
  widgets: {
    sopCount: number;
    sopDraft: number;
    sopPublished: number;
    sopCompliance: number;
    newLeads: number;
    closedDeals: number;
    openDeals: number;
    avgQA: string;
    highRisks: number;
    totalActiveRisks: number;
    pendingKaizen: number;
    trainingProgress: number;
  };
  funnel: any[];
  radar: any[];
  heatmap: any[];
  activityFeed: any[];
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
}

const MOCK_DATA: DashboardData = {
  widgets: {
    sopCount: 124,
    sopDraft: 45,
    sopPublished: 79,
    sopCompliance: 94,
    newLeads: 12,
    closedDeals: 8,
    openDeals: 34,
    avgQA: "92.5",
    highRisks: 2,
    totalActiveRisks: 15,
    pendingKaizen: 5,
    trainingProgress: 68
  },
  funnel: [
    { stage: 'Leads', count: 100 },
    { stage: 'Meeting', count: 80 },
    { stage: 'Proposal', count: 60 },
    { stage: 'Implementation', count: 40 },
    { stage: 'Done', count: 20 },
  ],
  radar: [
    { subject: 'Quality', A: 80, B: 70, fullMark: 100 },
    { subject: 'Speed', A: 90, B: 85, fullMark: 100 },
    { subject: 'Compliance', A: 95, B: 80, fullMark: 100 },
    { subject: 'Innovation', A: 70, B: 90, fullMark: 100 },
    { subject: 'Safety', A: 100, B: 95, fullMark: 100 },
  ],
  heatmap: [
    { day: 'Mon', '08:00': 10, '12:00': 45, '16:00': 30 },
    { day: 'Tue', '08:00': 15, '12:00': 50, '16:00': 35 },
    { day: 'Wed', '08:00': 20, '12:00': 60, '16:00': 40 },
    { day: 'Thu', '08:00': 12, '12:00': 40, '16:00': 25 },
    { day: 'Fri', '08:00': 8, '12:00': 30, '16:00': 20 },
  ],
  activityFeed: [
    { title: 'New SOP Created', message: 'Standard Operating Procedure for Sales updated', type: 'info', created_at: new Date().toISOString() },
    { title: 'Risk Mitigated', message: 'Technical risk #402 has been closed', type: 'success', created_at: new Date().toISOString() },
  ]
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<'company' | 'department' | 'employee'>('company');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Financial Tab States
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'human_capital' | 'operational_efficiency'>('overview');
  const [financialData, setFinancialData] = useState<any | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [baseCurrency, setBaseCurrency] = useState<string>(() => {
    return localStorage.getItem('acct_base_currency') || 'SAR';
  });

  // Human Capital Tab States
  const [humanCapitalData, setHumanCapitalData] = useState<any | null>(null);
  const [humanCapitalLoading, setHumanCapitalLoading] = useState(false);

  // Operational Efficiency Tab States
  const [operationalEfficiencyData, setOperationalEfficiencyData] = useState<any | null>(null);
  const [operationalEfficiencyLoading, setOperationalEfficiencyLoading] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setBaseCurrency(localStorage.getItem('acct_base_currency') || 'SAR');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchFinancialData = useCallback(async () => {
    setFinancialLoading(true);
    try {
      const companyId = localStorage.getItem('company_id') || '1';
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/dashboard/financial?company_id=${companyId}`, { headers });
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        const result = await res.json();
        setFinancialData(result);
      } else {
        console.error("Failed to fetch financial data");
      }
    } catch (err) {
      console.error("Error fetching financial data:", err);
    } finally {
      setFinancialLoading(false);
    }
  }, []);

  const fetchHumanCapitalData = useCallback(async () => {
    setHumanCapitalLoading(true);
    try {
      const companyId = localStorage.getItem('company_id') || '1';
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/dashboard/human-capital?company_id=${companyId}`, { headers });
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        const result = await res.json();
        setHumanCapitalData(result);
      } else {
        console.error("Failed to fetch human capital data");
      }
    } catch (err) {
      console.error("Error fetching human capital data:", err);
    } finally {
      setHumanCapitalLoading(false);
    }
  }, []);

  const fetchOperationalEfficiencyData = useCallback(async () => {
    setOperationalEfficiencyLoading(true);
    try {
      const companyId = localStorage.getItem('company_id') || '1';
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/dashboard/operational-efficiency?company_id=${companyId}`, { headers });
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        const result = await res.json();
        setOperationalEfficiencyData(result);
      } else {
        console.error("Failed to fetch operational efficiency data");
      }
    } catch (err) {
      console.error("Error fetching operational efficiency data:", err);
    } finally {
      setOperationalEfficiencyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'financial') {
      fetchFinancialData();
    } else if (activeTab === 'human_capital') {
      fetchHumanCapitalData();
    } else if (activeTab === 'operational_efficiency') {
      fetchOperationalEfficiencyData();
    }
  }, [activeTab, fetchFinancialData, fetchHumanCapitalData, fetchOperationalEfficiencyData]);

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const headers: any = {
        'x-user-id': (userId && userId !== 'undefined') ? userId : '1',
        'Content-Type': 'application/json'
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetchWithRetry(`/api/dashboard/summary?scope=${scope}`, { 
        signal: controller.signal,
        headers
      });
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        window.location.href = '/login';
        return;
      }
      
      const text = await res.text();
      let summary;
      try {
        if (!text || text.trim().startsWith('<')) {
          setData(MOCK_DATA);
          setLoading(false);
          return;
        }
        summary = JSON.parse(text);
      } catch (e) {
        if (text.includes("Rate exceeded")) {
          console.warn("Dashboard data rate limit hit. Using mock data.");
        }
        setData(MOCK_DATA);
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        setData(MOCK_DATA);
        setLoading(false);
        return;
      }
      
      // If API returns empty widgets or fails, use mock data as fallback
      if (!summary || !summary.widgets || (summary.widgets.sopCount === 0 && summary.widgets.openDeals === 0)) {
        setData(MOCK_DATA);
      } else {
        setData(summary);
      }
      
      try {
        const notifRes = await fetchWithRetry('/api/dashboard/notifications', { 
          signal: controller.signal,
          headers
        });
        const notifs = await safeJsonResponse(notifRes, []);
        setNotifications(Array.isArray(notifs) ? notifs : []);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.warn("Failed to fetch notifications", e);
        }
      }
      
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Failed to fetch dashboard data, using mock data', err);
      setData(MOCK_DATA);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    const controller = new AbortController();
    
    fetchData(controller.signal);
    const interval = setInterval(() => fetchData(controller.signal), 60000); // Refresh every 60s
    
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Aggregating Enterprise Data...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 pb-20">
      {/* Top Navigation Bar (Search & Notifications) */}
      <div className="flex items-center justify-between gap-6 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm no-print">
        <div className="relative flex-1 max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search across all modules (SOPs, CRM, Risks...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all relative group"
          >
            <Bell className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            {notifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white animate-bounce" />
            )}
          </button>
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
            JD
          </div>
        </div>
      </div>

      {/* Header & Scope Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Systo Biz: Central Intelligence</h2>
          <p className="text-slate-500 font-medium">The central management engine for all business operations and information systems.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            {(['company', 'department', 'employee'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                  scope === s ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <button 
            onClick={() => window.print()}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 gap-6 no-print my-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "pb-4 font-bold text-sm relative transition-all flex items-center gap-2 px-1 shrink-0",
            activeTab === 'overview' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <LayoutGrid className="w-4 h-4" />
          Central Overview (الرئيسية)
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={cn(
            "pb-4 font-bold text-sm relative transition-all flex items-center gap-2 px-1 shrink-0",
            activeTab === 'financial' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <TrendingUp className="w-4 h-4" />
          Financial & Operations Performance (التحليل المالي والتشغيلي)
        </button>
        <button
          onClick={() => setActiveTab('human_capital')}
          className={cn(
            "pb-4 font-bold text-sm relative transition-all flex items-center gap-2 px-1 shrink-0",
            activeTab === 'human_capital' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <GraduationCap className="w-4 h-4" />
          Human Capital & Performance (رأس المال البشري والأداء)
        </button>
        <button
          onClick={() => setActiveTab('operational_efficiency')}
          className={cn(
            "pb-4 font-bold text-sm relative transition-all flex items-center gap-2 px-1 shrink-0",
            activeTab === 'operational_efficiency' ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
          Operational Efficiency & QA (الكفاءة التشغيلية والجودة)
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <WidgetCard 
          title="Operations" 
          value={data.widgets.sopCount} 
          subValue={`${data.widgets.sopPublished} Published / ${data.widgets.sopDraft} Draft`}
          icon={BookOpen}
          color="indigo"
        />
        <WidgetCard 
          title="CRM Pipeline" 
          value={data.widgets.openDeals} 
          subValue={`${data.widgets.closedDeals} Closed Today`}
          icon={Users}
          color="emerald"
        />
        <WidgetCard 
          title="Training Progress" 
          value={`${data.widgets.trainingProgress}%`} 
          subValue="Avg Completion"
          icon={GraduationCap}
          color="blue"
        />
        <WidgetCard 
          title="Active Risks" 
          value={data.widgets.totalActiveRisks} 
          subValue={`${data.widgets.highRisks} High Priority`}
          icon={AlertTriangle}
          color="rose"
          alert={data.widgets.highRisks > 0}
        />
        <WidgetCard 
          title="Kaizen" 
          value={data.widgets.pendingKaizen} 
          subValue="Under Review"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CRM Funnel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Sales Funnel</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip />
                <Funnel
                  dataKey="count"
                  data={data.funnel}
                  isAnimationActive
                >
                  <LabelList position="right" fill="#64748b" stroke="none" dataKey="stage" />
                  {data.funnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart Performance */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Dept Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.radar}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Current"
                  dataKey="A"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Target"
                  dataKey="B"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {data.activityFeed && data.activityFeed.length > 0 ? (
                data.activityFeed.map((item: any, i: number) => (
                  <div key={`activity-${item.id || i}-${item.created_at}`} className="flex gap-3 items-start p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    item.type === 'error' ? "bg-rose-500" : item.type === 'success' ? "bg-emerald-500" : "bg-indigo-500"
                  )} />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{new Date(item.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Activity className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs italic">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Workload Heatmap */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Global Workload Pressure</h3>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-600 opacity-10 rounded" /> Low</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-600 opacity-50 rounded" /> Medium</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-600 opacity-100 rounded" /> High</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {data.heatmap.map((row, i) => (
            <div key={`heatmap-day-${row.day}-${i}`} className="space-y-3">
              <p className="text-xs font-bold text-slate-900 text-center">{row.day}</p>
              <div className="space-y-2">
                {['08:00', '12:00', '16:00'].map((time) => {
                  const val = row[time];
                  const opacity = val / 60;
                  return (
                    <div 
                      key={`heatmap-cell-${row.day}-${time}`}
                      className="group relative"
                    >
                      <div 
                        className="h-16 rounded-2xl bg-indigo-600 transition-all hover:scale-105 cursor-pointer shadow-sm"
                        style={{ opacity: Math.max(0.1, opacity) }}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{time}</span>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{val} Tasks</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )}

  {activeTab === 'financial' && (
    <div className="space-y-8">
      {financialLoading && !financialData ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-semibold text-sm">تحميل التدفقات المالية والمؤشرات لايف...</p>
        </div>
      ) : !financialData ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
          <p className="text-slate-500 font-semibold text-sm">لم نتمكن من جلب البيانات المالية. يرجى التأكد من اتصال قاعدة البيانات.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* KPIs Header Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Revenue Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 border border-emerald-100">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">إجمالي الإيرادات (Live Revenue)</span>
              <h3 className="text-3xl font-black text-slate-900 mt-2">
                {financialData.totalRevenue.toLocaleString()} <span className="text-sm font-semibold text-slate-500">{baseCurrency}</span>
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                مؤكد من المبيعات والفواتير (Accounting)
              </p>
            </div>

            {/* 2. Operations Cost Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 border border-rose-100">
                <Briefcase className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">تكاليف التشغيل (Operations Cost)</span>
              <h3 className="text-3xl font-black text-slate-900 mt-2">
                {financialData.operationsCost.toLocaleString()} <span className="text-sm font-semibold text-slate-500">{baseCurrency}</span>
              </h3>
              <p className="text-[10px] text-rose-500 font-bold mt-2 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5" />
                تُحسب تلقائياً من الـ Operations Hub
              </p>
            </div>

            {/* 3. Actual Net Profit Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 border border-indigo-100">
                <Coins className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">صافي الربح الفعلي (Net Profit)</span>
              <h3 className={cn(
                "text-3xl font-black mt-2",
                financialData.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"
              )}>
                {financialData.netProfit.toLocaleString()} <span className="text-sm font-semibold text-slate-500">{baseCurrency}</span>
              </h3>
              <p className="text-[10px] text-indigo-500 font-bold mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                الإيرادات مطروحاً منها تكاليف التشغيل لايف
              </p>
            </div>

            {/* 4. ROI Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
                <Percent className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">العائد على الإعلانات (Marketing ROI)</span>
              <h3 className="text-3xl font-black text-slate-900 mt-2">
                {(financialData.adROI * 100).toFixed(0)}%
              </h3>
              <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                <Megaphone className="w-3.5 h-3.5" />
                مقارنة صرف Marketing بالصفقات الرابحة
              </p>
            </div>
          </div>

          {/* Central Analysis Panel - Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. Leads vs Sold Card */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                معدل تحويل العملاء (Leads vs Actual Sales)
              </h4>
              <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'العملاء المهتمين (Leads)', value: Math.max(0, financialData.totalLeads - financialData.wonDealsCount) },
                          { name: 'العملاء المشترين (Sales)', value: financialData.wonDealsCount }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#cbd5e1" />
                        <Cell fill="#6366f1" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-800">
                      {financialData.totalLeads > 0 
                        ? ((financialData.wonDealsCount / financialData.totalLeads) * 100).toFixed(1)
                        : 0}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">معدل التحويل</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-slate-300" />
                      <span className="text-xs font-bold text-slate-600">إجمالي الـ Leads</span>
                    </div>
                    <span className="text-base font-black text-slate-800">{financialData.totalLeads} عميل</span>
                  </div>
                  <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-indigo-600" />
                      <span className="text-xs font-bold text-indigo-600">العملاء المشترين فعلياً</span>
                    </div>
                    <span className="text-base font-black text-indigo-800">{financialData.wonDealsCount} عميل</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Monthly Financial Trend Chart */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                نمو التدفقات المالية (Income & Profit Performance)
              </h4>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" name="إجمالي الإيرادات" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="صافي الأرباح" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Pipelines Side-by-Side Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* A. CRM Sales Pipeline Health */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  مؤشرات خط المبيعات (Sales CRM Health)
                </h4>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                  نشط لايف
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">صفقات معلقة</span>
                  <span className="text-2xl font-black text-slate-800">{financialData.pendingDealsCount}</span>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl text-center border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 block mb-1">صفقات ربحانة</span>
                  <span className="text-2xl font-black text-emerald-800">{financialData.wonDealsCount}</span>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl text-center border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-600 block mb-1">متوسط الإغلاق</span>
                  <span className="text-xl font-black text-indigo-800">{financialData.avgClosingDays.toFixed(1)} <span className="text-xs font-medium">يوم</span></span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  تعتمد الحسابات على مؤشر <strong className="text-slate-800">is_won</strong> الخاص بحالة الصفقة، مما يضمن دقة الأرقام حتى في حال تعديل مسميات المراحل.
                </p>
              </div>
            </div>

            {/* B. Operations Pipeline Health */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-500" />
                  مؤشرات خط العمليات (Operations Pipeline Health)
                </h4>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                  نشط لايف
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl text-center border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 block mb-1">طلب معلق</span>
                  <span className="text-lg font-black text-slate-800">{financialData.opsPendingCount}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-center border border-amber-100">
                  <span className="text-[9px] font-bold text-amber-600 block mb-1">قيد التنفيذ</span>
                  <span className="text-lg font-black text-slate-800">{financialData.opsExecutingCount}</span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-center border border-emerald-100">
                  <span className="text-[9px] font-bold text-emerald-600 block mb-1">تم الاستلام</span>
                  <span className="text-lg font-black text-slate-800">{financialData.opsDeliveredCount}</span>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl text-center border border-indigo-100">
                  <span className="text-[9px] font-bold text-indigo-600 block mb-1">متوسط التسليم</span>
                  <span className="text-base font-black text-indigo-800">{financialData.avgExecutionDays.toFixed(1)} <span className="text-[10px] font-medium">يوم</span></span>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  يتم تتبع تسليم العملاء وتكاليف التشغيل ديناميكياً بناءً على حقل <strong className="text-slate-800">is_completed</strong> لمراحل العمليات.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )}

  {activeTab === 'human_capital' && (
    <div className="space-y-8">
      {humanCapitalLoading && !humanCapitalData ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-semibold text-sm">جاري جلب مؤشرات رأس المال البشري والأداء...</p>
        </div>
      ) : !humanCapitalData ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
          <p className="text-slate-500 font-semibold text-sm">لم نتمكن من جلب بيانات رأس المال البشري. يرجى التأكد من اتصال قاعدة البيانات.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 text-right"
        >
          {/* Top 3 Core KPIs Requested */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KPI 1: معدل إنتاجية الشركة العام */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <Activity className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">إنتاجية عالية</span>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">معدل إنتاجية الشركة العام (Corporate Productivity)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-4xl font-black text-slate-900">
                  {humanCapitalData.companyProductivity}%
                </h3>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-650 h-full rounded-full transition-all duration-1000" style={{ width: `${humanCapitalData.companyProductivity}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-3">
                يمثل متوسط مؤشرات الأداء (KPIs) لجميع الكوادر البشرية النشطة في الشركة.
              </p>
            </div>

            {/* KPI 2: مؤشر جاهزية الفريق */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg font-mono">Ready ({humanCapitalData.trainingReadiness}%)</span>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">مؤشر جاهزية الفريق (Training Readiness)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-4xl font-black text-slate-900">
                  {humanCapitalData.trainingReadiness}%
                </h3>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full transition-all duration-1000" style={{ width: `${humanCapitalData.trainingReadiness}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-3">
                نسبة الموظفين الذين أتموا الكورسات التدريبية بنجاح في Training Hub واطلعوا على قاعدة المعرفة والـ SOPs.
              </p>
            </div>

            {/* KPI 3: رادار الاجتماعات */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Clock className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">{humanCapitalData.meetingsPulse.totalMeetings} اجتماع استراتيجي</span>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">رادار الاجتماعات والقرارات (Meetings Pulse)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-4xl font-black text-slate-900">
                  {humanCapitalData.meetingsPulse.decisionExecutionRate}%
                </h3>
                <span className="text-xs font-semibold text-slate-500">معدل تنفيذ القرارات</span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${humanCapitalData.meetingsPulse.decisionExecutionRate}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-3">
                عدد الاجتماعات المنعقدة عبر Meeting Hub ونسبة تنفيذ القرارات والمهام المنبثقة عنها.
              </p>
            </div>

          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Human Development Trend */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">مؤشر التطور البشري والإنتاجية (6 أشهر)</h4>
                  <p className="text-xs text-slate-400">تطور إنتاجية الكوادر وجاهزيتها التدريبية</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={humanCapitalData.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[50, 100]} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', textAlign: 'right' }} 
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ direction: 'rtl', fontSize: 11 }} />
                    <Line name="معدل الإنتاجية العام" type="monotone" dataKey="productivity" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} />
                    <Line name="مؤشر جاهزية الفريق" type="monotone" dataKey="trainingReadiness" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} />
                    <Line name="رادار الاجتماعات" type="monotone" dataKey="meetingPulse" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Department Training Readiness */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">جاهزية الأقسام التدريبية (Training Readiness by Dept)</h4>
                  <p className="text-xs text-slate-400">مستوى المعرفة والتدريب التراكمي لكل قسم</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={humanCapitalData.deptReadiness} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', textAlign: 'right' }} 
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar name="نسبة الجاهزية (%)" dataKey="readiness" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                      {humanCapitalData.deptReadiness.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Employee Talent Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base">إنتاجية وتطور الكادر البشري (Employee Productivity & Development)</h4>
                <p className="text-xs text-slate-400 mt-1 font-medium">تتبع مستمر للمهارات، الكورسات المكتملة، ونسب تنفيذ المهام لكل موظف مدمجاً من الموارد البشرية والتدريب وقاعدة المعرفة والاجتماعات</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">نظام التعلم والمهام المدمج</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-150 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                    <th className="px-6 py-4">الموظف (Employee)</th>
                    <th className="px-6 py-4">القسم (Department)</th>
                    <th className="px-6 py-4 text-center">معدل الإنتاجية (Productivity)</th>
                    <th className="px-6 py-4 text-center">تقييم الأداء (Performance Review)</th>
                    <th className="px-6 py-4 text-center">الكورسات المنجزة (Courses Completed)</th>
                    <th className="px-6 py-4 text-center">نقاط التدريب (Training Points)</th>
                    <th className="px-6 py-4 text-center">إنجاز المهام (Task Completion)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-sm text-slate-700">
                  {humanCapitalData.employeesList.map((emp: any) => {
                    const initials = emp.name ? emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'EM';
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-3 justify-start">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-black text-xs shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-sm leading-none">{emp.name}</p>
                              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{emp.jobTitle}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200/50">
                            {emp.department}
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <span className="text-xs font-mono font-black text-indigo-650">{emp.productivity}%</span>
                            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${emp.productivity}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl border border-amber-100 text-xs font-black">
                            <span>★</span>
                            <span>{emp.performanceScore.toFixed(1)} / 5.0</span>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-center font-mono">
                          <span className="text-slate-900 font-extrabold">{emp.completedCourses}</span>
                          <span className="text-xs text-slate-400 font-medium"> كورسات</span>
                        </td>
                        <td className="px-6 py-4.5 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 text-xs font-black">
                            {emp.trainingPoints} pts
                          </span>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex flex-col items-center justify-center gap-1 font-mono">
                            <span className="text-xs font-black text-slate-900">
                              {emp.tasksCompleted} <span className="text-[10px] text-slate-400 font-medium">/ {emp.totalTasks}</span>
                            </span>
                            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              {Math.round((emp.tasksCompleted / (emp.totalTasks || 1)) * 100)}% إنجاز
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )}

  {activeTab === 'operational_efficiency' && (
    <div className="space-y-8">
      {operationalEfficiencyLoading && !operationalEfficiencyData ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm text-right">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-semibold text-sm">جاري جلب مؤشرات الكفاءة التشغيلية والجودة...</p>
        </div>
      ) : !operationalEfficiencyData ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm text-right">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
          <p className="text-slate-500 font-semibold text-sm">لم نتمكن من جلب بيانات الكفاءة التشغيلية. يرجى التأكد من اتصال قاعدة البيانات.</p>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 text-right font-sans"
        >
          {/* Top 3 Core KPIs Requested */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KPI 1: معدل الالتزام بالـ SOPs والعمليات */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">التزام قياسي</span>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">معدل الالتزام بالـ SOPs والعمليات (SOP & Process Compliance)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-4xl font-black text-slate-900">
                  {operationalEfficiencyData.complianceRate}%
                </h3>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full transition-all duration-1000" style={{ width: `${operationalEfficiencyData.complianceRate}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-3">
                يظهر مدى التزام فرق التشغيل بالخطوات المحددة في خرائط العمليات (Process Mapping) ومصفوفة المسؤوليات (RACI Matrix).
              </p>
            </div>

            {/* KPI 2: مؤشر جودة المخرجات */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg font-mono">QA Pass Rate</span>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">مؤشر جودة المخرجات (QA Health Index)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-4xl font-black text-slate-900">
                  {operationalEfficiencyData.qaHealthIndex}%
                </h3>
              </div>
              <div className="mt-3">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full transition-all duration-1000" style={{ width: `${operationalEfficiencyData.qaHealthIndex}%` }} />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-3">
                نسبة الفحوصات والتقييمات المقبولة والمعتمدة من قِبل إدارة الجودة (Quality Assurance) مقارنة بإجمالي ما تم تنفيذه وتدقيقه.
              </p>
            </div>

            {/* KPI 3: عداد الكايزن وتطوير العمل */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full translate-x-12 -translate-y-12 group-hover:scale-110 transition-transform" />
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">نشط هذا الشهر</span>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">عداد الكايزن وحل المشكلات (Kaizen Tracker)</span>
              <div className="flex items-baseline gap-2 mt-2">
                <h3 className="text-4xl font-black text-slate-900">
                  +{operationalEfficiencyData.kaizenTracker.totalImprovementsThisMonth}
                </h3>
                <span className="text-xs font-semibold text-slate-500">مبادرة تحسين تم حلها</span>
              </div>
              <div className="flex gap-2.5 mt-3 text-[10px] font-bold text-slate-500">
                <span className="bg-slate-100 px-2 py-1 rounded-lg">💡 كايزن منجز: {operationalEfficiencyData.kaizenTracker.implementedKaizens}</span>
                <span className="bg-slate-100 px-2 py-1 rounded-lg">🛠️ NCR تم حلها: {operationalEfficiencyData.kaizenTracker.resolvedNCRs}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-3">
                عدد أفكار التطوير والتحسين المستمر المطبقة وحالات عدم المطابقة المحلولة لمعالجة الهدر وتطوير مسارات العمل.
              </p>
            </div>

          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Chart 1: Operational & QA Trend */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">مؤشر جودة العمليات والالتزام (6 أشهر)</h4>
                  <p className="text-xs text-slate-400">تحليل تاريخي لمعدل المطابقة وجودة المخرجات</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={operationalEfficiencyData.efficiencyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[60, 100]} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', textAlign: 'right' }} 
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ direction: 'rtl', fontSize: 11 }} />
                    <Line name="معدل الالتزام بالعمليات" type="monotone" dataKey="compliance" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 6 }} />
                    <Line name="مؤشر جودة المخرجات QA" type="monotone" dataKey="qaHealth" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Department Compliance Bar */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">معدل الالتزام بالـ SOPs حسب الأقسام (SOP Compliance by Dept)</h4>
                  <p className="text-xs text-slate-400">الالتزام بالعمليات وسيناريوهات التشغيل المعتمدة</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse" />
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operationalEfficiencyData.deptCompliance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px', textAlign: 'right' }} 
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar name="نسبة المطابقة والالتزام (%)" dataKey="compliance" fill="#6366f1" radius={[8, 8, 0, 0]}>
                      {operationalEfficiencyData.deptCompliance.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Combined Operations logs & Kaizen suggestions & NCRs */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* 1. Recent Quality Evaluations (QA) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col h-[520px]">
              <div className="mb-4">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-black uppercase">تدقيق الجودة المدمج</span>
                <h4 className="font-extrabold text-slate-900 text-base mt-1.5">تقييمات الجودة الأخيرة (QA Audits)</h4>
                <p className="text-xs text-slate-400 mt-1">آخر تقييمات العمليات والـ SOPs المنفذة</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-none">
                {operationalEfficiencyData.recentEvaluations.map((evalItem: any) => (
                  <div key={evalItem.id} className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-100 transition-all flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-black text-slate-800 leading-tight block max-w-[70%]">
                        {evalItem.processName}
                      </span>
                      <span className={cn(
                        "text-[11px] font-black px-2 py-0.5 rounded-lg",
                        evalItem.totalScore >= 90 ? "bg-emerald-50 text-emerald-700" : evalItem.totalScore >= 80 ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {evalItem.totalScore}%
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-1">
                      <span>المدقق: {evalItem.reviewerName}</span>
                      <span>المنفذ: {evalItem.employeeName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Non-Conformance Reports (NCR) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col h-[520px]">
              <div className="mb-4">
                <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-black uppercase">حالات عدم المطابقة والخطورة</span>
                <h4 className="font-extrabold text-slate-900 text-base mt-1.5">إنذارات عدم المطابقة والـ NCR</h4>
                <p className="text-xs text-slate-400 mt-1">تتبع الدروبات وحالات الحياد عن الـ SOPs</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-none">
                {operationalEfficiencyData.recentNCRs.map((ncr: any) => (
                  <div key={ncr.id} className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-100 transition-all flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-slate-800 leading-relaxed block max-w-[75%]">
                        {ncr.description}
                      </span>
                      <span className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded",
                        ncr.severity === 'critical' ? "bg-rose-100 text-rose-700 animate-pulse" :
                        ncr.severity === 'high' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {ncr.severity}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] font-bold mt-1">
                      <span className="text-slate-400">المسؤول: {ncr.assignedTo}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px]",
                        ncr.status === 'resolved' || ncr.status === 'closed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {ncr.status === 'resolved' ? 'تم الحل' : ncr.status === 'closed' ? 'مغلق' : 'قيد التحقيق'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Recent Kaizen & Improvements */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col h-[520px]">
              <div className="mb-4">
                <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-black uppercase">التطوير المستمر وكايزن</span>
                <h4 className="font-extrabold text-slate-900 text-base mt-1.5">مبادرات الكايزن النشطة (Kaizen Ideas)</h4>
                <p className="text-xs text-slate-400 mt-1">أفكار ومقترحات الموظفين لتحسين جودة التشغيل</p>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-none">
                {operationalEfficiencyData.recentKaizens.map((kaizen: any) => (
                  <div key={kaizen.id} className="p-4 bg-slate-50 hover:bg-slate-50/80 rounded-2xl border border-slate-100 transition-all flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-black text-slate-800 leading-tight block max-w-[75%]">
                        {kaizen.title}
                      </span>
                      <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded shrink-0">
                        {kaizen.improvementType === 'Time Reduction' ? 'تقليل الوقت' : 'تخفيض تكاليف'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] font-bold mt-1">
                      <span className="text-slate-400">بواسطة: {kaizen.submittedBy}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[9px]",
                        kaizen.status === 'Done' ? "bg-emerald-50 text-emerald-600" :
                        kaizen.status === 'Implementing' ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                      )}>
                        {kaizen.status === 'Done' ? 'مكتمل' : kaizen.status === 'Implementing' ? 'قيد التنفيذ' : 'جديد'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </motion.div>
      )}
    </div>
  )}

      {/* Notifications Sidebar */}
      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifications(false)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Real-time Feed</h3>
                <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-20">
                    <Zap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 text-sm">No recent activity</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div key={notif.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          notif.type === 'error' ? "bg-rose-500" : notif.type === 'warning' ? "bg-amber-500" : "bg-indigo-500"
                        )} />
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{notif.title}</p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2">{new Date(notif.created_at).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Actions FAB */}
      <div className="fixed bottom-8 right-8 z-50 no-print">
        <AnimatePresence>
          {isQuickActionOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 w-56 overflow-hidden"
            >
              <QuickActionItem icon={BookOpen} label="New SOP" onClick={() => {}} color="indigo" />
              <QuickActionItem icon={AlertTriangle} label="Register Risk" onClick={() => {}} color="rose" />
              <QuickActionItem icon={TrendingUp} label="Submit Kaizen" onClick={() => {}} color="amber" />
              <QuickActionItem icon={MessageCircle} label="Send Message" onClick={() => {}} color="blue" />
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl transition-all duration-300",
            isQuickActionOpen ? "bg-slate-800 rotate-45" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-110"
          )}
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

function WidgetCard({ title, value, subValue, icon: Icon, color, alert }: any) {
  const colors: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
    >
      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-4 border", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
        {alert && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
      </div>
      <p className="text-[10px] font-bold text-slate-500 mt-1">{subValue}</p>
    </motion.div>
  );
}

function QuickActionItem({ icon: Icon, label, onClick, color }: any) {
  const colors: any = {
    indigo: "text-indigo-600 bg-indigo-50",
    rose: "text-rose-600 bg-rose-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
  };

  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group"
    >
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{label}</span>
    </button>
  );
}
