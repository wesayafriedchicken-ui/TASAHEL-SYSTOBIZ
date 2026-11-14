import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Task, User, GlobalStatus, ChecklistItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  comment: string;
  attachment_url?: string;
  created_at: string;
}

export type TaskChecklistItem = ChecklistItem;

export interface SingleTaskDetails extends Task {
  checklist?: ChecklistItem[];
  comments?: TaskComment[];
  deal?: any;
  depends_on_task_title?: string;
  depends_on_task_status?: string;
  step_description?: string;
  assigned_to_email?: string;
}

export interface TaskContextType {
  tasks: Task[];
  users: User[];
  deals: any[];
  isLoading: boolean;
  isSaving: boolean;
  selectedTask: SingleTaskDetails | null;
  setSelectedTask: React.Dispatch<React.SetStateAction<SingleTaskDetails | null>>;
  
  // Filters & Search
  filterStatus: string;
  setFilterStatus: React.Dispatch<React.SetStateAction<string>>;
  filterPriority: string;
  setFilterPriority: React.Dispatch<React.SetStateAction<string>>;
  filterUser: string;
  setFilterUser: React.Dispatch<React.SetStateAction<string>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  
  // Pagination
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  perPage: number;
  setPerPage: React.Dispatch<React.SetStateAction<number>>;
  totalTasks: number;
  totalPages: number;
  
  // Active Timer
  activeTimerTaskId: number | null;
  activeTimerTaskTitle: string;
  timerSeconds: number;
  isTimerRunning: boolean;
  startTimer: (taskId: number, title?: string, initialSeconds?: number) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  saveTimerToDatabase: (taskId?: number) => Promise<boolean>;

  // Dialogs & Notifications
  toast: { message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  showDeleteConfirm: number | null;
  setShowDeleteConfirm: React.Dispatch<React.SetStateAction<number | null>>;

  // Operations
  fetchTasks: () => Promise<void>;
  fetchTaskById: (id: number) => Promise<SingleTaskDetails | null>;
  createTask: (taskData: Partial<Task> & { initialChecklist?: string[] }) => Promise<Task | null>;
  updateTask: (id: number, taskData: Partial<Task>) => Promise<boolean>;
  deleteTask: (id: number) => Promise<boolean>;
  updateTaskStatus: (taskId: number, newStatus: Task['status']) => Promise<boolean>;
  addChecklistItem: (taskId: number, title: string) => Promise<TaskChecklistItem | null>;
  toggleChecklistItem: (itemId: number, isCompleted: boolean) => Promise<boolean>;
  deleteChecklistItem: (itemId: number) => Promise<boolean>;
  postComment: (taskId: number, comment: string, attachmentUrl?: string) => Promise<TaskComment | null>;
}

const TaskContext = createContext<TaskContextType | null>(null);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: React.ReactNode;
  globalStatuses?: GlobalStatus[];
  users?: User[];
}

export const TaskProvider: React.FC<TaskProviderProps> = ({
  children,
  globalStatuses = [],
  users: initialUsers = []
}) => {
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [deals, setDeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<SingleTaskDetails | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Stopwatch / Time Tracker
  const [activeTimerTaskId, setActiveTimerTaskId] = useState<number | null>(() => {
    const saved = localStorage.getItem('task_timer_task_id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [activeTimerTaskTitle, setActiveTimerTaskTitle] = useState<string>(() => {
    return localStorage.getItem('task_timer_task_title') || '';
  });
  const [timerSeconds, setTimerSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('task_timer_seconds');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(() => {
    return localStorage.getItem('task_timer_running') === 'true';
  });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Request Headers Helper
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    let userId = user?.id?.toString() || '1';
    if (storedUser && !user?.id) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.id) userId = parsed.id.toString();
      } catch (e) {
        // ignore
      }
    }
    return {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }, [user]);

  // Fetch initial deals & users if not passed
  const fetchDealsAndUsers = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [dealsRes, usersRes] = await Promise.all([
        fetch('/api/crm/deals', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        initialUsers.length === 0 
          ? fetch('/api/users', { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
          : Promise.resolve(initialUsers)
      ]);
      setDeals(Array.isArray(dealsRes) ? dealsRes : []);
      if (initialUsers.length === 0 && Array.isArray(usersRes)) {
        setUsers(usersRes);
      }
    } catch (e) {
      console.error('Error fetching supporting data for tasks:', e);
    }
  }, [getAuthHeaders, initialUsers]);

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      // Fetch without limit constraints to give rich data for Kanban, Timeline, and List
      const res = await fetch('/api/tasks?limit=500', { headers });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.data || []);
        setTasks(list);
      } else {
        showToast('Failed to load tasks from database', 'error');
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      showToast('Database connection error', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, showToast]);

  // Fetch single task with relations
  const fetchTaskById = useCallback(async (id: number): Promise<SingleTaskDetails | null> => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/tasks/${id}`, { headers });
      if (res.ok) {
        const taskData = await res.json();
        setSelectedTask(taskData);
        return taskData;
      }
      return null;
    } catch (err) {
      console.error(`Failed to fetch task #${id}:`, err);
      return null;
    }
  }, [getAuthHeaders]);

  // Create Task
  const createTask = async (taskData: Partial<Task> & { initialChecklist?: string[] }): Promise<Task | null> => {
    setIsSaving(true);
    try {
      const headers = getAuthHeaders();
      const { initialChecklist, ...payload } = taskData;
      
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...payload,
          time_spent_seconds: payload.time_spent_seconds || 0,
          depends_on_task_id: payload.depends_on_task_id || null
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create task');
      }

      const createdTask: Task = await res.json();

      // If initial checklist items provided, create them
      if (initialChecklist && initialChecklist.length > 0) {
        for (const itemTitle of initialChecklist) {
          if (itemTitle.trim()) {
            await fetch(`/api/tasks/${createdTask.id}/checklist`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ title: itemTitle.trim() })
            }).catch(() => null);
          }
        }
      }

      showToast('Task created successfully in database', 'success');
      await fetchTasks();
      return createdTask;
    } catch (err) {
      console.error('Error creating task:', err);
      showToast('Could not create task. Please try again.', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  // Update Task
  const updateTask = async (id: number, taskData: Partial<Task>): Promise<boolean> => {
    setIsSaving(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(taskData)
      });

      if (!res.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await res.json();
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedTask } : t));
      if (selectedTask?.id === id) {
        setSelectedTask(prev => prev ? { ...prev, ...updatedTask } : null);
      }

      showToast('Changes saved to database', 'success');
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      showToast('Failed to update task', 'error');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Task
  const deleteTask = async (id: number): Promise<boolean> => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(prev => prev.filter(t => t.id !== id));
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
      if (activeTimerTaskId === id) {
        resetTimer();
      }

      setShowDeleteConfirm(null);
      showToast('Task permanently deleted from database', 'success');
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      showToast('Could not delete task', 'error');
      return false;
    }
  };

  // Fast Update Status (Kanban & Quick switch)
  const updateTaskStatus = async (taskId: number, newStatus: Task['status']): Promise<boolean> => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        throw new Error('Status update failed');
      }

      showToast(`Status updated to "${newStatus}"`, 'success');
      return true;
    } catch (err) {
      console.error('Error updating task status:', err);
      showToast('Failed to update status in database', 'error');
      fetchTasks();
      return false;
    }
  };

  // Add Checklist Item
  const addChecklistItem = async (taskId: number, title: string): Promise<TaskChecklistItem | null> => {
    if (!title.trim()) return null;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: title.trim() })
      });

      if (res.ok) {
        const item: TaskChecklistItem = await res.json();
        if (selectedTask?.id === taskId) {
          setSelectedTask(prev => {
            if (!prev) return null;
            return {
              ...prev,
              checklist: [...(prev.checklist || []), item]
            };
          });
        }
        setTasks(prev => prev.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              checklist: [...(t.checklist || []), item]
            };
          }
          return t;
        }));
        showToast('Checklist item added', 'success');
        return item;
      }
      return null;
    } catch (err) {
      console.error('Failed to add checklist item:', err);
      return null;
    }
  };

  // Toggle Checklist Item
  const toggleChecklistItem = async (itemId: number, isCompleted: boolean): Promise<boolean> => {
    // Optimistic
    if (selectedTask) {
      setSelectedTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          checklist: (prev.checklist || []).map(i => i.id === itemId ? { ...i, is_completed: isCompleted } : i)
        };
      });
    }

    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/tasks/checklist/${itemId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_completed: isCompleted })
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
      return false;
    }
  };

  // Delete Checklist Item
  const deleteChecklistItem = async (itemId: number): Promise<boolean> => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/tasks/checklist/${itemId}`, {
        method: 'DELETE',
        headers
      });

      if (res.ok) {
        if (selectedTask) {
          setSelectedTask(prev => {
            if (!prev) return null;
            return {
              ...prev,
              checklist: (prev.checklist || []).filter(i => i.id !== itemId)
            };
          });
        }
        setTasks(prev => prev.map(t => ({
          ...t,
          checklist: (t.checklist || []).filter(i => i.id !== itemId)
        })));
        showToast('Checklist item deleted', 'success');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete checklist item:', err);
      return false;
    }
  };

  // Post Comment
  const postComment = async (taskId: number, comment: string, attachmentUrl?: string): Promise<TaskComment | null> => {
    if (!comment.trim()) return null;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          comment: comment.trim(),
          attachment_url: attachmentUrl?.trim() || undefined,
          user_name: user?.name || 'System User'
        })
      });

      if (res.ok) {
        const newComment: TaskComment = await res.json();
        if (selectedTask?.id === taskId) {
          setSelectedTask(prev => {
            if (!prev) return null;
            return {
              ...prev,
              comments: [...(prev.comments || []), newComment]
            };
          });
        }
        showToast('Comment posted successfully', 'success');
        return newComment;
      }
      return null;
    } catch (err) {
      console.error('Failed to post comment:', err);
      showToast('Could not post comment', 'error');
      return null;
    }
  };

  // Stopwatch Management
  const startTimer = useCallback((taskId: number, title?: string, initialSeconds?: number) => {
    setActiveTimerTaskId(taskId);
    localStorage.setItem('task_timer_task_id', taskId.toString());

    const taskTitle = title || tasks.find(t => t.id === taskId)?.title || `Task #${taskId}`;
    setActiveTimerTaskTitle(taskTitle);
    localStorage.setItem('task_timer_task_title', taskTitle);

    if (initialSeconds !== undefined) {
      setTimerSeconds(initialSeconds);
      localStorage.setItem('task_timer_seconds', initialSeconds.toString());
    }

    setIsTimerRunning(true);
    localStorage.setItem('task_timer_running', 'true');
    showToast(`Timer started for task: ${taskTitle}`, 'success');
  }, [tasks, showToast]);

  const pauseTimer = useCallback(() => {
    setIsTimerRunning(false);
    localStorage.setItem('task_timer_running', 'false');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    setActiveTimerTaskId(null);
    setActiveTimerTaskTitle('');
    setTimerSeconds(0);
    localStorage.removeItem('task_timer_task_id');
    localStorage.removeItem('task_timer_task_title');
    localStorage.removeItem('task_timer_seconds');
    localStorage.removeItem('task_timer_running');
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const saveTimerToDatabase = useCallback(async (taskId?: number): Promise<boolean> => {
    const targetId = taskId || activeTimerTaskId;
    if (!targetId) return false;

    try {
      const headers = getAuthHeaders();
      const currentTask = tasks.find(t => t.id === targetId);
      const prevSpent = currentTask?.time_spent_seconds || 0;
      const totalSeconds = Math.max(prevSpent, timerSeconds);

      const res = await fetch(`/api/tasks/${targetId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ time_spent_seconds: totalSeconds })
      });

      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === targetId ? { ...t, time_spent_seconds: totalSeconds } : t));
        if (selectedTask?.id === targetId) {
          setSelectedTask(prev => prev ? { ...prev, time_spent_seconds: totalSeconds } : null);
        }
        showToast('Logged time saved to database', 'success');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error saving timer:', err);
      showToast('Could not save timer', 'error');
      return false;
    }
  }, [activeTimerTaskId, timerSeconds, tasks, selectedTask, getAuthHeaders, showToast]);

  // Timer Tick Effect
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          const next = prev + 1;
          localStorage.setItem('task_timer_seconds', next.toString());
          return next;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  // Initial load
  useEffect(() => {
    fetchTasks();
    fetchDealsAndUsers();
  }, [fetchTasks, fetchDealsAndUsers]);

  // Real-time Supabase Subscription
  useEffect(() => {
    if (!supabase) return;
    try {
      const channel = supabase
        .channel('tasks-realtime-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
          // Re-fetch tasks silently to keep everything perfectly synced
          fetchTasks();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Real-time subscription error for tasks:', e);
    }
  }, [fetchTasks]);

  // Filtered & Paginated Calculation
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      // Priority
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      // User
      if (filterUser !== 'all' && task.assigned_to?.toString() !== filterUser) return false;
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        const userMatch = task.assigned_to_name?.toLowerCase().includes(query);
        const idMatch = task.id.toString() === query;
        if (!titleMatch && !descMatch && !userMatch && !idMatch) return false;
      }
      return true;
    });
  }, [tasks, filterStatus, filterPriority, filterUser, searchTerm]);

  const totalTasks = filteredTasks.length;
  const totalPages = Math.ceil(totalTasks / perPage) || 1;

  // Ensure current page is valid when total tasks or perPage changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const value: TaskContextType = {
    tasks,
    users,
    deals,
    isLoading,
    isSaving,
    selectedTask,
    setSelectedTask,
    filterStatus,
    setFilterStatus,
    filterPriority,
    setFilterPriority,
    filterUser,
    setFilterUser,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalTasks,
    totalPages,
    activeTimerTaskId,
    activeTimerTaskTitle,
    timerSeconds,
    isTimerRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    saveTimerToDatabase,
    toast,
    showToast,
    showDeleteConfirm,
    setShowDeleteConfirm,
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    postComment
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};
