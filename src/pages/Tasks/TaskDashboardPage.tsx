import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ChevronRight,
  Flame,
  Calendar,
  Layers,
  ListTodo
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { useTask } from './TaskContext';

const STATUS_COLORS: Record<string, string> = {
  pending: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#8b5cf6',
  completed: '#10b981',
  on_hold: '#f59e0b'
};

const STATUS_NAMES: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  review: 'Under Review',
  completed: 'Completed',
  on_hold: 'On Hold'
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#3b82f6',
  high: '#f97316',
  critical: '#ef4444'
};

const PRIORITY_NAMES: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical'
};

export const TaskDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, users, isLoading } = useTask();

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const review = tasks.filter(t => t.status === 'review').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const onHold = tasks.filter(t => t.status === 'on_hold').length;

    const now = new Date();
    const overdue = tasks.filter(t => {
      if (t.status === 'completed' || !t.due_date) return false;
      return new Date(t.due_date) < now;
    });

    const critical = tasks.filter(t => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'completed');

    const totalSeconds = tasks.reduce((acc, t) => acc + (t.time_spent_seconds || 0), 0);
    const totalHours = (totalSeconds / 3600).toFixed(1);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      review,
      pending,
      onHold,
      overdueCount: overdue.length,
      overdueTasks: overdue.slice(0, 5),
      criticalCount: critical.length,
      totalHours,
      completionRate
    };
  }, [tasks]);

  // Chart 1: Status Distribution
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      review: 0,
      completed: 0,
      on_hold: 0
    };
    tasks.forEach(t => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });

    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_NAMES[status] || status,
      key: status,
      value,
      color: STATUS_COLORS[status] || '#cbd5e1'
    })).filter(d => d.value > 0);
  }, [tasks]);

  // Chart 2: Priority Distribution
  const priorityChartData = useMemo(() => {
    const counts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    tasks.forEach(t => {
      if (counts[t.priority] !== undefined) {
        counts[t.priority]++;
      }
    });

    return [
      { name: 'Low', key: 'low', count: counts.low, color: PRIORITY_COLORS.low },
      { name: 'Medium', key: 'medium', count: counts.medium, color: PRIORITY_COLORS.medium },
      { name: 'High', key: 'high', count: counts.high, color: PRIORITY_COLORS.high },
      { name: 'Critical', key: 'critical', count: counts.critical, color: PRIORITY_COLORS.critical }
    ];
  }, [tasks]);

  // Chart 3: Team Workload (Top 5 assignees)
  const teamWorkloadData = useMemo(() => {
    const map: Record<string, { name: string; total: number; completed: number }> = {};
    
    tasks.forEach(t => {
      const assignee = t.assigned_to_name || 'Unassigned';
      if (!map[assignee]) {
        map[assignee] = { name: assignee, total: 0, completed: 0 };
      }
      map[assignee].total++;
      if (t.status === 'completed') {
        map[assignee].completed++;
      }
    });

    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [tasks]);

  if (isLoading && tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-200 shadow-sm text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Calculating productivity metrics from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks Card */}
        <div 
          onClick={() => navigate('/tasks/board')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tasks</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{metrics.total}</span>
            <span className="text-xs text-slate-500 font-medium">in system</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{metrics.inProgress} currently in progress</span>
            <ArrowUpRight className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        {/* Completion Rate Card */}
        <div 
          onClick={() => navigate('/tasks/list')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-mono tracking-tight">{metrics.completionRate}%</span>
            <span className="text-xs text-slate-500 font-medium">({metrics.completed} completed)</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Overdue Tasks Card */}
        <div 
          onClick={() => navigate('/tasks/list')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overdue Tasks</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono tracking-tight ${metrics.overdueCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {metrics.overdueCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">require attention</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-rose-600 font-medium">
              {metrics.overdueCount > 0 ? 'Review deadlines & timeline' : 'No overdue tasks'}
            </span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
        </div>

        {/* Time Spent Card */}
        <div 
          onClick={() => navigate('/tasks/board')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Logged Hours</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{metrics.totalHours}</span>
            <span className="text-xs text-slate-500 font-medium">hrs logged</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{metrics.criticalCount} high priority tasks</span>
            <ArrowUpRight className="w-4 h-4 text-amber-600" />
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Task Status Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of operational tasks across pipeline stages</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {metrics.total} tasks
            </span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => [`${val} tasks`, 'Count']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400 text-xs">No tasks recorded yet</div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            {statusChartData.map(item => (
              <div key={item.key} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium truncate">{item.name}:</span>
                <span className="font-bold text-slate-900 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Urgency Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Priority Levels & Urgency</h3>
              <p className="text-xs text-slate-500">Classification of workload by operational impact</p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
              {metrics.criticalCount} Critical & High
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  formatter={(val: number) => [`${val} tasks`, 'Count']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Critical tasks require prompt team focus</span>
            <button 
              onClick={() => navigate('/tasks/board')}
              className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Open Board</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* TEAM WORKLOAD & OVERDUE RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Workload */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Team Workload Distribution</h3>
              <p className="text-xs text-slate-500">Assigned task volume and completion rate per member</p>
            </div>
            <Users className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="space-y-4">
            {teamWorkloadData.length > 0 ? (
              teamWorkloadData.map((member, idx) => {
                const percent = member.total > 0 ? Math.round((member.completed / member.total) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{member.name}</span>
                      <span className="font-mono text-slate-500">
                        {member.completed} / {member.total} tasks ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">No assigned team data available</p>
            )}
          </div>
        </div>

        {/* Overdue Alerts & Deadlines */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Deadline & Overdue Alerts</h3>
              <p className="text-xs text-slate-500">Tasks exceeding delivery dates or nearing urgent completion</p>
            </div>
            <Flame className="w-5 h-5 text-rose-500" />
          </div>

          <div className="space-y-2.5">
            {metrics.overdueTasks.length > 0 ? (
              metrics.overdueTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="p-3 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{task.title}</h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Assignee: {task.assigned_to_name || 'Unassigned'}</span>
                      <span>•</span>
                      <span className="text-rose-600 font-bold font-mono">
                        {task.due_date?.slice(0, 10)}
                      </span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold shrink-0">
                    Overdue
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-slate-700">All tasks are currently on schedule!</p>
                <p className="text-[11px] text-slate-400 mt-1">No overdue tasks found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDashboardPage;
