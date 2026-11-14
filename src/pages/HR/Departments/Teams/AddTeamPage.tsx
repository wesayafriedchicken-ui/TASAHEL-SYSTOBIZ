import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Building2, ArrowLeft, Plus, Trash2, Check, 
  UserCheck, Tag, Save, Shield 
} from 'lucide-react';
import { useHRContext } from '../../HRContext';
import { cn } from '../../../../lib/utils';
import { saveDepartmentAPI, parseTeams, parseJobTitles } from '../deptUtils';
import { DepartmentTeam } from '../../../../types';

export const AddTeamPage: React.FC = () => {
  const { departments, employees, showCustomToast, fetchData, currentUser } = useHRContext();
  const navigate = useNavigate();

  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id?.toString() || '');
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamLeadId, setTeamLeadId] = useState<number | null>(null);
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [newTitleInput, setNewTitleInput] = useState('');
  const [saving, setSaving] = useState(false);

  const activeEmployees = useMemo(() => {
    return employees.filter(e => {
      const s = (e.status || '').toLowerCase();
      return s !== 'inactive' && s !== 'terminated' && s !== 'archived';
    });
  }, [employees]);

  // Selected department
  const selectedDepartment = useMemo(() => {
    return departments.find(d => String(d.id) === String(selectedDeptId));
  }, [departments, selectedDeptId]);

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

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId) {
      showCustomToast('Please select a department for this team.', 'error');
      return;
    }
    if (!teamName.trim()) {
      showCustomToast('Team name is required.', 'error');
      return;
    }

    const dept = departments.find(d => String(d.id) === String(selectedDeptId));
    if (!dept) {
      showCustomToast('Selected department not found.', 'error');
      return;
    }

    try {
      setSaving(true);
      const existingTeams = parseTeams(dept.teams);

      const newTeamObj: DepartmentTeam = {
        id: Date.now(),
        name: teamName.trim(),
        description: teamDesc.trim(),
        team_lead_id: teamLeadId,
        job_titles: jobTitles
      };

      const updatedTeams = [...existingTeams, newTeamObj];

      // Merge titles into department job titles
      const existingTitles = parseJobTitles(dept.job_titles);
      const updatedTitles = Array.from(new Set([...existingTitles, ...jobTitles]));

      const payload = {
        id: dept.id,
        name: dept.name,
        description: dept.description,
        department_head_id: dept.department_head_id,
        teams: updatedTeams,
        job_titles: updatedTitles
      };

      await saveDepartmentAPI(payload, currentUser?.id);
      showCustomToast(`Team "${teamName}" created successfully!`, 'success');
      await fetchData();
      navigate('/hr/departments/teams');
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to create team', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
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
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Add New Work Team
            </h2>
            <p className="text-xs text-slate-500 font-medium">Create a functional squad/sub-unit under an existing department.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/hr/departments/teams')}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !teamName.trim() || !selectedDeptId}
            onClick={handleSaveTeam}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all text-xs justify-center cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Team'}
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSaveTeam} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            >
              <option value="">-- Select Parent Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Team Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Frontend Engineering, Payroll Operations"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Team Description & Focus
          </label>
          <textarea
            value={teamDesc}
            onChange={(e) => setTeamDesc(e.target.value)}
            rows={3}
            placeholder="Outline the core responsibilities and deliverables of this team..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none resize-none"
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
            <option value="">-- No Team Lead Assigned --</option>
            {activeEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.job_title || 'Staff'})
              </option>
            ))}
          </select>
        </div>

        {/* Job Titles Tagging */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Job Titles within this Team
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitleInput}
              onChange={(e) => setNewTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddJobTitle();
                }
              }}
              placeholder="e.g., React Specialist, QA Automation Lead..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
            <button
              type="button"
              onClick={handleAddJobTitle}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
            >
              Add Title
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {jobTitles.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-100 rounded-xl text-xs font-bold"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                {t}
                <button
                  type="button"
                  onClick={() => handleRemoveJobTitle(t)}
                  className="text-indigo-400 hover:text-rose-600 ml-1 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
            {jobTitles.length === 0 && (
              <p className="text-xs text-slate-400 italic">No job titles assigned yet.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/hr/departments/teams')}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !teamName.trim() || !selectedDeptId}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Register Team'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTeamPage;
