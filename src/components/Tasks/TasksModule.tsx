import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Filter, Calendar, User, 
  Clock, AlertCircle, CheckCircle2, MoreVertical,
  ChevronRight, Layout, List, Tag, Link as LinkIcon,
  MessageSquare, History, Edit3, Trash2, 
  AlertTriangle, ArrowUpRight, Loader2,
  CheckCircle, X, Info, Save, Play, Pause, 
  TrendingUp, Clock3, BarChart3, HelpCircle,
  Paperclip, Send, ArrowRightLeft, Milestone,
  CheckSquare, Activity, Eye, Briefcase,
  DollarSign, Mail, Phone, ShoppingCart
} from 'lucide-react';
import { Task, User as SystemUser, GlobalStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import DeleteConfirmation from '../Common/DeleteConfirmation';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

interface TasksModuleProps {
  globalStatuses: GlobalStatus[];
}

interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  attachment_url?: string;
  created_at: string;
}

const TasksModule: React.FC<TasksModuleProps> = ({ globalStatuses }) => {
  const { user, getDataScope, canCreate, canWrite, canDelete } = useAuth();
  const isTasksAdmin = user?.role === 'Admin' || user?.role_name === 'Admin' || (user as any)?.is_super_admin;
  const canCreateTask = isTasksAdmin || canCreate('Tasks & Projects', 'Tasks') || canCreate('Tasks & Projects') || canWrite('Tasks & Projects') || canCreate('Tasks');
  const canDeleteTask = isTasksAdmin || canDelete('Tasks & Projects', 'Tasks') || canDelete('Tasks & Projects') || canDelete('Tasks');
  const { selectedTaskId, setSelectedTaskId } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Navigation & Views
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks'>('dashboard');
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'gantt'>('kanban');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');

  // Comments for Active Task Detail Draw
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentAttachment, setCommentAttachment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Live Timer State (Time Tracker)
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeTaskTimerId = useRef<number | null>(null);

  // CRM Deals cache state & preview modal
  const [deals, setDeals] = useState<any[]>([]);
  const [previewDeal, setPreviewDeal] = useState<any | null>(null);

  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/crm/deals');
      if (res.ok) {
        const data = await res.json();
        setDeals(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching CRM deals:', err);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchDeals();
    }
  }, [isModalOpen]);

  useEffect(() => {
    fetchInitialData();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedTaskId && tasks.length > 0) {
      const taskToOpen = tasks.find(t => t.id === selectedTaskId);
      if (taskToOpen) {
        setEditingTask(taskToOpen);
        setIsModalOpen(true);
        fetchComments(selectedTaskId);
        setActiveTab('tasks');
        setSelectedTaskId(null);
      }
    }
  }, [selectedTaskId, tasks]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        fetch('/api/tasks').then(res => res.ok ? res.json() : []),
        fetch('/api/users').then(res => res.ok ? res.json() : [])
      ]);
      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setUsers(Array.isArray(usersRes) ? usersRes : []);
      fetchDeals();
    } catch (err) {
      console.error('Error fetching tasks data:', err);
      setTasks([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Comments loading when task is selected
  const fetchComments = async (taskId: number) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error("Failed to load task comments", e);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostComment = async () => {
    if (!editingTask?.id || !newCommentText.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${editingTask.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newCommentText.trim(),
          attachment_url: commentAttachment.trim() || undefined,
          user_name: user?.name || "Employee"
        })
      });
      if (res.ok) {
        setNewCommentText('');
        setCommentAttachment('');
        fetchComments(editingTask.id);
      }
    } catch (e) {
      console.error("Failed to post comment", e);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask?.title) return;
    
    setIsSaving(true);
    try {
      const method = editingTask.id ? 'PATCH' : 'POST';
      const url = editingTask.id ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      
      const payload = {
        ...editingTask,
        depends_on_task_id: editingTask.depends_on_task_id ? parseInt(editingTask.depends_on_task_id as any) : null,
        time_spent_seconds: editingTask.time_spent_seconds || 0
      };

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id.toString() || '1'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save task');
      
      await fetchInitialData();
      setIsModalOpen(false);
      setEditingTask(null);
      // Reset timer track
      setTimerActive(false);
      setTimerSeconds(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (err) {
      console.error('Error saving task:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!showDeleteConfirm) return;
    try {
      const res = await fetch(`/api/tasks/${showDeleteConfirm}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id.toString() || '1'
        }
      });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== showDeleteConfirm));
        setShowDeleteConfirm(null);
        if (editingTask?.id === showDeleteConfirm) {
          setIsModalOpen(false);
          setEditingTask(null);
        }
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id.toString() || '1'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleAddChecklistItem = async (taskId: number) => {
    if (!newChecklistItem.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newChecklistItem })
      });
      if (res.ok) {
        const newItem = await res.json();
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checklist: [...(t.checklist || []), newItem] } : t));
        if (editingTask?.id === taskId) {
          setEditingTask(prev => ({ ...prev!, checklist: [...(prev?.checklist || []), newItem] }));
        }
        setNewChecklistItem('');
      }
    } catch (err) {
      console.error('Error adding checklist item:', err);
    }
  };

  const toggleChecklistItem = async (itemId: number, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/tasks/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: isCompleted })
      });
      if (res.ok) {
        const updatedItem = await res.json();
        setTasks(prev => prev.map(t => ({
          ...t,
          checklist: t.checklist?.map(item => item.id === itemId ? updatedItem : item)
        })));
        if (editingTask?.checklist) {
          setEditingTask(prev => ({
            ...prev!,
            checklist: prev?.checklist?.map(item => item.id === itemId ? updatedItem : item)
          }));
        }
      }
    } catch (err) {
      console.error('Error toggling checklist item:', err);
    }
  };

  const deleteChecklistItem = async (itemId: number) => {
    try {
      const res = await fetch(`/api/tasks/checklist/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(prev => prev.map(t => ({
          ...t,
          checklist: t.checklist?.filter(item => item.id !== itemId)
        })));
        if (editingTask?.checklist) {
          setEditingTask(prev => ({
            ...prev!,
            checklist: prev?.checklist?.filter(item => item.id !== itemId)
          }));
        }
      }
    } catch (err) {
      console.error('Error deleting checklist item:', err);
    }
  };

  // Drag and Drop support for Kanban
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;
    const taskId = parseInt(taskIdStr);
    await updateTaskStatus(taskId, newStatus);
    await fetchInitialData();
  };

  // Live Timer Controls (Time Tracker)
  const toggleTimer = () => {
    if (timerActive) {
      // Pause/Save Work Time
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setTimerActive(false);
      
      // Save cumulative time
      const accumulated = (editingTask?.time_spent_seconds || 0) + timerSeconds;
      setEditingTask(prev => prev ? { ...prev, time_spent_seconds: accumulated } : null);
      setTimerSeconds(0);
      
      // Hit API to update time
      if (editingTask?.id) {
        fetch(`/api/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id.toString() || '1' },
          body: JSON.stringify({ time_spent_seconds: accumulated })
        }).then(() => fetchInitialData());
      }
    } else {
      // Start/Resume Time Tracking
      setTimerActive(true);
      activeTaskTimerId.current = editingTask?.id || null;
      setTimerSeconds(0);
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
  };

  const formatTimeSpent = (totalSeconds: number) => {
    if (!totalSeconds) return "0 minutes";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    let parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' and ');
  };

  // Determine tasks filtered by role-based data scope
  const getTasksDataScope = () => {
    if (activeTab === 'dashboard') {
      return getDataScope('Tasks', 'Task Board');
    }
    if (viewMode === 'kanban') {
      return getDataScope('Tasks', 'Kanban');
    }
    if (viewMode === 'list') {
      return getDataScope('Tasks', 'Task Board');
    }
    if (viewMode === 'gantt') {
      return getDataScope('Tasks', 'Timeline');
    }
    return getDataScope('Tasks', 'Task Board');
  };

  const tasksScope = getTasksDataScope();

  const scopedTasks = tasks.filter(task => {
    if (tasksScope === 'global') return true;
    if (tasksScope === 'own') {
      return task.assigned_to === user?.id;
    }
    if (tasksScope === 'branch') {
      if (!task.assigned_to) return true; // Show unassigned tasks or check department
      const assignedUser = users.find(u => u.id === task.assigned_to);
      return assignedUser?.department_id === user?.department_id;
    }
    return true;
  });

  // Filters logic applied to scopedTasks
  const filteredTasks = scopedTasks.filter(task => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch = (task.title || '').toLowerCase().includes(term) || 
                          (task.description || '').toLowerCase().includes(term);
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesUser = filterUser === 'all' || task.assigned_to?.toString() === filterUser;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesUser;
  });

  // KPI calculations using scopedTasks
  const totalTasksCount = scopedTasks.length;
  const completedTasks = scopedTasks.filter(t => t.status === 'completed');
  
  // Weekly Completed Tasks helper
  const now = new Date();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const completedThisWeek = completedTasks.filter(t => {
    return t.updated_at && new Date(t.updated_at) >= startOfWeek;
  }).length;

  // Monthly Completed
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const completedThisMonth = completedTasks.filter(t => {
    return t.updated_at && new Date(t.updated_at) >= startOfMonth;
  }).length;

  // Overdue count (due in past and status !== 'completed') using scopedTasks
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasksList = scopedTasks.filter(t => t.status !== 'completed' && t.due_date && t.due_date.split('T')[0] < todayStr);
  const overdueCount = overdueTasksList.length;

  // Team Velocity: Average time to complete tasks (Created_at -> Updated_at)
  let teamVelocityText = "N/A";
  if (completedTasks.length > 0) {
    let totalMs = 0;
    let counted = 0;
    completedTasks.forEach(t => {
      if (t.created_at) {
        const createdTime = new Date(t.created_at).getTime();
        const endTime = t.updated_at ? new Date(t.updated_at).getTime() : new Date().getTime();
        const diff = endTime - createdTime;
        if (diff > 0) {
          totalMs += diff;
          counted++;
        }
      }
    });
    if (counted > 0) {
      const avgMinutes = (totalMs / counted) / 60000;
      if (avgMinutes < 60) {
        teamVelocityText = `${Math.round(avgMinutes)} min`;
      } else if (avgMinutes < 1440) {
        teamVelocityText = `${(avgMinutes / 60).toFixed(1)} hrs`;
      } else {
        teamVelocityText = `${(avgMinutes / 1440).toFixed(1)} days`;
      }
    }
  }

  // Task Status distribution data for recharts using scopedTasks
  const statusValues = [
    { name: 'Pending', count: scopedTasks.filter(t => t.status === 'pending').length, color: '#64748b', en: 'pending' },
    { name: 'In Progress', count: scopedTasks.filter(t => t.status === 'in_progress').length, color: '#3b82f6', en: 'in_progress' },
    { name: 'Under Review', count: scopedTasks.filter(t => t.status === 'review').length, color: '#f59e0b', en: 'review' },
    { name: 'Completed', count: scopedTasks.filter(t => t.status === 'completed').length, color: '#10b981', en: 'completed' }
  ];

  const kanbanColumns = [
    { id: 'pending', title: 'Pending', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50 text-blue-800 hover:bg-blue-100/70' },
    { id: 'review', title: 'Under Review', color: 'bg-amber-50 text-amber-800 hover:bg-amber-100/70' },
    { id: 'completed', title: 'Completed', color: 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70' }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'high': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'low': return 'bg-slate-100 text-slate-800 border border-slate-200';
      default: return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return priority;
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'review': return 'Under Review';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const openTaskDetail = async (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
    fetchComments(task.id);
    
    // Reset timer
    setTimerActive(false);
    setTimerSeconds(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Timeline Grid Days Generator for Gantt View
  const getGanttDays = () => {
    const days = [];
    const base = new Date();
    base.setDate(base.getDate() - 4); // Show 4 days in the past
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const ganttDays = getGanttDays();

  // Task Card Component for Kanban
  const TaskCard = ({ task }: { task: Task }) => {
    // Check if dependencies are met
    const dependentTask = task.depends_on_task_id ? tasks.find(t => t.id === task.depends_on_task_id) : null;
    const isDependencyMet = dependentTask ? dependentTask.status === 'completed' : true;

    const isOverdue = task.due_date && 
                      new Date(task.due_date).setHours(23,59,59,999) < Date.now() && 
                      task.status !== 'completed';

    return (
      <motion.div 
        layoutId={`task-${task.id}`}
        draggable
        onDragStart={(e) => handleDragStart(e as any, task.id)}
        className={`p-4 rounded-2xl border transition-all cursor-pointer group relative shadow-xs hover:shadow-md ${
          isOverdue 
            ? "bg-rose-50/90 border-rose-400 ring-2 ring-rose-500/20 hover:border-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.15)]" 
            : "bg-white border-slate-200/80 hover:border-slate-300"
        }`}
        onClick={() => openTaskDetail(task)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-1.5 items-center">
            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${getPriorityBadge(task.priority)}`}>
              {getPriorityLabel(task.priority)}
            </span>
            {isOverdue && (
              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black bg-rose-600 text-white animate-pulse flex items-center gap-1 shadow-sm">
                <AlertCircle className="w-2.5 h-2.5" />
                Overdue!
              </span>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button 
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(task.id); }}
              className="p-1 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        <h3 className="font-bold text-slate-900 text-sm mb-1 leading-relaxed line-clamp-2 text-left">{task.title}</h3>
        {task.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 text-left">{task.description}</p>
        )}

        {/* Dependency Notice, if exists */}
        {dependentTask && (
          <div className="flex items-center gap-1 mb-3 px-2 py-1 rounded-lg text-[10px] text-left justify-start bg-amber-50 text-amber-900 border border-amber-100">
            <AlertTriangle className={`w-3.5 h-3.5 ${isDependencyMet ? 'text-emerald-500' : 'text-amber-500 animate-pulse'}`} />
            <span className="font-semibold line-clamp-1">Depends on: {dependentTask.title}</span>
          </div>
        )}

        {task.checklist && task.checklist.length > 0 && (
          <div className="mb-3">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
              <span>Progress</span>
              <span>
                {task.checklist.filter(i => i.is_completed).length}/{task.checklist.length}
              </span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(task.checklist.filter(i => i.is_completed).length / task.checklist.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {task.assigned_to_name ? (
              <div className="w-6 h-6 rounded-full bg-indigo-500 hover:bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-inner" title={task.assigned_to_name}>
                {task.assigned_to_name.charAt(0)}
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 border border-slate-200">
                <User className="w-3 h-3" />
              </div>
            )}
            {task.module_id && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-100 text-[9px] font-medium uppercase" title={`Related to ${task.module_id}`}>
                <LinkIcon className="w-2.5 h-2.5" />
                {task.module_id}
              </div>
            )}
            {task.time_spent_seconds && task.time_spent_seconds > 0 ? (
              <div className="flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded border border-emerald-100">
                <Clock3 className="w-2.5 h-2.5" />
                <span>Tracked</span>
              </div>
            ) : null}
          </div>
          
          {task.due_date && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" />
              {new Date(task.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
      
      {/* Dynamic Upper Dashboard & Metric Segment Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="text-left md:order-1">
            <span className="text-xs font-bold text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full">Operations & Productivity</span>
            <h1 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">Smart Task Manager</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Track continuous task status flow, active team work thresholds, and automated schedules.</p>
          </div>
          
          {/* Main Top Actions & Navigation */}
          <div className="flex items-center justify-between md:justify-start gap-4 md:order-2">
            {(isTasksAdmin || canCreateTask) && (
              <button 
                onClick={() => { setEditingTask({ status: 'pending', priority: 'medium' }); setIsModalOpen(true); }}
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Task
              </button>
            )}

            <div className="flex bg-slate-150 p-1 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'tasks' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Task Board <CheckSquare className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Productivity Dashboard <BarChart3 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW PANEL 1: PRODUCTIVITY DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="flex-1 overflow-auto p-8 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* Big Digital KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* KPI 1: Completed Tasks count */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-20 h-20 bg-emerald-50 rounded-bl-full flex items-center justify-center -mr-2 -mt-2 opacity-65">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed Tasks</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{completedTasks.length}</h3>
                <div className="flex justify-start gap-2 items-center mt-3 text-xs text-slate-500">
                  <span className="font-bold text-emerald-600">+{completedThisWeek} This Week</span>
                  <span>|</span>
                  <span className="text-slate-450">+{completedThisMonth} This Month</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Overdue Tasks check */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-20 h-20 bg-rose-50 rounded-bl-full flex items-center justify-center -mr-2 -mt-2 opacity-65">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-bold">Overdue Tasks</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">
                  {overdueCount} {overdueCount > 0 && <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse ml-2" />}
                </h3>
                <p className="text-xs text-slate-400 mt-3 font-medium">Outstanding items lagging behind their explicit deadline trajectories.</p>
              </div>
            </div>

            {/* KPI 3: Task Velocity */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-20 h-20 bg-blue-50 rounded-bl-full flex items-center justify-center -mr-2 -mt-2 opacity-65">
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Task Velocity</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2">{teamVelocityText}</h3>
                <p className="text-xs text-slate-400 mt-3 font-medium">Average lead time required from standard registration to successful completion.</p>
              </div>
            </div>

          </div>

          {/* Status Distribution diagram & lists */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Recharts graph */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="text-left">
                <h4 className="font-bold text-slate-900 text-lg">Task Status Distribution</h4>
                <p className="text-slate-400 text-xs">Visual allocation of operational issues across our primary stages.</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statusValues}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} orientation="left" />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={50}>
                      {statusValues.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                {statusValues.map(v => (
                  <div key={v.name} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="block text-slate-400 text-[10px] mb-1 font-bold">{v.name}</span>
                    <span className="text-lg font-black text-slate-900">{v.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Urgent alerts / Actionable tasks */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between max-h-[460px]">
              <div className="text-left pb-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Overdue Tasks & Alerts</h4>
                  <p className="text-slate-400 text-[11px]">Pending items requiring prompt department checkouts.</p>
                </div>
                <AlertCircle className="w-5 h-5 text-rose-500" />
              </div>

              <div className="flex-1 overflow-auto py-4 space-y-3 custom-scrollbar">
                {overdueTasksList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="w-10 h-10 text-emerald-500" />
                    <p className="text-xs font-bold text-slate-700">No overdue tasks right now</p>
                    <p className="text-[10px] text-slate-400">All planned items are running on healthy timeline tracks.</p>
                  </div>
                ) : (
                  overdueTasksList.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => openTaskDetail(task)}
                      className="p-3 bg-rose-50/50 hover:bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between transition-all cursor-pointer"
                    >
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-900 block line-clamp-1">{task.title}</span>
                        <span className="text-[10px] text-rose-600 font-bold block mt-0.5 flex items-center justify-start gap-1">
                          <Clock className="w-3 h-3" /> Overdue by {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'hours'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.assigned_to_name && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">{task.assigned_to_name}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${getPriorityBadge(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button 
                onClick={() => { setActiveTab('tasks'); setFilterStatus('all'); }}
                className="w-full text-center text-xs font-bold bg-slate-50 text-slate-600 py-2.5 rounded-xl border border-slate-150 hover:bg-slate-100 transition"
              >
                Browse All Task Deliverables
              </button>
            </div>

          </div>

        </div>
      )}

      {/* VIEW PANEL 2: TASK VIEWS (KANBAN, LIST, GANTT) */}
      {activeTab === 'tasks' && (
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">

          {/* Filtering and View Selector Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 px-8 py-4 bg-white border-b border-slate-200">
            
            {/* Selector Toggle */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 self-start md:self-center order-2 md:order-1">
              <button 
                id="tab-task-views-kanban"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Kanban Board <Layout className="w-3.5 h-3.5" />
              </button>
              <button 
                id="tab-task-views-list"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Detailed List <List className="w-3.5 h-3.5" />
              </button>
              <button 
                id="tab-task-views-gantt"
                onClick={() => setViewMode('gantt')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'gantt' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Gantt Timeline <Milestone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Filters Options */}
            <div className="flex flex-wrap items-center gap-3 order-1 md:order-2 justify-end">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-250 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-left"
                />
              </div>

              <select 
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none text-left"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              <select 
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none text-left"
              >
                <option value="all">All Members</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-slate-400 font-medium">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-slate-900 font-bold">No matching tasks found</h3>
                <p className="text-slate-500 text-xs mt-1">Try creating a new task or altering your filters.</p>
              </div>
            ) : viewMode === 'kanban' ? (
              
              /* RENDER VIEW 1: KANBAN BOARD */
              <div className="flex gap-6 h-full min-w-max pb-4 justify-start">
                {kanbanColumns.map(column => {
                  const columnTasks = filteredTasks.filter(t => t.status === column.id);
                  return (
                    <div 
                      key={column.id} 
                      className="w-80 flex flex-col gap-4"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, column.id)}
                    >
                      <div className={`p-3 rounded-2xl ${column.color} flex items-center justify-between border border-slate-200/50 shadow-xs transition`}>
                        <h3 className="font-bold text-xs uppercase tracking-wider">{column.title}</h3>
                        <span className="bg-white/90 text-slate-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-xs">
                          {columnTasks.length}
                        </span>
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-3 min-h-[400px]">
                        {columnTasks.map(task => (
                          <TaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            ) : viewMode === 'list' ? (
              
              /* RENDER VIEW 2: SMART LIST TABLE VIEW */
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80">
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-left">Task Title</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-left">Status</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-left">Priority</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-left">Assignee</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-left">Module</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-left">Due Date</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest w-[110px] text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map(task => {
                      const dependentTask = task.depends_on_task_id ? tasks.find(t => t.id === task.depends_on_task_id) : null;
                      const isOverdue = task.due_date && 
                                        new Date(task.due_date).setHours(23,59,59,999) < Date.now() && 
                                        task.status !== 'completed';
                      return (
                        <tr 
                          key={task.id} 
                          className={`transition-colors cursor-pointer group ${
                            isOverdue 
                              ? 'bg-rose-50/70 hover:bg-rose-100/70 border-r-4 border-r-rose-500' 
                              : 'hover:bg-slate-50/50'
                          }`}
                          onClick={() => openTaskDetail(task)}
                        >
                          <td className="px-6 py-4 text-left">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all justify-start">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(task.id); }}
                                className="p-2 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600">
                            {task.module_id ? (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-lg font-bold border border-slate-150 uppercase text-[10px]">
                                {task.module_id}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-800">
                            {task.assigned_to_name || 'Unassigned'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getPriorityBadge(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <select 
                              value={task.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                              className="bg-slate-100 border-none rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="review">Under Review</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <div className="font-bold text-slate-900 text-sm">{task.title}</div>
                            {task.description && (
                              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{task.description}</div>
                            )}
                            {dependentTask && (
                              <div className="text-[9px] text-amber-600 bg-amber-50 rounded border border-amber-100 px-1.5 py-0.5 inline-block mt-1">
                                Depends on: {dependentTask.title}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            ) : (

              /* RENDER VIEW 3: GANTT CHART TIMELINE */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 text-left">
                  <h4 className="font-bold text-slate-900 text-base">Gantt Operational Chart</h4>
                  <p className="text-slate-400 text-xs">Unified view of scheduled durations, timeline overlaps, and task dependencies.</p>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[1000px] divide-y divide-slate-100">
                    
                    {/* Header: Timeline dates */}
                    <div className="flex bg-slate-50 py-3.5 px-6">
                      {/* Left space for titles */}
                      <div className="w-[280px] shrink-0 font-bold text-xs text-slate-400 text-left pl-4 uppercase tracking-widest">
                        Task Timeline Road
                      </div>
                      
                      {/* Timeline Day column grids */}
                      <div className="flex-1 grid grid-cols-14 text-center">
                        {ganttDays.map((day, dIdx) => (
                          <div key={dIdx} className="text-[10px] font-bold text-slate-400 flex flex-col items-center">
                            <span>{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                            <span className="text-slate-900 font-black mt-0.5">{day.getDate()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Body: Tasks durations rows */}
                    <div className="divide-y divide-slate-100">
                      {filteredTasks.map(task => {
                        // Estimate Gantt span
                        const dueTime = task.due_date ? new Date(task.due_date).getTime() : new Date().getTime();
                        const startTime = task.created_at ? new Date(task.created_at).getTime() : dueTime - (3 * 24 * 3600 * 1000);
                        
                        const hasDep = !!task.depends_on_task_id;
                        const depTask = hasDep ? tasks.find(t => t.id === task.depends_on_task_id) : null;
                        const isDepMet = depTask ? depTask.status === 'completed' : true;

                        return (
                          <div 
                            key={task.id} 
                            onClick={() => openTaskDetail(task)}
                            className="flex items-center py-4.5 px-6 hover:bg-slate-50/40 transition cursor-pointer"
                          >
                            {/* Left details */}
                            <div className="w-[280px] shrink-0 text-left pl-4 flex flex-col">
                              <span className="text-xs font-black text-slate-800 line-clamp-1">{task.title}</span>
                              <div className="flex items-center justify-start gap-1.5 mt-1">
                                {task.assigned_to_name && (
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-bold">{task.assigned_to_name}</span>
                                )}
                                {hasDep && (
                                  <span className={`text-[9.5px] px-1 rounded flex items-center gap-0.5 font-bold ${isDepMet ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700 animate-pulse'}`}>
                                    {isDepMet ? 'Met' : 'Locked'} Dep
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Gantt Bar mapping */}
                            <div className="flex-1 grid grid-cols-14 relative h-7 items-center">
                              {/* Background columns lines */}
                              <div className="absolute inset-0 grid grid-cols-14 pointer-events-none">
                                {Array.from({ length: 14 }).map((_, i) => (
                                  <div key={i} className="border-r border-slate-100 h-full last:border-0" />
                                ))}
                              </div>

                              {/* Gantt Interactive Duration Bar */}
                              {(() => {
                                // Determine start and end index mappings
                                let startCell = 0;
                                let endCell = 13;

                                const gridStartMs = ganttDays[0].getTime();
                                const gridEndMs = ganttDays[13].getTime() + (24 * 3600 * 1000);

                                if (startTime > gridStartMs) {
                                  const diff = startTime - gridStartMs;
                                  startCell = Math.floor(diff / (24 * 3600 * 1000));
                                }
                                if (dueTime < gridEndMs) {
                                  const diff = gridEndMs - dueTime;
                                  endCell = 13 - Math.floor(diff / (24 * 3600 * 1000));
                                }

                                // Clamp values
                                startCell = Math.max(0, Math.min(13, startCell));
                                endCell = Math.max(startCell, Math.min(13, endCell));
                                const span = (endCell - startCell) + 1;

                                const colStartClass = `col-start-${startCell + 1}`;
                                const colSpanStyle = { 
                                  gridColumn: `${startCell + 1} / span ${span}`
                                };

                                return (
                                  <div 
                                    style={colSpanStyle}
                                    className={`h-5.5 rounded-full flex items-center justify-between px-3 text-[10px] font-bold text-white shadow-inner transition-all hover:scale-[1.01] ${
                                      task.status === 'completed' ? 'bg-emerald-500 shadow-emerald-200' :
                                      task.status === 'review' ? 'bg-amber-500 shadow-amber-200' :
                                      task.status === 'in_progress' ? 'bg-blue-500 shadow-blue-200' : 'bg-slate-400'
                                    }`}
                                  >
                                    <span>{getTaskStatusLabel(task.status)}</span>
                                    <span>{span} d</span>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </div>

              </div>

            )}
          </div>

        </div>
      )}

      {/* Task Modal Details & Interaction (Task Detail Card) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right"
              onClick={e => e.stopPropagation()}
            >
              
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-xs"
                >
                  <X className="w-5 h-5" />
                </button>

                 <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-bold text-slate-900">
                      {editingTask?.id ? 'Task Details & Management' : 'New Task'}
                    </h2>
                    <p className="text-xs text-slate-400">Subtasks workflow, operational dependencies, and time tracking.</p>
                  </div>
                </div>
              </div>

              {/* Body inside Split Columns */}
              <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-slate-100">
                
                {/* Left Side: Comments log & Checklist & Time Tracker (7 columns) */}
                <div className="lg:col-span-7 p-6 space-y-6 overflow-auto custom-scrollbar">
                  
                  {/* SEGMENT 1: TIME TRACKER */}
                  {editingTask?.id && (
                    <div className="bg-slate-900 text-white rounded-2xl p-4.5 shadow-md flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button 
                          type="button"
                          onClick={toggleTimer}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition shadow-md cursor-pointer ${
                            timerActive ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          {timerActive ? <Pause className="w-5.5 h-5.5" /> : <Play className="w-5.5 h-5.5 ml-1" />}
                        </button>
                        
                        <div className="text-left">
                          <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Real-Time Time Tracker</span>
                          
                          {/* Live Ticking display */}
                          <div className="flex items-baseline gap-1 mt-0.5">
                            {timerActive ? (
                              <span className="text-xl font-black font-mono text-emerald-400">
                                {Math.floor(timerSeconds / 60)}m {timerSeconds % 60}s
                              </span>
                            ) : (
                              <span className="text-sm font-bold text-slate-400">Timer Paused</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-bold">Accumulated Time Spent</span>
                        <span className="block text-sm font-extrabold text-slate-200 mt-0.5 font-mono">
                          {formatTimeSpent((editingTask.time_spent_seconds || 0) + (timerActive ? timerSeconds : 0))}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SEGMENT 2: TASK SUB-CHECKLIST */}
                  {editingTask?.id && (
                    <div className="space-y-3 bg-slate-50 p-4.5 rounded-2xl border border-slate-150">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 justify-start">
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                        Sub-tasks Checklist
                      </h4>
                      
                      <div className="space-y-2">
                        {editingTask.checklist?.map(item => (
                          <div key={item.id} className="flex items-center gap-3 p-2.5 bg-white rounded-xl border border-slate-150 group/item">
                            <button
                              type="button"
                              onClick={() => toggleChecklistItem(item.id, !item.is_completed)}
                              className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${item.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 hover:border-emerald-400'}`}
                            >
                              {item.is_completed && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                            <span className={`text-xs flex-1 font-bold transition-all text-left ${item.is_completed ? 'text-slate-400 line-through font-normal' : 'text-slate-700'}`}>
                              {item.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteChecklistItem(item.id)}
                              className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        
                        <div className="flex gap-2 pt-2">
                          <input 
                            type="text"
                            placeholder="Add new step..."
                            value={newChecklistItem}
                            onChange={e => setNewChecklistItem(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem(editingTask.id!))}
                            className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-left"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddChecklistItem(editingTask.id!)}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-bold text-xs px-4"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SEGMENT 3: COMMENTS & DISCUSSION */}
                  {editingTask?.id && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 justify-start">
                          <MessageSquare className="w-4 h-4 text-indigo-600" />
                          Discussion Board
                        </h4>
                        <span className="text-xs text-slate-400 font-bold">{comments.length} active comments</span>
                      </div>

                      {/* Comments feed */}
                      <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                        {loadingComments ? (
                          <div className="text-center text-slate-400 text-xs py-4">Loading discussion logs...</div>
                        ) : comments.length === 0 ? (
                          <div className="text-center text-slate-400 text-[11px] py-4 italic">No comments yet. Start the discussion!</div>
                        ) : (
                          comments.map(c => (
                            <div key={c.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80 space-y-1.5 font-bold">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-black text-slate-800">{c.user_name}</span>
                                <span className="text-[10px] text-slate-440 font-medium text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-slate-600 text-left">{c.comment}</p>
                              
                              {c.attachment_url && (
                                <div className="pt-1 text-left">
                                  {c.attachment_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                    <div className="inline-block rounded-xl border border-slate-200 overflow-hidden max-w-xs bg-white">
                                      <img 
                                        src={c.attachment_url} 
                                        alt="Comment attachment" 
                                        referrerPolicy="no-referrer"
                                        className="h-28 object-cover cursor-pointer hover:opacity-90 max-w-full"
                                        onClick={() => window.open(c.attachment_url, '_blank')}
                                      />
                                    </div>
                                  ) : (
                                    <a 
                                      href={c.attachment_url} 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1.5 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg font-bold"
                                    >
                                      <Paperclip className="w-3 h-3" /> Download attachment
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Post form */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-2">
                        <textarea 
                          rows={2}
                          value={newCommentText}
                          onChange={e => setNewCommentText(e.target.value)}
                          placeholder="Type a comment or share progress..."
                          className="w-full text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left resize-none"
                        />
                        
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Image or file link (optional)..."
                            value={commentAttachment}
                            onChange={e => setCommentAttachment(e.target.value)}
                            className="flex-1 text-[11px] px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-left"
                          />
                          <button 
                            onClick={handlePostComment}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" /> Send Comment
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                               {/* Right Side: Basic specifications formulation (5 columns) */}
                <div className="lg:col-span-5 p-6 space-y-5">
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-start">
                      Task Title
                    </label>
                    <input 
                      type="text" 
                      required
                      value={editingTask?.title || ''}
                      onChange={e => setEditingTask(prev => ({ ...prev!, title: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-left font-extrabold text-sm"
                      placeholder="What needs to be done?"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-start">
                      Detailed Description
                    </label>
                    <textarea 
                      rows={3}
                      value={editingTask?.description || ''}
                      onChange={e => setEditingTask(prev => ({ ...prev!, description: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none text-left text-xs"
                      placeholder="Add clarifying details..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-start">
                        Priority Level
                      </label>
                      <select 
                        value={editingTask?.priority || 'medium'}
                        onChange={e => setEditingTask(prev => ({ ...prev!, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-start">
                        Assigned Member
                      </label>
                      <select 
                        value={editingTask?.assigned_to || ''}
                        onChange={e => setEditingTask(prev => ({ ...prev!, assigned_to: parseInt(e.target.value) || undefined }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none"
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-start">
                        Due Date
                      </label>
                      <input 
                        type="date" 
                        value={editingTask?.due_date ? new Date(editingTask.due_date).toISOString().split('T')[0] : ''}
                        onChange={e => setEditingTask(prev => ({ ...prev!, due_date: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-250 rounded-xl font-mono text-xs text-slate-700"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-start">
                        Task Status
                      </label>
                      <select 
                        value={editingTask?.status || 'pending'}
                        onChange={e => setEditingTask(prev => ({ ...prev!, status: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Under Review</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  {/* DEPENDENCY FORMULATOR */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-start">
                      <Milestone className="w-3.5 h-3.5 text-amber-500" />
                      Gantt Dependency
                    </label>
                    <select
                      value={editingTask?.depends_on_task_id || ''}
                      onChange={e => setEditingTask(prev => ({ ...prev!, depends_on_task_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none text-left"
                    >
                      <option value="">Does not depend on any other task</option>
                      {tasks
                        .filter(t => t.id !== editingTask?.id)
                        .map(t => (
                          <option key={t.id} value={t.id}>Depends on: {t.title}</option>
                        ))
                      }
                    </select>
                    <p className="text-[10px] text-slate-400 leading-relaxed text-left">Example: Starting "Shipment" won't be allowed until "Payment Confirmation" is completed.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 justify-start">
                      Link To Module
                    </label>
                    <select 
                      value={editingTask?.module_id || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setEditingTask(prev => ({ 
                          ...prev!, 
                          module_id: val,
                          deal_id: val !== 'crm' ? undefined : prev?.deal_id 
                        }));
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none text-left"
                    >
                      <option value="">Not linked to external module</option>
                      <option value="risk">Risk Register</option>
                      <option value="kaizen">Kaizen Improvements</option>
                      <option value="crm">CRM Sales Deals</option>
                      <option value="sop">SOPs</option>
                    </select>
                  </div>

                  {editingTask?.module_id === 'crm' && (
                    <div className="space-y-1.5 p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-100/55 space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-1 justify-start mb-1">
                          <Briefcase className="w-3.5 h-3.5" />
                          Linked CRM Deal
                        </label>
                        <select 
                          value={editingTask?.deal_id || ''}
                          onChange={e => setEditingTask(prev => ({ ...prev!, deal_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none text-left"
                        >
                          <option value="">Select a sales deal...</option>
                          {deals.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.title} ({d.value}$ - {d.customer_name})
                            </option>
                          ))}
                        </select>
                      </div>

                      {editingTask?.deal_id && (
                        <button
                          type="button"
                          onClick={() => {
                            const found = deals.find(d => d.id === editingTask.deal_id);
                            if (found) {
                              setPreviewDeal(found);
                            }
                          }}
                          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          View Linked Context
                        </button>
                      )}
                    </div>
                  )}

                  {/* Form Trigger buttons */}
                  <div className="pt-6 border-t border-slate-100 flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-250 transition-all text-xs text-center"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleSaveTask}
                      disabled={isSaving}
                      className="flex-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </button>
                  </div>

                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Linked CRM Deal Preview Side Drawer / Modal (Embedded Preview Mode) */}
      <AnimatePresence>
        {previewDeal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewDeal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-left"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Linked CRM Deal Details
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Embedded Read-Only Preview Mode</p>
                  </div>
                </div>

                <button 
                  onClick={() => setPreviewDeal(null)}
                  className="p-1.5 hover:bg-white rounded-full transition-all text-slate-400 hover:text-slate-600 shadow-xs"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-auto p-6 space-y-6 text-left custom-scrollbar">
                
                {/* Section 1: Deal Core */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Deal Value</span>
                    <span className="text-lg font-black text-indigo-700 font-mono block">
                      ${Number(previewDeal.value || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Service / Product</span>
                    <span className="text-xs font-bold text-emerald-800 block truncate">
                      {previewDeal.service_type || previewDeal.product || 'Standard Product'}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Status / Stage</span>
                    <span className="text-xs font-black text-slate-700 block uppercase">
                      {previewDeal.stage_name || 'Active Deal'}
                    </span>
                  </div>
                </div>

                {/* Section 2: Deal Title & Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    Deal Details & Title
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                    <h5 className="text-sm font-extrabold text-slate-900">{previewDeal.title}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {previewDeal.description || 'No description provided for this deal.'}
                    </p>
                  </div>
                </div>

                {/* Section 3: Customer Details */}
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-500" />
                    Customer Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">Name & Company</span>
                      <span className="text-xs font-extrabold text-slate-800 block">
                        {previewDeal.customer_name}
                      </span>
                      {previewDeal.customer_company && (
                        <span className="text-[11px] text-slate-500 block">
                          Company: {previewDeal.customer_company}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-xs text-slate-600">
                      {previewDeal.customer_email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{previewDeal.customer_email}</span>
                        </div>
                      )}
                      {previewDeal.customer_phone && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{previewDeal.customer_phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Items Table */}
                <div className="space-y-2">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4 text-indigo-500" />
                    Deal Items & Products
                  </h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                    {(() => {
                      let items = [];
                      try {
                        items = typeof previewDeal.items === 'string' ? JSON.parse(previewDeal.items) : (previewDeal.items || []);
                      } catch (e) {
                        items = [];
                      }
                      if (!Array.isArray(items) || items.length === 0) {
                        return <div className="text-xs text-slate-400 p-4 text-center italic">No items recorded for this deal.</div>;
                      }
                      return (
                        <table className="w-full text-xs text-left">
                          <thead>
                            <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500">
                              <th className="py-2.5 px-4 text-left font-bold">Item Name</th>
                              <th className="py-2.5 px-4 text-center font-bold">Qty</th>
                              <th className="py-2.5 px-4 text-right font-bold">Price</th>
                              <th className="py-2.5 px-4 text-right font-bold">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {items.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-4 text-left font-bold text-slate-800">{item.name}</td>
                                <td className="py-2.5 px-4 text-center font-bold text-slate-600 font-mono">{item.quantity}</td>
                                <td className="py-2.5 px-4 text-right text-slate-600 font-mono">${Number(item.price || 0).toLocaleString()}</td>
                                <td className="py-2.5 px-4 text-right font-black text-indigo-600 font-mono">${Number((item.quantity || 1) * (item.price || 0)).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewDeal(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
      />
    </div>
  );
};

export default TasksModule;
