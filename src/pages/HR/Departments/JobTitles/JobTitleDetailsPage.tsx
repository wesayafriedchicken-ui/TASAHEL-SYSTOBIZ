import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Tag, Building2, Users, ArrowLeft, Edit2, Trash2, 
  Save, FileText, Check, DollarSign, Briefcase, ExternalLink, AlertCircle 
} from 'lucide-react';
import { useHRContext } from '../../HRContext';
import { cn } from '../../../../lib/utils';
import { saveDepartmentAPI, parseJobTitles, parseTeams, extractJobTitleString } from '../deptUtils';
import { syncJobTitleAndDescriptionEdits, JobDescriptionDetails, DEFAULT_JOB_DESCRIPTIONS } from '../../../../components/HR/DepartmentSubTabs';

export const JobTitleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const titleName = decodeURIComponent(id || '');

  const { departments, employees, isHRAdmin, canEditDept, canDeleteDept, showCustomToast, fetchData, currentUser } = useHRContext();

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(titleName);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [grade, setGrade] = useState('Grade 3 / Mid-Senior');
  const [salaryBand, setSalaryBand] = useState('');
  const [reportsTo, setReportsTo] = useState('');
  const [objective, setObjective] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Find parent department
  const parentDept = useMemo(() => {
    return departments.find(d => {
      const titles = parseJobTitles(d.job_titles);
      return titles.some(t => t.toLowerCase() === titleName.toLowerCase());
    });
  }, [departments, titleName]);

  // Find assigned team
  const assignedTeam = useMemo(() => {
    if (!parentDept) return null;
    const dTeams = parseTeams(parentDept.teams);

    return dTeams.find((t: any) => {
      const tTitles = parseJobTitles(t.job_titles);
      return tTitles.some((jt: string) => jt.toLowerCase() === titleName.toLowerCase());
    });
  }, [parentDept, titleName]);

  // Incumbents (employees with this title)
  const incumbents = useMemo(() => {
    return employees.filter(e => (e.job_title || '').toLowerCase() === titleName.toLowerCase());
  }, [employees, titleName]);

  // Initialize form state
  useEffect(() => {
    if (parentDept) {
      setSelectedDeptId(parentDept.id.toString());
    }
    if (assignedTeam) {
      setSelectedTeamName(assignedTeam.name);
    }
    setNewTitle(titleName);

    // Load JD details if available
    const loadJD = async () => {
      try {
        const res = await fetch('/api/job_descriptions');
        if (res.ok) {
          const jds = await res.json();
          const match = jds.find((j: any) => j.title?.toLowerCase() === titleName.toLowerCase());
          if (match) {
            setGrade(match.grade || 'Grade 3 / Mid-Senior');
            setSalaryBand(match.salary_band || '');
            setReportsTo(match.reports_to || '');
            setObjective(match.objective || '');
            return;
          }
        }
      } catch (e) {}

      // Fallback from default JD library
      const fallback = DEFAULT_JOB_DESCRIPTIONS[titleName] || DEFAULT_JOB_DESCRIPTIONS[Object.keys(DEFAULT_JOB_DESCRIPTIONS).find(k => k.toLowerCase() === titleName.toLowerCase()) || ''];
      if (fallback) {
        setGrade(fallback.grade || 'Grade 3 / Mid-Senior');
        setSalaryBand(fallback.salaryBand || '');
        setReportsTo(fallback.reportsTo || '');
        setObjective(fallback.objective || '');
      }
    };

    loadJD();
  }, [parentDept, assignedTeam, titleName]);

  if (!titleName) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4">
        <Tag className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-700">Job Title Not Found</h3>
        <button
          type="button"
          onClick={() => navigate('/hr/departments/titles')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Job Titles
        </button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!newTitle.trim()) {
      showCustomToast('Job title cannot be empty.', 'error');
      return;
    }

    try {
      setSaving(true);
      const targetDept = departments.find(d => String(d.id) === String(selectedDeptId)) || parentDept;

      const jdObj: JobDescriptionDetails = {
        department: targetDept?.name || 'General',
        team: selectedTeamName,
        grade,
        salaryBand,
        reportsTo,
        employmentType: 'Full-Time',
        location: 'On-Site',
        status: 'Approved',
        objective: objective || `Lead deliverables for ${newTitle}.`,
        responsibilities: [
          `Execute deliverables for ${newTitle}.`,
          `Collaborate with team leadership and colleagues.`,
          `Maintain high quality and standards compliance.`
        ],
        education: "Bachelor's Degree in related field.",
        technicalSkills: [`${targetDept?.name || ''} Competencies`],
        softSkills: ['Communication', 'Teamwork'],
        certifications: ['Professional Certification'],
        kpis: ['On-time completion ≥ 95%'],
        raciRole: 'Responsible'
      };

      await syncJobTitleAndDescriptionEdits({
        oldTitle: titleName,
        newTitle: newTitle.trim(),
        newDepartmentName: targetDept?.name || '',
        newGradeName: grade,
        newTeamName: selectedTeamName,
        jdDetails: jdObj,
        departments,
        employees
      });

      showCustomToast(`Job title updated successfully!`, 'success');
      await fetchData();
      setIsEditing(false);
      navigate(`/hr/departments/titles/${encodeURIComponent(newTitle.trim())}`);
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to update job title', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!parentDept) return;
    try {
      setSaving(true);
      let existingTitles: string[] = [];
      if (Array.isArray(parentDept.job_titles)) existingTitles = [...parentDept.job_titles];
      else if (typeof parentDept.job_titles === 'string') {
        try { existingTitles = JSON.parse(parentDept.job_titles); } catch (e) {}
      }

      const updatedTitles = existingTitles.filter(t => t.toLowerCase() !== titleName.toLowerCase());

      const payload = {
        id: parentDept.id,
        name: parentDept.name,
        description: parentDept.description,
        department_head_id: parentDept.department_head_id,
        teams: parentDept.teams,
        job_titles: updatedTitles
      };

      await saveDepartmentAPI(payload, currentUser?.id);
      showCustomToast(`Job title "${titleName}" deleted`, 'success');
      await fetchData();
      navigate('/hr/departments/titles');
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to delete job title', 'error');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/departments/titles')}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-md">
                {parentDept?.name || 'Department Role'}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">{titleName}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/hr/departments/descriptions`)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all"
          >
            <FileText className="w-3.5 h-3.5" /> Full JD Profile
          </button>

          {(isHRAdmin || canEditDept) && (
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer",
                isEditing ? "bg-slate-200 text-slate-800" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
              )}
            >
              <Edit2 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel' : 'Edit Title'}
            </button>
          )}

          {(isHRAdmin || canDeleteDept) && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Delete Title"
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
                  Job Title Name *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Job Grade / Level
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                >
                  <option value="Grade 1 / Executive Leadership (C-Level)">Grade 1 / Executive Leadership (C-Level)</option>
                  <option value="Grade 2 / Department Management & Directors">Grade 2 / Department Management & Directors</option>
                  <option value="Grade 3 / Mid-Senior">Grade 3 / Mid-Senior Specialist</option>
                  <option value="Grade 4 / Mid-Level">Grade 4 / Professional & Specialist</option>
                  <option value="Grade 5 / Entry-Level">Grade 5 / Associate & Entry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Salary Band
                </label>
                <input
                  type="text"
                  value={salaryBand}
                  onChange={(e) => setSalaryBand(e.target.value)}
                  placeholder="e.g., $85,000 - $115,000 / year"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Reports To
                </label>
                <input
                  type="text"
                  value={reportsTo}
                  onChange={(e) => setReportsTo(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Objective & Scope
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none resize-none"
              />
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
                disabled={saving || !newTitle.trim()}
                onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Title Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{titleName}</h3>
                  <p className="text-xs text-slate-500 font-medium">{grade}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2">{objective || 'Lead core functional responsibilities and execution.'}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department & Team</span>
              <span className="text-xs font-black text-slate-800 block">{parentDept?.name || 'Unassigned'}</span>
              <span className="text-[11px] text-indigo-600 font-semibold">{assignedTeam?.name || 'Dept-Wide'}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Salary Range</span>
              <span className="text-xs font-black text-emerald-600 block">{salaryBand || 'Band Not Specified'}</span>
              <span className="text-[10px] text-slate-400 block">Reports to: {reportsTo || 'Dept Manager'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Incumbents List */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Active Employees with this Title ({incumbents.length})
            </h3>
            <p className="text-xs text-slate-500">Staff members currently appointed to this role.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {incumbents.map((emp) => (
            <div key={emp.id} className="py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                  {emp.name ? emp.name.charAt(0) : '?'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{emp.name}</h4>
                  <span className="text-[11px] text-slate-500">
                    ID #{emp.id} • {emp.email || 'No email'}
                  </span>
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

          {incumbents.length === 0 && (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No employees are currently appointed to this job title.
            </p>
          )}
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
              <h3 className="text-lg font-bold text-slate-900">Delete Job Title?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-800">{titleName}</strong>?
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
                {saving ? 'Deleting...' : 'Yes, Delete Job Title'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTitleDetailsPage;
