import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Briefcase,
  Users,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Share2,
  Edit2,
  CheckCircle,
  Sparkles,
  User,
  Building2,
  ShieldCheck,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { useHiringContext } from './HiringContext';
import { EditorBlock, getJobSlug, parseJobIdFromSlug } from './types';
import { CustomFieldsDisplay } from '../../../components/HR/CustomFieldsManager';

export const ViewJobPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    jobs,
    candidates,
    showBudget,
    canEditJobPostingPerm,
    canShareJobPostingPerm,
    showCustomToast
  } = useHiringContext();

  const [copied, setCopied] = useState(false);

  const jobId = parseJobIdFromSlug(id);
  const activeJob = jobs.find((j) => j.id === jobId) || null;

  if (!activeJob) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto text-left">
        <button
          type="button"
          onClick={() => navigate('/hr/recruitment/jobs')}
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Job Openings
        </button>
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700">Job Opening Not Found</h3>
          <p className="text-slate-400 text-xs mt-1">
            The requested job posting #{jobId || id} does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const jobSlug = getJobSlug(activeJob);
  const jobCandidates = candidates.filter((c) => c.job_opening_id === activeJob.id);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      showCustomToast('Job posting URL copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } else {
      showCustomToast('URL: ' + url, 'info');
    }
  };

  let blocks: EditorBlock[] = [];
  try {
    if (activeJob.description_blocks) {
      blocks = JSON.parse(activeJob.description_blocks);
    }
  } catch (e) {
    console.error("Failed to parse description blocks:", e);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6 max-w-5xl mx-auto text-left"
    >
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button
            type="button"
            onClick={() => navigate('/hr/recruitment/jobs')}
            className="hover:text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Job Openings
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate(`/hr/recruitment/jobs/${jobSlug}`)}
            className="hover:text-emerald-700 transition-colors cursor-pointer"
          >
            Pipeline
          </button>
          <span>/</span>
          <span className="text-slate-800 font-bold truncate max-w-[200px]">
            {activeJob.title}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 shadow-xs cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share Post</span>
              </>
            )}
          </button>

          {canEditJobPostingPerm && (
            <button
              type="button"
              onClick={() => navigate(`/hr/recruitment/jobs/${jobSlug}/edit`)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Edit Posting</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate(`/hr/recruitment/candidates/register?job_opening_id=${activeJob.id}`)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-200 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Apply Candidate</span>
          </button>
        </div>
      </div>

      {/* Main Job Hero Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-linear-to-r from-emerald-50/40 via-white to-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-emerald-100/70 text-emerald-800 text-[10px] font-extrabold rounded-lg uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-600" />
                  {activeJob.department_name || 'General Org'}
                </span>

                <span
                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider ${
                    activeJob.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : activeJob.status === 'Paused'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {activeJob.status}
                </span>

                <span className="px-2 py-0.5 text-[10px] font-bold rounded border bg-blue-50 text-blue-700 border-blue-200">
                  {activeJob.employment_type || 'Full-Time'}
                </span>

                <span className="px-2 py-0.5 text-[10px] font-bold rounded border bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-slate-500" />
                  {activeJob.location || 'Marseille, Provence'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-serif tracking-tight">
                {activeJob.title}
              </h1>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 flex-wrap">
                <span className="flex items-center gap-1 text-slate-700 font-bold">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  {showBudget ? activeJob.salary_range || 'Not Disclosed' : 'Salary Confidential (🔐)'}
                </span>
                <span>•</span>
                <span>Job Requisition #{activeJob.id}</span>
                <span>•</span>
                <span>Posted {activeJob.days_open || 7} days ago</span>
              </div>
            </div>

            {/* Quick action button for candidate registration */}
            <div className="shrink-0 flex md:flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate(`/hr/recruitment/jobs/${jobSlug}`)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Applicants ({jobCandidates.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 border-b border-slate-100 bg-slate-50/50">
          <div className="p-4 sm:p-5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Headcount Needed
            </span>
            <span className="text-lg font-black text-slate-800 block mt-0.5">
              {activeJob.headcount_needed} {activeJob.headcount_needed === 1 ? 'Position' : 'Positions'}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Experience Level
            </span>
            <span className="text-lg font-black text-slate-800 block mt-0.5 truncate">
              {activeJob.experience_requirements || 'Any Experience'}
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Total Applicants
            </span>
            <span className="text-lg font-black text-emerald-700 block mt-0.5">
              {jobCandidates.length} Active
            </span>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
              Hiring Lead
            </span>
            <span className="text-lg font-black text-slate-800 block mt-0.5 truncate">
              {activeJob.hiring_lead || 'HR Team'}
            </span>
          </div>
        </div>

        {/* Content Layout: 2 Columns */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Description Blocks (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Position Details & Specification
            </h3>

            {blocks.length === 0 ? (
              <div className="space-y-4 text-xs font-medium text-slate-600 leading-relaxed">
                <h4 className="font-bold text-slate-800 text-sm">Role Summary</h4>
                <p>
                  We are looking for a talented and driven professional to join our organization as{' '}
                  <strong className="text-slate-900">{activeJob.title}</strong> within the{' '}
                  <strong className="text-slate-900">{activeJob.department_name || 'General Org'}</strong> department.
                </p>

                <h4 className="font-bold text-slate-800 text-sm pt-2">Key Responsibilities</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Execute key initiatives aligned with organizational objectives.</li>
                  <li>Collaborate effectively across departmental stakeholders.</li>
                  <li>Maintain high standards of performance and operational excellence.</li>
                </ul>

                <h4 className="font-bold text-slate-800 text-sm pt-2">Requirements & Qualifications</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Experience level: {activeJob.experience_requirements || 'Relevant background in the field'}.</li>
                  <li>Strong problem-solving and communication skills.</li>
                  <li>Ability to work autonomously in a fast-paced environment.</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-6">
                {blocks.map((block) => {
                  if (block.type === 'header') {
                    return (
                      <h4
                        key={block.id}
                        className="text-base font-black text-slate-900 border-b border-slate-100 pb-2 pt-3 first:pt-0"
                      >
                        {block.content}
                      </h4>
                    );
                  }
                  if (block.type === 'callout') {
                    return (
                      <div
                        key={block.id}
                        className="p-4 bg-emerald-50/70 border-l-4 border-emerald-600 rounded-r-2xl text-xs font-semibold text-emerald-950 leading-relaxed"
                      >
                        {block.content}
                      </div>
                    );
                  }
                  if (block.type === 'bullets') {
                    return (
                      <ul
                        key={block.id}
                        className="space-y-2 text-xs text-slate-600 leading-relaxed pl-1 font-medium"
                      >
                        {(block.content || '').split('\n').map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-emerald-600 font-bold mt-0.5">•</span>
                            <span>{bullet.replace(/^•\s*/, '')}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p
                      key={block.id}
                      className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap"
                    >
                      {block.content}
                    </p>
                  );
                })}
              </div>
            )}

            {/* Custom Fields section */}
            <div className="pt-6 border-t border-slate-100">
              <CustomFieldsDisplay entityType="job_opening" entityId={activeJob.id} />
            </div>
          </div>

          {/* Right Sidebar Metadata */}
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200/60 pb-2">
                Hiring Requisition Overview
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Department
                  </span>
                  <span className="text-slate-800 font-bold block mt-0.5">
                    {activeJob.department_name || 'General Org'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Location
                  </span>
                  <span className="text-slate-800 font-bold block mt-0.5">
                    {activeJob.location || 'Marseille, Provence'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Employment Type
                  </span>
                  <span className="text-slate-800 font-bold block mt-0.5">
                    {activeJob.employment_type || 'Full-Time'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Compensation
                  </span>
                  <span className="text-slate-800 font-bold block mt-0.5">
                    {showBudget ? activeJob.salary_range || 'Not Disclosed' : 'Confidential (🔐)'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Budget Approval
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded mt-0.5 ${
                      activeJob.budget_status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    {activeJob.budget_status || 'Pending Approval'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Recruiter Actions
              </h4>
              <button
                type="button"
                onClick={() => navigate(`/hr/recruitment/candidates/register?job_opening_id=${activeJob.id}`)}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Candidate</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/hr/recruitment/jobs/${jobSlug}`)}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span>Open Candidate Kanban</span>
              </button>

              {canEditJobPostingPerm && (
                <button
                  type="button"
                  onClick={() => navigate(`/hr/recruitment/jobs/${jobSlug}/edit`)}
                  className="w-full py-2 px-3 text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Parameters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ViewJobPostPage;
