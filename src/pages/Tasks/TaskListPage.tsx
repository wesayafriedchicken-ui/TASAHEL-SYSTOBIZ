import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Clock, 
  Calendar, 
  User, 
  CheckSquare, 
  ChevronRight, 
  ChevronLeft, 
  ChevronsRight, 
  ChevronsLeft, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Play,
  RotateCcw,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Task } from '../../types';
import { useTask } from './TaskContext';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pending', bg: 'bg-slate-100', text: 'text-slate-700' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700' },
  review: { label: 'Under Review', bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700' },
  completed: { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700' },
  on_hold: { label: 'On Hold', bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700' }
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  low: { label: 'Low', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  medium: { label: 'Medium', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  high: { label: 'High', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  critical: { label: 'Critical', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' }
};

const formatSecondsToShort = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
};

export const TaskListPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    tasks, 
    users, 
    updateTaskStatus, 
    setShowDeleteConfirm, 
    startTimer,
    activeTimerTaskId,
    updateTask,
    deleteTask,
    showToast
  } = useTask();

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  // Sorting
  const [sortBy, setSortBy] = useState<'id' | 'title' | 'due_date' | 'priority' | 'status'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state (Per Page & Current Page)
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Multi-select for bulk actions
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
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
  }, [tasks, statusFilter, priorityFilter, userFilter, searchTerm]);

  // Sorted tasks
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'due_date') {
        valA = a.due_date ? new Date(a.due_date).getTime() : 0;
        valB = b.due_date ? new Date(b.due_date).getTime() : 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortBy, sortOrder]);

  // Pagination calculations
  const totalTasks = sortedTasks.length;
  const totalPages = Math.ceil(totalTasks / perPage) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIndex = (validCurrentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, totalTasks);
  const paginatedTasks = sortedTasks.slice(startIndex, endIndex);

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTaskIds(paginatedTasks.map(t => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkMarkCompleted = async () => {
    if (selectedTaskIds.length === 0) return;
    for (const id of selectedTaskIds) {
      await updateTaskStatus(id, 'completed');
    }
    setSelectedTaskIds([]);
    showToast(`Successfully marked ${selectedTaskIds.length} tasks as completed`, 'success');
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedTaskIds.length} selected tasks?`)) {
      for (const id of selectedTaskIds) {
        await deleteTask(id);
      }
      setSelectedTaskIds([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* FILTER & PER PAGE CONTROLS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search tasks by title, description, assignee, or ID..."
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

          {/* Controls: Per Page Selector */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-600 font-medium whitespace-nowrap">Items per page:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-bold text-indigo-700 focus:outline-none cursor-pointer"
              >
                <option value={5}>5 items</option>
                <option value={10}>10 items</option>
                <option value={20}>20 items</option>
                <option value={50}>50 items</option>
                <option value={100}>100 items</option>
              </select>
            </div>

            <button
              onClick={() => navigate('/tasks/new')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
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

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <span className="text-slate-500">Assignee:</span>
            <select
              value={userFilter}
              onChange={(e) => {
                setUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Members</option>
              {users.map(u => (
                <option key={u.id} value={u.id.toString()}>{u.name}</option>
              ))}
            </select>
          </div>

          {(statusFilter !== 'all' || priorityFilter !== 'all' || userFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setUserFilter('all');
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="text-rose-600 hover:text-rose-700 font-bold px-2 py-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto font-mono text-slate-400 text-[11px]">
            Total: <strong className="text-slate-700">{totalTasks}</strong> tasks
          </div>
        </div>
      </div>

      {/* BULK ACTIONS BAR (When any items are checked) */}
      {selectedTaskIds.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 px-4 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span>Selected {selectedTaskIds.length} tasks</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkMarkCompleted}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark as Completed</span>
            </button>

            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={() => setSelectedTaskIds([])}
              className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DETAILED DATA TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={paginatedTasks.length > 0 && selectedTaskIds.length === paginatedTasks.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Task & Description</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Assignee</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5">Checklist</th>
                <th className="p-3.5">Time Spent</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-600">No tasks match your search or selected filters</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search criteria or create a new task</p>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map(task => {
                  const statusMeta = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                  const priorityMeta = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                  const isSelected = selectedTaskIds.includes(task.id);
                  const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();
                  const checklistCount = task.checklist?.length || 0;
                  const checklistCompleted = task.checklist?.filter(c => c.is_completed)?.length || 0;
                  const isCurrentTracking = activeTimerTaskId === task.id;

                  return (
                    <tr 
                      key={task.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(task.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* Title & Desc */}
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-start gap-2">
                          <span className="font-mono font-bold text-slate-400 text-[10px] mt-0.5">#{task.id}</span>
                          <div>
                            <button
                              onClick={() => navigate(`/tasks/${task.id}`)}
                              className="font-bold text-slate-900 hover:text-indigo-600 text-left line-clamp-1 transition-colors cursor-pointer"
                            >
                              {task.title}
                            </button>
                            {task.description && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{task.description}</p>
                            )}
                            {(task.deal_id || task.sop_step_id) && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {task.deal_id && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                                    Deal #{task.deal_id}
                                  </span>
                                )}
                                {task.sop_step_id && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded">
                                    SOP Step #{task.sop_step_id}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="p-3.5">
                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value as any)}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer transition-colors ${statusMeta.bg}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Under Review</option>
                          <option value="completed">Completed</option>
                          <option value="on_hold">On Hold</option>
                        </select>
                      </td>

                      {/* Priority */}
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${priorityMeta.bg} ${priorityMeta.text}`}>
                          {priorityMeta.label}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[9px] shrink-0">
                            {task.assigned_to_name ? task.assigned_to_name.charAt(0) : '?'}
                          </div>
                          <span className="font-medium text-slate-700 truncate max-w-[110px]">
                            {task.assigned_to_name || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="p-3.5 font-mono text-[11px]">
                        {task.due_date ? (
                          <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                            {task.due_date.slice(0, 10)}
                            {isOverdue && <span className="ml-1 text-[9px] bg-rose-100 text-rose-700 px-1 py-0.5 rounded">Overdue</span>}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Checklist */}
                      <td className="p-3.5">
                        {checklistCount > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold text-slate-700">
                              {checklistCompleted}/{checklistCount}
                            </span>
                            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full"
                                style={{ width: `${Math.round((checklistCompleted / checklistCount) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Time Spent */}
                      <td className="p-3.5 font-mono text-[11px] text-slate-600">
                        {formatSecondsToShort(task.time_spent_seconds)}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Timer button */}
                          <button
                            onClick={() => startTimer(task.id, task.title, task.time_spent_seconds || 0)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isCurrentTracking ? 'bg-emerald-500 text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-indigo-600'
                            }`}
                            title="Start Timer"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>

                          {/* View details */}
                          <button
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            className="p-1.5 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => navigate(`/tasks/${task.id}/edit`)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Task"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setShowDeleteConfirm(task.id)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {/* Summary */}
          <div className="text-slate-500">
            Showing <strong className="text-slate-800 font-mono">{totalTasks === 0 ? 0 : startIndex + 1}</strong> to{' '}
            <strong className="text-slate-800 font-mono">{endIndex}</strong> of{' '}
            <strong className="text-slate-800 font-mono">{totalTasks}</strong> tasks
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={validCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4 text-slate-600" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={validCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>

            {/* Page Indicator */}
            <div className="flex items-center gap-1 px-2 font-mono">
              <span className="font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                {validCurrentPage}
              </span>
              <span className="text-slate-400">of</span>
              <span className="font-bold text-slate-700 px-2 py-1">
                {totalPages}
              </span>
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={validCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={validCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskListPage;
