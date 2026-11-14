import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Briefcase, PlusCircle, Check, Loader2, Settings } from 'lucide-react';
import { EmployeeProfileOutletContext } from './types';

interface OnboardingTaskItem {
  id: string | number;
  category: string;
  title: string;
  assignee: string;
  date?: string;
  completed: boolean;
  completedBy?: string;
  completedDate?: string;
}

export const OnboardingTab: React.FC = () => {
  const { 
    employee, 
    isViewOnly, 
    onSaveEmployeeDetails, 
    showCustomToast 
  } = useOutletContext<EmployeeProfileOutletContext>();

  const [loading, setLoading] = useState<boolean>(false);
  const [onboardingTasks, setOnboardingTasks] = useState<OnboardingTaskItem[]>(() => {
    return Array.isArray(employee?.onboarding_tasks) ? employee.onboarding_tasks : [];
  });

  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [newTaskForm, setNewTaskForm] = useState({
    category: 'HR Tasks',
    title: '',
    assignee: employee?.name || 'HR Admin',
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  });

  // On-demand fetch
  useEffect(() => {
    if (!employee?.id) return;
    if (onboardingTasks.length > 0) return;

    let isMounted = true;
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hr/employees/${employee.id}/details`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.onboarding_tasks)) {
            setOnboardingTasks(data.onboarding_tasks);
          }
        }
      } catch (err) {
        console.warn('Error fetching onboarding tasks:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTasks();
    return () => { isMounted = false; };
  }, [employee?.id]);

  const handleSaveNewTask = async () => {
    if (!newTaskForm.title.trim() || !newTaskForm.assignee.trim()) {
      showCustomToast('Please provide task title and assignee', 'error');
      return;
    }

    const newTask: OnboardingTaskItem = {
      id: 'on-' + Date.now(),
      completed: false,
      ...newTaskForm
    };

    const updated = [newTask, ...onboardingTasks];
    setOnboardingTasks(updated);
    setIsAddingTask(false);
    setNewTaskForm({
      category: 'HR Tasks',
      title: '',
      assignee: employee?.name || 'HR Admin',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    try {
      await onSaveEmployeeDetails({ onboarding_tasks: updated });
      showCustomToast('Onboarding task added', 'success');
    } catch {
      showCustomToast('Failed to add task', 'error');
    }
  };

  const handleToggleTask = async (taskId: string | number, currentCompleted: boolean) => {
    const updated = onboardingTasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          completed: !currentCompleted,
          completedBy: !currentCompleted ? (employee?.name || 'Current User') : undefined,
          completedDate: !currentCompleted ? 'Today' : undefined
        };
      }
      return t;
    });

    setOnboardingTasks(updated);
    try {
      await onSaveEmployeeDetails({ onboarding_tasks: updated });
      showCustomToast(currentCompleted ? 'Task marked pending' : 'Task marked complete!', 'success');
    } catch {
      showCustomToast('Failed to update task state', 'error');
    }
  };

  const pendingTasks = onboardingTasks.filter(t => !t.completed);
  const completedTasks = onboardingTasks.filter(t => t.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="text-[#1b5e20] font-black font-serif text-lg flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#1b5e20]" /> Onboarding
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-slate-800 text-sm font-black font-serif">Onboarding Tasks Checklist</h3>
          <div className="flex items-center gap-2">
            {!isViewOnly && (
              <button
                type="button"
                onClick={() => setIsAddingTask(!isAddingTask)}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-[#1b5e20] text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> {isAddingTask ? 'Cancel' : 'New Task'}
              </button>
            )}
          </div>
        </div>

        {isAddingTask && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs animate-in fade-in">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Task Category *</label>
              <select
                value={newTaskForm.category}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              >
                <option value="HR Tasks">HR Tasks</option>
                <option value="IT Setup">IT Setup</option>
                <option value="Manager Tasks">Manager Tasks</option>
                <option value="New Employee Paperwork">New Employee Paperwork</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Task Title *</label>
              <input
                type="text"
                placeholder="Task details..."
                value={newTaskForm.title}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assignee *</label>
              <input
                type="text"
                placeholder="Employee or Manager"
                value={newTaskForm.assignee}
                onChange={(e) => setNewTaskForm({ ...newTaskForm, assignee: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
              />
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
                <input
                  type="text"
                  placeholder="e.g. In 7 days"
                  value={newTaskForm.date}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, date: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveNewTask}
                className="p-3 bg-[#1b5e20] hover:bg-green-800 text-white rounded-xl font-bold shrink-0 cursor-pointer shadow-xs"
                title="Save Task"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#1b5e20]" />
            <span className="text-xs font-bold">Loading tasks...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending tasks */}
            <div>
              <h4 className="text-xs font-black text-[#1b5e20] mb-3 uppercase tracking-wider flex items-center justify-between">
                <span>Pending Tasks ({pendingTasks.length})</span>
              </h4>
              <div className="space-y-2.5 pl-1">
                {pendingTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">No pending onboarding tasks. All complete!</p>
                ) : (
                  pendingTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all border border-slate-100/60">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        disabled={isViewOnly}
                        onChange={() => handleToggleTask(task.id, task.completed)}
                        className="mt-0.5 rounded border-slate-300 text-[#1b5e20] focus:ring-[#1b5e20] w-4 h-4 cursor-pointer"
                      />
                      <div className="flex flex-col flex-1">
                        <span className="text-xs font-bold text-slate-800">{task.title}</span>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold mt-0.5">
                          <span className="text-[#1b5e20] bg-green-50 px-2 py-0.5 rounded-md">{task.category}</span>
                          <span>Assignee: {task.assignee}</span>
                          {task.date && <span>Due: {task.date}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <hr className="border-slate-150" />

            {/* Completed tasks */}
            <div>
              <h4 className="text-xs font-black text-slate-900 mb-4 uppercase tracking-wider">
                Completed Tasks ({completedTasks.length})
              </h4>
              {completedTasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No completed tasks yet.</p>
              ) : (
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="flex items-start gap-3 p-2 bg-slate-50/50 rounded-xl">
                      <div className="w-4 h-4 rounded-md bg-[#1b5e20] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 line-through decoration-slate-300">{task.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Completed by {task.completedBy || task.assignee} • {task.completedDate || 'Recently'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingTab;
