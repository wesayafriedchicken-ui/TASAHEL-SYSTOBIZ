import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Building2, Users, Tag, FileText, Plus, Settings } from 'lucide-react';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';
import { OrgStructureSettingsModal, OrgStructureSettingsData } from '../../../components/HR/OrgStructureSettingsModal';
import { ModuleCustomizeLayoutDropdown } from '../../../components/HR/ModuleSchema';
import { ActionGuard } from '../../../components/Common/Guard';

export const DepartmentsLayout: React.FC = () => {
  const { departments, employees, isHRAdmin, canAddDept, showCustomToast, fetchData } = useHRContext();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOrgStructureModalOpen, setIsOrgStructureModalOpen] = useState(false);

  // Sub-tabs configuration
  const deptSubTabs = [
    { id: 'departments', path: '/hr/departments', label: 'Departments List', icon: Building2, exact: true },
    { id: 'teams', path: '/hr/departments/teams', label: 'Teams Builder', icon: Users, exact: false },
    { id: 'titles', path: '/hr/departments/titles', label: 'Job Titles', icon: Tag, exact: false },
    { id: 'descriptions', path: '/hr/departments/descriptions', label: 'Job Descriptions', icon: FileText, exact: false }
  ];

  // Determine current active section for the dynamic Add button
  const currentPath = location.pathname;
  let addLabel = 'Add New Department';
  let addPath = '/hr/departments/new';

  if (currentPath.startsWith('/hr/departments/teams')) {
    addLabel = 'Add New Team';
    addPath = '/hr/departments/teams/new';
  } else if (currentPath.startsWith('/hr/departments/titles')) {
    addLabel = 'Add New Job Title';
    addPath = '/hr/departments/titles/new';
  } else if (currentPath.startsWith('/hr/departments/descriptions')) {
    addLabel = 'Add New Job Description';
    addPath = '/hr/departments/descriptions/new';
  }

  const handleSaveOrgSettings = (newSettings: OrgStructureSettingsData) => {
    try {
      localStorage.setItem('systo_org_structure_settings', JSON.stringify(newSettings));
      showCustomToast('Organizational structure settings updated successfully!', 'success');
      setIsOrgStructureModalOpen(false);
    } catch (e) {
      showCustomToast('Failed to save settings', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Main Header & Sub-Tabs Navigation */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-800">Departments Directory</h3>
            <p className="text-xs text-slate-500 font-medium">Manage business departments, work teams, job titles, and job descriptions.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Customize Layout Dropdown */}
            <ActionGuard actionKey="hr:departments:customize_layout" module="HR" screen="departments">
              <ModuleCustomizeLayoutDropdown targetPage="departments" />
            </ActionGuard>

            {/* Structure Settings Button */}
            <button
              type="button"
              onClick={() => setIsOrgStructureModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50/90 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/80 rounded-xl font-bold transition-all text-xs justify-center cursor-pointer shadow-xs whitespace-nowrap"
              title="Configure Job Grades, Salary Bands, Hierarchy, and JD Templates"
            >
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>⚙️ Structure Settings</span>
            </button>

            {/* Dynamic + Add New Button */}
            <ActionGuard actionKey="hr:departments:create" module="HR">
              <button
                type="button"
                onClick={() => navigate(addPath)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-xs justify-center cursor-pointer font-black whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> {addLabel}
              </button>
            </ActionGuard>
          </div>
        </div>

        {/* Sub-Tabs Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 bg-slate-100 rounded-2xl w-full sm:w-fit overflow-x-auto max-w-full scrollbar-none">
            {deptSubTabs.map(tab => {
              const IconComp = tab.icon;
              const isActive = tab.exact 
                ? location.pathname === tab.path || location.pathname === `${tab.path}/` || (location.pathname.startsWith('/hr/departments') && !location.pathname.startsWith('/hr/departments/teams') && !location.pathname.startsWith('/hr/departments/titles') && !location.pathname.startsWith('/hr/departments/descriptions'))
                : location.pathname.startsWith(tab.path);

              return (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  className={cn(
                    "px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer no-underline",
                    isActive
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
                  )}
                >
                  <IconComp className="w-4 h-4" />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-Route View Content Container */}
      <div>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Organizational Structure Settings Modal */}
      {isOrgStructureModalOpen && (
        <OrgStructureSettingsModal
          isOpen={isOrgStructureModalOpen}
          onClose={() => setIsOrgStructureModalOpen(false)}
          departments={departments}
          employees={employees}
          onRefreshData={fetchData}
          showCustomToast={showCustomToast}
        />
      )}
    </div>
  );
};

export default DepartmentsLayout;
