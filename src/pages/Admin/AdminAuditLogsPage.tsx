import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ChevronRight as ArrowRight,
  Activity, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AuditLogItem {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id: number | string;
  details?: string;
  created_at: string;
  old_value?: any;
  new_value?: any;
}

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalLogs, setTotalLogs] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [userList, setUserList] = useState<{ id: number; name: string }[]>([]);
  const [userFilter, setUserFilter] = useState<string>('all');

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': userId || '1'
    };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load user list for the filter once
  useEffect(() => {
    fetch('/api/admin/users?limit=100', { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []);
        setUserList(list.map((u: any) => ({ id: u.id, name: u.name })));
      })
      .catch(() => null);
  }, [getAuthHeaders]);

  // Fetch paginated audit logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25'
      });

      if (debouncedSearch) params.append('search', debouncedSearch);
      if (moduleFilter && moduleFilter !== 'all') params.append('module', moduleFilter);
      if (userFilter && userFilter !== 'all') params.append('userId', userFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && Array.isArray(data.logs)) {
        setLogs(data.logs);
        setTotalLogs(data.total || data.logs.length);
        setTotalPages(data.totalPages || Math.ceil((data.total || data.logs.length) / 25) || 1);
      } else if (Array.isArray(data)) {
        setLogs(data);
        setTotalLogs(data.length);
        setTotalPages(Math.ceil(data.length / 25) || 1);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, moduleFilter, userFilter, dateFilter, getAuthHeaders]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search and Filters Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search action, module, user, or details..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Module Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Module:</span>
            <select
              value={moduleFilter}
              onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-xs font-bold text-indigo-600 focus:ring-0 cursor-pointer pr-2"
            >
              <option value="all">All Modules</option>
              <option value="Admin">Admin</option>
              <option value="HR">HR</option>
              <option value="Sales">Sales</option>
              <option value="Operations">Operations</option>
              <option value="Finance">Finance</option>
              <option value="Inventory">Inventory</option>
              <option value="module">Custom Modules</option>
            </select>
          </div>

          {/* User Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>User:</span>
            <select
              value={userFilter}
              onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-xs font-bold text-indigo-600 focus:ring-0 cursor-pointer pr-2 max-w-[140px] truncate"
            >
              <option value="all">All Users</option>
              {userList.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="date"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="bg-transparent border-none text-xs font-bold text-indigo-600 focus:ring-0 p-0"
            />
            {dateFilter && (
              <button 
                onClick={() => { setDateFilter(''); setPage(1); }}
                className="text-[10px] text-rose-500 hover:text-rose-700 ml-1 font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Admin / User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Module</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Changes</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <span className="text-sm font-medium">Loading audit logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No audit logs found matching criteria.</p>
                      <p className="text-xs text-slate-400">Try clearing filters or changing search terms.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionUpper = (log.action || '').toUpperCase();
                  const isCreate = actionUpper.includes('CREATE') || actionUpper.includes('ADD');
                  const isUpdate = actionUpper.includes('UPDATE') || actionUpper.includes('EDIT') || actionUpper.includes('MODIFY');
                  const isDelete = actionUpper.includes('DELETE') || actionUpper.includes('REMOVE');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-500 font-mono whitespace-nowrap">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-900">{log.user_name || 'System'}</span>
                        {log.user_email && <p className="text-[11px] text-slate-400">{log.user_email}</p>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider border border-indigo-100">
                          {log.entity_type || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border",
                          isCreate ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          isUpdate ? "bg-blue-50 text-blue-700 border-blue-200" :
                          isDelete ? "bg-rose-50 text-rose-700 border-rose-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {log.old_value && log.new_value ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-sm line-through opacity-70 border border-rose-100">
                              Old
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-sm font-bold border border-emerald-100">
                              New
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '-')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Controls */}
        {!loading && totalLogs > 0 && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{(page - 1) * 25 + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(page * 25, totalLogs)}</span> of{' '}
              <span className="font-bold text-slate-800">{totalLogs}</span> total logs
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={cn(
                  "p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1",
                  page <= 1 
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-2 text-slate-400 text-xs">...</span>}
                        <button
                          onClick={() => setPage(p)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                            p === page
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={cn(
                  "p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1",
                  page >= totalPages 
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
                )}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogsPage;
