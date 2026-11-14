import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sliders, X, Sparkles, Shield, ArrowUpRight, FolderTree, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { HRCustomizationManager } from './HRCustomizationManager';
import { CustomFieldsConfigManager } from './CustomFieldsManager';
import { PipelineSetupManager } from './PipelineSetupManager';
import { HRIntegrationManager } from './HRIntegrationManager';
import HREmailConfigManager from './HREmailConfigManager';

export type HRPermissionsTabType = 'rbac' | 'customization' | 'custom_fields' | 'pipelines' | 'integration' | 'emails';

interface HRPermissionsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: HRPermissionsTabType;
}

export const HRPermissionsManagerModal: React.FC<HRPermissionsManagerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'rbac'
}) => {
  const [activeTab, setActiveTab] = useState<HRPermissionsTabType>(initialTab);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep active tab in sync if initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { user } = useAuth();
  const canAccess = 
    !(user as any)?.isPreviewActive && (
      user?.email?.toLowerCase().trim() === 'esraaessoo19@gmail.com' ||
      (user as any)?.is_super_admin === true ||
      (user?.role_id === 1 && (user?.email === 'admin@gmail.com' || user?.email === 'admin@opex.com'))
    );

  if (!mounted || !isOpen || !canAccess) return null;

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-3xl md:rounded-[32px] border border-slate-200 shadow-2xl w-full max-w-[98vw] xl:max-w-[1500px] h-[92vh] max-h-[96vh] overflow-hidden text-left text-slate-800 flex flex-col relative"
        >
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-100 p-5 sm:p-6 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    HR Permissions & Governance Manager
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                    Role & Schema Controls
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mt-0.5">
                  CONTROL WHO CAN ACCESS, VIEW, EDIT, AND CONFIGURE EACH HR ROUTE, TAB, OR DATA FIELD
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/hr/permissions', { state: { initialTab: activeTab } });
                }}
                className="p-2 hover:bg-slate-200/70 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                title="Open in Full Page"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Full Page</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-slate-200/70 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Top Tabs Bar */}
          <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 overflow-x-auto scrollbar-none whitespace-nowrap shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('customization')}
              className={cn(
                "px-4 sm:px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'customization' 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>CUSTOMIZATION / تخصيص النماذج</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom_fields')}
              className={cn(
                "px-4 sm:px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
                activeTab === 'custom_fields' 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <span>CUSTOM FIELDS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pipelines')}
              className={cn(
                "px-4 sm:px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
                activeTab === 'pipelines' 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <span>PIPELINE SETUP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('integration')}
              className={cn(
                "px-4 sm:px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
                activeTab === 'integration' 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <span>INTEGRATION</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('emails')}
              className={cn(
                "px-4 sm:px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all cursor-pointer",
                activeTab === 'emails' 
                  ? "border-indigo-600 text-indigo-600" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <span>EMAIL CONFIG</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rbac')}
              className={cn(
                "px-4 sm:px-5 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ml-auto",
                activeTab === 'rbac' 
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50" 
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <FolderTree className="w-3.5 h-3.5 text-indigo-600" />
              <span>ROLE PERMISSIONS (RBAC)</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 sm:p-6 md:p-8 overflow-y-auto flex-1 space-y-8 bg-slate-50/30">
            {activeTab === 'customization' && (
              <HRCustomizationManager />
            )}

            {activeTab === 'custom_fields' && (
              <CustomFieldsConfigManager />
            )}

            {activeTab === 'pipelines' && (
              <PipelineSetupManager />
            )}

            {activeTab === 'integration' && (
              <HRIntegrationManager />
            )}

            {activeTab === 'emails' && (
              <HREmailConfigManager />
            )}

            {activeTab === 'rbac' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden text-white">
                  <div className="space-y-2 relative z-10 max-w-2xl">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                      RBAC Security Governance
                    </span>
                    <h4 className="font-black text-xl tracking-tight flex items-center gap-2.5">
                      <Shield className="w-6 h-6 text-indigo-400" />
                      Role-Based Screen & Navigation Permissions
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed font-medium">
                      Configure granular role permissions across the entire HR system. 
                      Toggle screens, sub-pages, and tabs with cascading inheritance, set access levels 
                      (Full Access, Read-Only, Blocked), and assign data scopes (Own, Team, Department, Global).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/admin/rbac/1/module/HR/tree');
                    }}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                  >
                    <span>Open Full HR Screen Tree</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => {
                      onClose();
                      navigate('/admin/rbac/1/module/HR/tree');
                    }}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">/hr/directory</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-sm mb-1">Employee Directory & Profiles</h5>
                    <p className="text-xs text-slate-500">16 Profile Tabs (Personal, Job, Time Off, Emergency, Assets, etc.)</p>
                  </div>

                  <div 
                    onClick={() => {
                      onClose();
                      navigate('/admin/rbac/1/module/HR/tree');
                    }}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">/hr/payroll</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-sm mb-1">Payroll & Compensation</h5>
                    <p className="text-xs text-slate-500">Salary slips, policy rules, benefits, deductions, and vouchers</p>
                  </div>

                  <div 
                    onClick={() => {
                      onClose();
                      navigate('/admin/rbac/1/module/HR/tree');
                    }}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">/hr/attendance</span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-sm mb-1">Attendance & Clock Punches</h5>
                    <p className="text-xs text-slate-500">Biometric logs, shift rotas, breaks, leaves, and shift swaps</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-100 p-5 sm:p-6 flex justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            >
              Close Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default HRPermissionsManagerModal;
