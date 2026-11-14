import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, Building2, Users, Tag, ArrowLeft, Edit2, 
  Trash2, Save, Printer, Share2, Award, Briefcase, 
  DollarSign, CheckCircle2, Shield, Target, AlertCircle 
} from 'lucide-react';
import { useHRContext } from '../../HRContext';
import { cn } from '../../../../lib/utils';
import { JobDescriptionDetails, DEFAULT_JOB_DESCRIPTIONS } from '../../../../components/HR/DepartmentSubTabs';

export const JobDescriptionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const rawTitle = decodeURIComponent(id || '');

  const { departments, employees, isHRAdmin, canEditDept, canDeleteDept, showCustomToast, fetchData } = useHRContext();

  const [dbJDs, setDbJDs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form State
  const [title, setTitle] = useState(rawTitle);
  const [department, setDepartment] = useState('');
  const [team, setTeam] = useState('');
  const [grade, setGrade] = useState('Grade 3 / Mid-Senior');
  const [salaryBand, setSalaryBand] = useState('');
  const [reportsTo, setReportsTo] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [location, setLocation] = useState('On-Site');
  const [status, setStatus] = useState<'Approved' | 'Draft' | 'Under Review'>('Approved');
  const [objective, setObjective] = useState('');
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [technicalSkills, setTechnicalSkills] = useState<string[]>([]);
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [kpis, setKpis] = useState<string[]>([]);
  const [raciRole, setRaciRole] = useState<'Responsible' | 'Accountable' | 'Consulted' | 'Informed'>('Responsible');

  const [dbId, setDbId] = useState<number | null>(null);

  // Fetch JD details
  useEffect(() => {
    const fetchJD = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/job_descriptions');
        let matched: any = null;
        if (res.ok) {
          const list = await res.json();
          setDbJDs(list);
          matched = list.find((j: any) => 
            String(j.id) === rawTitle || 
            j.title?.toLowerCase() === rawTitle.toLowerCase()
          );
        }

        let customMap: Record<string, any> = {};
        try {
          const local = localStorage.getItem('systo_custom_jds');
          if (local) customMap = JSON.parse(local);
        } catch (e) {}

        const localMatch = customMap[rawTitle] || customMap[Object.keys(customMap).find(k => k.toLowerCase() === rawTitle.toLowerCase()) || ''];
        const fallbackMatch = DEFAULT_JOB_DESCRIPTIONS[rawTitle] || DEFAULT_JOB_DESCRIPTIONS[Object.keys(DEFAULT_JOB_DESCRIPTIONS).find(k => k.toLowerCase() === rawTitle.toLowerCase()) || ''];

        const activeObj = matched || localMatch || fallbackMatch;

        if (matched) {
          setDbId(matched.id);
        }

        if (activeObj) {
          setTitle(matched?.title || rawTitle);
          setDepartment(activeObj.department || departments[0]?.name || '');
          setTeam(activeObj.team || '');
          setGrade(activeObj.grade || 'Grade 3 / Mid-Senior');
          setSalaryBand(activeObj.salary_band || activeObj.salaryBand || '');
          setReportsTo(activeObj.reports_to || activeObj.reportsTo || '');
          setEmploymentType(activeObj.employment_type || activeObj.employmentType || 'Full-Time');
          setLocation(activeObj.location || 'On-Site');
          setStatus((activeObj.status as any) || 'Approved');
          setObjective(activeObj.objective || '');

          let respList = activeObj.responsibilities || [];
          if (typeof respList === 'string') {
            try { respList = JSON.parse(respList); } catch (e) {}
          }
          setResponsibilities(Array.isArray(respList) ? respList : []);

          let techList = activeObj.technical_skills || activeObj.technicalSkills || activeObj.skills || [];
          if (typeof techList === 'string') {
            try { techList = JSON.parse(techList); } catch (e) {}
          }
          setTechnicalSkills(Array.isArray(techList) ? techList : []);

          let softList = activeObj.soft_skills || activeObj.softSkills || [];
          if (typeof softList === 'string') {
            try { softList = JSON.parse(softList); } catch (e) {}
          }
          setSoftSkills(Array.isArray(softList) ? softList : []);

          setEducation(activeObj.education || "Bachelor's Degree in relevant field.");

          let certList = activeObj.certifications || [];
          if (typeof certList === 'string') {
            try { certList = JSON.parse(certList); } catch (e) {}
          }
          setCertifications(Array.isArray(certList) ? certList : []);

          let kpiList = activeObj.kpis || [];
          if (typeof kpiList === 'string') {
            try { kpiList = JSON.parse(kpiList); } catch (e) {}
          }
          setKpis(Array.isArray(kpiList) ? kpiList : []);

          setRaciRole(activeObj.raci_role || activeObj.raciRole || 'Responsible');
        }
      } catch (e) {
        console.error('Failed to load JD details:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchJD();
  }, [rawTitle, departments]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `Job Description: ${title}\nDepartment: ${department}\nGrade: ${grade}\nSalary: ${salaryBand}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showCustomToast('JD summary copied to clipboard!', 'success');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showCustomToast('Job Title is required.', 'error');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: title.trim(),
        department,
        team,
        grade,
        salary_band: salaryBand,
        reports_to: reportsTo,
        employment_type: employmentType,
        location,
        status,
        objective,
        responsibilities: JSON.stringify(responsibilities),
        education,
        technical_skills: JSON.stringify(technicalSkills),
        soft_skills: JSON.stringify(softSkills),
        certifications: JSON.stringify(certifications),
        kpis: JSON.stringify(kpis),
        raci_role: raciRole
      };

      if (dbId) {
        await fetch(`/api/job_descriptions/${dbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
          body: JSON.stringify(payload)
        });
      } else {
        const res = await fetch('/api/job_descriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          if (created?.id) setDbId(created.id);
        }
      }

      // Update LocalStorage
      let customMap: Record<string, any> = {};
      try {
        const local = localStorage.getItem('systo_custom_jds');
        if (local) customMap = JSON.parse(local);
      } catch (e) {}

      customMap[title.trim()] = {
        department,
        team,
        grade,
        salaryBand,
        reportsTo,
        employmentType,
        location,
        status,
        objective,
        responsibilities,
        education,
        technicalSkills,
        softSkills,
        certifications,
        kpis,
        raciRole
      };
      localStorage.setItem('systo_custom_jds', JSON.stringify(customMap));

      showCustomToast('Job Description updated successfully!', 'success');
      await fetchData();
      setIsEditing(false);
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to update JD', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      if (dbId) {
        await fetch(`/api/job_descriptions/${dbId}`, {
          method: 'DELETE',
          headers: { 'x-user-id': '1' }
        });
      }

      let customMap: Record<string, any> = {};
      try {
        const local = localStorage.getItem('systo_custom_jds');
        if (local) customMap = JSON.parse(local);
        delete customMap[rawTitle];
        localStorage.setItem('systo_custom_jds', JSON.stringify(customMap));
      } catch (e) {}

      showCustomToast(`Job Description for "${rawTitle}" deleted`, 'success');
      await fetchData();
      navigate('/hr/departments/descriptions');
    } catch (err: any) {
      showCustomToast(err.message || 'Failed to delete JD', 'error');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:max-w-full">
      {/* Top Bar (Hidden in Print) */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/departments/descriptions')}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase rounded-md">
                {department || 'Department Role'}
              </span>
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded-md uppercase",
                status === 'Approved' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              )}>
                {status}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-0.5">{title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
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
              <Edit2 className="w-3.5 h-3.5" /> {isEditing ? 'Cancel Edit' : 'Edit JD'}
            </button>
          )}

          {(isHRAdmin || canDeleteDept) && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Delete JD"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Document Layout */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-black text-indigo-600 tracking-wider uppercase block">Job Description Profile</span>
              <h1 className="text-2xl font-black text-slate-900">{title}</h1>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">RACI Matrix Role</span>
                <span className="text-xs font-black text-indigo-700">{raciRole}</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                <span className="text-xs font-black text-emerald-600">{status}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-0.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Department</span>
              <span className="font-bold text-slate-800">{department || 'Unassigned'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-0.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Team / Squad</span>
              <span className="font-bold text-slate-800">{team || 'Dept-Wide'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-0.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Job Grade</span>
              <span className="font-bold text-slate-800">{grade}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-0.5">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Salary Band</span>
              <span className="font-bold text-emerald-600">{salaryBand || 'Undisclosed'}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Objective & Mission */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            1. Role Purpose & Executive Summary
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
            {objective || `Lead key strategic and operational deliverables for the ${title} position within ${department}.`}
          </p>
        </div>

        {/* Section 2: Key Responsibilities */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            2. Key Responsibilities & Core Deliverables
          </h3>
          <div className="space-y-2">
            {responsibilities.map((resp, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="font-medium text-slate-800">{resp}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Skills & Qualifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Technical Skills */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Technical & Domain Competencies
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {technicalSkills.map((sk, idx) => (
                <span key={idx} className="px-3 py-1 bg-indigo-50 text-indigo-800 font-bold rounded-xl text-xs border border-indigo-100">
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {/* Soft Skills */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              Leadership & Interpersonal Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {softSkills.map((sk, idx) => (
                <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-800 font-bold rounded-xl text-xs border border-purple-100">
                  {sk}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Performance KPIs */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4 text-rose-600" />
            4. Performance Evaluation KPIs
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{kpi}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Requirements & Certifications */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Education Requirement:</span>
            <span className="text-slate-600">{education}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Reporting Hierarchy:</span>
            <span className="text-slate-600">Reports to {reportsTo || 'Department Leadership'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700">Employment Terms:</span>
            <span className="text-slate-600">{employmentType} • {location}</span>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Job Description?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete the Job Description for <strong className="text-slate-800">{title}</strong>?
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
                {saving ? 'Deleting...' : 'Yes, Delete JD'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDescriptionDetailsPage;
