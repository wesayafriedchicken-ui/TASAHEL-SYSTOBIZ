import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sliders, 
  ArrowLeft, 
  Shield, 
  ArrowUpRight, 
  FolderTree, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Mail,
  GitBranch
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { HRCustomizationManager } from '../../../components/HR/HRCustomizationManager';
import { CustomFieldsConfigManager } from '../../../components/HR/CustomFieldsManager';
import { PipelineSetupManager } from '../../../components/HR/PipelineSetupManager';
import { HRIntegrationManager } from '../../../components/HR/HRIntegrationManager';
import HREmailConfigManager from '../../../components/HR/HREmailConfigManager';
import { HRPermissionsTabType } from '../../../components/HR/HRPermissionsManagerModal';

export const HRPermissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<HRPermissionsTabType>(
    (location.state as any)?.initialTab || 'rbac'
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans text-slate-800 animate-fadeIn" id="hr-permissions-page">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/hr');
                  }
                }}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all cursor-pointer shrink-0"
                title="Back to HR Control Center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    HR Security & Governance
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500">Access Control & Schema Customization</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  HR Permissions & Configuration Manager
                </h1>
                <p className="text-xs text-slate-500 font-medium line-clamp-1">
                  Comprehensive governance: granular screen access, custom field layouts, hiring pipelines, and biometric integrations.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/admin/rbac/1/module/HR/tree')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <FolderTree className="w-4 h-4" />
                <span>Full Screen Tree</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-t border-slate-100 mt-4 pt-1 overflow-x-auto no-scrollbar gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('rbac')}
              className={cn(
                "px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'rbac'
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Role Permissions (RBAC) / صلاحيات الشاشات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('customization')}
              className={cn(
                "px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'customization'
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customization / تخصيص النماذج</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom_fields')}
              className={cn(
                "px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'custom_fields'
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Custom Fields / الحقول المخصصة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pipelines')}
              className={cn(
                "px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'pipelines'
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Pipeline Setup / مسارات التوظيف</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('integration')}
              className={cn(
                "px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'integration'
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Integration / الربط والتكامل</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('emails')}
              className={cn(
                "px-4 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === 'emails'
                  ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              )}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Config / إعدادات البريد</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Content Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {activeTab === 'rbac' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden text-white">
              <div className="space-y-2 relative z-10 max-w-2xl">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                  Role-Based Access Control (RBAC)
                </span>
                <h3 className="font-black text-2xl tracking-tight flex items-center gap-2.5">
                  <Shield className="w-6 h-6 text-indigo-400" />
                  Granular HR Screen & Navigation Permissions
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed font-medium">
                  Configure role-level permissions across all 11 core HR routes, pages, and sub-tabs. 
                  Toggle visibility, set access levels (Full Access, Read-Only, Blocked), and define data scopes 
                  (Own Data, Team, Department, or Global) with instant database persistence.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/rbac/1/module/HR/tree')}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                <span>Launch Full Interactive Screen Tree</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of the 11 Core HR Routes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { path: '/hr', name: 'HR Workspace Root & Core Shell', desc: 'Global module navigation bar, workspace header, and department switcher' },
                { path: '/hr/dashboard', name: 'HR Control Center Dashboard', desc: 'KPI scorecards, headcount distribution graphs, turnover, and device telemetry' },
                { path: '/hr/directory', name: 'Employee Directory & Profiles', desc: 'Master staff roster + 14 detailed profile tabs (Personal, Job, Time-off, Assets, etc.)' },
                { path: '/hr/departments', name: 'Departments & Org Structure', desc: 'Hierarchical branches, teams squads, job titles scale, and job descriptions library' },
                { path: '/hr/recruitment', name: 'Hiring & Talent Acquisition', desc: 'Job opening requisitions, Kanban applicant stages, candidate profiles, and scorecards' },
                { path: '/hr/payroll', name: 'Payroll, Salaries & Compensation', desc: 'Monthly payroll runs, salary slips, policy calculations, benefits, and tax withholding' },
                { path: '/hr/attendance', name: 'Attendance, Shifts & Leaves', desc: 'Biometric punches, shift schedules, break monitoring, leave approvals, and swaps' },
                { path: '/hr/performance', name: 'Performance, OKRs & Appraisals', desc: 'Review cycles, 360 appraisal engine, 9-box talent matrix, and company OKRs' },
                { path: '/hr/orgchart', name: 'Visual Organization Chart', desc: 'Interactive graphical tree, manager reporting lines, and squad grouping matrices' },
                { path: '/hr/complaints', name: 'Complaints, Grievances & Disciplinary', desc: 'Confidential case files, incident reports, disciplinary actions, and PIPs' },
                { path: '/hr/archived', name: 'Archived Staff & Historical Records', desc: 'Past employee records, separation details, and exit interview logs' },
              ].map((routeItem) => (
                <div 
                  key={routeItem.path}
                  onClick={() => navigate('/admin/rbac/1/module/HR/tree')}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {routeItem.path}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{routeItem.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{routeItem.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-indigo-600">
                    <span>Manage permissions</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'customization' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <HRCustomizationManager />
          </div>
        )}

        {activeTab === 'custom_fields' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <CustomFieldsConfigManager />
          </div>
        )}

        {activeTab === 'pipelines' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <PipelineSetupManager />
          </div>
        )}

        {activeTab === 'integration' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <HRIntegrationManager />
          </div>
        )}

        {activeTab === 'emails' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <HREmailConfigManager />
          </div>
        )}
      </div>
    </div>
  );
};

export default HRPermissionsPage;
