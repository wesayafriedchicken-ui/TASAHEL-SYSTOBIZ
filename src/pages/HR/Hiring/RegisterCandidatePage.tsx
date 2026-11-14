import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, UserPlus, Star, Link as LinkIcon, Briefcase, Mail, Phone, MapPin, Linkedin, FileText, CheckCircle } from 'lucide-react';
import { useHiringContext } from './HiringContext';
import { Candidate } from './types';
import { CustomFieldsForm } from '../../../components/HR/CustomFieldsManager';

export const RegisterCandidatePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    jobs,
    activeStages,
    getStageInfo,
    handleSaveCandidate,
    loading,
    isCandidateFieldVisible,
    isCandidateFieldEditable,
    canRegisterApplicantPerm
  } = useHiringContext();

  const [formData, setFormData] = useState<Candidate>({
    id: 0,
    job_opening_id: jobs.length > 0 ? jobs[0].id : 0,
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    cv_url: '',
    stage: 'Applied',
    score: 5,
    notes: ''
  });

  const [customFieldValues, setCustomFieldValues] = useState<Record<number, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.job_opening_id) {
      alert("Please fill in all required fields (Name, Email, Job Opening).");
      return;
    }

    const success = await handleSaveCandidate(e, formData, customFieldValues);
    if (success) {
      navigate('/hr/recruitment/candidates');
    }
  };

  if (!canRegisterApplicantPerm) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs my-6">
        <UserPlus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-black text-slate-800 mb-2">Access Restricted / غير مسموح بالعرض</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          You do not have permission to register new candidates. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-4xl mx-auto space-y-6 text-left"
    >
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/hr/recruitment/candidates')}
          className="flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-2xl border border-slate-200/80 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Pipeline
        </button>

        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Candidate Intake Form
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-b border-slate-100 p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Register Candidate</h3>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                Log applicant credentials, portfolio links, and initial evaluation remarks.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* Main Credentials */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                disabled={!isCandidateFieldEditable('name')}
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                placeholder="e.g., Sarah Jenkins"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                disabled={!isCandidateFieldEditable('email')}
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                placeholder="e.g., sarah@example.com"
              />
            </div>
          </div>

          {/* Job & Stage Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Associated Job Opening *</label>
              <select
                value={formData.job_opening_id || ''}
                onChange={e => setFormData({ ...formData, job_opening_id: Number(e.target.value) })}
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                required
              >
                <option value="">-- Select Job Opening --</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.department_name || 'General'})</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Initial Pipeline Stage</label>
              <select
                value={formData.stage || 'Applied'}
                onChange={e => setFormData({ ...formData, stage: e.target.value as any })}
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
              >
                {activeStages.map(stg => {
                  const stgInfo = getStageInfo(stg);
                  return (
                    <option key={stg} value={stg}>{stgInfo.name_en} {stgInfo.name_ar !== stgInfo.name_en ? `/ ${stgInfo.name_ar}` : ''}</option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Phone & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Phone Number</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isCandidateFieldEditable('phone')}
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                placeholder="e.g., +1 (555) 234-5678"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">Current Location / City</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                disabled={!isCandidateFieldEditable('location')}
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                placeholder="e.g., New York, NY / Cairo, EG"
              />
            </div>
          </div>

          {/* Links: LinkedIn & CV */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">LinkedIn Profile URL</label>
              <input
                type="url"
                value={formData.linkedin_url || ''}
                onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                disabled={!isCandidateFieldEditable('linkedin_url')}
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                placeholder="https://linkedin.com/in/username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">CV / Portfolio Link</label>
              <input
                type="url"
                value={formData.cv_url || ''}
                onChange={e => setFormData({ ...formData, cv_url: e.target.value })}
                disabled={!isCandidateFieldEditable('cv_url')}
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                placeholder="https://drive.google.com/... or https://portfolio.com"
              />
            </div>
          </div>

          {/* Initial Rating */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700">Initial Score Rating (1-5)</label>
            <div className="flex items-center gap-2">
              <select
                value={formData.score || 5}
                onChange={e => setFormData({ ...formData, score: Number(e.target.value) })}
                className="w-48 p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
              >
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Stars</option>)}
              </select>
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < (formData.score || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700">Assessor Notes / Screening Highlights</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs h-28"
              placeholder="Provide background highlights, referral details, or initial screening comments..."
            />
          </div>

          {/* Custom No-Code Attributes */}
          <div className="pt-4 border-t border-slate-100">
            <CustomFieldsForm 
              entityType="candidate" 
              entityId={null} 
              onChange={setCustomFieldValues} 
            />
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/hr/recruitment/candidates')}
              className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-black bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Processing...' : 'Register Applicant'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
