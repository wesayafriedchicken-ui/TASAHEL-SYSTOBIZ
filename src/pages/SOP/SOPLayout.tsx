import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  BarChart2, 
  Layers, 
  ShieldCheck, 
  GraduationCap, 
  Plus, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Department, GlobalStatus, User } from '../../types';
import { PermissionGate } from '../../components/Admin/PermissionGate';
import DeleteConfirmation from '../../components/Common/DeleteConfirmation';
import { SOPProvider, useSOP } from './SOPContext';

interface SOPLayoutProps {
  departments: Department[];
  globalStatuses: GlobalStatus[];
  users: User[];
  setActiveModule?: (mod: string) => void;
}

const SOPLayoutInner: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    toast, 
    showDeleteConfirm, 
    setShowDeleteConfirm, 
    handleDelete 
  } = useSOP();

  const isBuilderActive = location.pathname === '/sops/builder' || location.pathname === '/sops/new';

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-sm font-semibold ${
              toast.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODULE COMMAND HEADER EXACTLY MATCHING PREVIOUS DESIGN */}
      <div className="space-y-4 no-print">
        {/* Real-time Engine Indicator */}
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>REAL-TIME ENGINE: CONNECTED</span>
        </div>

        {/* Title, Subtitle, and Create Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">SOP Management</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Document and manage standard operating procedures with version control.
            </p>
          </div>

          <PermissionGate module="sop" action="create">
            <button 
              onClick={() => navigate('/sops/builder')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New SOP</span>
            </button>
          </PermissionGate>
        </div>

        {/* Underline Tabs Navigation */}
        <div className="flex items-center gap-8 border-b border-slate-200 pt-2 overflow-x-auto text-xs font-bold tracking-wider">
          <NavLink
            to="/sops/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 pb-3 transition-all whitespace-nowrap -mb-[1px] uppercase ${
                isActive 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <BarChart2 className="w-4 h-4" />
            <span>OPERATIONAL EXCELLENCE DASHBOARD</span>
          </NavLink>
          <NavLink
            to="/sops/library"
            className={({ isActive }) =>
              `flex items-center gap-2 pb-3 transition-all whitespace-nowrap -mb-[1px] uppercase ${
                isActive 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <BookOpen className="w-4 h-4" />
            <span>PROCEDURES LIBRARY</span>
          </NavLink>
          <NavLink
            to="/sops/lifecycle"
            className={({ isActive }) =>
              `flex items-center gap-2 pb-3 transition-all whitespace-nowrap -mb-[1px] uppercase ${
                isActive 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <ShieldCheck className="w-4 h-4" />
            <span>LIFECYCLE & APPROVALS</span>
          </NavLink>
          <NavLink
            to="/sops/training"
            className={({ isActive }) =>
              `flex items-center gap-2 pb-3 transition-all whitespace-nowrap -mb-[1px] uppercase ${
                isActive 
                  ? 'text-emerald-600 border-b-2 border-emerald-600' 
                  : 'text-slate-500 hover:text-slate-800'
              }`
            }
          >
            <GraduationCap className="w-4 h-4" />
            <span>SOP TRAINING HUB</span>
          </NavLink>
        </div>
      </div>

      {/* Main Routed Page Content */}
      <Outlet />

      {/* Global Delete Confirmation */}
      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(null)} 
        onConfirm={handleDelete} 
        title="Delete SOP" 
        message="Are you sure you want to delete this SOP? This will also remove all associated steps and audit records." 
      />
    </div>
  );
};

export const SOPLayout: React.FC<SOPLayoutProps> = ({
  departments,
  globalStatuses,
  users,
  setActiveModule
}) => {
  const { checkPermission } = useAuth();
  const navigate = useNavigate();

  const canView = checkPermission('sops', 'view') || checkPermission('sop', 'view') || checkPermission('SOP Management', 'view');

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto text-center my-12">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Access Denied / غير مصرح بالوصول</h3>
        <p className="text-sm text-slate-500 mb-6">
          You don't have permission to view the SOP Management module. Please contact your system administrator.
        </p>
        <button
          onClick={() => navigate('/home')}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <SOPProvider
      departments={departments}
      globalStatuses={globalStatuses}
      users={users}
      setActiveModule={setActiveModule}
    >
      <SOPLayoutInner />
    </SOPProvider>
  );
};

export default SOPLayout;
