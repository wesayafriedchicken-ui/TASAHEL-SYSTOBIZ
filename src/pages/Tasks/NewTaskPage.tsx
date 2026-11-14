import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft,
  ArrowRight, 
  Save, 
  Calendar, 
  User, 
  CheckSquare, 
  Layers, 
  Link as LinkIcon, 
  X, 
  Trash2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { Task } from '../../types';
import { useTask } from './TaskContext';

export const NewTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const { createTask, isSaving, users, deals, tasks, showToast } = useTask();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [status, setStatus] = useState<Task['status']>('pending');
  const [assignedTo, setAssignedTo] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [dealId, setDealId] = useState<number | undefined>(undefined);
  const [sopStepId, setSopStepId] = useState<number | undefined>(undefined);
  const [dependsOnTaskId, setDependsOnTaskId] = useState<number | undefined>(undefined);
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>(undefined);

  // Initial Checklist items
  const [checklistInput, setChecklistInput] = useState('');
  const [checklistItems, setChecklistItems] = useState<string[]>([]);

  const handleAddChecklistItem = () => {
    if (!checklistInput.trim()) return;
    setChecklistItems(prev => [...prev, checklistInput.trim()]);
    setChecklistInput('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please enter a task title', 'error');
      return;
    }

    const payload: Partial<Task> & { initialChecklist?: string[] } = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      assigned_to: assignedTo,
      due_date: dueDate ? `${dueDate}T23:59:59.000Z` : undefined,
      deal_id: dealId,
      sop_step_id: sopStepId,
      depends_on_task_id: dependsOnTaskId,
      initialChecklist: checklistItems
    };

    const created = await createTask(payload);
    if (created) {
      navigate(`/tasks/${created.id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER & BACK BUTTON */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/tasks/board')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Task Board</span>
        </button>

        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full font-bold">
          Create New Task
        </span>
      </div>

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          {/* Top Banner */}
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Create New Task</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter task specifications, assignee, deadlines, and checklist items to persist to database
              </p>
            </div>
          </div>

          {/* SECTION 1: BASIC DETAILS */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Basic Information</h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Prepare Q2 financial audit report and reconciliation"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Detailed Description & Notes
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter detailed requirements, objectives, or actionable guidance for team members..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
              />
            </div>

            {/* Priority & Status */}
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

          {/* SECTION 2: ASSIGNMENT & TIMING */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Assignment & Deadlines</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assignee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Assigned To</label>
                <select
                  value={assignedTo || ''}
                  onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">Unassigned (Select team member)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({(u as any).role || 'Member'})</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
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

          {/* SECTION 3: CONTEXT & RELATIONS */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">CRM & Workflow Relationships</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Linked Deal */}
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

              {/* Depends On Task */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Depends On Task (Prerequisite)</label>
                <select
                  value={dependsOnTaskId || ''}
                  onChange={(e) => setDependsOnTaskId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">No prerequisite task</option>
                  {tasks.slice(0, 50).map(t => (
                    <option key={t.id} value={t.id}>#{t.id} - {t.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: INITIAL CHECKLIST */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Checklist & Action Items</h3>

            <div className="flex gap-2">
              <input
                type="text"
                value={checklistInput}
                onChange={(e) => setChecklistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Add an actionable checklist item and press Enter..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Checklist items list */}
            {checklistItems.length > 0 && (
              <div className="space-y-2 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                {checklistItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200/60 text-xs">
                    <span className="font-semibold text-slate-800">{idx + 1}. {item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklistItem(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/tasks/board')}
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
                <span>Saving to database...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Task to Database</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewTaskPage;
