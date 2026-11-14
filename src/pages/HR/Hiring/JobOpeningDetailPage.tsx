import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  User,
  Sliders,
  Users,
  ExternalLink,
  Settings,
  Mail,
  Plus,
  Star
} from 'lucide-react';
import { useHiringContext } from './HiringContext';
import { JobOpening, Candidate, EditorBlock, getJobSlug, parseJobIdFromSlug } from './types';

export const JobOpeningDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    jobs,
    candidates,
    fetchCandidates,
    showBudget,
    setShowCandidateModal,
    setShowJobModal,
    setSelectedAnnounceJob
  } = useHiringContext();

  const [activeJobTab, setActiveJobTab] = useState<'candidates' | 'description'>('candidates');
  const [candidateStageFilter, setCandidateStageFilter] = useState('New');

  const currentJobId = parseJobIdFromSlug(id);
  const activeJob = jobs.find((j) => j.id === currentJobId) || null;

  // If jobs are loaded and activeJob is not found
  if (!activeJob) {
    return (
      <div className="space-y-6 text-left">
        <button
          type="button"
          onClick={() => navigate('/hr/recruitment/jobs')}
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Job Openings
        </button>
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center">
          <h3 className="font-bold text-slate-700">Job Opening Not Found</h3>
          <p className="text-slate-400 text-xs mt-1">The requested job opening does not exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const jobCandidates = candidates.filter((c) => c.job_opening_id === activeJob.id);

  const stageTabs = [
    { label: 'New', count: jobCandidates.filter((c) => c.stage === 'Applied').length, stages: ['Applied'] },
    { label: 'Reviewed', count: jobCandidates.filter((c) => c.stage === 'Screened').length, stages: ['Screened'] },
    {
      label: 'Schedule Interview',
      count: jobCandidates.filter((c) => ['Interviewing', 'Technical Assessment'].includes(c.stage)).length,
      stages: ['Interviewing', 'Technical Assessment']
    },
    {
      label: 'Hired',
      count: jobCandidates.filter((c) => ['Hired', 'Job Offer Sent'].includes(c.stage)).length,
      stages: ['Hired', 'Job Offer Sent']
    },
    { label: 'Rejected', count: jobCandidates.filter((c) => c.stage === 'Rejected').length, stages: ['Rejected'] }
  ];

  const activeStageObj = stageTabs.find((t) => t.label === candidateStageFilter) || stageTabs[0];
  const filteredJobCandidates = jobCandidates.filter((cand) => activeStageObj.stages.includes(cand.stage));

  // Next job object for quick sequential navigation
  const currentIdx = jobs.findIndex((j) => j.id === activeJob.id);
  const nextJobObj = currentIdx !== -1 && currentIdx < jobs.length - 1 ? jobs[currentIdx + 1] : jobs.length > 0 ? jobs[0] : null;

  return (
    <motion.div
      key={`job-detail-${activeJob.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      {/* Breadcrumb & Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => navigate('/hr/recruitment/jobs')}
          className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Job Openings
        </button>

        {/* Next job navigation */}
        {nextJobObj && nextJobObj.id !== activeJob.id && (
          <button
            type="button"
            onClick={() => {
              navigate(`/hr/recruitment/jobs/${getJobSlug(nextJobObj)}`);
              setCandidateStageFilter('New');
            }}
            className="text-right group cursor-pointer"
          >
            <span className="text-[10px] text-slate-400 group-hover:text-slate-600 block">
              Next: {nextJobObj.title} &gt;
            </span>
            <span className="text-[9px] text-slate-300 font-medium block">
              {nextJobObj.location || 'Marseille, Provence'}
            </span>
          </button>
        )}
      </div>

      {/* Header widget cards */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-emerald-800 font-serif leading-tight mb-1">
            {activeJob.title}
          </h1>
          <p className="text-slate-500 text-xs font-semibold">
            {activeJob.department_name || 'Marketing'} - {activeJob.location || 'Marseille, Provence'}
          </p>
        </div>

        {/* Right Widgets: Hiring Lead, Status, Open Days */}
        <div className="flex items-center gap-6 bg-white border border-slate-200 rounded-2xl p-3 px-4 shrink-0 shadow-xs">
          {/* Hiring Lead */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 text-slate-600 font-bold rounded-xl flex items-center justify-center border border-slate-200">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Hiring Lead</span>
              <span className="text-xs font-extrabold text-slate-700 block">
                {activeJob.hiring_lead || 'Debra Tuescher'}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          {/* Status */}
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Status</span>
            <span className="text-xs font-black text-emerald-700 block bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 mt-0.5">
              {activeJob.status === 'Active' ? 'Open' : activeJob.status}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          {/* Open Duration */}
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Open</span>
            <span className="text-xs font-black text-slate-700 block mt-0.5">
              {activeJob.days_open || 7} Days
            </span>
          </div>
        </div>
      </div>

      {/* Pipeline Quick Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs hover:shadow-md transition-shadow text-left">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
            Total Candidates
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900">{jobCandidates.length}</span>
            <span className="text-[10px] font-bold text-slate-400">active profiles</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs hover:shadow-md transition-shadow text-left">
          <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider block">
            Screening Stage
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-indigo-600">
              {jobCandidates.filter((c) => ['Applied', 'Screened'].includes(c.stage)).length}
            </span>
            <span className="text-[10px] font-bold text-slate-400">new & screened</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs hover:shadow-md transition-shadow text-left">
          <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider block">
            Interviewing
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-600">
              {jobCandidates.filter((c) => ['Interviewing', 'Technical Assessment'].includes(c.stage)).length}
            </span>
            <span className="text-[10px] font-bold text-slate-400">meetings & tech</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs hover:shadow-md transition-shadow text-left">
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider block">
            Hired & Offers
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-emerald-600">
              {jobCandidates.filter((c) => ['Job Offer Sent', 'Hired'].includes(c.stage)).length}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              success{' '}
              {jobCandidates.length > 0
                ? Math.round(
                    (jobCandidates.filter((c) => c.stage === 'Hired').length / jobCandidates.length) * 100
                  )
                : 0}
              %
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Button bar */}
      <div className="flex justify-between items-center border-b border-slate-200 mb-6">
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveJobTab('candidates')}
            className={`pb-3 text-sm font-black transition-all border-b-2 cursor-pointer ${
              activeJobTab === 'candidates'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Candidates
          </button>
          <button
            type="button"
            onClick={() => setActiveJobTab('description')}
            className={`pb-3 text-sm font-black transition-all border-b-2 cursor-pointer ${
              activeJobTab === 'description'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Job Description
          </button>
        </div>

        {/* Extra action buttons */}
        <div className="flex items-center gap-1.5 pb-2">
          <button
            type="button"
            onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(activeJob)}/view`)}
            className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Open Job Post Announcement"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(activeJob)}/edit`)}
            className="p-1.5 text-slate-400 hover:text-emerald-700 bg-white border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer"
            title="Job Settings / Edit"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {activeJobTab === 'candidates' ? (
        /* CANDIDATES TAB VIEW */
        <div className="space-y-6">
          {/* Flow navigation for stages */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-6 items-center flex-wrap mb-6 text-xs font-bold text-slate-600 shadow-xs">
            {stageTabs.map((tab, idx) => {
              const isActive = candidateStageFilter === tab.label;
              return (
                <React.Fragment key={tab.label}>
                  <button
                    type="button"
                    onClick={() => setCandidateStageFilter(tab.label)}
                    className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span className={`${isActive ? 'underline decoration-2 underline-offset-4 decoration-emerald-600' : ''}`}>
                      {tab.label}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                        isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      ({tab.count})
                    </span>
                  </button>
                  {idx < stageTabs.length - 1 && (
                    <span className="text-slate-300 font-normal font-mono">&gt;</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Header and buttons */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-emerald-800 font-serif">
              {candidateStageFilter} Candidates
            </h2>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/hr/recruitment/candidates/register?job_opening_id=${activeJob.id}`
                  )
                }
                className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-600" /> New Candidate
              </button>
            </div>
          </div>

          {/* Candidates List Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="py-3 px-4">Candidate Info</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Rating</th>
                    <th className="py-3 px-4">Applied</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {filteredJobCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-normal">
                        No candidates found in this stage.
                      </td>
                    </tr>
                  ) : (
                    filteredJobCandidates.map((cand) => {
                      const addedDate = new Date(cand.created_at || Date.now());
                      const appliedText = addedDate.toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });

                      return (
                        <tr key={cand.id} className="hover:bg-slate-50/30 transition-all">
                          <td className="py-4 px-4">
                            <input
                              type="checkbox"
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </td>

                          <td className="py-4 px-4 space-y-1">
                            <span
                              onClick={() => navigate(`/hr/recruitment/candidates/${cand.id}`)}
                              className="text-blue-600 hover:underline hover:text-blue-800 font-extrabold text-sm block cursor-pointer"
                            >
                              {cand.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium block">
                              {cand.location || 'Marseille, Provence'}
                            </span>
                            {cand.phone && (
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {cand.phone}
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 space-y-0.5">
                            <span className="text-slate-800 font-extrabold block">
                              {cand.stage === 'Applied' ? 'New' : cand.stage}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium block">
                              Updated recently
                            </span>
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((starNum) => {
                                const isFilled = starNum <= (cand.score || 0);
                                return (
                                  <button
                                    key={starNum}
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(
                                          `/api/hr/recruitment/candidates/${cand.id}`,
                                          {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ score: starNum })
                                          }
                                        );
                                        if (res.ok) fetchCandidates();
                                      } catch (e) {
                                        console.error('Failed to update score:', e);
                                      }
                                    }}
                                    className="p-0.5 focus:outline-none cursor-pointer"
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
                                        isFilled
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-300'
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          <td className="py-4 px-4 space-y-0.5">
                            <span className="text-slate-800 font-extrabold block">{appliedText}</span>
                            <span
                              onClick={() => navigate(`/hr/recruitment/candidates/${cand.id}`)}
                              className="text-[9px] text-blue-600 font-extrabold block cursor-pointer hover:underline"
                            >
                              View profile dossier &gt;
                            </span>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => navigate(`/hr/recruitment/candidates/${cand.id}`)}
                              className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Dossier
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* JOB DESCRIPTION TAB VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-emerald-800 font-serif">Job Description</h2>
              <button
                type="button"
                onClick={() => navigate(`/hr/recruitment/jobs/${getJobSlug(activeJob)}/edit`)}
                className="border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl px-4 py-1 font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="prose prose-slate max-w-none text-xs text-slate-600 space-y-6 font-medium leading-relaxed">
              {(() => {
                let blocks: EditorBlock[] = [];
                try {
                  blocks = activeJob.description_blocks
                    ? JSON.parse(activeJob.description_blocks)
                    : [];
                } catch (e) {}

                if (blocks.length === 0) {
                  return (
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-800 text-sm">Role Summary</h4>
                      <p>
                        We are looking for a qualified candidate to join our team as a {activeJob.title} in the {activeJob.department_name || 'General Org'} department.
                      </p>
                    </div>
                  );
                }

                return blocks.map((b) => {
                  if (b.type === 'header') {
                    return (
                      <h4
                        key={b.id}
                        className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-1 pt-2"
                      >
                        {b.content}
                      </h4>
                    );
                  }
                  if (b.type === 'callout') {
                    return (
                      <div
                        key={b.id}
                        className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-xl text-amber-900 font-semibold"
                      >
                        {b.content}
                      </div>
                    );
                  }
                  if (b.type === 'bullets') {
                    return (
                      <ul key={b.id} className="list-disc pl-5 space-y-1">
                        {b.content.split('\n').map((line, idx) => (
                          <li key={idx}>{line.replace(/^[•\-\*]\s*/, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={b.id} className="whitespace-pre-line">
                      {b.content}
                    </p>
                  );
                });
              })()}
            </div>
          </div>

          {/* Right Sidebar Metadata */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs h-fit">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Department
              </span>
              <span className="text-xs font-extrabold text-[#15803d] block">
                {activeJob.department_name || 'Marketing'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Employment Type
              </span>
              <span className="text-xs font-extrabold text-slate-800 block">
                {activeJob.employment_type || 'Full-Time'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Minimum Experience
              </span>
              <span className="text-xs font-extrabold text-slate-800 block">
                {activeJob.experience_requirements || 'Manager/Supervisor'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Compensation
              </span>
              <span className="text-xs font-extrabold text-slate-800 block">
                {showBudget ? activeJob.salary_range || '€100,000' : 'Confidential (🔐)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default JobOpeningDetailPage;
