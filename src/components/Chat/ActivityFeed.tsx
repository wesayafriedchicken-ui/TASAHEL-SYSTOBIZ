import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  User, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AuditLog {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  created_at: string;
}

export default function ActivityFeed() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/chat/activity');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch activity logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (action: string) => {
    const lower = (action || '').toLowerCase();
    if (lower.includes('create') || lower.includes('add')) return <PlusIcon className="w-4 h-4 text-emerald-500" />;
    if (lower.includes('update') || lower.includes('edit') || lower.includes('change')) return <RefreshCw className="w-4 h-4 text-blue-500" />;
    if (lower.includes('delete') || lower.includes('remove')) return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    if (lower.includes('publish') || lower.includes('complete')) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  const PlusIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600" />
          System Activity Feed
        </h3>
        <button 
          onClick={fetchLogs}
          className="p-1.5 hover:bg-white rounded-lg transition-colors text-slate-400"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {logs.length === 0 && !loading ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">No recent activity found.</p>
          </div>
        ) : (
          logs.map((log, idx) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex gap-4 group"
            >
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm group-hover:border-indigo-200 transition-colors">
                  {getIcon(log.action)}
                </div>
                {idx !== logs.length - 1 && <div className="w-px h-full bg-slate-100 my-1" />}
              </div>
              
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-900">{log.user_name || 'System'}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-indigo-600">{log.action}</span>
                  {log.entity_type && (
                    <span className="mx-1 text-slate-400">on {log.entity_type} #{log.entity_id}</span>
                  )}
                </p>
                {log.details && (
                  <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">
                    {log.details}
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
