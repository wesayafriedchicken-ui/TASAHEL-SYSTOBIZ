import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layout, 
  List, 
  BarChart3, 
  Clock, 
  Plus, 
  Play, 
  Pause, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  Layers,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlobalStatus, User } from '../../types';
import DeleteConfirmation from '../../components/Common/DeleteConfirmation';
import { TaskProvider, useTask } from './TaskContext';

interface TaskLayoutProps {
  globalStatuses?: GlobalStatus[];
  users?: User[];
}

const formatSeconds = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h > 0 ? `${h.toString().padStart(2, '0')}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const TaskLayoutInner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    toast, 
    showDeleteConfirm, 
    setShowDeleteConfirm, 
    deleteTask,
    fetchTasks,
    isLoading,
    activeTimerTaskId,
    activeTimerTaskTitle,
    timerSeconds,
    isTimerRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    saveTimerToDatabase,
    tasks
  } = useTask();

  const activeTaskCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-semibold backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-emerald-50/95 text-emerald-900 border-emerald-200 shadow-emerald-500/10' 
                : 'bg-rose-50/95 text-rose-900 border-rose-200 shadow-rose-500/10'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Floating Active Timer Widget if a timer is running or has recorded time */}
      <AnimatePresence>
        {activeTimerTaskId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-3.5 px-5 shadow-lg shadow-indigo-950/20 border border-indigo-800/40 flex flex-wrap items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${isTimerRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                    {isTimerRunning ? 'Timer Active & Recording' : 'Timer Paused'}
                  </span>
                  <button 
                    onClick={() => navigate(`/tasks/${activeTimerTaskId}`)}
                    className="text-slate-300 hover:text-white flex items-center gap-1 text-xs font-semibold underline underline-offset-2"
                  >
                    <span>{activeTimerTaskTitle || `Task #${activeTimerTaskId}`}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xl font-bold tracking-wider text-emerald-300 bg-slate-950/60 px-4 py-1.5 rounded-xl border border-white/10">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{formatSeconds(timerSeconds)}</span>
            </div>

            <div className="flex items-center gap-2">
              {isTimerRunning ? (
                <button
                  onClick={pauseTimer}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-amber-500/30"
                  title="Pause Timer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={() => startTimer(activeTimerTaskId)}
                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-500/30"
                  title="Resume Timer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={() => saveTimerToDatabase()}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                title="Save Logged Time to Database"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Time</span>
              </button>

              <button
                onClick={resetTimer}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                title="Discard Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODULE COMMAND HEADER */}
      <div className="space-y-4 no-print">
        {/* Real-time Status & Quick Actions */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-600 tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            <span>DATABASE ENGINE: CONNECTED & SYNCED</span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span className="px-2.5 py-1 bg-slate-100 rounded-full font-bold text-slate-700">
              {tasks.length} Total Tasks
            </span>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/50 rounded-full font-bold">
              {activeTaskCount} In Progress
            </span>
          </div>
        </div>

        {/* Title, Subtitle, and Create Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Tasks & Operations</span>
              <span className="text-sm font-semibold text-slate-400">/ Workflows</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage operational tasks, Kanban boards, Gantt timelines, and team productivity connected directly to the database.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchTasks()}
              disabled={isLoading}
              className="p-2.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button 
              onClick={() => navigate('/tasks/new')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-8 border-b border-slate-200 pt-2 overflow-x-auto text-xs font-bold tracking-wider">
          <NavLink
            to="/tasks/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 pb-3 transition-all whitespace-nowrap -mb-[1px] uppercase ${
                isActive 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <BarChart3 className="w-4 h-4" />
            <span>Productivity Dashboard</span>
          </NavLink>

          <NavLink
            to="/tasks/board"
            className={({ isActive }) =>
              `flex items-center gap-2 pb-3 transition-all whitespace-nowrap -mb-[1px] uppercase ${
                isActive 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Layout className="w-4 h-4" />
            <span>Kanban Board</span>
          </NavLink>

          <NavLink
            to="/tasks/list"
            className={({ isActive }) =>
              `flex items-center gap-2 pb-3 transition-all whitespace-nowrap -mb-[1px] uppercase ${
                isActive 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <List className="w-4 h-4" />
            <span>Detailed List</span>
          </NavLink>

          <NavLink
            to="/tasks/timeline"
            className={({ isActive }) =>
              `flex items-center gap-2 pb-3 transition-all whitespace-nowrap -mb-[1px] uppercase ${
                isActive 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Calendar className="w-4 h-4" />
            <span>Gantt Timeline</span>
          </NavLink>

          <NavLink
            to="/tasks/new"
            className={({ isActive }) =>
              `flex items-center gap-2 pb-3 transition-all whitespace-nowrap -mb-[1px] uppercase ${
                isActive 
                  ? 'text-indigo-600 border-b-2 border-indigo-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </NavLink>
        </div>
      </div>

      {/* Main Routed Page Content */}
      <div className="min-h-[500px]">
        <Outlet />
      </div>

      {/* Global Delete Confirmation */}
      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(null)} 
        onConfirm={async () => {
          if (showDeleteConfirm) {
            await deleteTask(showDeleteConfirm);
          }
        }} 
        title="Delete Task" 
        message="Are you sure you want to permanently delete this task from the database? This action cannot be undone." 
      />
    </div>
  );
};

export const TaskLayout: React.FC<TaskLayoutProps> = ({
  globalStatuses,
  users
}) => {
  const { checkPermission } = useAuth();
  const navigate = useNavigate();

  const canView = checkPermission('tasks', 'view') || 
                  checkPermission('Tasks & Projects', 'view') || 
                  checkPermission('Tasks', 'view') ||
                  true; // Tasks is a core module

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto text-center my-12">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <Layout className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h3>
        <p className="text-sm text-slate-500 mb-6">
          You do not have permission to view the Tasks module. Please contact your system administrator.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <TaskProvider
      globalStatuses={globalStatuses}
      users={users}
    >
      <TaskLayoutInner />
    </TaskProvider>
  );
};

export default TaskLayout;
