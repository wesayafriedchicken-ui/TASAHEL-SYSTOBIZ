import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  ArrowRight,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Task } from '../../types';
import { useTask } from './TaskContext';

type TimeRange = 'week' | 'two_weeks' | 'month';

const STATUS_COLORS: Record<string, string> = {
  pending: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#8b5cf6',
  completed: '#10b981',
  on_hold: '#f59e0b'
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  review: 'Under Review',
  completed: 'Completed',
  on_hold: 'On Hold'
};

export const TaskTimelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, isLoading } = useTask();

  const [timeRange, setTimeRange] = useState<TimeRange>('two_weeks');
  const [statusFilter, setStatusFilter] = useState('all');

  // Days range calculation
  const { days, startDate, endDate } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const totalDays = timeRange === 'week' ? 7 : timeRange === 'two_weeks' ? 14 : 30;
    const daysArr: { date: Date; dateStr: string; dayName: string; isToday: boolean }[] = [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      daysArr.push({
        date: d,
        dateStr: d.toISOString().slice(0, 10),
        dayName: dayNames[d.getDay()],
        isToday: i === 0
      });
    }

    const end = new Date(start);
    end.setDate(start.getDate() + totalDays);

    return { days: daysArr, startDate: start, endDate: end };
  }, [timeRange]);

  // Tasks with dates
  const timelineTasks = useMemo(() => {
    return tasks
      .filter(t => {
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        return !!t.due_date;
      })
      .map(t => {
        const dueDate = new Date(t.due_date!);
        const createdDate = t.created_at ? new Date(t.created_at) : new Date(dueDate.getTime() - 86400000 * 2);
        
        // Calculate offset percentage and width percentage
        const totalDuration = endDate.getTime() - startDate.getTime();
        const clampedStart = Math.max(createdDate.getTime(), startDate.getTime());
        const clampedEnd = Math.min(dueDate.getTime(), endDate.getTime());

        const leftPercent = Math.max(0, Math.min(100, ((clampedStart - startDate.getTime()) / totalDuration) * 100));
        const rightPercent = Math.max(0, Math.min(100, ((clampedEnd - startDate.getTime()) / totalDuration) * 100));
        const widthPercent = Math.max(4, rightPercent - leftPercent);

        const isOverdue = dueDate < new Date() && t.status !== 'completed';

        return {
          ...t,
          dueDate,
          createdDate,
          leftPercent,
          widthPercent,
          isOverdue
        };
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [tasks, statusFilter, startDate, endDate]);

  return (
    <div className="space-y-4">
      {/* TIMELINE CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Gantt Timeline Schedule</h3>
            <p className="text-xs text-slate-500">Track task deadlines, milestones, and project chronology</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Under Review</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === 'week' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week (7 days)
            </button>
            <button
              onClick={() => setTimeRange('two_weeks')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === 'two_weeks' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2 Weeks (14 days)
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === 'month' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month (30 days)
            </button>
          </div>
        </div>
      </div>

      {/* GANTT VIEW CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Days Header */}
        <div className="border-b border-slate-200 overflow-x-auto">
          <div className="flex min-w-[800px]">
            {/* Task column spacer */}
            <div className="w-64 p-3 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-500 shrink-0">
              Task & Assignee
            </div>

            {/* Days columns */}
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
              {days.map((day, idx) => (
                <div 
                  key={idx}
                  className={`p-2 text-center border-r border-slate-100 text-xs ${
                    day.isToday ? 'bg-indigo-50/70 border-indigo-200' : 'bg-slate-50/40'
                  }`}
                >
                  <span className="block text-[10px] text-slate-400 font-medium">{day.dayName}</span>
                  <span className={`block font-mono text-[11px] font-bold ${day.isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                    {day.date.getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Task Rows */}
        <div className="divide-y divide-slate-100 overflow-x-auto">
          {timelineTasks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600">No tasks scheduled with due dates in this time range</p>
              <p className="text-[11px] text-slate-400 mt-1">Ensure tasks have a valid Due Date assigned</p>
            </div>
          ) : (
            timelineTasks.map(task => {
              const barColor = STATUS_COLORS[task.status] || '#6366f1';
              const statusName = STATUS_LABELS[task.status] || task.status;

              return (
                <div key={task.id} className="flex min-w-[800px] hover:bg-slate-50/60 transition-colors group">
                  {/* Task Column */}
                  <div className="w-64 p-3 border-r border-slate-200 shrink-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <button
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="text-xs font-bold text-slate-900 hover:text-indigo-600 text-left truncate block w-full transition-colors cursor-pointer"
                        title={task.title}
                      >
                        #{task.id} {task.title}
                      </button>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <span className="truncate">{task.assigned_to_name || 'Unassigned'}</span>
                        <span>•</span>
                        <span className="font-mono">{task.due_date?.slice(5, 10)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600 rounded transition-all cursor-pointer shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Timeline Bar Track */}
                  <div className="flex-1 relative h-14 flex items-center px-2">
                    {/* Background grid lines */}
                    <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
                      {days.map((day, idx) => (
                        <div key={idx} className={`border-r border-slate-100/60 h-full ${day.isToday ? 'bg-indigo-50/20' : ''}`} />
                      ))}
                    </div>

                    {/* Timeline Bar */}
                    <div
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="absolute h-7 rounded-lg shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between px-2 text-[10px] font-bold text-white overflow-hidden group/bar"
                      style={{
                        left: `${task.leftPercent}%`,
                        width: `${Math.max(task.widthPercent, 5)}%`,
                        backgroundColor: barColor
                      }}
                      title={`${task.title} (${statusName}) - Due: ${task.due_date?.slice(0, 10)}`}
                    >
                      <span className="truncate pr-1 drop-shadow-xs">{task.title}</span>
                      <span className="text-[9px] opacity-90 font-mono shrink-0 pl-1">
                        {statusName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskTimelinePage;
