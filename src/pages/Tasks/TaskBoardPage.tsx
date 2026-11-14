import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  Calendar, 
  User, 
  CheckSquare, 
  MoreVertical, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle, 
  Play, 
  Pause, 
  Link as LinkIcon,
  Tag,
  ArrowRight,
  ArrowLeft,
  X
} from 'lucide-react';
import { Task } from '../../types';
import { useTask } from './TaskContext';

interface ColumnDef {
  id: Task['status'];
  title: string;
  badgeBg: string;
  badgeText: string;
  borderTop: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'pending', title: 'Pending', badgeBg: 'bg-slate-100', badgeText: 'text-slate-700', borderTop: 'border-t-slate-400' },
  { id: 'in_progress', title: 'In Progress', badgeBg: 'bg-blue-100', badgeText: 'text-blue-700', borderTop: 'border-t-blue-500' },
  { id: 'review', title: 'Under Review', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', borderTop: 'border-t-purple-500' },
  { id: 'completed', title: 'Completed', badgeBg: 'bg-emerald-100', badgeText: 'text-emerald-700', borderTop: 'border-t-emerald-500' },
  { id: 'on_hold', title: 'On Hold', badgeBg: 'bg-amber-100', badgeText: 'text-amber-700', borderTop: 'border-t-amber-500' }
];

const PRIORITY_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Low' },
  medium: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Medium' },
  high: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', label: 'High' },
  critical: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: 'Critical' }
};

const formatSecondsToShort = (seconds?: number) => {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
};

export const TaskBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    tasks, 
    users, 
    updateTaskStatus, 
    setShowDeleteConfirm, 
    startTimer,
    activeTimerTaskId,
    isTimerRunning
  } = useTask();

  // Local filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      if (userFilter !== 'all' && task.assigned_to?.toString() !== userFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = task.title?.toLowerCase().includes(q);
        const matchDesc = task.description?.toLowerCase().includes(q);
        const matchUser = task.assigned_to_name?.toLowerCase().includes(q);
        const matchId = task.id.toString() === q;
        if (!matchTitle && !matchDesc && !matchUser && !matchId) return false;
      }
      return true;
    });
  }, [tasks, priorityFilter, userFilter, searchTerm]);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      pending: [],
      in_progress: [],
      review: [],
      completed: [],
      on_hold: []
    };
    filteredTasks.forEach(task => {
      const statusKey = task.status || 'pending';
      if (!grouped[statusKey]) grouped[statusKey] = [];
      grouped[statusKey].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  // Status transitions
  const getNextStatus = (current: Task['status']): Task['status'] | null => {
    if (current === 'pending') return 'in_progress';
    if (current === 'in_progress') return 'review';
    if (current === 'review') return 'completed';
    return null;
  };

  const getPrevStatus = (current: Task['status']): Task['status'] | null => {
    if (current === 'completed') return 'review';
    if (current === 'review') return 'in_progress';
    if (current === 'in_progress') return 'pending';
    return null;
  };

  return (
    <div className="space-y-5">
      {/* FILTER & CONTROL BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search board tasks by title, assignee, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Priority */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-500 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-500 font-medium">Assignee:</span>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[140px]"
            >
              <option value="all">All Members</option>
              {users.map(u => (
                <option key={u.id} value={u.id.toString()}>{u.name}</option>
              ))}
            </select>
          </div>

          {(priorityFilter !== 'all' || userFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setPriorityFilter('all');
                setUserFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4.5 overflow-x-auto pb-4 items-start">
        {COLUMNS.map(col => {
          const colTasks = tasksByStatus[col.id] || [];

          return (
            <div 
              key={col.id} 
              className={`bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 border-t-4 ${col.borderTop} flex flex-col min-h-[500px] shadow-xs`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-900 tracking-tight">{col.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${col.badgeBg} ${col.badgeText}`}>
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => navigate('/tasks/new')}
                  className="p-1 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                  title="Add task to this stage"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task Cards List */}
              <div className="space-y-3 flex-1">
                {colTasks.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-center p-3 text-slate-400 text-xs">
                    No tasks currently
                  </div>
                ) : (
                  colTasks.map(task => {
                    const priorityMeta = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;
                    const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();
                    const checklistCount = task.checklist?.length || 0;
                    const checklistCompleted = task.checklist?.filter(c => c.is_completed)?.length || 0;
                    const timeSpentShort = formatSecondsToShort(task.time_spent_seconds);
                    const nextStatus = getNextStatus(task.status);
                    const prevStatus = getPrevStatus(task.status);
                    const isCurrentTracking = activeTimerTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className="bg-white rounded-xl p-3.5 border border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all group relative flex flex-col justify-between"
                      >
                        <div>
                          {/* Card Top: ID & Priority */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              #{task.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityMeta.bg} ${priorityMeta.text}`}>
                              {priorityMeta.label}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-indigo-600 cursor-pointer transition-colors"
                          >
                            {task.title}
                          </h4>

                          {/* Description snippet */}
                          {task.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {task.description}
                            </p>
                          )}

                          {/* Badges: CRM / SOP */}
                          {(task.deal_id || task.sop_step_id) && (
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {task.deal_id && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                                  <LinkIcon className="w-2.5 h-2.5" />
                                  <span>Deal #{task.deal_id}</span>
                                </span>
                              )}
                              {task.sop_step_id && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200/50">
                                  <Tag className="w-2.5 h-2.5" />
                                  <span>SOP Step</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* Checklist mini indicator */}
                          {checklistCount > 0 && (
                            <div className="mt-2.5 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                              <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{checklistCompleted} of {checklistCount} items</span>
                              <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-500 h-full rounded-full" 
                                  style={{ width: `${Math.round((checklistCompleted / checklistCount) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Bottom: Assignee, Due Date, and Actions */}
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            {/* Assignee */}
                            <div className="flex items-center gap-1.5 text-slate-700 truncate max-w-[130px]">
                              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[9px] shrink-0">
                                {task.assigned_to_name ? task.assigned_to_name.charAt(0) : '?'}
                              </div>
                              <span className="truncate text-xs font-semibold">
                                {task.assigned_to_name || 'Unassigned'}
                              </span>
                            </div>

                            {/* Due Date */}
                            {task.due_date && (
                              <div className={`flex items-center gap-1 font-mono text-[10px] font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                                <Calendar className="w-3 h-3" />
                                <span>{task.due_date.slice(5, 10)}</span>
                              </div>
                            )}
                          </div>

                          {/* Quick Transition Arrows & Timer */}
                          <div className="flex items-center justify-between pt-1">
                            {/* Time spent / Stopwatch button */}
                            <button
                              onClick={() => startTimer(task.id, task.title, task.time_spent_seconds || 0)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                isCurrentTracking 
                                   ? 'bg-emerald-500 text-white animate-pulse' 
                                  : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200'
                              }`}
                              title={isCurrentTracking ? 'Timer is running' : 'Start stopwatch for this task'}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{timeSpentShort || '0m'}</span>
                            </button>

                            {/* Move buttons */}
                            <div className="flex items-center gap-1">
                              {prevStatus && (
                                <button
                                  onClick={() => updateTaskStatus(task.id, prevStatus)}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                                  title="Move to previous stage"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              >
                                Details
                              </button>

                              {nextStatus && (
                                <button
                                  onClick={() => updateTaskStatus(task.id, nextStatus)}
                                  className="p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors cursor-pointer"
                                  title="Advance to next stage"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoardPage;
