import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Users, Building2, Tag, ArrowLeft, Edit2, Trash2, 
  Save, UserCheck, AlertCircle, Plus, Mail, Phone, ExternalLink 
} from 'lucide-react';
import { useHRContext } from '../../HRContext';
import { cn } from '../../../../lib/utils';
import { saveDepartmentAPI, parseJobTitles, extractJobTitleString } from '../deptUtils';
import { DepartmentTeam } from '../../../../types';

export const TeamDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { departments, employees, isHRAdmin, canEditDept, canDeleteDept, showCustomToast, fetchData, currentUser } = useHRContext();

  // Find team and parent department
  const { team, parentDept } = useMemo(() => {
    for (const dept of departments) {
      let dTeams: DepartmentTeam[] = [];
      if (Array.isArray(dept.teams)) dTeams = dept.teams;
      else if (typeof dept.teams === 'string') {
        try { dTeams = JSON.parse(dept.teams); } catch (e) {}
      }

      const match = dTeams.find(t => String(t.id) === String(id) || encodeURIComponent(t.name) === id);
      if (match) {
        return { team: match, parentDept: dept };
      }
    }
    return { team: null, parentDept: null };
  }, [departments, id]);

  const [isEditing, setIsEditing] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamLeadId, setTeamLeadId] = useState<number | null>(null);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (team) {
      setTeamName(team.name || '');
      setTeamDesc(team.description || '');
      setTeamLeadId(team.team_lead_id || null);
      setJobTitles(parseJobTitles(team.job_titles));
    }
  }, [team]);

  const activeEmployees = useMemo(() => {
    return employees.filter(e => {
      const s = (e.status || '').toLowerCase();
      return s !== 'inactive' && s !== 'terminated' && s !== 'archived';
    });
  }, [employees]);

  // Lead employee
  const leadEmployee = useMemo(() => {
    if (!team?.team_lead_id) return null;
    return employees.find(e => String(e.id) === String(team.team_lead_id));
  }, [employees, team]);

  // Team members (matching department + position matching team job titles or assigned)
  const teamMembers = useMemo(() => {
    if (!parentDept) return [];
    const normalizedTitles = parseJobTitles(team?.job_titles);
    return employees.filter(e => {
      if (String(e.department_id) !== String(parentDept.id)) return false;
      if (team?.team_lead_id && String(e.id) === String(team.team_lead_id)) return true;
      if (normalizedTitles.length > 0) {
        return normalizedTitles.some(jt => jt.toLowerCase() === (e.job_title || '').toLowerCase());
      }
      return false;
    });
  }, [employees, parentDept, team]);

  if (!team || !parentDept) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
        <Users className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-700">Team Not Found</h3>
        <p className="text-xs text-slate-400">The requested team could not be found in any department.</p>
        <button
          type="button"
          onClick={() => navigate('/hr/departments/teams')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
        >
          Return to Teams Builder
        </button>
      </div>
    );
  }

  const handleAddJobTitle = () => {
    if (!newTitleInput.trim()) return;
    const title = newTitleInput.trim();
    if (!jobTitles.includes(title)) {
      setJobTitles([...jobTitles, title]);
    }
    setNewTitleInput('');
  };

  const handleRemoveJobTitle = (title: string) => {
    setJobTitles(jobTitles.filter(t => t !== title));
  };

  const handleSave = async () => {
    if (!teamName.trim()) {
      showCustomToast('Team name is required.', 'error');
      return;
    }

    try {
      setSaving(true);
      let dTeams: DepartmentTeam[] = [];
      if (Array.isArray(parentDept.teams)) dTeams = [...parentDept.teams];
      else if (typeof parentDept.teams === 'string') {
        try { dTeams = JSON.parse(parentDept.teams); } catch (e) {}
      }

      const updatedTeams = dTeams.map(t => {
        if (String(t.id) === String(team.id) || t.name === team.name) {
          return {
            ...t,
            name: teamName.trim(),
            description: teamDesc.trim(),
            team_lead_id: teamLeadId,
            job_titles: jobTitles
          };
        }
        return t;
      });

      const payload = {
        id: parentDept.id,
        name: parentDept.name,
        description: parentDept.description,
        department_head_id: parentDept.department_head_id,
        teams: updatedTeams,
        job_titles: parentDept.job_titles
      };

      await saveDepartmentAPI(payload, currentUser?.id);
      showCustomToast('Team updated successfully!', 'success');
      await fetchData();
      setIsEditing(false);
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to update team', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      let dTeams: DepartmentTeam[] = [];
      if (Array.isArray(parentDept.teams)) dTeams = [...parentDept.teams];
      else if (typeof parentDept.teams === 'string') {
        try { dTeams = JSON.parse(parentDept.teams); } catch (e) {}
      }

      const updatedTeams = dTeams.filter(t => String(t.id) !== String(team.id) && t.name !== team.name);

      const payload = {
        id: parentDept.id,
        name: parentDept.name,
        description: parentDept.description,
        department_head_id: parentDept.department_head_id,
        teams: updatedTeams,
        job_titles: parentDept.job_titles
      };

      await saveDepartmentAPI(payload, currentUser?.id);
      showCustomToast(`Team "${team.name}" deleted`, 'success');
      await fetchData();
      navigate('/hr/departments/teams');
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to delete team', 'error');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/departments/teams')}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-md">
                Dept: {parentDept.name}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">{team.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(isHRAdmin || canEditDept) && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer",
                isEditing ? "bg-slate-200 text-slate-800" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
              )}
            >
              <Edit2 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel' : 'Edit Team'}
            </button>
          )}

          {(isHRAdmin || canDeleteDept) && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Delete Team"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Info Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {isEditing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Team Lead
                </label>
                <select
                  value={teamLeadId || ''}
                  onChange={(e) => setTeamLeadId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                >
                  <option value="">-- No Lead Assigned --</option>
                  {activeEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.job_title || 'Staff'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Description
              </label>
              <textarea
                value={teamDesc}
                onChange={(e) => setTeamDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none resize-none"
              />
            </div>

            {/* Job Titles */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Job Titles
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTitleInput}
                  onChange={(e) => setNewTitleInput(e.target.value)}
                  placeholder="Add job title to team..."
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={handleAddJobTitle}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {jobTitles.map((t, idx) => {
                  const titleStr = extractJobTitleString(t);
                  if (!titleStr) return null;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl text-xs font-bold"
                    >
                      {titleStr}
                      <button
                        type="button"
                        onClick={() => handleRemoveJobTitle(titleStr)}
                        className="text-indigo-400 hover:text-rose-600 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !teamName.trim()}
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{team.name}</h3>
                  <p className="text-xs text-slate-500">{team.description || 'No description provided.'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-xs">
                {leadEmployee?.name ? leadEmployee.name.charAt(0) : '?'}
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Team Lead</span>
                <span className="text-xs font-black text-slate-800">{leadEmployee?.name || 'Unassigned'}</span>
                <span className="text-[10px] text-slate-500 block">{leadEmployee?.job_title || 'Lead'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Job Titles & Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Job Titles */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600" />
            Team Job Titles ({jobTitles.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {jobTitles.map((t, idx) => {
              const titleStr = extractJobTitleString(t);
              if (!titleStr) return null;
              return (
                <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-xl text-xs font-bold border border-indigo-100">
                  {titleStr}
                </span>
              );
            })}
            {jobTitles.length === 0 && (
              <p className="text-xs text-slate-400 italic">No job titles assigned to this team.</p>
            )}
          </div>
        </div>

        {/* Right: Team Members */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Identified Team Members ({teamMembers.length})
          </h3>

          <div className="divide-y divide-slate-100">
            {teamMembers.map((emp) => (
              <div key={emp.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                    {emp.name ? emp.name.charAt(0) : '?'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{emp.name}</h4>
                    <span className="text-[11px] text-slate-500">{emp.job_title || 'Staff'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/hr/directory/${emp.id}`)}
                  className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                >
                  Profile <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            ))}
            {teamMembers.length === 0 && (
              <p className="text-xs text-slate-400 italic py-4">No employees currently mapped to this team's titles or lead.</p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Team?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete team <strong className="text-slate-800">{team.name}</strong> from {parentDept.name}?
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-200"
              >
                {saving ? 'Deleting...' : 'Yes, Delete Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailsPage;
