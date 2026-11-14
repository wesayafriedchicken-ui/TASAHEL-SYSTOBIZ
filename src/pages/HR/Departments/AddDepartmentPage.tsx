import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, Users, Briefcase, Plus, Trash2, Edit2, Check, 
  ArrowLeft, Layers, UserCheck, Shield, Sparkles, FolderPlus, Tag, Crown, Save 
} from 'lucide-react';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';
import { DepartmentTeam } from '../../../types';
import { saveDepartmentAPI } from './deptUtils';

export const AddDepartmentPage: React.FC = () => {
  const { employees, showCustomToast, fetchData, currentUser } = useHRContext();
  const navigate = useNavigate();

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

  // Active employees only
  const activeEmployees = React.useMemo(() => {
    return (employees || []).filter(e => {
      const s = (e.status || '').toLowerCase();
      return s !== 'inactive' && s !== 'terminated' && s !== 'archived';
    });
  }, [employees]);

  // Handle Team Save
  const handleSaveTeam = () => {
    if (!teamFormName.trim()) {
      showCustomToast('Team name is required.', 'error');
      return;
    }

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

    // Merge team job titles into main department job titles
    const allTitles = Array.from(new Set([...jobTitles, ...teamFormJobTitles]));
    setJobTitles(allTitles);

    // Reset team form
    setEditingTeamIndex(null);
    setShowTeamForm(false);
    setTeamFormName('');
    setTeamFormDesc('');
    setTeamFormLeadId(null);
    setTeamFormJobTitles([]);
    setNewTeamJobTitleInput('');
  };

  const handleEditTeam = (index: number) => {
    const t = teams[index];
    setEditingTeamIndex(index);
    setTeamFormName(t.name);
    setTeamFormDesc(t.description || '');
    setTeamFormLeadId(t.team_lead_id || null);
    setTeamFormJobTitles(Array.isArray(t.job_titles) ? t.job_titles : []);
    setShowTeamForm(true);
  };

  const handleDeleteTeam = (index: number) => {
    const updated = teams.filter((_, i) => i !== index);
    setTeams(updated);
  };

  const handleAddJobTitle = () => {
    if (!newJobTitleInput.trim()) return;
    const titleToAdd = newJobTitleInput.trim();

    if (!jobTitles.includes(titleToAdd)) {
      setJobTitles([...jobTitles, titleToAdd]);
    }

    // If a specific team is selected, add to that team too
    if (selectedTeamForJobTitle !== 'all') {
      const updatedTeams = teams.map(t => {
        if (t.name === selectedTeamForJobTitle) {
          const currentTitles = Array.isArray(t.job_titles) ? t.job_titles : [];
          if (!currentTitles.includes(titleToAdd)) {
            return { ...t, job_titles: [...currentTitles, titleToAdd] };
          }
        }
        return t;
      });
      setTeams(updatedTeams);
    }

    setNewJobTitleInput('');
  };

  const handleRemoveJobTitle = (title: string) => {
    setJobTitles(jobTitles.filter(t => t !== title));
    const updatedTeams = teams.map(t => {
      const currentTitles = Array.isArray(t.job_titles) ? t.job_titles : [];
      return { ...t, job_titles: currentTitles.filter(jt => jt !== title) };
    });
    setTeams(updatedTeams);
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showCustomToast('Department name is required.', 'error');
      return;
    }

    try {
      setSaving(true);
      const deptPayload = {
        name: name.trim(),
        description: description.trim(),
        department_head_id: departmentHeadId,
        teams: teams,
        job_titles: jobTitles
      };

      await saveDepartmentAPI(deptPayload, currentUser?.id);
      showCustomToast('Department created and Job Descriptions synchronized successfully!', 'success');
      await fetchData();
      navigate('/hr/departments');
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to create department', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/departments')}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Add New Department
            </h2>
            <p className="text-xs text-slate-500 font-medium">Create a new organizational department, define work teams, and map job titles.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/hr/departments')}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={handleSaveDepartment}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all text-xs justify-center cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Department'}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Creation Form */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer",
            activeTab === 'info' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Department Info</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer",
            activeTab === 'teams' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Users className="w-4 h-4" />
          <span>2. Teams ({teams.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('job_titles')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer",
            activeTab === 'job_titles' ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-700"
          )}
        >
          <Tag className="w-4 h-4" />
          <span>3. Job Titles ({jobTitles.length})</span>
        </button>
      </div>

      {/* TAB 1: INFO */}
      {activeTab === 'info' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Department Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Engineering & Technology, Human Resources, Finance"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Description & Mission
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the primary charter, scope, and objectives of this department..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Department Head / Director
              </label>
              <select
                value={departmentHeadId || ''}
                onChange={(e) => setDepartmentHeadId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Unassigned / Select Employee --</option>
                {activeEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.job_title || 'Staff'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">
                The department head will be set as the default reporting manager for teams in this department.
              </p>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-indigo-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Executive / Strategic Department</h4>
                  <p className="text-[11px] text-slate-500">Designate this department as part of executive governance</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isExecutive}
                onChange={(e) => setIsExecutive(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('teams')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 text-xs shadow-md transition-all"
            >
              Continue to Teams →
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: TEAMS */}
      {activeTab === 'teams' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Department Work Teams</h3>
              <p className="text-xs text-slate-500">Sub-units that report into this department.</p>
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
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold text-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Team
              </button>
            )}
          </div>

          {/* Team Creation / Edit Sub-Form */}
          {showTeamForm && (
            <div className="p-5 bg-slate-50 rounded-2xl border border-indigo-200/80 space-y-4 animate-in fade-in">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                {editingTeamIndex !== null ? 'Edit Work Team' : 'New Work Team'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Team Name *</label>
                  <input
                    type="text"
                    value={teamFormName}
                    onChange={(e) => setTeamFormName(e.target.value)}
                    placeholder="e.g., Core Frontend, Talent Acquisition"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Team Lead</label>
                  <select
                    value={teamFormLeadId || ''}
                    onChange={(e) => setTeamFormLeadId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">-- No Team Lead Assigned --</option>
                    {activeEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.job_title || 'Staff'})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Team Description</label>
                <input
                  type="text"
                  value={teamFormDesc}
                  onChange={(e) => setTeamFormDesc(e.target.value)}
                  placeholder="Brief description of team functions..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Add Job Titles directly to this team */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Team Job Titles</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTeamJobTitleInput}
                    onChange={(e) => setNewTeamJobTitleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTeamJobTitleInput.trim() && !teamFormJobTitles.includes(newTeamJobTitleInput.trim())) {
                          setTeamFormJobTitles([...teamFormJobTitles, newTeamJobTitleInput.trim()]);
                          setNewTeamJobTitleInput('');
                        }
                      }
                    }}
                    placeholder="Type title and press Enter..."
                    className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTeamJobTitleInput.trim() && !teamFormJobTitles.includes(newTeamJobTitleInput.trim())) {
                        setTeamFormJobTitles([...teamFormJobTitles, newTeamJobTitleInput.trim()]);
                        setNewTeamJobTitleInput('');
                      }
                    }}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {teamFormJobTitles.map((jt, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold">
                      {jt}
                      <button
                        type="button"
                        onClick={() => setTeamFormJobTitles(teamFormJobTitles.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600"
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
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTeam}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700"
                >
                  {editingTeamIndex !== null ? 'Update Team' : 'Add Team'}
                </button>
              </div>
            </div>
          )}

          {/* Teams List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teams.map((team, idx) => {
              const leadEmp = employees.find(e => e.id === team.team_lead_id);
              return (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-black text-slate-900">{team.name}</h4>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditTeam(idx)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeam(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {team.description && <p className="text-[11px] text-slate-500 mt-1">{team.description}</p>}
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Lead: <strong className="text-slate-800">{leadEmp?.name || 'Unassigned'}</strong></span>
                      <span>{Array.isArray(team.job_titles) ? team.job_titles.length : 0} Titles</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {teams.length === 0 && !showTeamForm && (
              <div className="col-span-full p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No teams added yet</p>
                <p className="text-[11px] text-slate-400">Teams allow grouping department members into specific functional squads.</p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ← Back to Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('job_titles')}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 text-xs shadow-md transition-all"
            >
              Continue to Job Titles →
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: JOB TITLES */}
      {activeTab === 'job_titles' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Department Job Titles</h3>
            <p className="text-xs text-slate-500">Define job titles operating within this department. Each title will automatically generate a synchronized Job Description template.</p>
          </div>

          {/* Add Job Title Input */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newJobTitleInput}
                onChange={(e) => setNewJobTitleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddJobTitle();
                  }
                }}
                placeholder="e.g., Senior Full-Stack Engineer, Lead Product Designer..."
                className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <select
                value={selectedTeamForJobTitle}
                onChange={(e) => setSelectedTeamForJobTitle(e.target.value)}
                className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                <option value="all">-- All / Department-Wide --</option>
                {teams.map((t, idx) => (
                  <option key={idx} value={t.name}>Assign to Team: {t.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddJobTitle}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Title
              </button>
            </div>
          </div>

          {/* Job Titles Badges */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assigned Job Titles ({jobTitles.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {jobTitles.map((title, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 text-indigo-900 border border-indigo-100 rounded-xl text-xs font-bold"
                >
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  {title}
                  <button
                    type="button"
                    onClick={() => handleRemoveJobTitle(title)}
                    className="text-indigo-400 hover:text-rose-600 font-bold ml-1 text-sm"
                  >
                    ×
                  </button>
                </span>
              ))}

              {jobTitles.length === 0 && (
                <p className="text-xs text-slate-400 italic">No job titles mapped yet. Add some above or they will be automatically derived from employees.</p>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('teams')}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              ← Back to Teams
            </button>
            <button
              type="button"
              disabled={saving || !name.trim()}
              onClick={handleSaveDepartment}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Complete & Save Department'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddDepartmentPage;
