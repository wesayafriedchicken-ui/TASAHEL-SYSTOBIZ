import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, Users, Tag, FileText, Plus, Search, Edit2, Trash2, 
  Eye, Check, X, Printer, Sparkles, UserPlus, ArrowRight, Shield, 
  Briefcase, GraduationCap, Award, CheckCircle2, ChevronRight, Layers,
  UserCheck, Download, ExternalLink, Share2, Copy, MapPin, Clock, DollarSign,
  Filter, RotateCcw, FileCheck, CheckCircle, Target, Compass, Sparkle, BadgeCheck,
  FileSpreadsheet, HelpCircle, Settings
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Employee } from '../../types';
import { 
  OrgStructureSettingsData, 
  JobGradeItem, 
  JobDescriptionTemplate, 
  INDUSTRY_PRESETS 
} from './OrgStructureSettingsModal';

export type DeptSubTabType = 'departments' | 'teams' | 'job_titles' | 'job_descriptions';

export interface DepartmentSubTabsProps {
  activeSubTab: DeptSubTabType;
  onSubTabChange: (tab: DeptSubTabType) => void;
  departments: any[];
  employees: Employee[];
  isHRAdmin?: boolean;
  canAddDept?: boolean;
  canEditDept?: boolean;
  canDeleteDept?: boolean;
  onRefreshData?: () => void;
  onNavigateToTab?: (tab: string) => void;
  showCustomToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
  orgStructureSettings?: OrgStructureSettingsData | null;
  onOpenStructureSettings?: () => void;
}

// Hook to load & sync dynamic Org Structure Settings across all sub-tabs
export const useOrgStructureSettingsData = (initialSettings?: OrgStructureSettingsData | null) => {
  const [orgSettings, setOrgSettings] = useState<OrgStructureSettingsData>(() => {
    if (initialSettings) return initialSettings;
    try {
      const stored = localStorage.getItem('systo_org_structure_settings');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return INDUSTRY_PRESETS.corporate.data;
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/hr/org-structure/settings');
      if (res.ok) {
        const data = await res.json();
        if (data && data.job_grades) {
          setOrgSettings(data);
          try {
            localStorage.setItem('systo_org_structure_settings', JSON.stringify(data));
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('Failed to fetch org structure settings:', e);
    }
  };

  useEffect(() => {
    if (initialSettings) {
      setOrgSettings(initialSettings);
      return;
    }
    fetchSettings();
  }, [initialSettings]);

  const configuredGrades: JobGradeItem[] = useMemo(() => {
    if (orgSettings?.job_grades && orgSettings.job_grades.length > 0) {
      return orgSettings.job_grades;
    }
    return INDUSTRY_PRESETS.corporate.data.job_grades;
  }, [orgSettings]);

  const configuredTemplates: JobDescriptionTemplate[] = useMemo(() => {
    if (orgSettings?.jd_templates && orgSettings.jd_templates.length > 0) {
      return orgSettings.jd_templates;
    }
    return INDUSTRY_PRESETS.corporate.data.jd_templates;
  }, [orgSettings]);

  return { orgSettings, setOrgSettings, configuredGrades, configuredTemplates, refetchSettings: fetchSettings };
};

export interface JobDescriptionDetails {
  department: string;
  team: string;
  grade: string;
  salaryBand: string;
  reportsTo: string;
  employmentType: string;
  location: string;
  status: 'Approved' | 'Draft' | 'Under Review';
  objective: string;
  responsibilities: string[];
  education: string;
  technicalSkills: string[];
  softSkills: string[];
  certifications: string[];
  kpis: string[];
  raciRole: 'Responsible' | 'Accountable' | 'Consulted' | 'Informed';
  skills?: string[]; // Backwards compatibility
}

// Predefined JD Library for default/fallback roles
export const DEFAULT_JOB_DESCRIPTIONS: Record<string, JobDescriptionDetails> = {
  'Chief Executive Officer (CEO)': {
    department: 'Executive Leadership',
    team: 'Executive Board & Corporate Governance',
    grade: 'Grade 1 / Executive Leadership (C-Level)',
    salaryBand: '$180,000 - $250,000 / year',
    reportsTo: 'No Manager / Board of Directors',
    employmentType: 'Full-Time',
    location: 'Headquarters / On-Site',
    status: 'Approved',
    objective: 'Lead overall corporate strategy, organizational governance, financial performance, and multi-departmental execution to achieve long-term company growth and stakeholder value.',
    responsibilities: [
      'Define and execute long-term corporate strategy, mission, vision, and annual performance goals.',
      'Oversee executive leadership team (C-Suite, VP, Department Directors) to drive operational efficiency and revenue profitability.',
      'Report directly to the Board of Directors on corporate governance, risk management, and capital allocation.',
      'Align company-wide KPIs, resource allocation, and organizational scaling initiatives with strategic objectives.',
      'Represent the enterprise to investors, key enterprise clients, regulatory authorities, and public media.'
    ],
    education: 'Master of Business Administration (MBA) or equivalent executive management credential.',
    technicalSkills: ['Corporate Strategy', 'Financial Governance', 'Executive Leadership', 'Risk Management', 'Capital Allocation', 'Stakeholder Relations'],
    softSkills: ['Visionary Leadership', 'Strategic Decision Making', 'Crisis Management', 'Executive Communication', 'Negotiation'],
    certifications: ['Certified Executive Director', 'Corporate Governance Charter'],
    kpis: [
      'Annual Corporate Revenue Growth ≥ Target %',
      'Company-Wide Profitability & EBIDTA Margin Compliance',
      'Strategic Initiative & Milestone Achievement ≥ 95%',
      'Employee Retention & Leadership Development Score ≥ 90%'
    ],
    raciRole: 'Accountable',
    skills: ['Corporate Strategy', 'Executive Leadership', 'Financial Governance']
  }
};
DEFAULT_JOB_DESCRIPTIONS['CEO'] = DEFAULT_JOB_DESCRIPTIONS['Chief Executive Officer (CEO)'];
DEFAULT_JOB_DESCRIPTIONS['Chief Executive Officer'] = DEFAULT_JOB_DESCRIPTIONS['Chief Executive Officer (CEO)'];

/* =========================================================================
   SUB-TAB NAVIGATION BAR
   ========================================================================= */
export const DepartmentSubTabsNav: React.FC<{
  activeSubTab: DeptSubTabType;
  onSubTabChange: (tab: DeptSubTabType) => void;
  onOpenStructureSettings?: () => void;
}> = ({ activeSubTab, onSubTabChange, onOpenStructureSettings }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 w-full">
      <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => onSubTabChange('departments')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
            activeSubTab === 'departments'
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          )}
        >
          <Building2 className="w-4 h-4 text-indigo-500" />
          <span>🏢 Departments List</span>
        </button>

        <button
          type="button"
          onClick={() => onSubTabChange('teams')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
            activeSubTab === 'teams'
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          )}
        >
          <Users className="w-4 h-4 text-indigo-500" />
          <span>👥 Teams Builder</span>
        </button>

        <button
          type="button"
          onClick={() => onSubTabChange('job_titles')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
            activeSubTab === 'job_titles'
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          )}
        >
          <Tag className="w-4 h-4 text-indigo-500" />
          <span>🏷️ Job Titles</span>
        </button>

        <button
          type="button"
          onClick={() => onSubTabChange('job_descriptions')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
            activeSubTab === 'job_descriptions'
              ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          )}
        >
          <FileText className="w-4 h-4 text-indigo-500" />
          <span>📜 Job Descriptions</span>
        </button>
      </div>

      {onOpenStructureSettings && (
        <button
          type="button"
          onClick={onOpenStructureSettings}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black bg-indigo-50/90 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 border border-indigo-200/80 transition-all cursor-pointer shadow-xs whitespace-nowrap ml-auto"
          title="Configure Job Grades, Salary Bands, Hierarchy, and JD Templates"
        >
          <Settings className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
          <span>⚙️ Structure Settings</span>
          <span className="text-[10px] bg-indigo-200/60 text-indigo-800 px-1.5 py-0.2 rounded font-extrabold">Config</span>
        </button>
      )}
    </div>
  );
};

/* =========================================================================
   2️⃣ TEAMS BUILDER SUB-TAB
   ========================================================================= */
export const TeamsBuilderSubTab: React.FC<DepartmentSubTabsProps> = ({
  departments,
  employees,
  isHRAdmin,
  canAddDept,
  canEditDept,
  canDeleteDept,
  onRefreshData,
  showCustomToast
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeamInfo, setEditingTeamInfo] = useState<{
    deptId: number;
    team: any;
    isEdit: boolean;
  } | null>(null);

  // Form State for Create/Edit Team
  const [teamFormDeptId, setTeamFormDeptId] = useState<number | ''>('');
  const [teamFormName, setTeamFormName] = useState('');
  const [teamFormDesc, setTeamFormDesc] = useState('');
  const [teamFormLeadId, setTeamFormLeadId] = useState<number | ''>('');
  const [teamFormMemberIds, setTeamFormMemberIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Active employees only (filter out inactive/terminated)
  const activeEmployees = useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || '').toLowerCase().trim();
      return s !== 'inactive' && s !== 'terminated' && s !== 'archived' && s !== 'disabled' && s !== 'deleted' && s !== 'suspended';
    });
  }, [employees]);

  // Flatten all teams across departments
  const allTeams = useMemo(() => {
    const list: Array<{
      teamId: string | number;
      teamName: string;
      description: string;
      deptId: number;
      deptName: string;
      teamLeadId: number | null;
      teamLeadObj: Employee | undefined;
      membersCount: number;
      membersList: Employee[];
      rawTeamObj: any;
    }> = [];

    departments.forEach((dept: any) => {
      let deptTeams: any[] = [];
      if (Array.isArray(dept.teams)) deptTeams = dept.teams;
      else if (typeof dept.teams === 'string') {
        try { deptTeams = JSON.parse(dept.teams); } catch (e) {}
      }

      const deptEmployees = activeEmployees.filter(e => e.department_id === dept.id || e.department_name === dept.name);

      deptTeams.forEach((t: any, idx: number) => {
        const teamNameStr = typeof t === 'string' ? t : (t.name || `Team ${idx + 1}`);
        const teamDescStr = typeof t === 'object' ? (t.description || '') : '';
        const leadId = typeof t === 'object' ? (t.team_lead_id || t.leader_id || null) : null;
        const leadObj = activeEmployees.find(e => e.id === leadId);

        // Members matching this team name or explicitly listed
        const teamMembers = deptEmployees.filter(e => 
          (e.team_name && (e.team_name || '').toLowerCase() === (teamNameStr || '').toLowerCase()) ||
          (t.members && Array.isArray(t.members) && t.members.includes(e.id))
        );

        list.push({
          teamId: (typeof t === 'object' && t.id) ? t.id : `${dept.id}-${idx}`,
          teamName: teamNameStr,
          description: teamDescStr,
          deptId: dept.id,
          deptName: dept.name,
          teamLeadId: leadId,
          teamLeadObj: leadObj,
          membersCount: teamMembers.length,
          membersList: teamMembers,
          rawTeamObj: t
        });
      });
    });

    return list;
  }, [departments, activeEmployees]);

  const filteredTeams = useMemo(() => {
    return allTeams.filter(t => {
      const matchesSearch = (t.teamName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (t.deptName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (t.teamLeadObj?.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      const matchesDept = selectedDeptFilter === 'all' || String(t.deptId) === selectedDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [allTeams, searchTerm, selectedDeptFilter]);

  const handleOpenCreateTeamModal = () => {
    const defaultDept = departments[0]?.id || '';
    setTeamFormDeptId(defaultDept);
    setTeamFormName('');
    setTeamFormDesc('');
    setTeamFormLeadId('');
    setTeamFormMemberIds([]);
    setEditingTeamInfo(null);
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeamModal = (t: any) => {
    setTeamFormDeptId(t.deptId);
    setTeamFormName(t.teamName);
    setTeamFormDesc(t.description || '');
    setTeamFormLeadId(t.teamLeadId || '');
    setTeamFormMemberIds(t.membersList.map((m: Employee) => m.id));
    setEditingTeamInfo({
      deptId: t.deptId,
      team: t.rawTeamObj,
      isEdit: true
    });
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormName.trim() || !teamFormDeptId) {
      if (showCustomToast) showCustomToast('Please provide Team Name and Department.', 'error');
      return;
    }

    setSaving(true);
    try {
      const targetDept = departments.find(d => d.id === Number(teamFormDeptId));
      if (!targetDept) throw new Error('Parent Department not found.');

      let currentTeams: any[] = [];
      if (Array.isArray(targetDept.teams)) currentTeams = [...targetDept.teams];
      else if (typeof targetDept.teams === 'string') {
        try { currentTeams = JSON.parse(targetDept.teams); } catch (e) { currentTeams = []; }
      }

      const teamDataObj = {
        id: editingTeamInfo?.team?.id || Date.now(),
        name: teamFormName.trim(),
        description: teamFormDesc.trim(),
        team_lead_id: teamFormLeadId ? Number(teamFormLeadId) : null,
        members: teamFormMemberIds
      };

      if (editingTeamInfo?.isEdit) {
        // Update existing team in array
        const teamIndex = currentTeams.findIndex((t: any) => 
          (typeof t === 'object' && t.id === editingTeamInfo.team?.id) ||
          (typeof t === 'string' ? t === editingTeamInfo.team : t.name === editingTeamInfo.team?.name)
        );
        if (teamIndex !== -1) {
          currentTeams[teamIndex] = teamDataObj;
        } else {
          currentTeams.push(teamDataObj);
        }
      } else {
        currentTeams.push(teamDataObj);
      }

      // Save department payload
      const payload = {
        name: targetDept.name,
        description: targetDept.description || '',
        department_head_id: targetDept.department_head_id || null,
        teams: JSON.stringify(currentTeams),
        job_titles: typeof targetDept.job_titles === 'string' ? targetDept.job_titles : JSON.stringify(targetDept.job_titles || [])
      };

      const res = await fetch(`/api/departments/${targetDept.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save team in department');

      // Update selected members team_name in employee list if selected
      if (teamFormMemberIds.length > 0) {
        for (const empId of teamFormMemberIds) {
          try {
            await fetch(`/api/hr/employees/${empId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ team_name: teamFormName.trim(), department_id: targetDept.id, department_name: targetDept.name })
            });
          } catch (e) {
            console.error('Error updating employee team_name:', e);
          }
        }
      }

      if (showCustomToast) showCustomToast(`Team "${teamFormName}" saved successfully!`, 'success');
      setIsTeamModalOpen(false);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Save team error:', err);
      if (showCustomToast) showCustomToast(err.message || 'Error saving team', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (t: any) => {
    if (!confirm(`Are you sure you want to delete team "${t.teamName}" from ${t.deptName}?`)) return;

    try {
      const targetDept = departments.find(d => d.id === t.deptId);
      if (!targetDept) return;

      let currentTeams: any[] = [];
      if (Array.isArray(targetDept.teams)) currentTeams = [...targetDept.teams];
      else if (typeof targetDept.teams === 'string') {
        try { currentTeams = JSON.parse(targetDept.teams); } catch (e) { currentTeams = []; }
      }

      const updatedTeams = currentTeams.filter((item: any) => {
        if (typeof item === 'string') return (item || '').toLowerCase() !== (t.teamName || '').toLowerCase();
        return item.id !== t.teamId && item.name?.toLowerCase() !== (t.teamName || '').toLowerCase();
      });

      const payload = {
        name: targetDept.name,
        description: targetDept.description || '',
        department_head_id: targetDept.department_head_id || null,
        teams: JSON.stringify(updatedTeams),
        job_titles: typeof targetDept.job_titles === 'string' ? targetDept.job_titles : JSON.stringify(targetDept.job_titles || [])
      };

      const res = await fetch(`/api/departments/${targetDept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to delete team');
      if (showCustomToast) showCustomToast(`Team "${t.teamName}" removed successfully!`, 'success');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      if (showCustomToast) showCustomToast('Error deleting team', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">Teams Builder</h3>
          <p className="text-xs text-slate-500 font-medium">Manage company work teams, assign team leads, and organize team members.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search teams or leaders..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={e => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d: any) => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </select>

          {/* Create Team Button */}
          {(isHRAdmin || canAddDept) && (
            <button
              type="button"
              onClick={handleOpenCreateTeamModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Team</span>
            </button>
          )}
        </div>
      </div>

      {/* Teams Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-slate-400 space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No teams found matching criteria.</p>
            <p className="text-xs text-slate-400">Click "+ Create Team" above to configure teams for your business departments.</p>
          </div>
        ) : (
          filteredTeams.map((t) => (
            <div
              key={t.teamId}
              className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0">
                    <Users className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditTeamModal(t)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="Edit Team & Members"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(t)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Team"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-base font-black text-slate-900">{t.teamName}</h4>
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-lg border border-indigo-100">
                    {t.deptName}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                  {t.description || `Specialized team operating within the ${t.deptName} department.`}
                </p>

                {/* Team Lead Section */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold text-[11px]">Team Leader:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black uppercase">
                      {t.teamLeadObj?.name ? t.teamLeadObj.name.charAt(0) : '?'}
                    </div>
                    <span className="font-bold text-slate-800">{t.teamLeadObj?.name || 'Unassigned Leader'}</span>
                  </div>
                </div>
              </div>

              {/* Members Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {t.membersList.slice(0, 4).map((m, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-700 uppercase"
                        title={m.name}
                      >
                        {m.name.charAt(0)}
                      </div>
                    ))}
                    {t.membersList.length > 4 && (
                      <div className="w-7 h-7 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-[9px] font-black text-white">
                        +{t.membersList.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-extrabold text-slate-600 pl-1">
                    {t.membersCount} {t.membersCount === 1 ? 'member' : 'members'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEditTeamModal(t)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
                >
                  <span>Manage</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT TEAM MODAL */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingTeamInfo?.isEdit ? 'Edit Team Details' : 'Create New Team'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Assign department, leader, and pull members from company directory.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTeamModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeam} className="space-y-4">
              {/* Parent Department */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Parent Department *
                </label>
                <select
                  required
                  value={teamFormDeptId}
                  onChange={e => setTeamFormDeptId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Select Parent Department...</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Team Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Development, QA Automation, Recruitment Team"
                  value={teamFormName}
                  onChange={e => setTeamFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Focus / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of team objectives and responsibilities..."
                  value={teamFormDesc}
                  onChange={e => setTeamFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {/* Team Leader */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assign Team Leader
                </label>
                <select
                  value={teamFormLeadId}
                  onChange={e => setTeamFormLeadId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="">-- Unassigned Leader --</option>
                  {activeEmployees.map((e: Employee) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.job_title || 'Employee'} - {e.department_name || 'HR'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Team Members */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assign Team Members ({teamFormMemberIds.length} selected)
                </label>
                <div className="max-h-36 overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1.5">
                  {activeEmployees.map((emp: Employee) => {
                    const isSelected = teamFormMemberIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={cn(
                          "flex items-center justify-between p-2 rounded-lg text-xs font-bold cursor-pointer transition-all",
                          isSelected ? "bg-indigo-50 text-indigo-900 border border-indigo-200" : "hover:bg-white text-slate-700"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              if (e.target.checked) {
                                setTeamFormMemberIds([...teamFormMemberIds, emp.id]);
                              } else {
                                setTeamFormMemberIds(teamFormMemberIds.filter(id => id !== emp.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{emp.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">({emp.job_title || 'Employee'})</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2"
                >
                  {saving ? 'Saving...' : 'Save Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   3️⃣ JOB TITLES SUB-TAB
   ========================================================================= */

export const syncJobTitleAndDescriptionEdits = async ({
  oldTitle,
  newTitle,
  newDepartmentName,
  newGradeName,
  newTeamName,
  jdDetails,
  departments,
  employees,
  setCustomJDs
}: {
  oldTitle: string;
  newTitle: string;
  newDepartmentName: string;
  newGradeName: string;
  newTeamName?: string;
  jdDetails: JobDescriptionDetails;
  departments: any[];
  employees: Employee[];
  setCustomJDs?: React.Dispatch<React.SetStateAction<Record<string, JobDescriptionDetails>>>;
}) => {
  const normOld = oldTitle.trim().toLowerCase();
  const normNew = newTitle.trim().toLowerCase();
  const isTitleRenamed = normOld !== normNew;
  const targetTeamName = (newTeamName || '').trim();
  const normTargetTeam = (targetTeamName || '').toLowerCase();

  // 1. Update/Save JD in Backend DB
  try {
    const resGet = await fetch('/api/job_descriptions');
    if (resGet.ok) {
      const dbJDs = await resGet.json();
      
      if (isTitleRenamed) {
        const existingOld = dbJDs.find((item: any) => item.title?.trim().toLowerCase() === normOld);
        if (existingOld && existingOld.id) {
          await fetch(`/api/job_descriptions/${existingOld.id}`, {
            method: 'DELETE',
            headers: { 'x-user-id': '1' }
          });
        }
      }

      const existingNew = dbJDs.find((item: any) => item.title?.trim().toLowerCase() === normNew);
      const payload = {
        title: newTitle.trim(),
        department: newDepartmentName || jdDetails.department,
        team: targetTeamName || jdDetails.team || '',
        grade: newGradeName || jdDetails.grade || '',
        salary_band: jdDetails.salaryBand || '',
        reports_to: jdDetails.reportsTo || '',
        employment_type: jdDetails.employmentType || 'Full-Time',
        location: jdDetails.location || 'On-Site',
        status: jdDetails.status || 'Approved',
        objective: jdDetails.objective || '',
        responsibilities: JSON.stringify(jdDetails.responsibilities || []),
        education: jdDetails.education || '',
        technical_skills: JSON.stringify(jdDetails.technicalSkills || []),
        soft_skills: JSON.stringify(jdDetails.softSkills || []),
        certifications: JSON.stringify(jdDetails.certifications || []),
        kpis: JSON.stringify(jdDetails.kpis || []),
        raci_role: jdDetails.raciRole || 'Responsible',
        jd_data: JSON.stringify({
          ...jdDetails,
          department: newDepartmentName || jdDetails.department,
          grade: newGradeName || jdDetails.grade,
          team: targetTeamName || jdDetails.team
        })
      };

      if (existingNew && existingNew.id) {
        await fetch(`/api/job_descriptions/${existingNew.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/job_descriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
          body: JSON.stringify(payload)
        });
      }
    }
  } catch (err) {
    console.warn('Backend sync JD error:', err);
  }

  // Update local storage custom_jds cache
  try {
    const storedRaw = localStorage.getItem('systo_custom_jds');
    let customMap: Record<string, JobDescriptionDetails> = storedRaw ? JSON.parse(storedRaw) : {};
    if (isTitleRenamed) {
      delete customMap[oldTitle];
    }
    customMap[newTitle] = {
      ...jdDetails,
      department: newDepartmentName || jdDetails.department,
      grade: newGradeName || jdDetails.grade,
      team: targetTeamName || jdDetails.team
    };
    localStorage.setItem('systo_custom_jds', JSON.stringify(customMap));
    if (setCustomJDs) {
      setCustomJDs(customMap);
    }
  } catch (e) {}

  // 2. Sync Departments & Teams in Backend DB
  try {
    for (const dept of (departments || [])) {
      let deptTitles: any[] = [];
      if (Array.isArray(dept.job_titles)) deptTitles = [...dept.job_titles];
      else if (typeof dept.job_titles === 'string') {
        try { deptTitles = JSON.parse(dept.job_titles); } catch (e) {}
      }

      let isDeptModified = false;
      const isTargetDept = dept.name?.trim().toLowerCase() === newDepartmentName?.trim().toLowerCase();

      const oldIndex = deptTitles.findIndex((jt: any) => {
        const str = typeof jt === 'string' ? jt : (jt?.title || jt?.name);
        return str?.trim().toLowerCase() === normOld;
      });

      if (oldIndex !== -1) {
        if (!isTargetDept && newDepartmentName) {
          deptTitles.splice(oldIndex, 1);
          isDeptModified = true;
        } else {
          deptTitles[oldIndex] = {
            title: newTitle,
            level: newGradeName || (typeof deptTitles[oldIndex] === 'object' ? deptTitles[oldIndex].level : 'Grade 3'),
            team: targetTeamName
          };
          isDeptModified = true;
        }
      } else if (isTargetDept) {
        const newIndex = deptTitles.findIndex((jt: any) => {
          const str = typeof jt === 'string' ? jt : (jt?.title || jt?.name);
          return str?.trim().toLowerCase() === normNew;
        });

        if (newIndex !== -1) {
          deptTitles[newIndex] = {
            title: newTitle,
            level: newGradeName || (typeof deptTitles[newIndex] === 'object' ? deptTitles[newIndex].level : 'Grade 3'),
            team: targetTeamName
          };
          isDeptModified = true;
        } else {
          deptTitles.push({
            title: newTitle,
            level: newGradeName || 'Grade 3',
            team: targetTeamName
          });
          isDeptModified = true;
        }
      }

      // Check teams in department
      let deptTeams: any[] = [];
      if (Array.isArray(dept.teams)) deptTeams = [...dept.teams];
      else if (typeof dept.teams === 'string') {
        try { deptTeams = JSON.parse(dept.teams); } catch (e) {}
      }

      let isTeamsModified = false;

      if (isTargetDept) {
        // Step A: Remove normOld / normNew from teams where it shouldn't be
        deptTeams = deptTeams.map((t: any) => {
          if (typeof t === 'object' && t) {
            const tNameNorm = (t.name || '').trim().toLowerCase();
            let tTitles = Array.isArray(t.job_titles) ? [...t.job_titles] : (Array.isArray(t.jobTitles) ? [...t.jobTitles] : []);

            if (normTargetTeam && tNameNorm !== normTargetTeam) {
              const filtered = tTitles.filter((x: any) => {
                const str = typeof x === 'string' ? x : (x.title || x.name);
                const normStr = str?.trim().toLowerCase();
                return normStr !== normOld && normStr !== normNew;
              });
              if (filtered.length !== tTitles.length) {
                isTeamsModified = true;
                return { ...t, job_titles: filtered, jobTitles: filtered };
              }
            } else if (!normTargetTeam) {
              // No specific team assigned -> update title if renamed
              const updatedTTitles = tTitles.map((x: any) => {
                const str = typeof x === 'string' ? x : (x.title || x.name);
                if (str?.trim().toLowerCase() === normOld) return newTitle;
                return x;
              });
              if (JSON.stringify(updatedTTitles) !== JSON.stringify(tTitles)) {
                isTeamsModified = true;
                return { ...t, job_titles: updatedTTitles, jobTitles: updatedTTitles };
              }
            }
          }
          return t;
        });

        // Step B: Ensure normTargetTeam contains newTitle if targetTeamName is set
        if (normTargetTeam) {
          const existingTeamIdx = deptTeams.findIndex((t: any) => {
            const nameStr = typeof t === 'string' ? t : t?.name;
            return nameStr?.trim().toLowerCase() === normTargetTeam;
          });

          if (existingTeamIdx !== -1) {
            const tObj = deptTeams[existingTeamIdx];
            let tTitles = Array.isArray(tObj.job_titles) ? [...tObj.job_titles] : (Array.isArray(tObj.jobTitles) ? [...tObj.jobTitles] : []);
            const exists = tTitles.some((x: any) => {
              const str = typeof x === 'string' ? x : (x.title || x.name);
              return str?.trim().toLowerCase() === normNew;
            });

            if (!exists) {
              tTitles.push(newTitle);
              deptTeams[existingTeamIdx] = {
                ...tObj,
                job_titles: tTitles,
                jobTitles: tTitles
              };
              isTeamsModified = true;
            }
          } else {
            // Create the new team entry in dept.teams
            const newTeamObj = {
              id: Date.now(),
              name: targetTeamName,
              description: `Specialized team operating under ${dept.name}`,
              job_titles: [newTitle],
              jobTitles: [newTitle]
            };
            deptTeams.push(newTeamObj);
            isTeamsModified = true;
          }
        }
      } else {
        // Non-target department: remove normOld from teams
        deptTeams = deptTeams.map((t: any) => {
          if (typeof t === 'object' && t) {
            let tTitles = Array.isArray(t.job_titles) ? [...t.job_titles] : (Array.isArray(t.jobTitles) ? [...t.jobTitles] : []);
            const filtered = tTitles.filter((x: any) => {
              const str = typeof x === 'string' ? x : (x.title || x.name);
              return str?.trim().toLowerCase() !== normOld;
            });
            if (filtered.length !== tTitles.length) {
              isTeamsModified = true;
              return { ...t, job_titles: filtered, jobTitles: filtered };
            }
          }
          return t;
        });
      }

      if (isDeptModified || isTeamsModified) {
        const payload = {
          name: dept.name,
          description: dept.description || '',
          department_head_id: dept.department_head_id || null,
          teams: JSON.stringify(deptTeams),
          job_titles: JSON.stringify(deptTitles)
        };
        await fetch(`/api/departments/${dept.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
          body: JSON.stringify(payload)
        });
      }
    }
  } catch (err) {
    console.warn('Department sync error:', err);
  }

  // 3. Sync Employees in Backend DB if renamed or department changed
  if (isTitleRenamed || newDepartmentName) {
    const affectedEmps = (employees || []).filter(e => 
      e.job_title && e.job_title.trim().toLowerCase() === normOld
    );

    for (const emp of affectedEmps) {
      try {
        const empPayload: any = {};
        if (isTitleRenamed) empPayload.job_title = newTitle;
        if (targetTeamName) empPayload.team_name = targetTeamName;
        if (newDepartmentName) {
          const targetDept = departments.find(d => d.name?.trim().toLowerCase() === newDepartmentName.trim().toLowerCase());
          if (targetDept) {
            empPayload.department_id = targetDept.id;
            empPayload.department_name = targetDept.name;
          }
        }

        if (Object.keys(empPayload).length > 0) {
          const empId = emp.user_id || emp.id;
          await fetch(`/api/hr/employees/${empId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
            body: JSON.stringify(empPayload)
          });
          if (empPayload.job_title) emp.job_title = empPayload.job_title;
          if (empPayload.team_name) emp.team_name = empPayload.team_name;
          if (empPayload.department_name) emp.department_name = empPayload.department_name;
          if (empPayload.department_id) emp.department_id = empPayload.department_id;
        }
      } catch (err) {
        console.warn(`Failed to sync employee ${emp.id}:`, err);
      }
    }
  }
};

export const JobTitlesSubTab: React.FC<DepartmentSubTabsProps> = ({
  departments,
  employees,
  isHRAdmin,
  canAddDept,
  onRefreshData,
  onSubTabChange,
  showCustomToast,
  orgStructureSettings,
  onOpenStructureSettings
}) => {
  const { configuredGrades } = useOrgStructureSettingsData(orgStructureSettings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);

  // Edit Job Title State
  const [isEditTitleModalOpen, setIsEditTitleModalOpen] = useState(false);
  const [editingTitleInfo, setEditingTitleInfo] = useState<{
    oldTitle: string;
    oldDeptId: number;
    titleName: string;
    titleDeptId: number | '';
    titleTeamName: string;
    titleGrade: string;
  } | null>(null);

  // Modal Form State
  const [titleDeptId, setTitleDeptId] = useState<number | ''>('');
  const [titleName, setTitleName] = useState('');
  const [titleTeamName, setTitleTeamName] = useState('');
  const [titleGrade, setTitleGrade] = useState(() => {
    const first = configuredGrades[0];
    return first ? `${first.code} - ${first.name}` : 'L3 - Senior Specialist';
  });
  const [saving, setSaving] = useState(false);

  // Active employees only (filter out inactive/terminated)
  const activeEmployees = useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || '').toLowerCase().trim();
      return s !== 'inactive' && s !== 'terminated' && s !== 'archived' && s !== 'disabled' && s !== 'deleted' && s !== 'suspended';
    });
  }, [employees]);

  // Helper to get available team names for a given department ID
  const getAvailableTeamsForDept = (deptId: number | '') => {
    if (!deptId) return [];
    const dept = departments.find((d: any) => d.id === Number(deptId));
    if (!dept) return [];

    let deptTeams: any[] = [];
    if (Array.isArray(dept.teams)) deptTeams = dept.teams;
    else if (typeof dept.teams === 'string') {
      try { deptTeams = JSON.parse(dept.teams); } catch (e) {}
    }

    const teamNames = new Set<string>();
    deptTeams.forEach((t: any) => {
      const nameStr = typeof t === 'string' ? t : t?.name;
      if (nameStr && nameStr.trim()) teamNames.add(nameStr.trim());
    });

    return Array.from(teamNames);
  };

  // Aggregate job titles across departments & employees
  const allJobTitles = useMemo(() => {
    const list: Array<{
      title: string;
      deptId: number;
      deptName: string;
      teamName: string;
      grade: string;
      employeesCount: number;
    }> = [];

    const titleSeen = new Set<string>();

    departments.forEach((dept: any) => {
      let deptTitles: any[] = [];
      if (Array.isArray(dept.job_titles)) deptTitles = dept.job_titles;
      else if (typeof dept.job_titles === 'string') {
        try { deptTitles = JSON.parse(dept.job_titles); } catch (e) {}
      }

      let deptTeams: any[] = [];
      if (Array.isArray(dept.teams)) deptTeams = dept.teams;
      else if (typeof dept.teams === 'string') {
        try { deptTeams = JSON.parse(dept.teams); } catch (e) {}
      }

      deptTitles.forEach((jt: any) => {
        const titleStr = typeof jt === 'string' ? jt : (jt.title || jt.name);
        if (!titleStr) return;

        const key = `${(titleStr || '').toLowerCase()}-${dept.id}`;
        titleSeen.add(key);

        let assignedTeamName = (typeof jt === 'object' && jt.team) ? jt.team : '';
        if (!assignedTeamName) {
          const matchedTeam = deptTeams.find((t: any) => {
            const tTitles = Array.isArray(t.job_titles) ? t.job_titles : (Array.isArray(t.jobTitles) ? t.jobTitles : []);
            return tTitles.some((x: any) => (typeof x === 'string' ? x : (x.title || x.name))?.toLowerCase() === (titleStr || '').toLowerCase());
          });
          if (matchedTeam) {
            assignedTeamName = typeof matchedTeam === 'string' ? matchedTeam : matchedTeam.name;
          }
        }
        if (!assignedTeamName) {
          assignedTeamName = DEFAULT_JOB_DESCRIPTIONS[titleStr]?.team || '';
        }

        const empCount = activeEmployees.filter(e => 
          e.job_title && (e.job_title || '').toLowerCase() === (titleStr || '').toLowerCase()
        ).length;

        list.push({
          title: titleStr,
          deptId: dept.id,
          deptName: dept.name,
          teamName: assignedTeamName || 'General / Unassigned',
          grade: (typeof jt === 'object' && jt.level)
            ? (typeof jt.level === 'string' ? jt.level : ((jt.level as any).title || (jt.level as any).name || String(jt.level)))
            : (DEFAULT_JOB_DESCRIPTIONS[titleStr]?.grade || (configuredGrades[2] ? `${configuredGrades[2].code} - ${configuredGrades[2].name}` : 'L3 - Senior Specialist')),
          employeesCount: empCount
        });
      });
    });

    // Also include employee job titles that might not be explicitly listed in department
    activeEmployees.forEach(emp => {
      if (!emp.job_title) return;
      const deptId = emp.department_id || 0;
      const key = `${(emp.job_title || '').toLowerCase()}-${deptId}`;

      if (!titleSeen.has(key)) {
        titleSeen.add(key);
        const deptObj = departments.find(d => d.id === deptId);
        const empCount = activeEmployees.filter(e => e.job_title && (e.job_title || '').toLowerCase() === (emp.job_title || '').toLowerCase()).length;

        list.push({
          title: emp.job_title,
          deptId: deptId,
          deptName: deptObj?.name || emp.department_name || 'General Operations',
          teamName: emp.team_name || DEFAULT_JOB_DESCRIPTIONS[emp.job_title]?.team || 'General / Unassigned',
          grade: DEFAULT_JOB_DESCRIPTIONS[emp.job_title]?.grade || (configuredGrades[2] ? `${configuredGrades[2].code} - ${configuredGrades[2].name}` : 'L3 - Senior Specialist'),
          employeesCount: empCount
        });
      }
    });

    return list;
  }, [departments, activeEmployees, configuredGrades]);

  const filteredTitles = useMemo(() => {
    return allJobTitles.filter(t => {
      const matchesSearch = (t.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (t.deptName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (t.teamName || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (t.grade || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      const matchesDept = selectedDeptFilter === 'all' || String(t.deptId) === selectedDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [allJobTitles, searchTerm, selectedDeptFilter]);

  const handleOpenAddTitleModal = () => {
    setTitleDeptId(departments[0]?.id || '');
    setTitleName('');
    setTitleTeamName('');
    const defaultGradeObj = configuredGrades[2] || configuredGrades[0];
    setTitleGrade(defaultGradeObj ? `${defaultGradeObj.code} - ${defaultGradeObj.name}` : 'L3 - Senior Specialist');
    setIsTitleModalOpen(true);
  };

  const handleOpenEditTitleModal = (item: {
    title: string;
    deptId: number;
    deptName: string;
    teamName: string;
    grade: string;
  }) => {
    setEditingTitleInfo({
      oldTitle: item.title,
      oldDeptId: item.deptId,
      titleName: item.title,
      titleDeptId: item.deptId,
      titleTeamName: (item.teamName && item.teamName !== 'General / Unassigned') ? item.teamName : '',
      titleGrade: item.grade || (configuredGrades[2] ? `${configuredGrades[2].code} - ${configuredGrades[2].name}` : 'L3 - Senior Specialist')
    });
    setIsEditTitleModalOpen(true);
  };

  const handleSaveEditTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTitleInfo || !editingTitleInfo.titleName.trim() || !editingTitleInfo.titleDeptId) {
      if (showCustomToast) showCustomToast('Please select Department and enter Job Title Name.', 'error');
      return;
    }

    setSaving(true);
    try {
      const targetDept = departments.find(d => d.id === Number(editingTitleInfo.titleDeptId));
      if (!targetDept) throw new Error('Department not found.');

      const existingJd = DEFAULT_JOB_DESCRIPTIONS[editingTitleInfo.oldTitle] || DEFAULT_JOB_DESCRIPTIONS[editingTitleInfo.titleName] || {
        department: targetDept.name,
        team: editingTitleInfo.titleTeamName.trim(),
        grade: editingTitleInfo.titleGrade,
        salaryBand: '',
        reportsTo: `${targetDept.name} Manager`,
        employmentType: 'Full-Time',
        location: 'On-Site',
        status: 'Approved',
        objective: `Drive key deliverables as a ${editingTitleInfo.titleName.trim()} within ${targetDept.name}.`,
        responsibilities: [`Execute primary deliverables for ${editingTitleInfo.titleName.trim()}.`],
        education: "Bachelor's degree or equivalent practical experience.",
        technicalSkills: ['Core Domain Knowledge'],
        softSkills: ['Teamwork', 'Communication'],
        certifications: [],
        kpis: ['Quarterly Milestone Completion ≥ 90%'],
        raciRole: 'Responsible'
      };

      await syncJobTitleAndDescriptionEdits({
        oldTitle: editingTitleInfo.oldTitle,
        newTitle: editingTitleInfo.titleName.trim(),
        newDepartmentName: targetDept.name,
        newGradeName: editingTitleInfo.titleGrade,
        newTeamName: editingTitleInfo.titleTeamName.trim(),
        jdDetails: {
          ...existingJd,
          department: targetDept.name,
          grade: editingTitleInfo.titleGrade,
          team: editingTitleInfo.titleTeamName.trim()
        },
        departments,
        employees
      });

      if (showCustomToast) showCustomToast(`Job Title "${editingTitleInfo.titleName}" updated & synchronized successfully!`, 'success');
      setIsEditTitleModalOpen(false);
      setEditingTitleInfo(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      if (showCustomToast) showCustomToast('Error updating job title', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleName.trim() || !titleDeptId) {
      if (showCustomToast) showCustomToast('Please select Department and enter Job Title Name.', 'error');
      return;
    }

    setSaving(true);
    try {
      const targetDept = departments.find(d => d.id === Number(titleDeptId));
      if (!targetDept) throw new Error('Department not found.');

      const finalTitle = titleName.trim();
      const finalTeam = titleTeamName.trim();

      const newJdDetails: JobDescriptionDetails = {
        department: targetDept.name,
        team: finalTeam,
        grade: titleGrade || 'Grade 3 / Mid-Senior',
        salaryBand: '',
        reportsTo: `${targetDept.name} Manager`,
        employmentType: 'Full-Time',
        location: 'On-Site',
        status: 'Approved',
        objective: `Drive key deliverables as a ${finalTitle} within ${targetDept.name}.`,
        responsibilities: [`Execute primary deliverables for ${finalTitle}.`],
        education: "Bachelor's degree or equivalent practical experience.",
        technicalSkills: ['Core Domain Knowledge'],
        softSkills: ['Teamwork', 'Communication'],
        certifications: [],
        kpis: ['Quarterly Milestone Completion ≥ 90%'],
        raciRole: 'Responsible'
      };

      await syncJobTitleAndDescriptionEdits({
        oldTitle: finalTitle,
        newTitle: finalTitle,
        newDepartmentName: targetDept.name,
        newGradeName: titleGrade || 'Grade 3 / Mid-Senior',
        newTeamName: finalTeam,
        jdDetails: newJdDetails,
        departments,
        employees
      });

      if (showCustomToast) showCustomToast(`Job Title "${finalTitle}" added & synchronized successfully!`, 'success');
      setIsTitleModalOpen(false);
      setTitleName('');
      setTitleTeamName('');
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      if (showCustomToast) showCustomToast('Error saving job title', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800">Job Titles Directory</h3>
          <p className="text-xs text-slate-500 font-medium">Catalog of position titles, department levels, teams, and employee allocations.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search job titles, teams or levels..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDeptFilter}
            onChange={e => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500"
          >
            <option value="all">All Departments</option>
            {departments.map((d: any) => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </select>

          {/* Add Job Title Button */}
          {(isHRAdmin || canAddDept) && (
            <button
              type="button"
              onClick={handleOpenAddTitleModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Job Title</span>
            </button>
          )}
        </div>
      </div>

      {/* Job Titles Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Job Title</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Level / Grade</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Employees Count</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Actions & JD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {filteredTitles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    No job titles found. Click "+ Add Job Title" to populate titles.
                  </td>
                </tr>
              ) : (
                filteredTitles.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                          <Tag className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black text-slate-900">{t.title}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200/80">
                        {t.deptName}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-bold border border-teal-200/80">
                        {t.teamName}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-extrabold border border-indigo-100">
                        {t.grade}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-slate-800 font-extrabold">
                        {t.employeesCount} {t.employeesCount === 1 ? 'employee' : 'employees'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center justify-end gap-2">
                        {(isHRAdmin || canAddDept) && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditTitleModal(t)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer border border-amber-200/60"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit ✏️</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              localStorage.setItem('systo_selected_jd_title', t.title);
                            } catch (e) {}
                            onSubTabChange('job_descriptions');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer border border-indigo-200/60"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View JD 📜</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT JOB TITLE MODAL */}
      {isEditTitleModalOpen && editingTitleInfo && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Edit Job Title</h3>
                  <p className="text-xs text-slate-500 font-medium">Modify position details for "{editingTitleInfo.oldTitle}".</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsEditTitleModalOpen(false);
                  setEditingTitleInfo(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTitle} className="space-y-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department *
                </label>
                <select
                  required
                  value={editingTitleInfo.titleDeptId}
                  onChange={e => setEditingTitleInfo(prev => prev ? { ...prev, titleDeptId: Number(e.target.value) } : null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Title Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Title Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingTitleInfo.titleName}
                  onChange={e => setEditingTitleInfo(prev => prev ? { ...prev, titleName: e.target.value } : null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Team Selection */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Team (Assign to Team) 👥
                </label>
                <select
                  value={editingTitleInfo.titleTeamName}
                  onChange={e => setEditingTitleInfo(prev => prev ? { ...prev, titleTeamName: e.target.value } : null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="">-- General / No Specific Team --</option>
                  {getAvailableTeamsForDept(editingTitleInfo.titleDeptId).map(teamName => (
                    <option key={teamName} value={teamName}>{teamName}</option>
                  ))}
                </select>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">Or type custom team:</span>
                  <input
                    type="text"
                    placeholder="Enter new team name..."
                    value={editingTitleInfo.titleTeamName}
                    onChange={e => setEditingTitleInfo(prev => prev ? { ...prev, titleTeamName: e.target.value } : null)}
                    className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Grade / Level */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Grade / Level (📊 Org Structure) *
                  </label>
                  {onOpenStructureSettings && (
                    <button
                      type="button"
                      onClick={onOpenStructureSettings}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                      title="Manage Job Grades in Structure Settings"
                    >
                      <Settings className="w-3 h-3 text-indigo-500" />
                      <span>Manage Grades</span>
                    </button>
                  )}
                </div>
                <select
                  value={editingTitleInfo.titleGrade}
                  onChange={e => setEditingTitleInfo(prev => prev ? { ...prev, titleGrade: e.target.value } : null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                >
                  {configuredGrades.map(g => (
                    <option key={g.id || g.code} value={`${g.code} - ${g.name}`}>
                      {g.code} - {g.name} ({g.salary_band_min ? `${g.salary_band_min.toLocaleString()} - ${g.salary_band_max.toLocaleString()} ${g.currency || 'EGP'}` : g.category})
                    </option>
                  ))}
                </select>

                {/* Selected Grade Benchmark Preview */}
                {(() => {
                  const matched = configuredGrades.find(g => 
                    `${g.code} - ${g.name}` === editingTitleInfo.titleGrade || 
                    g.name === editingTitleInfo.titleGrade || 
                    g.code === editingTitleInfo.titleGrade || 
                    (editingTitleInfo.titleGrade && editingTitleInfo.titleGrade.includes(g.code))
                  );
                  if (!matched) return null;
                  return (
                    <div className="mt-2 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-200/80 text-indigo-900 rounded font-black text-[10px]">
                          {matched.code}
                        </span>
                        <span className="font-extrabold text-indigo-950">{matched.category}</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-slate-600">
                        <span>Band: <strong className="text-slate-900">{matched.salary_band_min.toLocaleString()} - {matched.salary_band_max.toLocaleString()} {matched.currency}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span className="text-indigo-700">Rank #{matched.rank_weight}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditTitleModalOpen(false);
                    setEditingTitleInfo(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-200 transition-all cursor-pointer"
                >
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD JOB TITLE MODAL */}
      {isTitleModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Add New Job Title</h3>
                  <p className="text-xs text-slate-500 font-medium">Define position title, select team, and assign to department.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTitleModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTitle} className="space-y-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department *
                </label>
                <select
                  required
                  value={titleDeptId}
                  onChange={e => setTitleDeptId(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Title Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Title Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Backend Engineer, Talent Acquisition Lead"
                  value={titleName}
                  onChange={e => setTitleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Team Selection */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Team (Assign to Team) 👥
                </label>
                <select
                  value={titleTeamName}
                  onChange={e => setTitleTeamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                >
                  <option value="">-- General / No Specific Team --</option>
                  {getAvailableTeamsForDept(titleDeptId).map(teamName => (
                    <option key={teamName} value={teamName}>{teamName}</option>
                  ))}
                </select>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">Or type custom team:</span>
                  <input
                    type="text"
                    placeholder="Enter new team name..."
                    value={titleTeamName}
                    onChange={e => setTitleTeamName(e.target.value)}
                    className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Grade / Level */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                    Grade / Level (📊 Org Structure) *
                  </label>
                  {onOpenStructureSettings && (
                    <button
                      type="button"
                      onClick={onOpenStructureSettings}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                      title="Manage Job Grades in Structure Settings"
                    >
                      <Settings className="w-3 h-3 text-indigo-500" />
                      <span>Manage Grades</span>
                    </button>
                  )}
                </div>
                <select
                  value={titleGrade}
                  onChange={e => setTitleGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none cursor-pointer"
                >
                  {configuredGrades.map(g => (
                    <option key={g.id || g.code} value={`${g.code} - ${g.name}`}>
                      {g.code} - {g.name} ({g.salary_band_min ? `${g.salary_band_min.toLocaleString()} - ${g.salary_band_max.toLocaleString()} ${g.currency || 'EGP'}` : g.category})
                    </option>
                  ))}
                </select>

                {/* Selected Grade Benchmark Preview */}
                {(() => {
                  const matched = configuredGrades.find(g => 
                    `${g.code} - ${g.name}` === titleGrade || 
                    g.name === titleGrade || 
                    g.code === titleGrade || 
                    (titleGrade && titleGrade.includes(g.code))
                  );
                  if (!matched) return null;
                  return (
                    <div className="mt-2 p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-200/80 text-indigo-900 rounded font-black text-[10px]">
                          {matched.code}
                        </span>
                        <span className="font-extrabold text-indigo-950">{matched.category}</span>
                      </div>
                      <div className="flex items-center gap-2 font-bold text-slate-600">
                        <span>Band: <strong className="text-slate-900">{matched.salary_band_min.toLocaleString()} - {matched.salary_band_max.toLocaleString()} {matched.currency}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span className="text-indigo-700">Rank #{matched.rank_weight}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTitleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-200 transition-all cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Add Job Title'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================================
   4️⃣ JOB DESCRIPTIONS (JDs) SUB-TAB (SPLIT-VIEW LAYOUT)
   ========================================================================= */
export const JobDescriptionsSubTab: React.FC<DepartmentSubTabsProps> = ({
  departments,
  employees,
  isHRAdmin,
  onNavigateToTab,
  showCustomToast,
  onRefreshData,
  orgStructureSettings,
  onOpenStructureSettings
}) => {
  const { configuredGrades, configuredTemplates } = useOrgStructureSettingsData(orgStructureSettings);
  // Custom JDs state
  const [customJDs, setCustomJDs] = useState<Record<string, JobDescriptionDetails>>({});
  const [isEditJDModalOpen, setIsEditJDModalOpen] = useState(false);
  const [isCreateJDModalOpen, setIsCreateJDModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Check if a job title was passed via localStorage navigation
  const initialTitleFromNav = () => {
    try {
      const stored = localStorage.getItem('systo_selected_jd_title');
      if (stored) {
        localStorage.removeItem('systo_selected_jd_title');
        return stored;
      }
    } catch (e) {}
    return null;
  };

  // Active employees only (filter out inactive/terminated)
  const activeEmployees = useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || '').toLowerCase().trim();
      return s !== 'inactive' && s !== 'terminated' && s !== 'archived' && s !== 'disabled' && s !== 'deleted' && s !== 'suspended';
    });
  }, [employees]);

  // Collect all available job titles from custom JDs, departments, and employees
  const availableTitles = useMemo(() => {
    const titleSet = new Set<string>();

    // Custom JDs state
    Object.keys(customJDs).forEach(t => titleSet.add(t));

    // Department assigned titles
    departments.forEach((dept: any) => {
      let deptTitles: any[] = [];
      if (Array.isArray(dept.job_titles)) deptTitles = dept.job_titles;
      else if (typeof dept.job_titles === 'string') {
        try { deptTitles = JSON.parse(dept.job_titles); } catch (e) {}
      }
      deptTitles.forEach((jt: any) => {
        const titleStr = typeof jt === 'string' ? jt : (jt.title || jt.name);
        if (titleStr) titleSet.add(titleStr);
      });
    });

    // Employee titles
    activeEmployees.forEach(e => {
      if (e.job_title) titleSet.add(e.job_title);
    });

    return Array.from(titleSet);
  }, [departments, activeEmployees, customJDs]);

  const [selectedTitle, setSelectedTitle] = useState<string>(() => {
    const navTitle = initialTitleFromNav();
    if (navTitle && availableTitles.includes(navTitle)) return navTitle;
    return availableTitles[0] || '';
  });

  useEffect(() => {
    if ((!selectedTitle || !availableTitles.includes(selectedTitle)) && availableTitles.length > 0) {
      setSelectedTitle(availableTitles[0]);
    }
  }, [availableTitles, selectedTitle]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  const [creatingOpening, setCreatingOpening] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Load custom JDs from backend DB on mount
  useEffect(() => {
    const loadJDsFromDB = async () => {
      // First load local storage cache for instant UX
      try {
        const stored = localStorage.getItem('systo_custom_jds');
        if (stored) {
          setCustomJDs(JSON.parse(stored));
        }
      } catch (e) {}

      // Fetch from backend API
      try {
        const res = await fetch('/api/job_descriptions');
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            const loadedMap: Record<string, JobDescriptionDetails> = {};
            rows.forEach((row: any) => {
              if (row.title) {
                if (row.jd_data) {
                  try {
                    loadedMap[row.title] = JSON.parse(row.jd_data);
                    return;
                  } catch (e) {}
                }
                // Fallback from flat table columns
                loadedMap[row.title] = {
                  department: row.department || 'Operations',
                  team: row.team || 'Operations Team',
                  grade: row.grade || 'Grade 3',
                  salaryBand: row.salary_band || '',
                  reportsTo: row.reports_to || 'Department Manager',
                  employmentType: row.employment_type || 'Full-Time',
                  location: row.location || 'On-Site',
                  status: row.status || 'Approved',
                  objective: row.objective || '',
                  responsibilities: typeof row.responsibilities === 'string' ? JSON.parse(row.responsibilities) : (row.responsibilities || []),
                  education: row.education || '',
                  technicalSkills: typeof row.technical_skills === 'string' ? JSON.parse(row.technical_skills) : (row.technical_skills || []),
                  softSkills: typeof row.soft_skills === 'string' ? JSON.parse(row.soft_skills) : (row.soft_skills || []),
                  certifications: typeof row.certifications === 'string' ? JSON.parse(row.certifications) : (row.certifications || []),
                  kpis: typeof row.kpis === 'string' ? JSON.parse(row.kpis) : (row.kpis || []),
                  raciRole: row.raci_role || 'Responsible',
                  skills: typeof row.technical_skills === 'string' ? JSON.parse(row.technical_skills) : (row.technical_skills || [])
                };
              }
            });
            setCustomJDs(prev => ({ ...prev, ...loadedMap }));
          }
        }
      } catch (e) {
        console.error('Error fetching job_descriptions from API:', e);
      }
    };

    loadJDsFromDB();
  }, []);

  // Helper to persist JD to DB & state
  const saveJDToBackendAndState = async (title: string, jdDetails: JobDescriptionDetails) => {
    setCustomJDs(prev => {
      const next = { ...prev, [title]: jdDetails };
      try { localStorage.setItem('systo_custom_jds', JSON.stringify(next)); } catch (e) {}
      return next;
    });

    try {
      const resGet = await fetch('/api/job_descriptions');
      if (resGet.ok) {
        const dbJDs = await resGet.json();
        const existing = dbJDs.find((item: any) => item.title === title);

        const payload = {
          title,
          department: jdDetails.department,
          team: jdDetails.team,
          grade: jdDetails.grade,
          salary_band: jdDetails.salaryBand,
          reports_to: jdDetails.reportsTo,
          employment_type: jdDetails.employmentType,
          location: jdDetails.location,
          status: jdDetails.status,
          objective: jdDetails.objective,
          responsibilities: JSON.stringify(jdDetails.responsibilities || []),
          education: jdDetails.education,
          technical_skills: JSON.stringify(jdDetails.technicalSkills || []),
          soft_skills: JSON.stringify(jdDetails.softSkills || []),
          certifications: JSON.stringify(jdDetails.certifications || []),
          kpis: JSON.stringify(jdDetails.kpis || []),
          raci_role: jdDetails.raciRole,
          jd_data: JSON.stringify(jdDetails)
        };

        if (existing && existing.id) {
          await fetch(`/api/job_descriptions/${existing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
            body: JSON.stringify(payload)
          });
        } else {
          await fetch('/api/job_descriptions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
            body: JSON.stringify(payload)
          });
        }
      }
    } catch (err) {
      console.warn('Backend sync failed, saved locally', err);
    }
  };

  // Create New JD Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newSalaryBand, setNewSalaryBand] = useState('');
  const [newReportsTo, setNewReportsTo] = useState('');
  const [newEmploymentType, setNewEmploymentType] = useState('Full-Time');
  const [newLocation, setNewLocation] = useState('Hybrid');
  const [newStatus, setNewStatus] = useState<'Approved' | 'Draft' | 'Under Review'>('Approved');
  const [newObjective, setNewObjective] = useState('');
  const [newResponsibilities, setNewResponsibilities] = useState('');
  const [newTechnicalSkills, setNewTechnicalSkills] = useState('');
  const [newSoftSkills, setNewSoftSkills] = useState('');
  const [newCertifications, setNewCertifications] = useState('');
  const [newEducation, setNewEducation] = useState('');
  const [newKpis, setNewKpis] = useState('');
  const [newRaciRole, setNewRaciRole] = useState<'Responsible' | 'Accountable' | 'Consulted' | 'Informed'>('Responsible');

  // Edit JD Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSalaryBand, setEditSalaryBand] = useState('');
  const [editReportsTo, setEditReportsTo] = useState('');
  const [editEmploymentType, setEditEmploymentType] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editStatus, setEditStatus] = useState<'Approved' | 'Draft' | 'Under Review'>('Approved');
  const [editObjective, setEditObjective] = useState('');
  const [editResponsibilities, setEditResponsibilities] = useState('');
  const [editTechnicalSkills, setEditTechnicalSkills] = useState('');
  const [editSoftSkills, setEditSoftSkills] = useState('');
  const [editCertifications, setEditCertifications] = useState('');
  const [editEducation, setEditEducation] = useState('');
  const [editKpis, setEditKpis] = useState('');
  const [editRaciRole, setEditRaciRole] = useState<'Responsible' | 'Accountable' | 'Consulted' | 'Informed'>('Responsible');

  // Apply a template blueprint from Org Structure Settings to the Create form
  const applyTemplateToForm = (tId: string) => {
    const tmpl = configuredTemplates.find(t => t.id === tId);
    if (!tmpl) return;

    setNewTitle(tmpl.name);
    if (tmpl.target_department) {
      const deptMatch = departments.find((d: any) => d.name?.toLowerCase() === tmpl.target_department.toLowerCase());
      if (deptMatch) {
        setNewDepartment(deptMatch.name);
        const teams = getTeamsForDepartment(deptMatch.name);
        setNewTeam(teams[0] || '');
      } else {
        setNewDepartment(tmpl.target_department);
      }
    }
    if (tmpl.target_grade) {
      const gradeMatch = configuredGrades.find(g => 
        g.code?.toLowerCase() === tmpl.target_grade.toLowerCase() ||
        g.name?.toLowerCase() === tmpl.target_grade.toLowerCase() ||
        `${g.code} - ${g.name}`.toLowerCase() === tmpl.target_grade.toLowerCase() ||
        tmpl.target_grade.toLowerCase().includes(g.code.toLowerCase())
      );
      if (gradeMatch) {
        setNewGrade(`${gradeMatch.code} - ${gradeMatch.name}`);
        if (gradeMatch.salary_band_min && gradeMatch.salary_band_max) {
          setNewSalaryBand(`${gradeMatch.salary_band_min.toLocaleString()} - ${gradeMatch.salary_band_max.toLocaleString()} ${gradeMatch.currency || 'EGP'} / mo`);
        }
      } else {
        setNewGrade(tmpl.target_grade);
      }
    }
    if (tmpl.employment_type) setNewEmploymentType(tmpl.employment_type);
    if (tmpl.location) setNewLocation(tmpl.location);
    if (tmpl.raci_role) setNewRaciRole(tmpl.raci_role);
    if (tmpl.objective) setNewObjective(tmpl.objective);
    if (tmpl.responsibilities && tmpl.responsibilities.length > 0) {
      setNewResponsibilities(tmpl.responsibilities.join('\n'));
    }
    if (tmpl.technical_skills && tmpl.technical_skills.length > 0) {
      setNewTechnicalSkills(tmpl.technical_skills.join(', '));
    }
    if (tmpl.soft_skills && tmpl.soft_skills.length > 0) {
      setNewSoftSkills(tmpl.soft_skills.join(', '));
    }
    if (tmpl.education) setNewEducation(tmpl.education);
    if (tmpl.certifications && tmpl.certifications.length > 0) {
      setNewCertifications(tmpl.certifications.join(', '));
    }
    if (tmpl.kpis && tmpl.kpis.length > 0) {
      setNewKpis(tmpl.kpis.join('\n'));
    }
    if (showCustomToast) {
      showCustomToast(`✨ Loaded JD Template "${tmpl.name}"!`, 'success');
    }
  };

  // Active JD details memoized
  const activeJD: JobDescriptionDetails = useMemo(() => {
    if (customJDs[selectedTitle]) return customJDs[selectedTitle];

    if (DEFAULT_JOB_DESCRIPTIONS[selectedTitle]) {
      return DEFAULT_JOB_DESCRIPTIONS[selectedTitle];
    }

    // Dynamic fallback generation for any role
    let deptName = '';
    let teamName = '';

    for (const d of (departments || [])) {
      let deptTitles: any[] = [];
      if (Array.isArray(d.job_titles)) deptTitles = d.job_titles;
      else if (typeof d.job_titles === 'string') {
        try { deptTitles = JSON.parse(d.job_titles); } catch (e) {}
      }

      const matchDeptTitle = deptTitles.some((jt: any) => {
        const titleStr = typeof jt === 'string' ? jt : (jt.title || jt.name);
        return titleStr?.toLowerCase() === (selectedTitle || '').toLowerCase();
      });

      if (matchDeptTitle) {
        deptName = d.name;
        let deptTeams: any[] = [];
        if (Array.isArray(d.teams)) deptTeams = d.teams;
        else if (typeof d.teams === 'string') {
          try { deptTeams = JSON.parse(d.teams); } catch (e) {}
        }
        for (const t of deptTeams) {
          const tJobTitles = Array.isArray(t.job_titles) ? t.job_titles : (Array.isArray(t.jobTitles) ? t.jobTitles : []);
          const matchTeamTitle = tJobTitles.some((x: any) => {
            const str = typeof x === 'string' ? x : (x.title || x.name);
            return str?.toLowerCase() === (selectedTitle || '').toLowerCase();
          });
          if (matchTeamTitle) {
            teamName = typeof t === 'string' ? t : (t.name || '');
            break;
          }
        }
        break;
      }
    }

    if (!deptName) {
      const matchedEmp = activeEmployees.find(e => e.job_title?.toLowerCase() === (selectedTitle || '').toLowerCase());
      deptName = matchedEmp?.department_name || departments[0]?.name || '';
      teamName = matchedEmp?.team_name || '';
    }

    return {
      department: deptName,
      team: teamName || '',
      grade: 'Grade 3 / Mid-Senior',
      salaryBand: '',
      reportsTo: deptName ? `${deptName} Manager` : 'Department Manager',
      employmentType: 'Full-Time',
      location: 'On-Site',
      status: 'Approved',
      objective: `Drive key operational deliverables as a ${selectedTitle} within ${deptName || 'Department'}.`,
      responsibilities: [
        `Execute primary business deliverables aligned with the ${selectedTitle} functional scope.`,
        `Collaborate with cross-functional stakeholders, team leads, and department management.`,
        `Maintain quality standards, process documentation, and operational compliance.`,
        `Proactively identify workflow bottlenecks and drive continuous optimization initiatives.`
      ],
      education: "Bachelor's degree in a relevant discipline or equivalent practical professional experience.",
      technicalSkills: ['Domain Operations', 'Project Management', 'Process Optimization'],
      softSkills: ['Stakeholder Management', 'Cross-Functional Collaboration', 'Problem Solving'],
      certifications: [],
      kpis: [
        'Quarterly Project Milestone Completion ≥ 90%',
        'Stakeholder Satisfaction Score ≥ 85%'
      ],
      raciRole: 'Responsible',
      skills: ['Domain Operations', 'Project Management', 'Process Optimization']
    };
  }, [selectedTitle, customJDs, employees, departments]);

  // Employee counts per title mapping
  const titleEmpCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activeEmployees.forEach(e => {
      if (e.job_title) {
        counts[e.job_title] = (counts[e.job_title] || 0) + 1;
      }
    });
    return counts;
  }, [activeEmployees]);

  // Directory filter list
  const filteredTitles = useMemo(() => {
    return availableTitles.filter(title => {
      const jd: JobDescriptionDetails = customJDs[title] || DEFAULT_JOB_DESCRIPTIONS[title] || { 
        department: 'Operations', 
        team: 'Operations Team',
        grade: 'Grade 3', 
        salaryBand: '',
        reportsTo: 'Manager',
        employmentType: 'Full-Time',
        location: 'On-Site',
        status: 'Approved',
        objective: '',
        responsibilities: [],
        education: '',
        technicalSkills: [],
        softSkills: [],
        certifications: [],
        kpis: [],
        raciRole: 'Responsible',
        skills: []
      };
      
      // Search filter
      const matchesSearch = !searchTerm || 
        (title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (jd?.department || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        (jd?.technicalSkills || jd?.skills || []).some((s: any) => (s || '').toString().toLowerCase().includes((searchTerm || '').toLowerCase()));

      // Dept filter
      const matchesDept = selectedDeptFilter === 'all' || 
        (jd?.department || '').toLowerCase() === (selectedDeptFilter || '').toLowerCase();

      // Status filter
      const matchesStatus = selectedStatusFilter === 'all' || 
        (jd?.status || '').toLowerCase() === (selectedStatusFilter || '').toLowerCase();

      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [availableTitles, customJDs, searchTerm, selectedDeptFilter, selectedStatusFilter]);

  // Edit JD Modal Opener
  const handleOpenEditJDModal = () => {
    setEditTitle(selectedTitle);
    setEditDepartment(activeJD.department || '');
    setEditTeam(activeJD.team || '');
    setEditGrade(activeJD.grade || '');
    setEditSalaryBand(activeJD.salaryBand || '');
    setEditReportsTo(activeJD.reportsTo || '');
    setEditEmploymentType(activeJD.employmentType || 'Full-Time');
    setEditLocation(activeJD.location || 'On-Site');
    setEditStatus(activeJD.status || 'Approved');
    setEditObjective(activeJD.objective || '');
    setEditResponsibilities((activeJD.responsibilities || []).join('\n'));
    setEditTechnicalSkills((activeJD.technicalSkills || activeJD.skills || []).join(', '));
    setEditSoftSkills((activeJD.softSkills || []).join(', '));
    setEditCertifications((activeJD.certifications || []).join(', '));
    setEditEducation(activeJD.education || '');
    setEditKpis((activeJD.kpis || []).join('\n'));
    setEditRaciRole(activeJD.raciRole || 'Responsible');
    setIsEditJDModalOpen(true);
  };

  // Delete confirmation modal state
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [jdTitleToDelete, setJdTitleToDelete] = useState('');
  const [affectedEmployeesForDelete, setAffectedEmployeesForDelete] = useState<Employee[]>([]);
  const [otherJobTitlesForDelete, setOtherJobTitlesForDelete] = useState<string[]>([]);
  const [reassignTargetTitle, setReassignTargetTitle] = useState('');
  const [isDeletingJD, setIsDeletingJD] = useState(false);

  // Dynamic team filtering based on selected department
  const getTeamsForDepartment = (deptName: string) => {
    if (!deptName) return [];
    const foundDept = (departments || []).find((d: any) => d.name?.toLowerCase() === (deptName || '').toLowerCase());
    let deptTeams: string[] = [];

    if (foundDept) {
      let rawTeams: any[] = [];
      if (Array.isArray(foundDept.teams)) rawTeams = foundDept.teams;
      else if (typeof foundDept.teams === 'string') {
        try { rawTeams = JSON.parse(foundDept.teams); } catch (e) {}
      }
      deptTeams = rawTeams.map((t: any) => (typeof t === 'string' ? t : (t.name || t.title))).filter(Boolean);
    }

    return deptTeams;
  };

  // Team options for Edit modal based on editDepartment
  const editTeamOptions = useMemo(() => {
    const teams = getTeamsForDepartment(editDepartment);
    if (editTeam && !teams.includes(editTeam)) {
      return [editTeam, ...teams];
    }
    return teams;
  }, [editDepartment, editTeam, departments]);

  // Team options for Create modal based on newDepartment
  const newTeamOptions = useMemo(() => {
    const teams = getTeamsForDepartment(newDepartment);
    if (newTeam && !teams.includes(newTeam)) {
      return [newTeam, ...teams];
    }
    return teams;
  }, [newDepartment, newTeam, departments]);

  // Request Delete Job Description & Title (Open Confirmation Modal)
  const handleRequestDeleteJD = (titleToDelete: string) => {
    const affected = activeEmployees.filter(e => 
      e.job_title && e.job_title.trim().toLowerCase() === titleToDelete.trim().toLowerCase()
    );
    const otherTitles = availableTitles.filter(t => t.trim().toLowerCase() !== titleToDelete.trim().toLowerCase());

    setJdTitleToDelete(titleToDelete);
    setAffectedEmployeesForDelete(affected);
    setOtherJobTitlesForDelete(otherTitles);
    setReassignTargetTitle(otherTitles[0] || '');
    setIsDeleteConfirmModalOpen(true);
  };

  // Execute Deletion of JD and Job Title + Employee Transfer
  const handleExecuteDeleteJDAndTitle = async () => {
    if (!jdTitleToDelete) return;
    setIsDeletingJD(true);

    try {
      // 1. Reassign affected employees to the selected target job title
      if (affectedEmployeesForDelete.length > 0 && reassignTargetTitle) {
        for (const emp of affectedEmployeesForDelete) {
          try {
            const empId = emp.user_id || emp.id;
            await fetch(`/api/hr/employees/${empId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
              body: JSON.stringify({ job_title: reassignTargetTitle })
            });
            emp.job_title = reassignTargetTitle;
          } catch (err) {
            console.warn(`Failed to reassign employee ${emp.id}:`, err);
          }
        }
      }

      // 2. Delete Job Description from Backend DB
      try {
        const resGet = await fetch('/api/job_descriptions');
        if (resGet.ok) {
          const dbJDs = await resGet.json();
          const existing = dbJDs.find((item: any) => item.title === jdTitleToDelete);
          if (existing && existing.id) {
            await fetch(`/api/job_descriptions/${existing.id}`, {
              method: 'DELETE',
              headers: { 'x-user-id': '1' }
            });
          }
        }
      } catch (err) {
        console.warn('Backend delete JD error:', err);
      }

      // 3. Delete Job Title from Department records in Backend
      try {
        for (const dept of departments) {
          let currentTitles: any[] = [];
          if (Array.isArray(dept.job_titles)) currentTitles = [...dept.job_titles];
          else if (typeof dept.job_titles === 'string') {
            try { currentTitles = JSON.parse(dept.job_titles); } catch (e) {}
          }

          const filtered = currentTitles.filter((jt: any) => {
            const titleStr = typeof jt === 'string' ? jt : (jt.title || jt.name);
            return titleStr && (titleStr || '').toLowerCase() !== (jdTitleToDelete || '').toLowerCase();
          });

          if (filtered.length !== currentTitles.length) {
            const payload = {
              name: dept.name,
              description: dept.description || '',
              department_head_id: dept.department_head_id || null,
              teams: typeof dept.teams === 'string' ? dept.teams : JSON.stringify(dept.teams || []),
              job_titles: JSON.stringify(filtered)
            };
            await fetch(`/api/departments/${dept.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
              body: JSON.stringify(payload)
            });
          }
        }
      } catch (err) {
        console.warn('Department update error:', err);
      }

      // 4. Update customJDs state & LocalStorage
      setCustomJDs(prev => {
        const next = { ...prev };
        delete next[jdTitleToDelete];
        try { localStorage.setItem('systo_custom_jds', JSON.stringify(next)); } catch (e) {}
        return next;
      });

      // 5. Update selectedTitle
      const remaining = availableTitles.filter(t => (t || '').toLowerCase() !== (jdTitleToDelete || '').toLowerCase());
      if (remaining.length > 0) {
        setSelectedTitle(remaining[0]);
      }

      // 6. Toast & Refresh
      const msg = affectedEmployeesForDelete.length > 0
        ? `تم حذف الوصف والمسمى الوظيفي "${jdTitleToDelete}" ونقل ${affectedEmployeesForDelete.length} موظف إلى "${reassignTargetTitle}".`
        : `تم حذف الوصف الوظيفي والمسمى الوظيفي "${jdTitleToDelete}" بنجاح.`;

      if (showCustomToast) showCustomToast(msg, 'info');
      if (onRefreshData) onRefreshData();

    } catch (error) {
      console.error('Delete JD error:', error);
      if (showCustomToast) showCustomToast('حدث خطأ أثناء حذف الوصف الوظيفي', 'error');
    } finally {
      setIsDeletingJD(false);
      setIsDeleteConfirmModalOpen(false);
      if (isEditJDModalOpen) setIsEditJDModalOpen(false);
    }
  };

  // Select dropdown options for JD Modals
  const departmentOptions = useMemo(() => {
    const list = [
      'Executive Leadership',
      ...(departments || []).map((d: any) => d.name),
      editDepartment,
      newDepartment
    ].filter(Boolean);
    return Array.from(new Set(list));
  }, [departments, editDepartment, newDepartment]);

  const gradeOptions = useMemo(() => {
    const list = [
      ...configuredGrades.map(g => `${g.code} - ${g.name}`),
      editGrade,
      newGrade
    ].filter(Boolean);
    return Array.from(new Set(list));
  }, [configuredGrades, editGrade, newGrade]);

  const reportsToOptions = useMemo(() => {
    const list = [
      'No Manager / Board of Directors',
      'CEO / Chief Executive Officer',
      'COO / Chief Operating Officer',
      'CTO / Chief Technology Officer',
      'CFO / Chief Financial Officer',
      'Head of Human Resources / HR Director',
      'VP of Engineering',
      'VP of Marketing & Growth',
      'Sales Director / VP Sales',
      'Department Manager',
      'Operations Director',
      'Team Lead / Supervisor',
      'General Manager',
      editReportsTo,
      newReportsTo
    ].filter(Boolean);
    return Array.from(new Set(list));
  }, [editReportsTo, newReportsTo]);

  // Open Create New JD Modal
  const handleOpenCreateJDModal = (preselectedTmplId?: string) => {
    const defaultDept = departments[0]?.name || '';
    const defaultTeams = getTeamsForDepartment(defaultDept);
    const defaultGradeObj = configuredGrades[2] || configuredGrades[0];
    const initialGradeStr = defaultGradeObj ? `${defaultGradeObj.code} - ${defaultGradeObj.name}` : 'L3 - Senior Specialist';

    setNewTitle('');
    setNewDepartment(defaultDept);
    setNewTeam(defaultTeams[0] || '');
    setNewGrade(initialGradeStr);
    setNewSalaryBand(defaultGradeObj?.salary_band_min ? `${defaultGradeObj.salary_band_min.toLocaleString()} - ${defaultGradeObj.salary_band_max.toLocaleString()} ${defaultGradeObj.currency || 'EGP'} / mo` : '');
    setNewReportsTo('Department Manager');
    setNewEmploymentType('Full-Time');
    setNewLocation('On-Site');
    setNewStatus('Approved');
    setNewObjective('');
    setNewResponsibilities('');
    setNewTechnicalSkills('');
    setNewSoftSkills('');
    setNewCertifications('');
    setNewEducation("Bachelor's degree or equivalent practical experience.");
    setNewKpis('');
    setNewRaciRole('Responsible');
    setSelectedTemplateId(preselectedTmplId || '');
    setIsCreateJDModalOpen(true);

    if (preselectedTmplId) {
      setTimeout(() => applyTemplateToForm(preselectedTmplId), 50);
    }
  };

  // Create New JD Form Submit
  const handleCreateNewJD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      if (showCustomToast) showCustomToast('Please enter a Job Title Name.', 'error');
      return;
    }

    const titleTrimmed = newTitle.trim();
    const newJdData: JobDescriptionDetails = {
      department: newDepartment || (departments[0]?.name || 'General Operations'),
      team: newTeam || '',
      grade: newGrade || 'Grade 3',
      salaryBand: newSalaryBand,
      reportsTo: newReportsTo || 'Department Manager',
      employmentType: newEmploymentType || 'Full-Time',
      location: newLocation || 'On-Site',
      status: newStatus,
      objective: newObjective || `Define target objectives and operational scope for ${titleTrimmed}.`,
      responsibilities: newResponsibilities ? newResponsibilities.split('\n').filter(r => r.trim()) : [`Execute primary departmental duties for ${titleTrimmed}.`],
      education: newEducation || "Bachelor's degree or equivalent experience.",
      technicalSkills: newTechnicalSkills ? newTechnicalSkills.split(',').map(s => s.trim()).filter(Boolean) : ['Core Domain Knowledge'],
      softSkills: newSoftSkills ? newSoftSkills.split(',').map(s => s.trim()).filter(Boolean) : ['Communication', 'Teamwork'],
      certifications: newCertifications ? newCertifications.split(',').map(s => s.trim()).filter(Boolean) : [],
      kpis: newKpis ? newKpis.split('\n').filter(k => k.trim()) : ['Target Delivery Compliance ≥ 90%'],
      raciRole: newRaciRole,
      skills: newTechnicalSkills ? newTechnicalSkills.split(',').map(s => s.trim()).filter(Boolean) : ['Core Domain Knowledge']
    };

    await saveJDToBackendAndState(titleTrimmed, newJdData);
    setSelectedTitle(titleTrimmed);
    setIsCreateJDModalOpen(false);
    if (showCustomToast) showCustomToast(`Created and saved new custom JD for "${titleTrimmed}"`, 'success');
  };

  // Save Edits
  const handleSaveJD = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = (editTitle || selectedTitle).trim();
    const updated: JobDescriptionDetails = {
      department: editDepartment,
      team: editTeam,
      grade: editGrade,
      salaryBand: editSalaryBand,
      reportsTo: editReportsTo,
      employmentType: editEmploymentType,
      location: editLocation,
      status: editStatus,
      objective: editObjective,
      responsibilities: editResponsibilities.split('\n').filter(r => r.trim()),
      education: editEducation,
      technicalSkills: editTechnicalSkills.split(',').map(s => s.trim()).filter(Boolean),
      softSkills: editSoftSkills.split(',').map(s => s.trim()).filter(Boolean),
      certifications: editCertifications.split(',').map(s => s.trim()).filter(Boolean),
      kpis: editKpis.split('\n').filter(k => k.trim()),
      raciRole: editRaciRole,
      skills: editTechnicalSkills.split(',').map(s => s.trim()).filter(Boolean)
    };

    await syncJobTitleAndDescriptionEdits({
      oldTitle: selectedTitle,
      newTitle: finalTitle,
      newDepartmentName: editDepartment,
      newGradeName: editGrade,
      newTeamName: editTeam,
      jdDetails: updated,
      departments,
      employees,
      setCustomJDs
    });

    setSelectedTitle(finalTitle);
    setIsEditJDModalOpen(false);
    if (showCustomToast) showCustomToast(`Job Description for "${finalTitle}" updated & synchronized successfully!`, 'success');
    if (onRefreshData) onRefreshData();
  };

  // Duplicate JD template
  const handleDuplicateJD = () => {
    const newTitle = `${selectedTitle} (Copy)`;
    const duplicatedData: JobDescriptionDetails = {
      ...activeJD,
      status: 'Draft'
    };
    setCustomJDs(prev => ({ ...prev, [newTitle]: duplicatedData }));
    setSelectedTitle(newTitle);
    if (showCustomToast) showCustomToast(`Duplicated JD into "${newTitle}" as Draft!`, 'success');
  };

  // Create Job Opening trigger
  const handleCreateJobOpeningFromJD = async () => {
    setCreatingOpening(true);
    try {
      const matchedDept = departments.find(d => (d.name || '').toLowerCase() === (activeJD?.department || '').toLowerCase()) || departments[0];

      const reqSummary = `Technical Skills: ${(activeJD.technicalSkills || activeJD.skills || []).join(', ')}\nSoft Skills: ${(activeJD.softSkills || []).join(', ')}\nEducation: ${activeJD.education}\nCertifications: ${(activeJD.certifications || []).join(', ')}`;

      const payload = {
        title: selectedTitle,
        department_id: matchedDept?.id || null,
        description: activeJD.objective,
        responsibilities: activeJD.responsibilities.join('\n• '),
        requirements: reqSummary,
        status: 'Active',
        headcount: 1
      };

      const res = await fetch('/api/hr/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        if (showCustomToast) showCustomToast(`✨ Created Job Opening for "${selectedTitle}" in Recruitment!`, 'success');
        if (onNavigateToTab) onNavigateToTab('recruitment');
      } else {
        throw new Error('Failed to create recruitment job opening');
      }
    } catch (err) {
      if (showCustomToast) showCustomToast('Error creating Job Opening from JD', 'error');
    } finally {
      setCreatingOpening(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Job Descriptions (JDs) Library</h3>
            <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-black">
              {filteredTitles.length} Roles
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Standardized job descriptions, competencies, KPIs, RACI matrix roles, and instant recruitment opening generation.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {configuredTemplates.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenCreateJDModal(configuredTemplates[0]?.id)}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📜 New from Template ({configuredTemplates.length})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenCreateJDModal()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Custom JD</span>
          </button>
          {onOpenStructureSettings && (
            <button
              type="button"
              onClick={onOpenStructureSettings}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
              title="Configure Organizational Structure Settings"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Org Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* SPLIT-VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* =========================================================================
           LEFT PANEL: JOB TITLES DIRECTORY (NAVIGATION SIDEBAR)
           ========================================================================= */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 space-y-4">
          
          {/* Top Search & Filter Bar */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search titles, skills, departments..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedDeptFilter}
                onChange={e => setSelectedDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Departments</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Draft">Draft</option>
                <option value="Under Review">Under Review</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
            <span>Job Titles Directory</span>
            <span>{filteredTitles.length} items</span>
          </div>

          {/* Directory Scrollable List */}
          <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
            {filteredTitles.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold">No matching job descriptions found</p>
              </div>
            ) : (
              filteredTitles.map(title => {
                const jd = customJDs[title] || DEFAULT_JOB_DESCRIPTIONS[title] || { department: 'Operations', grade: 'Grade 3', status: 'Approved' };
                const isSelected = title === selectedTitle;
                const empCount = titleEmpCounts[title] || 0;

                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setSelectedTitle(title)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-2xl transition-all cursor-pointer relative border flex flex-col gap-1.5 group",
                      isSelected
                        ? "bg-indigo-50/70 border-indigo-600 shadow-xs ring-1 ring-indigo-500/20"
                        : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn(
                        "text-xs font-black leading-snug",
                        isSelected ? "text-indigo-950" : "text-slate-800 group-hover:text-indigo-600"
                      )}>
                        {title}
                      </span>

                      {/* Status Pill */}
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-extrabold border shrink-0",
                        jd.status === 'Approved' && "bg-emerald-50 text-emerald-700 border-emerald-200",
                        jd.status === 'Draft' && "bg-amber-50 text-amber-700 border-amber-200",
                        jd.status === 'Under Review' && "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                        {jd.status || 'Approved'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="font-bold text-slate-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {jd.department}
                      </span>

                      <div className="flex items-center gap-2 text-slate-400 font-medium">
                        <span>{empCount} {empCount === 1 ? 'emp' : 'emps'}</span>
                        <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", isSelected && "text-indigo-600 translate-x-0.5")} />
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* =========================================================================
           RIGHT PANEL: MAIN JOB DESCRIPTION CARD (6 SECTIONS)
           ========================================================================= */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8 space-y-8 relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          
          {/* Top Decorative Gradient Line */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500" />

          {!selectedTitle || filteredTitles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 my-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                <FileText className="w-8 h-8 opacity-75" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800">No Job Description Selected</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no job descriptions in the library yet. Click below to add a custom Job Description.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCreateJDModal()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Custom JD</span>
              </button>
            </div>
          ) : (
            <>
          {/* Quick Action Bar Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-md border border-emerald-200 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {activeJD.status}
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold">
                  REF: JD-SYS-{selectedTitle.replace(/\s+/g, '-').toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{selectedTitle}</h2>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              
              {/* ✨ Create Job Opening Button */}
              <button
                type="button"
                onClick={handleCreateJobOpeningFromJD}
                disabled={creatingOpening}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{creatingOpening ? 'Creating...' : 'Create Job Opening'}</span>
              </button>

              {/* 🖨️ Export PDF / Print Button */}
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / PDF</span>
              </button>

              {/* ✏️ Edit JD Button */}
              <button
                type="button"
                onClick={handleOpenEditJDModal}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-200/80"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit JD</span>
              </button>

              {/* 🔗 Duplicate JD Button */}
              <button
                type="button"
                onClick={handleDuplicateJD}
                title="Duplicate into new editable template"
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Copy className="w-4 h-4" />
              </button>

              {/* 🗑️ Delete JD Button */}
              <button
                type="button"
                onClick={() => handleRequestDeleteJD(selectedTitle)}
                title="Delete this Job Description"
                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-200/60"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 1️⃣ HEADER & JOB METADATA GRID */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>1️⃣ Header & Job Metadata</span>
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Department */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Department</span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  {activeJD.department}
                </span>
              </div>

              {/* Team / Division */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Team / Division</span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  {activeJD.team || `${activeJD.department} Team`}
                </span>
              </div>

              {/* Grade & Salary */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Job Grade & Band</span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-500" />
                  {activeJD.grade}
                </span>
                {activeJD.salaryBand && (
                  <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">{activeJD.salaryBand}</span>
                )}
              </div>

              {/* Reports To */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Reports To</span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  {activeJD.reportsTo || `${activeJD.department} Manager`}
                </span>
              </div>

              {/* Employment Type & Location */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Employment & Location</span>
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {activeJD.employmentType} • {activeJD.location}
                </span>
              </div>

              {/* Status */}
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Approval Status</span>
                <span className="text-xs font-black text-emerald-700 flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {activeJD.status}
                </span>
              </div>
            </div>
          </div>

          {/* 2️⃣ POSITION PURPOSE / OBJECTIVE */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <span>2️⃣ Position Purpose & Role Summary</span>
            </h4>
            <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100/80 border-l-4 border-l-indigo-600 space-y-1">
              <p className="text-xs md:text-sm font-medium text-indigo-950 leading-relaxed">
                {activeJD.objective}
              </p>
            </div>
          </div>

          {/* 3️⃣ KEY RESPONSIBILITIES & ACCOUNTABILITIES */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>3️⃣ Key Responsibilities & Deliverables</span>
            </h4>
            
            <div className="grid grid-cols-1 gap-2.5">
              {activeJD.responsibilities.map((resp: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0 mt-0.5 border border-emerald-200/60">
                    {idx + 1}
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-relaxed pt-0.5">{resp}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4️⃣ REQUIREMENTS, COMPETENCIES & SKILLS */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>4️⃣ Requirements, Competencies & Skills</span>
            </h4>

            {/* Minimum Education & Experience Card */}
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                Education & Experience Requirements
              </span>
              <p className="text-xs font-bold text-slate-800 leading-relaxed">
                {activeJD.education}
              </p>
            </div>

            {/* Technical Skills */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Technical Skills & Tools
              </span>
              <div className="flex flex-wrap gap-2">
                {(activeJD.technicalSkills || activeJD.skills || []).map((skill: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-900 text-xs font-extrabold rounded-xl border border-indigo-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Soft Skills */}
            {activeJD.softSkills && activeJD.softSkills.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Soft Skills & Behavioral Competencies
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeJD.softSkills.map((skill: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-900 text-xs font-extrabold rounded-xl border border-emerald-100">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Certifications */}
            {activeJD.certifications && activeJD.certifications.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Preferred Professional Certifications
                </span>
                <div className="flex flex-wrap gap-2">
                  {activeJD.certifications.map((cert: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-amber-50 text-amber-900 text-xs font-extrabold rounded-xl border border-amber-100 flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-600" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 5️⃣ KPIs & RACI INTEGRATION */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-rose-500" />
              <span>5️⃣ Performance Metrics (KPIs) & RACI Role</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* KPIs List */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-rose-500" />
                  Key Performance Indicators (KPIs)
                </span>
                <ul className="space-y-1.5">
                  {(activeJD.kpis || ['Quarterly Goal Fulfillment ≥ 90%']).map((kpi: string, i: number) => (
                    <li key={i} className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>{kpi}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* RACI Role Box */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>RACI Matrix Role</span>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-black text-[10px]">
                    {activeJD.raciRole || 'Responsible'}
                  </span>
                </span>
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  {activeJD.raciRole === 'Responsible' && 'Gets the job done. Direct operational owner for completing assigned tasks.'}
                  {activeJD.raciRole === 'Accountable' && 'Final decision-maker and answerable for correct & thorough completion.'}
                  {activeJD.raciRole === 'Consulted' && 'Provides key subject matter expertise and input prior to decisions.'}
                  {activeJD.raciRole === 'Informed' && 'Kept updated on progress and outcomes across initiatives.'}
                </p>
              </div>
            </div>
          </div>

          {/* 6️⃣ BOTTOM ADMINISTRATIVE ACTION BAR */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-medium">
              Last updated for <strong className="text-slate-700">{selectedTitle}</strong> • Standardized HR Template
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCreateJobOpeningFromJD}
                disabled={creatingOpening}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-200 transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Job Opening from JD</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
          </>
          )}
        </div>
      </div>

      {/* EDIT JD MODAL */}
      {isEditJDModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Edit Job Description</h3>
                  <p className="text-xs text-slate-500 font-medium">Modify competency cards and requirements for "{selectedTitle}".</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditJDModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveJD} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Job Title Name */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Job Title Name</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Department Select */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Department</label>
                  <select
                    value={editDepartment}
                    onChange={e => {
                      const selectedDept = e.target.value;
                      setEditDepartment(selectedDept);
                      const teams = getTeamsForDepartment(selectedDept);
                      setEditTeam(teams[0] || '');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Team / Unit Select */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Team / Unit</label>
                  <select
                    value={editTeam}
                    onChange={e => setEditTeam(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    {editTeamOptions.map(tm => (
                      <option key={tm} value={tm}>{tm}</option>
                    ))}
                  </select>
                </div>

                {/* Grade / Level Select */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase">
                      Grade / Level (📊 Org Structure)
                    </label>
                    {onOpenStructureSettings && (
                      <button
                        type="button"
                        onClick={onOpenStructureSettings}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                        title="Manage Grades in Structure Settings"
                      >
                        <Settings className="w-2.5 h-2.5" />
                        <span>Manage</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={editGrade}
                    onChange={e => {
                      const newG = e.target.value;
                      setEditGrade(newG);
                      // Auto suggest salary band if empty or user wants
                      const matched = configuredGrades.find(g => `${g.code} - ${g.name}` === newG || g.name === newG || g.code === newG);
                      if (matched && matched.salary_band_min && !editSalaryBand) {
                        setEditSalaryBand(`${matched.salary_band_min.toLocaleString()} - ${matched.salary_band_max.toLocaleString()} ${matched.currency || 'EGP'} / mo`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    {gradeOptions.map(gr => (
                      <option key={gr} value={gr}>{gr}</option>
                    ))}
                  </select>

                  {/* Benchmark indicator */}
                  {(() => {
                    const matched = configuredGrades.find(g => 
                      `${g.code} - ${g.name}` === editGrade || 
                      g.name === editGrade || 
                      g.code === editGrade ||
                      (editGrade && editGrade.includes(g.code))
                    );
                    if (!matched) return null;
                    return (
                      <div className="mt-1.5 p-2 bg-indigo-50/60 rounded-lg border border-indigo-100/80 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-indigo-900">{matched.category} (Rank #{matched.rank_weight})</span>
                        <span className="font-bold text-slate-600">Band: <strong className="text-slate-900">{matched.salary_band_min.toLocaleString()}-{matched.salary_band_max.toLocaleString()} {matched.currency}</strong></span>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase">Salary Band</label>
                    {(() => {
                      const matched = configuredGrades.find(g => 
                        `${g.code} - ${g.name}` === editGrade || 
                        g.name === editGrade || 
                        g.code === editGrade ||
                        (editGrade && editGrade.includes(g.code))
                      );
                      if (!matched || !matched.salary_band_min) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => setEditSalaryBand(`${matched.salary_band_min.toLocaleString()} - ${matched.salary_band_max.toLocaleString()} ${matched.currency || 'EGP'} / mo`)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                        >
                          Autofill from Grade Band
                        </button>
                      );
                    })()}
                  </div>
                  <input
                    type="text"
                    value={editSalaryBand}
                    onChange={e => setEditSalaryBand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  />
                </div>

                {/* Reports To Select */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Reports To</label>
                  <select
                    value={editReportsTo}
                    onChange={e => setEditReportsTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    {reportsToOptions.map(rep => (
                      <option key={rep} value={rep}>{rep}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Approval Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Draft">Draft</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>
              </div>

              {/* Objective */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Position Purpose / Objective</label>
                <textarea
                  rows={3}
                  value={editObjective}
                  onChange={e => setEditObjective(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none resize-none"
                />
              </div>

              {/* Responsibilities */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Key Responsibilities (One per line)</label>
                <textarea
                  rows={4}
                  value={editResponsibilities}
                  onChange={e => setEditResponsibilities(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none resize-none"
                />
              </div>

              {/* Technical Skills */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Technical Skills (Comma separated)</label>
                <input
                  type="text"
                  value={editTechnicalSkills}
                  onChange={e => setEditTechnicalSkills(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                />
              </div>

              {/* Soft Skills */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Soft Skills (Comma separated)</label>
                <input
                  type="text"
                  value={editSoftSkills}
                  onChange={e => setEditSoftSkills(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                />
              </div>

              {/* Education */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Education & Experience Requirement</label>
                <input
                  type="text"
                  value={editEducation}
                  onChange={e => setEditEducation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                />
              </div>

              {/* KPIs */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">KPI Targets (One per line)</label>
                <textarea
                  rows={3}
                  value={editKpis}
                  onChange={e => setEditKpis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none resize-none"
                />
              </div>

              {/* RACI Role */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">RACI Role</label>
                <select
                  value={editRaciRole}
                  onChange={e => setEditRaciRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="Responsible">Responsible (R)</option>
                  <option value="Accountable">Accountable (A)</option>
                  <option value="Consulted">Consulted (C)</option>
                  <option value="Informed">Informed (I)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleRequestDeleteJD(selectedTitle)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-200/60 flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete JD</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditJDModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CUSTOM JD MODAL */}
      {isCreateJDModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Create New Custom Job Description</h3>
                  <p className="text-xs text-slate-500 font-medium">Define position scope, responsibilities, skills, and KPIs.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateJDModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector Banner */}
            {configuredTemplates.length > 0 && (
              <div className="p-3.5 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-pink-50/70 rounded-2xl border border-indigo-100/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    📜
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Load from JD Blueprint Template</h4>
                    <p className="text-[10px] font-semibold text-slate-500">Auto-fill competencies, KPIs, and target grade from Org Structure Settings</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedTemplateId}
                    onChange={e => {
                      const val = e.target.value;
                      setSelectedTemplateId(val);
                      if (val) applyTemplateToForm(val);
                    }}
                    className="flex-1 sm:w-60 px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 focus:border-indigo-500 outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="">-- Choose Blueprint Template --</option>
                    {configuredTemplates.map(tmpl => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name} ({tmpl.target_grade || 'All Grades'})
                      </option>
                    ))}
                  </select>
                  {onOpenStructureSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreateJDModalOpen(false);
                        onOpenStructureSettings();
                      }}
                      className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Configure Templates in Structure Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateNewJD} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Job Title Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Operations Specialist"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Department Select */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Department</label>
                  <select
                    value={newDepartment}
                    onChange={e => {
                      const selectedDept = e.target.value;
                      setNewDepartment(selectedDept);
                      const teams = getTeamsForDepartment(selectedDept);
                      setNewTeam(teams[0] || '');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    {departmentOptions.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Team Select */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Team / Unit</label>
                  <select
                    value={newTeam}
                    onChange={e => setNewTeam(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    {newTeamOptions.map(tm => (
                      <option key={tm} value={tm}>{tm}</option>
                    ))}
                  </select>
                </div>

                {/* Grade Select */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase">
                      Job Grade / Level (📊 Org Structure)
                    </label>
                    {onOpenStructureSettings && (
                      <button
                        type="button"
                        onClick={onOpenStructureSettings}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                        title="Manage Grades in Structure Settings"
                      >
                        <Settings className="w-2.5 h-2.5" />
                        <span>Manage</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={newGrade}
                    onChange={e => {
                      const newG = e.target.value;
                      setNewGrade(newG);
                      // Auto populate salary band
                      const matched = configuredGrades.find(g => `${g.code} - ${g.name}` === newG || g.name === newG || g.code === newG);
                      if (matched && matched.salary_band_min && !newSalaryBand) {
                        setNewSalaryBand(`${matched.salary_band_min.toLocaleString()} - ${matched.salary_band_max.toLocaleString()} ${matched.currency || 'EGP'} / mo`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    {gradeOptions.map(gr => (
                      <option key={gr} value={gr}>{gr}</option>
                    ))}
                  </select>

                  {/* Selected Grade Benchmark Preview */}
                  {(() => {
                    const matched = configuredGrades.find(g => 
                      `${g.code} - ${g.name}` === newGrade || 
                      g.name === newGrade || 
                      g.code === newGrade ||
                      (newGrade && newGrade.includes(g.code))
                    );
                    if (!matched) return null;
                    return (
                      <div className="mt-1.5 p-2 bg-indigo-50/60 rounded-lg border border-indigo-100/80 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-indigo-900">{matched.category} (Rank #{matched.rank_weight})</span>
                        <span className="font-bold text-slate-600">Band: <strong className="text-slate-900">{matched.salary_band_min.toLocaleString()}-{matched.salary_band_max.toLocaleString()} {matched.currency}</strong></span>
                      </div>
                    );
                  })()}
                </div>

                {/* Salary Band */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase">Salary Band</label>
                    {(() => {
                      const matched = configuredGrades.find(g => 
                        `${g.code} - ${g.name}` === newGrade || 
                        g.name === newGrade || 
                        g.code === newGrade ||
                        (newGrade && newGrade.includes(g.code))
                      );
                      if (!matched || !matched.salary_band_min) return null;
                      return (
                        <button
                          type="button"
                          onClick={() => setNewSalaryBand(`${matched.salary_band_min.toLocaleString()} - ${matched.salary_band_max.toLocaleString()} ${matched.currency || 'EGP'} / mo`)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                        >
                          Autofill from Grade Band
                        </button>
                      );
                    })()}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 25,000 - 35,000 EGP / mo"
                    value={newSalaryBand}
                    onChange={e => setNewSalaryBand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                  />
                </div>

                {/* Reports To Select */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Reports To</label>
                  <select
                    value={newReportsTo}
                    onChange={e => setNewReportsTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    {reportsToOptions.map(rep => (
                      <option key={rep} value={rep}>{rep}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Location</label>
                  <select
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="On-Site">On-Site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Employment Type</label>
                  <select
                    value={newEmploymentType}
                    onChange={e => setNewEmploymentType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Draft">Draft</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>
              </div>

              {/* Purpose / Objective */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Role Objective & Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Summary of purpose and main goal for this role..."
                  value={newObjective}
                  onChange={e => setNewObjective(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none resize-none"
                />
              </div>

              {/* Key Responsibilities */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Key Responsibilities (One per line)</label>
                <textarea
                  rows={3}
                  placeholder="Enter key responsibility 1&#10;Enter key responsibility 2"
                  value={newResponsibilities}
                  onChange={e => setNewResponsibilities(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none resize-none"
                />
              </div>

              {/* Technical Skills */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Technical Skills & Tools (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. React, SQL, Project Management"
                  value={newTechnicalSkills}
                  onChange={e => setNewTechnicalSkills(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                />
              </div>

              {/* Soft Skills */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Soft Skills (Comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Leadership, Stakeholder Management"
                  value={newSoftSkills}
                  onChange={e => setNewSoftSkills(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                />
              </div>

              {/* Education */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">Education & Experience Requirement</label>
                <input
                  type="text"
                  placeholder="e.g. Bachelor's Degree in Business or CS"
                  value={newEducation}
                  onChange={e => setNewEducation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none"
                />
              </div>

              {/* KPIs */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">KPI Targets (One per line)</label>
                <textarea
                  rows={2}
                  placeholder="KPI Goal 1&#10;KPI Goal 2"
                  value={newKpis}
                  onChange={e => setNewKpis(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none resize-none"
                />
              </div>

              {/* RACI Role */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase mb-1">RACI Matrix Role</label>
                <select
                  value={newRaciRole}
                  onChange={e => setNewRaciRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none cursor-pointer"
                >
                  <option value="Responsible">Responsible (R)</option>
                  <option value="Accountable">Accountable (A)</option>
                  <option value="Consulted">Consulted (C)</option>
                  <option value="Informed">Informed (I)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateJDModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  Create & Save JD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑️ DELETE JOB DESCRIPTION & JOB TITLE CONFIRMATION MODAL */}
      {isDeleteConfirmModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-bold shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">حذف الوصف والمسمى الوظيفي</h3>
                  <p className="text-xs text-slate-500 font-medium">Delete Job Description & Job Title: "{jdTitleToDelete}"</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDeleteConfirmModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Message */}
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                  <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>تنويه هام / Important Notice:</span>
                </div>
                <p className="text-xs text-amber-900 font-bold leading-relaxed">
                  عند حذف الوصف الوظيفي لـ <span className="text-indigo-700 underline font-black">"{jdTitleToDelete}"</span>، سيتم أيضاً <span className="text-rose-600 font-black">حذف المسمى الوظيفي (Job Title)</span> تماماً من دليل الهيكل التنظيمي للمؤسسة.
                </p>
              </div>

              {/* Affected Employees Reassignment */}
              {affectedEmployeesForDelete.length > 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span>الموظفون المسجلون بهذا المسمى ({affectedEmployeesForDelete.length}):</span>
                    </span>
                    <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 text-[11px] font-black rounded-lg">
                      نقل إجباري
                    </span>
                  </div>

                  {/* Employee Badges */}
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200/80">
                    {affectedEmployeesForDelete.map(emp => (
                      <span key={emp.id} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 flex items-center gap-1">
                        <Users className="w-3 h-3 text-indigo-500" />
                        <span>{emp.name}</span>
                      </span>
                    ))}
                  </div>

                  {/* Reassignment Dropdown */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-800 uppercase mb-1.5">
                      اختر المسمى الوظيفي الجديد لنقل الموظفين إليه *
                    </label>
                    {otherJobTitlesForDelete.length > 0 ? (
                      <select
                        value={reassignTargetTitle}
                        onChange={e => setReassignTargetTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-900 outline-none focus:border-indigo-600 cursor-pointer shadow-xs"
                      >
                        {otherJobTitlesForDelete.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-rose-600 font-bold p-2 bg-rose-50 rounded-lg border border-rose-200">
                        لا توجد مسميات وظيفية أخرى متاحة. سيتم تفريغ المسمى الوظيفي لهؤلاء الموظفين.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <span>لا يوجد موظفون مسجلون حالياً تحت هذا المسمى الوظيفي.</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إلغاء / Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteJDAndTitle}
                disabled={isDeletingJD}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-200 transition-all cursor-pointer flex items-center gap-2"
              >
                {isDeletingJD ? 'جاري الحذف...' : 'تأكيد الحذف والنقل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT / EXPORT PDF PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Job Description Official Print Format</h3>
                <p className="text-xs text-slate-500 font-medium">Standardized HR document ready for printing or exporting as PDF.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Frame */}
            <div id="printable-jd-card" className="p-6 border border-slate-300 rounded-2xl space-y-5 bg-white text-slate-800 font-sans">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">Systo Biz Enterprise</h1>
                  <p className="text-xs text-slate-500">Human Resources & Organization Management</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-indigo-600 block">{activeJD.department}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{activeJD.grade}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Position Title</span>
                <h2 className="text-2xl font-black text-slate-900">{selectedTitle}</h2>
                <div className="text-xs text-slate-500 font-semibold mt-1">
                  Team: {activeJD.team} • Reports to: {activeJD.reportsTo} • Location: {activeJD.location}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 mb-1">1. Objective & Role Purpose:</h4>
                <p className="text-xs font-medium text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                  {activeJD.objective}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 mb-1.5">2. Key Responsibilities:</h4>
                <ul className="list-disc list-inside text-xs font-medium space-y-1 text-slate-700">
                  {activeJD.responsibilities.map((r: string, i: number) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 mb-1">3. Competencies & Technical Skills:</h4>
                <p className="text-xs font-bold text-slate-800">
                  {(activeJD.technicalSkills || activeJD.skills || []).join(' • ')}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 mb-1">4. Education & Qualifications:</h4>
                <p className="text-xs font-medium text-slate-700">{activeJD.education}</p>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-slate-900 mb-1">5. Performance KPIs & RACI Role:</h4>
                <p className="text-xs font-medium text-slate-700">
                  RACI Matrix: <strong>{activeJD.raciRole || 'Responsible'}</strong> | KPIs: {(activeJD.kpis || []).join('; ')}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-200 flex justify-between text-[11px] font-bold text-slate-500">
                <div>
                  <p>HR Department Approval: _____________________</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Date: {new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p>Employee Signature: _____________________</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save as PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

