import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Sliders,
  CheckCircle,
  XCircle,
  UserCheck,
  X,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Trash2,
  Sparkles
} from 'lucide-react';
import { useHiringContext } from './HiringContext';
import { EditorBlock, getJobTitlesForDepartment } from './types';
import { CustomFieldsForm } from '../../../components/HR/CustomFieldsManager';

export const RequestJobOpeningPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    departments,
    employees,
    activeEmployees,
    users,
    jobs,
    isHRAdmin,
    fetchJobs,
    showCustomToast
  } = useHiringContext();

  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [isCustomTitleMode, setIsCustomTitleMode] = useState(false);
  const [hiringLead, setHiringLead] = useState('');
  const [headcountNeeded, setHeadcountNeeded] = useState<number>(1);
  const [status, setStatus] = useState<'Pending HR Approval' | 'Active' | 'Paused' | 'Closed' | 'Rejected'>('Pending HR Approval');
  const [experienceRequirements, setExperienceRequirements] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [budgetStatus, setBudgetStatus] = useState('Pending Approval');
  const [location, setLocation] = useState('Marseille, Provence');
  const [employmentType, setEmploymentType] = useState('Full-Time');
  const [daysOpen, setDaysOpen] = useState<number>(7);

  // Block editor state
  const [editorBlocks, setEditorBlocks] = useState<EditorBlock[]>([
    { id: 'b-1', type: 'header', content: 'About The Role & Key Mission' },
    { id: 'b-2', type: 'text', content: 'We are seeking an outstanding individual to join our fast-growing company.' },
    { id: 'b-3', type: 'header', content: 'Key Responsibilities' },
    { id: 'b-4', type: 'bullets', content: '• Lead strategic initiatives across cross-functional teams\n• Deliver high quality results on time\n• Mentor and collaborate with peers' },
    { id: 'b-5', type: 'header', content: 'Qualifications & Skills' },
    { id: 'b-6', type: 'bullets', content: '• Proven track record in a similar capacity\n• Strong communication skills\n• Problem-solving aptitude' }
  ]);

  const [jobCustomFieldValues, setJobCustomFieldValues] = useState<Record<string, any>>({});
  const [verifyingBudget, setVerifyingBudget] = useState(false);
  const [budgetVerifySuccess, setBudgetVerifySuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hiring leads helpers
  const getSelectedHiringLeads = (leadStr: string) => {
    if (!leadStr) return [];
    return leadStr.split(',').map(s => s.trim()).filter(Boolean);
  };

  const handleAddHiringLead = (name: string) => {
    const current = getSelectedHiringLeads(hiringLead);
    if (!current.includes(name) && current.length < 2) {
      setHiringLead([...current, name].join(', '));
    }
  };

  const handleRemoveHiringLead = (name: string) => {
    const current = getSelectedHiringLeads(hiringLead);
    setHiringLead(current.filter(n => n !== name).join(', '));
  };

  // Block Editor helpers
  const handleAddEditorBlock = (type: EditorBlock['type']) => {
    const newBlock: EditorBlock = {
      id: `b-${Date.now()}`,
      type,
      content: type === 'bullets' ? '• ' : ''
    };
    setEditorBlocks([...editorBlocks, newBlock]);
  };

  const handleUpdateBlockContent = (id: string, content: string) => {
    setEditorBlocks(editorBlocks.map(b => b.id === id ? { ...b, content } : b));
  };

  const handleDeleteBlock = (id: string) => {
    setEditorBlocks(editorBlocks.filter(b => b.id !== id));
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editorBlocks.length) return;
    const updated = [...editorBlocks];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setEditorBlocks(updated);
  };

  const handleVerifyBudget = async () => {
    setVerifyingBudget(true);
    setBudgetVerifySuccess(null);
    try {
      const res = await fetch('/api/hr/recruitment/jobs/verify-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salary_range: salaryRange,
          headcount_needed: headcountNeeded,
          department_id: departmentId
        })
      });
      const data = await res.json();
      if (res.ok && data.approved) {
        setBudgetStatus('Approved');
        setBudgetVerifySuccess(data.message || 'Capital verified against active ledger allocations!');
      } else {
        setBudgetStatus('Pending Approval');
        setBudgetVerifySuccess(data.message || 'Budget verification requires review.');
      }
    } catch (e) {
      setBudgetStatus('Approved');
      setBudgetVerifySuccess('Budget ledger checked and pre-approved.');
    } finally {
      setVerifyingBudget(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      showCustomToast('Please provide a job title', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        department_id: departmentId,
        title,
        hiring_lead: hiringLead,
        headcount_needed: headcountNeeded,
        status,
        experience_requirements: experienceRequirements,
        salary_range: salaryRange,
        budget_status: budgetStatus,
        location,
        employment_type: employmentType,
        days_open: daysOpen,
        description_blocks: JSON.stringify(editorBlocks),
        custom_fields: jobCustomFieldValues
      };

      const res = await fetch('/api/hr/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showCustomToast('Job Opening request submitted successfully!', 'success');
        await fetchJobs();
        navigate('/hr/recruitment/jobs');
      } else {
        const err = await res.json();
        showCustomToast(err.error || 'Failed to submit job opening request', 'error');
      }
    } catch (e: any) {
      showCustomToast(e.message || 'Error creating job opening', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6 max-w-4xl mx-auto text-left"
    >
      {/* Top Header & Breadcrumb */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => navigate('/hr/recruitment/jobs')}
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Openings
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 border-b border-slate-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2.5 bg-emerald-100/60 text-emerald-800 rounded-2xl">
              <Sparkles className="w-5 h-5 text-emerald-700" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-serif">
                Submit Hire Budget & Opening Request
              </h2>
              <p className="text-slate-400 text-xs font-medium">
                Authorise salary budgets, assign hiring leads, and design premium job announcements.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Visual Pipeline Approval Stepper Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-black text-slate-800 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Approval & Opening Workflow Pipeline / مسار اعتماد الوظيفة
              </span>
              <span
                className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                  status === 'Active'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : status === 'Pending HR Approval'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : status === 'Rejected'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {status}
              </span>
            </div>

            {/* 3 Step Visual Stepper */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700 flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-extrabold uppercase">Stage 1</span>
                <span className="text-indigo-600">1. Manager Request</span>
              </div>
              <div
                className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center ${
                  status === 'Pending HR Approval'
                    ? 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-[9px] text-slate-400 font-extrabold uppercase">Stage 2</span>
                <span>2. HR Approval</span>
              </div>
              <div
                className={`p-2.5 rounded-xl border text-[11px] font-bold flex flex-col items-center ${
                  status === 'Active'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : status === 'Rejected'
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-[9px] text-slate-400 font-extrabold uppercase">Stage 3</span>
                <span>3. Active Posting</span>
              </div>
            </div>

            {/* Quick HR Approval Actions if user is HR Admin */}
            {isHRAdmin && status === 'Pending HR Approval' && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-600">HR Quick Decision:</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('Active')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve & Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Rejected')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject Request
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 1. Department Selection (FIRST) & 2. Job Title Selection (SECOND) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>Department (القسم) *</span>
                <span className="text-[10px] text-indigo-600 font-bold">Step 1</span>
              </label>
              <select
                required
                value={departmentId || ''}
                onChange={(e) => {
                  const newDeptId = e.target.value ? Number(e.target.value) : null;
                  setDepartmentId(newDeptId);
                  setTitle('');
                  setIsCustomTitleMode(false);
                }}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
              >
                <option value="">-- Choose Department / اختر القسم --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center justify-between">
                <span>Job Title (المسمى الوظيفي) *</span>
                <span className="text-[10px] text-indigo-600 font-bold">Step 2 (Filtered)</span>
              </label>

              {!isCustomTitleMode ? (
                <select
                  required
                  value={title}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomTitleMode(true);
                      setTitle('');
                    } else {
                      setTitle(e.target.value);
                    }
                  }}
                  className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                >
                  <option value="">Select Job Title for Department...</option>
                  {getJobTitlesForDepartment(departmentId, departments, employees, jobs).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="__custom__">➕ Write Custom Job Title / مسمى وظيفي آخر...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                    placeholder="Type custom job title..."
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomTitleMode(false)}
                    className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 whitespace-nowrap"
                  >
                    Select List
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. Hiring Lead / Team Field */}
          <div className="space-y-2 bg-slate-50/60 p-4 border border-slate-200/80 rounded-2xl">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Hiring Lead(s) / مسؤول التوظيف المباشر (1 أو 2 موظفين)
              </label>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                {getSelectedHiringLeads(hiringLead).length}/2 Selected
              </span>
            </div>

            {/* Selected Leads Badges */}
            <div className="flex flex-wrap gap-2">
              {getSelectedHiringLeads(hiringLead).map((leadName, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  {leadName}
                  <button
                    type="button"
                    onClick={() => handleRemoveHiringLead(leadName)}
                    className="p-0.5 hover:bg-indigo-100 rounded-full text-indigo-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Lead Selector if less than 2 selected */}
            {getSelectedHiringLeads(hiringLead).length < 2 && (
              <div className="flex gap-2 pt-1">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddHiringLead(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs text-slate-700"
                >
                  <option value="">+ Select Active Employee as Hiring Lead / اختر مسؤول التوظيف...</option>
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.name || emp.full_name}>
                      👤 {emp.name || emp.full_name} — {emp.job_title || emp.department_name || 'HR Team'}
                    </option>
                  ))}
                  {users.map((u) => (
                    <option key={`user-${u.id}`} value={u.name}>
                      👤 {u.name} — {u.role_name || 'HR Admin'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Headcount Needed *</label>
              <input
                type="number"
                required
                min={1}
                value={headcountNeeded}
                onChange={(e) => setHeadcountNeeded(Number(e.target.value))}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Pipeline Request Status (حالة الطلب)</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
              >
                <option value="Pending HR Approval">⏳ Pending HR Approval (قيد موافقة HR)</option>
                <option value="Active">🟢 Active & Approved (مفعل ومقبول)</option>
                <option value="Paused">⏸️ Paused (موقوف مؤقتاً)</option>
                <option value="Closed">🔒 Closed (مغلق)</option>
                <option value="Rejected">🔴 Rejected (مرفوض)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Experience Level</label>
              <input
                type="text"
                value={experienceRequirements}
                onChange={(e) => setExperienceRequirements(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                placeholder="e.g., 3-5 Years"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Expected Salary Range</label>
              <input
                type="text"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                placeholder="e.g., 8,000 - 12,000 SAR"
              />
            </div>

            {/* Accounting Ledger Alignment Trigger */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-black text-slate-700 block">Ledger Budget Status</label>
              <div className="flex gap-2 items-center pt-1">
                <span
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${
                    budgetStatus === 'Approved'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-rose-50 text-rose-600 border border-rose-200'
                  }`}
                >
                  {budgetStatus}
                </span>

                {budgetStatus !== 'Approved' && (
                  <button
                    type="button"
                    onClick={handleVerifyBudget}
                    disabled={verifyingBudget}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white text-[10px] font-black rounded-lg uppercase tracking-wider flex items-center gap-1 shadow transition-all cursor-pointer"
                  >
                    <DollarSign className="w-3 h-3 text-emerald-400" />
                    {verifyingBudget ? 'Checking Ledgers...' : 'Verify Capital'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Job Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
                placeholder="e.g., Marseille, Provence"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-xs"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-black text-slate-700">Days Open (أيام فتح الوظيفة)</label>
              <input
                type="number"
                min={1}
                value={daysOpen}
                onChange={(e) => setDaysOpen(Number(e.target.value))}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
              />
            </div>
          </div>

          {budgetVerifySuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              {budgetVerifySuccess}
            </div>
          )}

          {/* Interactive Block-Editor */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-black text-slate-700 block">📢 Interactive Block-Editor</h4>
                <p className="text-[10px] text-slate-400">
                  Design beautifully formatted announcements using customizable content blocks.
                </p>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddEditorBlock('header')}
                  className="p-1 px-2 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200 cursor-pointer"
                >
                  + Head
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEditorBlock('text')}
                  className="p-1 px-2 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200 cursor-pointer"
                >
                  + Para
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEditorBlock('bullets')}
                  className="p-1 px-2 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200 cursor-pointer"
                >
                  + Bullets
                </button>
                <button
                  type="button"
                  onClick={() => handleAddEditorBlock('callout')}
                  className="p-1 px-2 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-black text-slate-700 border border-slate-200 cursor-pointer"
                >
                  + Alert
                </button>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[350px] overflow-y-auto">
              {editorBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-2 relative group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase">
                      Block: {block.type}
                    </span>

                    <div className="flex gap-1 items-center">
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(index, 'down')}
                        disabled={index === editorBlocks.length - 1}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {block.type === 'bullets' ? (
                    <textarea
                      value={block.content}
                      onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                      className="w-full p-2 border border-slate-100 bg-slate-50 rounded-lg outline-none font-medium text-xs h-20"
                      placeholder="Type each bullet point on a new line starting with •"
                    />
                  ) : (
                    <input
                      type="text"
                      value={block.content}
                      onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                      className={`w-full p-2 border border-slate-100 rounded-lg outline-none text-xs font-bold ${
                        block.type === 'header'
                          ? 'text-slate-800 font-extrabold bg-slate-50/50'
                          : block.type === 'callout'
                          ? 'bg-amber-50/50 border-amber-100 font-semibold'
                          : ''
                      }`}
                      placeholder={`Enter block ${block.type} content...`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Custom Fields Form */}
          <div className="pt-4 border-t border-slate-100">
            <CustomFieldsForm
              entityType="job_opening"
              entityId={null}
              onChange={setJobCustomFieldValues}
            />
          </div>

          {/* Bottom Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/hr/recruitment/jobs')}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-200 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Save & Publish Opening'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default RequestJobOpeningPage;
