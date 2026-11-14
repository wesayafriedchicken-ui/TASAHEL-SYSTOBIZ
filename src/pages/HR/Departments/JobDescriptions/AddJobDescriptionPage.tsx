import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Building2, Users, ArrowLeft, Save, Plus, 
  Trash2, Award, Briefcase, DollarSign, Target, CheckCircle2, Shield 
} from 'lucide-react';
import { useHRContext } from '../../HRContext';
import { cn } from '../../../../lib/utils';
import { JobDescriptionDetails } from '../../../../components/HR/DepartmentSubTabs';

export const AddJobDescriptionPage: React.FC = () => {
  const { departments, employees, showCustomToast, fetchData } = useHRContext();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState(departments[0]?.name || '');
  const [team, setTeam] = useState('');
  const [grade, setGrade] = useState('Grade 3 / Mid-Senior');
  const [salaryBand, setSalaryBand] = useState('$75,000 - $100,000 / year');
  const [reportsTo, setReportsTo] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [location, setLocation] = useState('On-Site');
  const [status, setStatus] = useState<'Approved' | 'Draft' | 'Under Review'>('Approved');
  const [objective, setObjective] = useState('');
  const [raciRole, setRaciRole] = useState<'Responsible' | 'Accountable' | 'Consulted' | 'Informed'>('Responsible');

  // Lists
  const [responsibilities, setResponsibilities] = useState<string[]>([
    'Execute core deliverables aligned with the functional charter.',
    'Collaborate effectively with team members and departmental leadership.',
    'Uphold organizational quality standards and data integrity.'
  ]);
  const [newRespInput, setNewRespInput] = useState('');

  const [technicalSkills, setTechnicalSkills] = useState<string[]>(['Workflow Optimization', 'Technical Reporting']);
  const [newTechInput, setNewTechInput] = useState('');

  const [softSkills, setSoftSkills] = useState<string[]>(['Cross-Functional Communication', 'Problem Solving']);
  const [newSoftInput, setNewSoftInput] = useState('');

  const [education, setEducation] = useState("Bachelor's Degree in relevant field or equivalent experience.");
  const [certifications, setCertifications] = useState<string[]>(['Relevant Industry Certification']);
  const [newCertInput, setNewCertInput] = useState('');

  const [kpis, setKpis] = useState<string[]>([
    'On-time completion of assigned deliverables ≥ 95%',
    'Adherence to departmental standard operating procedures'
  ]);
  const [newKpiInput, setNewKpiInput] = useState('');

  const [saving, setSaving] = useState(false);

  // Department teams
  const selectedDeptObj = useMemo(() => {
    return departments.find(d => d.name === department);
  }, [departments, department]);

  const availableTeams = useMemo(() => {
    if (!selectedDeptObj?.teams) return [];
    if (Array.isArray(selectedDeptObj.teams)) return selectedDeptObj.teams;
    if (typeof selectedDeptObj.teams === 'string') {
      try { return JSON.parse(selectedDeptObj.teams); } catch (e) {}
    }
    return [];
  }, [selectedDeptObj]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showCustomToast('Job Title is required.', 'error');
      return;
    }

    try {
      setSaving(true);
      const trimmedTitle = title.trim();

      const jdDetails: JobDescriptionDetails = {
        department,
        team,
        grade,
        salaryBand,
        reportsTo: reportsTo || `${department} Director`,
        employmentType,
        location,
        status,
        objective: objective || `Lead key strategic and operational deliverables for ${trimmedTitle}.`,
        responsibilities,
        education,
        technicalSkills,
        softSkills,
        certifications,
        kpis,
        raciRole
      };

      // 1. Save to Database API
      const payload = {
        title: trimmedTitle,
        department,
        team,
        grade,
        salary_band: salaryBand,
        reports_to: reportsTo,
        employment_type: employmentType,
        location,
        status,
        objective: jdDetails.objective,
        responsibilities: JSON.stringify(responsibilities),
        education,
        technical_skills: JSON.stringify(technicalSkills),
        soft_skills: JSON.stringify(softSkills),
        certifications: JSON.stringify(certifications),
        kpis: JSON.stringify(kpis),
        raci_role: raciRole
      };

      await fetch('/api/job_descriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
        body: JSON.stringify(payload)
      });

      // 2. Update localStorage
      let customMap: Record<string, any> = {};
      try {
        const local = localStorage.getItem('systo_custom_jds');
        if (local) customMap = JSON.parse(local);
      } catch (e) {}
      customMap[trimmedTitle] = jdDetails;
      localStorage.setItem('systo_custom_jds', JSON.stringify(customMap));

      showCustomToast(`Job Description for "${trimmedTitle}" created successfully!`, 'success');
      await fetchData();
      navigate('/hr/departments/descriptions');
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to save Job Description', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/departments/descriptions')}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Add New Job Description
            </h2>
            <p className="text-xs text-slate-500 font-medium">Build a full JD profile including RACI accountability, skills matrix, and measurable KPIs.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/hr/departments/descriptions')}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !title.trim()}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all text-xs justify-center cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Job Description'}
          </button>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {/* Section 1: Role Overview */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            1. Role Overview & Classification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Lead Cloud Architect, Head of Talent"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Department *</label>
              <select
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setTeam('');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
                required
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Team (Optional)</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              >
                <option value="">-- No Specific Team / Dept-Wide --</option>
                {availableTeams.map((t: any, idx: number) => (
                  <option key={idx} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Job Grade</label>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Salary Band</label>
              <input
                type="text"
                value={salaryBand}
                onChange={(e) => setSalaryBand(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reports To</label>
              <input
                type="text"
                value={reportsTo}
                onChange={(e) => setReportsTo(e.target.value)}
                placeholder="e.g., VP of Product"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Approval Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              >
                <option value="Approved">Approved</option>
                <option value="Draft">Draft</option>
                <option value="Under Review">Under Review</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Objective & Summary</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              placeholder="Core mission and executive summary of this job description..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Section 2: Key Responsibilities */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            2. Key Responsibilities
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newRespInput}
              onChange={(e) => setNewRespInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newRespInput.trim()) {
                    setResponsibilities([...responsibilities, newRespInput.trim()]);
                    setNewRespInput('');
                  }
                }
              }}
              placeholder="Add key deliverable or responsibility..."
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
            />
            <button
              type="button"
              onClick={() => {
                if (newRespInput.trim()) {
                  setResponsibilities([...responsibilities, newRespInput.trim()]);
                  setNewRespInput('');
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {responsibilities.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <span className="font-semibold text-slate-800">{r}</span>
                <button
                  type="button"
                  onClick={() => setResponsibilities(responsibilities.filter((_, i) => i !== idx))}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Skills & RACI */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
            <Target className="w-4 h-4 text-purple-600" />
            3. Skills Matrix, KPIs & RACI Role
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">RACI Governance Role</label>
              <select
                value={raciRole}
                onChange={(e) => setRaciRole(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              >
                <option value="Responsible">Responsible (Does the work)</option>
                <option value="Accountable">Accountable (Final approval & ownership)</option>
                <option value="Consulted">Consulted (Provides input & feedback)</option>
                <option value="Informed">Informed (Kept updated on progress)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Education Requirements</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Technical Skills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Technical Skills</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTechInput}
                onChange={(e) => setNewTechInput(e.target.value)}
                placeholder="Add technical skill..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <button
                type="button"
                onClick={() => {
                  if (newTechInput.trim() && !technicalSkills.includes(newTechInput.trim())) {
                    setTechnicalSkills([...technicalSkills, newTechInput.trim()]);
                    setNewTechInput('');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >
                Add Skill
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {technicalSkills.map((ts, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-800 rounded-lg text-xs font-bold">
                  {ts}
                  <button type="button" onClick={() => setTechnicalSkills(technicalSkills.filter((_, i) => i !== idx))} className="text-indigo-400 hover:text-rose-600">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* KPIs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Measurable Performance KPIs</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKpiInput}
                onChange={(e) => setNewKpiInput(e.target.value)}
                placeholder="Add performance KPI metric..."
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              />
              <button
                type="button"
                onClick={() => {
                  if (newKpiInput.trim() && !kpis.includes(newKpiInput.trim())) {
                    setKpis([...kpis, newKpiInput.trim()]);
                    setNewKpiInput('');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >
                Add KPI
              </button>
            </div>
            <div className="space-y-1.5 mt-2">
              {kpis.map((kpi, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700">
                  <span>• {kpi}</span>
                  <button type="button" onClick={() => setKpis(kpis.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/hr/departments/descriptions')}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Publish Job Description'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddJobDescriptionPage;
