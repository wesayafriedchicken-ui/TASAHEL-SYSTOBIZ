import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Briefcase, Plus, Trash2, Edit2, X, Check, 
  ChevronRight, Layers, UserCheck, Shield, Sparkles, FolderPlus, Tag, Crown 
} from 'lucide-react';
import { Department, DepartmentTeam, Employee } from '../../types';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDept: Department | null;
  onSave: (deptData: Partial<Department>) => Promise<void>;
  employees: Employee[];
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  editingDept,
  onSave,
  employees
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'teams' | 'job_titles'>('info');
  
  // Department state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [departmentHeadId, setDepartmentHeadId] = useState<number | null>(null);
  const [isExecutive, setIsExecutive] = useState(false);
  const [teams, setTeams] = useState<DepartmentTeam[]>([]);
  const [jobTitles, setJobTitles] = useState<string[]>([]);

  // Team form state
  const [editingTeamIndex, setEditingTeamIndex] = useState<number | null>(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamFormName, setTeamFormName] = useState('');
  const [teamFormDesc, setTeamFormDesc] = useState('');
  const [teamFormLeadId, setTeamFormLeadId] = useState<number | null>(null);
  const [teamFormJobTitles, setTeamFormJobTitles] = useState<string[]>([]);
  const [newTeamJobTitleInput, setNewTeamJobTitleInput] = useState('');

  // Job title input state
  const [newJobTitleInput, setNewJobTitleInput] = useState('');
  const [selectedTeamForJobTitle, setSelectedTeamForJobTitle] = useState<string>('all');

  const [saving, setSaving] = useState(false);

  // Active employees only (filter out inactive/terminated)
  const activeEmployees = React.useMemo(() => {
    return (employees || []).filter(e => {
      const s = String(e.status || '').toLowerCase().trim();
      return s !== 'inactive' && s !== 'terminated' && s !== 'archived' && s !== 'disabled' && s !== 'deleted' && s !== 'suspended';
    });
  }, [employees]);

  useEffect(() => {
    if (editingDept) {
      setName(editingDept.name || '');
      setDescription(editingDept.description || '');
      setDepartmentHeadId(editingDept.department_head_id || null);
      setIsExecutive(editingDept.is_executive || editingDept.name?.toLowerCase().includes('executive') || editingDept.name?.toLowerCase().includes('قيادي') || false);
      
      // Parse teams if string or array
      let parsedTeams: DepartmentTeam[] = [];
      if (Array.isArray(editingDept.teams)) {
        parsedTeams = editingDept.teams;
      } else if (typeof editingDept.teams === 'string') {
        try { parsedTeams = JSON.parse(editingDept.teams); } catch (e) { parsedTeams = []; }
      }
      setTeams(parsedTeams);

      // Parse job titles
      let parsedTitles: string[] = [];
      if (Array.isArray(editingDept.job_titles)) {
        parsedTitles = editingDept.job_titles.map((t: any) => typeof t === 'string' ? t : (t?.title || t?.name || '')).filter(Boolean);
      } else if (typeof editingDept.job_titles === 'string') {
        try {
          const raw = JSON.parse(editingDept.job_titles);
          if (Array.isArray(raw)) {
            parsedTitles = raw.map((t: any) => typeof t === 'string' ? t : (t?.title || t?.name || '')).filter(Boolean);
          }
        } catch (e) { parsedTitles = []; }
      }

      // Automatically sync all team job titles into registered job titles for the department
      parsedTeams.forEach((t: DepartmentTeam) => {
        if (Array.isArray(t.job_titles)) {
          t.job_titles.forEach((jt: any) => {
            const titleStr = (typeof jt === 'string' ? jt : (jt?.title || jt?.name || '')).trim();
            if (titleStr && !parsedTitles.includes(titleStr)) {
              parsedTitles.push(titleStr);
            }
          });
        }
      });

      setJobTitles(parsedTitles);
    } else {
      setName('');
      setDescription('');
      setDepartmentHeadId(null);
      setIsExecutive(false);
      setTeams([]);
      setJobTitles([]);
    }
    setActiveTab('info');
    setShowTeamForm(false);
  }, [editingDept, isOpen]);

  if (!isOpen) return null;

  const handleAddOrUpdateTeam = () => {
    if (!teamFormName.trim()) return;

    const teamData: DepartmentTeam = {
      id: editingTeamIndex !== null && teams[editingTeamIndex]?.id ? teams[editingTeamIndex].id : Date.now(),
      name: teamFormName.trim(),
      description: teamFormDesc.trim(),
      team_lead_id: teamFormLeadId,
      job_titles: teamFormJobTitles
    };

    if (editingTeamIndex !== null) {
      const updated = [...teams];
      updated[editingTeamIndex] = teamData;
      setTeams(updated);
    } else {
      setTeams([...teams, teamData]);
    }

    // Automatically sync team job titles into Registered Job Titles (jobTitles)
    if (teamFormJobTitles && teamFormJobTitles.length > 0) {
      setJobTitles(prev => {
        const newTitles = [...prev];
        teamFormJobTitles.forEach((jt: any) => {
          const titleStr = (typeof jt === 'string' ? jt : (jt?.title || jt?.name || '')).trim();
          if (titleStr && !newTitles.includes(titleStr)) {
            newTitles.push(titleStr);
          }
        });
        return newTitles;
      });
    }

    // Reset team form
    setTeamFormName('');
    setTeamFormDesc('');
    setTeamFormLeadId(null);
    setTeamFormJobTitles([]);
    setEditingTeamIndex(null);
    setShowTeamForm(false);
  };

  const handleEditTeam = (index: number) => {
    const team = teams[index];
    setTeamFormName(team.name || '');
    setTeamFormDesc(team.description || '');
    setTeamFormLeadId(team.team_lead_id || null);
    setTeamFormJobTitles(team.job_titles || []);
    setEditingTeamIndex(index);
    setShowTeamForm(true);
  };

  const handleDeleteTeam = (index: number) => {
    if (confirm('Are you sure you want to delete this team?')) {
      setTeams(teams.filter((_, i) => i !== index));
    }
  };

  const handleAddDeptJobTitle = () => {
    if (!newJobTitleInput.trim()) return;
    const title = newJobTitleInput.trim();

    if (selectedTeamForJobTitle !== 'all' && selectedTeamForJobTitle !== '') {
      // Add to specific team
      const teamIdx = teams.findIndex(t => t.name === selectedTeamForJobTitle || t.id?.toString() === selectedTeamForJobTitle);
      if (teamIdx !== -1) {
        const updatedTeams = [...teams];
        const currentTitles = updatedTeams[teamIdx].job_titles || [];
        if (!currentTitles.includes(title)) {
          updatedTeams[teamIdx].job_titles = [...currentTitles, title];
          setTeams(updatedTeams);
        }
      }
    }

    // Also add to department job titles
    if (!jobTitles.includes(title)) {
      setJobTitles([...jobTitles, title]);
    }

    setNewJobTitleInput('');
  };

  const handleDeleteDeptJobTitle = (titleToDelete: string) => {
    setJobTitles(jobTitles.filter(t => t !== titleToDelete));
    // Remove from teams too
    const updatedTeams = teams.map(t => ({
      ...t,
      job_titles: (t.job_titles || []).filter(jt => jt !== titleToDelete)
    }));
    setTeams(updatedTeams);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        id: editingDept?.id,
        name: name.trim(),
        description: description.trim(),
        department_head_id: departmentHeadId,
        teams,
        job_titles: jobTitles,
        is_executive: isExecutive
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-indigo-300 font-bold border border-white/10 shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">
                {editingDept?.id ? 'Edit Department' : 'Add New Department'}
              </h3>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                Manage department structure, teams, and job titles
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-5 py-3 text-xs font-black rounded-t-2xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>General Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={`px-5 py-3 text-xs font-black rounded-t-2xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'teams'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teams & Specializations</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
              {teams.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('job_titles')}
            className={`px-5 py-3 text-xs font-black rounded-t-2xl border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'job_titles'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Job Titles</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
              {jobTitles.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0 space-y-6">
          
          {/* TAB 1: General Info */}
          {activeTab === 'info' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">
                  Department Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  placeholder="e.g. Engineering & Development, Human Resources..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">Department Description</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all resize-none"
                  placeholder="Write a comprehensive description of duties and goals of this department..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 block">Department Head</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={departmentHeadId || ''}
                  onChange={e => setDepartmentHeadId(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">-- Select Department Head --</option>
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.job_title ? `(${emp.job_title})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Executive Department Option */}
              <div 
                className="flex items-start gap-3 p-3.5 bg-amber-50/80 hover:bg-amber-100/60 border border-amber-200/80 rounded-2xl cursor-pointer transition-all"
                onClick={() => setIsExecutive(!isExecutive)}
              >
                <input
                  type="checkbox"
                  id="is_executive_check"
                  checked={isExecutive}
                  onChange={e => setIsExecutive(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-amber-600 rounded focus:ring-amber-500 cursor-pointer shrink-0"
                />
                <div className="select-none">
                  <label htmlFor="is_executive_check" className="text-xs font-black text-amber-950 flex items-center gap-1.5 cursor-pointer">
                    <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                    Top Executive Leadership Department (قسم قيادي أعلى الهيكل التنظيمي)
                  </label>
                  <p className="text-[11px] text-amber-800 font-medium mt-0.5 leading-snug">
                    تعيين هذا القسم كقسم قيادي تنفيذي يضعه في أعلى الهيكل التنظيمي (مستوى CEO/مجلس الإدارة) ويستثنيه من العرض في صف الأقسام التشغيلية العادية.
                  </p>
                </div>
              </div>

              {/* Summary Stats Card */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950">Current Department Statistics</h4>
                    <p className="text-[11px] text-indigo-700 font-medium">Automatically synced with teams, titles, and employees</p>
                  </div>
                </div>
                <div className="flex gap-4 text-center">
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Teams</p>
                    <p className="text-sm font-black text-indigo-600">{teams.length}</p>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-2xs">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Job Titles</p>
                    <p className="text-sm font-black text-indigo-600">{jobTitles.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Teams Management */}
          {activeTab === 'teams' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-800">Department Work Teams</h4>
                  <p className="text-xs text-slate-500 font-medium">Add teams such as (Frontend, Backend, Operations) and assign team leads</p>
                </div>
                {!showTeamForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeamIndex(null);
                      setTeamFormName('');
                      setTeamFormDesc('');
                      setTeamFormLeadId(null);
                      setTeamFormJobTitles([]);
                      setShowTeamForm(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Team</span>
                  </button>
                )}
              </div>

              {/* Team Add / Edit Form */}
              {showTeamForm && (
                <div className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-5 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h5 className="text-xs font-black text-indigo-900 flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-indigo-600" />
                      <span>{editingTeamIndex !== null ? 'Edit Team' : 'Create New Team'}</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowTeamForm(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Team Name *</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none"
                        placeholder="e.g. Frontend Development Team..."
                        value={teamFormName}
                        onChange={e => setTeamFormName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Team Lead</label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:border-indigo-500 outline-none"
                        value={teamFormLeadId || ''}
                        onChange={e => setTeamFormLeadId(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">-- Select Team Lead --</option>
                        {activeEmployees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Team Description</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:border-indigo-500 outline-none"
                        placeholder="Description of team responsibilities and specialists..."
                        value={teamFormDesc}
                        onChange={e => setTeamFormDesc(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Team Job Titles */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <label className="text-xs font-bold text-slate-700 block">Team Job Titles</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                        placeholder="Add job title specific to team..."
                        value={newTeamJobTitleInput}
                        onChange={e => setNewTeamJobTitleInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newTeamJobTitleInput.trim()) {
                              const titleStr = newTeamJobTitleInput.trim();
                              setTeamFormJobTitles(prev => [...prev, titleStr]);
                              setJobTitles(prev => prev.includes(titleStr) ? prev : [...prev, titleStr]);
                              setNewTeamJobTitleInput('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newTeamJobTitleInput.trim()) {
                            const titleStr = newTeamJobTitleInput.trim();
                            setTeamFormJobTitles(prev => [...prev, titleStr]);
                            setJobTitles(prev => prev.includes(titleStr) ? prev : [...prev, titleStr]);
                            setNewTeamJobTitleInput('');
                          }
                        }}
                        className="px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {teamFormJobTitles.map((jt: any, idx: number) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-100 rounded-lg text-xs font-semibold text-indigo-700 shadow-2xs">
                          <Briefcase className="w-3 h-3 text-indigo-400" />
                          <span>{typeof jt === 'string' ? jt : (jt?.title || jt?.name || '')}</span>
                          <button
                            type="button"
                            onClick={() => setTeamFormJobTitles(teamFormJobTitles.filter((_, i) => i !== idx))}
                            className="hover:text-rose-600 cursor-pointer ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowTeamForm(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddOrUpdateTeam}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      {editingTeamIndex !== null ? 'Save Changes' : 'Add Team'}
                    </button>
                  </div>
                </div>
              )}

              {/* Teams List */}
              <div className="space-y-3">
                {teams.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
                    <p className="text-xs font-bold">No teams added for this department yet.</p>
                    <p className="text-[11px] text-slate-400">Click "Add New Team" to structure department work.</p>
                  </div>
                ) : (
                  teams.map((team, idx) => {
                    const leadEmp = activeEmployees.find(e => e.id === team.team_lead_id);
                    const teamMembersCount = activeEmployees.filter(e => e.department_id === editingDept?.id && (e.team_name === team.name || e.personal_info?.team_name === team.name)).length;

                    return (
                      <div key={idx} className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                            <h5 className="text-sm font-black text-slate-900">{team.name}</h5>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                              {teamMembersCount} Employees
                            </span>
                          </div>
                          {team.description && (
                            <p className="text-xs text-slate-500 font-medium">{team.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Team Lead: {leadEmp?.name || 'Unassigned'}</span>
                            </span>
                            {team.job_titles && team.job_titles.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1">
                                {team.job_titles.map((jt: any, jidx: number) => (
                                  <span key={jidx} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md">
                                    {typeof jt === 'string' ? jt : (jt?.title || jt?.name || '')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditTeam(idx)}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                            title="Edit Team"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeam(idx)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                            title="Delete Team"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Job Titles Management */}
          {activeTab === 'job_titles' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800">Approved Job Titles for Department</h4>
                <p className="text-xs text-slate-500 font-medium">Define available titles for employee profiles and hiring</p>
              </div>

              {/* Add Job Title Input */}
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">New Job Title</label>
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:border-indigo-500 outline-none"
                      placeholder="e.g. Senior Software Developer, QA Engineer, Senior Accountant..."
                      value={newJobTitleInput}
                      onChange={e => setNewJobTitleInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDeptJobTitle();
                        }
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Assign to Team (Optional)</label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:border-indigo-500 outline-none"
                      value={selectedTeamForJobTitle}
                      onChange={e => setSelectedTeamForJobTitle(e.target.value)}
                    >
                      <option value="all">General for Entire Department</option>
                      {teams.map((t, idx) => (
                        <option key={idx} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddDeptJobTitle}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Job Title</span>
                  </button>
                </div>
              </div>

              {/* Job Titles Display */}
              <div className="space-y-3">
                <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">Registered Job Titles ({jobTitles.length})</h5>

                {jobTitles.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-500" />
                    <p className="text-xs font-bold">No job titles registered for this department yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {jobTitles.map((titleItem, idx) => {
                      const title = typeof titleItem === 'string' ? titleItem : ((titleItem as any)?.title || (titleItem as any)?.name || '');
                      const empCountWithTitle = activeEmployees.filter(e => e.department_id === editingDept?.id && e.job_title === title).length;

                      return (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 shadow-2xs flex items-center justify-between gap-2 group transition-all">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs">
                              <Tag className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate">{title}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{empCountWithTitle} Employees</p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteDeptJobTitle(title)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Delete Job Title"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Updates are automatically applied across all related screens
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-md shadow-indigo-600/20 text-xs transition-all cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{editingDept?.id ? 'Save Changes' : 'Create Department'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DepartmentModal;
