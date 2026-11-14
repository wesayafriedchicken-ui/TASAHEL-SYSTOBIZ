import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Tag, Building2, Users, ArrowLeft, Save, 
  Briefcase, DollarSign, Shield, Check, Plus, Trash2, Award 
} from 'lucide-react';
import { useHRContext } from '../../HRContext';
import { cn } from '../../../../lib/utils';
import { saveDepartmentAPI, parseJobTitles, parseTeams } from '../deptUtils';
import { syncJobTitleAndDescriptionEdits, JobDescriptionDetails } from '../../../../components/HR/DepartmentSubTabs';

export const AddJobTitlePage: React.FC = () => {
  const { departments, employees, showCustomToast, fetchData, currentUser } = useHRContext();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id?.toString() || '');
  const [selectedTeamName, setSelectedTeamName] = useState<string>('');
  const [grade, setGrade] = useState('Grade 3 / Mid-Senior');
  const [salaryBand, setSalaryBand] = useState('$70,000 - $95,000 / year');
  const [reportsTo, setReportsTo] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [location, setLocation] = useState('On-Site');
  const [objective, setObjective] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>([
    'Execute core domain deliverables with high quality and adherence to specifications.',
    'Collaborate closely with cross-functional stakeholders and team members.',
    'Maintain compliance with internal standards and operational SOPs.'
  ]);
  const [newRespInput, setNewRespInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Selected department & teams
  const selectedDepartment = useMemo(() => {
    return departments.find(d => String(d.id) === String(selectedDeptId));
  }, [departments, selectedDeptId]);

  const availableTeams = useMemo(() => {
    if (!selectedDepartment?.teams) return [];
    return parseTeams(selectedDepartment.teams);
  }, [selectedDepartment]);

  const handleAddResp = () => {
    if (!newRespInput.trim()) return;
    setResponsibilities([...responsibilities, newRespInput.trim()]);
    setNewRespInput('');
  };

  const handleRemoveResp = (index: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== index));
  };

  const handleSaveJobTitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showCustomToast('Job title name is required.', 'error');
      return;
    }
    if (!selectedDepartment) {
      showCustomToast('Please select a parent department.', 'error');
      return;
    }

    try {
      setSaving(true);
      const trimmedTitle = title.trim();

      // 1. Add title to department job_titles
      const existingTitles = parseJobTitles(selectedDepartment.job_titles);
      if (!existingTitles.includes(trimmedTitle)) {
        existingTitles.push(trimmedTitle);
      }

      // If team selected, also assign to team
      let existingTeams = parseTeams(selectedDepartment.teams);
      if (selectedTeamName) {
        existingTeams = existingTeams.map(t => {
          if (t.name === selectedTeamName) {
            const teamTitles = parseJobTitles(t.job_titles);
            if (!teamTitles.includes(trimmedTitle)) {
              teamTitles.push(trimmedTitle);
            }
            return { ...t, job_titles: teamTitles };
          }
          return t;
        });
      }

      const updatedDept = {
        ...selectedDepartment,
        teams: existingTeams,
        job_titles: existingTitles
      };

      await saveDepartmentAPI(updatedDept, currentUser?.id);

      // 2. Create / Sync synchronized Job Description
      const jdObj: JobDescriptionDetails = {
        department: selectedDepartment.name,
        team: selectedTeamName,
        grade,
        salaryBand,
        reportsTo: reportsTo || `${selectedDepartment.name} Manager`,
        employmentType,
        location,
        status: 'Approved',
        objective: objective || `Lead key deliverables and execution for ${trimmedTitle} within ${selectedDepartment.name}.`,
        responsibilities,
        education: "Bachelor's Degree in related discipline or equivalent experience.",
        technicalSkills: [`${selectedDepartment.name} Competencies`, 'Domain Mastery'],
        softSkills: ['Teamwork', 'Communication', 'Initiative'],
        certifications: ['Standard Industry Certification'],
        kpis: ['On-time deliverable completion ≥ 95%', 'Adherence to departmental KPIs'],
        raciRole: 'Responsible'
      };

      await syncJobTitleAndDescriptionEdits({
        oldTitle: trimmedTitle,
        newTitle: trimmedTitle,
        newDepartmentName: selectedDepartment.name,
        newGradeName: grade,
        newTeamName: selectedTeamName,
        jdDetails: jdObj,
        departments,
        employees
      });

      showCustomToast(`Job Title "${trimmedTitle}" created with synchronized Job Description!`, 'success');
      await fetchData();
      navigate('/hr/departments/titles');
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to create job title', 'error');
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
            onClick={() => navigate('/hr/departments/titles')}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              Add New Job Title
            </h2>
            <p className="text-xs text-slate-500 font-medium">Define a role title, map to department & grade, and create the Job Description profile.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/hr/departments/titles')}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !title.trim() || !selectedDeptId}
            onClick={handleSaveJobTitle}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all text-xs justify-center cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Job Title'}
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSaveJobTitle} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Job Title Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Senior Systems Architect, HR Business Partner..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedTeamName('');
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              required
            >
              <option value="">-- Select Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Assigned Team (Optional)
            </label>
            <select
              value={selectedTeamName}
              onChange={(e) => setSelectedTeamName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
            >
              <option value="">-- Department-Wide / No Specific Team --</option>
              {availableTeams.map((t: any, idx: number) => (
                <option key={idx} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
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
              Salary Band Estimate
            </label>
            <input
              type="text"
              value={salaryBand}
              onChange={(e) => setSalaryBand(e.target.value)}
              placeholder="e.g., $80,000 - $110,000 / year"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Reports To Role
            </label>
            <input
              type="text"
              value={reportsTo}
              onChange={(e) => setReportsTo(e.target.value)}
              placeholder="e.g., VP of Engineering, Operations Director"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Work Location & Mode
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
            >
              <option value="On-Site">On-Site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Role Objective & Overview
          </label>
          <textarea
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            rows={3}
            placeholder="High-level mission and primary goals for this position..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none resize-none"
          />
        </div>

        {/* Responsibilities list */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Key Responsibilities
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRespInput}
              onChange={(e) => setNewRespInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddResp();
                }
              }}
              placeholder="Add key responsibility item..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
            <button
              type="button"
              onClick={handleAddResp}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
            >
              Add
            </button>
          </div>

          <div className="space-y-2 mt-2">
            {responsibilities.map((resp, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <span className="font-semibold text-slate-800">{resp}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveResp(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/hr/departments/titles')}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim() || !selectedDeptId}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Sync Job Title'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddJobTitlePage;
