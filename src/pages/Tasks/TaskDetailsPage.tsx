import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  User as UserIcon, 
  CheckSquare, 
  MessageSquare, 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  Edit3, 
  Trash2, 
  Share2, 
  Link as LinkIcon, 
  Plus, 
  Send, 
  Paperclip, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Layers,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useTask, SingleTaskDetails } from './TaskContext';

const STATUS_OPTIONS = [
  { id: 'pending', label: 'Pending', bg: 'bg-slate-100 text-slate-700' },
  { id: 'in_progress', label: 'In Progress', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'review', label: 'Under Review', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'completed', label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'on_hold', label: 'On Hold', bg: 'bg-amber-50 text-amber-700 border-amber-200' }
];

const PRIORITY_META: Record<string, { label: string; bg: string; text: string }> = {
  low: { label: 'Low', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
  medium: { label: 'Medium', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  high: { label: 'High', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
  critical: { label: 'Critical', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700' }
};

const formatSeconds = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const TaskDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    fetchTaskById, 
    updateTaskStatus, 
    addChecklistItem, 
    toggleChecklistItem, 
    deleteChecklistItem, 
    postComment,
    startTimer,
    pauseTimer,
    saveTimerToDatabase,
    activeTimerTaskId,
    timerSeconds,
    isTimerRunning,
    setShowDeleteConfirm,
    showToast
  } = useTask();

  const [task, setTask] = useState<SingleTaskDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // New checklist item
  const [newChecklistText, setNewChecklistText] = useState('');
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);

  // New comment
  const [commentText, setCommentText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [showAttachmentField, setShowAttachmentField] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);

  const taskIdNum = id ? parseInt(id, 10) : 0;

  const loadData = useCallback(async () => {
    if (!taskIdNum) return;
    setLoading(true);
    const data = await fetchTaskById(taskIdNum);
    setTask(data);
    setLoading(false);
  }, [taskIdNum, fetchTaskById]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle adding checklist item
  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim() || !task) return;
    setIsAddingChecklist(true);
    const item = await addChecklistItem(task.id, newChecklistText.trim());
    if (item) {
      setTask(prev => prev ? {
        ...prev,
        checklist: [...(prev.checklist || []), item]
      } : null);
      setNewChecklistText('');
    }
    setIsAddingChecklist(false);
  };

  // Handle toggle checklist item
  const handleToggleChecklist = async (itemId: number, currentCompleted: boolean) => {
    if (!task) return;
    const newStatus = !currentCompleted;
    setTask(prev => prev ? {
      ...prev,
      checklist: (prev.checklist || []).map(i => i.id === itemId ? { ...i, is_completed: newStatus } : i)
    } : null);
    await toggleChecklistItem(itemId, newStatus);
  };

  // Handle delete checklist item
  const handleDeleteChecklist = async (itemId: number) => {
    if (!task) return;
    setTask(prev => prev ? {
      ...prev,
      checklist: (prev.checklist || []).filter(i => i.id !== itemId)
    } : null);
    await deleteChecklistItem(itemId);
  };

  // Handle post comment
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !task) return;
    setIsPostingComment(true);
    const comment = await postComment(task.id, commentText, attachmentUrl);
    if (comment) {
      setTask(prev => prev ? {
        ...prev,
        comments: [...(prev.comments || []), comment]
      } : null);
      setCommentText('');
      setAttachmentUrl('');
      setShowAttachmentField(false);
    }
    setIsPostingComment(false);
  };

  // Handle status quick change
  const handleStatusChange = async (newStatus: any) => {
    if (!task) return;
    setTask(prev => prev ? { ...prev, status: newStatus } : null);
    await updateTaskStatus(task.id, newStatus);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading task details and activity log from database...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-200 text-center max-w-md mx-auto my-8">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h3 className="text-lg font-bold text-slate-900 mb-1">Task Not Found</h3>
        <p className="text-xs text-slate-500 mb-6">
          Could not find task #{id}. It may have been deleted or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/tasks/board')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
        >
          Back to Task Board
        </button>
      </div>
    );
  }

  const priorityMeta = PRIORITY_META[task.priority] || PRIORITY_META.medium;
  const isOverdue = task.due_date && task.status !== 'completed' && new Date(task.due_date) < new Date();
  const checklistTotal = task.checklist?.length || 0;
  const checklistDone = task.checklist?.filter(c => c.is_completed)?.length || 0;
  const checklistPercent = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;
  const isThisTaskTimerRunning = activeTimerTaskId === task.id && isTimerRunning;
  const loggedTimeDisplay = formatSeconds(task.time_spent_seconds || 0);

  return (
    <div className="space-y-6">
      {/* BREADCRUMBS & TOP COMMAND BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link to="/tasks/board" className="hover:text-indigo-600 transition-colors">
            Task Management
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800">Task Details #{task.id}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/tasks/${task.id}/edit`)}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Task</span>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(task.id)}
            className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-xs"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TASK HEADER CARD */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              Task #{task.id}
            </span>

            {/* Priority Badge */}
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${priorityMeta.bg} ${priorityMeta.text}`}>
              Priority: {priorityMeta.label}
            </span>

            {/* Overdue tag */}
            {isOverdue && (
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Overdue
              </span>
            )}
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
          {task.title}
        </h1>

        {/* Description */}
        <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          {task.description || 'No detailed description recorded for this task.'}
        </div>
      </div>

      {/* TWO-COLUMN DETAILS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: CHECKLIST, STOPWATCH & COMMENTS (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. CHECKLIST & SUBTASKS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Checklist & Subtasks</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {checklistDone} of {checklistTotal} ({checklistPercent}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${checklistPercent}%` }}
              />
            </div>

            {/* Checklist items list */}
            <div className="space-y-2 pt-2">
              {(!task.checklist || task.checklist.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-4">No checklist items recorded yet</p>
              ) : (
                task.checklist.map(item => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      item.is_completed 
                        ? 'bg-slate-50 border-slate-200/60 opacity-80' 
                        : 'bg-white border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1 select-none">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => handleToggleChecklist(item.id, item.is_completed)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className={`text-xs font-semibold ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {item.title}
                      </span>
                    </label>

                    <button
                      onClick={() => handleDeleteChecklist(item.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Item Form */}
            <form onSubmit={handleAddChecklist} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Add a new checklist or subtask item and press Enter..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isAddingChecklist || !newChecklistText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                Add
              </button>
            </form>
          </div>

          {/* 2. TIME TRACKER & STOPWATCH */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Live Time Tracking</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Total Logged: <strong className="text-slate-900">{loggedTimeDisplay}</strong>
              </span>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                  {isThisTaskTimerRunning ? 'Active Stopwatch' : 'Elapsed Time'}
                </span>
                <span className="font-mono text-3xl font-black text-emerald-400 tracking-tight">
                  {activeTimerTaskId === task.id ? formatSeconds(timerSeconds) : loggedTimeDisplay}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isThisTaskTimerRunning ? (
                  <button
                    onClick={pauseTimer}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Timer</span>
                  </button>
                ) : (
                  <button
                    onClick={() => startTimer(task.id, task.title, task.time_spent_seconds || 0)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Timer</span>
                  </button>
                )}

                <button
                  onClick={() => saveTimerToDatabase(task.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Time to Database</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. COMMENTS & DISCUSSION FEED */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Discussion & Comments</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {task.comments?.length || 0} comments
              </span>
            </div>

            {/* Comments List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(!task.comments || task.comments.length === 0) ? (
                <p className="text-xs text-slate-400 text-center py-6">No comments yet. Be the first to share an update!</p>
              ) : (
                task.comments.map(c => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                          {c.user_name ? c.user_name.charAt(0) : 'U'}
                        </div>
                        <span className="font-bold text-slate-900">{c.user_name || 'Team Member'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.created_at ? new Date(c.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pr-8">
                      {c.comment}
                    </p>

                    {c.attachment_url && (
                      <div className="pr-8 pt-1">
                        <a 
                          href={c.attachment_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/80 px-2.5 py-1 rounded-lg"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Open Attachment</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="space-y-2 pt-2 border-t border-slate-100">
              <div className="relative">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment or progress update..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {showAttachmentField && (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="Attachment or document URL..."
                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAttachmentField(!showAttachmentField)}
                  className="text-xs text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{showAttachmentField ? 'Hide attachment field' : 'Attach URL'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isPostingComment || !commentText.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Comment</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: METADATA & RELATIONS (1 COL) */}
        <div className="space-y-6">
          {/* ASSIGNEE CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Assigned Team Member</h4>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-lg shrink-0">
                {task.assigned_to_name ? task.assigned_to_name.charAt(0) : '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {task.assigned_to_name || 'Unassigned'}
                </p>
                <p className="text-xs text-slate-400 font-mono truncate">
                  {task.assigned_to_email || 'No email registered'}
                </p>
              </div>
            </div>
          </div>

          {/* DATES & DEADLINE CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5 text-xs">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Dates & Deadlines</h4>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Created Date:</span>
              <span className="font-mono font-bold text-slate-800">
                {task.created_at ? task.created_at.slice(0, 10) : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Last Updated:</span>
              <span className="font-mono font-bold text-slate-800">
                {task.updated_at ? task.updated_at.slice(0, 10) : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-slate-500">Due Date (Deadline):</span>
              <span className={`font-mono font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-900'}`}>
                {task.due_date ? task.due_date.slice(0, 10) : 'Not specified'}
              </span>
            </div>
          </div>

          {/* LINKED CRM DEAL */}
          {task.deal && (
            <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Building2 className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Linked CRM Deal</h4>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900">{task.deal.title}</p>
                {task.deal.value && (
                  <p className="font-mono text-emerald-600 font-bold">
                    Deal Value: ${Number(task.deal.value).toLocaleString()}
                  </p>
                )}
                {task.deal.customer_name && (
                  <p className="text-slate-500">Customer: {task.deal.customer_name}</p>
                )}
              </div>
              <button
                onClick={() => navigate('/sales/crm')}
                className="w-full mt-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                View CRM Deals
              </button>
            </div>
          )}

          {/* LINKED SOP STEP */}
          {task.sop_step_id && (
            <div className="bg-white p-6 rounded-3xl border border-purple-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-purple-700">
                <Layers className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Linked SOP Procedure</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {task.step_description || `Operational step #${task.sop_step_id}`}
              </p>
              <button
                onClick={() => navigate('/sops/library')}
                className="w-full mt-2 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                SOP Procedures Library
              </button>
            </div>
          )}

          {/* DEPENDENCY ON ANOTHER TASK */}
          {task.depends_on_task_id && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2 text-xs">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Prerequisite Task</h4>
              <p className="font-bold text-slate-800">
                #{task.depends_on_task_id} {task.depends_on_task_title || 'Prerequisite task'}
              </p>
              {task.depends_on_task_status && (
                <p className="text-slate-500 font-mono text-[11px]">
                  Prerequisite status: <span className="font-bold text-indigo-600">{task.depends_on_task_status}</span>
                </p>
              )}
              <button
                onClick={() => navigate(`/tasks/${task.depends_on_task_id}`)}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 pt-1 cursor-pointer"
              >
                <span>Go to prerequisite task</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsPage;
