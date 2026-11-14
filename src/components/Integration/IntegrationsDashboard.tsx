import React from 'react';
import { 
  Activity, Zap, CheckCircle2, AlertCircle, RefreshCw, BarChart2,
  TrendingUp, Globe, ArrowRight, ShieldCheck, Database
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { Integration, IntegrationLog } from '../../types';

interface IntegrationsDashboardProps {
  integrations: Integration[];
  logs: IntegrationLog[];
  onNavigateToDirectory: () => void;
}

export const IntegrationsDashboard: React.FC<IntegrationsDashboardProps> = ({ 
  integrations, 
  logs,
  onNavigateToDirectory
}) => {
  // Calculated KPIs
  const activeConnectionsCount = integrations.filter(i => i.status === 'connected').length;
  
  // Total API keys/requests baseline + live sync additions
  const totalAPIRequests = 48290 + (logs.length * 15);
  
  // Sync success rate calculation
  const getSuccessRate = () => {
    if (logs.length === 0) return 99.8;
    const successful = logs.filter(l => l.status === 'success').length;
    const rate = (successful / logs.length) * 100;
    return parseFloat(rate.toFixed(2));
  };
  
  const successRate = getSuccessRate();

  // Traffic and volume data per integration application (Dynamic & Static combined beautifully)
  const getConnectionVolumeData = () => {
    const defaultApps = [
      { name: 'Google Sheets', volume: 18400, color: '#10b981', requests: 4620 },
      { name: 'Meta API (Ads)', volume: 12100, color: '#3b82f6', requests: 3105 },
      { name: 'WhatsApp Webhook', volume: 9200, color: '#22c55e', requests: 2840 },
      { name: 'Gemini API', volume: 5400, color: '#8b5cf6', requests: 1350 },
      { name: 'Email SMTP', volume: 2200, color: '#64748b', requests: 520 },
      { name: 'Twilio SMS', volume: 990, color: '#f59e0b', requests: 410 }
    ];

    // Adapt based on state integrations if available
    integrations.forEach(i => {
      const match = defaultApps.find(app => app.name.toLowerCase().includes(i.type.replace('_', ' ')));
      if (match) {
        match.volume += 150;
        match.requests += 12;
      }
    });

    return defaultApps;
  };

  const dataVolume = getConnectionVolumeData();

  return (
    <div className="space-y-6 text-left" dir="ltr">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-white/5 -skew-x-12 transform origin-top-right pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-blue-200" />
              Integration Hub Center
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Middleware Ecosystem Dashboard</h2>
            <p className="text-blue-100 text-sm max-w-xl">
              Real-time synchronization logs, API request analytics, and secure payload routing state trackers.
            </p>
          </div>
          <div>
            <button 
              onClick={onNavigateToDirectory}
              className="bg-white text-indigo-700 hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm"
            >
              <span>Explore App Directory</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - LTR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Active Connections */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-l-indigo-600">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Active Connections
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  {activeConnectionsCount}
                </span>
                <span className="text-[10px] text-slate-400 font-bold block">
                  configured apps
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Live third-party services actively bound with active secure keys.
              </p>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-450 font-semibold">
            <span>Overall Enabled API modules:</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
              {integrations.length} Active / Configured
            </span>
          </div>
        </div>

        {/* KPI 2: Total API Requests */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-l-emerald-600">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Total API Requests
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  {totalAPIRequests.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  <span>+11.8%</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Data rows and payloads sent/received in the current calendar month.
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-450 font-semibold">
            <span>Avg Traffic Per Hour:</span>
            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
              ~67 requests
            </span>
          </div>
        </div>

        {/* KPI 3: Sync Success Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-600">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Sync Success Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  {successRate}%
                </span>
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-bold">
                  Target &gt; 99.5%
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Payload verification score. Reflects seamless operations without data drop.
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-450 font-semibold">
            <span>Platform Integrity:</span>
            <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
              Excellent SLA Status
            </span>
          </div>
        </div>

      </div>

      {/* Chart Block: Data Flows Volume */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              <span>Data Consumption Volume per External App</span>
            </h3>
            <p className="text-xs text-slate-400">
              Total volume index (kilobytes processed) compared with unique API trigger transactions.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
              <span>KB Consumed (Volume)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span>API Transactions (Requests)</span>
            </div>
          </div>
        </div>

        {/* Bar Chart representing app data consumption flows */}
        <div className="h-80 w-full font-sans">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tickLine={false}
                axisLine={false}
                style={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                style={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '11px',
                  padding: '10px',
                  textAlign: 'left'
                }}
              />
              <Bar dataKey="volume" name="Volume index (KB)" radius={[4, 4, 0, 0]}>
                {dataVolume.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} opacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="requests" name="Unique API Requests" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time sync list header suggestion */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-xs text-slate-600">
        <Activity className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800">Dynamic Sync Logs Tracking Active</p>
          <p className="mt-0.5 text-slate-500">
            Every synchronized row from client forms, Meta pixel payloads, Google Sheets triggers, and Gemini completions feed here automatically. Try checking the available connectors for new updates.
          </p>
        </div>
      </div>
    </div>
  );
};
