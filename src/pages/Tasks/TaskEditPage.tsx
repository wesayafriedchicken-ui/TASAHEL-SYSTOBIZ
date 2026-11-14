import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight, 
  Save, 
  Trash2, 
  Calendar, 
  User, 
  AlertCircle,
  Building2,
  Layers,
  Link as LinkIcon
} from 'lucide-react';
import { Task } from '../../types';
import { useTask, SingleTaskDetails } from './TaskContext';

export const TaskEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchTaskById, updateTask, isSaving, users, deals, tasks, showToast } = useTask();

  const taskId = id ? parseInt(id, 10) : 0;

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [status, setStatus] = useState<Task['status']>('pending');
  const [assignedTo, setAssignedTo] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [dealId, setDealId] = useState<number | undefined>(undefined);
  const [sopStepId, setSopStepId] = useState<number | undefined>(undefined);
  const [dependsOnTaskId, setDependsOnTaskId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!taskId) return;
    const fetchCurrent = async () => {
      setLoading(true);
      const data = await fetchTaskById(taskId);
      if (data) {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setPriority(data.priority || 'medium');
        setStatus(data.status || 'pending');
        setAssignedTo(data.assigned_to || undefined);
        setDueDate(data.due_date ? data.due_date.slice(0, 10) : '');
        setDealId(data.deal_id || undefined);
        setSopStepId(data.sop_step_id || undefined);
        setDependsOnTaskId(data.depends_on_task_id || undefined);
      }
      setLoading(false);
    };
    fetchCurrent();
  }, [taskId, fetchTaskById]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }

    const payload: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      assigned_to: assignedTo,
      due_date: dueDate ? `${dueDate}T23:59:59.000Z` : undefined,
      deal_id: dealId,
      sop_step_id: sopStepId,
      depends_on_task_id: dependsOnTaskId
    };

    const success = await updateTask(taskId, payload);
    if (success) {
      navigate(`/tasks/${taskId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-200 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading task details for editing...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/tasks/${taskId}`)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel and return to Task #{taskId}</span>
        </button>

        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-bold">
          Edit Task #{taskId}
        </span>
      </div>

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Save className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Edit Task #{taskId}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update title, description, schedule, or assignee in database
              </p>
            </div>
          </div>

          {/* BASIC INFO */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Detailed Description & Notes</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Stage / Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Under Review</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
            </div>
          </div>

          {/* ASSIGNMENT & TIMING */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Assignment & Deadlines</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned To</label>
                <select
                  value={assignedTo || ''}
                  onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">Unassigned (Select member)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({(u as any).role || 'Member'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Due Date (Deadline)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* CONTEXT & RELATIONS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">CRM & Workflow Relationships</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Linked CRM Deal</label>
                <select
                  value={dealId || ''}
                  onChange={(e) => setDealId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">No deal linked</option>
                  {deals.map((d: any) => (
                    <option key={d.id} value={d.id}>Deal #{d.id}: {d.title || d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Depends On Task (Prerequisite)</label>
                <select
                  value={dependsOnTaskId || ''}
                  onChange={(e) => setDependsOnTaskId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">No prerequisite task</option>
                  {tasks.filter(t => t.id !== taskId).slice(0, 50).map(t => (
                    <option key={t.id} value={t.id}>#{t.id} - {t.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(`/tasks/${taskId}`)}
            className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes to Database</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskEditPage;
