import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  History, 
  CheckCircle2, 
  UserCheck, 
  Globe, 
  RotateCcw,
  Search,
  RefreshCw,
  Sliders,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useSalesContext } from '../context/SalesContext';
import { cn } from '../../../lib/utils';

export const AutoAssignLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, leads, routingLogs, setRoutingLogs, showToast } = useSalesContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'skipped'>('all');

  // Combine context routing logs with baseline demonstration items if empty
  const allLogs = useMemo(() => {
    if (routingLogs && routingLogs.length > 0) {
      return routingLogs.map(l => ({
        id: l.id,
        leadName: l.dealTitle || `Deal #${l.dealId}`,
        source: 'CRM Inbound',
        assignedToName: l.assignedUserName || `Rep #${l.assignedUserId}`,
        matchedRule: l.ruleId || 'Round-Robin Engine',
        status: l.status === 'success' ? 'Success' : 'Skipped',
        timestamp: l.timestamp || 'Just now',
        reason: l.reason
      }));
    }

    return [
      {
        id: 'log-1',
        leadName: 'Nasser Al-Subaie (Cloud Migration Deal)',
        source: 'Website Form Inquiry',
        assignedToName: users[0]?.name || 'Sales Rep A',
        matchedRule: 'Channel Source: Website Inquiry',
        status: 'Success',
        timestamp: 'Today at 09:30 AM',
        reason: undefined
      },
      {
        id: 'log-2',
        leadName: 'Sara Al-Otaibi (Marketing Automation)',
        source: 'Meta Ads Campaign',
        assignedToName: users[1]?.name || users[0]?.name || 'Sales Rep B',
        matchedRule: 'Meta Ads Lead Ingestion',
        status: 'Success',
        timestamp: 'Yesterday at 04:15 PM',
        reason: undefined
      },
      {
        id: 'log-3',
        leadName: 'Apex Cloud Solutions (Enterprise ERP)',
        source: 'Referral Partner',
        assignedToName: users[0]?.name || 'Senior Executive',
        matchedRule: 'High-Value Enterprise Deal Size (> 50k)',
        status: 'Success',
        timestamp: '2 days ago',
        reason: undefined
      }
    ];
  }, [routingLogs, users]);

  const filteredLogs = useMemo(() => {
    return allLogs.filter(l => {
      const matchSearch = !searchQuery || 
        l.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.assignedToName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.matchedRule.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || 
        (statusFilter === 'success' && l.status === 'Success') ||
        (statusFilter === 'skipped' && l.status === 'Skipped');

      return matchSearch && matchStatus;
    });
  }, [allLogs, searchQuery, statusFilter]);

  const handleClearLogs = () => {
    setRoutingLogs([]);
    showToast('Routing execution logs cleared.', 'info');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Sub-Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/sales/auto-assign/round-robin')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Round-Robin & Strategy Hub</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/auto-assign/rules')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Assignment Rules Matrix</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/sales/auto-assign/logs')}
            className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Routing Logs ({allLogs.length})</span>
          </button>
        </div>

        {allLogs.length > 0 && (
          <button
            type="button"
            onClick={handleClearLogs}
            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Lead Routing Execution Audit Logs
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Immutable audit trail of automated opportunity dispatches, algorithm decisions, and capacity limit events.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-700"
            >
              <option value="all">All Events ({allLogs.length})</option>
              <option value="success">Success Only</option>
              <option value="skipped">Skipped / Over Capacity</option>
            </select>

            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deal or rep..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none"
              />
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Opportunity / Lead</th>
                  <th className="py-3 px-4">Channel Source</th>
                  <th className="py-3 px-4">Matched Strategy / Rule</th>
                  <th className="py-3 px-4">Assigned Representative</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-center">Outcome Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                      No matching routing logs found for current filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {log.leadName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {log.source}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {log.matchedRule}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-600">
                        {log.assignedToName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {log.timestamp}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-black border",
                          log.status === 'Success'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        )}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
